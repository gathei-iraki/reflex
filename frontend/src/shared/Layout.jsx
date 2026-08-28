// src/shared/Layout.jsx
import React from 'react';

export default function Layout({ children, currentRole, onRoleChange }) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Shared Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600">Reflex MVP</h1>
          
                    <div className="flex gap-2">
            <button 
              onClick={() => onRoleChange('retailer')}
              className={`px-3 py-1 rounded ${currentRole === 'retailer' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >Retailer</button>
            <button 
              onClick={() => onRoleChange('dispatcher')}
              className={`px-3 py-1 rounded ${currentRole === 'dispatcher' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >Dispatcher</button>
            {/* Add this new button */}
            <button 
              onClick={() => onRoleChange('rider')}
              className={`px-3 py-1 rounded ${currentRole === 'rider' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >Rider</button>
          </div>
            <button 
              onClick={() => onRoleChange('retailer')}
              className={`px-3 py-1 rounded ${currentRole === 'retailer' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >Retailer</button>
            <button 
              onClick={() => onRoleChange('dispatcher')}
              className={`px-3 py-1 rounded ${currentRole === 'dispatcher' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >Dispatcher</button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}