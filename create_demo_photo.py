#!/usr/bin/env python3
"""
Script to create a demo photo with a smaller QR code
"""

import qrcode
from PIL import Image, ImageDraw, ImageFont
import os

def create_demo_photo_with_qr():
    # Load the original demo photo
    original_photo_path = "public/demo-photo.png"
    
    if not os.path.exists(original_photo_path):
        print(f"Original photo not found at {original_photo_path}")
        return
    
    # Load the original image
    img = Image.open(original_photo_path)
    
    # Create QR code for the AR experience
    # This should point to your actual domain + /ar/quick.html
    qr_url = "https://your-domain.com/ar/quick.html"  # Replace with actual domain
    
    # Create QR code with smaller size
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=6,  # Smaller box size for smaller QR code
        border=2,
    )
    qr.add_data(qr_url)
    qr.make(fit=True)
    
    # Create QR code image
    qr_img = qr.make_image(fill_color="black", back_color="white")
    
    # Resize QR code to be smaller (about 120x120 pixels instead of the large one)
    qr_size = 120
    qr_img = qr_img.resize((qr_size, qr_size), Image.Resampling.LANCZOS)
    
    # Create a copy of the original image
    new_img = img.copy()
    
    # Position the QR code in the upper right corner with some margin
    margin = 20
    qr_x = new_img.width - qr_size - margin
    qr_y = margin
    
    # Add a white background with slight padding for better visibility
    padding = 10
    bg_size = qr_size + (padding * 2)
    bg = Image.new('RGBA', (bg_size, bg_size), (255, 255, 255, 240))
    
    # Paste the white background first
    bg_x = qr_x - padding
    bg_y = qr_y - padding
    new_img.paste(bg, (bg_x, bg_y), bg)
    
    # Paste the QR code on top
    new_img.paste(qr_img, (qr_x, qr_y))
    
    # Save the new image
    output_path = "public/demo-photo-small-qr.png"
    new_img.save(output_path)
    print(f"Created new demo photo with smaller QR code: {output_path}")
    
    # Also create a backup of the original
    backup_path = "public/demo-photo-original.png"
    if not os.path.exists(backup_path):
        img.save(backup_path)
        print(f"Backed up original photo: {backup_path}")

if __name__ == "__main__":
    create_demo_photo_with_qr()
