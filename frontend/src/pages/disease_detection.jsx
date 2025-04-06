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

  // Function to parse JSON from string if needed
  const parseRecommendations = (recommendations) => {
    if (typeof recommendations === 'string') {
      try {
        return JSON.parse(recommendations);
      } catch (e) {
        // If not valid JSON, return as is
        return recommendations;
      }
    }
    return recommendations;
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

// Component to handle different formats of recommendations
const TreatmentRecommendations = ({ recommendations }) => {
  // Try to determine if recommendations is a JSON string, a parsed object, or plain text
  let recContent;
  
  if (typeof recommendations === 'string') {
    // Check if it looks like JSON (starts with { and ends with })
    if (recommendations.trim().startsWith('{') && recommendations.trim().endsWith('}')) {
      try {
        const parsed = JSON.parse(recommendations);
        recContent = (
          <>
            {parsed.description && (
              <div className="mb-4">
                <h4 className="font-semibold">Disease Description:</h4>
                <p className="text-gray-700">{parsed.description}</p>
              </div>
            )}
            
            {parsed.symptoms && (
              <div className="mb-4">
                <h4 className="font-semibold">Symptoms:</h4>
                <ul className="list-disc pl-5 text-gray-700">
                  {typeof parsed.symptoms === 'string' 
                    ? <li>{parsed.symptoms}</li> 
                    : Array.isArray(parsed.symptoms) 
                      ? parsed.symptoms.map((symptom, i) => <li key={i}>{symptom}</li>)
                      : <li>{JSON.stringify(parsed.symptoms)}</li>}
                </ul>
              </div>
            )}
            
            {parsed.treatment && (
              <div className="mb-4">
                <h4 className="font-semibold">Treatment Methods:</h4>
                <div className="space-y-3 mt-2">
                  {typeof parsed.treatment === 'string' 
                    ? <p className="text-gray-700">{parsed.treatment}</p>
                    : Object.entries(parsed.treatment).map(([key, value], i) => (
                        <TreatmentStep key={i} number={i+1} title={key} description={value} />
                      ))}
                </div>
              </div>
            )}
            
            {parsed.prevention && (
              <div className="mb-4">
                <h4 className="font-semibold">Prevention:</h4>
                <ul className="list-disc pl-5 text-gray-700">
                  {typeof parsed.prevention === 'string' 
                    ? <li>{parsed.prevention}</li> 
                    : Array.isArray(parsed.prevention) 
                      ? parsed.prevention.map((item, i) => <li key={i}>{item}</li>)
                      : <li>{JSON.stringify(parsed.prevention)}</li>}
                </ul>
              </div>
            )}
          </>
        );
      } catch (e) {
        // If parsing fails, treat as plain text
        recContent = <p className="text-gray-700">{recommendations}</p>;
      }
    } else {
      // Plain text
      recContent = <p className="text-gray-700">{recommendations}</p>;
    }
  } else if (typeof recommendations === 'object') {
    // Already parsed object
    recContent = (
      <>
        <div className="space-y-4">
          <TreatmentStep 
            number="1"
            title="Remove infected parts:"
            description="Prune or dig up and destroy infected leaves, branches, or entire plants"
          />
          <TreatmentStep 
            number="2"
            title="Use Fungicide:"
            description="Apply a fungicide early in the growing season or when symptoms first appear"
          />
          <TreatmentStep 
            number="3"
            title="Use antibiotics:"
            description="Apply antibiotics like copper or streptomycin to bacterial blights if appropriate"
          />
        </div>
      </>
    );
  } else {
    // Fallback content
    recContent = (
      <p className="text-gray-700">Please consult with an agricultural expert for specific treatment recommendations.</p>
    );
  }

  return (
    <div className="bg-green-50 rounded-xl p-6 mt-6">
      <h3 className="text-xl font-semibold text-green-800 mb-4">Treatment Recommended:</h3>
      {recContent}
      
      {/* Additional Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">Prevention Tips</h4>
          <ul className="text-gray-700 space-y-2">
            <li>• Maintain proper plant spacing</li>
            <li>• Avoid overhead watering</li>
            <li>• Practice crop rotation</li>
          </ul>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <h4 className="font-semibold text-orange-800 mb-2">Warning Signs</h4>
          <ul className="text-gray-700 space-y-2">
            <li>• Yellow or brown spots on leaves</li>
            <li>• Wilting or drooping</li>
            <li>• Stunted growth</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

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


