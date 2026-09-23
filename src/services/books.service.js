const pool = require('../config/db');

const SELECT_BOOKS = `
  SELECT b.*, g.nombre AS genero, a.nombre AS autor
  FROM books b
  JOIN genres g ON g.id = b.genre_id
  JOIN authors a ON a.id = b.author_id`;

async function getAll(genre, page = 1, limit = 6) {
  const offset = (page - 1) * limit;
  const where = genre ? 'WHERE g.nombre = ?' : '';
  const params = genre ? [genre] : [];

  const [rows] = await pool.query(`${SELECT_BOOKS} ${where} ORDER BY b.id LIMIT ? OFFSET ?`, [...params, limit, offset]);
  return rows;
}

async function getById(id) {
  const [rows] = await pool.query(`${SELECT_BOOKS} WHERE b.id = ?`, [id]);
  return rows[0];
}

async function create(book) {
  const [result] = await pool.query('INSERT INTO books SET ?', [book]);
  return getById(result.insertId);
}

async function update(id, book) {
  const [result] = await pool.query('UPDATE books SET ? WHERE id = ?', [book, id]);
  return result.affectedRows ? getById(id) : null;
}

async function remove(id) {
  const [result] = await pool.query('DELETE FROM books WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = { getAll, getById, create, update, remove };
