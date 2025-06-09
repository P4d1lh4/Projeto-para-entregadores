import { parseISO, isValid } from 'date-fns';

/**
 * Safely parses a date string into a Date object.
 * Handles different possible date formats from the data source.
 * @param dateString The date string to parse.
 * @returns A Date object or null if invalid.
 */
function parseDate(dateString?: string): Date | null {
  if (!dateString) return null;
  // Try standard JS parser first, which is flexible
  const date = new Date(dateString);
  if (isValid(date)) return date;
  // Fallback to ISO parser
  const isoDate = parseISO(dateString);
  if (isValid(isoDate)) return isoDate;
  return null;
}

/**
 * Formats a duration from milliseconds into HH:mm:ss format.
 * @param ms The duration in milliseconds.
 * @returns A formatted time string.
 */
export function formatDurationFromMs(ms: number): string {
  if (isNaN(ms) || ms < 0) {
    return '00:00:00';
  }
  const totalSeconds = Math.floor(ms / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Calculates all time-based metrics for a set of deliveries using real timestamps.
 * Adopts a functional approach with map/filter/reduce for clarity.
 * @param deliveries The delivery data array, expected to have createdAt, collectedAt, deliveredAt.
 * @returns An object with average times in minutes and formatted strings.
 */
export function calculateAllTimeMetrics(deliveries: any[]) {
    const parsedDeliveries = deliveries.map(d => ({
        createdAt: parseDate(d.createdAt),
        collectedAt: parseDate(d.collectedAt),
        deliveredAt: parseDate(d.deliveredAt),
    }));

    const avgDuration = (durations: number[]): number => {
        if (durations.length === 0) return 0;
        const totalMs = durations.reduce((a, b) => a + b, 0);
        return totalMs / durations.length;
    };
    
    const msToMinutes = (ms: number) => ms / 1000 / 60;

    const collectionDurations = parsedDeliveries
        .filter(d => d.createdAt && d.collectedAt)
        .map(d => d.collectedAt!.getTime() - d.createdAt!.getTime())
        .filter(duration => duration >= 0);

    const deliveryDurations = parsedDeliveries
        .filter(d => d.collectedAt && d.deliveredAt)
        .map(d => d.deliveredAt!.getTime() - d.collectedAt!.getTime())
        .filter(duration => duration >= 0);

    const customerExperienceDurations = parsedDeliveries
        .filter(d => d.createdAt && d.deliveredAt)
        .map(d => d.deliveredAt!.getTime() - d.createdAt!.getTime())
        .filter(duration => duration >= 0);

    const avgCollectionMs = avgDuration(collectionDurations);
    const avgDeliveryMs = avgDuration(deliveryDurations);
    const avgCustomerExperienceMs = avgDuration(customerExperienceDurations);

    const avgCollectionTime = avgCollectionMs / 1000 / 60;
    const avgDeliveryTime = avgDeliveryMs / 1000 / 60;
    const avgCustomerExperienceTime = avgCustomerExperienceMs / 1000 / 60;
    
    console.log('🕒 Real Time Metrics Calculated:', {
        avgCollectionTime: `${avgCollectionTime.toFixed(2)} min`,
        avgDeliveryTime: `${avgDeliveryTime.toFixed(2)} min`,
        avgCustomerExperienceTime: `${avgCustomerExperienceTime.toFixed(2)} min`,
        collectionSamples: collectionDurations.length,
        deliverySamples: deliveryDurations.length,
        customerExperienceSamples: customerExperienceDurations.length
    });

    return {
        avgCollectionTime,
        avgDeliveryTime,
        avgCustomerExperienceTime,
        avgCollectionTimeFormatted: formatDurationFromMs(avgCollectionMs),
        avgDeliveryTimeFormatted: formatDurationFromMs(avgDeliveryMs),
        avgCustomerExperienceTimeFormatted: formatDurationFromMs(avgCustomerExperienceMs),
    };
} 