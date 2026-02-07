import React, { createContext, useContext, useState, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { toast } from "sonner";

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

  const login = useCallback(async (email: string, _password: string): Promise<{ error?: string }> => {
    // Mock login — replace with real auth later
    setUser({ id: "1", email, name: email.split("@")[0], role: "member" });
    return {};
  }, []);

  const loginWithGoogle = useCallback(async (credential: string, role?: User["role"], customName?: string, phoneNumber?: string): Promise<{ error?: string }> => {
    try {
      const decoded: any = jwtDecode(credential);
      // In a real app, you would verify this token with your backend here
      setUser({ 
        id: decoded.sub || "google-user", 
        email: decoded.email, 
        name: customName || decoded.name || decoded.email.split("@")[0], 
        role: role || "member",
        phoneNumber
      });
      return {};
    } catch (error) {
      console.error("Google login error:", error);
      return { error: "Failed to process Google login" };
    }
  }, []);

  const register = useCallback(
    async (email: string, _password: string, name: string, role: User["role"], phoneNumber?: string): Promise<{ error?: string }> => {
      setUser({ id: "1", email, name, role, phoneNumber });
      return {};
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, loginWithGoogle, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};