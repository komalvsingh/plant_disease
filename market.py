# app.py - Flask Backend
from flask import Flask, jsonify, request
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from datetime import datetime, timedelta
import requests
import json
from concurrent.futures import ThreadPoolExecutor
import time

app = Flask(__name__)

# Cache for API data to reduce API calls
CACHE = {}
CACHE_TTL = 3600  # Cache time-to-live in seconds

# USDA NASS Quick Stats API - no token required for basic requests
# Documentation: https://quickstats.nass.usda.gov/api
BASE_API_URL = "https://quickstats.nass.usda.gov/api"

def fetch_from_api_with_cache(params=None):
    """Fetch data from NASS API with caching"""
    cache_key = f"nass_api_{json.dumps(params) if params else 'no_params'}"
    
    # Check if we have a fresh cache
    if cache_key in CACHE and (time.time() - CACHE[cache_key]['timestamp']) < CACHE_TTL:
        return CACHE[cache_key]['data']
    
    # Make API request to NASS
    url = f"{BASE_API_URL}/api_GET/"
    
    # Format parameters for NASS API
    if not params:
        params = {}
    
    # Add essential parameters
    params['format'] = 'JSON'
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()  # Raise an exception for HTTP errors
        data = response.json()
        
        # Cache the result
        CACHE[cache_key] = {
            'data': data,
            'timestamp': time.time()
        }
        
        return data
    except requests.exceptions.RequestException as e:
        print(f"API request failed: {e}")
        # Print more details about the error
        if hasattr(e, 'response') and e.response:
            print(f"Response status: {e.response.status_code}")
            print(f"Response text: {e.response.text}")
        return None

def get_crop_prices(crop_name, start_year=None, end_year=None):
    """Get price data for a specific crop"""
    # Map common crop names to NASS commodity names
    crop_map = {
        'Wheat': 'WHEAT',
        'Rice': 'RICE',
        'Corn': 'CORN',
        'Soybeans': 'SOYBEANS',
        'Potatoes': 'POTATOES'
    }
    
    commodity = crop_map.get(crop_name, crop_name.upper())
    
    # If no year range specified, use last 5 years
    if not start_year or not end_year:
        current_year = datetime.now().year
        end_year = current_year - 1  # NASS data usually has a lag
        start_year = end_year - 4    # 5 years including end_year
    
    # Format parameters for NASS API
    params = {
        'commodity_desc': commodity,
        'statisticcat_desc': 'PRICE RECEIVED',
        'agg_level_desc': 'STATE',
        'year__GE': start_year,
        'year__LE': end_year,
        'format': 'JSON'
    }
    
    # Call NASS API
    result = fetch_from_api_with_cache(params)
    
    if not result or 'data' not in result or not result['data']:
        print(f"No price data found for {crop_name} from NASS API")
        return None
    
    # Process the data into our expected format
    processed_data = []
    for item in result['data']:
        try:
            # Extract relevant fields
            state = item.get('state_name', 'National')
            year = item.get('year', '')
            period = item.get('reference_period_desc', '')
            price = item.get('Value', '')
            unit = item.get('unit_desc', '')
            
            # Skip entries without price
            if not price:
                continue
                
            # Convert price to float
            try:
                price_value = float(price.replace(',', ''))
            except (ValueError, AttributeError):
                continue
                
            # Create processed record
            # Use period (month or quarter) to create an approximate date
            if period in ['YEAR', 'MARKETING YEAR']:
                date_str = f"{year}-01-01"  # Default to Jan 1 for yearly data
            else:
                # Try to parse month or quarter
                if period in ['JAN', 'JANUARY']:
                    date_str = f"{year}-01-15"
                elif period in ['FEB', 'FEBRUARY']:
                    date_str = f"{year}-02-15"
                elif period in ['MAR', 'MARCH']:
                    date_str = f"{year}-03-15"
                elif period in ['APR', 'APRIL']:
                    date_str = f"{year}-04-15"
                elif period in ['MAY']:
                    date_str = f"{year}-05-15"
                elif period in ['JUN', 'JUNE']:
                    date_str = f"{year}-06-15"
                elif period in ['JUL', 'JULY']:
                    date_str = f"{year}-07-15"
                elif period in ['AUG', 'AUGUST']:
                    date_str = f"{year}-08-15"
                elif period in ['SEP', 'SEPTEMBER']:
                    date_str = f"{year}-09-15"
                elif period in ['OCT', 'OCTOBER']:
                    date_str = f"{year}-10-15"
                elif period in ['NOV', 'NOVEMBER']:
                    date_str = f"{year}-11-15"
                elif period in ['DEC', 'DECEMBER']:
                    date_str = f"{year}-12-15"
                elif 'QUARTER' in period:
                    if '1' in period:
                        date_str = f"{year}-02-15"  # Mid Q1
                    elif '2' in period:
                        date_str = f"{year}-05-15"  # Mid Q2
                    elif '3' in period:
                        date_str = f"{year}-08-15"  # Mid Q3
                    elif '4' in period:
                        date_str = f"{year}-11-15"  # Mid Q4
                    else:
                        date_str = f"{year}-01-01"  # Default
                else:
                    date_str = f"{year}-01-01"  # Default
            
            # Use state as a proxy for different markets
            processed_data.append({
                'date': date_str,
                'crop': crop_name,
                'market': state if state else 'National Average',
                'price': price_value,
                'volume': 100,  # NASS doesn't provide volume, using placeholder
                'unit': unit,
                'demand': 'Medium'  # Placeholder
            })
                
        except Exception as e:
            print(f"Error processing item: {e}")
            continue
    
    if not processed_data:
        return None
        
    return pd.DataFrame(processed_data)

