import { describe, it, expect } from 'vitest';
import { clienteCreateSchema, clienteUpdateSchema } from '@/lib/validations/clientes';

describe('createCliente data flow', () => {
  it('validates form data through the schema', () => {
    const formData = new FormData();
    formData.set('nombre', 'Test Corp');
    formData.set('tipo', 'B2B');
    formData.set('email', 'test@corp.com');

    const raw = Object.fromEntries(formData);
    const result = clienteCreateSchema.safeParse(raw);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nombre).toBe('Test Corp');
      expect(result.data.tipo).toBe('B2B');
    }
  });

  it('returns field errors for invalid form data', () => {
    const formData = new FormData();
    formData.set('nombre', '');
    formData.set('tipo', 'INVALID');
    formData.set('email', 'bad-email');

    const raw = Object.fromEntries(formData);
    const result = clienteCreateSchema.safeParse(raw);

    expect(result.success).toBe(false);
  });

  it('handles missing optional fields from form data', () => {
    const formData = new FormData();
    formData.set('nombre', 'Test Corp');
    formData.set('tipo', 'B2B');
    formData.set('email', 'test@corp.com');
    // telefono, ciudad, etc. are not set

    const raw = Object.fromEntries(formData);
    const result = clienteCreateSchema.safeParse(raw);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.telefono).toBeNull();
      expect(result.data.ciudad).toBeNull();
    }
  });

  it('handles empty string optional fields from form data', () => {
    const formData = new FormData();
    formData.set('nombre', 'Test Corp');
    formData.set('tipo', 'B2B');
    formData.set('email', 'test@corp.com');
    formData.set('telefono', '');
    formData.set('notas', '');

    const raw = Object.fromEntries(formData);
    const result = clienteCreateSchema.safeParse(raw);

    // Empty strings for optional string fields should be OK (pass min=0 implicit)
    // since they're .optional().nullable().default(null) - empty string passes string()
    expect(result.success).toBe(true);
  });

  it('flattens errors the same way as the action does', () => {
    const formData = new FormData();
    formData.set('nombre', '');
    formData.set('tipo', 'INVALID');
    formData.set('email', 'bad');

    const raw = Object.fromEntries(formData);
    const result = clienteCreateSchema.safeParse(raw);

    expect(result.success).toBe(false);
    if (!result.success) {
      const flattened = result.error.flatten();
      expect(flattened).toHaveProperty('fieldErrors');
      expect(flattened).toHaveProperty('formErrors');
      // The action uses: { errors: result.error.flatten().fieldErrors }
      expect(typeof flattened.fieldErrors).toBe('object');
      // At least one field should have errors
      expect(Object.keys(flattened.fieldErrors).length).toBeGreaterThan(0);
    }
  });
});

describe('updateCliente data flow', () => {
  it('validates partial form data through update schema', () => {
    const formData = new FormData();
    formData.set('nombre', 'Updated Corp');

    const raw = Object.fromEntries(formData);
    const result = clienteUpdateSchema.safeParse(raw);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nombre).toBe('Updated Corp');
      // The partial schema keeps defaults for optional fields,
      // so result.data will include null defaults for those
      expect(Object.keys(result.data).length).toBeGreaterThanOrEqual(1);
    }
  });
});
