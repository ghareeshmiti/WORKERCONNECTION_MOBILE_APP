
with open("src/screens/DashboardScreen.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

print(f"Line 979 raw: {repr(lines[978])}") # 0-indexed
print(f"Line 980 raw: {repr(lines[979])}") 
