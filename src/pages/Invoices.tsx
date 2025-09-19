import React, { useState, useEffect } from 'react';
import { Plus, Download, Eye, Search } from 'lucide-react';
import { IBANScanner } from '../components/Scanner/IBANScanner';
import pb, { Invoice, Sale } from '../lib/pocketbase';

export const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadInvoices();
    loadSales();
  }, []);

  const loadInvoices = async () => {
    try {
      const records = await pb.collection('invoices').getFullList({
        sort: '-created',
      });
      setInvoices(records as Invoice[]);
    } catch (error) {
      console.error('Error cargando facturas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSales = async () => {
    try {
      const records = await pb.collection('sales').getFullList({
        filter: 'status="completed"',
      });
      setSales(records as Sale[]);
    } catch (error) {
      console.error('Error cargando ventas:', error);
    }
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const InvoiceModal: React.FC = () => {
    const [formData, setFormData] = useState({
      invoice_number: `INV-${Date.now()}`,
      sale_id: '',
      customer_name: '',
      customer_email: '',
      customer_address: '',
      customer_cuit: '',
      iban_code: '',
      tax: 21, // IVA 21%
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 días
      status: 'draft' as const,
    });

    const selectedSale = sales.find(s => s.id === formData.sale_id);
    const subtotal = selectedSale?.total || 0;
    const taxAmount = (subtotal * formData.tax) / 100;
    const total = subtotal + taxAmount;

    const handleSaleChange = (saleId: string) => {
      const sale = sales.find(s => s.id === saleId);
      if (sale) {
        setFormData({
          ...formData,
          sale_id: saleId,
          customer_name: sale.customer_name || '',
          customer_email: sale.customer_email || '',
        });
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedSale) return;

      try {
        const invoiceData = {
          ...formData,
          subtotal,
          tax: taxAmount,
          total,
        };

        await pb.collection('invoices').create(invoiceData);
        await loadInvoices();
        setShowModal(false);
      } catch (error) {
        console.error('Error guardando factura:', error);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">Nueva Factura</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Factura
                </label>
                <input
                  type="text"
                  value={formData.invoice_number}
                  onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Venta Asociada
                </label>
                <select
                  value={formData.sale_id}
                  onChange={(e) => handleSaleChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar venta...</option>
                  {sales.map((sale) => (
                    <option key={sale.id} value={sale.id}>
                      {sale.customer_name || 'Cliente Anónimo'} - ${sale.total?.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Cliente
                </label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email del Cliente
                </label>
                <input
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección del Cliente
              </label>
              <textarea
                value={formData.customer_address}
                onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CUIT del Cliente
                </label>
                <input
                  type="text"
                  value={formData.customer_cuit}
                  onChange={(e) => setFormData({ ...formData, customer_cuit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="20-12345678-9"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código IBAN
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.iban_code}
                    onChange={(e) => setFormData({ ...formData, iban_code: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="ES91 2100 0418 4502 0005 1332"
                  />
                  <IBANScanner
                    onIBANDetected={(iban) => setFormData({ ...formData, iban_code: iban })}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IVA (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.tax}
                  onChange={(e) => setFormData({ ...formData, tax: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Vencimiento
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">Borrador</option>
                  <option value="sent">Enviada</option>
                  <option value="paid">Pagada</option>
                  <option value="overdue">Vencida</option>
                </select>
              </div>
            </div>

            {selectedSale && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Resumen de Factura</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA ({formData.tax}%):</span>
                    <span>${taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-1">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!formData.sale_id}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Crear Factura
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Facturas</h1>
          <p className="text-gray-600">Gestiona las facturas de tu negocio</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Factura
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar facturas..."
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
                  Número
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vencimiento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invoice.invoice_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{invoice.customer_name}</div>
                      {invoice.customer_email && (
                        <div className="text-sm text-gray-500">{invoice.customer_email}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${invoice.total?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        invoice.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : invoice.status === 'sent'
                          ? 'bg-blue-100 text-blue-800'
                          : invoice.status === 'overdue'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {invoice.status === 'paid' ? 'Pagada' :
                       invoice.status === 'sent' ? 'Enviada' :
                       invoice.status === 'overdue' ? 'Vencida' : 'Borrador'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(invoice.due_date).toLocaleDateString('es-AR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No se encontraron facturas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && <InvoiceModal />}
    </div>
  );
};
