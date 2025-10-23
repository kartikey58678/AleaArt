#!/usr/bin/env python3
"""
AleaArt Python Backend for Image Generation (Simplified Version)
Generates images using Stable Diffusion with art parameters from blockchain
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import torch
from diffusers import StableDiffusionPipeline
import os
import uuid
from PIL import Image
import io
import base64
import pymongo
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Global variables for the model
pipe = None
model_id = "runwayml/stable-diffusion-v1-5"

# MongoDB connection
mongo_client = None
db = None

def connect_mongodb():
    """Connect to MongoDB"""
    global mongo_client, db
    try:
        # MongoDB connection string - you'll need to set this in your environment
        mongodb_uri = os.getenv('MONGODB_URI', 'mongodb+srv://jatinsinha03:admin@cluster0.5enu7dl.mongodb.net/?retryWrites=true&w=majority')
        mongo_client = pymongo.MongoClient(mongodb_uri)
        db = mongo_client['aleart']
        print("✅ Connected to MongoDB")
        return True
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        return False

def load_model():
    """Load the Stable Diffusion model"""
    global pipe
    if pipe is None:
        print("Loading Stable Diffusion model...")
        
        # Use a simpler loading approach
        pipe = StableDiffusionPipeline.from_pretrained(
            model_id, 
            torch_dtype=torch.float32,
            safety_checker=None,
            requires_safety_checker=False,
            use_safetensors=True
        )
        
        # Move to CPU first, then to GPU if available
        pipe = pipe.to("cpu")
        print("Model loaded on CPU")
        
        # Try to move to GPU if available
        if torch.cuda.is_available():
            try:
                pipe = pipe.to("cuda")
                print("Model moved to GPU")
            except Exception as e:
                print(f"Could not move to GPU: {e}")
                print("Staying on CPU")
        
        # Enable memory efficient attention
        try:
            pipe.enable_attention_slicing()
            print("Memory efficient attention enabled")
        except Exception as e:
            print(f"Could not enable attention slicing: {e}")
        
        print("Model loaded successfully!")

def save_image_to_mongodb(user_id, token_id, image_base64, prompt, parameters):
    """Save generated image to MongoDB"""
    global db
    try:
        if db is None:
            print("❌ MongoDB not connected")
            return False
        
        # Create the image document
        image_doc = {
            'userId': user_id,
            'tokenId': token_id,
            'imageData': image_base64,
            'prompt': prompt,
            'parameters': parameters,
            'status': 'completed',
            'createdAt': datetime.utcnow()
        }
        
        # Insert into generatedImages collection
        result = db.generatedImages.insert_one(image_doc)
        print(f"✅ Image saved to MongoDB with ID: {result.inserted_id}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to save image to MongoDB: {e}")
        return False

@app.route('/generate-image', methods=['POST'])
def generate_image():
    """Generate image using Stable Diffusion with art parameters"""
    try:
        data = request.json
        
        # Extract parameters
        prompt = data.get('prompt', '')
        steps = data.get('steps', 20)
        cfg_scale = data.get('cfg_scale', 7.5)
        seed = data.get('seed', None)
        width = data.get('width', 512)
        height = data.get('height', 512)
        token_id = data.get('tokenId', 'unknown')
        user_id = data.get('userId', None)  # Add user ID
        
        print(f"Generating image for token {token_id}")
        print(f"Prompt: {prompt}")
        print(f"Steps: {steps}, CFG: {cfg_scale}, Seed: {seed}")
        print(f"Size: {width}x{height}")
        
        # Check if model is loaded
        if pipe is None:
            print("Model not loaded, loading now...")
            load_model()
        
        # Generate image
        result = pipe(
            prompt=prompt,
            num_inference_steps=steps,
            guidance_scale=cfg_scale,
            width=width,
            height=height,
            generator=torch.Generator().manual_seed(seed) if seed else None
        )
        
        image = result.images[0]
        
        # Save image
        image_filename = f"art_token_{token_id}_{uuid.uuid4().hex[:8]}.png"
        image_path = os.path.join("generated_images", image_filename)
        
        # Create directory if it doesn't exist
        os.makedirs("generated_images", exist_ok=True)
        
        # Save image
        image.save(image_path)
        
        # Convert to base64 for response
        buffer = io.BytesIO()
        image.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()
        
        print(f"✅ Image generated successfully for token {token_id}")
        print(f"📁 Saved to: {image_path}")
        print(f"📏 Image size: {len(img_str)} characters")
        
        # Save to MongoDB if user_id is provided
        parameters = {
            'steps': steps,
            'cfg_scale': cfg_scale,
            'seed': seed,
            'width': width,
            'height': height
        }
        
        if user_id:
            save_image_to_mongodb(user_id, token_id, img_str, prompt, parameters)
        
        return jsonify({
            'success': True,
            'imageUrl': f'/generated_images/{image_filename}',
            'imageBase64': f'data:image/png;base64,{img_str}',
            'tokenId': token_id,
            'prompt': prompt,
            'parameters': parameters
        })
        
    except Exception as e:
        print(f"❌ Error generating image: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/generated_images/<filename>')
def serve_image(filename):
    """Serve generated images"""
    try:
        return send_file(f'generated_images/{filename}')
    except FileNotFoundError:
        return jsonify({'error': 'Image not found'}), 404

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': pipe is not None,
        'cuda_available': torch.cuda.is_available()
    })

@app.route('/', methods=['GET'])
def index():
    """Root endpoint"""
    return jsonify({
        'message': 'AleaArt Python Backend (Simplified)',
        'endpoints': [
            '/generate-image',
            '/health',
            '/generated_images/<filename>'
        ]
    })

if __name__ == '__main__':
    print("Starting AleaArt Python Backend (Simplified)...")
    print("Installing required packages...")
    
    # Install required packages
    import subprocess
    import sys
    
    packages = [
        'torch',
        'diffusers',
        'transformers',
        'scipy',
        'flask',
        'flask-cors',
        'pillow',
        'pymongo'
    ]
    
    for package in packages:
        try:
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', package])
        except subprocess.CalledProcessError:
            print(f"Warning: Could not install {package}")
    
    # Connect to MongoDB
    print("Connecting to MongoDB...")
    connect_mongodb()
    
    # Load the model at startup
    print("Loading Stable Diffusion model at startup...")
    load_model()
    
    print("Starting Flask server...")
    app.run(host='0.0.0.0', port=8000, debug=True)
