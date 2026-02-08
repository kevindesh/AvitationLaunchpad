import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface User {
  id: string;
  email: string;
  name: string;
  role: "member" | "mentee" | "mentor";
  phoneNumber?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  loginWithGoogle: (credential: string, role?: User["role"], customName?: string, phoneNumber?: string) => Promise<{ error?: string }>;
  register: (email: string, password: string, name: string, role: User["role"], phoneNumber?: string) => Promise<{ error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata.name || session.user.email?.split("@")[0] || "",
          role: session.user.user_metadata.role || "member",
          phoneNumber: session.user.user_metadata.phone_number
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
         setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata.name || session.user.email?.split("@")[0] || "",
          role: session.user.user_metadata.role || "member",
          phoneNumber: session.user.user_metadata.phone_number
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
       return { error: error.message };
    }
    return {};
  }, []);

  const loginWithGoogle = useCallback(async (credential: string, role?: User["role"], customName?: string, phoneNumber?: string): Promise<{ error?: string }> => {
     // NOTE: This existing function used 'credential' from a specific library (likely @react-oauth/google).
     // Supabase handles Google Auth differently (via redirection).
     // To keep it simple, we will reuse the existing flow but just sign in normally if possible, 
     // or instruct the user that we are switching to Supabase Auth.
     
     // However, for now, we will just simulate the existing behavior but utilizing Supabase if possible.
     // Actually, Supabase Google Auth requires redirect. The existing code takes an ID Token (`credential`).
     
     // To use Supabase correctly, we should use `supabase.auth.signInWithOAuth`.
     // But that breaks the UI flow (requires redirect).
     
     // Alternative: Exchange the Google ID Token for a Supabase Session (IdToken grant).
     const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: credential,
     });
     
     if (error) {
        return { error: error.message };
     }
     
     // If registering (first time), update metadata
     if (role && data.user) {
        await supabase.auth.updateUser({
           data: {
             role,
             name: customName || data.user.user_metadata.name,
             phone_number: phoneNumber
           }
        });
     }
     
     return {};
  }, []);

  const register = useCallback(async (email: string, password: string, name: string, role: User["role"], phoneNumber?: string): Promise<{ error?: string }> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
          phone_number: phoneNumber
        }
      }
    });

    if (error) {
      if (error.message.includes("registered") || error.status === 422) {
        return { error: "Account already exists. Please sign in." };
      }
      return { error: error.message };
    }
    
    // Check for existing user in "Fake Success" mode (Confirm Email enabled)
    if (data.user && !data.session) {
        if (data.user.identities && data.user.identities.length === 0) {
             return { error: "Account already exists. Please sign in." };
        }
    }

    // Check if user already exists (strictly via timestamps)
    // If it's a new user, created_at and last_sign_in_at are nearly identical.
    // If it's an existing user logging in via signUp, last_sign_in_at is newer.
    if (data.user && data.session && data.user.last_sign_in_at) {
       const createdAt = new Date(data.user.created_at).getTime();
       const lastSignIn = new Date(data.user.last_sign_in_at).getTime();

       // If last sign in is more than 500ms after creation, it's an existing user
       if (lastSignIn - createdAt > 500) {
           await supabase.auth.signOut();
           return { error: "Account already exists. Please sign in." };
       }
    }
    
    return {};
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);


  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        loginWithGoogle,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
