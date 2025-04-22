from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import requests
import json
import os
from email.mime.text import MIMEText
import smtplib
from typing import Dict, List
import uvicorn
from datetime import datetime, timedelta

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

def get_weather_forecast(lat: float = DEFAULT_LAT, lon: float = DEFAULT_LON) -> Dict:
    # Get 5-day forecast data
    api_key = os.getenv("OPENWEATHER_API_KEY", OPENWEATHER_API_KEY)
    url = f"http://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={api_key}&units=metric"
    
    print(f"Forecast API URL: {url}")
    
    response = requests.get(url)
    data = response.json()
    
    return data

def analyze_soil_by_location(lat: float, lon: float) -> Dict:
    # In a real application, this would call a soil database API
    # For now, we'll use the weather and location data to make educated guesses about soil
    
    weather_data = check_weather(lat, lon)
    location = weather_data.get('name', 'Unknown')
    country_code = weather_data.get('sys', {}).get('country', 'Unknown')
    
    # Get average annual rainfall and temperature data (simplified approach)
    # In a real app, you'd use historical weather data or a soil database
    
    # For demonstration purposes - simplified soil analysis based on climate zones
    climate_temp = weather_data['main']['temp']
    
    # Simple soil type estimation based on latitude and temperature
    # This is a simplified model - a real application would use actual soil databases
    if lat > 50 or lat < -50:  # High latitudes
        soil_type = "Podzolic soils (acidic, leached soils common in colder regions)"
        soil_ph = "4.5 - 5.5 (acidic)"
        organic_matter = "High in forest areas, low in open areas"
    elif 30 < lat < 50 or -50 < lat < -30:  # Mid latitudes
        soil_type = "Brown earth or forest soils"
        soil_ph = "5.5 - 7.0 (slightly acidic to neutral)"
        organic_matter = "Medium to high"
    elif -30 < lat < 30:  # Tropical/subtropical
        if climate_temp > 25:  # Hot climate
            soil_type = "Lateritic soil (tropical soils, often red and clay-rich)"
            soil_ph = "4.5 - 6.0 (acidic)"
            organic_matter = "Low to medium (rapid decomposition)"
        else:  # More temperate
            soil_type = "Alluvial or volcanic soils"
            soil_ph = "6.0 - 7.5 (slightly acidic to slightly alkaline)"
            organic_matter = "Medium to high"
    
    return {
        "location": location,
        "country": country_code,
        "estimated_soil_type": soil_type,
        "estimated_soil_ph": soil_ph,
        "estimated_organic_matter": organic_matter,
        "notes": "These are estimates based on geographical and climate data. For accurate soil analysis, conduct a local soil test."
    }

def get_current_season(lat: float) -> str:
    # Determine the current season based on date and hemisphere
    current_month = datetime.now().month
    northern_hemisphere = lat > 0
    
    if northern_hemisphere:
        if 3 <= current_month <= 5:
            return "Spring"
        elif 6 <= current_month <= 8:
            return "Summer"
        elif 9 <= current_month <= 11:
            return "Fall"
        else:
            return "Winter"
    else:  # Southern hemisphere
        if 3 <= current_month <= 5:
            return "Fall"
        elif 6 <= current_month <= 8:
            return "Winter"
        elif 9 <= current_month <= 11:
            return "Spring"
        else:
            return "Summer"

def get_next_season(current_season: str) -> str:
    seasons = ["Winter", "Spring", "Summer", "Fall"]
    current_index = seasons.index(current_season)
    next_index = (current_index + 1) % 4
    return seasons[next_index]

