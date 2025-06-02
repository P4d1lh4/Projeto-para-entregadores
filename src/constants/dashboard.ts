export const DASHBOARD_CONSTANTS = {
  DEFAULT_STATS: {
    totalDeliveries: 0,
    successRate: 0,
    activeDrivers: 0,
    averageDeliveryTime: 0,
  },
  REFRESH_INTERVAL: 30000, // 30 seconds
  MAX_RECENT_DELIVERIES: 5,
} as const;

export const DELIVERY_STATUS = {
  DELIVERED: 'delivered',
  FAILED: 'failed',
  PENDING: 'pending',
  IN_TRANSIT: 'in_transit',
} as const;

export const CHART_COLORS = {
  PRIMARY: '#3b82f6',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  DANGER: '#ef4444',
} as const; 