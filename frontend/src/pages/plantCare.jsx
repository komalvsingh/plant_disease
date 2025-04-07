import React, { useEffect, useState } from "react";
import axios from "axios";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Instead of relying on process.env, use import.meta.env for Vite
const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || "YOUR_API_KEY_HERE";
const BASE_SEARCH_QUERY = "plant care, organic farming";
const MAX_RESULTS = 10;

const PlantCareVideos = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const goToHomePage = () => {
    navigate('/');
  };

  const categories = [
    { id: "all", name: "All Videos" },
    { id: "soil-health", name: "Soil Health" },
    { id: "crop-rotation", name: "Crop Rotation" },
    { id: "pest-management", name: "Pest Management" },
    { id: "irrigation", name: "Irrigation" },
    { id: "harvest-techniques", name: "Harvest Techniques" }
  ];

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        
        // Modify search query based on selected category
        const searchQuery = selectedCategory === "all" 
          ? BASE_SEARCH_QUERY 
          : `${BASE_SEARCH_QUERY}, ${selectedCategory.replace("-", " ")}`;
        
        const response = await axios.get(
          `https://www.googleapis.com/youtube/v3/search`, {
            params: {
              part: "snippet",
              maxResults: MAX_RESULTS,
              q: searchQuery,
              key: API_KEY,
              type: "video"
            }
          }
        );
        setVideos(response.data.items);
      } catch (error) {
        console.error("Error fetching videos:", error);
        setError("Failed to load videos. Please check your API key and try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Simple header */}
      <div className="bg-gradient-to-r from-green-700 to-green-500 text-white p-6 shadow-md">
        <div className="max-w-6xl mx-auto">
          {/* Back button */}
          <button 
            onClick={goToHomePage}
            className="flex items-center p-2 mb-4 bg-green-600 hover:bg-green-700 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h2 className="text-3xl font-bold">Explore Plant Care & Organic Farming Videos</h2>
          <p className="mt-2 opacity-90">Find helpful tutorials and tips for your garden or farm</p>
        </div>
      </div>

      {/* Category filter */}
      <div className="max-w-6xl mx-auto p-4 mt-4">
        <div className="overflow-x-auto pb-2">
          <div className="flex space-x-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-all duration-300 ${
                  selectedCategory === category.id 
                    ? "bg-green-600 text-white shadow-md" 
                    : "bg-white text-green-800 border border-green-300 hover:bg-green-100"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center p-8">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mr-2"></div>
          <p>Loading {selectedCategory !== "all" ? selectedCategory.replace("-", " ") : ""} videos...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="max-w-6xl mx-auto p-4">
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Videos grid - keeping the original functionality */}
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex flex-wrap -mx-2">
          {videos.map((video) => (
            <div key={video.id.videoId} className="w-full md:w-1/2 lg:w-1/3 p-2">
              <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                <iframe
                  width="100%"
                  height="200"
                  src={`https://www.youtube.com/embed/${video.id.videoId}`}
                  title={video.snippet.title}
                  frameBorder="0"
                  allowFullScreen
                ></iframe>
                <div className="p-4">
                  <p className="font-medium text-gray-800">{video.snippet.title}</p>
                  <p className="text-sm text-gray-600 mt-2">{video.snippet.channelTitle}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {!loading && videos.length === 0 && (
        <div className="max-w-6xl mx-auto p-4 text-center py-12">
          <p className="text-lg text-gray-600">No videos found for {selectedCategory.replace("-", " ")}. Please try another category.</p>
        </div>
      )}

      {/* Simple footer */}
      <div className="bg-green-800 text-white p-4 mt-8">
        <div className="max-w-6xl mx-auto text-center">
          <p>© {new Date().getFullYear()} Farm Video Resources</p>
        </div>
      </div>
    </div>
  );
};

export default PlantCareVideos;