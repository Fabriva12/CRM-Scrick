import { describe, it, expect } from 'vitest';
import { clienteSchema, clienteCreateSchema, clienteUpdateSchema, TIPOS } from '../clientes';

describe('clienteSchema', () => {
  describe('valid data', () => {
    it('accepts a minimal valid B2B client', () => {
      const result = clienteSchema.safeParse({
        nombre: 'Tech Corp',
        tipo: 'B2B',
        email: 'contacto@techcorp.com',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nombre).toBe('Tech Corp');
        expect(result.data.tipo).toBe('B2B');
        expect(result.data.email).toBe('contacto@techcorp.com');
        // Optional fields default to null
        expect(result.data.telefono).toBeNull();
        expect(result.data.ciudad).toBeNull();
        expect(result.data.rfc).toBeNull();
        expect(result.data.empresa).toBeNull();
        expect(result.data.notas).toBeNull();
      }
    });

    it('accepts a valid B2C client with all fields', () => {
      const result = clienteSchema.safeParse({
        nombre: 'Juan Pérez',
        tipo: 'B2C',
        email: 'juan@email.com',
        telefono: '555-1234',
        ciudad: 'Ciudad de México',
        rfc: 'XAXX010101000',
        empresa: 'Mi Empresa S.A.',
        notas: 'Cliente frecuente',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nombre).toBe('Juan Pérez');
        expect(result.data.tipo).toBe('B2C');
        expect(result.data.telefono).toBe('555-1234');
        expect(result.data.ciudad).toBe('Ciudad de México');
        expect(result.data.notas).toBe('Cliente frecuente');
      }
    });

    it('accepts optional fields as null', () => {
      const result = clienteSchema.safeParse({
        nombre: 'Test',
        tipo: 'B2C',
        email: 'test@test.com',
        telefono: null,
        ciudad: null,
        rfc: null,
        empresa: null,
        notas: null,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.telefono).toBeNull();
        expect(result.data.ciudad).toBeNull();
      }
    });
  });

  describe('validation errors', () => {
    it('rejects empty nombre', () => {
      const result = clienteSchema.safeParse({
        nombre: '',
        tipo: 'B2C',
        email: 'test@test.com',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('nombre'))).toBe(
          true
        );
      }
    });

    it('rejects invalid tipo', () => {
      const result = clienteSchema.safeParse({
        nombre: 'Test',
        tipo: 'WHOLESALE',
        email: 'test@test.com',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid email format', () => {
      const result = clienteSchema.safeParse({
        nombre: 'Test',
        tipo: 'B2C',
        email: 'not-an-email',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty email', () => {
      const result = clienteSchema.safeParse({
        nombre: 'Test',
        tipo: 'B2C',
        email: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('email'))).toBe(
          true
        );
      }
    });

    it('rejects nombre longer than 256 chars', () => {
      const result = clienteSchema.safeParse({
        nombre: 'a'.repeat(257),
        tipo: 'B2C',
        email: 'test@test.com',
      });
      expect(result.success).toBe(false);
    });

    it('rejects ciudad longer than 128 chars', () => {
      const result = clienteSchema.safeParse({
        nombre: 'Test',
        tipo: 'B2C',
        email: 'test@test.com',
        ciudad: 'a'.repeat(129),
      });
      expect(result.success).toBe(false);
    });

    it('rejects rfc longer than 13 chars', () => {
      const result = clienteSchema.safeParse({
        nombre: 'Test',
        tipo: 'B2C',
        email: 'test@test.com',
        rfc: 'a'.repeat(14),
      });
      expect(result.success).toBe(false);
    });

    it('rejects empresa longer than 256 chars', () => {
      const result = clienteSchema.safeParse({
        nombre: 'Test',
        tipo: 'B2C',
        email: 'test@test.com',
        empresa: 'a'.repeat(257),
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing required fields', () => {
      const result = clienteSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path[0]);
        expect(paths).toContain('nombre');
        expect(paths).toContain('tipo');
        expect(paths).toContain('email');
      }
    });
  });
});

describe('clienteCreateSchema', () => {
  it('is an alias of clienteSchema', () => {
    expect(clienteCreateSchema).toBe(clienteSchema);
  });
});

describe('clienteUpdateSchema', () => {
  it('accepts partial data', () => {
    const result = clienteUpdateSchema.safeParse({ nombre: 'New Name' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nombre).toBe('New Name');
    }
  });

  it('accepts empty object (partial update)', () => {
    const result = clienteUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('still validates individual field constraints', () => {
    const result = clienteUpdateSchema.safeParse({ nombre: '' });
    expect(result.success).toBe(false);
  });

  it('still validates email format on partial', () => {
    const result = clienteUpdateSchema.safeParse({ email: 'bad' });
    expect(result.success).toBe(false);
  });
});

describe('TIPOS constant', () => {
  it('contains B2B and B2C', () => {
    expect(TIPOS).toEqual(['B2B', 'B2C']);
  });
});
