import requests
import json

base_url = "http://localhost:8010/api"

# 1. Login
login_payload = {
    "phone": "8877665544",
    "password": "Password123"
}
login_response = requests.post(f"{base_url}/auth/login", json=login_payload)
print(f"Login Status: {login_response.status_code}")
token = login_response.json().get("data", {}).get("token")

if not token:
    print("Failed to get token")
    exit()

# 2. Get Products to find a valid ID
products_response = requests.get(f"{base_url}/products")
products = products_response.json().get("data", [])
if not products:
    # Fallback to a fake ID if no products
    product_id = "6628fb606ce9891sm1607074"
else:
    product_id = products[0].get("_id") or products[0].get("id")

print(f"Using Product ID: {product_id}")

# 3. Place Order
order_payload = {
    "items": [
        {
            "product_id": product_id,
            "quantity": 1
        }
    ],
    "notes": "Testing 500 error reproduction",
    "idempotency_key": f"test-repro-v2-{json.dumps(login_payload)}-{product_id}"
}

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

order_response = requests.post(f"{base_url}/orders/", json=order_payload, headers=headers)
print(f"Order Status: {order_response.status_code}")
try:
    print(f"Order Response: {json.dumps(order_response.json(), indent=2)}")
except:
    print(f"Order Response (Text): {order_response.text}")
