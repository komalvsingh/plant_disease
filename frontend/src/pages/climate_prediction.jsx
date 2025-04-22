import React, { useState, useEffect } from 'react';
import { Bell, Cloud, Droplets, MapPin, Leaf, Sun, Wind, ArrowLeft, Calendar, Info, AlertTriangle, Mountain, Sprout } from 'lucide-react';
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

// Improved recommendation formatter to create proper bullet points
const formatRecommendationText = (text) => {
  if (!text || text === "Not available") return "Information not available";

  // Process multiline text with numerical points, bullets, or asterisks
  const lines = text.split(/\n|\*\*|\*/g).filter(line => line.trim().length > 0);
  
  // Format each line
  const formattedLines = lines.map(line => {
    line = line.trim();
    
    // Skip empty lines and section headers
    if (!line || line.endsWith(':') || line.endsWith(':**')) return '';
    
    // Clean up the line
    line = line.replace(/^\d+\.|\s-\s|•\s|^\s*\*\s*/g, '').trim();
    return `<li>${line}</li>`;
  }).filter(line => line.length > 0);

  return `<ul class="list-disc pl-5 space-y-2">${formattedLines.join('')}</ul>`;
};

// Parse plant recommendations into a structured format
const parsePlantRecommendations = (text) => {
  if (!text || text === "Not available") return [];
  
  const plantRegex = /\*\*(.*?)\*\*\s*\*\s*Suitable for these conditions because:\s*(.*?)\s*\*\s*Care tip:\s*(.*?)\s*\*\s*Soil requirements:\s*(.*?)(?=\d+\.\s*\*\*|\*\*|$)/gs;
  const plants = [];
  let match;
  
  while ((match = plantRegex.exec(text)) !== null) {
    plants.push({
      name: match[1].replace(/^\d+\.\s*/, '').trim(),
      suitability: match[2].trim(),
      careTip: match[3].trim(),
      soilRequirements: match[4].trim()
    });
  }
  
  return plants;
};

// Create a card component for plant recommendations
const PlantRecommendationCard = ({ plant, index }) => {
  return (
    <div className="p-4 bg-white rounded-lg border border-green-200 shadow-sm hover:shadow transition-shadow">
      <h4 className="text-lg font-medium text-green-800 mb-2">{index + 1}. {plant.name}</h4>
      <div className="space-y-3 text-sm">
        <div>
          <span className="font-medium text-gray-700">Suitability:</span>
          <p className="text-gray-600 mt-1">{plant.suitability}</p>
        </div>
        <div>
          <span className="font-medium text-gray-700">Care Tip:</span>
          <p className="text-gray-600 mt-1">{plant.careTip}</p>
        </div>
        <div>
          <span className="font-medium text-gray-700">Soil Requirements:</span>
          <p className="text-gray-600 mt-1">{plant.soilRequirements}</p>
        </div>
      </div>
    </div>
  );
};

// Parse soil recommendations into structured format
const parseSoilManagement = (text) => {
  if (!text || text === "Not available") return {};
  
  // Extract key sections
  const improvementMatch = text.match(/\*\*Soil improvement suggestions:\*\*(.*?)(?=\*\*|$)/s);
  const amendmentsMatch = text.match(/\*\*Amendments that might benefit crops:\*\*(.*?)(?=\*\*|$)/s);
  const phAdjustmentMatch = text.match(/\*\*pH adjustment recommendations if needed:\*\*(.*?)(?=\*\*|$)/s);
  const organicMatterMatch = text.match(/\*\*Organic matter management tips:\*\*(.*?)(?=\*\*|$)/s);
  
  return {
    improvements: improvementMatch ? improvementMatch[1].trim() : "",
    amendments: amendmentsMatch ? amendmentsMatch[1].trim() : "",
    phAdjustment: phAdjustmentMatch ? phAdjustmentMatch[1].trim() : "",
    organicMatter: organicMatterMatch ? organicMatterMatch[1].trim() : ""
  };
};