def get_available_crops():
    """Get list of common agricultural commodities"""
    # These are verified commodities that should return data from NASS
    common_crops = [
        'Wheat', 'Corn', 'Soybeans', 'Rice', 'Cotton', 
        'Barley', 'Oats', 'Sorghum', 'Peanuts', 'Potatoes'
    ]
    
    # Try to get more from API (this is optional and may not succeed)
    try:
        params = {
            'statisticcat_desc': 'PRICE RECEIVED',
            'format': 'JSON'
        }
        result = fetch_from_api_with_cache(params)
        
        if result and 'data' in result:
            # Extract unique commodities
            api_crops = set()
            for item in result['data']:
                commodity = item.get('commodity_desc')
                if commodity and isinstance(commodity, str) and len(commodity) < 30:
                    api_crops.add(commodity.title())
            
            # Return combination of common crops and API crops
            return list(set(common_crops) | api_crops)
    except:
        pass
        
    # Fallback to common crops list
    return common_crops

# Data storage
DATA_CACHE = {}

@app.route('/api/crops', methods=['GET'])
def get_crops():
    # Get crops from NASS API or use common list
    crops = get_available_crops()
    return jsonify(crops)

@app.route('/api/markets', methods=['GET'])
def get_markets():
    crop = request.args.get('crop', default='Corn')
    
    # Get data for the crop
    if crop not in DATA_CACHE:
        data = get_crop_prices(crop)
        if data is not None:
            DATA_CACHE[crop] = data
    
    if crop in DATA_CACHE:
        df = DATA_CACHE[crop]
        markets = df['market'].unique().tolist()
        return jsonify(markets)
    else:
        # Fallback to states as markets
        return jsonify(['Iowa', 'Illinois', 'Nebraska', 'Minnesota', 'Indiana', 'National Average'])

@app.route('/api/prices', methods=['GET'])
def get_prices():
    crop = request.args.get('crop', default='Corn')
    market = request.args.get('market', default=None)
    
    # Get data for the crop
    if crop not in DATA_CACHE:
        data = get_crop_prices(crop)
        if data is not None:
            DATA_CACHE[crop] = data
    
    if crop not in DATA_CACHE:
        return jsonify([])  # No data available
    
    df = DATA_CACHE[crop]
    
    # Filter data
    filtered_data = df[df['crop'] == crop]
    if market and market != 'All Markets':
        filtered_data = filtered_data[filtered_data['market'] == market]
    
    # Group by date and market
    filtered_data['date'] = pd.to_datetime(filtered_data['date'])
    result = filtered_data.groupby(['date', 'market']).agg({
        'price': 'mean',
        'volume': 'sum'
    }).reset_index()
    
    # Convert date to string format for JSON
    result['date'] = result['date'].dt.strftime('%Y-%m-%d')
    
    # Convert to list of records
    return jsonify(result.to_dict(orient='records'))

