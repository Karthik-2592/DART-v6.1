import requests
import sqlite3
import os
import re
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

def clean_filename(name: str, replacement: str = "_") -> str:
    """
    Clean a string so it can safely be used as a filename.
    
    Parameters:
        name (str): The original filename string.
        replacement (str): Character to replace invalid ones with (default "_").
    
    Returns:
        str: A safe filename string.
    """
    # Define invalid characters for most OS (Windows especially strict)
    invalid_chars = r'[<>:"/\\|?*]'
    
    # Replace invalid characters with the replacement
    cleaned = re.sub(invalid_chars, replacement, name)
    
    # Strip leading/trailing whitespace and dots
    cleaned = cleaned.strip().strip(".")
    
    # Optionally, enforce a max length (common limit is 255 chars)
    max_length = 255
    if len(cleaned) > max_length:
        cleaned = cleaned[:max_length]
    
    return cleaned

def download_image(img_url: str, filename: str) -> bool:
    try:
        response = requests.get(img_url, timeout=10)
        if response.status_code == 200:
            with open(filename, "wb") as f:
                f.write(response.content)
            print(f"✅ Image saved as {filename}")
            return True
        else:
            print(f"⚠️ Failed to download image. Status code: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error downloading image: {e}")
        return False


script_dir = os.path.dirname(os.path.abspath(__file__))
conn = sqlite3.connect(os.path.join(script_dir, "songs.db"))
cursor = conn.cursor()

cursor.execute("SELECT * FROM songs")
rows = cursor.fetchall()
cursor.execute('''SELECT t1.title AS k,
       GROUP_CONCAT(t3.username) AS x_list
FROM songs t1
JOIN song_contributors t2 ON t1.id = t2.song_id
JOIN users t3 ON t2.user_id = t3.id
GROUP BY t1.id;''')
rows = cursor.fetchall()

driver = webdriver.Edge()

for query in rows:
    string = f"{query[0]} "
    for artist in query[1].split(','):
        string += f"{artist},"
    # Construct search URL
    url = f"https://open.spotify.com/search/{string.replace(' ', '%20')}"
    driver.get(url)

    # Wait until track cards appear
    try:
        WebDriverWait(driver, 7).until(
            EC.presence_of_all_elements_located((By.CSS_SELECTOR, 'div[data-testid="tracklist-row"]'))
        )
    except:
        print(f"No track cards found for query: {query}")
        continue

    # Scroll to load more results (optional)
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
    time.sleep(3)  # give time for lazy loading
    # Collect images inside track cards
    images = driver.find_elements(By.CSS_SELECTOR, 'img[data-testid="card-image"]')
    print(f"\nResults for query: {query}")
    for img in images:
        if img.get_attribute("width") == "40":
            continue
        src = img.get_attribute("src")
        if src and "i.scdn.co" in src:  # filter to Spotify CDN images
            filename = clean_filename(f"{query[0]}-{query[1]}.jpg")
            storageLocation = os.path.join(script_dir, "Storage/cover/", filename)
            download_image(src, storageLocation)
            break
    # Throttle requests (1 per second as you planned)
    time.sleep(2)

driver.quit()


    

