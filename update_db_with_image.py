#!/usr/bin/env python3
"""
Manually update the database with generated image data
"""

import pymongo
from pymongo import MongoClient
import os
from dotenv import load_dotenv
import base64
import requests

# Load environment variables
load_dotenv()

def update_database_with_image():
    """Update the database with the generated image"""
    try:
        # Connect to MongoDB Atlas
        mongo_uri = os.getenv('MONGODB_URI', 'mongodb+srv://jatinsinha03:admin@cluster0.5enu7dl.mongodb.net/?retryWrites=true&w=majority')
        client = MongoClient(mongo_uri)
        db = client.get_default_database()
        
        # Get the users collection
        users_collection = db.useralearts
        
        # Find users with generating images for tokenId 5
        users_with_generating_images = list(users_collection.find(
            {"generatedImages": {"$elemMatch": {"tokenId": 5, "status": "generating"}}},
            {"email": 1, "generatedImages": 1}
        ))
        
        print(f"📊 Found {len(users_with_generating_images)} users with generating images for token 5")
        
        for user in users_with_generating_images:
            print(f"\n👤 User: {user.get('email', 'Unknown')}")
            
            # Find the generating image entry
            for i, img in enumerate(user.get('generatedImages', [])):
                if img.get('tokenId') == 5 and img.get('status') == 'generating':
                    print(f"   🖼️  Found generating image entry {i+1}")
                    
                    # Try to get the generated image from the Python backend
                    try:
                        # Check if there's a generated image file
                        image_files = []
                        if os.path.exists('generated_images'):
                            image_files = [f for f in os.listdir('generated_images') if f.startswith('art_token_5_')]
                        
                        if image_files:
                            # Use the most recent image file
                            latest_image = max(image_files, key=lambda x: os.path.getctime(f'generated_images/{x}'))
                            image_path = f'generated_images/{latest_image}'
                            
                            print(f"   📁 Found image file: {latest_image}")
                            
                            # Read and encode the image
                            with open(image_path, 'rb') as f:
                                image_data = base64.b64encode(f.read()).decode('utf-8')
                            
                            # Update the database
                            result = users_collection.update_one(
                                {
                                    "_id": user["_id"],
                                    "generatedImages.tokenId": 5,
                                    "generatedImages.status": "generating"
                                },
                                {
                                    "$set": {
                                        "generatedImages.$.imageData": image_data,
                                        "generatedImages.$.status": "completed"
                                    }
                                }
                            )
                            
                            if result.modified_count > 0:
                                print(f"   ✅ Successfully updated database with image data")
                                print(f"   📏 Image size: {len(image_data)} characters")
                            else:
                                print(f"   ❌ Failed to update database")
                        else:
                            print(f"   ❌ No generated image files found")
                            
                    except Exception as e:
                        print(f"   ❌ Error updating image: {e}")
        
        # Close connection
        client.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🔧 Manually updating database with generated image...")
    success = update_database_with_image()
    if success:
        print("\n🎉 Database update completed!")
        print("You can now refresh the frontend to see the generated image.")
    else:
        print("\n💥 Database update failed.")

