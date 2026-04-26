import requests

base_url = "http://localhost:8008/api"

def test_register():
    url = f"{base_url}/auth/register"
    data = {
        "name": "Test Farmer",
        "phone": "9876543210",
        "password": "password123",
        "village": "Village",
        "district": "District",
        "state": "State",
        "address": "Address",
        "pincode": "123456"
    }
    try:
        response = requests.post(url, json=data)
        print(f"POST {url} -> {response.status_code}")
        print(response.json())
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_register()
