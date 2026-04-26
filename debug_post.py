import httpx

payload = {
    "customer_name": "Test Farmer",
    "phone": "9999999999",
    "address": "Test Village, AP",
    "notes": "",
    "items": [{"product_id": "65e6381ab23f9b0012345678", "quantity": 1}],
    "idempotency_key": "12345-abcde"
}

resp = httpx.post("http://127.0.0.1:8001/api/orders/", json=payload)
print(resp.status_code)
print(resp.json())
