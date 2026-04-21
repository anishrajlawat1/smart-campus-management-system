import React from 'react';

const StatCard = ({ title, color, icon: Icon }) => (
  <div className={`p-6 rounded-xl shadow-sm border border-gray-100 bg-white transition-transform hover:scale-105 cursor-pointer`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-bold mt-1 text-gray-800">Explore</h3>
      </div>
      <div className={`p-3 rounded-lg ${color} text-white`}>
        <Icon size={24} />
      </div>
    </div>
  </div>
);

export default StatCard;