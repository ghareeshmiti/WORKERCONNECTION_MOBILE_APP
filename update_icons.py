import os
from PIL import Image

def resize_image(image_path, size, output_path):
    try:
        img = Image.open(image_path)
        img = img.resize((size, size), Image.Resampling.LANCZOS)
        img.save(output_path)
        print(f"Generated: {output_path}")
    except Exception as e:
        print(f"Error processing {output_path}: {e}")

def main():
    source_image = "src/assets/ap-logo.png"
    base_res_dir = "android/app/src/main/res"
    
    # Standard icon sizes
    icon_configs = {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192
    }

    if not os.path.exists(source_image):
        print(f"Error: Source image not found at {source_image}")
        return

    for folder, size in icon_configs.items():
        folder_path = os.path.join(base_res_dir, folder)
        if not os.path.exists(folder_path):
            os.makedirs(folder_path)
        
        # Generate standard icon
        resize_image(source_image, size, os.path.join(folder_path, "ic_launcher.png"))
        
        # Generate round icon
        resize_image(source_image, size, os.path.join(folder_path, "ic_launcher_round.png"))

if __name__ == "__main__":
    main()
