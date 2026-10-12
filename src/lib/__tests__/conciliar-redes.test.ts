import { describe, expect, it } from 'vitest';

import {
  clasificarFilas,
  faFechaDeCelda,
  normalizarNombreCliente,
  parsePlanillaRedes,
} from '../conciliar-redes';

// Header real de la planilla (16 columnas). Seriales: 46021 = 2025-12-30, 46025 = 2026-01-03...
const HEADER = [
  null,
  'Fecha',
  'Número',
  'Cliente',
  'Canal',
  'Distribuidor',
  'Paquetes',
  'Precio unitario ₡',
  'Costo de envío',
  'Cobro de envío',
  'Total por galletas',
  'Total con envío',
  'Costo total de la venta',
  'Margen de ganancia',
  'Estado entrega',
  'Pago',
];

function filaExcel(
  serial: number,
  numero: unknown,
  cliente: string,
  paquetes: number,
  precio: number,
  costoEnvio: number,
  cobroEnvio: number
): unknown[] {
  const totalGalletas = paquetes * precio;
  return [
    serial,
    serial,
    numero,
    cliente,
    'Redes sociales',
    'Amor en Paleta',
    paquetes,
    precio,
    costoEnvio,
    cobroEnvio,
    totalGalletas,
    totalGalletas + cobroEnvio,
    0,
    0,
    'Entregado',
    'Pagado',
  ];
}

/** Parsea una única fila de datos con totales ya resueltos. */
function unaFila(
  serial: number,
  cliente: string,
  paquetes: number,
  precio: number,
  costoEnvio: number,
  cobroEnvio: number
) {
  return parsePlanillaRedes([HEADER, filaExcel(serial, 999, cliente, paquetes, precio, costoEnvio, cobroEnvio)])
    .filas[0];
}

describe('faFechaDeCelda', () => {
  it('convierte serial de Excel a YYYY-MM-DD', () => {
    expect(faFechaDeCelda(46021)).toBe('2025-12-30');
    expect(faFechaDeCelda(46028)).toBe('2026-01-06');
  });

  it('acepta strings con formato YYYY-MM-DD', () => {
    expect(faFechaDeCelda('2026-02-14')).toBe('2026-02-14');
  });

  it('devuelve null para celdas vacías o inválidas', () => {
    expect(faFechaDeCelda(null)).toBeNull();
    expect(faFechaDeCelda('')).toBeNull();
  });
});

describe('normalizarNombreCliente', () => {
  it('minúsculas, sin tildes ni espacios sobrantes', () => {
    expect(normalizarNombreCliente('  José Arce ')).toBe('jose arce');
    expect(normalizarNombreCliente('María Celeste Rojas')).toBe('maria celeste rojas');
    expect(normalizarNombreCliente('NX Xtreme Zone (Guadalupe)')).toBe(
      'nx xtreme zone (guadalupe)'
    );
  });
});

describe('parsePlanillaRedes', () => {
  it('detecta el header, mapea columnas y calcula totales', () => {
    const rows = [
      ['Ventas por redes', null, null, null], // fila de título → el header real vive en la fila 2
      HEADER,
      filaExcel(46021, 72618864, 'Ericka Umaña', 10, 1800, 5400, 0),
      filaExcel(46028, 88693115, 'Jose Arce', 2, 2000, 2700, 2000),
    ];
    const { filas, duplicadas, omitidas } = parsePlanillaRedes(rows);

    expect(omitidas).toHaveLength(0);
    expect(duplicadas).toHaveLength(0);
    expect(filas).toHaveLength(2);

    const [ericka, jose] = filas;
    expect(ericka.fecha).toBe('2025-12-30');
    expect(ericka.numero).toBe('72618864');
    expect(ericka.cliente).toBe('Ericka Umaña');
    expect(ericka.paquetes).toBe(10);
    expect(ericka.precioUnitario).toBe(1800);
    expect(ericka.costoEnvio).toBe(5400);
    expect(ericka.cobroEnvio).toBe(0);
    expect(ericka.totalGalletas).toBe(18000);
    expect(ericka.totalConEnvio).toBe(18000);
    expect(ericka.estadoEntrega).toBe('Entregado');
    expect(ericka.pago).toBe('Pagado');
    expect(ericka.lineaExcel).toBe(3);

    // Con cobro de envío, el total sube
    expect(jose.totalConEnvio).toBe(6000);
    expect(jose.cobroEnvio).toBe(2000);
  });

  it('calcula totales cuando la planilla no trae K-L (bloque duplicado)', () => {
    const rows = [
      [null, 'Fecha', 'Número', 'Cliente', 'Canal', 'Distribuidor', 'Paquetes', 'Precio unitario ₡', 'Costo de envío', 'Cobro de envío'],
      [null, 46293, 88890898, 'Freddy Montero', 'WhatsApp', 'Fernando', 5, 2000, 3000, 2000],
    ];
    const { filas } = parsePlanillaRedes(rows);
    expect(filas[0].totalGalletas).toBe(10000);
    expect(filas[0].totalConEnvio).toBe(12000);
  });

  it('dedupe por fecha|número|cliente|paquetes|precio', () => {
    const rows = [
      HEADER,
      filaExcel(46282, 89058079, 'Fitmood', 50, 1400, 4900, 3000),
      filaExcel(46282, 89058079, 'Fitmood', 50, 1400, 4900, 3000),
      filaExcel(46286, 70531212, 'Berseker', 25, 1600, 0, 0),
    ];
    const { filas, duplicadas } = parsePlanillaRedes(rows);
    expect(filas).toHaveLength(2);
    expect(duplicadas).toHaveLength(1);
    expect(duplicadas[0].cliente).toBe('Fitmood');
  });

  it('omite filas sin fecha, sin cliente o sin paquetes', () => {
    const rows = [
      HEADER,
      [null, null, 123, 'Sin fecha', 'Redes sociales', 'Amor en Paleta', 1, 1800, 0, 0],
      [null, 46021, 123, null, 'Redes sociales', 'Amor en Paleta', 1, 1800, 0, 0],
      [null, 46021, 123, 'Sin paquetes', 'Redes sociales', 'Amor en Paleta', 0, 1800, 0, 0],
      filaExcel(46021, 456, 'Válida', 2, 1800, 0, 0),
    ];
    const { filas, omitidas } = parsePlanillaRedes(rows);
    expect(filas).toHaveLength(1);
    expect(filas[0].cliente).toBe('Válida');
    expect(omitidas.map((o) => o.motivo)).toEqual([
      'Sin fecha válida',
      'Sin cliente',
      'Sin paquetes',
    ]);
  });

  it('devuelve planilla vacía sin columna Fecha', () => {
    const { filas, omitidas } = parsePlanillaRedes([[null, 'Otra cosa']]);
    expect(filas).toHaveLength(0);
    expect(omitidas).toHaveLength(1);
  });
});

