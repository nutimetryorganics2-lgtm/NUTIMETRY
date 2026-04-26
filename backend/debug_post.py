import requests

url = "http://localhost:8000/api/products/"
payload = {
    "name": "Test Product",
    "description": "Test Description",
    "price": 100.0,
    "stock": 10,
    "image_url": "https://example.com/image.jpg"
}

response = requests.post(url, json=payload)
print(f"Status Code: {response.status_code}")
print(f"Response: {response.json()}")
