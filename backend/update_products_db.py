import sqlite3

def update_products():
    conn = sqlite3.connect('nutrimerty.db')
    cursor = conn.cursor()
    
    # Clean up test data and set premium values
    cursor.execute("DELETE FROM products WHERE name = 'string'")
    
    cursor.execute("""
        UPDATE products 
        SET name = 'Spirulina Max (Grower)', 
            description = 'Benefit1Desc', 
            price = 1250, 
            stock = 50, 
            image_url = '/premium_spirulina_product_1777137929430.png',
            is_active = 1
        WHERE id = 1
    """)
    
    # Insert second product if it doesn't exist
    cursor.execute("SELECT id FROM products WHERE name = 'Spirulina Prime (Breeder)'")
    if not cursor.fetchone():
        cursor.execute("""
            INSERT INTO products (name, description, price, stock, image_url, is_active)
            VALUES ('Spirulina Prime (Breeder)', 'Benefit2Desc', 2100, 30, '/spirulina_poultry_usage_1777137908645.png', 1)
        """)
    
    conn.commit()
    conn.close()
    print("Database updated with premium product content.")

if __name__ == "__main__":
    update_products()
