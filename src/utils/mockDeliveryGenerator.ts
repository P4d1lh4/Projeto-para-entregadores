import type { DeliveryData } from '@/types/delivery';

// Function to generate mock delivery data in the correct format
export function generateMockDeliveries(count: number = 50): DeliveryData[] {
  const deliveries: DeliveryData[] = [];
  
  const statusOptions = ['delivered', 'in_transit', 'pending', 'collected', 'cancelled'];
  
  const drivers = [
    'Carlos Silva', 'Maria Santos', 'João Oliveira', 'Ana Costa', 'Pedro Sousa',
    'Luiza Pereira', 'Miguel Ferreira', 'Sofia Rodrigues', 'Tiago Alves', 'Inês Martins'
  ];
  
  const customers = [
    'Empresa ABC Ltda', 'Tech Solutions', 'Comercial XYZ', 'Farmácia Central', 'Restaurante Bom Sabor',
    'Loja de Roupas Fashion', 'Mercado do Bairro', 'Consultório Médico', 'Escritório Legal', 'Café & Cia'
  ];
  
  const areas = ['Centro', 'Zona Norte', 'Zona Sul', 'Zona Oeste', 'Zona Leste'];
  const serviceTypes = ['Standard', 'Express', 'Same Day', 'Next Day'];
  const priorities = ['Normal', 'High', 'Urgent', 'Low'];

  // Generate dates within the last 30 days
  for (let i = 0; i < count; i++) {
    // Generate dates within the last 30 days
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 30));
    
    // Calculate pickup and delivery dates based on creation date
    const collectedDate = new Date(createdDate);
    collectedDate.setMinutes(collectedDate.getMinutes() + Math.floor(Math.random() * 120) + 30);
    
    const deliveredDate = new Date(collectedDate);
    deliveredDate.setMinutes(deliveredDate.getMinutes() + Math.floor(Math.random() * 180) + 15);

    const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
    const isDelivered = status === 'delivered';
    const isCollected = isDelivered || status === 'in_transit';
    
    const pickupArea = areas[Math.floor(Math.random() * areas.length)];
    const deliveryArea = areas[Math.floor(Math.random() * areas.length)];
    
    const baseCost = 15 + Math.random() * 85; // Custo entre $15-100
    const distance = 2 + Math.random() * 25; // Distância entre 2-27 km
    
    const delivery: DeliveryData = {
      id: `DEL-${String(i + 1).padStart(4, '0')}`,
      job_id: `JOB-${String(i + 1).padStart(6, '0')}`,
      invoice_id: `INV-${String(i + 1).padStart(5, '0')}`,
      invoice_number: `2024-${String(i + 1).padStart(4, '0')}`,
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      customer_name: customers[Math.floor(Math.random() * customers.length)],
      company_name: customers[Math.floor(Math.random() * customers.length)],
      delivering_driver: drivers[Math.floor(Math.random() * drivers.length)],
      collecting_driver: Math.random() > 0.5 ? drivers[Math.floor(Math.random() * drivers.length)] : undefined,
      pickup_address: `Rua ${Math.floor(Math.random() * 999) + 1}, ${pickupArea}`,
      delivery_address: `Av. ${Math.floor(Math.random() * 999) + 1}, ${deliveryArea}`,
      service_type: serviceTypes[Math.floor(Math.random() * serviceTypes.length)],
      cost: Math.round(baseCost * 100) / 100,
      tip_amount: Math.random() > 0.7 ? Math.round(Math.random() * 10 * 100) / 100 : 0,
      courier_commission: Math.round(baseCost * 0.15 * 100) / 100,
      courier_commission_vat: Math.round(baseCost * 0.15 * 0.23 * 100) / 100,
      status: status,
      created_at: createdDate.toISOString(),
      customer_email: `contato@${customers[Math.floor(Math.random() * customers.length)].toLowerCase().replace(/\s+/g, '')}.com`,
      customer_mobile: `+55 11 9${Math.floor(Math.random() * 90000000) + 10000000}`,
      distance: Math.round(distance * 100) / 100,
      pickup_customer_name: customers[Math.floor(Math.random() * customers.length)],
      pickup_mobile_number: `+55 11 9${Math.floor(Math.random() * 90000000) + 10000000}`,
      collection_notes: Math.random() > 0.8 ? 'Wait at main gate' : undefined,
      delivery_customer_name: customers[Math.floor(Math.random() * customers.length)],
      delivery_mobile_number: `+55 11 9${Math.floor(Math.random() * 90000000) + 10000000}`,
      delivery_notes: Math.random() > 0.7 ? 'Deliver to reception' : undefined,
      recipient_email: `recebedor@${customers[Math.floor(Math.random() * customers.length)].toLowerCase().replace(/\s+/g, '')}.com`,
      reference: `REF-${Math.floor(Math.random() * 999999)}`,
      submitted_at: createdDate.toISOString(),
      accepted_at: isCollected ? new Date(createdDate.getTime() + Math.random() * 1800000).toISOString() : undefined,
      collected_at: isCollected ? collectedDate.toISOString() : undefined,
      delivered_at: isDelivered ? deliveredDate.toISOString() : undefined,
      canceled_at: status === 'cancelled' ? new Date(createdDate.getTime() + Math.random() * 3600000).toISOString() : undefined,
      driver_notes: Math.random() > 0.8 ? 'Delivery completed successfully' : undefined,
      return_job: Math.random() > 0.9,
      payment_method: Math.random() > 0.5 ? 'card' : 'cash',
      collected_waiting_time: isCollected ? `${Math.floor(Math.random() * 15)}` : undefined,
      delivered_waiting_time: isDelivered ? `${Math.floor(Math.random() * 10)}` : undefined,
      fuel_surcharge: Math.round(distance * 0.5 * 100) / 100,
      insurance_protection: Math.random() > 0.6 ? 'standard' : 'premium',
      rider_tips: Math.random() > 0.8 ? Math.round(Math.random() * 5 * 100) / 100 : 0,
      package_value: `${Math.floor(Math.random() * 500) + 50}`,
      passenger_count: 0,
      luggage_count: Math.floor(Math.random() * 3) + 1,
      uploaded_at: new Date().toISOString(),
      uploaded_by: 'system',
      // Coordenadas aproximadas para São Paulo/Dublin (dependendo da configuração)
      pickup_lat: -23.5505 + (Math.random() - 0.5) * 0.1,
      pickup_lng: -46.6333 + (Math.random() - 0.5) * 0.1,
      delivery_lat: -23.5505 + (Math.random() - 0.5) * 0.1,
      delivery_lng: -46.6333 + (Math.random() - 0.5) * 0.1,
    };

    deliveries.push(delivery);
  }

  return deliveries;
} 