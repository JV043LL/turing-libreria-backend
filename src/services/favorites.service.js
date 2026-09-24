const pool = require('../config/db');
const HttpError = require('../utils/httpError');

// Libros favoritos del usuario, con la misma forma que el catalogo (vista v_libros)
async function getByUser(userId) {
  const [rows] = await pool.query(
    `SELECT v.*, f.created_at AS agregado_en
     FROM favorites f
     JOIN v_libros v ON v.id = f.book_id
     WHERE f.user_id = ?
     ORDER BY f.created_at DESC`,
    [userId]
  );
  return rows;
}

async function add(userId, bookId) {
  const [libro] = await pool.query('SELECT id FROM books WHERE id = ?', [bookId]);
  if (!libro[0]) throw new HttpError(404, 'Libro no encontrado');

  // INSERT IGNORE: si ya era favorito no marca error (la operacion es idempotente)
  const [result] = await pool.query('INSERT IGNORE INTO favorites (user_id, book_id) VALUES (?, ?)', [userId, bookId]);
  return { creado: result.affectedRows > 0 };
}

async function remove(userId, bookId) {
  const [result] = await pool.query('DELETE FROM favorites WHERE user_id = ? AND book_id = ?', [userId, bookId]);
  return result.affectedRows > 0;
}

module.exports = { getByUser, add, remove };
