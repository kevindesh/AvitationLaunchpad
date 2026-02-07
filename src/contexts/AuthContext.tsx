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

const LOCAL_STORAGE_USERS_KEY = "aviation_users_db";
const LOCAL_STORAGE_CURRENT_USER_KEY = "aviation_current_user";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_CURRENT_USER_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  const saveUserAndLogin = (userData: User) => {
    // Save to current session
    localStorage.setItem(LOCAL_STORAGE_CURRENT_USER_KEY, JSON.stringify(userData));
    setUser(userData);
    
    // Save/Update in "Database"
    const usersRaw = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    const users: User[] = usersRaw ? JSON.parse(usersRaw) : [];
    const existingIndex = users.findIndex(u => u.email === userData.email);
    
    if (existingIndex >= 0) {
      users[existingIndex] = userData;
    } else {
      users.push(userData);
    }
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
  };

  const login = useCallback(async (email: string, _password: string): Promise<{ error?: string }> => {
    // Simple mock check against local DB
    const usersRaw = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    const users: User[] = usersRaw ? JSON.parse(usersRaw) : [];
    const foundUser = users.find(u => u.email === email);

    if (foundUser) {
      localStorage.setItem(LOCAL_STORAGE_CURRENT_USER_KEY, JSON.stringify(foundUser));
      setUser(foundUser);
      return {};
    }
    
    // Fallback for "demo" (if not found, create implicit member for now to not break existing flow totally, or just error)
    // For specific request, we want to prevent duplicates/mismatches. 
    return { error: "User not found. Please register first." }; 
  }, []);

  const loginWithGoogle = useCallback(async (credential: string, role?: User["role"], customName?: string, phoneNumber?: string): Promise<{ error?: string }> => {
    try {
      const decoded: any = jwtDecode(credential);
      const email = decoded.email;
      
      const usersRaw = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
      const users: User[] = usersRaw ? JSON.parse(usersRaw) : [];
      const existingUser = users.find(u => u.email === email);

      // SCENARIO 1: Registration (Role is provided)
      if (role) {
        if (existingUser) {
          return { error: "Account already exists. Please sign in instead." };
        }
        
        // Create new user
        const newUser: User = {
          id: decoded.sub || `g-${Date.now()}`,
          email,
          name: customName || decoded.name || email.split("@")[0],
          role: role,
          phoneNumber
        };
        saveUserAndLogin(newUser);
        return {};
      }

      // SCENARIO 2: Sign In (No role provided)
      if (existingUser) {
        localStorage.setItem(LOCAL_STORAGE_CURRENT_USER_KEY, JSON.stringify(existingUser));
        setUser(existingUser);
        return {};
      } else {
        return { error: "Account not found. Please register first." };
      }

    } catch (error) {
      console.error("Google login error:", error);
      return { error: "Failed to process Google login" };
    }
  }, []);

  const register = useCallback(
    async (email: string, _password: string, name: string, role: User["role"], phoneNumber?: string): Promise<{ error?: string }> => {
      const usersRaw = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
      const users: User[] = usersRaw ? JSON.parse(usersRaw) : [];
      
      if (users.find(u => u.email === email)) {
        return { error: "User already exists" };
      }

      const newUser: User = { id: `u-${Date.now()}`, email, name, role, phoneNumber };
      saveUserAndLogin(newUser);
      return {};
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem(LOCAL_STORAGE_CURRENT_USER_KEY);
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