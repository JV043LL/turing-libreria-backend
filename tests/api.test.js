// Pruebas de integracion: usan la base de datos configurada en .env.
// Antes de correrlas, ejecuta database/script.sql para tener los datos de prueba.
// Comando: npm test
const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');

const ISBN_PRUEBA = '9999999999999';
const EMAIL_PRUEBA = `prueba_${Date.now()}@test.com`;

let tokenAdmin;
let tokenUser;
let libroCreadoId;

async function login(email, password) {
  const res = await request(app).post('/api/auth/login').send({ email, password });
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
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@libreria.com', password: 'Admin123!' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.rol).toBe('admin');
    expect(res.body.user.password_hash).toBeUndefined();
  });

  test('login con contraseña incorrecta responde 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@libreria.com', password: 'incorrecta1' });
    expect(res.status).toBe(401);
  });

  test('registro crea un usuario con rol user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ nombre: 'Prueba', email: EMAIL_PRUEBA, password: 'Segura123' });

    expect(res.status).toBe(201);
    expect(res.body.user.rol).toBe('user');
  });

  test('registro con email repetido responde 409', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ nombre: 'Prueba', email: EMAIL_PRUEBA, password: 'Segura123' });
    expect(res.status).toBe(409);
  });

  test('registro con contraseña débil responde 400 con detalles', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ nombre: 'Prueba', email: 'otro@test.com', password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.detalles.length).toBeGreaterThan(0);
  });

  test('GET /me sin token responde 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('Libros (público)', () => {
  test('lista paginada con datos de paginación', async () => {
    const res = await request(app).get('/api/books?limit=5');

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(5);
    expect(res.body.pagination).toMatchObject({ page: 1, limit: 5 });
  });

  test('filtra por género', async () => {
    const res = await request(app).get('/api/books?genre=3');

    expect(res.status).toBe(200);
    expect(res.body.data.every((libro) => libro.genre_id === 3)).toBe(true);
  });

  test('id no numérico responde 400', async () => {
    const res = await request(app).get('/api/books/abc');
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
    const res = await request(app).post('/api/books').send(nuevoLibro);
    expect(res.status).toBe(401);
  });

  test('un user no puede crear (403)', async () => {
    const res = await request(app).post('/api/books').set('Authorization', `Bearer ${tokenUser}`).send(nuevoLibro);
    expect(res.status).toBe(403);
  });

  test('un admin crea el libro y se genera la portada', async () => {
    const res = await request(app).post('/api/books').set('Authorization', `Bearer ${tokenAdmin}`).send(nuevoLibro);

    expect(res.status).toBe(201);
    expect(res.body.portada_url).toContain('openlibrary.org');
    libroCreadoId = res.body.id;
  });

  test('ISBN repetido responde 409', async () => {
    const res = await request(app).post('/api/books').set('Authorization', `Bearer ${tokenAdmin}`).send(nuevoLibro);
    expect(res.status).toBe(409);
  });

  test('un admin actualiza el libro', async () => {
    const res = await request(app)
      .put(`/api/books/${libroCreadoId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ precio: 150 });

    expect(res.status).toBe(200);
    expect(res.body.precio).toBe(150);
  });

  test('un admin elimina el libro', async () => {
    const res = await request(app)
      .delete(`/api/books/${libroCreadoId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
  });
});

describe('Favoritos', () => {
  test('sin sesión responde 401', async () => {
    const res = await request(app).get('/api/favorites');
    expect(res.status).toBe(401);
  });

  test('agregar y quitar un favorito', async () => {
    const auth = { Authorization: `Bearer ${tokenUser}` };

    const agregar = await request(app).post('/api/favorites/3').set(auth);
    expect([200, 201]).toContain(agregar.status);

    const lista = await request(app).get('/api/favorites').set(auth);
    expect(lista.body.some((libro) => libro.id === 3)).toBe(true);

    const quitar = await request(app).delete('/api/favorites/3').set(auth);
    expect(quitar.status).toBe(200);
  });
});

describe('Catálogos y errores', () => {
  test('GET /api/genres devuelve géneros con conteo', async () => {
    const res = await request(app).get('/api/genres');

    expect(res.status).toBe(200);
    expect(res.body[0]).toHaveProperty('total_libros');
  });

  test('GET /api/authors devuelve autores', async () => {
    const res = await request(app).get('/api/authors');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('ruta inexistente responde 404', async () => {
    const res = await request(app).get('/api/no-existe');
    expect(res.status).toBe(404);
  });
});
