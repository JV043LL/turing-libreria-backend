const pool = require('../config/db');

// Espacios de la libreria (seccion "Nuestro espacio" del frontend)
const CAMPOS = 'id, nombre, resumen, descripcion, horario, imagen_url';

async function getAll() {
  const [rows] = await pool.query(`SELECT ${CAMPOS} FROM spaces ORDER BY orden, id`);
  return rows;
}

async function getById(id) {
  const [rows] = await pool.query(`SELECT ${CAMPOS} FROM spaces WHERE id = ?`, [id]);
  return rows[0] || null;
}

module.exports = { getAll, getById };
