import sqlite3
import os

# Define the path to the database
script_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(script_dir, "songs.db")

def clear_database():
    if not os.path.exists(db_path):
        print(f"Error: Database file not found at {db_path}")
        return

    try:
        # Connect to the SQLite database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Disable foreign key checks to allow dropping tables in any order
        cursor.execute("PRAGMA foreign_keys = OFF;")

        # Fetch all table names from the database
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()

        print(f"Starting database reset for: {db_path}")
        
        for table in tables:
            table_name = table[0]
            # Skip the internal SQLite sequence table
            if table_name == 'sqlite_sequence':
                continue
            
            cursor.execute(f"DROP TABLE IF EXISTS \"{table_name}\";")
            print(f"Dropped table: {table_name}")

        # Commit changes and re-enable foreign keys (though the DB is now empty)
        conn.commit()
        cursor.execute("PRAGMA foreign_keys = ON;")
        
        # Optional: Vacuum to reclaim space
        cursor.execute("VACUUM;")
        
        conn.close()
        print("\nDatabase cleared successfully. All tables have been dropped.")

    except sqlite3.Error as e:
        print(f"An error occurred while accessing the database: {e}")

if __name__ == "__main__":
    clear_database()