// Parse seasonal planning into structured format
const parseSeasonalPlanning = (text) => {
  if (!text || text === "Not available") return [];
  
  const seasonRegex = /\*\*(Spring|Summer|Fall|Winter)\s*\((.*?)\)\*\*\s*\*\s*Recommended crops:\s*(.*?)\s*\*\s*Preparation activities needed:\s*(.*?)\s*\*\s*Potential challenges to anticipate:\s*(.*?)\s*\*\s*Soil preparation needed for seasonal transitions:\s*(.*?)(?=\*\*|$)/gs;
  const seasons = [];
  let match;
  
  while ((match = seasonRegex.exec(text)) !== null) {
    seasons.push({
      name: match[1],
      period: match[2],
      crops: match[3].trim(),
      preparations: match[4].trim(),
      challenges: match[5].trim(),
      soilPrep: match[6].trim()
    });
  }
  
  return seasons;
};

// Create a card component for seasonal recommendations
const SeasonCard = ({ season }) => {
  let bgColor = "bg-green-50";
  let borderColor = "border-green-200";
  let textColor = "text-green-800";
  
  switch(season.name.toLowerCase()) {
    case 'summer':
      bgColor = "bg-amber-50";
      borderColor = "border-amber-200";
      textColor = "text-amber-800";
      break;
    case 'fall':
      bgColor = "bg-orange-50";
      borderColor = "border-orange-200";
      textColor = "text-orange-800";
      break;
    case 'winter':
      bgColor = "bg-blue-50";
      borderColor = "border-blue-200";
      textColor = "text-blue-800";
      break;
  }
  
  return (
    <div className={`p-5 ${bgColor} rounded-lg ${borderColor} shadow-sm mb-4`}>
      <h4 className={`text-lg font-semibold mb-3 ${textColor}`}>{season.name} ({season.period})</h4>
      <div className="space-y-3">
        <div>
          <span className="font-medium text-gray-700">Recommended Crops:</span>
          <p className="text-gray-600 mt-1">{season.crops}</p>
        </div>
        <div>
          <span className="font-medium text-gray-700">Preparation Activities:</span>
          <p className="text-gray-600 mt-1">{season.preparations}</p>
        </div>
        <div>
          <span className="font-medium text-gray-700">Potential Challenges:</span>
          <p className="text-gray-600 mt-1">{season.challenges}</p>
        </div>
        <div>
          <span className="font-medium text-gray-700">Soil Preparation:</span>
          <p className="text-gray-600 mt-1">{season.soilPrep}</p>
        </div>
      </div>
    </div>
  );
};

// Recommendation section component for consistent styling
const RecommendationSection = ({ title, content, icon: Icon, bgColor = "bg-green-50", borderColor = "border-green-200", textColor = "text-green-800" }) => {
  return (
    <div className={`mb-6 p-5 rounded-lg border shadow-sm ${bgColor} ${borderColor}`}>
      <h3 className={`text-lg font-semibold mb-3 flex items-center ${textColor}`}>
        <Icon className="h-5 w-5 mr-2 text-green-600" />
        {title}
      </h3>
      <div className="text-sm leading-relaxed space-y-2 recommendation-content" 
        dangerouslySetInnerHTML={{ __html: formatRecommendationText(content) }} />
    </div>
  );
};

