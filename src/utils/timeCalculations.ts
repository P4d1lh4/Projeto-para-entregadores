import { parseISO, isValid } from 'date-fns';

/**
 * Parses time data from various formats into total minutes.
 * Supports: HH:mm:ss, mm:ss, pure numbers (seconds or minutes), decimal values
 * @param timeValue The time value to parse
 * @returns Total minutes as a number, or null if invalid.
 */
function parseTimeToMinutes(timeValue: any): number | null {
  if (timeValue === null || timeValue === undefined || timeValue === '') {
    return null;
  }

  const timeString = String(timeValue).trim();
  
  // Se for um número, vamos analisá-lo com mais cuidado
  if (!isNaN(Number(timeString)) && !timeString.includes(':')) {
    const numValue = parseFloat(timeString);
    
    // HEURÍSTICA PRINCIPAL:
    // Se o valor for um número inteiro pequeno (ex: 1, 2, 3), é muito mais provável que sejam HORAS.
    // Um tempo de entrega de 1, 2 ou 3 minutos é raro, mas 1-3 horas é comum.
    if (Number.isInteger(numValue) && numValue > 0 && numValue < 10) {
      const minutesFromHours = numValue * 60;
      console.log(`📊 [parseTimeToMinutes] Heurística: Interpretando o número inteiro ${numValue} como HORAS -> ${minutesFromHours} minutos.`);
      return minutesFromHours;
    }
    
    // Se for um decimal pequeno (ex: 0.5, 1.5), provavelmente são horas decimais
    if (numValue > 0 && numValue < 10) {
      const minutesFromDecimalHours = numValue * 60;
       console.log(`📊 [parseTimeToMinutes] Heurística: Interpretando o número decimal ${numValue} como HORAS -> ${minutesFromDecimalHours.toFixed(2)} minutos.`);
      return minutesFromDecimalHours;
    }
    
    // Se for um número maior, provavelmente são minutos (ou segundos, mas minutos é mais comum)
    if (numValue >= 10 && numValue <= 480) { // 10 min a 8 horas
      console.log(`📊 [parseTimeToMinutes] Interpretando ${numValue} como MINUTOS.`);
      return numValue;
    }

    // Se for um número muito grande, podem ser segundos
    if (numValue > 480) {
        const minutesFromSeconds = numValue / 60;
        console.log(`📊 [parseTimeToMinutes] Interpretando ${numValue} como SEGUNDOS -> ${minutesFromSeconds.toFixed(2)} minutos.`);
        return minutesFromSeconds;
    }
  }

  // Se tiver formato de tempo (HH:mm:ss)
  if (timeString.includes(':')) {
    const parts = timeString.split(':').map(part => parseInt(part, 10));
    
    if (parts.some(isNaN)) {
        console.warn(`⚠️ [parseTimeToMinutes] Formato de tempo inválido em "${timeString}"`);
        return null;
    }

    let hours = 0, minutes = 0, seconds = 0;

    if (parts.length === 2) { // mm:ss ou HH:mm
        // Se o primeiro valor for > 23, provavelmete é mm:ss
        if (parts[0] > 23) {
            minutes = parts[0];
            seconds = parts[1];
        } else { // Senão, é HH:mm
            hours = parts[0];
            minutes = parts[1];
        }
    } else if (parts.length === 3) { // HH:mm:ss
        hours = parts[0];
        minutes = parts[1];
        seconds = parts[2];
    } else {
        return null;
    }

    if (hours < 0 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
        console.warn(`⚠️ [parseTimeToMinutes] Valores de tempo fora do intervalo em "${timeString}"`);
        return null;
    }
    
    const totalMinutes = hours * 60 + minutes + seconds / 60;
    console.log(`📊 [parseTimeToMinutes] Formato de tempo "${timeString}" convertido para ${totalMinutes.toFixed(2)} minutos.`);
    return totalMinutes;
  }

  console.warn(`⚠️ [parseTimeToMinutes] Formato não reconhecido para o valor: "${timeString}"`);
  return null;
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use parseTimeToMinutes instead
 */
function parseHHMMSSToMinutes(timeString: any): number | null {
  return parseTimeToMinutes(timeString);
}

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
    console.log('🕒 [COLLECTION TIME] ===== INICIANDO CÁLCULO DO TEMPO MÉDIO DE COLETA =====');
    
    // Encontrar todos os valores válidos usando diferentes variações de nome da coluna
    const possibleColumnNames = [
        'Collected Waiting Time',
        'collected_waiting_time', 
        'Collection Waiting Time',
        'collection_waiting_time',
        'collectedWaitingTime',
        'collectionWaitingTime'
    ];
    
    let columnFound: string | null = null;
    let allWaitingTimeValues: any[] = [];
    
    for (const columnName of possibleColumnNames) {
        const values = deliveries.map((d, index) => {
            const rawValue = d[columnName];
            const convertedMinutes = parseTimeToMinutes(rawValue);
            return {
                index,
                id: d.id,
                rawValue,
                convertedMinutes,
                columnUsed: columnName
            };
        }).filter(item => item.convertedMinutes !== null && item.convertedMinutes > 0);
        
        if (values.length > 0) {
            columnFound = columnName;
            allWaitingTimeValues = values;
            console.log(`✅ [COLLECTION TIME] Coluna encontrada: "${columnName}" com ${values.length} valores válidos`);
            break;
        }
    }
    
    if (!columnFound || allWaitingTimeValues.length === 0) {
        console.log('❌ [COLLECTION TIME] Nenhuma coluna de tempo de coleta válida encontrada!');
        console.log('📋 [COLLECTION TIME] Colunas tentadas:', possibleColumnNames);
        
        return {
            avgCollectionTime: 0,
            usedColumn: false,
            samplesCount: 0,
            columnFound: null
        };
    }

    console.log('📊 [COLLECTION TIME] Estatísticas completas:', {
        totalRegistros: deliveries.length,
        valoresEncontrados: allWaitingTimeValues.length,
        percentualCobertura: ((allWaitingTimeValues.length / deliveries.length) * 100).toFixed(1) + '%',
        colunaUtilizada: columnFound,
        exemploValores: allWaitingTimeValues.slice(0, 10).map(item => ({
            raw: item.rawValue,
            minutes: item.convertedMinutes?.toFixed(2)
        }))
    });
    
    const validWaitingTimes = allWaitingTimeValues
        .map(item => item.convertedMinutes!)
        .filter(minutes => minutes > 0 && minutes <= 480);

    if (validWaitingTimes.length === 0) {
        return { avgCollectionTime: 0, usedColumn: false, samplesCount: 0, columnFound };
    }

    const sortedTimes = [...validWaitingTimes].sort((a, b) => a - b);
    const q1 = sortedTimes[Math.floor(sortedTimes.length * 0.25)];
    const q3 = sortedTimes[Math.floor(sortedTimes.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = Math.max(0.5, q1 - 1.5 * iqr);
    const upperBound = Math.min(480, q3 + 1.5 * iqr);

    const filteredTimes = validWaitingTimes.filter(time => time >= lowerBound && time <= upperBound);

    console.log('🎯 [COLLECTION TIME] Remoção de outliers:', {
        valoresOriginais: validWaitingTimes.length,
        valoresAposRemocaoOutliers: filteredTimes.length,
        limitesIQR: `${lowerBound.toFixed(2)} - ${upperBound.toFixed(2)} minutos`,
        outliersRemovidos: validWaitingTimes.length - filteredTimes.length
    });
    
    const finalTimes = filteredTimes.length > 0 ? filteredTimes : validWaitingTimes;
    const totalWaitingTime = finalTimes.reduce((sum, minutes) => sum + minutes, 0);
    const avgCollectionTimeMinutes = totalWaitingTime / finalTimes.length;
    
    console.log('✅ [COLLECTION TIME] Resultado final:', {
        avgCollectionTimeMinutes: avgCollectionTimeMinutes.toFixed(2),
        samplesUsed: finalTimes.length,
    });
    
    return {
        avgCollectionTime: avgCollectionTimeMinutes,
        usedColumn: true,
        samplesCount: finalTimes.length,
        columnFound: columnFound
    };
}

/**
 * Diagnóstico simples para verificar dados de Delivered Waiting Time
 */
export function debugDeliveredWaitingTime(deliveries: any[]) {
    console.log('🚨 [DEBUG] ===== DIAGNÓSTICO DELIVERED WAITING TIME =====');
    console.log('🚨 [DEBUG] Total de entregas recebidas:', deliveries.length);
    
    if (deliveries.length === 0) {
        console.log('❌ [DEBUG] Nenhuma entrega encontrada!');
        return;
    }
    
    // Verificar primeiro registro
    const firstDelivery = deliveries[0];
    console.log('🚨 [DEBUG] Estrutura do primeiro registro:');
    console.log('🚨 [DEBUG] Todas as chaves:', Object.keys(firstDelivery));
    console.log('🚨 [DEBUG] Chaves com "delivered":', Object.keys(firstDelivery).filter(k => k.toLowerCase().includes('delivered')));
    console.log('🚨 [DEBUG] Chaves com "waiting":', Object.keys(firstDelivery).filter(k => k.toLowerCase().includes('waiting')));
    console.log('🚨 [DEBUG] Chaves com "time":', Object.keys(firstDelivery).filter(k => k.toLowerCase().includes('time')));
    
    // Testar acessos diretos
    console.log('🚨 [DEBUG] Tentativas de acesso:');
    console.log('  - firstDelivery["Delivered Waiting Time"]:', firstDelivery['Delivered Waiting Time']);
    console.log('  - firstDelivery.deliveredWaitingTime:', firstDelivery.deliveredWaitingTime);
    console.log('  - firstDelivery["delivered_waiting_time"]:', firstDelivery['delivered_waiting_time']);
    
    // Verificar vários registros
    let countWithData = 0;
    const samples: any[] = [];
    
    for (let i = 0; i < Math.min(10, deliveries.length); i++) {
        const delivery = deliveries[i];
        const value = delivery['Delivered Waiting Time'] || 
                     delivery.deliveredWaitingTime || 
                     delivery['delivered_waiting_time'];
        
        if (value !== undefined && value !== null) {
            countWithData++;
            samples.push({
                index: i,
                id: delivery.id,
                value: value,
                type: typeof value,
                length: value?.length
            });
        }
    }
    
    console.log('🚨 [DEBUG] Registros com dados (primeiros 10):', countWithData);
    console.log('🚨 [DEBUG] Amostras encontradas:', samples);
    console.log('🚨 [DEBUG] ===== FIM DO DIAGNÓSTICO =====');
    
    return {
        totalDeliveries: deliveries.length,
        recordsWithData: countWithData,
        samples
    };
}

/**
 * Função de teste específica para verificar se a coluna "Delivered Waiting Time" está disponível
 * @param deliveries Array de dados de entrega
 * @returns Relatório sobre a disponibilidade da coluna
 */
export function testDeliveredWaitingTimeColumn(deliveries: any[]) {
    console.log('🧪 [TESTE] Verificando disponibilidade da coluna "Delivered Waiting Time"...');
    
    const report = {
        totalDeliveries: deliveries.length,
        deliveriesWithColumn: 0,
        sampleValues: [] as any[],
        columnVariationsFound: [] as string[],
        allPossibleColumns: [] as string[]
    };
    
    deliveries.slice(0, 10).forEach((d, index) => {
        // Verificar todas as variações possíveis
        const allColumns = Object.keys(d);
        const waitingColumns = allColumns.filter(col => 
            col.toLowerCase().includes('delivered') && 
            col.toLowerCase().includes('waiting')
        );
        
        if (waitingColumns.length > 0) {
            report.columnVariationsFound = [...new Set([...report.columnVariationsFound, ...waitingColumns])];
        }
        
        report.allPossibleColumns = [...new Set([...report.allPossibleColumns, ...allColumns])];
        
        const rawValue = d['Delivered Waiting Time'] ?? 
                        d['delivered_waiting_time'] ?? 
                        d.delivered_waiting_time ??
                        d.deliveredWaitingTime;
        
        if (rawValue) {
            report.deliveriesWithColumn++;
            if (report.sampleValues.length < 5) {
                report.sampleValues.push({
                    id: d.id,
                    value: rawValue,
                    type: typeof rawValue,
                    parsedMinutes: parseHHMMSSToMinutes(rawValue)
                });
            }
        }
    });
    
    console.log('🧪 [TESTE] Relatório da coluna "Delivered Waiting Time":', report);
    return report;
}

function calculateDeliveryTimeFromColumn(deliveries: any[]) {
    console.log('🚚 [DELIVERY TIME] ===== INICIANDO CÁLCULO DO TEMPO MÉDIO DE ENTREGA =====');
    
    // Executar teste da coluna primeiro
    testDeliveredWaitingTimeColumn(deliveries);
    
    // Análise detalhada dos primeiros valores para entender o formato
    const dataAnalysis = deliveries.slice(0, 20).map((d, index) => {
        const rawValue = d['Delivered Waiting Time'] ?? d['delivered_waiting_time'] ?? d['Delivery Waiting Time'] ?? d.deliveredWaitingTime;
        return {
            index,
            id: d.id,
            rawValue,
            valueType: typeof rawValue,
            convertedMinutes: parseTimeToMinutes(rawValue)
        };
    });

    console.log('🔍 [DELIVERY TIME] Análise detalhada dos primeiros 20 valores:', dataAnalysis);
    
    // Encontrar todos os valores válidos usando diferentes variações de nome da coluna
    const possibleColumnNames = [
        'Delivered Waiting Time',
        'delivered_waiting_time', 
        'Delivery Waiting Time',
        'delivery_waiting_time',
        'deliveredWaitingTime',
        'deliveryWaitingTime'
    ];
    
    let columnFound: string | null = null;
    let allWaitingTimeValues: any[] = [];
    
    for (const columnName of possibleColumnNames) {
        const values = deliveries.map((d, index) => {
            const rawValue = d[columnName];
            const convertedMinutes = parseTimeToMinutes(rawValue);
            return { rawValue, convertedMinutes, columnUsed: columnName };
        }).filter(item => item.convertedMinutes !== null);
        
        if (values.length > 0) {
            columnFound = columnName;
            allWaitingTimeValues = values;
            console.log(`✅ [DELIVERY TIME] Coluna encontrada: "${columnName}" com ${values.length} valores.`);
            break;
        }
    }
    
    if (!columnFound) {
        console.log('❌ [DELIVERY TIME] Nenhuma coluna de tempo de entrega válida encontrada!');
        console.log('📋 [DELIVERY TIME] Colunas tentadas:', possibleColumnNames);
        
        return { avgDeliveryTime: 0, usedColumn: false, samplesCount: 0, columnFound: null };
    }

    // Filtro inicial para valores realistas (mínimo de 5 minutos, máximo de 8 horas)
    const realisticTimes = allWaitingTimeValues
        .map(item => item.convertedMinutes!)
        .filter(minutes => minutes >= 5 && minutes <= 480); 

    if (realisticTimes.length === 0) {
        console.log('⚠️ [DELIVERY TIME] Nenhum dado de tempo de entrega realista (5min - 8h) encontrado.');
        return { avgDeliveryTime: 0, usedColumn: true, samplesCount: 0, columnFound };
    }
    
    const initialAvg = realisticTimes.reduce((sum, minutes) => sum + minutes, 0) / realisticTimes.length;
    console.log(`📈 [DELIVERY TIME] Média inicial (pré-outliers): ${initialAvg.toFixed(2)} min, com ${realisticTimes.length} amostras.`);

    // Remoção de outliers com IQR
    const sortedTimes = [...realisticTimes].sort((a, b) => a - b);
    const q1 = sortedTimes[Math.floor(sortedTimes.length * 0.25)];
    const q3 = sortedTimes[Math.floor(sortedTimes.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = Math.max(5, q1 - 1.5 * iqr);    // Mínimo de 5 minutos
    const upperBound = Math.min(480, q3 + 1.5 * iqr); // Máximo de 8 horas

    const finalTimes = realisticTimes.filter(time => time >= lowerBound && time <= upperBound);

    console.log('🎯 [DELIVERY TIME] Remoção de outliers:', {
        totalInicial: realisticTimes.length,
        totalFinal: finalTimes.length,
        removidos: realisticTimes.length - finalTimes.length,
        limites: `${lowerBound.toFixed(2)} - ${upperBound.toFixed(2)} min`,
    });
    
    if (finalTimes.length === 0) {
        console.log('⚠️ [DELIVERY TIME] Todos os dados foram removidos como outliers. Usando a média inicial.');
        return {
            avgDeliveryTime: initialAvg,
            usedColumn: true,
            samplesCount: realisticTimes.length,
            columnFound
        };
    }
    
    const totalWaitingTime = finalTimes.reduce((sum, minutes) => sum + minutes, 0);
    const avgDeliveryTimeMinutes = totalWaitingTime / finalTimes.length;
    
    console.log('✅ [DELIVERY TIME] Resultado final:', {
        avgDeliveryTimeMinutes: avgDeliveryTimeMinutes.toFixed(2),
        samplesUsed: finalTimes.length,
        colunaUtilizada: columnFound,
        validade: avgDeliveryTimeMinutes >= 5 ? '✅ Realista' : '⚠️ Ainda muito baixo'
    });
    
    return {
        avgDeliveryTime: avgDeliveryTimeMinutes,
        usedColumn: true,
        samplesCount: finalTimes.length,
        columnFound: columnFound
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
  console.log('📊 [Time Metrics] Iniciando cálculo do tempo de entrega...');
  const deliveryTimeResult = calculateDeliveryTimeFromColumn(deliveries);
  
  console.log('📊 [Time Metrics] Resultado do cálculo de entrega:', {
      usedColumn: deliveryTimeResult.usedColumn,
      avgDeliveryTime: deliveryTimeResult.avgDeliveryTime,
      samplesCount: deliveryTimeResult.samplesCount
  });
  
  let avgDeliveryTime: number;
  let avgDeliveryMs: number;
  let deliveryTimeMethod: string;

  if (deliveryTimeResult.usedColumn) {
      avgDeliveryTime = deliveryTimeResult.avgDeliveryTime;
      avgDeliveryMs = avgDeliveryTime * 60 * 1000;
      deliveryTimeMethod = `Coluna "Delivered Waiting Time" (${deliveryTimeResult.samplesCount} amostras)`;
      console.log('✅ [Time Metrics] Usando dados da coluna "Delivered Waiting Time"');
  } else {
      console.log('⚠️ [Time Metrics] Coluna não disponível, usando fallback para timestamps...');
      const deliveryDurations = parsedDeliveries
          .filter(d => d.collected_at && d.delivered_at)
          .map(d => d.delivered_at!.getTime() - d.collected_at!.getTime())
          .filter(duration => duration >= 0);
      avgDeliveryMs = avgDuration(deliveryDurations);
      avgDeliveryTime = avgDeliveryMs / 1000 / 60;
      deliveryTimeMethod = `Cálculo (delivered_at - collected_at) (${deliveryDurations.length} amostras)`;
      console.log('📊 [Time Metrics] Fallback calculado:', {
          deliveryDurations: deliveryDurations.length,
          avgDeliveryTime: avgDeliveryTime.toFixed(2)
      });
  }

  // --- TEMPO TOTAL (Experiência do Cliente) ---
  const experienceDurationsInMinutes = deliveries
    .map(d => {
      const collectionMinutes = parseHHMMSSToMinutes(d['Collected Waiting Time'] ?? d.collectedWaitingTime);
      const deliveryMinutes = parseHHMMSSToMinutes(d['Delivered Waiting Time'] ?? d.deliveredWaitingTime);

      if (collectionMinutes && deliveryMinutes && collectionMinutes > 0 && deliveryMinutes > 0) {
        return collectionMinutes + deliveryMinutes;
      }
      return null;
    })
    .filter((totalMinutes): totalMinutes is number => totalMinutes !== null);

  let avgCustomerExperienceTime: number;
  let avgCustomerExperienceMs: number;

  if (experienceDurationsInMinutes.length > 0) {
    const totalMinutes = experienceDurationsInMinutes.reduce((sum, mins) => sum + mins, 0);
    avgCustomerExperienceTime = totalMinutes / experienceDurationsInMinutes.length;
    avgCustomerExperienceMs = avgCustomerExperienceTime * 60 * 1000;
  } else {
    // Fallback para timestamps se as colunas não forem suficientes
  const customerExperienceDurations = parsedDeliveries
      .filter(d => d.created_at && d.delivered_at)
      .map(d => d.delivered_at!.getTime() - d.created_at!.getTime())
      .filter(duration => duration >= 0);
    avgCustomerExperienceMs = avgDuration(customerExperienceDurations);
    avgCustomerExperienceTime = avgCustomerExperienceMs / 1000 / 60;
  }

  console.log('✅ Métricas de Tempo Calculadas:', {
      collection: `${avgCollectionTime.toFixed(2)} min`,
      delivery: `${avgDeliveryTime.toFixed(2)} min`,
      total: `${avgCustomerExperienceTime.toFixed(2)} min`,
      collectionTimeMethod,
      deliveryTimeMethod,
      usandoDeliveredWaitingTime: deliveryTimeResult.usedColumn,
      amostrasDeliveredWaitingTime: deliveryTimeResult.usedColumn ? deliveryTimeResult.samplesCount : 0
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
    console.log('🏁 ===== INICIANDO CÁLCULO GERAL DE MÉTRICAS USANDO COLUNAS DE WAITING TIME =====');
    
    const collectionMetrics = calculateCollectionTimeFromColumn(deliveries);
    const avgCollectionTime = collectionMetrics.avgCollectionTime || 0;

    const deliveryMetrics = calculateDeliveryTimeFromColumn(deliveries);
    const avgDeliveryTime = deliveryMetrics.avgDeliveryTime || 0;
    
    // O tempo total agora é a soma direta das duas médias calculadas
    const avgCustomerExperienceTime = avgCollectionTime + avgDeliveryTime;

    console.log('✅ ===== CÁLCULO GERAL FINALIZADO =====', {
        avgCollectionTime: avgCollectionTime.toFixed(2),
        avgDeliveryTime: avgDeliveryTime.toFixed(2),
        avgCustomerExperienceTime: avgCustomerExperienceTime.toFixed(2),
        calculationMethod: 'Soma das médias de coleta e entrega.'
    });

        return {
        avgCollectionTime,
        avgDeliveryTime,
        avgCustomerExperienceTime,
        avgCollectionTimeFormatted: formatDurationFromMs(avgCollectionTime * 60 * 1000),
        avgDeliveryTimeFormatted: formatDurationFromMs(avgDeliveryTime * 60 * 1000),
        avgCustomerExperienceTimeFormatted: formatDurationFromMs(avgCustomerExperienceTime * 60 * 1000),
        usedWaitingTimeForCollection: collectionMetrics.usedColumn,
        usedWaitingTimeForDelivery: deliveryMetrics.usedColumn,
        collectionTimeMethod: collectionMetrics.usedColumn ? `Coluna ("${collectionMetrics.columnFound}")` : 'Timestamps (fallback)',
        deliveryTimeMethod: deliveryMetrics.usedColumn ? `Coluna ("${deliveryMetrics.columnFound}")` : 'Timestamps (fallback)'
    };
}

/**
 * Função de diagnóstico avançado para analisar formatos de dados de tempo
 */
export function advancedTimeDataDiagnosis(deliveries: any[]) {
    console.log('🔬 [DIAGNÓSTICO AVANÇADO] ===== ANÁLISE COMPLETA DOS DADOS DE TEMPO =====');
    
    const sample = deliveries.slice(0, 50); // Analisar 50 registros
    
    // Identificar todas as colunas que podem conter tempo
    const allColumns = new Set();
    sample.forEach(delivery => {
        Object.keys(delivery).forEach(key => {
            if (key.toLowerCase().includes('time') || 
                key.toLowerCase().includes('waiting') ||
                key.toLowerCase().includes('duration')) {
                allColumns.add(key);
            }
        });
    });
    
    console.log('📋 [DIAGNÓSTICO] Colunas relacionadas a tempo encontradas:', Array.from(allColumns));
    
    // Analisar cada coluna de tempo
    allColumns.forEach(columnName => {
        const columnNameStr = String(columnName);
        console.log(`\n🔍 [DIAGNÓSTICO] Analisando coluna: "${columnNameStr}"`);
        
        const columnData = sample.map((delivery, index) => {
            const rawValue = delivery[columnNameStr];
    return {
                index,
                id: delivery.id,
                rawValue,
                type: typeof rawValue,
                stringValue: String(rawValue),
                isNumber: !isNaN(Number(rawValue)),
                hasColon: String(rawValue).includes(':'),
                convertedMinutes: parseTimeToMinutes(rawValue)
            };
        }).filter(item => item.rawValue !== undefined && item.rawValue !== null && item.rawValue !== '');
        
        if (columnData.length === 0) {
            console.log(`❌ [DIAGNÓSTICO] Coluna "${columnNameStr}" não tem dados válidos`);
            return;
        }
        
        // Estatísticas da coluna
        const types = [...new Set(columnData.map(item => item.type))];
        const hasColonCount = columnData.filter(item => item.hasColon).length;
        const isNumberCount = columnData.filter(item => item.isNumber).length;
        const validConversions = columnData.filter(item => item.convertedMinutes !== null);
        
        console.log(`📊 [DIAGNÓSTICO] "${columnNameStr}" - Estatísticas:`, {
            totalRegistros: columnData.length,
            tipos: types,
            comDoisPontos: hasColonCount,
            numericos: isNumberCount,
            conversoesValidas: validConversions.length,
            taxaConversao: ((validConversions.length / columnData.length) * 100).toFixed(1) + '%'
        });
        
        // Amostras dos dados
        console.log(`🔍 [DIAGNÓSTICO] "${columnNameStr}" - Primeiros 10 valores:`, 
            columnData.slice(0, 10).map(item => ({
                raw: item.rawValue,
                tipo: item.type,
                string: item.stringValue,
                temDoisPontos: item.hasColon,
                ehNumero: item.isNumber,
                convertido: item.convertedMinutes?.toFixed(2)
            }))
        );
        
        // Identificar padrões
        const patterns = {
            'HH:mm:ss': columnData.filter(item => /^\d{1,2}:\d{2}:\d{2}$/.test(item.stringValue)).length,
            'mm:ss': columnData.filter(item => /^\d{1,3}:\d{2}$/.test(item.stringValue)).length,
            'decimal': columnData.filter(item => /^\d*\.\d+$/.test(item.stringValue)).length,
            'integer': columnData.filter(item => /^\d+$/.test(item.stringValue)).length,
            'other': 0
        };
        patterns.other = columnData.length - (patterns['HH:mm:ss'] + patterns['mm:ss'] + patterns.decimal + patterns.integer);
        
        console.log(`🎯 [DIAGNÓSTICO] "${columnNameStr}" - Padrões identificados:`, patterns);
        
        if (validConversions.length > 0) {
            const convertedValues = validConversions.map(item => item.convertedMinutes!);
            console.log(`✅ [DIAGNÓSTICO] "${columnNameStr}" - Valores convertidos:`, {
                min: Math.min(...convertedValues).toFixed(2),
                max: Math.max(...convertedValues).toFixed(2),
                media: (convertedValues.reduce((sum, v) => sum + v, 0) / convertedValues.length).toFixed(2),
                mediana: convertedValues.sort((a, b) => a - b)[Math.floor(convertedValues.length / 2)]?.toFixed(2)
            });
        }
    });
    
    console.log('\n🏁 [DIAGNÓSTICO] Análise completa finalizada');
}
