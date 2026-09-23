// Verifica que Node se conecte correctamente a MySQL.
// comando de uso: npm run db:test
const { pool, testConnection } = require('../src/config/db');

(async () => {
  try {
    const info = await testConnection();
    console.log('Conexión exitosa a MySQL');
    console.log(`  Versión:        ${info.version}`);
    console.log(`  Base de datos:  ${info.base_de_datos}`);
    console.log(`  Hora servidor:  ${info.ahora}`);

    const [tables] = await pool.query('SHOW TABLES');
    console.log(`  Tablas:         ${tables.map((t) => Object.values(t)[0]).join(', ') || '(ninguna, ejecuta database/script.sql)'}`);
  } catch (err) {
    console.error('No se pudo conectar a MySQL:', err.message);
    console.error('Revisa que MySQL esté encendido y que los datos de tu .env sean correctos.');
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
