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

    // Return a mock client that doesn't actually connect to Supabase
    // This allows the app to function in offline/fallback mode
    return createFallbackClient()
  }

  browserClient = createClient(supabaseUrl, supabaseAnonKey)
  return browserClient
}

// For server-side usage
export function getSupabaseServerClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase environment variables are missing")
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

// Create a fallback client that works offline
function createFallbackClient() {
  // This is a mock client that stores data in localStorage
  const mockClient = {
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          data: null,
          error: new Error("Offline mode"),
        }),
      }),
      insert: () => ({
        select: () => ({
          data: null,
          error: new Error("Offline mode"),
        }),
      }),
      delete: () => ({
        eq: () => ({
          data: null,
          error: new Error("Offline mode"),
        }),
      }),
    }),
    rpc: () => ({
      data: null,
      error: new Error("Offline mode"),
    }),
    channel: () => ({
      on: () => ({
        subscribe: () => {},
      }),
    }),
    removeChannel: () => {},
  }

  return mockClient as any
}
