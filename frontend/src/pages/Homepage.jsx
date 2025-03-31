import React, { useState } from 'react';
import { MessageCircle, Camera, Bell, History, Volume2, Globe, CloudSun, MessageSquare, Scan } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SignedIn, SignedOut, useAuth } from "@clerk/clerk-react";
import { UserButton } from "@clerk/clerk-react";

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <SignedOut>
              {/* Show these links when user is not signed in */}
              <NavLink href="#features">Features</NavLink>
              <NavLink href="#how-it-works">How It Works</NavLink>
              <NavLink href="#about">About</NavLink>
              <NavLink href="/videos">Tutorials</NavLink>
              
              <button 
                onClick={() => window.location.href = '/sign-up'} 
                className="px-6 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
              >
                Sign Up
              </button>
              <button 
                onClick={() => window.location.href = '/sign-in'} 
                className="px-6 py-2 ml-2 border border-green-600 text-green-600 bg-white rounded-full hover:bg-green-50 transition-colors"
              >
                Sign In
              </button>
            </SignedOut>
            
            <SignedIn>
              {/* Show these links when user is signed in */}
              <Link to="/climate" className="flex items-center text-gray-600 hover:text-green-600 transition-colors">
                <CloudSun className="w-5 h-5 mr-1" />
                <span>Climate</span>
              </Link>
              <Link to="/chatbot" className="flex items-center text-gray-600 hover:text-green-600 transition-colors">
                <MessageSquare className="w-5 h-5 mr-1" />
                <span>Chatbot</span>
              </Link>
              <Link to="/detection" className="flex items-center text-gray-600 hover:text-green-600 transition-colors">
                <Scan className="w-5 h-5 mr-1" />
                <span>Check Disease</span>
              </Link>
              <Link to="/videos" className="flex items-center text-gray-600 hover:text-green-600 transition-colors">
                <Scan className="w-5 h-5 mr-1" />
                <span>Tutorials</span>
              </Link>
              <div className="ml-4">
                <UserButton />
              </div>
            </SignedIn>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white shadow-lg p-4">
          <SignedOut>
            <NavLink href="#features" mobile>Features</NavLink>
            <NavLink href="#how-it-works" mobile>How It Works</NavLink>
            <NavLink href="#about" mobile>About</NavLink>
            <NavLink href="/videos">Tutorials</NavLink>
            <button 
              onClick={() => window.location.href = '/sign-up'}
              className="w-full mt-4 px-6 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
            >
              Sign Up
            </button>
            <button 
              onClick={() => window.location.href = '/sign-in'}
              className="w-full mt-2 px-6 py-2 border border-green-600 text-green-600 bg-white rounded-full hover:bg-green-50 transition-colors"
            >
              Sign In
            </button>
          </SignedOut>
          
          <SignedIn>
            <Link to="/climate" className="flex items-center py-2 text-gray-600 hover:text-green-600 transition-colors">
              <CloudSun className="w-5 h-5 mr-2" />
              <span>Climate</span>
            </Link>
            <Link to="/chatbot" className="flex items-center py-2 text-gray-600 hover:text-green-600 transition-colors">
              <MessageSquare className="w-5 h-5 mr-2" />
              <span>Chatbot</span>
            </Link>
            <Link to="/detection" className="flex items-center py-2 text-gray-600 hover:text-green-600 transition-colors">
              <Scan className="w-5 h-5 mr-2" />
              <span>Check Disease</span>
            </Link>
            <Link to="/videos" className="flex items-center text-gray-600 hover:text-green-600 transition-colors">
                <Scan className="w-5 h-5 mr-1" />
                <span>Tutorials</span>
              </Link>
            <div className="flex items-center justify-center mt-4">
              <UserButton />
            </div>
          </SignedIn>
        </div>
      )}

      {/* Hero Section */}
      <SignedOut>
        <main className="container mx-auto px-4 pt-16 pb-24">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-green-800">
              Smart Farming with AI
            </h1>
            <p className="text-xl mb-8 text-gray-700">
              Your intelligent companion for crop health monitoring and disease management
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
              <button 
                onClick={() => window.location.href = '/sign-up'}
                className="px-8 py-3 bg-green-600 text-white rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Get Started
              </button>
              <button className="px-8 py-3 bg-white text-green-600 border-2 border-green-600 rounded-lg text-lg font-semibold hover:bg-green-50 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                Watch Demo
              </button>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <FeatureCard 
              icon={<Camera className="w-8 h-8 text-green-600" />}
              title="AI Disease Detection"
              description="Upload plant images for instant disease detection using advanced CNN technology"
            />
            <FeatureCard 
              icon={<MessageCircle className="w-8 h-8 text-green-600" />}
              title="Smart AI Chatbot"
              description="Get instant answers about farming practices, pesticides, and government schemes"
            />
            <FeatureCard 
              icon={<History className="w-8 h-8 text-green-600" />}
              title="Treatment History"
              description="Track your crop's health history and get personalized treatment recommendations"
            />
            <FeatureCard 
              icon={<Bell className="w-8 h-8 text-green-600" />}
              title="Smart Alerts"
              description="Receive timely notifications about disease outbreaks and weather conditions"
            />
            <FeatureCard 
              icon={<Volume2 className="w-8 h-8 text-green-600" />}
              title="Voice Assistance"
              description="Access information hands-free with text-to-speech technology"
            />
            <FeatureCard 
              icon={<Globe className="w-8 h-8 text-green-600" />}
              title="Multiple Languages"
              description="Use the app in your preferred language with our multilingual support"
            />
          </div>

          {/* How It Works Section */}
          <div className="mt-24 text-center">
            <h2 className="text-3xl font-bold mb-12 text-green-800">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <StepCard 
                number="1"
                title="Take a Photo"
                description="Snap or upload a photo of your plant's affected area"
              />
              <StepCard 
                number="2"
                title="Get Analysis"
                description="Our AI analyzes the image and identifies the disease"
              />
              <StepCard 
                number="3"
                title="Take Action"
                description="Receive detailed treatment recommendations and guidance"
              />
            </div>
          </div>
        </main>
      </SignedOut>
      
      {/* Signed In Dashboard - Optional to add here or redirect to dashboard */}
      <SignedIn>
        <div className="container mx-auto px-4 pt-16 pb-24 text-center">
          <h1 className="text-3xl font-bold mb-8 text-green-800">Welcome to KrishiMitra+</h1>
          <p className="text-xl mb-8">Choose an option from the menu above to get started</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Link to="/climate">
              <div className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer">
                <CloudSun className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-green-800">Climate</h3>
                <p className="text-gray-600">Check weather forecasts and climate conditions</p>
              </div>
            </Link>
            <Link to="/chatbot">
              <div className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer">
                <MessageSquare className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-green-800">Chatbot</h3>
                <p className="text-gray-600">Get instant answers to your farming questions</p>
              </div>
            </Link>
            <Link to="/check-disease">
              <div className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer">
                <Scan className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-green-800">Check Disease</h3>
                <p className="text-gray-600">Identify plant diseases and get treatment options</p>
              </div>
            </Link>
          </div>
        </div>
      </SignedIn>
    </div>
  );
};

const NavLink = ({ href, children, mobile }) => (
  <a 
    href={href}
    className={`text-gray-600 hover:text-green-600 transition-colors ${
      mobile ? 'block py-2' : ''
    }`}
  >
    {children}
  </a>
);

const FeatureCard = ({ icon, title, description }) => {
  return (
    <div className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2 text-green-800">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

const StepCard = ({ number, title, description }) => {
  return (
    <div className="flex flex-col items-center">
      <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">
        {number}
      </div>
      <h3 className="text-xl font-semibold mb-2 text-green-800">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

export default LandingPage;