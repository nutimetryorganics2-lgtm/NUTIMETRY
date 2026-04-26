import requests
import time

def measure(name, url):
    try:
        start = time.time()
        res = requests.get(url, timeout=10)
        end = time.time()
        print(f"{name:<20} | {end-start:.4f}s | Status: {res.status_code}")
    except Exception as e:
        print(f"{name:<20} | FAILED | {e}")

print(f"{'Endpoint':<20} | {'Latency':<8} | Status")
print("-" * 40)
measure("Health Check", "http://127.0.0.1:9000/api/health/")
measure("Product List", "http://127.0.0.1:9000/api/products/")
measure("Frontend Home", "http://127.0.0.1:5173/")
measure("OpenAPI Spec", "http://127.0.0.1:9000/openapi.json")
