import { parseISO, isValid } from 'date-fns';

/**
 * Parses time data from various formats into total minutes.
 * Supports: HH:mm:ss, mm:ss, pure numbers (seconds or minutes), decimal values
 * @param timeValue The time value to parse
 * @returns Total minutes as a number, or null if invalid.
 */
export function parseTimeToMinutes(timeValue: any): number | null {
  if (timeValue === null || timeValue === undefined || timeValue === '') {
    return null;
  }

  const timeString = String(timeValue).trim();
  
  // Se for um número, vamos analisá-lo com mais cuidado
  if (!isNaN(Number(timeString)) && !timeString.includes(':')) {
    const numValue = parseFloat(timeString);
    
    // CORREÇÃO DA HEURÍSTICA:
    // Para delivery/collection times, valores pequenos (1-10) são mais prováveis serem minutos que horas
    // Apenas valores decimais pequenos (0.1-2.0) podem ser horas
    if (numValue > 0 && numValue < 3 && numValue % 1 !== 0) {
      // Decimal pequeno - provavelmente são horas decimais (ex: 0.5h = 30min, 1.5h = 90min)
      const minutesFromDecimalHours = numValue * 60;
      console.log(`📊 [parseTimeToMinutes] Interpretando número decimal ${numValue} como HORAS -> ${minutesFromDecimalHours.toFixed(2)} minutos.`);
      return minutesFromDecimalHours;
    }
    
    // Para números inteiros pequenos (1-20), mais provável que sejam minutos
    if (Number.isInteger(numValue) && numValue > 0 && numValue <= 20) {
      console.log(`📊 [parseTimeToMinutes] Interpretando número inteiro pequeno ${numValue} como MINUTOS.`);
      return numValue;
    }
    
    // Para números médios (21-480), provavelmente são minutos
    if (numValue >= 21 && numValue <= 480) { // 21 min a 8 horas
      console.log(`📊 [parseTimeToMinutes] Interpretando ${numValue} como MINUTOS.`);
      return numValue;
    }

    // Se for um número muito grande, podem ser segundos
    if (numValue > 480) {
        const minutesFromSeconds = numValue / 60;
        console.log(`📊 [parseTimeToMinutes] Interpretando ${numValue} como SEGUNDOS -> ${minutesFromSeconds.toFixed(2)} minutos.`);
        return minutesFromSeconds;
    }

    // Números muito grandes como horas (apenas se > 24)
    if (numValue > 24 && numValue < 168) { // Entre 24h e 7 dias 
        const minutesFromLargeHours = numValue * 60;
        console.log(`📊 [parseTimeToMinutes] Interpretando número grande ${numValue} como HORAS -> ${minutesFromLargeHours} minutos.`);
        return minutesFromLargeHours;
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
    
    // Encontrar todos os valores válidos usando os nomes corretos das colunas
    const possibleColumnNames = [
        'collected_waiting_time',     // Nome correto da estrutura FoxDelivery
        'collectedWaitingTime',       // CamelCase version
        'Collected Waiting Time',     // Display name variation
        'collection_waiting_time',    // Alternative snake_case
        'collectionWaitingTime'       // Alternative camelCase
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
        console.log('📋 [COLLECTION TIME] Exemplo de estrutura dos dados:', Object.keys(deliveries[0] || {}));
        
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
        .filter(minutes => minutes > 0 && minutes <= 600); // 1 min a 10 horas (mais flexível)

    if (validWaitingTimes.length === 0) {
        console.log('⚠️ [COLLECTION TIME] Nenhum dado realista encontrado após filtragem');
        return { avgCollectionTime: 0, usedColumn: false, samplesCount: 0, columnFound };
    }

    // Remoção de outliers menos agressiva
    const sortedTimes = [...validWaitingTimes].sort((a, b) => a - b);
    const q1 = sortedTimes[Math.floor(sortedTimes.length * 0.25)];
    const q3 = sortedTimes[Math.floor(sortedTimes.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = Math.max(0.5, q1 - 2 * iqr);      // Menos agressivo
    const upperBound = Math.min(600, q3 + 2 * iqr);      // Menos agressivo

    const filteredTimes = validWaitingTimes.filter(time => time >= lowerBound && time <= upperBound);

    console.log('🎯 [COLLECTION TIME] Remoção de outliers:', {
        valoresOriginais: validWaitingTimes.length,
        valoresAposRemocaoOutliers: filteredTimes.length,
        limitesIQR: `${lowerBound.toFixed(2)} - ${upperBound.toFixed(2)} minutos`,
        outliersRemovidos: validWaitingTimes.length - filteredTimes.length,
        percentualRemovido: ((validWaitingTimes.length - filteredTimes.length) / validWaitingTimes.length * 100).toFixed(1) + '%'
    });

    if (filteredTimes.length === 0) {
        console.log('⚠️ [COLLECTION TIME] Todos os valores foram removidos como outliers. Usando média original.');
        const avgOriginal = validWaitingTimes.reduce((sum, time) => sum + time, 0) / validWaitingTimes.length;
        return {
            avgCollectionTime: avgOriginal,
            usedColumn: true,
            samplesCount: validWaitingTimes.length,
            columnFound
        };
    }

    const totalWaitingTime = filteredTimes.reduce((sum, time) => sum + time, 0);
    const avgCollectionTime = totalWaitingTime / filteredTimes.length;
    
    console.log('✅ [COLLECTION TIME] Resultado final:', {
        avgCollectionTime: avgCollectionTime.toFixed(2),
        samplesUsed: filteredTimes.length,
        colunaUtilizada: columnFound,
        percentualDados: ((filteredTimes.length / deliveries.length) * 100).toFixed(1) + '% dos dados totais',
        validade: avgCollectionTime >= 1 ? '✅ Realista' : '⚠️ Muito baixo'
    });
    
    return {
        avgCollectionTime,
        usedColumn: true,
        samplesCount: filteredTimes.length,
        columnFound
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
        // Usar os nomes corretos das colunas baseado na estrutura FoxDelivery
        const rawValue = d['delivered_waiting_time'] ?? d.delivered_waiting_time ?? d.deliveredWaitingTime;
        return {
            index,
            id: d.id,
            rawValue,
            valueType: typeof rawValue,
            convertedMinutes: parseTimeToMinutes(rawValue)
        };
    });

    console.log('🔍 [DELIVERY TIME] Análise detalhada dos primeiros 20 valores:', dataAnalysis);
    
    // Encontrar todos os valores válidos usando os nomes corretos das colunas
    const possibleColumnNames = [
        'delivered_waiting_time',     // Nome correto da estrutura FoxDelivery
        'deliveredWaitingTime',       // CamelCase version
        'Delivered Waiting Time',     // Display name variation
        'delivery_waiting_time',      // Alternative snake_case
        'deliveryWaitingTime'         // Alternative camelCase
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
            console.log(`✅ [DELIVERY TIME] Coluna encontrada: "${columnName}" com ${values.length} valores válidos.`);
            break;
        }
    }
    
    if (!columnFound) {
        console.log('❌ [DELIVERY TIME] Nenhuma coluna de tempo de entrega válida encontrada!');
        console.log('📋 [DELIVERY TIME] Colunas tentadas:', possibleColumnNames);
        console.log('📋 [DELIVERY TIME] Exemplo de estrutura dos dados:', Object.keys(deliveries[0] || {}));
        
        return { avgDeliveryTime: 0, usedColumn: false, samplesCount: 0, columnFound: null };
    }

    // Filtro inicial para valores realistas (mínimo de 5 minutos, máximo de 8 horas)
    const realisticTimes = allWaitingTimeValues
        .map(item => item.convertedMinutes!)
        .filter(minutes => minutes >= 1 && minutes <= 600); // 1 min a 10 horas (mais flexível)

    if (realisticTimes.length === 0) {
        console.log('⚠️ [DELIVERY TIME] Nenhum dado de tempo de entrega realista (1min - 10h) encontrado.');
        console.log('📊 [DELIVERY TIME] Valores originais encontrados:', allWaitingTimeValues.slice(0, 10).map(item => ({
            raw: item.rawValue,
            converted: item.convertedMinutes
        })));
        return { avgDeliveryTime: 0, usedColumn: true, samplesCount: 0, columnFound };
    }
    
    const initialAvg = realisticTimes.reduce((sum, minutes) => sum + minutes, 0) / realisticTimes.length;
    console.log(`📈 [DELIVERY TIME] Média inicial (pré-outliers): ${initialAvg.toFixed(2)} min, com ${realisticTimes.length} amostras.`);

    // Remoção de outliers com IQR (menos agressiva)
    const sortedTimes = [...realisticTimes].sort((a, b) => a - b);
    const q1 = sortedTimes[Math.floor(sortedTimes.length * 0.25)];
    const q3 = sortedTimes[Math.floor(sortedTimes.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = Math.max(1, q1 - 2 * iqr);      // Menos agressivo: 2x IQR em vez de 1.5x
    const upperBound = Math.min(600, q3 + 2 * iqr);    // Menos agressivo: 2x IQR em vez de 1.5x

    const finalTimes = realisticTimes.filter(time => time >= lowerBound && time <= upperBound);

    console.log('🎯 [DELIVERY TIME] Remoção de outliers:', {
        totalInicial: realisticTimes.length,
        totalFinal: finalTimes.length,
        removidos: realisticTimes.length - finalTimes.length,
        limites: `${lowerBound.toFixed(2)} - ${upperBound.toFixed(2)} min`,
        percentualRemovido: ((realisticTimes.length - finalTimes.length) / realisticTimes.length * 100).toFixed(1) + '%'
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
        percentualDados: ((finalTimes.length / deliveries.length) * 100).toFixed(1) + '% dos dados totais',
        validade: avgDeliveryTimeMinutes >= 1 ? '✅ Realista' : '⚠️ Ainda muito baixo'
    });
    
    return {
        avgDeliveryTime: avgDeliveryTimeMinutes,
        usedColumn: true,
        samplesCount: finalTimes.length,
        columnFound: columnFound
    };
}

/**
 * Calculates all time-based metrics for a set of deliveries using real timestamps.
 * Adopts a functional approach with map/filter/reduce for clarity.
 * Now prioritizes "collected_waiting_time" and "delivered_waiting_time" columns for better accuracy.
 * @param deliveries The delivery data array, expected to have timestamps and waiting time columns.
 * @returns An object with average times in minutes and formatted strings.
 */
export function calculateAllTimeMetricsFromWaitingColumn(deliveries: any[]) {
    console.log('🏁 ===== INICIANDO CÁLCULO GERAL DE MÉTRICAS USANDO COLUNAS DE WAITING TIME =====');
    
  if (!deliveries || deliveries.length === 0) {
        console.warn('⚠️ [METRICS] Nenhum dado de entrega fornecido');
    return {
        avgCollectionTime: 0,
        avgDeliveryTime: 0,
        avgCustomerExperienceTime: 0,
        avgCollectionTimeFormatted: '00:00:00',
        avgDeliveryTimeFormatted: '00:00:00',
        avgCustomerExperienceTimeFormatted: '00:00:00',
        usedWaitingTimeForCollection: false,
            usedWaitingTimeForDelivery: false,
            collectionTimeMethod: 'N/A - Sem dados',
            deliveryTimeMethod: 'N/A - Sem dados'
    };
  }
    
    console.log('📊 [METRICS] Analisando dados:', {
        totalEntregas: deliveries.length,
        exemploEstrutura: Object.keys(deliveries[0] || {}).slice(0, 10),
        temCamposWaitingTime: {
            collected: deliveries.some(d => d.collected_waiting_time || d.collectedWaitingTime),
            delivered: deliveries.some(d => d.delivered_waiting_time || d.deliveredWaitingTime)
        }
    });
    
    const collectionMetrics = calculateCollectionTimeFromColumn(deliveries);
    const deliveryMetrics = calculateDeliveryTimeFromColumn(deliveries);
    
    // Fallback para timestamps se as colunas waiting time não funcionarem
    let avgCollectionTime = collectionMetrics.avgCollectionTime || 0;
    let avgDeliveryTime = deliveryMetrics.avgDeliveryTime || 0;
    let usedWaitingTimeForCollection = collectionMetrics.usedColumn;
    let usedWaitingTimeForDelivery = deliveryMetrics.usedColumn;
    let collectionTimeMethod = collectionMetrics.usedColumn 
        ? `Coluna "${collectionMetrics.columnFound}" (${collectionMetrics.samplesCount} amostras)`
        : 'Colunas waiting time não encontradas';
    let deliveryTimeMethod = deliveryMetrics.usedColumn 
        ? `Coluna "${deliveryMetrics.columnFound}" (${deliveryMetrics.samplesCount} amostras)`
        : 'Colunas waiting time não encontradas';

    // Se não conseguimos dados das colunas waiting time, tentar usar timestamps
    if (!usedWaitingTimeForCollection || !usedWaitingTimeForDelivery) {
        console.log('⚠️ [METRICS] Tentando fallback para timestamps...');
        
        const timestampDeliveries = deliveries.map(d => ({
    id: d.id,
    created_at: parseDate(d.created_at || d.createdAt),
    collected_at: parseDate(d.collected_at || d.collectedAt),
    delivered_at: parseDate(d.delivered_at || d.deliveredAt),
  }));

        // Fallback para tempo de coleta
        if (!usedWaitingTimeForCollection) {
            const collectionDurations = timestampDeliveries
          .filter(d => d.created_at && d.collected_at)
          .map(d => d.collected_at!.getTime() - d.created_at!.getTime())
                .filter(duration => duration >= 0 && duration <= 24 * 60 * 60 * 1000) // Max 24 horas
                .map(duration => duration / (1000 * 60)); // Converter para minutos
            
            if (collectionDurations.length > 0) {
                avgCollectionTime = collectionDurations.reduce((sum, duration) => sum + duration, 0) / collectionDurations.length;
                collectionTimeMethod = `Timestamps (created_at → collected_at) (${collectionDurations.length} amostras)`;
                console.log(`✅ [METRICS] Fallback collection time: ${avgCollectionTime.toFixed(2)} min`);
            } else {
                // Último fallback: estimativa padrão baseada na indústria
                avgCollectionTime = 25; // 25 minutos como estimativa padrão
                collectionTimeMethod = 'Estimativa padrão da indústria (25 min)';
                console.log('⚠️ [METRICS] Usando estimativa padrão para tempo de coleta');
            }
        }
        
        // Fallback para tempo de entrega
        if (!usedWaitingTimeForDelivery) {
            const deliveryDurations = timestampDeliveries
          .filter(d => d.collected_at && d.delivered_at)
          .map(d => d.delivered_at!.getTime() - d.collected_at!.getTime())
                .filter(duration => duration >= 0 && duration <= 10 * 60 * 60 * 1000) // Max 10 horas
                .map(duration => duration / (1000 * 60)); // Converter para minutos
            
            if (deliveryDurations.length > 0) {
                avgDeliveryTime = deliveryDurations.reduce((sum, duration) => sum + duration, 0) / deliveryDurations.length;
                deliveryTimeMethod = `Timestamps (collected_at → delivered_at) (${deliveryDurations.length} amostras)`;
                console.log(`✅ [METRICS] Fallback delivery time: ${avgDeliveryTime.toFixed(2)} min`);
  } else {
                // Último fallback: estimativa padrão baseada na indústria
                avgDeliveryTime = 35; // 35 minutos como estimativa padrão
                deliveryTimeMethod = 'Estimativa padrão da indústria (35 min)';
                console.log('⚠️ [METRICS] Usando estimativa padrão para tempo de entrega');
            }
        }
    }
    
    // O tempo total é a soma das duas médias
    const avgCustomerExperienceTime = avgCollectionTime + avgDeliveryTime;

    console.log('✅ ===== CÁLCULO GERAL FINALIZADO =====', {
        avgCollectionTime: avgCollectionTime.toFixed(2) + ' min',
        avgDeliveryTime: avgDeliveryTime.toFixed(2) + ' min', 
        avgCustomerExperienceTime: avgCustomerExperienceTime.toFixed(2) + ' min',
        usedWaitingTimeForCollection,
        usedWaitingTimeForDelivery,
        collectionTimeMethod,
        deliveryTimeMethod,
        calculationMethod: 'Soma das médias de coleta e entrega'
    });

        return {
        avgCollectionTime,
        avgDeliveryTime,
        avgCustomerExperienceTime,
        avgCollectionTimeFormatted: formatDurationFromMs(avgCollectionTime * 60 * 1000),
        avgDeliveryTimeFormatted: formatDurationFromMs(avgDeliveryTime * 60 * 1000),
        avgCustomerExperienceTimeFormatted: formatDurationFromMs(avgCustomerExperienceTime * 60 * 1000),
        usedWaitingTimeForCollection,
        usedWaitingTimeForDelivery,
        collectionTimeMethod,
        deliveryTimeMethod
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
