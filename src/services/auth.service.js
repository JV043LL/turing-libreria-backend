const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { jwt: jwtConfig } = require('../config/env');
const HttpError = require('../utils/httpError');

const SALT_ROUNDS = 10;
const ROL_USER_ID = 2; // los registros publicos siempre son "user"; los admin se crean desde la BD

// Hash de relleno: si el email no existe se compara contra este,
// asi la respuesta tarda lo mismo y no revela que emails estan registrados.
const HASH_FALSO = '$2b$10$CwTycUXWue0Thq9StjUM0uJ8.xNk0ieF7ePX4zjmXPqRjQx5Wb6Ey';

const SELECT_USUARIO = `
  SELECT u.id, u.nombre, u.email, u.password_hash, r.nombre AS rol, u.created_at
  FROM users u
  JOIN roles r ON r.id = u.role_id`;

// Nunca se devuelve el password_hash al cliente
function usuarioPublico({ password_hash, ...usuario }) {
  return usuario;
}

function generarToken(usuario) {
  return jwt.sign({ sub: String(usuario.id), rol: usuario.rol }, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
  });
}

async function buscarPorEmail(email) {
  const [rows] = await pool.query(`${SELECT_USUARIO} WHERE u.email = ?`, [email]);
  return rows[0] || null;
}

async function register({ nombre, email, password }) {
  if (await buscarPorEmail(email)) {
    throw new HttpError(409, 'Ya existe una cuenta con ese email');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const [result] = await pool.query(
    'INSERT INTO users (nombre, email, password_hash, role_id) VALUES (?, ?, ?, ?)',
    [nombre, email, passwordHash, ROL_USER_ID]
  );

  const usuario = await getProfile(result.insertId);
  return { token: generarToken(usuario), user: usuario };
}

async function login({ email, password }) {
  const usuario = await buscarPorEmail(email);
  const coincide = await bcrypt.compare(password, usuario ? usuario.password_hash : HASH_FALSO);

  // Mismo mensaje si falla el email o la contraseña: no se da pista de cual estuvo mal
  if (!usuario || !coincide) {
    throw new HttpError(401, 'Email o contraseña incorrectos');
  }

  return { token: generarToken(usuario), user: usuarioPublico(usuario) };
}

async function getProfile(id) {
  const [rows] = await pool.query(`${SELECT_USUARIO} WHERE u.id = ?`, [id]);
  if (!rows[0]) throw new HttpError(404, 'Usuario no encontrado');
  return usuarioPublico(rows[0]);
}

module.exports = { register, login, getProfile };
