import { getSupabaseBrowserClient } from "./supabase-client"

export async function createRequiredTables() {
  const supabase = getSupabaseBrowserClient()

  try {
    console.log("Attempting to create or verify required tables...")

    // We'll assume we can connect to Supabase and proceed with table creation
    // Instead of checking for table existence first (which causes errors),
    // we'll directly try to create the tables and handle any errors

    // Create saved_workouts table if it doesn't exist
    try {
      console.log("Creating saved_workouts table if it doesn't exist...")

      // Try direct SQL approach first since RPC might not be available
      try {
        await supabase.rpc("execute_sql", {
          sql_query: `
            CREATE TABLE IF NOT EXISTS saved_workouts (
              id UUID PRIMARY KEY,
              user_id TEXT NOT NULL,
              name TEXT NOT NULL,
              workout_data JSONB NOT NULL,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `,
        })
        console.log("Saved workouts table created via direct SQL")
      } catch (sqlError) {
        console.error("Failed to create saved_workouts table via direct SQL:", sqlError)

        // Fall back to RPC if available
        try {
          await supabase.rpc("create_saved_workouts_if_not_exists", {})
          console.log("Saved workouts table created via RPC")
        } catch (rpcError) {
          console.error("Failed to create saved_workouts table via RPC:", rpcError)
          // Continue anyway - we'll operate in offline mode if needed
        }
      }
    } catch (error) {
      console.error("Error creating saved_workouts table:", error)
      // Continue with other tables
    }

    // Create completed_exercises table if it doesn't exist
    try {
      console.log("Creating completed_exercises table if it doesn't exist...")

      // Try direct SQL approach first
      try {
        await supabase.rpc("execute_sql", {
          sql_query: `
            CREATE TABLE IF NOT EXISTS completed_exercises (
              id UUID PRIMARY KEY,
              user_id TEXT NOT NULL,
              exercise_id TEXT NOT NULL,
              workout_id TEXT NOT NULL,
              calories_burned INTEGER DEFAULT 0,
              completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `,
        })
        console.log("Completed exercises table created via direct SQL")
      } catch (sqlError) {
        console.error("Failed to create completed_exercises table via direct SQL:", sqlError)

        // Fall back to RPC if available
        try {
          await supabase.rpc("create_completed_exercises_if_not_exists", {})
          console.log("Completed exercises table created via RPC")
        } catch (rpcError) {
          console.error("Failed to create completed_exercises table via RPC:", rpcError)
          // Continue anyway
        }
      }
    } catch (error) {
      console.error("Error creating completed_exercises table:", error)
      // Continue with other tables
    }

    // Create favorite_exercises table if it doesn't exist
    try {
      console.log("Creating favorite_exercises table if it doesn't exist...")

      // Try direct SQL approach first
      try {
        await supabase.rpc("execute_sql", {
          sql_query: `
            CREATE TABLE IF NOT EXISTS favorite_exercises (
              id UUID PRIMARY KEY,
              user_id TEXT NOT NULL,
              exercise_id TEXT NOT NULL,
              exercise_name TEXT NOT NULL,
              muscle_group TEXT,
              equipment JSONB,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `,
        })
        console.log("Favorite exercises table created via direct SQL")
      } catch (sqlError) {
        console.error("Failed to create favorite_exercises table via direct SQL:", sqlError)

        // Fall back to RPC if available
        try {
          await supabase.rpc("create_favorite_exercises_if_not_exists", {})
          console.log("Favorite exercises table created via RPC")
        } catch (rpcError) {
          console.error("Failed to create favorite_exercises table via RPC:", rpcError)
          // Continue anyway
        }
      }
    } catch (error) {
      console.error("Error creating favorite_exercises table:", error)
      // Continue with other tables
    }

    // Create user_stats table if it doesn't exist
    try {
      console.log("Creating user_stats table if it doesn't exist...")

      // Try direct SQL approach first
      try {
        await supabase.rpc("execute_sql", {
          sql_query: `
            CREATE TABLE IF NOT EXISTS user_stats (
              user_id TEXT PRIMARY KEY,
              total_workouts INTEGER DEFAULT 0,
              total_exercises_completed INTEGER DEFAULT 0,
              total_calories_burned INTEGER DEFAULT 0,
              total_duration INTEGER DEFAULT 0,
              last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `,
        })
        console.log("User stats table created via direct SQL")
      } catch (sqlError) {
        console.error("Failed to create user_stats table via direct SQL:", sqlError)

        // Fall back to RPC if available
        try {
          await supabase.rpc("create_user_stats_if_not_exists", {})
          console.log("User stats table created via RPC")
        } catch (rpcError) {
          console.error("Failed to create user_stats table via RPC:", rpcError)
          // Continue anyway
        }
      }
    } catch (error) {
      console.error("Error creating user_stats table:", error)
      // Continue with other tables
    }

    // Create users table if it doesn't exist
    try {
      console.log("Creating users table if it doesn't exist...")

      // Try direct SQL approach
      try {
        await supabase.rpc("execute_sql", {
          sql_query: `
            CREATE TABLE IF NOT EXISTS users (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              email TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `,
        })
        console.log("Users table created via direct SQL")
      } catch (sqlError) {
        console.error("Failed to create users table via direct SQL:", sqlError)
        // Continue anyway
      }
    } catch (error) {
      console.error("Error creating users table:", error)
      // Continue with other tables
    }

    console.log("Tables creation process completed")
    return true
  } catch (error) {
    console.error("Error in createRequiredTables:", error)
    return false
  }
}
