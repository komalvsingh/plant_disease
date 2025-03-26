import React, { useState, useEffect } from 'react';
import { Bell, Cloud, Droplets, MapPin, Leaf, Sun, Wind } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import WeatherCard from '../components/card';
import WeatherAlert from '../components/alert';

// Fix leaflet marker icons - same as in the land registration code
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Map click handler component
const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onMapClick([lat, lng]);
    },
  });
  return null;
};

const WeatherAlertsDashboard = () => {
  const [weatherData, setWeatherData] = useState({
    temperature: 0,
    humidity: 0,
    windSpeed: 0,
    conditions: '',
    alerts: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState({ lat: null, lon: null });
  const [userEmail, setUserEmail] = useState('');
  const [plantName, setPlantName] = useState('');
  const [locationInput, setLocationInput] = useState('');
  
  // Map related states
  const [mapCenter, setMapCenter] = useState([12.9716, 77.5946]); // Default coordinates
  const [markerPosition, setMarkerPosition] = useState(null);
  const [isMapVisible, setIsMapVisible] = useState(false);

  // Get user's location on initial load
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          };
          setUserLocation(newLocation);
          setMapCenter([newLocation.lat, newLocation.lon]);
          setMarkerPosition([newLocation.lat, newLocation.lon]);
          setIsMapVisible(true);
        },
        (error) => {
          setError("Unable to get location. Please enable location services or enter location manually.");
        }
      );
    }
  }, []);

  // Geocoding function to convert location name to coordinates
  const geocodeAddress = async (address) => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
      );
      const data = await response.json();

      if (data.length > 0) {
        const { lat, lon } = data[0];
        const parsedLat = parseFloat(lat);
        const parsedLon = parseFloat(lon);
        
        setMapCenter([parsedLat, parsedLon]);
        setMarkerPosition([parsedLat, parsedLon]);
        setUserLocation({
          lat: parsedLat,
          lon: parsedLon
        });
        setIsMapVisible(true);
        
        // Fetch weather data for the new location
        fetchWeatherData({
          lat: parsedLat,
          lon: parsedLon
        });
      } else {
        setError('Could not find the specified location. Please try a different search term.');
      }
    } catch (error) {
      setError('Error finding location: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle map clicks to update location
  const handleMapClick = (coords) => {
    setMarkerPosition(coords);
    setUserLocation({
      lat: coords[0],
      lon: coords[1]
    });
    
    // Fetch weather data for the new location
    fetchWeatherData({
      lat: coords[0],
      lon: coords[1]
    });
  };

  // Fetch weather data
  const fetchWeatherData = async (location = userLocation) => {
    try {
      setLoading(true);
      const response = await fetch('http://127.0.0.1:8000/api/weather-alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lat: location.lat,
          lon: location.lon,
          email: userEmail,
          plantName: plantName // Add plant name to the request
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }

      const data = await response.json();
      setWeatherData({
        temperature: data.temperature || 0,
        humidity: data.humidity || 0,
        windSpeed: data.windSpeed || 0,
        conditions: data.conditions || '',
        alerts: data.alerts || []
      });
    } catch (error) {
      setError('Error fetching weather data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when location is available
  useEffect(() => {
    if (userLocation.lat && userLocation.lon) {
      fetchWeatherData();
      // Set up polling every 5 minutes
      const interval = setInterval(() => fetchWeatherData(), 300000);
      return () => clearInterval(interval);
    }
  }, [userLocation]);

  // Handle form submission for location search
  const handleLocationSubmit = (e) => {
    e.preventDefault();
    if (locationInput.trim()) {
      geocodeAddress(locationInput);
    }
  };

  // Handle email change
  const handleEmailChange = (e) => {
    setUserEmail(e.target.value);
  };

  // Handle plant name change
  const handlePlantNameChange = (e) => {
    setPlantName(e.target.value);
  };

  if (loading && !isMapVisible) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading weather data...</div>
      </div>
    );
  }

  const weatherMetrics = [
    {
      icon: Sun,
      label: 'Temperature',
      value: weatherData.temperature,
      unit: '°C'
    },
    {
      icon: Droplets,
      label: 'Humidity',
      value: weatherData.humidity,
      unit: '%'
    },
    {
      icon: Wind,
      label: 'Wind Speed',
      value: weatherData.windSpeed,
      unit: ' km/h'
    }
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="rounded-lg border bg-card">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Bell className="h-6 w-6" />
            <h2 className="text-2xl font-semibold">Weather Alerts Dashboard</h2>
          </div>

          {/* Location and Plant Input Form */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-medium mb-3">Set Location & Crop</h3>
            <form onSubmit={handleLocationSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    placeholder="Enter city, address or region"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label htmlFor="plantName" className="block text-sm font-medium text-gray-700 mb-1">
                    Plant/Crop Name
                  </label>
                  <input
                    type="text"
                    id="plantName"
                    value={plantName}
                    onChange={handlePlantNameChange}
                    placeholder="Enter plant or crop name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email for Alerts (Optional)
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={userEmail}
                    onChange={handleEmailChange}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="flex items-end">
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    Update Location
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Map Display */}
          {isMapVisible && (
            <div className="mb-6 h-64 rounded-lg overflow-hidden border border-gray-300">
              <MapContainer
                center={mapCenter}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <MapClickHandler onMapClick={handleMapClick} />
                {markerPosition && <Marker position={markerPosition} />}
              </MapContainer>
              <p className="mt-2 text-xs text-gray-500 px-2">
                Click on the map to update location. Current coordinates: {userLocation.lat?.toFixed(4)}, {userLocation.lon?.toFixed(4)}
              </p>
            </div>
          )}

          {error && (
            <WeatherAlert
              type="warning"
              title="Error"
              description={error}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {weatherMetrics.map((metric, index) => (
              <WeatherCard
                key={index}
                icon={metric.icon}
                label={metric.label}
                value={metric.value}
                unit={metric.unit}
              />
            ))}
          </div>

          {plantName && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg flex items-center">
              <Leaf className="h-5 w-5 mr-2 text-green-600" />
              <span className="font-medium">Current Plant/Crop: <span className="text-green-700">{plantName}</span></span>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Current Alerts</h3>
            {weatherData.alerts.length > 0 ? (
              weatherData.alerts.map((alert, index) => (
                <WeatherAlert
                  key={index}
                  type={alert.type}
                  title="Weather Alert"
                  description={alert.message}
                />
              ))
            ) : (
              <WeatherAlert
                type="default"
                title="No Active Alerts"
                description={plantName ? `Weather conditions are currently favorable for your ${plantName}.` : "Weather conditions are currently favorable for your crops."}
              />
            )}
          </div>

          <div className="mt-6">
            <button 
              onClick={() => fetchWeatherData()}
              disabled={loading}
              className={`px-4 py-2 ${loading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded transition-colors`}
            >
              {loading ? 'Refreshing...' : 'Refresh Weather Data'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherAlertsDashboard;