#!/usr/bin/env python3
"""
Test script for the Python MindAR service
"""

import requests
import os
import sys

def test_health():
    """Test the health endpoint"""
    try:
        response = requests.get('http://localhost:8000/health')
        if response.status_code == 200:
            print("✅ Health check passed")
            print(f"Service info: {response.json()}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Service not running. Start with: python app.py")
        return False

def test_image_validation():
    """Test image validation endpoint"""
    try:
        # Create a simple test image (1x1 pixel)
        test_image_data = b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9=82<.342\xff\xc0\x00\x11\x08\x00\x01\x00\x01\x01\x01\x11\x00\x02\x11\x01\x03\x11\x01\xff\xc4\x00\x14\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x08\xff\xc4\x00\x14\x10\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xda\x00\x0c\x03\x01\x00\x02\x11\x03\x11\x00\x3f\x00\xaa\xff\xd9'
        
        response = requests.post(
            'http://localhost:8000/validate-image',
            data=test_image_data,
            headers={'Content-Type': 'application/octet-stream'}
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Image validation test passed")
            print(f"Validation result: {result}")
            return True
        else:
            print(f"❌ Image validation failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Image validation error: {e}")
        return False

def test_mind_generation():
    """Test mind file generation endpoint"""
    try:
        # Create a simple test image (1x1 pixel)
        test_image_data = b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9=82<.342\xff\xc0\x00\x11\x08\x00\x01\x00\x01\x01\x01\x11\x00\x02\x11\x01\x03\x11\x01\xff\xc4\x00\x14\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x08\xff\xc4\x00\x14\x10\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xda\x00\x0c\x03\x01\x00\x02\x11\x03\x11\x00\x3f\x00\xaa\xff\xd9'
        
        response = requests.post(
            'http://localhost:8000/generate-mind',
            data=test_image_data,
            headers={
                'Content-Type': 'application/octet-stream',
                'X-Filename': 'test.jpg'
            }
        )
        
        if response.status_code == 200:
            mind_file = response.content
            print("✅ Mind file generation test passed")
            print(f"Generated mind file size: {len(mind_file)} bytes")
            
            # Save the mind file for inspection
            with open('test_output.mind', 'wb') as f:
                f.write(mind_file)
            print("📁 Mind file saved as 'test_output.mind'")
            return True
        else:
            print(f"❌ Mind file generation failed: {response.status_code}")
            print(f"Error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Mind file generation error: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing Python MindAR Service")
    print("=" * 40)
    
    # Test health endpoint
    if not test_health():
        print("\n❌ Service is not running properly")
        print("Start the service with: python app.py")
        sys.exit(1)
    
    print("\n" + "=" * 40)
    
    # Test image validation
    test_image_validation()
    
    print("\n" + "=" * 40)
    
    # Test mind file generation
    test_mind_generation()
    
    print("\n" + "=" * 40)
    print("✅ All tests completed!")
    print("\nNext steps:")
    print("1. Deploy to Railway/Render/Vercel")
    print("2. Get your service URL")
    print("3. Add PYTHON_MINDAR_SERVICE_URL to your Next.js app")

if __name__ == "__main__":
    main() 