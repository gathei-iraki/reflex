// src/rider/RiderDashboard.jsx
import React, { useState } from 'react';
import { initialDeliveries } from '../shared/mockData';

export default function RiderDashboard() {
  // Mocking the logged-in rider as 'RDR-1' (Peter)
  const currentRiderId = 'RDR-1'; 
  const [deliveries, setDeliveries] = useState(initialDeliveries);

  // Only show deliveries assigned to this rider
  const myDeliveries = deliveries.filter(d => d.assignedRiderId === currentRiderId);

  const handlePickup = (id) => {
    setDeliveries(deliveries.map(d => d.id === id ? { 
      ...d, 
      status: 'PICKED_UP', 
      timeline: [...d.timeline, { event: 'Picked Up by Rider', timestamp: new Date().toISOString() }] 
    } : d));
  };

  const handleDeliver = (id) => {
    // Proof of Delivery (Must Have #7)
    const pin = prompt("Enter Customer Confirmation PIN (e.g., 1234):");
    if (pin) {
      setDeliveries(deliveries.map(d => d.id === id ? { 
        ...d, 
        status: 'DELIVERED', 
        timeline: [...d.timeline, { event: `Delivered (PIN: ${pin})`, timestamp: new Date().toISOString() }] 
      } : d));
    }
  };

  const handleFail = (id) => {
    // Failed Delivery Handling (Must Have #6)
    const reason = prompt("Enter failure reason (Customer unavailable, Wrong address, etc.):");
    if (reason) {
      setDeliveries(deliveries.map(d => d.id === id ? { 
        ...d, 
        status: 'DELIVERY_FAILED', 
        failureReason: reason, 
        timeline: [...d.timeline, { event: `Delivery Failed: ${reason}`, timestamp: new Date().toISOString() }] 
      } : d));
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Rider Dashboard (Logged in as Peter)</h2>
      {myDeliveries.length === 0 ? (
        <p className="text-gray-500 bg-white p-4 rounded shadow">No deliveries assigned to you right now.</p>
      ) : (
        <div className="grid gap-4">
          {myDeliveries.map(del => (
            <div key={del.id} className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold">{del.customerName}</h3>
                  <p className="text-sm text-gray-600">{del.address}</p>
                  <p className="text-sm text-gray-500">Items: {del.itemDescription}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  del.status === 'DELIVERED' ? 'bg-green-100 text-green-800' : 
                  del.status === 'DELIVERY_FAILED' ? 'bg-red-100 text-red-800' : 
                  'bg-blue-100 text-blue-800'
                }`}>
                  {del.status}
                </span>
              </div>
              
              <div className="flex gap-2 mt-4">
                {del.status === 'ASSIGNED' && (
                  <button onClick={() => handlePickup(del.id)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Mark as Picked Up</button>
                )}
                {del.status === 'PICKED_UP' && (
                  <>
                    <button onClick={() => handleDeliver(del.id)} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Mark Delivered</button>
                    <button onClick={() => handleFail(del.id)} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Mark Failed</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}