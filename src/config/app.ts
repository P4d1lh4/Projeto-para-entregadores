export const APP_CONFIG = {
  name: 'Fox Route Whisperer',
  version: '1.0.0',
  description: 'Delivery Management Dashboard',
  
  // API Configuration
  api: {
    baseUrl: process.env.VITE_API_BASE_URL || '',
    timeout: 30000,
  },
  
  // Supabase Configuration
  supabase: {
    url: process.env.VITE_SUPABASE_URL || '',
    anonKey: process.env.VITE_SUPABASE_ANON_KEY || '',
  },
  
  // Map Configuration
  map: {
    defaultCenter: {
      lat: 53.349805,
      lng: -6.26031, // Dublin coordinates
    },
    defaultZoom: 12,
    mapboxToken: process.env.VITE_MAPBOX_TOKEN || '',
  },
  
  // Pagination
  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [5, 10, 20, 50, 100],
  },
  
  // Data refresh intervals (in milliseconds)
  refreshIntervals: {
    dashboard: 30000, // 30 seconds
    deliveries: 60000, // 1 minute
    analytics: 300000, // 5 minutes
  },
  
  // File upload
  fileUpload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['.csv', '.xlsx', '.xls'],
  },
  
  // Theme
  theme: {
    defaultMode: 'light' as const,
    storageKey: 'fox-delivery-theme',
  },
} as const;

export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/',
  MAP: '/map',
  DRIVERS: '/drivers',
  DELIVERIES: '/deliveries',
  CUSTOMERS: '/customers',
  ANALYTICS: '/analytics',
  DATA_IMPORT: '/data-import',
  SETTINGS: '/settings',
} as const; 