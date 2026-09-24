// Punto de entrada: verifica la base de datos y levanta el servidor
const app = require('./app');
const pool = require('./config/db');
const { port } = require('./config/env');

pool.query('SELECT 1')
  .then(() => {
    console.log('Conectado a MySQL');
    app.listen(port, () => console.log(`Servidor en http://localhost:${port}`));
  })
  .catch((err) => {
    console.error('Error al conectar a MySQL:', err.message);
    process.exit(1);
  });
