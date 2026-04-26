import sqlite3
import json

def check_products():
    conn = sqlite3.connect('nutrimerty.db')
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM products")
    products = cursor.fetchall()
    print(json.dumps(products, indent=2))
    conn.close()

if __name__ == "__main__":
    check_products()
