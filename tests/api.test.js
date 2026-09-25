// Pruebas de integracion: usan la base de datos configurada en .env.
// Antes de correrlas, ejecuta database/script.sql para tener los datos de prueba.
// Comando: npm test
//
// Las peticiones se inyectan directamente en la app con light-my-request,
// sin abrir un puerto ni usar la red. Asi se evitan los errores
// "read ECONNRESET" intermitentes que aparecian en Windows con supertest.
const inject = require('light-my-request');
const app = require('../src/app');
const pool = require('../src/config/db');

const ISBN_PRUEBA = '9999999999999';
const EMAIL_PRUEBA = `prueba_${Date.now()}@test.com`;

let tokenAdmin;
let tokenUser;
let libroCreadoId;

// Hace una peticion a la API y devuelve { status, body }
async function api(method, url, { body, token } = {}) {
  const headers = token ? { authorization: `Bearer ${token}` } : {};
  const res = await inject(app, { method, url, payload: body, headers });

  let data;
  try {
    data = res.json();
  } catch {
    data = res.body;
  }
  return { status: res.statusCode, body: data };
}

async function login(email, password) {
  const res = await api('POST', '/api/auth/login', { body: { email, password } });
  return res.body.token;
}

beforeAll(async () => {
  // Limpia restos de una ejecucion anterior que haya fallado a la mitad
  await pool.query('DELETE FROM books WHERE isbn = ?', [ISBN_PRUEBA]);
  tokenAdmin = await login('admin@libreria.com', 'Admin123!');
  tokenUser = await login('user@libreria.com', 'User123!');
});

afterAll(async () => {
  await pool.query('DELETE FROM books WHERE isbn = ?', [ISBN_PRUEBA]);
  await pool.query('DELETE FROM users WHERE email = ?', [EMAIL_PRUEBA]);
  await pool.end();
});

describe('Auth', () => {
  test('login correcto devuelve token y usuario sin contraseña', async () => {
    const res = await api('POST', '/api/auth/login', {
      body: { email: 'admin@libreria.com', password: 'Admin123!' },
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.rol).toBe('admin');
    expect(res.body.user.password_hash).toBeUndefined();
  });

  test('login con contraseña incorrecta responde 401', async () => {
    const res = await api('POST', '/api/auth/login', {
      body: { email: 'admin@libreria.com', password: 'incorrecta1' },
    });
    expect(res.status).toBe(401);
  });

  test('registro crea un usuario con rol user', async () => {
    const res = await api('POST', '/api/auth/register', {
      body: { nombre: 'Prueba', email: EMAIL_PRUEBA, password: 'Segura123' },
    });

    expect(res.status).toBe(201);
    expect(res.body.user.rol).toBe('user');
  });

  test('registro con email repetido responde 409', async () => {
    const res = await api('POST', '/api/auth/register', {
      body: { nombre: 'Prueba', email: EMAIL_PRUEBA, password: 'Segura123' },
    });
    expect(res.status).toBe(409);
  });

  test('registro con contraseña débil responde 400 con detalles', async () => {
    const res = await api('POST', '/api/auth/register', {
      body: { nombre: 'Prueba', email: 'otro@test.com', password: '123' },
    });

    expect(res.status).toBe(400);
    expect(res.body.detalles.length).toBeGreaterThan(0);
  });

  test('GET /me sin token responde 401', async () => {
    const res = await api('GET', '/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('Libros (público)', () => {
  test('lista paginada con datos de paginación', async () => {
    const res = await api('GET', '/api/books?limit=5');

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(5);
    expect(res.body.pagination).toMatchObject({ page: 1, limit: 5 });
  });

  test('filtra por género', async () => {
    const res = await api('GET', '/api/books?genre=3');

    expect(res.status).toBe(200);
    expect(res.body.data.every((libro) => libro.genre_id === 3)).toBe(true);
  });

  test('id no numérico responde 400', async () => {
    const res = await api('GET', '/api/books/abc');
    expect(res.status).toBe(400);
  });
});

describe('Libros (admin)', () => {
  const nuevoLibro = {
    titulo: 'Libro de prueba',
    precio: 100,
    stock: 2,
    isbn: ISBN_PRUEBA,
    genre_id: 4,
    author_id: 8,
  };

  test('sin token no se puede crear (401)', async () => {
    const res = await api('POST', '/api/books', { body: nuevoLibro });
    expect(res.status).toBe(401);
  });

  test('un user no puede crear (403)', async () => {
    const res = await api('POST', '/api/books', { body: nuevoLibro, token: tokenUser });
    expect(res.status).toBe(403);
  });

  test('un admin crea el libro y se genera la portada', async () => {
    const res = await api('POST', '/api/books', { body: nuevoLibro, token: tokenAdmin });

    expect(res.status).toBe(201);
    expect(res.body.portada_url).toContain('openlibrary.org');
    libroCreadoId = res.body.id;
  });

  test('ISBN repetido responde 409', async () => {
    const res = await api('POST', '/api/books', { body: nuevoLibro, token: tokenAdmin });
    expect(res.status).toBe(409);
  });

  test('un admin actualiza el libro', async () => {
    const res = await api('PUT', `/api/books/${libroCreadoId}`, {
      body: { precio: 150 },
      token: tokenAdmin,
    });

    expect(res.status).toBe(200);
    expect(res.body.precio).toBe(150);
  });

  test('un admin elimina el libro', async () => {
    const res = await api('DELETE', `/api/books/${libroCreadoId}`, { token: tokenAdmin });
    expect(res.status).toBe(200);
  });
});

describe('Favoritos', () => {
  test('sin sesión responde 401', async () => {
    const res = await api('GET', '/api/favorites');
    expect(res.status).toBe(401);
  });

  test('agregar y quitar un favorito', async () => {
    const agregar = await api('POST', '/api/favorites/3', { token: tokenUser });
    expect([200, 201]).toContain(agregar.status);

    const lista = await api('GET', '/api/favorites', { token: tokenUser });
    expect(lista.body.some((libro) => libro.id === 3)).toBe(true);

    const quitar = await api('DELETE', '/api/favorites/3', { token: tokenUser });
    expect(quitar.status).toBe(200);
  });
});

describe('Catálogos y errores', () => {
  test('GET /api/genres devuelve géneros con conteo', async () => {
    const res = await api('GET', '/api/genres');

    expect(res.status).toBe(200);
    expect(res.body[0]).toHaveProperty('total_libros');
  });

  test('GET /api/authors devuelve autores', async () => {
    const res = await api('GET', '/api/authors');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('GET /api/spaces devuelve los espacios en orden', async () => {
    const res = await api('GET', '/api/spaces');

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('resumen');
  });

  test('GET /api/spaces/:id inexistente responde 404', async () => {
    const res = await api('GET', '/api/spaces/250');
    expect(res.status).toBe(404);
  });

  test('ruta inexistente responde 404', async () => {
    const res = await api('GET', '/api/no-existe');
    expect(res.status).toBe(404);
  });
});
