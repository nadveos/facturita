import React, { createContext, useContext, useEffect, useState } from 'react';
import pb, { User } from '../lib/pocketbase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay un usuario autenticado al cargar la app
    if (pb.authStore.isValid) {
      setUser(pb.authStore.model as User);
    }
    setLoading(false);

    // Escuchar cambios en el estado de autenticación
    pb.authStore.onChange(() => {
      setUser(pb.authStore.isValid ? (pb.authStore.model as User) : null);
    });
  }, []);

  const login = async (email: string, password: string) => {
    const authData = await pb.collection('users').authWithPassword(email, password);
    setUser(authData.record as User);
  };

  const register = async (email: string, password: string, name: string) => {
    const data = {
      email,
      password,
      passwordConfirm: password,
      name,
    };
    
    await pb.collection('users').create(data);
    await login(email, password);
  };

  const logout = () => {
    pb.authStore.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
