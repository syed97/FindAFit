# convert raw images csv to json

import csv
import json
from pathlib import Path


# Get the root directory (two levels up from this script)
script_dir = Path(__file__).resolve().parent
root_dir = script_dir.parent

csv_path = root_dir / 'public' / 'data' / 'images.csv'
json_path = root_dir / 'public' / 'data' / 'images.json'

img_map = {}

with open(csv_path, mode='r', encoding='utf-8') as csv_file:
    reader = csv.DictReader(csv_file)
    for row in reader:
        img_id = row['filename'].strip(".jpg")
        # Remove 'id' from the row since it's used as the key
        img_link = {key: value for key, value in row.items() if key != 'filename'}
        img_map[img_id] = img_link

# Save to JSON
with open(json_path, mode='w', encoding='utf-8') as json_file:
    json.dump(img_map, json_file, indent=2)

print(f"JSON file saved to {json_path}")
