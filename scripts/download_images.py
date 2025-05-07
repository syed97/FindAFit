import json
import requests
from pathlib import Path
from time import time
from tqdm import tqdm  # Install with: pip install tqdm

# Set up paths
root_dir = Path(__file__).resolve().parent.parent
json_path = root_dir / 'public' / 'data' / 'products_with_images.json'
images_dir = root_dir / 'public' / 'images'
failed_log_path = root_dir / 'public' / 'data' / 'failed_downloads.txt'

# Ensure the images directory exists
images_dir.mkdir(parents=True, exist_ok=True)

# Load the product data
with open(json_path, 'r', encoding='utf-8') as f:
    products = json.load(f)

# Prep for logging
total = len(products)
success_count = 0
fail_count = 0
start_time = time()

print(f"Starting download of {total} product images...\n")

with open(failed_log_path, 'w', encoding='utf-8') as failed_log:
    for product_id, product_data in tqdm(products.items(), total=total, desc="Downloading"):
        image_url = product_data.get('image_url')
        if not image_url:
            continue

        image_path = images_dir / f'{product_id}.jpg'

        try:
            response = requests.get(image_url, timeout=10)
            response.raise_for_status()
            with open(image_path, 'wb') as img_file:
                img_file.write(response.content)
            success_count += 1
        except requests.RequestException as e:
            fail_count += 1
            failed_log.write(f"{product_id},{image_url}\n")

end_time = time()
elapsed = end_time - start_time

# Summary
print(f"\nFinished downloading.")
print(f"Success: {success_count}")
print(f"Failed: {fail_count}")
print(f"Time elapsed: {elapsed:.2f} seconds")
print(f"Failures logged to: {failed_log_path}")
