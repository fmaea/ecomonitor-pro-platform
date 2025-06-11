import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import api from '../services/api'; // For potential future use (e.g., fetching user profile on load)

// Define the shape of the user object and auth state
interface User {
  id: string | number;
  email: string;
  username: string;
  role: string;
  firstName?: string;
  lastName?: string;
  // Add other user properties as needed
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (token: string, userData: User) => void;
  logout: () => void;
  // register: (registrationData: any) => Promise<any>; // Optional: if register logic is complex
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true, // Start with loading true to check local storage
  });

  useEffect(() => {
    // Check local storage for token and user data on initial load
    const token = localStorage.getItem('authToken');
    const userDataString = localStorage.getItem('authUser');

    if (token && userDataString) {
      try {
        const userData: User = JSON.parse(userDataString);
        setAuthState({
          user: userData,
          token: token,
          isAuthenticated: true,
          isLoading: false,
        });
        // You might want to set the token in api default headers here too if not using interceptor for all cases
        // api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        console.error("Failed to parse user data from local storage", error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        setAuthState({ user: null, token: null, isAuthenticated: false, isLoading: false });
      }
    } else {
      setAuthState({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('authUser', JSON.stringify(userData));
    // api.defaults.headers.common['Authorization'] = `Bearer ${token}`; // Handled by interceptor
    setAuthState({
      user: userData,
      token: token,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    // delete api.defaults.headers.common['Authorization']; // Handled by interceptor (token will be null)
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
    // Optionally redirect to login page or home page
    // window.location.href = '/login'; // Or use react-router navigate
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
