import PocketBase from 'pocketbase';

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090');

// Configurar auto-cancelación de requests cuando el componente se desmonta
pb.autoCancellation(false);

export default pb;

export type User = {
  id: string;
  email: string;
  name: string;
  avatar?: string;
};

export type Product = {
  id?: string;
  name: string;
  code: string;
  price: number;
  stock: number;
  description?: string;
  category: string;
  created?: string;
  updated?: string;
};

export type Sale = {
  id?: string;
  items: SaleItem[];
  total: number;
  customer_name?: string;
  customer_email?: string;
  status: 'pending' | 'completed' | 'cancelled';
  created?: string;
  updated?: string;
};

export type SaleItem = {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
};

export type Invoice = {
  id?: string;
  invoice_number: string;
  sale_id: string;
  customer_name: string;
  customer_email?: string;
  customer_address?: string;
  customer_cuit?: string;
  iban_code?: string;
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  due_date: string;
  created?: string;
  updated?: string;
};
