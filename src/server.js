const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const booksRoutes = require('./routes/books.routes');
const genresRoutes = require('./routes/genres.routes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/books', booksRoutes);
app.use('/api/genres', genresRoutes);

const PORT = process.env.PORT || 9000;

pool.query('SELECT 1')
  .then(() => {
    console.log('Conectado a MySQL');
    app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Error al conectar a MySQL:', err.message);
    process.exit(1);
  });
