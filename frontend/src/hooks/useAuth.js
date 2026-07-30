import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter } from 'next/router';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const userData = await api.get('/users/me');
        setUser(userData);
      } catch (err) {
        console.error('Failed to load user:', err);
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      setUser(data);
      router.push('/dashboard');
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password, codeforcesUsername, leetcodeUsername) => {
    setLoading(true);
    try {
      const data = await api.post('/auth/register', {
        username,
        email,
        password,
        codeforcesUsername,
        leetcodeUsername,
      });
      localStorage.setItem('token', data.token);
      setUser(data);
      router.push('/dashboard');
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/login');
  };

  // Merge partial updates into user state without a full refetch
  const updateUser = (partialUpdate) => {
    setUser((prev) => ({ ...prev, ...partialUpdate }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
