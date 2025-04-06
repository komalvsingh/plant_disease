import React, { useState, useEffect } from 'react';
import { Bell, Cloud, Droplets, MapPin, Leaf, Sun, Wind, ArrowLeft } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import WeatherCard from '../components/card';
import WeatherAlert from '../components/alert';

// Fix leaflet marker icons
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
  const navigate = useNavigate();
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
  const [plantName, setPlantName] = useState('');
  const [locationInput, setLocationInput] = useState('');
  
  // Map related states
  const [mapCenter, setMapCenter] = useState([12.9716, 77.5946]); // Default coordinates
  const [markerPosition, setMarkerPosition] = useState(null);
  const [isMapVisible, setIsMapVisible] = useState(false);

  // Navigate back to home page
  const goToHomePage = () => {
    navigate('/');
  };

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
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
      );
      const data = await response.json();
  
      if (data.length > 0) {
        const { lat, lon } = data[0];
        const parsedLat = parseFloat(lat);
        const parsedLon = parseFloat(lon);
        
        // Update map center and marker
        setMapCenter([parsedLat, parsedLon]);
        setMarkerPosition([parsedLat, parsedLon]);
        
        // Update user location state
        setUserLocation({
          lat: parsedLat,
          lon: parsedLon
        });
        
        // Fetch weather data for the new location
        fetchWeatherData({
          lat: parsedLat,
          lon: parsedLon
        });
      }
    } catch (error) {
      setError('Error finding location: ' + error.message);
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
      const response = await fetch('http://127.0.0.1:8001/api/weather-alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lat: location.lat,
          lon: location.lon,
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

  // Handle plant name change
  const handlePlantNameChange = (e) => {
    setPlantName(e.target.value);
  };

  if (loading && !isMapVisible) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-green-50 to-green-100">
        <div className="text-lg font-medium text-green-800">Loading weather data...</div>
      </div>
    );
  }

  const weatherMetrics = [
    {
      icon: Sun,
      label: 'Temperature',
      value: weatherData.temperature,
      unit: '°C',
      color: 'bg-amber-50 border-amber-200 text-amber-700'
    },
    {
      icon: Droplets,
      label: 'Humidity',
      value: weatherData.humidity,
      unit: '%',
      color: 'bg-blue-50 border-blue-200 text-blue-700'
    },
    {
      icon: Wind,
      label: 'Wind Speed',
      value: weatherData.windSpeed,
      unit: ' km/h',
      color: 'bg-slate-50 border-slate-200 text-slate-700'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 relative">
      {/* Navigation Bar - Full Width */}
      <nav className="p-4 bg-white shadow-md relative z-10 w-full">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button 
              className="p-2 hover:bg-green-50 rounded-full"
              onClick={goToHomePage}
            >
              <ArrowLeft className="w-6 h-6 text-green-600" />
            </button>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="ml-3 text-green-800 font-bold text-xl">Weather Alerts</span>
                <div className="ml-3 text-xs text-green-600">Real-time weather updates for your crops</div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto max-w-6xl p-4 md:p-8">
        <div className="rounded-xl border border-green-100 bg-white shadow-lg overflow-hidden">
          <div className="p-6 md:p-8">
           

            {/* Location and Plant Input Form */}
            <div className="mb-8 p-5 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 shadow-sm">
              <h3 className="text-lg font-medium mb-4 text-green-800 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-green-600" />
                Set Location & Crop
              </h3>
              <form onSubmit={handleLocationSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        id="location"
                        value={locationInput}
                        onChange={(e) => setLocationInput(e.target.value)}
                        placeholder="Enter city, address or region"
                        className="flex-grow px-4 py-2 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                      />
                      <button 
                        type="submit"
                        className="px-5 py-2 bg-green-600 text-white rounded-r-md hover:bg-green-700 transition-colors focus:ring-2 focus:ring-green-700 focus:ring-offset-2"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="plantName" className="block text-sm font-medium text-gray-700 mb-2">
                      Plant/Crop Name
                    </label>
                    <input
                      type="text"
                      id="plantName"
                      value={plantName}
                      onChange={handlePlantNameChange}
                      placeholder="Enter plant or crop name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* Map Display */}
            {isMapVisible && (
              <div className="mb-8 rounded-lg overflow-hidden border border-gray-300 shadow-sm">
                <div className="h-72 md:h-80">
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
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6">
                <WeatherAlert
                  type="warning"
                  title="Error"
                  description={error}
                />
              </div>
            )}

            {/* Weather Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
              {weatherMetrics.map((metric, index) => (
                <div 
                  key={index} 
                  className={`p-5 rounded-lg border shadow-sm flex items-center ${metric.color} transition-all hover:shadow-md`}
                >
                  <div className="mr-4 p-3 rounded-full bg-white bg-opacity-70">
                    <metric.icon className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">{metric.label}</div>
                    <div className="text-2xl font-bold">{metric.value}{metric.unit}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Current Plant/Crop Info */}
            {plantName && (
              <div className="mb-8 p-5 bg-gradient-to-r from-green-100 to-green-50 rounded-lg border border-green-200 shadow-sm flex items-center">
                <div className="p-3 bg-white rounded-full mr-4">
                  <Leaf className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <span className="font-medium text-green-800">Current Plant/Crop</span>
                  <div className="text-xl font-semibold text-green-700">{plantName}</div>
                </div>
              </div>
            )}

            {/* Weather Alerts Section */}
            <div className="space-y-5 mb-8">
              <h3 className="text-xl font-semibold text-green-800 flex items-center border-b border-green-100 pb-3">
                <Cloud className="h-6 w-6 mr-2 text-green-600" />
                Current Alerts
              </h3>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherAlertsDashboard;