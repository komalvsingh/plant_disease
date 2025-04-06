import React from 'react';

const AboutUs = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-50 to-green-100">
      {/* Navigation */}
      <nav className="p-4 bg-white shadow-md">
        <div className="container mx-auto">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">K+</span>
            </div>
            <span className="ml-3 text-green-800 font-bold text-2xl">KrishiMitra+</span>
          </div>
        </div>
      </nav>
      
      {/* Main content */}
      <div className="flex-grow">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-green-700 mb-6">About KrishiMitra+</h2>
          
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <p className="text-gray-700 text-lg mb-4">
              KrishiMitra+ is a smart companion app designed to empower Indian farmers with modern tools to improve crop health and boost productivity.
            </p>
            <p className="text-gray-700 text-lg mb-4">
              From plant disease detection to market analysis, KrishiMitra+ brings technology to the field—helping farmers make informed decisions, get personalized treatment recommendations, and track their crop history with ease.
            </p>
            <p className="text-gray-700 text-lg">
              Our mission is to support sustainable farming and ensure that every farmer has access to simple, effective digital solutions.
            </p>

          </div>
        
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-green-700 text-white py-6">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <span className="text-green-700 font-bold text-lg">K+</span>
                </div>
                <span className="ml-2 text-white font-bold text-xl">KrishiMitra+</span>
              </div>
              <p className="mt-2 text-green-100 text-sm">Growing together, digitally.</p>
            </div>

          </div>
          
          <div className="border-t border-green-600 mt-6 pt-6 text-center">
            <p className="text-green-100 text-sm">© {new Date().getFullYear()} KrishiMitra+. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AboutUs;