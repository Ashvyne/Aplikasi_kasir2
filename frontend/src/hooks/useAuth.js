import { useAuthStore } from '../context/store';
import { useEffect } from 'react';

export const useAuth = () => {
  const { user, token, isAuthenticated, setAuth, logout } = useAuthStore();
  
  return { user, token, isAuthenticated, setAuth, logout };
};

export const useRequireAuth = () => {
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = '/login';
    }
  }, [isAuthenticated]);
};