def get_seasons_forecast(lat: float) -> List[Dict]:
    current_season = get_current_season(lat)
    next_season = get_next_season(current_season)
    upcoming_season = get_next_season(next_season)
    
    # Calculate the approximate months for each season
    current_date = datetime.now()
    
    # Define season start months (Northern Hemisphere)
    season_months = {
        "Winter": [12, 1, 2],
        "Spring": [3, 4, 5],
        "Summer": [6, 7, 8],
        "Fall": [9, 10, 11]
    }
    
    # Adjust for Southern Hemisphere if needed
    if lat < 0:
        shifted_seasons = {
            "Winter": "Summer",
            "Spring": "Fall",
            "Summer": "Winter",
            "Fall": "Spring"
        }
        season_months = {shifted_seasons[k]: v for k, v in season_months.items()}
    
    # Helper function to estimate season dates
    def get_season_dates(season_name):
        months = season_months[season_name]
        year = current_date.year
        
        # Handle December case (may need to be next year)
        if months[0] == 12 and current_date.month < 12:
            start_month = months[0]
            start_year = year
        elif months[0] < current_date.month:
            start_month = months[0]
            start_year = year + 1
        else:
            start_month = months[0]
            start_year = year
            
        start_date = datetime(start_year, start_month, 1)
        end_month = months[-1]
        end_year = start_year if end_month >= start_month else start_year + 1
        # Set to last day of month
        if end_month == 12:
            end_date = datetime(end_year, end_month, 31)
        elif end_month in [4, 6, 9, 11]:
            end_date = datetime(end_year, end_month, 30)
        elif end_month == 2:
            # Simple leap year check
            if end_year % 4 == 0 and (end_year % 100 != 0 or end_year % 400 == 0):
                end_date = datetime(end_year, end_month, 29)
            else:
                end_date = datetime(end_year, end_month, 28)
        else:
            end_date = datetime(end_year, end_month, 31)
        
        return start_date, end_date
    
    # Get seasonal information
    seasons_info = []
    
    for season in [current_season, next_season, upcoming_season]:
        start_date, end_date = get_season_dates(season)
        
        # General season description
        if season == "Winter":
            description = "Cold temperatures with potential for frost or snow. Reduced daylight hours."
            agricultural_activities = "Planning, tool maintenance, soil analysis, cold frame gardening"
        elif season == "Spring":
            description = "Warming temperatures, increased rainfall, last frost dates passing."
            agricultural_activities = "Planting, soil preparation, seedling transplantation, early harvests"
        elif season == "Summer":
            description = "Warm to hot temperatures, longer daylight hours, potential for dry periods."
            agricultural_activities = "Regular irrigation, pest management, continuous harvesting, heat protection"
        else:  # Fall
            description = "Cooling temperatures, decreasing daylight, potential for early frost."
            agricultural_activities = "Final harvests, soil amendments, cover crops, winter preparation"
            
        seasons_info.append({
            "season": season,
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": end_date.strftime("%Y-%m-%d"),
            "description": description,
            "typical_agricultural_activities": agricultural_activities
        })
    
    return seasons_info

