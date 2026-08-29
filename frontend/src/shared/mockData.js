// src/shared/mockData.js

export const initialDeliveries = [
  {
    id: 'DEL-001',
    retailerId: 'RET-1',
    customerName: 'John Doe',
    phone: '0712345678',
    address: '123 Main St, Nairobi',
    itemDescription: '2x Laptops',
    status: 'NEW', 
    assignedRiderId: null,
    failureReason: null,
    timeline: [
      { event: 'Delivery Created', timestamp: '2026-08-28T10:00:00Z' }
    ]
  },
  {
    id: 'DEL-002',
    retailerId: 'RET-1',
    customerName: 'Jane Smith',
    phone: '0798765432',
    address: '456 Wrong Ave', 
    itemDescription: '1x Office Chair',
    status: 'DELIVERY_FAILED',
    assignedRiderId: 'RDR-2',
    failureReason: 'Wrong address',
    timeline: [
      { event: 'Delivery Created', timestamp: '2026-08-27T09:00:00Z' },
      { event: 'Rider Assigned (Peter)', timestamp: '2026-08-27T09:15:00Z' },
      { event: 'Picked Up', timestamp: '2026-08-27T10:00:00Z' },
      { event: 'Delivery Failed: Wrong address', timestamp: '2026-08-27T10:30:00Z' }
    ]
  }
];

export const initialRiders = [
  { id: 'RDR-1', name: 'Peter', activeWorkload: 2 },
  { id: 'RDR-2', name: 'Amina', activeWorkload: 5 },
  { id: 'RDR-3', name: 'David', activeWorkload: 0 }
];