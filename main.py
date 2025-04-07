from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image

import numpy as np
from PIL import Image
import io
import os
import requests
import json

app = FastAPI()
model = load_model("plant_model.h5", compile=False)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Your frontend origin
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# API key for Groq
groq_api_key = "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"
if not groq_api_key:
    raise ValueError("GROQ_API_KEY is not set")

# Instead of using the Groq client, we'll use requests directly
def call_groq_api(prompt, model_name="llama3-70b-8192"):
    """Call Groq API directly using requests to avoid client issues"""
    headers = {
        "Authorization": f"Bearer {groq_api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": model_name,
        "messages": [
            {"role": "system", "content": "You are an agricultural expert specializing in plant diseases and treatments."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.2,
        "max_tokens": 1024
    }
    
    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=payload
        )
        response.raise_for_status()  # Raise exception for HTTP errors
        return response.json()["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"Error calling Groq API: {str(e)}")
        return {"error": f"Failed to get recommendations: {str(e)}"}

class_names = [
    'Pepper_bell_Bacterial_spot', 'Pepperbell__healthy',
    'Potato__Early_blight', 'Potato_Late_blight', 'Potato__healthy',
    'Tomato_Bacterial_spot', 'Tomato_Early_blight', 'Tomato_Late_blight',
    'Tomato_Leaf_Mold', 'Tomato_Septoria_leaf_spot',
    'Tomato_Spider_mites_Two_spotted_spider_mite', 'Tomato__Target_Spot',
    'Tomato_Tomato_YellowLeafCurl_Virus', 'Tomato_Tomato_mosaic_virus',
    'Tomato_healthy'
]

async def get_treatment_recommendations(disease_name):
    """Get treatment recommendations from Groq API for the identified plant disease"""
    try:
        # Create a prompt for the Groq API
        prompt = f"""
        Provide detailed treatment recommendations and precautions for the plant disease: {disease_name}.
        Include the following sections:
        1. Brief description of the disease
        2. Symptoms
        3. Treatment methods (both chemical and organic options)
        4. Preventive measures
        5. Additional care instructions
        
        Format the response as a JSON object with these sections as keys.
        """
        
        # Call Groq API using our custom function
        recommendation_text = call_groq_api(prompt)
        return recommendation_text
        
    except Exception as e:
        print(f"Error getting recommendations: {str(e)}")
        return {"error": f"Failed to get recommendations: {str(e)}"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        # Read and process image
        contents = await file.read()
        img = Image.open(io.BytesIO(contents)).convert("RGB")
        img = img.resize((224, 224))
        img_array = image.img_to_array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)

        # Predict
        predictions = model.predict(img_array)
        predicted_index = np.argmax(predictions[0])
        disease = class_names[predicted_index]
        confidence = round(float(np.max(predictions[0])) * 100, 2)

        # Skip recommendations for healthy plants
        if "healthy" in disease.lower():
            recommendations = "Plant appears healthy. No treatment needed."
        else:
            # Get treatment recommendations from Groq API
            recommendations = await get_treatment_recommendations(disease)

        return {
            "disease": disease,
            "confidence": confidence,
            "recommendations": recommendations
        }
    except Exception as e:
        print(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {"message": "Plant Disease Detection API is running. Use /predict endpoint to analyze plant images."}