@app.route('/api/market_comparison', methods=['GET'])
def get_market_comparison():
    crop = request.args.get('crop', default='Corn')
    
    # Get data for the crop
    if crop not in DATA_CACHE:
        data = get_crop_prices(crop)
        if data is not None:
            DATA_CACHE[crop] = data
    
    if crop not in DATA_CACHE:
        return jsonify([])  # No data available
    
    df = DATA_CACHE[crop]
    
    # Filter data for the specified crop
    filtered_data = df[df['crop'] == crop]
    
    # Get the most recent data for each market
    filtered_data['date'] = pd.to_datetime(filtered_data['date'])
    recent_date = filtered_data['date'].max()
    
    # Find data within 3 months of most recent date (NASS data can be sparse)
    date_threshold = recent_date - pd.Timedelta(days=90)
    recent_data = filtered_data[filtered_data['date'] >= date_threshold]
    
    if recent_data.empty:
        return jsonify([])
    
    # Get average price by market
    result = recent_data.groupby('market').agg({
        'price': 'mean',
        'volume': 'sum',
        'demand': lambda x: x.iloc[0]  # Just take the first value
    }).reset_index()
    
    return jsonify(result.to_dict(orient='records'))

@app.route('/api/forecast', methods=['GET'])
def get_forecast():
    crop = request.args.get('crop', default='Corn')
    market = request.args.get('market', default='National Average')
    days = int(request.args.get('days', default=30))
    
    # Get data for the crop
    if crop not in DATA_CACHE:
        data = get_crop_prices(crop)
        if data is not None:
            DATA_CACHE[crop] = data
    
    if crop not in DATA_CACHE:
        return jsonify([])  # No data available
    
    df = DATA_CACHE[crop]
    
    # Filter data
    filtered_data = df[(df['crop'] == crop)]
    
    # If market specified, filter for that market, otherwise use national data
    if market and market != 'All Markets':
        market_data = filtered_data[filtered_data['market'] == market]
        if market_data.empty:
            # Fall back to national data if specified market has no data
            market_data = filtered_data[filtered_data['market'] == 'National Average']
            if market_data.empty:
                # If still no data, use all data
                market_data = filtered_data
    else:
        # Get national average or all data
        market_data = filtered_data[filtered_data['market'] == 'National Average']
        if market_data.empty:
            market_data = filtered_data
    
    if market_data.empty:
        return jsonify([])
    
    # Prepare data for forecasting
    df_forecast = market_data.copy()
    df_forecast['date'] = pd.to_datetime(df_forecast['date'])
    df_forecast = df_forecast.sort_values('date')
    
    # Extract features
    df_forecast['day_of_year'] = df_forecast['date'].dt.dayofyear
    df_forecast['month'] = df_forecast['date'].dt.month
    df_forecast['year'] = df_forecast['date'].dt.year
    df_forecast['days_from_start'] = (df_forecast['date'] - df_forecast['date'].min()).dt.days
    
    # Handle lag features carefully since data might be sparse
    df_forecast['price_lag'] = df_forecast['price'].shift(1)
    df_forecast['price_lag'] = df_forecast['price_lag'].fillna(df_forecast['price'].mean())
    
    # Create features and target
    X = df_forecast[['month', 'year', 'days_from_start', 'price_lag']].values
    y = df_forecast['price'].values
    
    if len(X) < 5:  # Too little data for reliable forecasting
        # Simple projection based on last known price
        last_date = df_forecast['date'].max()
        last_price = df_forecast['price'].iloc[-1]
        
        forecast = []
        for i in range(days):
            forecast_date = last_date + timedelta(days=i+1)
            forecast.append({
                'date': forecast_date.strftime('%Y-%m-%d'),
                'predicted_price': last_price
            })
        
        return jsonify(forecast)
    
    # Train a model with sufficient data
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)
    
    # Generate forecast dates
    last_date = df_forecast['date'].max()
    future_dates = [last_date + timedelta(days=i+1) for i in range(days)]
    
    # Initialize with last known values
    last_price = df_forecast['price'].iloc[-1]
    
    # Make predictions
    forecast = []
    for i, date in enumerate(future_dates):
        days_from_start = (date - df_forecast['date'].min()).days
        
        # Create features for prediction
        features = np.array([
            date.month,  
            date.year,
            days_from_start,
            last_price
        ]).reshape(1, -1)
        
        # Predict
        predicted_price = model.predict(features)[0]
        
        # Update for next iteration
        last_price = predicted_price
        
        # Add to forecast
        forecast.append({
            'date': date.strftime('%Y-%m-%d'),
            'predicted_price': round(predicted_price, 2)
        })
    
    return jsonify(forecast)

