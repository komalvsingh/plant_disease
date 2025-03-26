import React from 'react';

const WeatherCard = ({ icon: Icon, label, value, unit }) => {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`h-6 w-6 ${label.toLowerCase().includes('temperature') ? 'text-yellow-500' : 
              label.toLowerCase().includes('humidity') ? 'text-blue-500' : 'text-gray-500'}`} />
            <span>{label}</span>
          </div>
          <span className="text-2xl font-bold">{value}{unit}</span>
        </div>
      </div>
    </div>
  );
};

export default WeatherCard;