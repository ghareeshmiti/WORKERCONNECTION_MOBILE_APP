
import re

try:
    with open("crash_log.txt", "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    # Find the last FATAL EXCEPTION
    matches = list(re.finditer(r"FATAL EXCEPTION:.*?(?=FATAL EXCEPTION|$)", content, re.DOTALL))
    if matches:
        last_crash = matches[-1].group(0)
        print("Last Crash Trace:")
        # Print first 20 lines of the crash
        lines = last_crash.split('\n')
        for line in lines[:20]:
            print(line)
            
        # Look for our package name
        if "com.fidomitiapp" in last_crash:
            print("\nFound package com.fidomitiapp in stack trace!")
    else:
        print("No FATAL EXCEPTION found in log.")

except Exception as e:
    print(f"Error: {e}")
