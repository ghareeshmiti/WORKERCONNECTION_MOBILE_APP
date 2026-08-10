
import re

def check_balance(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    # Simple check for tag balance
    # Ignoring comments and strings is hard with regex, so we'll just check raw counts for now.
    # This is a heuristic.
    
    tags = ["View", "Text", "TouchableOpacity", "ScrollView", "SafeAreaView", "Modal", "Image"]
    
    for tag in tags:
        open_count = len(re.findall(f"<{tag}[ >]", content))
        close_count = len(re.findall(f"</{tag}>", content))
        
        if open_count != close_count:
            print(f"Mismatch for {tag}: Open={open_count}, Close={close_count}")
        else:
            print(f"{tag}: Balanced ({open_count})")

check_balance("src/screens/DashboardScreen.tsx")
