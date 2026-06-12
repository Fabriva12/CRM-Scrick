export interface Cliente {
  id: string;
  nombre: string;
  tipo: 'B2B' | 'B2C';
  email: string | null;
  telefono: string | null;
  ciudad: string | null;
  rfc: string | null;
  empresa: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export type ClienteActionResult = {
  errors?: {
    nombre?: string[];
    tipo?: string[];
    email?: string[];
    telefono?: string[];
    ciudad?: string[];
    rfc?: string[];
    empresa?: string[];
    notas?: string[];
    _form?: string[];
  };
  data?: Cliente;
  message?: string;
};
