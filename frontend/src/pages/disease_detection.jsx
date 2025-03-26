import React from 'react';
import { Volume2, User, MessageCircle } from 'lucide-react';

const DiseaseDetectionPage = () => {
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
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
          {/* Disease Detection Result */}
          <div className="flex items-start space-x-4">
            <img 
              src="https://cdn.britannica.com/89/126689-004-D622CD2F/Potato-leaf-blight.jpg"
              alt="Infected plant leaf"
              className="rounded-lg w-48 h-36 object-cover"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <h2 className="text-2xl font-semibold text-gray-800">Predicted Disease: Blight</h2>
                <button className="p-2 hover:bg-green-50 rounded-full transition-colors">
                  <Volume2 className="w-5 h-5 text-green-600" />
                </button>
              </div>
              <p className="mt-2 text-gray-600">Confidence Score: 95%</p>
            </div>
          </div>

          {/* Treatment Recommendations */}
          <div className="bg-green-50 rounded-xl p-6 mt-6">
            <h3 className="text-xl font-semibold text-green-800 mb-4">Treatment Recommended:</h3>
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
                description="Apply antibiotics like copper or streptomycin to bacterial blights"
              />
            </div>
          </div>

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

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <button className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors">
              Save to History
            </button>
            <button className="flex-1 px-6 py-3 border-2 border-green-600 text-green-600 rounded-lg font-semibold hover:bg-green-50 transition-colors">
              Share Report
            </button>
            <button className="flex-1 px-6 py-3 border-2 border-green-600 text-green-600 rounded-lg font-semibold hover:bg-green-50 transition-colors">
              Ask Expert
            </button>
          </div>
        </div>
      </main>
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