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
model = load_model("plant_model_new.h5", compile=False)

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

class_names = ['Apple__Apple_scab', 'Apple_Black_rot', 'Apple_Cedar_apple_rust', 'Apple__healthy',
               'Blueberry__healthy', 'Cherry(including_sour)Powdery_mildew', 'Cherry(including_sour)_healthy',
               'Corn_(maize)Cercospora_leaf_spot Gray_leaf_spot', 'Corn(maize)Common_rust',
               'Corn_(maize)Northern_Leaf_Blight', 'Corn(maize)healthy', 'Grape__Black_rot',
               'Grape__Esca(Black_Measles)', 'Grape__Leaf_blight(Isariopsis_Leaf_Spot)', 'Grape___healthy',
               'Orange__Haunglongbing(Citrus_greening)', 'Peach__Bacterial_spot', 'Peach__healthy',
               'Pepper,bell_Bacterial_spot', 'Pepper,_bell_healthy', 'Potato__Early_blight',
               'Potato__Late_blight', 'Potato_healthy', 'Raspberry_healthy', 'Soybean__healthy',
               'Squash__Powdery_mildew', 'Strawberry_Leaf_scorch', 'Strawberry__healthy',
               'Tomato__Bacterial_spot', 'Tomato_Early_blight', 'Tomato__Late_blight',
               'Tomato__Leaf_Mold', 'Tomato__Septoria_leaf_spot',
               'Tomato__Spider_mites Two-spotted_spider_mite', 'Tomato__Target_Spot',
               'Tomato__Tomato_Yellow_Leaf_Curl_Virus', 'Tomato_Tomato_mosaic_virus', 'Tomato__healthy']

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
        
        # Try to parse the response as JSON
        try:
            # Check if we got a JSON response
            if isinstance(recommendation_text, str):
                # Sometimes the API might return a string with JSON inside
                # Find the first { and last } to extract the JSON part
                json_start = recommendation_text.find('{')
                json_end = recommendation_text.rfind('}') + 1
                
                if json_start != -1 and json_end != -1:
                    json_part = recommendation_text[json_start:json_end]
                    recommendations_json = json.loads(json_part)
                else:
                    # If no JSON structure found, return the text as is but formatted
                    return format_plain_text_recommendation(recommendation_text)
            else:
                # Direct JSON response
                recommendations_json = json.loads(recommendation_text)
                
            # Format the recommendations in a clean, point-wise structure
            formatted_recs = format_recommendations(recommendations_json)
            return formatted_recs
            
        except json.JSONDecodeError:
            # If JSON parsing fails, format as plain text
            return format_plain_text_recommendation(recommendation_text)
        
    except Exception as e:
        print(f"Error getting recommendations: {str(e)}")
        return {"error": f"Failed to get recommendations: {str(e)}"}

def format_recommendations(recommendations_json):
    """Format the recommendations JSON into a clean, readable structure"""
    formatted_output = ""
    
    # Add disease description
    if "Brief Description of the Disease" in recommendations_json:
        formatted_output += f"## Disease Description\n{recommendations_json['Brief Description of the Disease']}\n\n"
    
    # Add symptoms in bullet points
    if "Symptoms" in recommendations_json:
        formatted_output += "## Symptoms\n"
        symptoms = recommendations_json["Symptoms"]
        if isinstance(symptoms, dict):
            for symptom_type, description in symptoms.items():
                formatted_output += f"- **{symptom_type}**: {description}\n"
        elif isinstance(symptoms, list):
            for symptom in symptoms:
                formatted_output += f"- {symptom}\n"
        else:
            formatted_output += f"{symptoms}\n"
        formatted_output += "\n"
    
    # Add treatment methods
    if "Treatment Methods" in recommendations_json:
        formatted_output += "## Treatment Methods\n"
        treatments = recommendations_json["Treatment Methods"]
        
        # Chemical options
        if isinstance(treatments, dict) and "Chemical Options" in treatments:
            formatted_output += "### Chemical Options\n"
            chemical_options = treatments["Chemical Options"]
            if isinstance(chemical_options, dict):
                for option, desc in chemical_options.items():
                    formatted_output += f"- **{option}**: {desc}\n"
            else:
                formatted_output += f"- {chemical_options}\n"
        
        # Organic options
        if isinstance(treatments, dict) and "Organic Options" in treatments:
            formatted_output += "\n### Organic Options\n"
            organic_options = treatments["Organic Options"]
            if isinstance(organic_options, dict):
                for option, desc in organic_options.items():
                    formatted_output += f"- **{option}**: {desc}\n"
            else:
                formatted_output += f"- {organic_options}\n"
        
        formatted_output += "\n"
    
    # Add preventive measures
    if "Preventive Measures" in recommendations_json:
        formatted_output += "## Preventive Measures\n"
        preventives = recommendations_json["Preventive Measures"]
        if isinstance(preventives, dict):
            for measure, desc in preventives.items():
                formatted_output += f"- **{measure}**: {desc}\n"
        elif isinstance(preventives, list):
            for measure in preventives:
                formatted_output += f"- {measure}\n"
        else:
            formatted_output += f"{preventives}\n"
        formatted_output += "\n"
    
    # Add additional care instructions
    if "Additional Care Instructions" in recommendations_json:
        formatted_output += "## Additional Care\n"
        care = recommendations_json["Additional Care Instructions"]
        if isinstance(care, dict):
            for instruction, desc in care.items():
                formatted_output += f"- **{instruction}**: {desc}\n"
        elif isinstance(care, list):
            for instruction in care:
                formatted_output += f"- {instruction}\n"
        else:
            formatted_output += f"{care}\n"
    
    return formatted_output

def format_plain_text_recommendation(text):
    """Format plain text recommendation if JSON parsing fails"""
    # Remove any code blocks or unnecessary formatting
    text = text.replace("```json", "").replace("```", "")
    
    # Try to structure the text by common sections
    sections = [
        "Disease Description", "Brief Description", 
        "Symptoms", 
        "Treatment", "Treatment Methods",
        "Preventive", "Prevention", "Preventive Measures",
        "Additional Care", "Care Instructions"
    ]
    
    formatted_text = "# Treatment Recommendation\n\n"
    
    # Split by potential section headers and format
    lines = text.split('\n')
    current_section = None
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Check if this line could be a section header
        is_header = False
        for section in sections:
            if section.lower() in line.lower() and len(line) < 50:
                formatted_text += f"\n## {line}\n"
                current_section = section
                is_header = True
                break
                
        if not is_header:
            # Format potential list items
            if line.startswith('-') or line.startswith('*'):
                formatted_text += f"{line}\n"
            elif ':' in line and len(line.split(':')[0]) < 30:
                # Potential key-value pair
                key, value = line.split(':', 1)
                formatted_text += f"- **{key.strip()}**: {value.strip()}\n"
            else:
                formatted_text += f"{line}\n"
    
    return formatted_text

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