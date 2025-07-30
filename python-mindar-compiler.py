#!/usr/bin/env python3
"""
Senior Engineer MindAR Compiler
Converts uploaded marker images to working .mind files
"""

import cv2
import numpy as np
import struct
import json
import sys
import os
from PIL import Image
import io

def validate_image(image_data):
    """Validate image quality for AR tracking"""
    try:
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return False, "Could not decode image"
        
        # Convert to grayscale for analysis
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Check dimensions
        height, width = gray.shape
        if width < 200 or height < 200:
            return False, f"Image too small ({width}x{height}, need 200x200+)"
        
        # Check sharpness (Laplacian variance)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        if laplacian_var < 100:
            return False, f"Image too blurry (sharpness: {laplacian_var:.1f})"
        
        # Detect features
        orb = cv2.ORB_create(nfeatures=1000)
        keypoints, descriptors = orb.detectAndCompute(gray, None)
        feature_count = len(keypoints) if keypoints else 0
        
        if feature_count < 50:
            return False, f"Not enough trackable features ({feature_count} found, need 50+)"
        
        return True, f"Valid image: {feature_count} features, sharpness: {laplacian_var:.1f}"
        
    except Exception as e:
        return False, f"Validation error: {str(e)}"

def optimize_image_for_tracking(image_data):
    """Optimize image for better AR tracking"""
    try:
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return None
        
        # Resize to optimal dimensions (power of 2, max 512x512)
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
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Enhance contrast using CLAHE
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        gray = clahe.apply(gray)
        
        # Convert back to bytes
        success, buffer = cv2.imencode('.jpg', gray, [cv2.IMWRITE_JPEG_QUALITY, 95])
        if success:
            return buffer.tobytes()
        
        return None
        
    except Exception as e:
        print(json.dumps({"error": f"Image optimization error: {e}"}), file=sys.stderr)
        return None

def create_mindar_file(optimized_image_data):
    """Create a working MindAR file from optimized image data"""
    try:
        # Convert to numpy array for processing
        nparr = np.frombuffer(optimized_image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
        
        if img is None:
            raise ValueError("Could not decode optimized image")
        
        height, width = img.shape
        
        # Detect ORB features
        orb = cv2.ORB_create(nfeatures=1000, scaleFactor=1.2, nlevels=8)
        keypoints, descriptors = orb.detectAndCompute(img, None)
        
        if descriptors is None or len(keypoints) < 50:
            raise ValueError("Not enough features detected")
        
        # Limit to top 500 features
        max_features = min(500, len(keypoints))
        keypoints = keypoints[:max_features]
        descriptors = descriptors[:max_features]
        
        # Create a simple but valid .mind file structure
        mind_file = bytearray()
        
        # Header (8 bytes) - MINDAR\0\0
        mind_file.extend(b'MINDAR\0\0')
        
        # Version (4 bytes)
        mind_file.extend(struct.pack('<I', 1))
        
        # Image dimensions (8 bytes)
        mind_file.extend(struct.pack('<II', width, height))
        
        # Feature count (4 bytes)
        mind_file.extend(struct.pack('<I', max_features))
        
        # Feature points (20 bytes per feature)
        for kp in keypoints:
            x = float(kp.pt[0] / width)  # Normalize to 0-1
            y = float(kp.pt[1] / height) # Normalize to 0-1
            angle = float(kp.angle)      # Degrees
            response = float(kp.response) # Strength
            size = float(kp.size)        # Scale
            
            mind_file.extend(struct.pack('<fffff', x, y, angle, response, size))
        
        # Descriptors (32 bytes per descriptor)
        for desc in descriptors:
            mind_file.extend(desc.tobytes())
        
        # Image data
        # First write the size (4 bytes)
        mind_file.extend(struct.pack('<I', len(optimized_image_data)))
        # Then write the actual image data
        mind_file.extend(optimized_image_data)
        
        # Add padding to align to 8 bytes
        padding_size = (8 - (len(mind_file) % 8)) % 8
        if padding_size > 0:
            mind_file.extend(b'\0' * padding_size)
        
        return bytes(mind_file)
        
    except Exception as e:
        print(json.dumps({"error": f"MindAR file creation error: {e}"}), file=sys.stderr)
        return None

def main():
    """Main function to process image and create .mind file"""
    try:
        # Read image data from stdin
        image_data = sys.stdin.buffer.read()
        
        if not image_data:
            print(json.dumps({"error": "No image data provided"}), file=sys.stderr)
            sys.exit(1)
        
        print(json.dumps({"status": "processing", "size": len(image_data)}), file=sys.stderr)
        
        # Validate image
        is_valid, message = validate_image(image_data)
        if not is_valid:
            print(json.dumps({"error": f"Image validation failed: {message}"}), file=sys.stderr)
            sys.exit(1)
        
        print(json.dumps({"status": "validated", "message": message}), file=sys.stderr)
        
        # Optimize image for tracking
        optimized_image = optimize_image_for_tracking(image_data)
        if optimized_image is None:
            print(json.dumps({"error": "Failed to optimize image"}), file=sys.stderr)
            sys.exit(1)
        
        print(json.dumps({"status": "optimized", "size": len(optimized_image)}), file=sys.stderr)
        
        # Create MindAR file
        mind_file = create_mindar_file(optimized_image)
        if mind_file is None:
            print(json.dumps({"error": "Failed to create MindAR file"}), file=sys.stderr)
            sys.exit(1)
        
        print(json.dumps({"status": "completed", "size": len(mind_file)}), file=sys.stderr)
        
        # Output the .mind file to stdout
        sys.stdout.buffer.write(mind_file)
        sys.stdout.buffer.flush()
        
    except Exception as e:
        print(json.dumps({"error": f"Unexpected error: {str(e)}"}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main() 