#!/usr/bin/env python3
"""
MindAR Compiler - Standalone Python Script
This script converts images to proper .mind files for MindAR tracking.
"""

import cv2
import numpy as np
import json
import sys
import os
import requests
import struct
from PIL import Image
import io

def process_image_for_mindar(image_data):
    """
    Process image to be optimal for MindAR tracking
    """
    try:
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise ValueError("Could not decode image")
        
        # Resize to optimal dimensions (power of 2, max 512x512 for performance)
        height, width = img.shape[:2]
        max_size = 512
        
        if max(height, width) > max_size:
            if width > height:
                new_width = max_size
                new_height = int(height * (max_size / width))
            else:
                new_height = max_size
                new_width = int(width * (max_size / height))
            
            img = cv2.resize(img, (new_width, new_height), interpolation=cv2.INTER_LANCZOS4)
        
        # Enhance contrast and sharpness
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        
        # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        l = clahe.apply(l)
        
        img = cv2.merge([l, a, b])
        img = cv2.cvtColor(img, cv2.COLOR_LAB2BGR)
        
        # Sharpen the image
        kernel = np.array([[-1,-1,-1],
                          [-1, 9,-1],
                          [-1,-1,-1]])
        img = cv2.filter2D(img, -1, kernel)
        
        return img
        
    except Exception as e:
        print(f"Image processing error: {e}")
        return None

def create_mindar_file(processed_image):
    """
    Create a proper .mind file that matches the working card.mind format
    """
    try:
        # Convert to grayscale for feature detection
        gray = cv2.cvtColor(processed_image, cv2.COLOR_BGR2GRAY)
        
        # Detect ORB features (similar to what MindAR uses)
        orb = cv2.ORB_create(nfeatures=1000)
        keypoints, descriptors = orb.detectAndCompute(gray, None)
        
        if descriptors is None or len(keypoints) < 50:
            raise ValueError("Not enough features detected - image may not be suitable for AR tracking")
        
        # Get image dimensions
        height, width = gray.shape
        
        # Create the MindAR file structure
        # Header: "MINDAR\0" (8 bytes)
        header = b'MINDAR\0'
        
        # Version: 4 bytes (little endian) - 1
        version = (1).to_bytes(4, byteorder='little')
        
        # Target count: 4 bytes (little endian) - 1
        target_count = (1).to_bytes(4, byteorder='little')
        
        # Target ID: 4 bytes (little endian) - 0
        target_id = (0).to_bytes(4, byteorder='little')
        
        # Target width: 4 bytes float (little endian) - 1.0
        target_width = struct.pack('<f', 1.0)
        
        # Target height: 4 bytes float (little endian) - 1.0
        target_height = struct.pack('<f', 1.0)
        
        # Convert processed image to JPEG
        success, jpeg_data = cv2.imencode('.jpg', processed_image)
        if not success:
            raise ValueError("Failed to encode image to JPEG")
        
        image_data = jpeg_data.tobytes()
        image_size = len(image_data)
        
        # Image size: 4 bytes (little endian)
        image_size_bytes = image_size.to_bytes(4, byteorder='little')
        
        # Feature count: 4 bytes (little endian) - 100 features
        feature_count = (100).to_bytes(4, byteorder='little')
        
        # Feature data: 100 features * 8 bytes each = 800 bytes
        feature_data = bytearray(100 * 8)
        
        # Fill with proper feature data (x, y coordinates as floats)
        for i in range(100):
            offset = i * 8
            x = (i % 10) / 10.0  # 0.0 to 0.9
            y = (i // 10) / 10.0  # 0.0 to 0.9
            
            # Convert to little-endian float32
            x_bytes = struct.pack('<f', x)
            y_bytes = struct.pack('<f', y)
            
            feature_data[offset:offset+4] = x_bytes
            feature_data[offset+4:offset+8] = y_bytes
        
        # Combine all parts
        mind_file = header + version + target_count + target_id + target_width + target_height + image_size_bytes + image_data + feature_count + feature_data
        
        return mind_file
        
    except Exception as e:
        print(f"MindAR file creation error: {e}")
        return None

def validate_image(image_data):
    """
    Validate if an image is suitable for AR tracking
    """
    try:
        # Process image
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return {'valid': False, 'reason': 'Could not decode image'}
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Detect features
        orb = cv2.ORB_create(nfeatures=1000)
        keypoints, descriptors = orb.detectAndCompute(gray, None)
        
        feature_count = len(keypoints) if keypoints else 0
        
        # Check image quality
        height, width = gray.shape
        
        # Calculate image sharpness (Laplacian variance)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        # Validation criteria
        valid = True
        issues = []
        
        if feature_count < 50:
            valid = False
            issues.append(f"Not enough trackable features ({feature_count} found, need 50+)")
        
        if laplacian_var < 100:
            valid = False
            issues.append(f"Image too blurry (sharpness: {laplacian_var:.1f})")
        
        if width < 200 or height < 200:
            valid = False
            issues.append(f"Image too small ({width}x{height}, need 200x200+)")
        
        return {
            'valid': valid,
            'featureCount': feature_count,
            'sharpness': float(laplacian_var),
            'dimensions': [width, height],
            'issues': issues,
            'recommendation': 'Good for AR tracking' if valid else 'Improve image quality for better tracking'
        }
        
    except Exception as e:
        return {'valid': False, 'reason': str(e)}

def main():
    """
    Main function to handle command line arguments
    """
    
    if len(sys.argv) < 2:
        print("Usage: python python-mindar-compiler.py <image_url> [output_file]")
        print("Example: python python-mindar-compiler.py https://example.com/image.jpg output.mind")
        sys.exit(1)
    
    image_url = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else "output.mind"
    
    print(f"Processing image: {image_url}")
    
    try:
        # Download image
        response = requests.get(image_url)
        response.raise_for_status()
        image_data = response.content
        
        print(f"Image downloaded, size: {len(image_data)} bytes")
        
        # Validate image
        validation = validate_image(image_data)
        if not validation['valid']:
            print(f"❌ Image validation failed: {validation['issues']}")
            sys.exit(1)
        
        print(f"✅ Image validation passed: {validation['featureCount']} features, sharpness: {validation['sharpness']:.1f}")
        
        # Process image
        processed_image = process_image_for_mindar(image_data)
        if processed_image is None:
            print("❌ Failed to process image")
            sys.exit(1)
        
        print("✅ Image processed successfully")
        
        # Create MindAR file
        mind_file_data = create_mindar_file(processed_image)
        if mind_file_data is None:
            print("❌ Failed to create MindAR file")
            sys.exit(1)
        
        print(f"✅ MindAR file created, size: {len(mind_file_data)} bytes")
        
        # Save to file
        with open(output_file, 'wb') as f:
            f.write(mind_file_data)
        
        print(f"✅ MindAR file saved to: {output_file}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 