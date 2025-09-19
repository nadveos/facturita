import React, { useEffect, useState } from 'react';
import { Package, ShoppingCart, FileText, DollarSign } from 'lucide-react';
import { StatsCard } from '../components/Dashboard/StatsCard';
import pb from '../lib/pocketbase';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    totalInvoices: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Cargar estadísticas desde PocketBase
      const [products, sales, invoices] = await Promise.all([
        pb.collection('products').getList(1, 1, { filter: '' }),
        pb.collection('sales').getList(1, 1, { filter: 'status="completed"' }),
        pb.collection('invoices').getList(1, 1, { filter: '' }),
      ]);

      // Calcular revenue total
      const allSales = await pb.collection('sales').getFullList({ filter: 'status="completed"' });
      const totalRevenue = allSales.reduce((sum, sale) => sum + (sale.total || 0), 0);

      setStats({
        totalProducts: products.totalItems,
        totalSales: sales.totalItems,
        totalInvoices: invoices.totalItems,
        totalRevenue,
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Resumen general de tu negocio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Productos"
          value={stats.totalProducts}
          icon={Package}
          color="blue"
        />
        <StatsCard
          title="Ventas Completadas"
          value={stats.totalSales}
          icon={ShoppingCart}
          color="green"
        />
        <StatsCard
          title="Facturas Emitidas"
          value={stats.totalInvoices}
          icon={FileText}
          color="yellow"
        />
        <StatsCard
          title="Ingresos Totales"
          value={`$${stats.totalRevenue.toLocaleString('es-AR', { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2 
          })}`}
          icon={DollarSign}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
          <div className="space-y-3">
            <button className="w-full p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
              <div className="font-medium text-blue-900">Agregar Producto</div>
              <div className="text-sm text-blue-600">Añadir nuevo producto al inventario</div>
            </button>
            <button className="w-full p-3 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
              <div className="font-medium text-green-900">Nueva Venta</div>
              <div className="text-sm text-green-600">Registrar una nueva venta</div>
            </button>
            <button className="w-full p-3 text-left bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors">
              <div className="font-medium text-yellow-900">Crear Factura</div>
              <div className="text-sm text-yellow-600">Generar nueva factura</div>
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Productos con Stock Bajo</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <div>
                <div className="font-medium text-red-900">Producto Ejemplo</div>
                <div className="text-sm text-red-600">Stock: 5 unidades</div>
              </div>
              <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                Reponer
              </button>
            </div>
            <div className="text-center text-gray-500 py-4">
              No hay productos con stock bajo
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
