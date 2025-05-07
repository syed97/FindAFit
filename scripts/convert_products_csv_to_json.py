# convert subset products csv to json

import csv
import json
from pathlib import Path


# Get the root directory (two levels up from this script)
script_dir = Path(__file__).resolve().parent
root_dir = script_dir.parent

csv_path = root_dir / 'public' / 'data' / 'products.csv'
json_path = root_dir / 'public' / 'data' / 'products.json'

products_map = {}

with open(csv_path, mode='r', encoding='utf-8') as csv_file:
    reader = csv.DictReader(csv_file)
    for row in reader:
        product_id = row['id']
        # Remove 'id' from the row since it's used as the key
        product_data = {key: value for key, value in row.items() if key != 'id'}
        products_map[product_id] = product_data

# Save to JSON
with open(json_path, mode='w', encoding='utf-8') as json_file:
    json.dump(products_map, json_file, indent=2)

print(f"JSON file saved to {json_path}")
