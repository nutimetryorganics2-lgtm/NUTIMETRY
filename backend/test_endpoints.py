import requests
try:
    r = requests.get("http://localhost:8005/health")
    print(f"Health: {r.status_code} {r.json()}")
    r = requests.get("http://localhost:8005/")
    print(f"Root: {r.status_code} {r.json()}")
except Exception as e:
    print(f"Error: {e}")
