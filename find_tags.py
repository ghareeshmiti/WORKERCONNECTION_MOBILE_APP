
with open("src/screens/DashboardScreen.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

count = 0
for i, line in enumerate(lines):
    if "</TouchableOpacity>" in line:
        count += 1
        print(f"Line {i+1}: {line.strip()}")

print(f"Total found: {count}")
