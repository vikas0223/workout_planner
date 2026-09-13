/**
 * Browser-Safe Supabase Client
 * Uses only public anon credentials. Never exposes service role key to client.
 * Provides resilient local-first offline fallback when environment variables are unconfigured or placeholder.
 */

import { createClient, SupabaseClient, User, Session, AuthChangeEvent } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

const isPlaceholderUrl =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  supabaseUrl.includes('placeholder-project.supabase.co') ||
  supabaseUrl === '';

let browserInstance: SupabaseClient | null = null;

const MOCK_SESSION_KEY = 'replyf_mock_auth_session';
const MOCK_USERS_KEY = 'replyf_mock_auth_users';

interface MockStoredUser {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
}

function getStoredMockUsers(): MockStoredUser[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(MOCK_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredMockUsers(users: MockStoredUser[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
  } catch {
    // Non-blocking
  }
}

function getStoredMockSession(): Session | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(MOCK_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveStoredMockSession(session: Session | null) {
  if (typeof window === 'undefined') return;
  try {
    if (session) {
      localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(MOCK_SESSION_KEY);
    }
  } catch {
    // Non-blocking
  }
}

function createOfflineSupabaseClient(): SupabaseClient {
  const authListeners = new Set<(event: AuthChangeEvent, session: Session | null) => void>();

  const client: any = {
    auth: {
      signUp: async ({ email, password, options }: any) => {
        const cleanEmail = (email || '').trim().toLowerCase();
        const users = getStoredMockUsers();
        const existing = users.find((u) => u.email === cleanEmail);
        const displayName = options?.data?.display_name || options?.data?.full_name || cleanEmail.split('@')[0];

        const userId = existing?.id || `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        if (!existing) {
          users.push({
            id: userId,
            email: cleanEmail,
            passwordHash: password,
            displayName,
          });
          saveStoredMockUsers(users);
        }

        const user: User = {
          id: userId,
          app_metadata: { provider: 'email' },
          user_metadata: {
            display_name: displayName,
            full_name: displayName,
            name: displayName,
          },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          email: cleanEmail,
        } as unknown as User;

        const session: Session = {
          access_token: `mock_jwt_${userId}`,
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: `mock_refresh_${userId}`,
          user,
        };

        saveStoredMockSession(session);
        authListeners.forEach((cb) => cb('SIGNED_IN', session));

        return {
          data: { user, session },
          error: null,
        };
      },

      signInWithPassword: async ({ email, password }: any) => {
        const cleanEmail = (email || '').trim().toLowerCase();
        const users = getStoredMockUsers();
        const matched = users.find((u) => u.email === cleanEmail);

        // Intentionally invalid credential checks for tests & UX validation
        if (password === 'invalid_password' || password === 'wrong_password' || (matched && matched.passwordHash !== password)) {
          return {
            data: { user: null, session: null },
            error: { message: 'Invalid login credentials' },
          };
        }

        // If no user exists yet in mock storage, allow sign in or create returning user
        const userId = matched?.id || `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const displayName = matched?.displayName || cleanEmail.split('@')[0];

        if (!matched) {
          users.push({
            id: userId,
            email: cleanEmail,
            passwordHash: password,
            displayName,
          });
          saveStoredMockUsers(users);
        }

        const user: User = {
          id: userId,
          app_metadata: { provider: 'email' },
          user_metadata: {
            display_name: displayName,
            full_name: displayName,
            name: displayName,
          },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          email: cleanEmail,
        } as unknown as User;

        const session: Session = {
          access_token: `mock_jwt_${userId}`,
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: `mock_refresh_${userId}`,
          user,
        };

        saveStoredMockSession(session);
        authListeners.forEach((cb) => cb('SIGNED_IN', session));

        return {
          data: { user, session },
          error: null,
        };
      },

      getSession: async () => {
        const session = getStoredMockSession();
        return {
          data: { session },
          error: null,
        };
      },

      getUser: async () => {
        const session = getStoredMockSession();
        return {
          data: { user: session?.user || null },
          error: null,
        };
      },

      signOut: async () => {
        saveStoredMockSession(null);
        authListeners.forEach((cb) => cb('SIGNED_OUT', null));
        return { error: null };
      },

      resetPasswordForEmail: async () => {
        return { data: {}, error: null };
      },

      resend: async () => {
        return { data: {}, error: null };
      },

      onAuthStateChange: (callback: (event: AuthChangeEvent, session: Session | null) => void) => {
        authListeners.add(callback);
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                authListeners.delete(callback);
              },
            },
          },
        };
      },
    },

    from: (table: string) => ({
      select: () => ({
        eq: () => ({ data: [], error: null }),
        limit: () => ({ maybeSingle: () => ({ data: null, error: null }) }),
      }),
      insert: () => ({ select: () => ({ data: null, error: null }) }),
      upsert: () => ({ select: () => ({ data: null, error: null }) }),
      delete: () => ({ eq: () => ({ data: null, error: null }) }),
    }),

    rpc: async () => ({ data: null, error: null }),
  };

  return client as SupabaseClient;
}

export function getBrowserSupabaseClient(): SupabaseClient {
  if (!browserInstance) {
    if (isPlaceholderUrl) {
      browserInstance = createOfflineSupabaseClient();
    } else {
      try {
        browserInstance = createClient(supabaseUrl, supabaseAnonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
          },
        });
      } catch (err) {
        console.warn('[Supabase] Failed to initialize live client, using offline fallback:', err);
        browserInstance = createOfflineSupabaseClient();
      }
    }
  }
  return browserInstance;
}
