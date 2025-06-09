import { parseISO, isValid } from 'date-fns';

/**
 * Safely parses a date string into a Date object.
 * Handles different possible date formats from the data source.
 * @param dateString The date string to parse.
 * @returns A Date object or null if invalid.
 */
function parseDate(dateString?: string): Date | null {
  if (!dateString) return null;
  
  // Handle undefined values that come as strings
  if (dateString === 'undefined' || dateString === 'null') return null;
  
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
 * Generates realistic timestamps for mock data when real timestamps are not available
 */
function generateMockTimestamps(delivery: any): { created_at: string; collected_at: string; delivered_at: string } {
  const baseDate = new Date();
  baseDate.setHours(9, 0, 0, 0); // Start at 9 AM
  
  // Use delivery ID to create deterministic but varied timestamps
  const deliveryNumber = parseInt(delivery.id?.replace(/\D/g, '') || '1');
  const dayOffset = Math.floor(deliveryNumber / 10); // 10 deliveries per day
  const hourOffset = (deliveryNumber % 10) * 0.5; // 30 minutes between deliveries
  
  const createdAt = new Date(baseDate);
  createdAt.setDate(createdAt.getDate() - dayOffset);
  createdAt.setMinutes(createdAt.getMinutes() + (hourOffset * 60));
  
  const collectedAt = new Date(createdAt);
  collectedAt.setMinutes(collectedAt.getMinutes() + (15 + (deliveryNumber % 20))); // 15-35 min collection time
  
  const deliveredAt = new Date(collectedAt);
  deliveredAt.setMinutes(deliveredAt.getMinutes() + (25 + (deliveryNumber % 30))); // 25-55 min delivery time
  
  return {
    created_at: createdAt.toISOString(),
    collected_at: collectedAt.toISOString(),
    delivered_at: deliveredAt.toISOString()
  };
}

function calculateCollectionTimeFromColumn(deliveries: any[]) {
    console.log('🕒 [Collection Time] Iniciando cálculo usando a coluna "Collected Waiting Time"...');
    
    const deliveriesWithWaitingTime = deliveries.filter(d => 
        d.collectedWaitingTime !== undefined && 
        d.collectedWaitingTime !== null && 
        !isNaN(d.collectedWaitingTime) &&
        d.collectedWaitingTime > 0
    );
    
    if (deliveriesWithWaitingTime.length === 0) {
        console.log('⚠️ [Collection Time] Nenhum dado encontrado na coluna, cálculo de fallback será usado.');
        return {
            avgCollectionTime: 0,
            usedColumn: false,
            samplesCount: 0
        };
    }
    
    const totalWaitingTime = deliveriesWithWaitingTime.reduce((sum, d) => sum + d.collectedWaitingTime, 0);
    const avgCollectionTimeMinutes = totalWaitingTime / deliveriesWithWaitingTime.length;
    
    console.log('🕒 [Collection Time] Resultado do cálculo via coluna:', {
        avgCollectionTimeMinutes: avgCollectionTimeMinutes.toFixed(2),
        samplesUsed: deliveriesWithWaitingTime.length,
    });
    
    return {
        avgCollectionTime: avgCollectionTimeMinutes,
        usedColumn: true,
        samplesCount: deliveriesWithWaitingTime.length
    };
}

function calculateDeliveryTimeFromColumn(deliveries: any[]) {
    console.log('🕒 [Delivery Time] Iniciando cálculo usando a coluna "Delivered Waiting Time"...');
    
    const deliveriesWithWaitingTime = deliveries.filter(d => 
        d.deliveredWaitingTime !== undefined && 
        d.deliveredWaitingTime !== null && 
        !isNaN(d.deliveredWaitingTime) &&
        d.deliveredWaitingTime > 0
    );
    
    if (deliveriesWithWaitingTime.length === 0) {
        console.log('⚠️ [Delivery Time] Nenhum dado encontrado na coluna, cálculo de fallback será usado.');
        return {
            avgDeliveryTime: 0,
            usedColumn: false,
            samplesCount: 0
        };
    }
    
    const totalWaitingTime = deliveriesWithWaitingTime.reduce((sum, d) => sum + d.deliveredWaitingTime, 0);
    const avgDeliveryTimeMinutes = totalWaitingTime / deliveriesWithWaitingTime.length;
    
    console.log('🕒 [Delivery Time] Resultado do cálculo via coluna:', {
        avgDeliveryTimeMinutes: avgDeliveryTimeMinutes.toFixed(2),
        samplesUsed: deliveriesWithWaitingTime.length,
    });
    
    return {
        avgDeliveryTime: avgDeliveryTimeMinutes,
        usedColumn: true,
        samplesCount: deliveriesWithWaitingTime.length
    };
}

export function calculateAllTimeMetrics(deliveries: any[]) {
  console.log('📊 [Time Metrics] Iniciando cálculo de métricas de tempo...');
  if (!deliveries || deliveries.length === 0) {
    console.warn('⚠️ Nenhum dado de entrega para calcular métricas.');
    return {
        avgCollectionTime: 0,
        avgDeliveryTime: 0,
        avgCustomerExperienceTime: 0,
        avgCollectionTimeFormatted: '00:00:00',
        avgDeliveryTimeFormatted: '00:00:00',
        avgCustomerExperienceTimeFormatted: '00:00:00',
        usedWaitingTimeForCollection: false,
        collectionTimeMethod: 'N/A',
        deliveryTimeMethod: 'N/A'
    };
  }
    
  // Helper function for averaging durations in milliseconds
  const avgDuration = (durations: number[]): number => {
    if (durations.length === 0) return 0;
    const totalMs = durations.reduce((a, b) => a + b, 0);
    return totalMs / durations.length;
  };

  // Parse all relevant dates once
  const parsedDeliveries = deliveries.map(d => ({
    id: d.id,
    created_at: parseDate(d.created_at || d.createdAt),
    collected_at: parseDate(d.collected_at || d.collectedAt),
    delivered_at: parseDate(d.delivered_at || d.deliveredAt),
  }));

  // --- TEMPO DE COLETA ---
  const collectionTimeResult = calculateCollectionTimeFromColumn(deliveries);
  let avgCollectionTime: number;
  let avgCollectionMs: number;
  let collectionTimeMethod: string;

  if (collectionTimeResult.usedColumn) {
      avgCollectionTime = collectionTimeResult.avgCollectionTime;
      avgCollectionMs = avgCollectionTime * 60 * 1000;
      collectionTimeMethod = `Coluna "Collected Waiting Time" (${collectionTimeResult.samplesCount} amostras)`;
  } else {
      const collectionDurations = parsedDeliveries
          .filter(d => d.created_at && d.collected_at)
          .map(d => d.collected_at!.getTime() - d.created_at!.getTime())
          .filter(duration => duration >= 0);
      avgCollectionMs = avgDuration(collectionDurations);
      avgCollectionTime = avgCollectionMs / 1000 / 60;
      collectionTimeMethod = `Cálculo (collected_at - created_at) (${collectionDurations.length} amostras)`;
  }

  // --- TEMPO DE ENTREGA (Prioriza coluna dedicada) ---
  const deliveryTimeResult = calculateDeliveryTimeFromColumn(deliveries);
  let avgDeliveryTime: number;
  let avgDeliveryMs: number;
  let deliveryTimeMethod: string;

  if (deliveryTimeResult.usedColumn) {
      avgDeliveryTime = deliveryTimeResult.avgDeliveryTime;
      avgDeliveryMs = avgDeliveryTime * 60 * 1000;
      deliveryTimeMethod = `Coluna "Delivered Waiting Time" (${deliveryTimeResult.samplesCount} amostras)`;
  } else {
      const deliveryDurations = parsedDeliveries
          .filter(d => d.collected_at && d.delivered_at)
          .map(d => d.delivered_at!.getTime() - d.collected_at!.getTime())
          .filter(duration => duration >= 0);
      avgDeliveryMs = avgDuration(deliveryDurations);
      avgDeliveryTime = avgDeliveryMs / 1000 / 60;
      deliveryTimeMethod = `Cálculo (delivered_at - collected_at) (${deliveryDurations.length} amostras)`;
  }

  // --- TEMPO TOTAL (Experiência do Cliente) ---
  const customerExperienceDurations = parsedDeliveries
      .filter(d => d.created_at && d.delivered_at)
      .map(d => d.delivered_at!.getTime() - d.created_at!.getTime())
      .filter(duration => duration >= 0);
  const avgCustomerExperienceMs = avgDuration(customerExperienceDurations);
  const avgCustomerExperienceTime = avgCustomerExperienceMs / 1000 / 60;

  console.log('✅ Métricas de Tempo Calculadas:', {
      collection: `${avgCollectionTime.toFixed(2)} min`,
      delivery: `${avgDeliveryTime.toFixed(2)} min`,
      total: `${avgCustomerExperienceTime.toFixed(2)} min`,
      collectionTimeMethod,
      deliveryTimeMethod,
  });

  return {
      avgCollectionTime,
      avgDeliveryTime,
      avgCustomerExperienceTime,
      avgCollectionTimeFormatted: formatDurationFromMs(avgCollectionMs),
      avgDeliveryTimeFormatted: formatDurationFromMs(avgDeliveryMs),
      avgCustomerExperienceTimeFormatted: formatDurationFromMs(avgCustomerExperienceMs),
      usedWaitingTimeForCollection: collectionTimeResult.usedColumn,
      collectionTimeMethod,
      deliveryTimeMethod,
      usedWaitingTimeForDelivery: deliveryTimeResult.usedColumn,
  };
}

/**
 * Calculates average delivery time using the "Collected Waiting Time" column from CSV.
 * This function prioritizes the pre-calculated values over timestamp calculations.
 * @param deliveries The delivery data array, expected to have collectedWaitingTime.
 * @returns Average delivery time in minutes and formatted string.
 */
export function calculateDeliveryTimeFromWaitingColumn(deliveries: any[]) {
    console.log('🕒 [Collected Waiting Time] Iniciando cálculo usando coluna específica...');
    
    // Filtrar entregas que possuem a coluna Collected Waiting Time
    const deliveriesWithWaitingTime = deliveries.filter(d => 
        d.collectedWaitingTime !== undefined && 
        d.collectedWaitingTime !== null && 
        !isNaN(d.collectedWaitingTime) &&
        d.collectedWaitingTime > 0
    );
    
    console.log('🕒 [Collected Waiting Time] Dados encontrados:', {
        totalDeliveries: deliveries.length,
        deliveriesWithWaitingTime: deliveriesWithWaitingTime.length,
        sampleValues: deliveriesWithWaitingTime.slice(0, 5).map(d => ({
            id: d.id,
            waitingTime: d.collectedWaitingTime
        }))
    });
    
    if (deliveriesWithWaitingTime.length === 0) {
        console.log('⚠️ [Collected Waiting Time] Nenhum dado encontrado, usando cálculo de fallback');
        return {
            avgDeliveryTime: 0,
            avgDeliveryTimeFormatted: '00:00:00',
            usedWaitingTimeColumn: false,
            samplesCount: 0
        };
    }
    
    // Calcular a média dos tempos de espera
    const totalWaitingTime = deliveriesWithWaitingTime.reduce((sum, d) => sum + d.collectedWaitingTime, 0);
    const avgDeliveryTimeMinutes = totalWaitingTime / deliveriesWithWaitingTime.length;
    
    // Converter para milissegundos para usar a função de formatação
    const avgDeliveryTimeMs = avgDeliveryTimeMinutes * 60 * 1000;
    const avgDeliveryTimeFormatted = formatDurationFromMs(avgDeliveryTimeMs);
    
    console.log('🕒 [Collected Waiting Time] Resultado calculado:', {
        avgDeliveryTimeMinutes: avgDeliveryTimeMinutes.toFixed(2),
        avgDeliveryTimeFormatted,
        samplesUsed: deliveriesWithWaitingTime.length,
        usedWaitingTimeColumn: true
    });
    
    return {
        avgDeliveryTime: avgDeliveryTimeMinutes,
        avgDeliveryTimeFormatted,
        usedWaitingTimeColumn: true,
        samplesCount: deliveriesWithWaitingTime.length
    };
}

/**
 * Calculates all time-based metrics for a set of deliveries using real timestamps.
 * Adopts a functional approach with map/filter/reduce for clarity.
 * Now prioritizes "Collected Waiting Time" column for delivery time calculation.
 * @param deliveries The delivery data array, expected to have createdAt, collectedAt, deliveredAt.
 * @returns An object with average times in minutes and formatted strings.
 */
export function calculateAllTimeMetricsFromWaitingColumn(deliveries: any[]) {
    console.log('🕒 [Collected Waiting Time] Iniciando cálculo usando coluna específica...');
    
    // Filtrar entregas que possuem a coluna Collected Waiting Time
    const deliveriesWithWaitingTime = deliveries.filter(d => 
        d.collectedWaitingTime !== undefined && 
        d.collectedWaitingTime !== null && 
        !isNaN(d.collectedWaitingTime) &&
        d.collectedWaitingTime > 0
    );
    
    console.log('🕒 [Collected Waiting Time] Dados encontrados:', {
        totalDeliveries: deliveries.length,
        deliveriesWithWaitingTime: deliveriesWithWaitingTime.length,
        sampleValues: deliveriesWithWaitingTime.slice(0, 5).map(d => ({
            id: d.id,
            waitingTime: d.collectedWaitingTime
        }))
    });
    
    if (deliveriesWithWaitingTime.length === 0) {
        console.log('⚠️ [Collected Waiting Time] Nenhum dado encontrado, usando cálculo de fallback');
        return {
            avgDeliveryTime: 0,
            avgDeliveryTimeFormatted: '00:00:00',
            usedWaitingTimeColumn: false,
            samplesCount: 0
        };
    }
    
    // Calcular a média dos tempos de espera
    const totalWaitingTime = deliveriesWithWaitingTime.reduce((sum, d) => sum + d.collectedWaitingTime, 0);
    const avgDeliveryTimeMinutes = totalWaitingTime / deliveriesWithWaitingTime.length;
    
    // Converter para milissegundos para usar a função de formatação
    const avgDeliveryTimeMs = avgDeliveryTimeMinutes * 60 * 1000;
    const avgDeliveryTimeFormatted = formatDurationFromMs(avgDeliveryTimeMs);
    
    console.log('🕒 [Collected Waiting Time] Resultado calculado:', {
        avgDeliveryTimeMinutes: avgDeliveryTimeMinutes.toFixed(2),
        avgDeliveryTimeFormatted,
        samplesUsed: deliveriesWithWaitingTime.length,
        usedWaitingTimeColumn: true
    });
    
    return {
        avgDeliveryTime: avgDeliveryTimeMinutes,
        avgDeliveryTimeFormatted,
        usedWaitingTimeColumn: true,
        samplesCount: deliveriesWithWaitingTime.length
    };
}
