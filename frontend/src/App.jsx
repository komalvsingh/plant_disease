import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/Homepage";
import DiseaseDetectionPage from "./pages/disease_detection";
import ChatbotInterface from "./pages/chatbot";
import WeatherAlertsDashboard from "./pages/climate_prediction";
import { ClerkProvider } from "@clerk/clerk-react";
import SignInPage from "./components/signin";
import SignUpPage from "./components/signup";
function App(){
  return (
<BrowserRouter>
<Routes>
  <Route path="/" element={<LandingPage/>} />
  <Route path="/detection" element={<DiseaseDetectionPage/>} />
  <Route path="/chatbot" element={<ChatbotInterface/>} />
  <Route path="/climate" element={<WeatherAlertsDashboard/>} />
  <Route path="/sign-in" element={<SignInPage />} />
  <Route path="/sign-up" element={<SignUpPage />} />
  <Route path="/sign-up/sso-callback" element={<SignUpPage />} />
  <Route path="/sign-in/sso-callback" element={<SignInPage />} />
</Routes>
</BrowserRouter>
  );
}
export default App;