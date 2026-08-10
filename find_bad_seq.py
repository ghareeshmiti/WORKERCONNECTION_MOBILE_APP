
with open("src/screens/DashboardScreen.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i in range(len(lines) - 3):
    # Check for the sequence from error log
    # </TouchableOpacity>
    # </Modal>
    # </TouchableOpacity>
    
    l1 = lines[i].strip()
    l2 = lines[i+1].strip()
    l3 = lines[i+2].strip()
    
    if "TouchableOpacity" in l1 and "/TouchableOpacity" in l1 and \
       "Modal" in l2 and "/Modal" in l2 and \
       "TouchableOpacity" in l3 and "/TouchableOpacity" in l3:
        print(f"Found sequence at line {i+1}:")
        print(lines[i])
        print(lines[i+1])
        print(lines[i+2])
