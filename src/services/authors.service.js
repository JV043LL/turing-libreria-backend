const pool = require('../config/db');

// Cada autor incluye cuantos libros tiene (util para el formulario del panel admin)
const SELECT_AUTORES = `
  SELECT a.id, a.nombre, a.nacionalidad, COUNT(b.id) AS total_libros
  FROM authors a
  LEFT JOIN books b ON b.author_id = a.id`;

async function getAll() {
  const [rows] = await pool.query(`${SELECT_AUTORES} GROUP BY a.id, a.nombre, a.nacionalidad ORDER BY a.nombre`);
  return rows;
}

async function getById(id) {
  const [rows] = await pool.query(`${SELECT_AUTORES} WHERE a.id = ? GROUP BY a.id, a.nombre, a.nacionalidad`, [id]);
  return rows[0] || null;
}

module.exports = { getAll, getById };
