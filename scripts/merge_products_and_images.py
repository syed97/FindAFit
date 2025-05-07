# merge the images urls json with the products subset json

import json
from pathlib import Path

# Setup paths
root_dir = Path(__file__).resolve().parent.parent
products_path = root_dir / 'public' / 'data' / 'products.json'
images_path = root_dir / 'public' / 'data' / 'images.json'
output_path = root_dir / 'public' / 'data' / 'products_with_images.json'

# Load data
with open(products_path, 'r', encoding='utf-8') as f:
    products = json.load(f)

with open(images_path, 'r', encoding='utf-8') as f:
    images = json.load(f)

# Merge image URL into products
for product_id, product_data in products.items():
    image_info = images.get(product_id)
    if image_info:
        product_data['image_url'] = image_info.get('link')

# Save updated products
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(products, f, indent=2)

print(f"Merged product data with image URLs saved to {output_path}")
