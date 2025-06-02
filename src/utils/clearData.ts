// Utility to clear all stored data
export const clearAllData = (): void => {
  localStorage.removeItem('foxDeliveryData');
  console.log('All stored data cleared');
};

// Function to check if data exists
export const hasStoredData = (): boolean => {
  const data = localStorage.getItem('foxDeliveryData');
  return data !== null && data !== undefined;
};

// Function to get data count
export const getStoredDataCount = (): number => {
  const data = localStorage.getItem('foxDeliveryData');
  if (!data) return 0;
  
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}; 