import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Layout/Sidebar';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Sales } from './pages/Sales';
import { Invoices } from './pages/Invoices';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // const { user, loading } = useAuth(); // Lógica de autenticación comentada temporalmente

  // --- INICIO: CAMBIO PROVISIONAL PARA SALTAR PROTECCIÓN DE RUTA ---
  // Se comenta la lógica de protección para permitir el acceso directo al dashboard.
  // Para reactivar, descomenta las líneas de arriba y el bloque de abajo, y elimina la siguiente línea.
  return <>{children}</>;
  // --- FIN: CAMBIO PROVISIONAL ---

  /*
  // Lógica de protección original (comentada)
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/auth" replace />;
  */
};

const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 lg:ml-0 overflow-auto">
        <main className="min-h-full">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/invoices" element={<Invoices />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