const WeatherAlertsDashboard = () => {
  const navigate = useNavigate();
  const [weatherData, setWeatherData] = useState({
    temperature: 0,
    humidity: 0,
    windSpeed: 0,
    conditions: '',
    alerts: [],
    currentCareRecommendations: '',
    currentPlantRecommendations: '',
    soilRecommendations: '',
    seasonalPlanning: '',
    soilAnalysis: {},
    currentSeason: '',
    seasonsForecast: []
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

  // Tab state for recommendations sections
  const [activeTab, setActiveTab] = useState('current');

  // Parsed recommendations
  const [parsedPlantRecommendations, setParsedPlantRecommendations] = useState([]);
  const [parsedSoilManagement, setParsedSoilManagement] = useState({});
  const [parsedSeasonalPlanning, setParsedSeasonalPlanning] = useState([]);

  // Navigate back to home page
  const goToHomePage = () => {
    navigate('/');
  };

  // Process recommendations whenever weather data changes
  useEffect(() => {
    if (weatherData.currentPlantRecommendations) {
      setParsedPlantRecommendations(parsePlantRecommendations(weatherData.currentPlantRecommendations));
    }
    if (weatherData.soilRecommendations) {
      setParsedSoilManagement(parseSoilManagement(weatherData.soilRecommendations));
    }
    if (weatherData.seasonalPlanning) {
      setParsedSeasonalPlanning(parseSeasonalPlanning(weatherData.seasonalPlanning));
    }
  }, [weatherData]);

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
        alerts: data.alerts || [],
        currentCareRecommendations: data.currentCareRecommendations || '',
        currentPlantRecommendations: data.currentPlantRecommendations || '',
        soilRecommendations: data.soilRecommendations || '',
        seasonalPlanning: data.seasonalPlanning || '',
        soilAnalysis: data.soilAnalysis || {},
        currentSeason: data.currentSeason || '',
        seasonsForecast: data.seasonsForecast || []
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

  // Handle plant name change and refetch data
  const handlePlantNameChange = (e) => {
    setPlantName(e.target.value);
  };

  const handlePlantSubmit = () => {
    if (userLocation.lat && userLocation.lon) {
      fetchWeatherData();
    }
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
      <nav className="p-4 bg-white shadow-md sticky top-0 z-50 w-full">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <form onSubmit={handleLocationSubmit} className="space-y-4">
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
                </form>

                <div className="space-y-4">
                  <label htmlFor="plantName" className="block text-sm font-medium text-gray-700 mb-2">
                    Plant/Crop Name
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      id="plantName"
                      value={plantName}
                      onChange={handlePlantNameChange}
                      placeholder="Enter plant or crop name"
                      className="flex-grow px-4 py-2 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    />
                    <button 
                      onClick={handlePlantSubmit}
                      className="px-5 py-2 bg-green-600 text-white rounded-r-md hover:bg-green-700 transition-colors focus:ring-2 focus:ring-green-700 focus:ring-offset-2"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Display */}
            {isMapVisible && (
              <div className="mb-8 rounded-lg overflow-hidden border border-gray-300 shadow-sm">
                <div className="h-64">
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

            {/* Weather Metrics and Current Season */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
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
              
              {/* Current Season */}
              <div className="p-5 rounded-lg border shadow-sm bg-purple-50 border-purple-200 text-purple-700 flex items-center transition-all hover:shadow-md">
                <div className="mr-4 p-3 rounded-full bg-white bg-opacity-70">
                  <Calendar className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Current Season</div>
                  <div className="text-2xl font-bold">{weatherData.currentSeason || "Unknown"}</div>
                </div>
              </div>
            </div>

            {/* Current Plant/Crop Info and Conditions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Current Plant */}
              {plantName && (
                <div className="p-5 bg-gradient-to-r from-green-100 to-green-50 rounded-lg border border-green-200 shadow-sm flex items-center">
                  <div className="p-3 bg-white rounded-full mr-4">
                    <Leaf className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <span className="font-medium text-green-800">Current Plant/Crop</span>
                    <div className="text-xl font-semibold text-green-700">{plantName}</div>
                  </div>
                </div>
              )}
              
              {/* Weather Conditions */}
              <div className="p-5 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 shadow-sm flex items-center">
                <div className="p-3 bg-white rounded-full mr-4">
                  <Cloud className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <span className="font-medium text-blue-800">Weather Conditions</span>
                  <div className="text-xl font-semibold text-blue-700">{weatherData.conditions || "Unknown"}</div>
                </div>
              </div>
            </div>

            {/* Soil Analysis Section */}
            {weatherData.soilAnalysis && Object.keys(weatherData.soilAnalysis).length > 0 && (
              <div className="mb-8 p-5 bg-amber-50 rounded-lg border border-amber-200 shadow-sm">
                <h3 className="text-lg font-semibold mb-4 text-amber-800 flex items-center">
                  <Mountain className="h-5 w-5 mr-2 text-amber-600" />
                  Soil Analysis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-white bg-opacity-60 rounded-md">
                    <div className="text-sm font-medium text-amber-700">Soil Type</div>
                    <div className="text-base font-bold text-amber-900">{weatherData.soilAnalysis.estimated_soil_type || "Unknown"}</div>
                  </div>
                  <div className="p-3 bg-white bg-opacity-60 rounded-md">
                    <div className="text-sm font-medium text-amber-700">Soil pH</div>
                    <div className="text-base font-bold text-amber-900">{weatherData.soilAnalysis.estimated_soil_ph || "Unknown"}</div>
                  </div>
                  <div className="p-3 bg-white bg-opacity-60 rounded-md">
                    <div className="text-sm font-medium text-amber-700">Organic Matter</div>
                    <div className="text-base font-bold text-amber-900">{weatherData.soilAnalysis.estimated_organic_matter || "Unknown"}</div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-amber-600 italic">
                  {weatherData.soilAnalysis.notes || "Note: These are estimates based on geographical and climate data. For accurate analysis, conduct a local soil test."}
                </div>
              </div>
            )}

            {/* Weather Alerts Section */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-red-800 flex items-center border-b border-red-100 pb-3 mb-4">
                <AlertTriangle className="h-6 w-6 mr-2 text-red-600" />
                Weather Alerts
              </h3>
              <div className="space-y-4">
                {weatherData.alerts && weatherData.alerts.filter(alert => alert.type === 'warning').length > 0 ? (
                  weatherData.alerts.filter(alert => alert.type === 'warning').map((alert, index) => (
                    <WeatherAlert
                      key={index}
                      type="warning"
                      title="Warning"
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

            {/* Recommendations Tabs */}
            <div className="mb-6 border-b border-gray-200">
              <div className="flex flex-wrap -mb-px">
                <button
                  className={`inline-flex items-center px-4 py-3 font-medium text-sm ${
                    activeTab === 'current'
                      ? 'border-b-2 border-green-600 text-green-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('current')}
                >
                  <Leaf className="w-5 h-5 mr-2" />
                  Current Care
                </button>
                <button
                  className={`inline-flex items-center px-4 py-3 font-medium text-sm ${
                    activeTab === 'plants'
                      ? 'border-b-2 border-green-600 text-green-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('plants')}
                >
                  <Droplets className="w-5 h-5 mr-2" />
                  Suitable Plants
                </button>
                <button
                  className={`inline-flex items-center px-4 py-3 font-medium text-sm ${
                    activeTab === 'soil'
                      ? 'border-b-2 border-green-600 text-green-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('soil')}
                >
                  <Sprout className="w-5 h-5 mr-2" />
                  Soil Management
                </button>
                <button
                  className={`inline-flex items-center px-4 py-3 font-medium text-sm ${
                    activeTab === 'seasons'
                      ? 'border-b-2 border-green-600 text-green-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('seasons')}
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Seasonal Plans
                </button>
              </div>
            </div>

            {/* Recommendation Content Based on Active Tab */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
              {activeTab === 'current' && (
                <RecommendationSection 
                  title="Current Plant Care Recommendations" 
                  content={weatherData.currentCareRecommendations} 
                  icon={Leaf}
                  bgColor="bg-green-50"
                  borderColor="border-green-100"
                />
              )}
              
              {activeTab === 'plants' && (
                <>
                  <h3 className="text-lg font-semibold mb-5 text-blue-800 flex items-center">
                    <Droplets className="h-5 w-5 mr-2 text-blue-600" />
                    Recommended Plants for Current Conditions
                  </h3>
                  
                  {parsedPlantRecommendations.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {parsedPlantRecommendations.map((plant, index) => (
                        <PlantRecommendationCard key={index} plant={plant} index={index} />
                      ))}
                    </div>
                  ) : (
                    <RecommendationSection 
                      title="Recommended Plants for Current Conditions" 
                      content={weatherData.currentPlantRecommendations} 
                      icon={Droplets}
                      bgColor="bg-blue-50"
                      borderColor="border-blue-100"
                      textColor="text-blue-800"
                    />
                  )}
                </>
              )}
              
              {activeTab === 'soil' && (
                <>
                  {Object.keys(parsedSoilManagement).length > 0 ? (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold mb-4 text-amber-800 flex items-center">
                        <Sprout className="h-5 w-5 mr-2 text-amber-600" />
                        Soil Management Recommendations
                      </h3>
                      
                      {parsedSoilManagement.improvements && (
                        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                          <h4 className="font-medium text-amber-800 mb-2">Soil Improvement Suggestions</h4>
                          <p className="text-amber-700">{parsedSoilManagement.improvements}</p>
                        </div>
                      )}
                      
                      {parsedSoilManagement.amendments && (
                        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                          <h4 className="font-medium text-amber-800 mb-2">Beneficial Amendments</h4>
                          <p className="text-amber-700">{parsedSoilManagement.amendments}</p>
                        </div>
                      )}
                      
                      {parsedSoilManagement.phAdjustment && (
                        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                          <h4 className="font-medium text-amber-800 mb-2">pH Adjustment Recommendations</h4>
                          <p className="text-amber-700">{parsedSoilManagement.phAdjustment}</p>
                        </div>
                      )}
                      
                      {parsedSoilManagement.organicMatter && (
                        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                          <h4 className="font-medium text-amber-800 mb-2">Organic Matter Management</h4>
                          <p className="text-amber-700">{parsedSoilManagement.organicMatter}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <RecommendationSection 
                      title="Soil Management Recommendations" 
                      content={weatherData.soilRecommendations} 
                      icon={Sprout}
                      bgColor="bg-amber-50"
                      borderColor="border-amber-100"
                      textColor="text-amber-800"
                    />
                  )}
                </>
              )}
              
              {activeTab === 'seasons' && (
                <div>
                  {parsedSeasonalPlanning.length > 0 ? (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold mb-4 text-purple-800 flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                        Seasonal Planning & Future Crops
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {parsedSeasonalPlanning.map((season, index) => (
                          <SeasonCard key={index} season={season} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <RecommendationSection 
                      title="Seasonal Planning & Future Crops" 
                      content={weatherData.seasonalPlanning} 
                      icon={Calendar}
                      bgColor="bg-purple-50"
                      borderColor="border-purple-100"
                      textColor="text-purple-800"
                    />
                  )}
                  
                  {/* Season Timeline */}
                  {weatherData.seasonsForecast && weatherData.seasonsForecast.length > 0 && (
                    <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
                      <h4 className="text-md font-medium mb-3 text-gray-700">Season Timeline</h4>
                      <div className="flex flex-col space-y-4">
                        {weatherData.seasonsForecast.map((season, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <div className={`p-2 rounded-full ${
                              index === 0 ? 'bg-green-100' : index === 1 ? 'bg-blue-100' : 'bg-purple-100'
                            }`}>
                              <Calendar className={`h-5 w-5 ${
                                index === 0 ? 'text-green-600' : index === 1 ? 'text-blue-600' : 'text-purple-600'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{season.season} ({season.start_date} to {season.end_date})</div>
                              <div className="text-sm text-gray-600 mt-1">{season.description}</div>
                              <div className="text-sm text-gray-700 mt-1 font-medium">Common Activities:</div>
                              <div className="text-sm text-gray-600">{season.typical_agricultural_activities}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Information Notes */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm text-gray-600">
              <div className="flex items-start">
                <Info className="h-5 w-5 mr-2 text-gray-500 mt-0.5" />
                <div>
                  <p>This dashboard combines real-time weather data with agricultural expertise to provide customized recommendations for your farming activities.</p>
                  <p className="mt-2">For most accurate results, specify your crop type and ensure your location is set correctly on the map.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add CSS for styling the recommendation content */}
      <style jsx>{`
        .recommendation-content ul {
          margin-left: 1.5rem;
          list-style-type: disc;
        }
        .recommendation-content li {
          margin-bottom: 0.5rem;
        }
        .recommendation-content p {
          margin-bottom: 0.75rem;
        }
      `}</style>
    </div>
  );
};

export default WeatherAlertsDashboard;