import sqlite3
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(script_dir, "songs.db")

def list_tables(cursor):
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    return [row[0] for row in cursor.fetchall() if row[0] != 'sqlite_sequence']

def display_table(cursor, table_name):
    cursor.execute(f"SELECT * FROM {table_name}")
    rows = cursor.fetchall()
    if not rows:
        print(f"\nTable '{table_name}' is empty.")
        return
    
    # Get column names
    column_names = [description[0] for description in cursor.description]
    print(f"\nContents of table '{table_name}':")
    print("-" * 50)
    print(" | ".join(column_names))
    print("-" * 50)
    for row in rows:
        print(" | ".join(map(str, row)))
    print("-" * 50)

def main():
    if not os.path.exists(db_path):
        print(f"Error: {db_path} not found.")
        return

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        while True:
            tables = list_tables(cursor)
            print("\n" + "="*20)
            print("SQLite Database Viewer")
            print("="*20)
            for i, table in enumerate(tables, 1):
                print(f"{i}. View {table}")
            print(f"{len(tables) + 1}. Exit")
            
            choice = input("\nEnter choice: ")
            
            try:
                choice_idx = int(choice)
                if 1 <= choice_idx <= len(tables):
                    display_table(cursor, tables[choice_idx - 1])
                elif choice_idx == len(tables) + 1:
                    print("Exiting...")
                    break
                else:
                    print("Invalid choice. Try again.")
            except ValueError:
                print("Please enter a number.")
                
    except sqlite3.Error as e:
        print(f"Database error: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    main()
