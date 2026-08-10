
import os

file_path = "src/screens/DashboardScreen.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# The target string to replace
target = "{profile?.photo_url ? ("
# The replacement string
replacement = "{profile?.photo_url && typeof profile.photo_url === 'string' && profile.photo_url.trim() !== '' ? ("

# Count occurrences
count = content.count(target)
print(f"Found {count} occurrences of target string.")

if count > 0:
    new_content = content.replace(target, replacement)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Replaced all occurrences.")
else:
    print("Target string not found!")

