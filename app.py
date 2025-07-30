from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import io
import tempfile
import os
from PIL import Image

app = Flask(__name__)
CORS(app)

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

def create_basic_mind_file(processed_image):
    """
    Create a basic .mind file structure
    This is a simplified version - in production you'd use the full MindAR compiler
    """
    try:
        # Convert to grayscale for feature detection
        gray = cv2.cvtColor(processed_image, cv2.COLOR_BGR2GRAY)
        
        # Detect ORB features (similar to what MindAR uses)
        orb = cv2.ORB_create(nfeatures=1000)
        keypoints, descriptors = orb.detectAndCompute(gray, None)
        
        if descriptors is None or len(keypoints) < 50:
            raise ValueError("Not enough features detected - image may not be suitable for AR tracking")
        
        # Create a basic mind file structure
        # Note: This is a simplified version. The real MindAR compiler creates a more complex structure
        height, width = gray.shape
        
        mind_data = {
            'images': [{
                'width': width,
                'height': height,
                'keypoints': [[kp.pt[0], kp.pt[1], kp.angle, kp.response] for kp in keypoints[:500]],
                'descriptors': descriptors[:500].tolist() if descriptors is not None else []
            }],
            'trackingData': {
                'imageSize': [width, height],
                'featureCount': min(len(keypoints), 500)
            }
        }
        
        # Convert to binary format (simplified)
        import json
        mind_json = json.dumps(mind_data)
        return mind_json.encode('utf-8')
        
    except Exception as e:
        print(f"Mind file creation error: {e}")
        return None

@app.route('/generate-mind', methods=['POST'])
def generate_mind():
    try:
        # Get image data from request
        image_data = request.get_data()
        filename = request.headers.get('X-Filename', 'marker.jpg')
        
        if not image_data:
            return jsonify({'error': 'No image data provided'}), 400
        
        print(f"Processing image: {filename}, size: {len(image_data)} bytes")
        
        # Process the image
        processed_image = process_image_for_mindar(image_data)
        if processed_image is None:
            return jsonify({'error': 'Failed to process image'}), 400
        
        # Create mind file
        mind_file_data = create_basic_mind_file(processed_image)
        if mind_file_data is None:
            return jsonify({'error': 'Failed to create mind file'}), 400
        
        print(f"Mind file created successfully, size: {len(mind_file_data)} bytes")
        
        # Return the mind file
        return send_file(
            io.BytesIO(mind_file_data),
            mimetype='application/octet-stream',
            as_attachment=True,
            download_name=filename.replace('.jpg', '.mind').replace('.png', '.mind')
        )
        
    except Exception as e:
        print(f"Error generating mind file: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'mindar-compiler',
        'version': '1.0.0'
    })

@app.route('/validate-image', methods=['POST'])
def validate_image():
    """
    Validate if an image is suitable for AR tracking
    """
    try:
        image_data = request.get_data()
        
        # Process image
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return jsonify({'valid': False, 'reason': 'Could not decode image'})
        
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
        
        return jsonify({
            'valid': valid,
            'featureCount': feature_count,
            'sharpness': float(laplacian_var),
            'dimensions': [width, height],
            'issues': issues,
            'recommendation': 'Good for AR tracking' if valid else 'Improve image quality for better tracking'
        })
        
    except Exception as e:
        return jsonify({'valid': False, 'reason': str(e)})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True) 