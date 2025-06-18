export interface DeliveryData {
  id?: string;
  job_id?: string;
  invoice_id?: string;
  invoice_number?: string;
  priority?: string;
  customer_name?: string;
  company_name?: string;
  collecting_driver?: string;
  delivering_driver?: string;
  pickup_address?: string;
  delivery_address?: string;
  service_type?: string;
  cost?: number;
  tip_amount?: number;
  courier_commission?: number;
  courier_commission_vat?: number;
  status?: string;
  created_at?: string;
  account_created_by?: string;
  job_created_by?: string;
  customer_email?: string;
  customer_mobile?: string;
  distance?: number;
  pickup_customer_name?: string;
  pickup_mobile_number?: string;
  collection_notes?: string;
  delivery_customer_name?: string;
  delivery_mobile_number?: string;
  delivery_notes?: string;
  recipient_email?: string;
  reference?: string;
  submitted_at?: string;
  accepted_at?: string;
  collected_at?: string;
  delivered_at?: string;
  canceled_at?: string;
  driver_notes?: string;
  return_job?: boolean;
  payment_method?: string;
  collected_waiting_time?: string;
  delivered_waiting_time?: string;
  return_job_delivered_waiting_time?: string;
  fuel_surcharge?: number;
  insurance_protection?: string;
  rider_tips?: number;
  package_value?: string;
  passenger_count?: number;
  luggage_count?: number;
  uploaded_at?: string;
  uploaded_by?: string;
  // Geocoding properties
  pickup_lat?: number;
  pickup_lng?: number;
  delivery_lat?: number;
  delivery_lng?: number;
}

export interface GeocodeResult {
  address: string;
  lat: number;
  lng: number;
}

export interface DeliveryMapFilters {
  driver?: string;
  customer?: string;
  dateFrom?: Date;
  dateTo?: Date;
  status?: string;
}
