import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FoxDelivery {
  job_id?: string
  collecting_driver?: string
  delivering_driver?: string
  customer_name?: string
  pickup_address?: string
  delivery_address?: string
  status?: string
  created_at?: string
  collected_at?: string
  delivered_at?: string
  cost?: number
  distance?: number
  service_type?: string
  company_name?: string
  [key: string]: any
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { csvData, filename } = await req.json()

    if (!csvData || !Array.isArray(csvData)) {
      return new Response(
        JSON.stringify({ error: 'Invalid CSV data provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing CSV file: ${filename} with ${csvData.length} rows`)

    // Transform and validate data
    const processedDeliveries: FoxDelivery[] = []
    const errors: string[] = []

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i]
      
      try {
        // Basic validation
        if (!row.job_id && !row.id) {
          errors.push(`Row ${i + 1}: Missing job_id or id`)
          continue
        }

        // Transform the data to match our schema
        const delivery: FoxDelivery = {
          id: row.id || row.job_id || `generated-${Date.now()}-${i}`,
          job_id: row.job_id || row.id,
          collecting_driver: row.collecting_driver || row.pickup_driver,
          delivering_driver: row.delivering_driver || row.delivery_driver || row.driver,
          customer_name: row.customer_name || row.client_name,
          pickup_address: row.pickup_address || row.from_address,
          delivery_address: row.delivery_address || row.to_address,
          status: row.status?.toLowerCase(),
          created_at: row.created_at || row.date_created,
          collected_at: row.collected_at || row.pickup_time,
          delivered_at: row.delivered_at || row.delivery_time,
          cost: parseFloat(row.cost || row.price || '0') || null,
          distance: parseFloat(row.distance || '0') || null,
          service_type: row.service_type || row.type,
          company_name: row.company_name || row.business_name,
          uploaded_at: new Date().toISOString(),
          uploaded_by: 'csv-processor'
        }

        // Remove undefined values
        Object.keys(delivery).forEach(key => {
          if (delivery[key] === undefined) {
            delete delivery[key]
          }
        })

        processedDeliveries.push(delivery)
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error.message}`)
      }
    }

    if (processedDeliveries.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No valid deliveries found in CSV', 
          errors: errors.slice(0, 10) // Limit error messages
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insert data in batches to avoid timeout
    const batchSize = 100
    let totalInserted = 0
    const insertErrors: string[] = []

    for (let i = 0; i < processedDeliveries.length; i += batchSize) {
      const batch = processedDeliveries.slice(i, i + batchSize)
      
      try {
        const { data, error } = await supabase
          .from('fox_deliveries')
          .upsert(batch, { 
            onConflict: 'job_id',
            ignoreDuplicates: false 
          })

        if (error) {
          console.error(`Batch ${Math.floor(i / batchSize) + 1} error:`, error)
          insertErrors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`)
        } else {
          totalInserted += batch.length
          console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} records`)
        }
      } catch (error) {
        console.error(`Batch ${Math.floor(i / batchSize) + 1} exception:`, error)
        insertErrors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`)
      }
    }

    // Calculate statistics
    const uniqueDrivers = new Set(
      processedDeliveries
        .filter(d => d.job_id)
        .map(d => d.job_id)
    ).size

    const stats = {
      totalRows: csvData.length,
      processedDeliveries: processedDeliveries.length,
      insertedDeliveries: totalInserted,
      uniqueJobIds: uniqueDrivers,
      validationErrors: errors.length,
      insertErrors: insertErrors.length
    }

    console.log('Processing complete:', stats)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully processed ${totalInserted} deliveries`,
        stats,
        errors: insertErrors.length > 0 ? insertErrors.slice(0, 5) : undefined
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 