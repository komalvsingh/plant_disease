from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import requests
import json
import os
from email.mime.text import MIMEText
import smtplib
from typing import Dict
import uvicorn

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Your frontend origin
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Set API key directly (for testing only - in production use environment variables)
OPENWEATHER_API_KEY = "99cb1b9cd1b074872d1dd824075271af"
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "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")  # Add your Groq API key as an environment variable

# Sample coordinates (New York City)
DEFAULT_LAT = 40.7128
DEFAULT_LON = -74.0060

def send_email(subject: str, message: str):
    try:
        sender_email = os.getenv("EMAIL_USER", "komalvsingh1111@gmail.com")
        receiver_email = os.getenv("STORE_EMAIL", "2022.komal.singh@ves.ac.in")
        password = os.getenv("EMAIL_PASS", "rxqu ugpz iypg jfur")

        msg = MIMEText(message)
        msg["Subject"] = subject
        msg["From"] = sender_email
        msg["To"] = receiver_email

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, password)
            server.sendmail(sender_email, receiver_email, msg.as_string())
        return True
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        return False

def check_weather(lat: float = DEFAULT_LAT, lon: float = DEFAULT_LON) -> Dict:
    # Use the hardcoded API key for testing
    api_key = os.getenv("OPENWEATHER_API_KEY", OPENWEATHER_API_KEY)
    url = f"http://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric"
    
    print(f"Weather API URL (for testing): {url}")  # Print the URL for testing
    
    response = requests.get(url)
    data = response.json()
    
    print("Weather API Response:", json.dumps(data, indent=2))  # Debugging
    
    return data

async def get_plant_care_recommendations(weather_data: Dict) -> str:
    temp = weather_data['main']['temp']
    humidity = weather_data['main']['humidity']
    conditions = weather_data['weather'][0]['description']
    wind_speed = weather_data['wind']['speed']
    
    # Create a prompt with detailed weather information
    prompt = f"""Given the current weather conditions:
    - Temperature: {temp}°C
    - Humidity: {humidity}%
    - Wind Speed: {wind_speed} m/s
    - Conditions: {conditions}
    
    Provide specific, actionable recommendations for agricultural practices and plant care. 
    Include advice on:
    1. Irrigation needs
    2. Potential pest or disease risks
    3. Crop protection measures
    4. Optimal timing for agricultural activities
    
    Keep your response concise and practical for farmers to implement immediately.
    """
    
    # Call Groq API for more accurate recommendations
    groq_api_key = os.getenv("GROQ_API_KEY", GROQ_API_KEY)
    if not groq_api_key:
        return "Error: Groq API key not configured. Please set the GROQ_API_KEY environment variable."
    
    headers = {
        "Authorization": f"Bearer {groq_api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "llama3-8b-8192",  # You can use "llama3-70b-8192" for more advanced recommendations
        "messages": [
            {"role": "system", "content": "You are an agricultural expert providing actionable advice for farmers based on weather conditions."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.5,
        "max_tokens": 300
    }
    
    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=payload
        )
        
        if response.status_code == 200:
            response_data = response.json()
            recommendations = response_data["choices"][0]["message"]["content"]
            return recommendations
        else:
            print(f"Error from Groq API: {response.status_code}, {response.text}")
            return f"Error getting recommendations: {response.status_code}"
    except Exception as e:
        print(f"Exception calling Groq API: {str(e)}")
        return f"Error: {str(e)}"

@app.post("/api/weather-alerts")
async def create_weather_alert(background_tasks: BackgroundTasks, user_data: Dict = None):
    try:
        # Use default coordinates if none provided
        if user_data is None:
            user_data = {'lat': DEFAULT_LAT, 'lon': DEFAULT_LON}
        
        # Get weather data
        weather_data = check_weather(user_data.get('lat', DEFAULT_LAT), user_data.get('lon', DEFAULT_LON))
        
        # Extract relevant weather information
        temp = weather_data['main']['temp']
        humidity = weather_data['main']['humidity']
        wind_speed = weather_data['wind']['speed']
        conditions = weather_data['weather'][0]['description']
        
        alerts = []
        email_notifications = []

        # Check for extreme conditions
        if temp > 30:
            alerts.append({
                'type': 'warning',
                'message': f'High temperature alert: {temp}°C. Consider additional irrigation.'
            })
            email_notifications.append('High Temperature Alert')
        
        if humidity > 80:
            alerts.append({
                'type': 'warning',
                'message': f'High humidity alert: {humidity}%. Monitor for fungal diseases.'
            })
            email_notifications.append('High Humidity Alert')
        
        if wind_speed > 20:
            alerts.append({
                'type': 'warning',
                'message': f'Strong wind alert: {wind_speed}m/s. Protect delicate crops.'
            })
            email_notifications.append('Strong Wind Alert')

        # Get plant care recommendations using Groq
        recommendations = await get_plant_care_recommendations(weather_data)
        
        # Add recommendations to alerts even if there are no warnings
        alerts.append({
            'type': 'info',
            'message': f'Recommendations: {recommendations}'
        })

        # Send email if there are alerts
        if email_notifications:
            alert_subject = "Weather Alert for Your Crops"
            alert_message = "\n".join([
                "Weather Alerts:",
                *[f"- {alert}" for alert in email_notifications],
                "\nRecommendations:",
                recommendations
            ])
            
            background_tasks.add_task(send_email, alert_subject, alert_message)

        return {
            "temperature": temp,
            "humidity": humidity,
            "windSpeed": wind_speed,
            "conditions": conditions,
            "alerts": alerts,
            "recommendations": recommendations
        }

    except Exception as e:
        print(f"Error in weather alert creation: {str(e)}")
        return {
            "error": "Failed to process weather alert",
            "details": str(e)
        }

# Add a simple test endpoint
@app.get("/test-weather")
async def test_weather():
    """A simple endpoint to test the weather API without requiring a POST request"""
    weather_data = check_weather(DEFAULT_LAT, DEFAULT_LON)
    return weather_data

# Add a test endpoint for Groq recommendations
@app.get("/test-recommendations")
async def test_recommendations():
    """Test the Groq API recommendation generation"""
    weather_data = check_weather(DEFAULT_LAT, DEFAULT_LON)
    recommendations = await get_plant_care_recommendations(weather_data)
    return {"recommendations": recommendations}

if __name__ == "__main__":
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8001,  # Change this to your desired port
        reload=True  # Optional: enables auto-reload during development
    )