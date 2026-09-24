const pool = require('../config/db');

// Cada genero incluye cuantos libros tiene
const SELECT_GENEROS = `
  SELECT g.id, g.nombre, COUNT(b.id) AS total_libros
  FROM genres g
  LEFT JOIN books b ON b.genre_id = g.id`;

async function getAll() {
  const [rows] = await pool.query(`${SELECT_GENEROS} GROUP BY g.id, g.nombre ORDER BY g.nombre`);
  return rows;
}

async function getById(id) {
  const [rows] = await pool.query(`${SELECT_GENEROS} WHERE g.id = ? GROUP BY g.id, g.nombre`, [id]);
  return rows[0] || null;
}

module.exports = { getAll, getById };
