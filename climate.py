from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from transformers import pipeline
import requests
import json
import os
from email.mime.text import MIMEText
import smtplib
from typing import Dict

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

# Sample coordinates (New York City)
DEFAULT_LAT = 40.7128
DEFAULT_LON = -74.0060

# Initialize Hugging Face pipeline
# You can change the model to any text generation model available on Hugging Face
generator = pipeline('text-generation', model="gpt2")  # You can use other models like "facebook/opt-350m"

def send_email(subject: str, message: str):
    try:
        sender_email = os.getenv("EMAIL_USER", "example@gmail.com")
        receiver_email = os.getenv("STORE_EMAIL", "store@example.com")
        password = os.getenv("EMAIL_PASS", "your_password")

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
    
    prompt = f"""
    Given the following weather conditions:
    Temperature: {temp}°C
    Humidity: {humidity}%
    Conditions: {conditions}
    
    Provide brief, practical recommendations for plant care and crop management.
    """
    
    # Use Hugging Face pipeline for text generation
    result = generator(prompt, max_length=250, num_return_sequences=1)
    
    # Extract the generated text
    response = result[0]['generated_text']
    
    # Try to extract only the recommendation part (after the prompt)
    if len(response) > len(prompt):
        response = response[len(prompt):].strip()
    
    return response

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

        # Get plant care recommendations if there are alerts
        recommendations = ""
        if alerts:
            recommendations = await get_plant_care_recommendations(weather_data)
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
            "alerts": alerts
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