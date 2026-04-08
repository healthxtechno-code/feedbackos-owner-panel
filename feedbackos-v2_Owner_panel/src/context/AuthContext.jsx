import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

// Store token in memory only — never localStorage/sessionStorage
let _token = null;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const getToken = useCallback(() => _token, []);

  const login = useCallback(async (username, password) => {
    setIsLoading(true);
    try {
      const data = await authAPI.login(username, password);
      _token = data.token;
      setUser({ username: data.username || username, role: 'owner' });
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Authentication failed. Please check your credentials.' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout(_token);
    } catch (_) {
      // Silently fail — still clear token
    } finally {
      _token = null;
      setUser(null);
    }
  }, []);

  const updateProfile = useCallback(async (payload) => {
    const data = await authAPI.updateProfile(payload, _token);
    if (data.username) setUser(prev => ({ ...prev, username: data.username }));
    return data;
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, getToken, updateProfile, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