async def get_plant_recommendations(weather_data: Dict, forecast_data: Dict = None, soil_data: Dict = None, seasons_forecast: List = None) -> Dict:
    temp = weather_data['main']['temp']
    humidity = weather_data['main']['humidity'] 
    conditions = weather_data['weather'][0]['description']
    wind_speed = weather_data['wind']['speed']
    location_name = weather_data['name'] if 'name' in weather_data else "your area"
    
    # Extract forecast data if available
    forecast_summary = "Not available"
    if forecast_data and 'list' in forecast_data:
        # Process 5-day forecast for a summary
        temps = [day['main']['temp'] for day in forecast_data['list'][:8]]  # First 24 hours (8 3-hour intervals)
        conditions_list = [day['weather'][0]['main'] for day in forecast_data['list'][:8]]
        avg_temp = sum(temps) / len(temps)
        common_condition = max(set(conditions_list), key=conditions_list.count)
        forecast_summary = f"Next 24 hours: Average temp {avg_temp:.1f}°C with mostly {common_condition.lower()} conditions"
    
    # Build soil information string if available
    soil_info = "Not available"
    if soil_data:
        soil_info = f"Estimated soil type: {soil_data['estimated_soil_type']}\nEstimated soil pH: {soil_data['estimated_soil_ph']}\nOrganic matter content: {soil_data['estimated_organic_matter']}"
    
    # Build seasonal information
    seasonal_info = "Not available"
    if seasons_forecast:
        current_season = seasons_forecast[0]['season']
        next_season = seasons_forecast[1]['season']
        upcoming_season = seasons_forecast[2]['season']
        
        seasonal_info = f"""Current season: {current_season} ({seasons_forecast[0]['start_date']} to {seasons_forecast[0]['end_date']})
Next season: {next_season} ({seasons_forecast[1]['start_date']} to {seasons_forecast[1]['end_date']})
Upcoming season: {upcoming_season} ({seasons_forecast[2]['start_date']} to {seasons_forecast[2]['end_date']})"""
    
    # Create a more structured prompt with clear section markers
    prompt = f"""Given the current and forecasted weather conditions in {location_name}:

CURRENT CONDITIONS:
- Temperature: {temp}°C
- Humidity: {humidity}%
- Wind Speed: {wind_speed} m/s
- Conditions: {conditions}

FORECAST:
{forecast_summary}

SOIL INFORMATION:
{soil_info}

SEASONAL INFORMATION:
{seasonal_info}

Provide the following clearly labeled sections with these exact headings:

PART 1: CURRENT PLANT CARE RECOMMENDATIONS
Provide specific, actionable recommendations for agricultural practices and plant care based on current conditions.
Include short, practical advice on:
1. Irrigation needs
2. Potential pest or disease risks
3. Crop protection measures
4. Optimal timing for agricultural activities

PART 2: SUITABLE PLANTS FOR CURRENT CONDITIONS
Recommend 5-7 specific plants or crops that would thrive in the current conditions. 
For each recommended plant, include:
- Plant name
- Why it's suitable for these conditions
- One care tip specific to the current weather
- Appropriate soil requirements

PART 3: SOIL MANAGEMENT RECOMMENDATIONS
Based on the estimated soil information, provide:
1. Soil improvement suggestions
2. Amendments that might benefit crops
3. pH adjustment recommendations if needed
4. Organic matter management tips

PART 4: SEASONAL PLANNING
For each of the upcoming seasons, recommend:
1. 3-5 crops suitable for planting in that season in this region
2. Preparation activities needed
3. Potential challenges to anticipate
4. Soil preparation needed for seasonal transitions

IMPORTANT: Keep responses concise and practical for immediate implementation. Format with clear headings and bullet points for easy reading.
"""
    
    # Call Groq API for recommendations
    groq_api_key = os.getenv("GROQ_API_KEY", GROQ_API_KEY)
    if not groq_api_key:
        return {
            "current_care_recommendations": "Error: Groq API key not configured. Please set the GROQ_API_KEY environment variable.",
            "current_plant_recommendations": [],
            "soil_recommendations": "Not available",
            "seasonal_planning": "Not available"
        }
    
    headers = {
        "Authorization": f"Bearer {groq_api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "llama3-8b-8192",  # You can use "llama3-70b-8192" for more advanced recommendations
        "messages": [
            {"role": "system", "content": "You are an agricultural expert providing actionable advice for farmers based on weather conditions, soil information, and seasonal forecasts. You provide well-structured, clearly formatted responses with practical recommendations. Always follow the requested format exactly."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.5,
        "max_tokens": 1500
    }
    
    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=payload
        )
        
        if response.status_code == 200:
            response_data = response.json()
            full_recommendations = response_data["choices"][0]["message"]["content"]
            
            # Parse the sections - using improved parsing logic
            section_markers = [
                "PART 1: CURRENT PLANT CARE RECOMMENDATIONS",
                "PART 2: SUITABLE PLANTS FOR CURRENT CONDITIONS",
                "PART 3: SOIL MANAGEMENT RECOMMENDATIONS", 
                "PART 4: SEASONAL PLANNING"
            ]
            
            # Initialize sections
            sections = {
                "current_care_recommendations": "Not available",
                "current_plant_recommendations": "Not available",
                "soil_recommendations": "Not available",
                "seasonal_planning": "Not available"
            }
            
            # Extract content between section markers
            for i, marker in enumerate(section_markers):
                if marker in full_recommendations:
                    start_idx = full_recommendations.find(marker) + len(marker)
                    
                    # Find end index (next section or end of text)
                    end_idx = len(full_recommendations)
                    for next_marker in section_markers[i+1:]:
                        next_idx = full_recommendations.find(next_marker)
                        if next_idx != -1:
                            end_idx = next_idx
                            break
                    
                    section_content = full_recommendations[start_idx:end_idx].strip()
                    
                    # Map to the appropriate dictionary key
                    if i == 0:
                        sections["current_care_recommendations"] = section_content
                    elif i == 1:
                        sections["current_plant_recommendations"] = section_content  
                    elif i == 2:
                        sections["soil_recommendations"] = section_content
                    elif i == 3:
                        sections["seasonal_planning"] = section_content
            
            return sections
            
        else:
            print(f"Error from Groq API: {response.status_code}, {response.text}")
            return {
                "current_care_recommendations": f"Error getting recommendations: {response.status_code}",
                "current_plant_recommendations": "Unable to retrieve plant recommendations at this time.",
                "soil_recommendations": "Not available",
                "seasonal_planning": "Not available"
            }
    except Exception as e:
        print(f"Exception calling Groq API: {str(e)}")
        return {
            "current_care_recommendations": f"Error: {str(e)}",
            "current_plant_recommendations": "Unable to retrieve plant recommendations at this time.",
            "soil_recommendations": "Not available",
            "seasonal_planning": "Not available"
        }

@app.post("/api/weather-alerts")
async def create_weather_alert(background_tasks: BackgroundTasks, user_data: Dict = None):
    try:
        # Use default coordinates if none provided
        if user_data is None:
            user_data = {'lat': DEFAULT_LAT, 'lon': DEFAULT_LON}
        
        lat = user_data.get('lat', DEFAULT_LAT)
        lon = user_data.get('lon', DEFAULT_LON)
        
        # Get weather data
        weather_data = check_weather(lat, lon)
        
        # Get forecast data
        forecast_data = get_weather_forecast(lat, lon)
        
        # Get soil analysis
        soil_data = analyze_soil_by_location(lat, lon)
        
        # Get seasonal forecast
        seasons_forecast = get_seasons_forecast(lat)
        
        # Extract relevant weather information
        temp = weather_data['main']['temp']
        humidity = weather_data['main']['humidity']
        wind_speed = weather_data['wind']['speed']
        conditions = weather_data['weather'][0]['description']
        location_name = weather_data.get('name', 'your location')
        
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

        # Get plant care and plant type recommendations using Groq
        recommendations = await get_plant_recommendations(
            weather_data, 
            forecast_data, 
            soil_data, 
            seasons_forecast
        )
        
        # Add care recommendations to alerts
        alerts.append({
            'type': 'info',
            'message': f'Current Care Recommendations: {recommendations["current_care_recommendations"]}'
        })
        
        # Add plant recommendations to alerts
        alerts.append({
            'type': 'info',
            'message': f'Current Plant Recommendations: {recommendations["current_plant_recommendations"]}'
        })
        
        # Add soil recommendations
        alerts.append({
            'type': 'info',
            'message': f'Soil Management: {recommendations["soil_recommendations"]}'
        })
        
        # Add seasonal planning
        alerts.append({
            'type': 'info',
            'message': f'Seasonal Planning: {recommendations["seasonal_planning"]}'
        })

        # Send email if there are alerts
        if email_notifications:
            alert_subject = f"Weather Alert and Seasonal Forecast for Crops in {location_name}"
            alert_message = "\n\n".join([
                "WEATHER ALERTS:",
                "\n".join([f"- {alert}" for alert in email_notifications]),
                "CURRENT CARE RECOMMENDATIONS:",
                recommendations["current_care_recommendations"],
                "RECOMMENDED PLANTS FOR CURRENT CONDITIONS:",
                recommendations["current_plant_recommendations"],
                "SOIL MANAGEMENT RECOMMENDATIONS:",
                recommendations["soil_recommendations"],
                "SEASONAL PLANNING:",
                recommendations["seasonal_planning"],
                f"\nSOIL ANALYSIS FOR {location_name.upper()}:",
                f"Soil Type: {soil_data['estimated_soil_type']}",
                f"Soil pH: {soil_data['estimated_soil_ph']}",
                f"Organic Matter: {soil_data['estimated_organic_matter']}",
                soil_data['notes']
            ])
            
            background_tasks.add_task(send_email, alert_subject, alert_message)

        # Format the return data
        current_season = seasons_forecast[0]['season']
        
        return {
            "location": location_name,
            "temperature": temp,
            "humidity": humidity,
            "windSpeed": wind_speed,
            "conditions": conditions,
            "alerts": alerts,
            "currentCareRecommendations": recommendations["current_care_recommendations"],
            "currentPlantRecommendations": recommendations["current_plant_recommendations"],
            "soilRecommendations": recommendations["soil_recommendations"],
            "seasonalPlanning": recommendations["seasonal_planning"],
            "soilAnalysis": soil_data,
            "currentSeason": current_season,
            "seasonsForecast": seasons_forecast
        }

    except Exception as e:
        print(f"Error in weather alert creation: {str(e)}")
        return {
            "error": "Failed to process weather alert",
            "details": str(e)
        }

@app.get("/api/soil-analysis")
async def get_soil_analysis(lat: float = DEFAULT_LAT, lon: float = DEFAULT_LON):
    try:
        soil_data = analyze_soil_by_location(lat, lon)
        return soil_data
    except Exception as e:
        return {
            "error": "Failed to analyze soil data",
            "details": str(e)
        }

@app.get("/api/seasonal-forecast")
async def get_seasonal_forecast(lat: float = DEFAULT_LAT, lon: float = DEFAULT_LON):
    try:
        seasons_data = get_seasons_forecast(lat)
        return {"seasons": seasons_data}
    except Exception as e:
        return {
            "error": "Failed to generate seasonal forecast",
            "details": str(e)
        }

if __name__ == "__main__":
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8001,
        reload=True
    )