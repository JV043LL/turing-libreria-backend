const pool = require('../config/db');

// Campos que la API permite guardar (lista blanca)
// id, created_by, created_at y updated_at los controla el servidor por cuestiones de seguridad
const CAMPOS_PERMITIDOS = [
  'titulo', 'sinopsis', 'precio', 'stock', 'isbn',
  'portada_url', 'anio_publicacion', 'genre_id', 'author_id',
];

const LIMITE_MAXIMO = 50;

// Devuelve solo los campos permitidos que vienen en data
function filtrarCampos(data) {
  const limpio = {};
  for (const campo of CAMPOS_PERMITIDOS) {
    if (data[campo] !== undefined) {
      limpio[campo] = data[campo];
    }
  }
  return limpio;
}

async function getAll({ genreId, page = 1, limit = 6 } = {}) {
  // Los query params llegan como texto: se convierten a numero
  const pagina = Math.max(parseInt(page, 10) || 1, 1);
  const porPagina = Math.min(Math.max(parseInt(limit, 10) || 6, 1), LIMITE_MAXIMO);
  const offset = (pagina - 1) * porPagina;

  const where = genreId ? 'WHERE genre_id = ?' : '';
  const params = genreId ? [genreId] : [];

  const [rows] = await pool.query(
    `SELECT * FROM v_libros ${where} ORDER BY id LIMIT ? OFFSET ?`,
    [...params, porPagina, offset]
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM v_libros ${where}`,
    params
  );

  return {
    data: rows,
    pagination: {
      page: pagina,
      limit: porPagina,
      total,
      totalPages: Math.ceil(total / porPagina),
    },
  };
}

async function getById(id) {
  const [rows] = await pool.query('SELECT * FROM v_libros WHERE id = ?', [id]);
  return rows[0] || null;
}

async function create(book, userId) {
  const nuevoLibro = { ...filtrarCampos(book), created_by: userId };

  const [result] = await pool.query('INSERT INTO books SET ?', [nuevoLibro]);
  return getById(result.insertId);
}

async function update(id, book) {
  const cambios = filtrarCampos(book);

  if (Object.keys(cambios).length === 0) {
    const error = new Error('No se enviaron campos válidos para actualizar');
    error.status = 400;
    throw error;
  }

  const [result] = await pool.query('UPDATE books SET ? WHERE id = ?', [cambios, id]);
  return result.affectedRows ? getById(id) : null;
}

async function remove(id) {
  const [result] = await pool.query('DELETE FROM books WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = { getAll, getById, create, update, remove };