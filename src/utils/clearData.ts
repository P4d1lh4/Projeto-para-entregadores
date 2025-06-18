// Utility to clear all stored data
export const clearAllData = (): void => {
  localStorage.removeItem('deliveryData');
  console.log('All stored data cleared');
};

// Function to check if data exists
export const hasStoredData = (): boolean => {
  const data = localStorage.getItem('deliveryData');
  return data !== null && data !== undefined;
};

// Function to get data count
export const getStoredDataCount = (): number => {
  const data = localStorage.getItem('deliveryData');
  if (!data) return 0;
  
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}; 