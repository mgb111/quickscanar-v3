# Python MindAR Service

A Flask-based service for generating MindAR `.mind` files from uploaded images.

## Features

- **Image Processing**: Optimizes images for AR tracking
- **Feature Detection**: Uses ORB features for better tracking
- **Image Validation**: Checks if images are suitable for AR
- **MindAR File Generation**: Creates compatible `.mind` files

## API Endpoints

### Health Check
```
GET /health
```

### Generate MindAR File
```
POST /generate-mind
Content-Type: application/octet-stream
X-Filename: marker.jpg

[image binary data]
```

### Validate Image
```
POST /validate-image
Content-Type: application/octet-stream

[image binary data]
```

## Local Development

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the service:
```bash
python app.py
```

3. Test the service:
```bash
curl http://localhost:8000/health
```

## Deployment

### Railway
1. Push to GitHub
2. Connect to Railway
3. Deploy automatically

### Render
1. Connect GitHub repo
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `gunicorn app:app --bind 0.0.0.0:$PORT`

### Vercel
1. Add `vercel.json` configuration
2. Deploy with Vercel CLI

## Environment Variables

- `PORT`: Server port (set by platform)
- `FLASK_ENV`: Environment mode

## Testing

Test with a sample image:
```bash
curl -X POST http://localhost:8000/generate-mind \
  -H "Content-Type: application/octet-stream" \
  -H "X-Filename: test.jpg" \
  --data-binary @test-image.jpg \
  --output test.mind
``` 