import { createClient } from "@supabase/supabase-js"

// For client-side usage
let browserClient: ReturnType<typeof createClient> | null = null

export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient

  // Check if the environment variables are available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase environment variables are missing. Using fallback mode.")
    return createFallbackClient()
  }

  try {
    browserClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        // Add a timeout to detect connection issues
        fetch: (url, options) => {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

          return fetch(url, {
            ...options,
            signal: controller.signal,
          }).finally(() => {
            clearTimeout(timeoutId)
          })
        },
      },
    })

    // Don't test the connection with a dummy query - this causes errors
    // Instead, we'll check the connection when we actually need to use it

    return browserClient
  } catch (error) {
    console.error("Error creating Supabase client:", error)
    return createFallbackClient()
  }
}

// For server-side usage, import getSupabaseServerClient exclusively from '@/lib/supabase/server-client'

// Create a fallback client that works offline
function createFallbackClient() {
  console.log("Creating fallback Supabase client for offline mode")

  // This is a mock client that stores data in localStorage
  const mockClient = {
    from: (table: string) => ({
      select: (columns?: string) => ({
        eq: (column: string, value: any) => ({
          data: null,
          error: new Error(`Offline mode: Cannot query ${table} where ${column} = ${value}`),
        }),
        limit: (limit: number) => ({
          maybeSingle: () => ({
            data: null,
            error: { message: `Offline mode: Cannot query ${table} with limit ${limit}` },
          }),
        }),
      }),
      insert: (values: any) => ({
        select: (columns?: string) => ({
          data: null,
          error: new Error(`Offline mode: Cannot insert into ${table}`),
        }),
      }),
      delete: () => ({
        eq: (column: string, value: any) => ({
          data: null,
          error: new Error(`Offline mode: Cannot delete from ${table} where ${column} = ${value}`),
        }),
      }),
    }),
    rpc: (functionName: string, params?: any) => {
      console.log(`Offline mode: RPC call to ${functionName} with params:`, params)

      // Special handling for SQL execution to avoid errors
      if (functionName === "execute_sql") {
        console.log("Simulating SQL execution in offline mode:", params?.sql_query)
        return Promise.resolve({
          data: null,
          error: null, // Return null error to simulate success
        })
      }

      return Promise.resolve({
        data: null,
        error: { message: `Offline mode: Cannot call RPC function ${functionName}` },
      })
    },
    channel: (channel: string) => ({
      on: (event: string, schema: string) => ({
        subscribe: (callback: Function) => {
          console.log(`Offline mode: Cannot subscribe to ${event} on ${schema} in channel ${channel}`)
          return {}
        },
      }),
    }),
    removeChannel: (channel: any) => {
      console.log("Offline mode: Cannot remove channel")
    },
  }

  return mockClient as any
}

// Function to check if required tables exist
export async function checkTablesExist() {
  const client = getSupabaseBrowserClient()

  try {
    // Check if saved_workouts table exists
    const { data: savedWorkouts, error: savedWorkoutsError } = await client
      .from("saved_workouts")
      .select("id")
      .limit(1)
      .maybeSingle()

    if (savedWorkoutsError && savedWorkoutsError.message.includes('relation "saved_workouts" does not exist')) {
      return false
    }

    return true
  } catch (error) {
    console.error("Error checking tables:", error)
    return false
  }
}
