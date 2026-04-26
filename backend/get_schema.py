import sqlite3

def get_schema():
    conn = sqlite3.connect('nutrimerty.db')
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(products)")
    columns = cursor.fetchall()
    for col in columns:
        print(col)
    conn.close()

if __name__ == "__main__":
    get_schema()
