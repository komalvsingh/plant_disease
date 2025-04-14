// FILE: frontend/src/DiseaseDetectionPage.jsx
import React, { useState } from 'react';
import { Volume2, User, MessageCircle, Upload, AlertCircle } from 'lucide-react';

const DiseaseDetectionPage = () => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setPrediction(null);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!image) {
      setError("Please select an image first.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', image);

    try {
      const response = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      setPrediction(result);
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to analyze the image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Updated parseRecommendations function for handling markdown
  const parseRecommendations = (recommendations) => {
    if (typeof recommendations === 'string') {
      // We're now expecting markdown text directly
      return recommendations;
    }
    // If it somehow came through as an object, stringify it for display
    if (typeof recommendations === 'object') {
      try {
        return JSON.stringify(recommendations, null, 2);
      } catch (e) {
        return String(recommendations);
      }
    }
    return String(recommendations || '');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100">
      {/* Navigation */}
      <nav className="p-4 bg-white shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">K+</span>
            </div>
            <span className="ml-3 text-green-800 font-bold text-2xl">KrishiMitra+</span>
          </div>
          
          <div className="flex items-center space-x-6">
            <button className="p-2 hover:bg-green-50 rounded-full">
              <MessageCircle className="w-6 h-6 text-green-600" />
            </button>
            <button className="p-2 hover:bg-green-50 rounded-full">
              <User className="w-6 h-6 text-green-600" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Image Upload Section */}
        {!prediction && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Upload Plant Image for Disease Detection</h2>
            
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-green-300 rounded-lg bg-green-50">
              {preview ? (
                <div className="mb-4 w-full flex justify-center">
                  <img 
                    src={preview} 
                    alt="Plant preview" 
                    className="max-h-64 max-w-full rounded-lg object-contain"
                  />
                </div>
              ) : (
                <div className="text-center p-6">
                  <Upload className="mx-auto h-12 w-12 text-green-600 mb-2" />
                  <p className="text-gray-600">Drag and drop or click to upload</p>
                  <p className="text-gray-400 text-sm mt-1">PNG, JPG, JPEG up to 5MB</p>
                </div>
              )}
              
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
              
              <div className="mt-4 w-full flex flex-col sm:flex-row gap-4">
                <label 
                  htmlFor="image-upload" 
                  className="flex-1 px-6 py-3 bg-green-100 text-green-700 rounded-lg font-semibold hover:bg-green-200 transition-colors text-center cursor-pointer">
                  {preview ? "Change Image" : "Select Image"}
                </label>
                
                {preview && (
                  <button 
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-green-300">
                    {isLoading ? "Analyzing..." : "Detect Disease"}
                  </button>
                )}
              </div>
              
              {error && (
                <div className="mt-4 flex items-center p-3 bg-red-50 text-red-700 rounded-lg">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results Section */}
        {prediction && (
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
            {/* Disease Detection Result */}
            <div className="flex items-start space-x-4">
              <img 
                src={preview}
                alt="Analyzed plant leaf"
                className="rounded-lg w-48 h-36 object-cover"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h2 className="text-2xl font-semibold text-gray-800">
                    Predicted Disease: {prediction.disease.replace(/_/g, ' ')}
                  </h2>
                  <button className="p-2 hover:bg-green-50 rounded-full transition-colors">
                    <Volume2 className="w-5 h-5 text-green-600" />
                  </button>
                </div>
                <p className="mt-2 text-gray-600">Confidence Score: {prediction.confidence}%</p>
              </div>
            </div>

            {/* Treatment Recommendations */}
            {prediction.disease.toLowerCase().includes('healthy') ? (
              <div className="bg-green-50 rounded-xl p-6 mt-6">
                <h3 className="text-xl font-semibold text-green-800 mb-4">Your plant appears healthy!</h3>
                <p className="text-gray-700">Continue with regular care and monitoring. No treatment needed at this time.</p>
              </div>
            ) : (
              <TreatmentRecommendations recommendations={parseRecommendations(prediction.recommendations)} />
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <button 
                onClick={() => {
                  setPreview(null);
                  setImage(null);
                  setPrediction(null);
                }}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors">
                Scan New Image
              </button>
              <button className="flex-1 px-6 py-3 border-2 border-green-600 text-green-600 rounded-lg font-semibold hover:bg-green-50 transition-colors">
                Share Report
              </button>
              <button className="flex-1 px-6 py-3 border-2 border-green-600 text-green-600 rounded-lg font-semibold hover:bg-green-50 transition-colors">
                Ask Expert
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// Component to handle markdown-formatted recommendations
const TreatmentRecommendations = ({ recommendations }) => {
  // Check if recommendations is a string (which it should be now as markdown)
  if (!recommendations) {
    return (
      <div className="bg-green-50 rounded-xl p-6 mt-6">
        <h3 className="text-xl font-semibold text-green-800 mb-4">Treatment Recommended:</h3>
        <p className="text-gray-700">No specific recommendations available. Please consult with an agricultural expert.</p>
      </div>
    );
  }

  // Parse the markdown-like content into React components
  const renderMarkdownContent = (content) => {
    if (!content || typeof content !== 'string') return null;

    // Split content by lines
    const lines = content.split('\n');
    const renderedContent = [];

    let currentList = [];
    let inList = false;
    let currentHeading = null;

    lines.forEach((line, index) => {
      // Handle headings (## Heading)
      if (line.startsWith('## ')) {
        // If we were building a list, add it before starting a new section
        if (inList && currentList.length > 0) {
          renderedContent.push(
            <ul key={`list-${renderedContent.length}`} className="list-disc pl-5 text-gray-700 mb-4">
              {currentList}
            </ul>
          );
          currentList = [];
          inList = false;
        }

        currentHeading = line.substring(3).trim();
        renderedContent.push(
          <h4 key={`heading-${index}`} className="font-semibold text-green-800 mt-4 mb-2">
            {currentHeading}
          </h4>
        );
      }
      // Handle subheadings (### Subheading)
      else if (line.startsWith('### ')) {
        // If we were building a list, add it before starting a new subsection
        if (inList && currentList.length > 0) {
          renderedContent.push(
            <ul key={`list-${renderedContent.length}`} className="list-disc pl-5 text-gray-700 mb-3">
              {currentList}
            </ul>
          );
          currentList = [];
          inList = false;
        }

        renderedContent.push(
          <h5 key={`subheading-${index}`} className="font-medium text-green-700 mt-3 mb-2">
            {line.substring(4).trim()}
          </h5>
        );
      }
      // Handle list items
      else if (line.startsWith('- ')) {
        inList = true;
        const itemContent = line.substring(2);
        
        // Check for bold text within list items
        if (itemContent.includes('**')) {
          const parts = itemContent.split('**');
          // Bold text pattern: **text**
          if (parts.length >= 3) {
            currentList.push(
              <li key={`item-${index}`} className="mb-1">
                <span className="font-semibold">{parts[1]}</span>
                {parts[2]}
              </li>
            );
          } else {
            currentList.push(<li key={`item-${index}`} className="mb-1">{itemContent}</li>);
          }
        } else {
          currentList.push(<li key={`item-${index}`} className="mb-1">{itemContent}</li>);
        }
      }
      // Regular text paragraph
      else if (line.trim() !== '') {
        // If we were building a list, add it before starting a paragraph
        if (inList && currentList.length > 0) {
          renderedContent.push(
            <ul key={`list-${renderedContent.length}`} className="list-disc pl-5 text-gray-700 mb-4">
              {currentList}
            </ul>
          );
          currentList = [];
          inList = false;
        }
        
        renderedContent.push(
          <p key={`paragraph-${index}`} className="text-gray-700 mb-3">
            {line}
          </p>
        );
      }
      // Empty line
      else if (line.trim() === '') {
        // If we were building a list, finish it
        if (inList && currentList.length > 0) {
          renderedContent.push(
            <ul key={`list-${renderedContent.length}`} className="list-disc pl-5 text-gray-700 mb-4">
              {currentList}
            </ul>
          );
          currentList = [];
          inList = false;
        }
      }
    });

    // Add any remaining list items
    if (inList && currentList.length > 0) {
      renderedContent.push(
        <ul key={`list-final`} className="list-disc pl-5 text-gray-700 mb-4">
          {currentList}
        </ul>
      );
    }

    return renderedContent;
  };

  return (
    <div className="bg-green-50 rounded-xl p-6 mt-6">
      <h3 className="text-xl font-semibold text-green-800 mb-4">Treatment Recommended:</h3>
      <div className="recommendation-content">
        {renderMarkdownContent(recommendations)}
      </div>
      
      {/* Additional Information - Optional help section */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">Need Additional Help?</h4>
        <p className="text-gray-700">
          For personalized assistance, consider consulting with a local agricultural expert or 
          extension service. They can provide guidance specific to your region and growing conditions.
        </p>
      </div>
    </div>
  );
};

// Treatment step component (kept as a utility for potential future use)
const TreatmentStep = ({ number, title, description }) => {
  return (
    <div className="flex items-start space-x-3">
      <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-white font-bold text-sm">{number}</span>
      </div>
      <div>
        <span className="font-semibold text-gray-800">{title}</span>
        <span className="text-gray-600 ml-1">{description}</span>
      </div>
    </div>
  );
};

export default DiseaseDetectionPage;