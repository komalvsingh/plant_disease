import React, { useState, useEffect, useRef } from 'react';
import { Send, Volume2, ArrowLeft, User, Bot, Leaf, CloudRain, Sun, PlaneTakeoff } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// API configuration
const API_URL = 'http://localhost:8000';

const ChatbotInterface = () => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcomeAnimation, setShowWelcomeAnimation] = useState(true);
  const chatEndRef = useRef(null);
  const navigate = useNavigate();

  const initialMessages = [
    {
      type: 'bot',
      content: 'Hello! I\'m KrishiMitra+ AI assistant. How can I help you today with your crops?',
      timestamp: getCurrentTime()
    }
  ];

  const [messages, setMessages] = useState(initialMessages);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Hide welcome animation after 3 seconds
    const timer = setTimeout(() => {
      setShowWelcomeAnimation(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = {
      type: 'user',
      content: message,
      timestamp: getCurrentTime()
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/chat`, {
        message: message
      });
      
      const botMessage = {
        type: 'bot',
        content: response.data.text_response,
        timestamp: getCurrentTime(),
        audioUrl: `${API_URL}/audio/${response.data.audio_file_path}`
      };
      
      setMessages(prevMessages => [...prevMessages, botMessage]);

      // Play audio response
      if (response.data.audio_file_path) {
        const audio = new Audio(`${API_URL}/audio/${response.data.audio_file_path}`);
        audio.play();
      }
    } catch (error) {
      console.error('Error getting response:', error);
      
      const errorMessage = {
        type: 'bot',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: getCurrentTime()
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Navigate back to home page
  const goToHomePage = () => {
    navigate('/');
  };

  // Farm tip suggestions to help farmers get started
  const suggestions = [
    "How to identify tomato leaf disease?",
    "Best practices for rice cultivation",
    "How to protect crops from pests?",
  ];

  const handleSuggestionClick = (suggestion) => {
    setMessage(suggestion);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 relative overflow-hidden">
      {/* Background farm elements - subtle and non-intrusive */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-5 left-5 opacity-10">
          <Leaf className="w-32 h-32 text-green-800" />
        </div>
        <div className="absolute bottom-20 right-5 opacity-10">
          <CloudRain className="w-24 h-24 text-blue-600" />
        </div>
        <div className="absolute top-1/3 right-10 opacity-10">
          <Sun className="w-20 h-20 text-yellow-500" />
        </div>
      </div>

      {/* Welcome Animation (shows only initially) */}
      {showWelcomeAnimation && (
        <div className="fixed inset-0 flex items-center justify-center bg-green-50 bg-opacity-90 z-50">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center animate-pulse">
                <PlaneTakeoff className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-green-800 animate-bounce mb-2">Welcome to KrishiMitra+</h1>
            <p className="text-green-600">Your personal farming assistant</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="p-4 bg-white shadow-md relative z-10">
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
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="ml-3 text-green-800 font-bold text-xl">KrishiMitra+ AI</span>
                <div className="ml-3 text-xs text-green-600">Your smart farming companion</div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Chat Container */}
      <main className="container mx-auto max-w-4xl h-[calc(100vh-140px)] flex flex-col relative z-10">
        {/* Assistant Guidance Banner */}
        <div className="bg-green-100 border-l-4 border-green-500 p-3 mx-4 mt-4 rounded-lg shadow-sm">
          <div className="flex items-center">
            <Leaf className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-green-800">Your farming assistant is here to guide you! Ask me anything about crops, diseases, or farming techniques.</span>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => (
            <ChatMessage key={index} message={msg} />
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] order-2">
                <div className="flex items-start space-x-2 flex-row">
                  <div className="p-3 rounded-lg bg-white text-gray-800 rounded-tl-none">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '100ms' }}></div>
                      <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-green-600">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Improved Suggested Questions */}
        {messages.length <= 2 && (
          <div className="px-4 py-3 bg-green-50 rounded-lg mx-4 mb-3 shadow-sm border border-green-100">
            <p className="text-sm font-medium text-green-700 mb-3">Popular questions to get started:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <button 
                  key={index}
                  className="px-4 py-2 bg-white hover:bg-green-200 text-green-800 rounded-lg text-sm transition-colors shadow-sm border border-green-200 hover:border-green-300"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-white border-t relative">
          <div className="flex items-center space-x-4">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about crops, diseases, or farming tips..."
              className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={isLoading}
            />
            <button 
              className={`p-3 ${isLoading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg transition-colors`}
              onClick={handleSendMessage}
              disabled={isLoading}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

const ChatMessage = ({ message }) => {
  const isBot = message.type === 'bot';
  const [isHovered, setIsHovered] = useState(false);
  
  const playAudio = () => {
    if (message.audioUrl) {
      const audio = new Audio(message.audioUrl);
      audio.play();
    }
  };
  
  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
      <div 
        className={`max-w-[80%] ${isBot ? 'order-2' : 'order-1'}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={`flex items-start space-x-2 ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
          <div className={`
            p-3 rounded-lg transition-shadow
            ${isBot ? 'bg-white text-gray-800' : 'bg-green-600 text-white'}
            ${isBot ? 'rounded-tl-none' : 'rounded-tr-none'}
            ${isHovered ? 'shadow-md' : ''}
          `}>
            <div className="whitespace-pre-wrap">{message.content}</div>
            {isBot && message.audioUrl && (
              <button 
                onClick={playAudio}
                className="mt-2 text-green-600 hover:text-green-700 flex items-center"
              >
                <Volume2 className="w-4 h-4 mr-1" />
                <span className="text-sm">Play audio</span>
              </button>
            )}
          </div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
            ${isBot ? 'bg-green-600' : 'bg-gray-200'}
            ${isHovered ? 'animate-pulse duration-300' : ''}
          `}>
            {isBot ? 
              <Bot className="w-5 h-5 text-white" /> :
              <User className="w-5 h-5 text-gray-600" />
            }
          </div>
        </div>
        <div className={`text-xs text-gray-500 mt-1 ${isBot ? 'ml-2' : 'mr-2 text-right'}`}>
          {message.timestamp}
        </div>
      </div>
    </div>
  );
};

export default ChatbotInterface;