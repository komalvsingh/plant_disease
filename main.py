from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from tensorflow.keras.models import load_model
from tensorflow.keras.utils import custom_object_scope
from tensorflow.keras.preprocessing import image

import numpy as np
from PIL import Image
import io
import os
from groq import Groq

app = FastAPI()
model = load_model("pdd.h5", compile=False)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Your frontend origin
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)
# Initialize Groq client
groq_api_key = "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"
if not groq_api_key:
    raise ValueError("GROQ_API_KEY environment variable is not set")
groq_client = Groq(api_key=groq_api_key)

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
        # Replace with your preferred Groq model
        model_name = "llama3-70b-8192"
        
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
        
        # Call Groq API
        response = groq_client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": "You are an agricultural expert specializing in plant diseases and treatments."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=1024
        )
        
        # Extract and parse the response
        recommendation_text = response.choices[0].message.content
        
        # Note: In a production environment, you might want to add more robust JSON parsing
        # with error handling and validation
        return recommendation_text
        
    except Exception as e:
        print(f"Error getting recommendations from Groq: {str(e)}")
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
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {"message": "Plant Disease Detection API is running. Use /predict endpoint to analyze plant images."}