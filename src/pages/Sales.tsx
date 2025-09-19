import React, { useState, useEffect } from 'react';
import { Plus, Eye, Search, ShoppingCart } from 'lucide-react';
import pb, { Sale, Product } from '../lib/pocketbase';

export const Sales: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadSales();
    loadProducts();
  }, []);

  const loadSales = async () => {
    try {
      const records = await pb.collection('sales').getFullList({
        sort: '-created',
      });
      setSales(records as Sale[]);
    } catch (error) {
      console.error('Error cargando ventas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const records = await pb.collection('products').getFullList();
      setProducts(records as Product[]);
    } catch (error) {
      console.error('Error cargando productos:', error);
    }
  };

  const filteredSales = sales.filter(sale =>
    sale.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.customer_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const SaleModal: React.FC = () => {
    const [saleItems, setSaleItems] = useState<any[]>([]);
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState(1);

    const addItem = () => {
      const product = products.find(p => p.id === selectedProduct);
      if (!product) return;

      const existingItemIndex = saleItems.findIndex(item => item.product_id === selectedProduct);
      
      if (existingItemIndex >= 0) {
        const updatedItems = [...saleItems];
        updatedItems[existingItemIndex].quantity += quantity;
        updatedItems[existingItemIndex].total = updatedItems[existingItemIndex].quantity * product.price;
        setSaleItems(updatedItems);
      } else {
        const newItem = {
          product_id: product.id,
          product_name: product.name,
          quantity,
          price: product.price,
          total: quantity * product.price,
        };
        setSaleItems([...saleItems, newItem]);
      }

      setSelectedProduct('');
      setQuantity(1);
    };

    const removeItem = (index: number) => {
      setSaleItems(saleItems.filter((_, i) => i !== index));
    };

    const total = saleItems.reduce((sum, item) => sum + item.total, 0);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (saleItems.length === 0) return;

      try {
        const saleData = {
          items: saleItems,
          total,
          customer_name: customerName || undefined,
          customer_email: customerEmail || undefined,
          status: 'completed',
        };

        await pb.collection('sales').create(saleData);
        
        // Actualizar stock de productos
        for (const item of saleItems) {
          const product = products.find(p => p.id === item.product_id);
          if (product) {
            await pb.collection('products').update(product.id!, {
              stock: product.stock - item.quantity,
            });
          }
        }

        await loadSales();
        await loadProducts();
        setShowModal(false);
        setSaleItems([]);
        setCustomerName('');
        setCustomerEmail('');
      } catch (error) {
        console.error('Error guardando venta:', error);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">Nueva Venta</h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Cliente (opcional)
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email del Cliente (opcional)
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Agregar Productos</h4>
              <div className="flex gap-3 mb-4">
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar producto...</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - ${product.price} (Stock: {product.stock})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={addItem}
                  disabled={!selectedProduct}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Agregar
                </button>
              </div>

              {saleItems.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Producto</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Cantidad</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Precio Unit.</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Total</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {saleItems.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-4 py-2">{item.product_name}</td>
                          <td className="px-4 py-2">{item.quantity}</td>
                          <td className="px-4 py-2">${item.price.toFixed(2)}</td>
                          <td className="px-4 py-2">${item.total.toFixed(2)}</td>
                          <td className="px-4 py-2">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t bg-gray-50">
                        <td colSpan={3} className="px-4 py-2 font-medium">Total:</td>
                        <td className="px-4 py-2 font-bold">${total.toFixed(2)}</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saleItems.length === 0}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Completar Venta
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Ventas</h1>
          <p className="text-gray-600">Gestiona las ventas de tu negocio</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Venta
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {sale.customer_name || 'Cliente Anónimo'}
                      </div>
                      {sale.customer_email && (
                        <div className="text-sm text-gray-500">{sale.customer_email}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sale.items?.length || 0} productos
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${sale.total?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        sale.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : sale.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {sale.status === 'completed' ? 'Completada' : 
                       sale.status === 'pending' ? 'Pendiente' : 'Cancelada'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(sale.created || '').toLocaleDateString('es-AR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No se encontraron ventas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && <SaleModal />}
    </div>
  );
};
