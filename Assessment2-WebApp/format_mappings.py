import re
import os

mapping_path = 'a:/Code/Repos/web_project/Assessment2-WebApp/Mapping.txt'

if not os.path.exists(mapping_path):
    print(f"Error: {mapping_path} not found.")
else:
    with open(mapping_path, 'r') as f:
        lines = f.readlines()

    # Skip first line if it's the 0-20Hz base mapping
    # Usually ranges 2 to 97 are the 96 bars
    ranges = []
    for line in lines[1:97]:
        match = re.search(r'-> (\d+) - (\d+)', line)
        if match:
            ranges.append(f"[{match.group(1)}, {match.group(2)}]")

    # Format into groups of 10 for better readability in TSX
    output = "const BIN_RANGES: [number, number][] = [\n  "
    for i, r in enumerate(ranges):
        output += r + ", "
        if (i + 1) % 10 == 0:
            output += "\n  "
    
    output = output.strip().rstrip(",") + "\n];"
    print(output)
