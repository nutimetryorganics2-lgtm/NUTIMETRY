import asyncio
import httpx
import time
import uuid

API_URL = "http://127.0.0.1:8005/api"

async def main():
    async with httpx.AsyncClient(timeout=30.0) as client:
        # 1. Fetch a valid product ID
        resp = await client.get(f"{API_URL}/products/")
        if resp.status_code != 200 or not resp.json():
            print("No products found or error:", resp.text)
            return
            
        products = resp.json()
        product = products[0]
        product_id = product["_id"]
        initial_stock = product["stock"]
        print(f"--- STARTING LOAD TEST ---")
        print(f"Product: {product['name']} | Initial Stock: {initial_stock}")
        
        # 2. Test Concurrency (20 users)
        print("Initiating 20 concurrent order requests...")
        tasks = []
        for i in range(20):
            payload = {
                "customer_name": f"LoadTest User {i}",
                "phone": "9999999999",
                "address": "Load Test Street",
                "items": [{"product_id": product_id, "quantity": 1}],
                "idempotency_key": str(uuid.uuid4())
            }
            tasks.append(client.post(f"{API_URL}/orders/", json=payload))
            
        results = await asyncio.gather(*tasks)
        
        successes = sum(1 for r in results if r.status_code == 200)
        failures = len(results) - successes
        print(f"Concurrency Results: {successes} Success, {failures} Failure")
        
        # 3. Test Idempotency (Same key, multiple clicks)
        print("Testing Idempotency (Double-Click Simulation)...")
        idemp_key = "idemp-test-" + str(uuid.uuid4())
        payload_idemp = {
            "customer_name": "Idemp User",
            "phone": "8888888888",
            "address": "Idemp Street",
            "items": [{"product_id": product_id, "quantity": 1}],
            "idempotency_key": idemp_key
        }
        
        idemp_tasks = [client.post(f"{API_URL}/orders/", json=payload_idemp) for _ in range(3)]
        idemp_results = await asyncio.gather(*idemp_tasks)
        
        idemp_status_codes = [r.status_code for r in idemp_results]
        print(f"Idempotency Results Status Codes: {idemp_status_codes}")
        
        # 4. Final Validation
        resp = await client.get(f"{API_URL}/products/")
        final_product = [p for p in resp.json() if p["_id"] == product_id][0]
        final_stock = final_product["stock"]
        
        print(f"--- FINAL AUDIT ---")
        print(f"Initial Stock: {initial_stock}")
        print(f"Final Stock: {final_stock}")
        print(f"Orders Success (Concurrency): {successes}")
        print(f"Orders Success (Idempotency): 1 (Expected)")
        
        expected_decrement = successes + 1
        actual_decrement = initial_stock - final_stock
        
        if final_stock < 0:
            print("CRITICAL FAILURE: Negative stock detected!")
        elif actual_decrement == expected_decrement:
            print("SUCCESS: Stock integrity maintained perfectly.")
        else:
            print(f"FAILURE: Stock mismatch! Expected decrement {expected_decrement}, but got {actual_decrement}")

if __name__ == "__main__":
    asyncio.run(main())
