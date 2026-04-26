from app.core.security import get_password_hash, verify_password

def test():
    password = "password123"
    h = get_password_hash(password)
    print(f"Hash: {h}")
    v = verify_password(password, h)
    print(f"Verify: {v}")

if __name__ == "__main__":
    test()
