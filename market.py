# app.py - Flask Backend
from flask import Flask, jsonify, request
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from datetime import datetime, timedelta
import pickle
import os

app = Flask(__name__)

# Mock data generation (in a real app, you would connect to actual market data sources)
def generate_mock_data():
    crops = ['Wheat', 'Rice', 'Corn', 'Soybeans', 'Potatoes']
    markets = ['Local Market', 'Wholesale Hub', 'Export Terminal', 'Processing Plant', 'Farmers Market']
    
    # Create a date range for the last 12 months
    end_date = datetime.now()
    start_date = end_date - timedelta(days=365)
    dates = pd.date_range(start=start_date, end=end_date, freq='D')
    
    data = []
    
    for crop in crops:
        # Base price varies by crop
        if crop == 'Wheat':
            base_price = 1800
        elif crop == 'Rice':
            base_price = 2200
        elif crop == 'Corn':
            base_price = 1600
        elif crop == 'Soybeans':
            base_price = 3500
        else:  # Potatoes
            base_price = 1200
        
        for market in markets:
            # Market premiums/discounts
            if market == 'Local Market':
                market_factor = 0.9
            elif market == 'Wholesale Hub':
                market_factor = 1.0
            elif market == 'Export Terminal':
                market_factor = 1.15
            elif market == 'Processing Plant':
                market_factor = 1.05
            else:  # Farmers Market
                market_factor = 1.1
            
            for date in dates:
                # Add seasonality
                month = date.month
                season_factor = 1.0 + 0.1 * np.sin(2 * np.pi * (month - 3) / 12)
                
                # Add trend
                day_num = (date - start_date).days
                trend_factor = 1.0 + (day_num / 365) * 0.05
                
                # Add some randomness
                random_factor = np.random.normal(1, 0.03)
                
                price = base_price * market_factor * season_factor * trend_factor * random_factor
                volume = np.random.randint(50, 500) * market_factor
                
                data.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'crop': crop,
                    'market': market,
                    'price': round(price, 2),
                    'volume': int(volume),
                    'demand': 'High' if random_factor > 1.02 else 'Medium' if random_factor > 0.98 else 'Low'
                })
    
    return pd.DataFrame(data)

# Generate and cache data
DATA_DF = generate_mock_data()

@app.route('/api/crops', methods=['GET'])
def get_crops():
    crops = DATA_DF['crop'].unique().tolist()
    return jsonify(crops)

@app.route('/api/markets', methods=['GET'])
def get_markets():
    markets = DATA_DF['market'].unique().tolist()
    return jsonify(markets)

@app.route('/api/prices', methods=['GET'])
def get_prices():
    crop = request.args.get('crop', default='Wheat')
    market = request.args.get('market', default=None)
    
    filtered_data = DATA_DF[DATA_DF['crop'] == crop]
    if market:
        filtered_data = filtered_data[filtered_data['market'] == market]
    
    # Group by date and market
    result = filtered_data.groupby(['date', 'market']).agg({
        'price': 'mean',
        'volume': 'sum'
    }).reset_index()
    
    # Convert to list of records
    return jsonify(result.to_dict(orient='records'))

@app.route('/api/market_comparison', methods=['GET'])
def get_market_comparison():
    crop = request.args.get('crop', default='Wheat')
    
    # Filter data for the specified crop
    filtered_data = DATA_DF[DATA_DF['crop'] == crop]
    
    # Get the most recent date
    recent_date = pd.to_datetime(filtered_data['date']).max()
    recent_data = filtered_data[filtered_data['date'] == recent_date.strftime('%Y-%m-%d')]
    
    # Get average price by market
    result = recent_data.groupby('market').agg({
        'price': 'mean',
        'volume': 'sum',
        'demand': lambda x: x.mode()[0]
    }).reset_index()
    
    return jsonify(result.to_dict(orient='records'))

@app.route('/api/forecast', methods=['GET'])
def get_forecast():
    crop = request.args.get('crop', default='Wheat')
    market = request.args.get('market', default='Wholesale Hub')
    days = int(request.args.get('days', default=30))
    
    # Filter data for the specified crop and market
    filtered_data = DATA_DF[(DATA_DF['crop'] == crop) & (DATA_DF['market'] == market)]
    
    # Prepare data for forecasting
    df = filtered_data.copy()
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date')
    
    # Extract features
    df['day_of_week'] = df['date'].dt.dayofweek
    df['month'] = df['date'].dt.month
    df['day'] = df['date'].dt.day
    
    # Create target and features
    X = df[['day_of_week', 'month', 'day']].values
    y = df['price'].values
    
    # Train a model
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)
    
    # Generate future dates
    last_date = pd.to_datetime(df['date'].max())
    future_dates = [last_date + timedelta(days=i+1) for i in range(days)]
    
    # Create features for future dates
    future_X = np.array([[d.dayofweek, d.month, d.day] for d in future_dates])
    
    # Make predictions
    predictions = model.predict(future_X)
    
    # Prepare response
    forecast = []
    for i, date in enumerate(future_dates):
        forecast.append({
            'date': date.strftime('%Y-%m-%d'),
            'predicted_price': round(predictions[i], 2)
        })
    
    return jsonify(forecast)

@app.route('/api/recommendations', methods=['GET'])
def get_recommendations():
    crop = request.args.get('crop', default='Wheat')
    
    # Get recent data for the crop
    filtered_data = DATA_DF[DATA_DF['crop'] == crop]
    recent_date = pd.to_datetime(filtered_data['date']).max()
    recent_data = filtered_data[filtered_data['date'] == recent_date.strftime('%Y-%m-%d')]
    
    # Get price trends (last 30 days)
    last_month = recent_date - timedelta(days=30)
    trend_data = filtered_data[pd.to_datetime(filtered_data['date']) >= last_month]
    
    market_trends = {}
    for market in trend_data['market'].unique():
        market_data = trend_data[trend_data['market'] == market]
        market_data = market_data.sort_values('date')
        
        # Calculate price change percentage
        first_price = market_data.iloc[0]['price']
        last_price = market_data.iloc[-1]['price']
        price_change = ((last_price - first_price) / first_price) * 100
        
        market_trends[market] = {
            'current_price': last_price,
            'price_change_pct': round(price_change, 2),
            'trend': 'Rising' if price_change > 2 else 'Falling' if price_change < -2 else 'Stable'
        }
    
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
            'reason': f"Prices trending {trending_market[1]['trend'].lower()} over the last month"
        },
        'market_insights': [
            {
                'market': market,
                'current_price': data['current_price'],
                'trend': data['trend'],
                'change': data['price_change_pct'],
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