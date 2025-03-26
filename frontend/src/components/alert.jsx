import React from 'react';
import { Bell } from 'lucide-react';

const WeatherAlert = ({ type, title, description }) => {
  const getAlertStyles = () => {
    if (type === 'warning') {
      return 'bg-red-50 border-red-200 text-red-800';
    }
    return 'bg-blue-50 border-blue-200 text-blue-800';
  };

  return (
    <div className={`rounded-lg border p-4 ${getAlertStyles()}`}>
      <div className="flex items-center gap-2 font-semibold mb-1">
        <Bell className="h-4 w-4" />
        {title}
      </div>
      <div className="text-sm opacity-90">
        {description}
      </div>
    </div>
  );
};

export default WeatherAlert;