@app.route('/api/recommendations', methods=['GET'])
def get_recommendations():
    crop = request.args.get('crop', default='Corn')
    
    # Get data for the crop
    if crop not in DATA_CACHE:
        data = get_crop_prices(crop)
        if data is not None:
            DATA_CACHE[crop] = data
    
    if crop not in DATA_CACHE:
        return jsonify({
            'error': 'No data available for this crop'
        })
    
    df = DATA_CACHE[crop]
    
    # Filter data
    filtered_data = df[df['crop'] == crop]
    filtered_data['date'] = pd.to_datetime(filtered_data['date'])
    
    if filtered_data.empty:
        return jsonify({
            'error': 'No data available for analysis'
        })
    
    # Get most recent date and data from last 6 months for trend analysis
    recent_date = filtered_data['date'].max()
    six_months_ago = recent_date - pd.Timedelta(days=180)
    trend_data = filtered_data[filtered_data['date'] >= six_months_ago]
    
    market_trends = {}
    for market in trend_data['market'].unique():
        market_data = trend_data[trend_data['market'] == market]
        
        if len(market_data) < 2:
            continue  # Skip markets with insufficient data points
        
        market_data = market_data.sort_values('date')
        
        # Check if we have enough data points for trend analysis
        if len(market_data) >= 2:
            # Calculate price change percentage
            first_data = market_data.iloc[0]
            last_data = market_data.iloc[-1]
            
            first_price = first_data['price']
            last_price = last_data['price']
            
            price_change = ((last_price - first_price) / first_price) * 100
            
            market_trends[market] = {
                'current_price': float(last_price),
                'price_change_pct': round(price_change, 2),
                'trend': 'Rising' if price_change > 2 else 'Falling' if price_change < -2 else 'Stable',
                'last_updated': last_data['date'].strftime('%Y-%m-%d')
            }
    
    if not market_trends:
        return jsonify({
            'error': 'Insufficient trend data for analysis'
        })
    
    # Find best market based on current price and trend
    best_market = max(market_trends.items(), key=lambda x: x[1]['current_price'])
    trending_market = max(market_trends.items(), key=lambda x: x[1]['price_change_pct'])
    
    # Generate recommendations
    recommendations = {
        'best_price_market': {
            'market': best_market[0],
            'price': best_market[1]['current_price'],
            'reason': f"Currently offers the highest price for {crop}"
        },
        'trending_market': {
            'market': trending_market[0],
            'price': trending_market[1]['current_price'],
            'price_change': trending_market[1]['price_change_pct'],
            'reason': f"Prices trending {trending_market[1]['trend'].lower()} over the last 6 months"
        },
        'market_insights': [
            {
                'market': market,
                'current_price': data['current_price'],
                'trend': data['trend'],
                'change': data['price_change_pct'],
                'last_updated': data['last_updated'],
                'recommendation': 'Consider selling now' if data['trend'] == 'Rising' and data['price_change_pct'] > 5 
                               else 'Hold if possible' if data['trend'] == 'Rising' 
                               else 'Sell quickly' if data['trend'] == 'Falling' and data['price_change_pct'] < -5
                               else 'Standard market conditions'
            }
            for market, data in market_trends.items()
        ]
    }
    
    return jsonify(recommendations)

if __name__ == '__main__':
    app.run(debug=True)