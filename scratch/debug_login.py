import requests
import json

url = "http://localhost:8010/api/auth/login"
payload = {
    "email": "admin@nutrimetry.in",
    "password": "AdminPassword2024!"
}

response = requests.post(url, json=payload)
print(f"Status Code: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")