describe('clasificarFilas', () => {
  const ventas: {
    id: string;
    fecha: string;
    monto_total: number;
    estado: string;
    clientes: { nombre: string };
  }[] = [
    { id: 'v-2026-01-06', fecha: '2026-01-06', monto_total: 6000, estado: 'pagado', clientes: { nombre: 'Venta Varios' } },
    { id: 'v-2026-01-07', fecha: '2026-01-07', monto_total: 6000, estado: 'pagado', clientes: { nombre: 'Venta Varios' } },
    { id: 'v-2026-01-20', fecha: '2026-01-20', monto_total: 6000, estado: 'pagado', clientes: { nombre: 'Venta Varios' } },
    { id: 'v-otro-monto', fecha: '2026-01-15', monto_total: 999, estado: 'pagado', clientes: { nombre: 'Venta Varios' } },
    { id: 'v-999-01-06', fecha: '2026-01-06', monto_total: 999, estado: 'pagado', clientes: { nombre: 'Venta Varios' } },
  ];

  it('clasifica como existente con una sola candidata', () => {
    // 2026-01-06 (46028) monto 999 → única v-999-01-06 a 0 días
    const f = unaFila(46028, 'Jose Arce', 2, 2000, 2700, 2000);
    const [res] = clasificarFilas([{ ...f, totalConEnvio: 999 }], ventas);
    expect(res.resolucion).toBe('existente');
    expect(res.candidatas[0].ventaId).toBe('v-999-01-06');
  });

  it('clasifica como ambigua cuando hay 2+ candidatas dentro de la tolerancia', () => {
    const f = unaFila(46028, 'Jose Arce', 2, 2000, 2700, 2000); // 2026-01-06, monto 6000
    const [res] = clasificarFilas([f], ventas);
    expect(res.resolucion).toBe('ambigua');
    expect(res.candidatas.map((c) => c.ventaId)).toEqual(['v-2026-01-06', 'v-2026-01-07']);
  });

  it('clasifica como nueva sin candidata en rango o con otro monto', () => {
    // 2026-01-15 (46037) monto 9999 → nadie a ±2 días con ese monto
    const f = unaFila(46037, 'Cliente Lejano', 2, 2000, 2700, 2000);
    const [res] = clasificarFilas([{ ...f, totalConEnvio: 9999 }], ventas);
    expect(res.resolucion).toBe('nueva');
    expect(res.candidatas).toHaveLength(0);
  });

  it('respeta la tolerancia configurable', () => {
    // 2026-01-11 (46033), monto 6000: default ±2 → nada a 5/4/9 días → nueva
    const f = unaFila(46033, 'Con tolerancia', 2, 2000, 2700, 2000);
    const [defaultRes] = clasificarFilas([f], ventas);
    expect(defaultRes.resolucion).toBe('nueva');
    // Con tolerancia 9 días → alcanza las tres ventas de monto 6000 → ambigua e incluye la de 9 días
    const [ampliaRes] = clasificarFilas([f], ventas, 9);
    expect(ampliaRes.resolucion).toBe('ambigua');
    expect(ampliaRes.candidatas).toHaveLength(3);
    expect(ampliaRes.candidatas.map((c) => c.ventaId)).toContain('v-2026-01-20');
  });

  it('ignora ventas sin fecha o sin monto', () => {
    const f = unaFila(46028, 'Jose Arce', 2, 2000, 2700, 2000);
    const [res] = clasificarFilas([f], [
      { id: 'x', fecha: null, monto_total: 6000, estado: 'pagado', clientes: { nombre: 'Sin fecha' } },
      { id: 'y', fecha: '2026-01-06', monto_total: null, estado: 'pagado', clientes: { nombre: 'Sin monto' } },
    ]);
    expect(res.resolucion).toBe('nueva');
  });
});