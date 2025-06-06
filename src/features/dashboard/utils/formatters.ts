export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

export const formatDeliveryTime = (timeInHours: number): string => {
  if (timeInHours < 1) {
    const minutes = Math.round(timeInHours * 60);
    return `${minutes}min`;
  }
  return `${timeInHours.toFixed(1)}h`;
}; 