import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/carditems';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/selectitems';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/tabsitems';
import { Info, TrendingUp, DollarSign, BarChart3, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MarketDashboard = () => {
  const navigate = useNavigate();
  const [crops, setCrops] = useState(['Wheat', 'Rice', 'Corn', 'Soybeans', 'Potatoes']);
  const [markets, setMarkets] = useState(['Local Market', 'Wholesale Hub', 'Export Terminal', 'Processing Plant', 'Farmers Market']);
  const [selectedCrop, setSelectedCrop] = useState('Wheat');
  const [selectedMarket, setSelectedMarket] = useState('Wholesale Hub');
  const [priceData, setPriceData] = useState([]);
  const [marketComparison, setMarketComparison] = useState([]);
  const [forecast, setForecast] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [activeTab, setActiveTab] = useState('trends');

  const goToHomePage = () => {
    navigate('/');
  };

  // Simulated API calls - in a real application, these would fetch from the backend
  useEffect(() => {
    // Simulate price data fetch
    const fetchPriceData = () => {
      // This would be an actual API call in production
      fetch(`/api/prices?crop=${selectedCrop}&market=${selectedMarket}`)
        .then(res => res.json())
        .then(data => {
          // Format dates for display
          const formattedData = data.map(item => ({
            ...item,
            date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          }));
          setPriceData(formattedData.slice(-30)); // Last 30 days
        })
        .catch(err => {
          console.error("Error fetching price data:", err);
          // For demo purposes, generate mock data
          const mockData = generateMockPriceData(selectedCrop, selectedMarket);
          setPriceData(mockData);
        });
    };

    // Simulate market comparison fetch
    const fetchMarketComparison = () => {
      fetch(`/api/market_comparison?crop=${selectedCrop}`)
        .then(res => res.json())
        .then(data => {
          setMarketComparison(data);
        })
        .catch(err => {
          console.error("Error fetching market comparison:", err);
          // For demo purposes, generate mock data
          const mockData = generateMockMarketComparison(selectedCrop);
          setMarketComparison(mockData);
        });
    };

    // Simulate forecast fetch
    const fetchForecast = () => {
      fetch(`/api/forecast?crop=${selectedCrop}&market=${selectedMarket}&days=14`)
        .then(res => res.json())
        .then(data => {
          // Format dates for display
          const formattedData = data.map(item => ({
            ...item,
            date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          }));
          setForecast(formattedData);
        })
        .catch(err => {
          console.error("Error fetching forecast:", err);
          // For demo purposes, generate mock data
          const mockData = generateMockForecast(selectedCrop, selectedMarket);
          setForecast(mockData);
        });
    };

    // Simulate recommendations fetch
    const fetchRecommendations = () => {
      fetch(`/api/recommendations?crop=${selectedCrop}`)
        .then(res => res.json())
        .then(data => {
          setRecommendations(data);
        })
        .catch(err => {
          console.error("Error fetching recommendations:", err);
          // For demo purposes, generate mock data
          const mockData = generateMockRecommendations(selectedCrop);
          setRecommendations(mockData);
        });
    };

    fetchPriceData();
    fetchMarketComparison();
    fetchForecast();
    fetchRecommendations();
  }, [selectedCrop, selectedMarket]);

  // Mock data generation functions for demo purposes
  const generateMockPriceData = (crop, market) => {
    const data = [];
    const basePrice = getBasePriceForCrop(crop);
    const today = new Date();
    
    for (let i = 30; i >= 1; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      // Add some randomness and a slight trend
      const randomFactor = 0.9 + Math.random() * 0.2;
      const trendFactor = 1 + (i / 100);
      
      data.push({
        date: formattedDate,
        market: market,
        price: Math.round(basePrice * randomFactor * trendFactor),
        volume: Math.floor(Math.random() * 400) + 100
      });
    }
    
    return data;
  };

  const generateMockMarketComparison = (crop) => {
    const basePrice = getBasePriceForCrop(crop);
    
    return markets.map(market => {
      // Different markets have different price levels
      let marketFactor;
      if (market === 'Local Market') marketFactor = 0.9;
      else if (market === 'Wholesale Hub') marketFactor = 1.0;
      else if (market === 'Export Terminal') marketFactor = 1.15;
      else if (market === 'Processing Plant') marketFactor = 1.05;
      else marketFactor = 1.1; // Farmers Market
      
      const randomFactor = 0.95 + Math.random() * 0.1;
      
      return {
        market: market,
        price: Math.round(basePrice * marketFactor * randomFactor),
        volume: Math.floor(Math.random() * 500) + 100,
        demand: Math.random() > 0.6 ? 'High' : Math.random() > 0.3 ? 'Medium' : 'Low'
      };
    });
  };

  const generateMockForecast = (crop, market) => {
    const data = [];
    const basePrice = getBasePriceForCrop(crop);
    let marketFactor;
    
    if (market === 'Local Market') marketFactor = 0.9;
    else if (market === 'Wholesale Hub') marketFactor = 1.0;
    else if (market === 'Export Terminal') marketFactor = 1.15;
    else if (market === 'Processing Plant') marketFactor = 1.05;
    else marketFactor = 1.1; // Farmers Market
    
    const today = new Date();
    let trendDirection = Math.random() > 0.5 ? 1 : -1;
    let lastPrice = basePrice * marketFactor;
    
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      // Create a slight trend with noise
      const randomNoise = Math.random() * 100 - 50;
      const trend = trendDirection * (i * 5);
      lastPrice = lastPrice + trend + randomNoise;
      
      // Ensure price doesn't go too low
      if (lastPrice < basePrice * 0.7) {
        lastPrice = basePrice * 0.7;
        trendDirection = 1;
      }
      
      // Ensure price doesn't go too high
      if (lastPrice > basePrice * 1.3) {
        lastPrice = basePrice * 1.3;
        trendDirection = -1;
      }
      
      data.push({
        date: formattedDate,
        predicted_price: Math.round(lastPrice)
      });
    }
    
    return data;
  };

  const generateMockRecommendations = (crop) => {
    const marketInsights = markets.map(market => {
      const priceChange = (Math.random() * 20) - 10;
      const trend = priceChange > 2 ? 'Rising' : priceChange < -2 ? 'Falling' : 'Stable';
      const basePrice = getBasePriceForCrop(crop);
      
      let marketFactor;
      if (market === 'Local Market') marketFactor = 0.9;
      else if (market === 'Wholesale Hub') marketFactor = 1.0;
      else if (market === 'Export Terminal') marketFactor = 1.15;
      else if (market === 'Processing Plant') marketFactor = 1.05;
      else marketFactor = 1.1; // Farmers Market
      
      const currentPrice = Math.round(basePrice * marketFactor * (1 + priceChange/100));
      
      let recommendation;
      if (trend === 'Rising' && priceChange > 5) recommendation = 'Consider selling now';
      else if (trend === 'Rising') recommendation = 'Hold if possible';
      else if (trend === 'Falling' && priceChange < -5) recommendation = 'Sell quickly';
      else recommendation = 'Standard market conditions';
      
      return {
        market,
        current_price: currentPrice,
        trend,
        change: Math.round(priceChange * 10) / 10,
        recommendation
      };
    });
    
    // Find best price market
    const bestPriceMarket = marketInsights.reduce((prev, current) => 
      (prev.current_price > current.current_price) ? prev : current
    );
    
    // Find trending market
    const trendingMarket = marketInsights.reduce((prev, current) => 
      (Math.abs(current.change) > Math.abs(prev.change)) ? current : prev
    );
    
    return {
      best_price_market: {
        market: bestPriceMarket.market,
        price: bestPriceMarket.current_price,
        reason: `Currently offers the highest price for ${crop}`
      },
      trending_market: {
        market: trendingMarket.market,
        price: trendingMarket.current_price,
        price_change: trendingMarket.change,
        reason: `Prices trending ${trendingMarket.trend.toLowerCase()} over the last month`
      },
      market_insights: marketInsights
    };
  };

  const getBasePriceForCrop = (crop) => {
    switch (crop) {
      case 'Wheat': return 1800;
      case 'Rice': return 2200;
      case 'Corn': return 1600;
      case 'Soybeans': return 3500;
      case 'Potatoes': return 1200;
      default: return 2000;
    }
  };

  const getTrendColor = (change) => {
    if (change > 0) return 'text-green-500';
    if (change < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  const getDemandColor = (demand) => {
    if (demand === 'High') return 'text-green-500';
    if (demand === 'Low') return 'text-red-500';
    return 'text-yellow-500';
  };

  return (
    <div className="p-4 min-h-screen bg-gradient-to-b from-green-50 to-green-100">
      {/* Back button */}
      <button 
          onClick={goToHomePage}
          className="flex items-center p-2 bg-green-50 hover:bg-green-100 rounded-full"
        >
          <ArrowLeft className="w-6 h-6 text-green-600" />

        </button>

      <div className="flex justify-between items-center mb-6">
        <div className='my-5'>
          <h1 className="text-4xl font-bold text-green-800">Agricultural Market Analysis Dashboard</h1>
        </div>
    
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium text-green-900 mb-1">Crop</label>
            <Select value={selectedCrop} onValueChange={setSelectedCrop}>
              <SelectTrigger className="w-40 bg-green-700 text-white">
                <SelectValue placeholder="Select Crop" />
              </SelectTrigger>
              <SelectContent className="bg-white text-slate-800">
                {crops.map(crop => (
                  <SelectItem 
                  key={crop} 
                  value={crop}
                  className="hover:bg-gray-100 focus:bg-gray-100"
                  >
                    {crop}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-green-900 mb-1">Market</label>
            <Select value={selectedMarket} onValueChange={setSelectedMarket}>
              <SelectTrigger className="w-40 bg-green-700 text-white">
                <SelectValue placeholder="Select Market" />
              </SelectTrigger>
              <SelectContent className="bg-white text-slate-800 ">
                {markets.map(market => (
                  <SelectItem
                   key={market} 
                   value={market}
                   className="hover:bg-gray-100 focus:bg-gray-100"
                   >
                    {market}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {recommendations && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="bg-white shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                Best Price Opportunity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">{recommendations.best_price_market.market}</h3>
                  <p className="text-gray-600">{recommendations.best_price_market.reason}</p>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  ₹{recommendations.best_price_market.price}/quintal
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                Market with Significant Movement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">{recommendations.trending_market.market}</h3>
                  <p className="text-gray-600">{recommendations.trending_market.reason}</p>
                </div>
                <div>
                  <div className="text-2xl font-bold">₹{recommendations.trending_market.price}/quintal</div>
                  <div className={`text-right ${getTrendColor(recommendations.trending_market.price_change)}`}>
                    {recommendations.trending_market.price_change > 0 ? '↑' : '↓'} {Math.abs(recommendations.trending_market.price_change)}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="trends" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="trends" className="flex items-center">
            <BarChart3 className="w-4 h-4 mr-2" />
            Price Trends
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center">
            <BarChart3 className="w-4 h-4 mr-2" />
            Market Comparison
          </TabsTrigger>
          <TabsTrigger value="forecast" className="flex items-center">
            <TrendingUp className="w-4 h-4 mr-2" />
            Price Forecast
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2" />
            AI Recommendations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          <Card className="bg-white shadow">
            <CardHeader>
              <CardTitle>Price Trends for {selectedCrop} - {selectedMarket}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={priceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={['auto', 'auto']} />
                    <Tooltip formatter={(value) => [`₹${value}`, 'Price']} />
                    <Legend />
                    <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} dot={false} name="Price (₹/quintal)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison">
          <Card className="bg-white shadow">
            <CardHeader>
              <CardTitle>Market Comparison for {selectedCrop}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={marketComparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="market" />
                    <YAxis domain={['auto', 'auto']} />
                    <Tooltip formatter={(value) => [`₹${value}`, 'Price']} />
                    <Legend />
                    <Bar dataKey="price" fill="#3b82f6" name="Price (₹/quintal)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Detailed Market Information</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Market</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (₹/quintal)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume (quintals)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Demand</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {marketComparison.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">{item.market}</td>
                          <td className="px-6 py-4 whitespace-nowrap">₹{item.price}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{item.volume}</td>
                          <td className={`px-6 py-4 whitespace-nowrap font-medium ${getDemandColor(item.demand)}`}>{item.demand}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecast">
          <Card className="bg-white shadow">
            <CardHeader>
              <CardTitle>14-Day Price Forecast for {selectedCrop} - {selectedMarket}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={forecast}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={['auto', 'auto']} />
                    <Tooltip formatter={(value) => [`₹${value}`, 'Predicted Price']} />
                    <Legend />
                    <Line type="monotone" dataKey="predicted_price" stroke="#10b981" strokeWidth={2} name="Predicted Price (₹/quintal)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-start">
                  <Info className="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-blue-800">About This Forecast</h4>
                    <p className="text-sm text-blue-700">
                      This AI-powered forecast is based on historical price patterns, seasonal trends, and market movements. 
                      Accuracy tends to decrease for predictions further in the future. Always consider current market news 
                      and unexpected events that may affect prices.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations">
          <Card className="bg-white shadow">
            <CardHeader>
              <CardTitle>AI-Powered Market Recommendations for {selectedCrop}</CardTitle>
            </CardHeader>
            <CardContent>
              {recommendations && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendations.market_insights.map((insight, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-lg">{insight.market}</h3>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            insight.trend === 'Rising' ? 'bg-green-100 text-green-800' : 
                            insight.trend === 'Falling' ? 'bg-red-100 text-red-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {insight.trend}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div>
                            <p className="text-gray-500 text-sm">Current Price</p>
                            <p className="font-bold">₹{insight.current_price}/quintal</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-sm">30-Day Change</p>
                            <p className={`font-bold ${getTrendColor(insight.change)}`}>
                              {insight.change > 0 ? '+' : ''}{insight.change}%
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-gray-500 text-sm">Recommendation</p>
                          <p className="font-medium">{insight.recommendation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                    <div className="flex">
                      <AlertTriangle className="w-5 h-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber-800">Important Considerations</h4>
                        <p className="text-sm text-amber-700">
                          These recommendations are based on historical data analysis and market trends. Always consider additional 
                          factors like transportation costs, quality requirements, storage capacity, and local market conditions 
                          before making selling decisions.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketDashboard;