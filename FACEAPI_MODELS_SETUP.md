# Face-API.js Models Setup

The frontend uses face-api.js for facial detection and liveness verification. You need to download the pre-trained models for this to work.

## Quick Setup

### Option 1: Download from GitHub (Recommended)

1. Download models from the official repository:
   ```
   https://github.com/justadudewhohacks/face-api.js-models
   ```

2. Create the models directory in frontend:
   ```powershell
   mkdir frontend\public\models
   ```

3. Copy these specific model files to `frontend\public\models`:
   - `tiny_face_detector_model-weights_manifest.json`
   - `tiny_face_detector_model-shard1`
   - `face_landmark_68_model-weights_manifest.json`
   - `face_landmark_68_model-shard1`
   - `face_recognition_model-weights_manifest.json`
   - `face_recognition_model-shard1`
   - `face_recognition_model-shard2`
   - `face_expression_model-weights_manifest.json`
   - `face_expression_model-shard1`

### Option 2: Direct Download Links

You can also download them individually from:
```
https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/tiny_face_detector/
https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/face_landmark_68/
https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/face_recognition/
https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/face_expression/
```

## Verify Installation

After copying models, your frontend structure should look like:

```
frontend/
├── public/
│   └── models/
│       ├── tiny_face_detector_model-weights_manifest.json
│       ├── tiny_face_detector_model-shard1
│       ├── face_landmark_68_model-weights_manifest.json
│       ├── face_landmark_68_model-shard1
│       ├── face_recognition_model-weights_manifest.json
│       ├── face_recognition_model-shard1
│       ├── face_recognition_model-shard2
│       ├── face_expression_model-weights_manifest.json
│       └── face_expression_model-shard1
└── ...
```

## Testing

1. Start the frontend:
   ```powershell
   cd frontend
   npm run dev
   ```

2. Open http://localhost:5173

3. Go to Register or Login

4. When you click "Start Face Enrollment" or "Login with Face", the models should load automatically

5. Check browser console for:
   ```
   Face-api models loaded successfully
   ```

## Troubleshooting

**Models not loading**:
- Check browser console for 404 errors
- Verify files are in `frontend/public/models/`
- Ensure Vite dev server is running

**Face detection not working**:
- Ensure camera permissions granted
- Check lighting conditions
- Position face clearly in camera view

**Model loading takes time**:
- First load downloads ~4MB of models
- Subsequent loads use browser cache
- Production: Consider CDN hosting for models

## Alternative: Use CDN (Quick Test)

If you just want to test without downloading, you can temporarily modify `frontend/src/utils/faceDetection.js`:

```javascript
// Change MODEL_URL from '/models' to CDN:
const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
```

**Note**: For production, always host models locally for better performance and reliability.
