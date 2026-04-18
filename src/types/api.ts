/**
 * Tipos TypeScript para APIs do Vault Inventory
 * Usado para type safety em fetches e responses
 */

export interface Product {
  id: string;
  name: string;
  sku: string;
  category?: string;
  price: number;
  stock: number;
  maxStock: number;
  location?: string;
  ncm?: string;
  icms?: number;
  ipi?: number;
  pis?: number;
  invoiceNumber?: string;
  supplierId?: string | null;
  image?: string | null;
  status: 'ativo' | 'excluido';
  updatedAt: string;
  createdAt?: string;
}

export interface Movement {
  id: number;
  type: 'entry' | 'exit' | 'transfer' | 'product_transfer' | 'initial';
  productId: string;
  targetProductId?: string | null;
  quantity: number;
  origin?: string;
  destination?: string;
  date?: string;
  time?: string;
  note?: string | null;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  code?: string;
  cnpj?: string;
  city?: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string;
  createdAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'operator' | 'user';
  createdAt?: string;
}

export interface ApiError {
  error: string;
}

export type ApiResponse<T> = T | ApiError;
