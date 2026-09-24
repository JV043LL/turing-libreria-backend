# turing-libreria-backend

API REST del periodo de prueba de Turing-IA: backend de una librería en línea con Node.js y MySQL.

> 🚧 Proyecto en fase de prototipo. La estructura se irá ampliando conforme avance el desarrollo.

## Estructura del proyecto

```text
turing-libreria-backend/
├── database/
│   └── script.sql
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── routes/
│   └── services/
├── .env.example
├── .gitignore
└── README.md
```

### `database/`

Contiene todo lo relacionado con la base de datos MySQL del proyecto.

- **`script.sql`**: script de creación de la base de datos `turing_libreria` (MySQL 8.0+). Crea desde cero la base de datos y sus tablas, diseñadas en tercera forma normal (3NF), e incluye datos de prueba:
  - `roles`: catálogo de tipos de usuario (`admin`, `user`).
  - `users`: usuarios registrados; la contraseña se guarda cifrada con bcrypt.
  - `genres`: catálogo de géneros literarios.
  - `authors`: catálogo de autores.
  - `books`: libros de la librería; referencian a su autor y género mediante llaves foráneas.

  Para ejecutarlo:

```bash
  mysql -u root -p < database/script.sql
```

  > ⚠️ El script elimina la base de datos `turing_libreria` si ya existe antes de volver a crearla.

### `src/`

Carpeta del código fuente de la API REST en Node.js. Se organiza en capas; una petición recorre `routes → middlewares → controllers → services`.

| Carpeta | Funcionalidad |
|---|---|
| `config/` | Configuración de la aplicación: lectura de variables de entorno y conexión a la base de datos. |
| `routes/` | Definición de los endpoints de la API (URL + método HTTP) y a qué controlador llama cada uno. |
| `middlewares/` | Funciones que se ejecutan antes de los controladores: autenticación (token), verificación de roles, validación de datos y manejo centralizado de errores. |
| `controllers/` | Reciben la petición HTTP, llaman al servicio correspondiente y devuelven la respuesta al cliente. |
| `services/` | Lógica de negocio de la aplicación (por ejemplo, registrar usuarios, cifrar contraseñas o gestionar libros). |

### Archivos de la raíz

- **`.env.example`**: plantilla de las variables de entorno (servidor, conexión a MySQL y JWT). Se copia como `.env` y se rellena con los datos locales:

```bash
  cp .env.example .env
```

- **`.gitignore`**: excluye del repositorio `node_modules/` y el archivo `.env`, para no subir dependencias ni credenciales.

## Puesta en marcha

Requisitos: Node.js 18+ y MySQL 8.0+.

```bash
npm install
cp .env.example .env      # rellenar credenciales de MySQL
mysql -u root -p < database/script.sql
npm run dev               # o: npm start
```

El servidor verifica la conexión con MySQL antes de arrancar. Con la configuración de `.env.example`, la API queda disponible en:

```text
http://localhost:9000/api
```

## Endpoints públicos

Estos endpoints no requieren autenticación. Todas las respuestas se envían en formato JSON.

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/books` | Lista paginada de libros, con filtro opcional por género. |
| `GET` | `/api/books/:id` | Detalle de un libro. |
| `GET` | `/api/genres` | Catálogo de géneros con su número de libros. |
| `GET` | `/api/genres/:id` | Detalle de un género. |

### Objeto `Book`

Los libros se leen desde la vista `v_libros`, que une `books` con `genres` y `authors`:

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | number | Identificador del libro. |
| `titulo` | string | Título. |
| `sinopsis` | string \| null | Resumen del libro. |
| `precio` | number | Precio en MXN. |
| `stock` | number | Ejemplares disponibles. |
| `disponible` | number | `1` si hay stock, `0` si está agotado. |
| `isbn` | string | ISBN de 10 o 13 caracteres. |
| `portada_url` | string | URL de la portada. Si no se envía al crear el libro, se genera con el ISBN desde Open Library. |
| `anio_publicacion` | number \| null | Año de publicación. |
| `genre_id` | number | Id del género. |
| `genero` | string | Nombre del género. |
| `author_id` | number | Id del autor. |
| `autor` | string | Nombre del autor. |
| `autor_nacionalidad` | string \| null | Nacionalidad del autor. |
| `created_at` | string (ISO 8601) | Fecha de alta. |

---

### `GET /api/books`

Devuelve una página de libros ordenados por `id`, junto con los datos de paginación.

**Parámetros de consulta (query) — todos opcionales**

| Parámetro | Tipo | Valor por defecto | Descripción |
|---|---|---|---|
| `genre` | number | — | Id del género (se obtiene de `GET /api/genres`). Si se omite, se devuelven libros de todos los géneros. |
| `page` | number | `1` | Número de página. Valores menores a 1 se ajustan a 1. |
| `limit` | number | `6` | Libros por página, entre 1 y 50. Valores fuera de rango se ajustan al límite más cercano. |

**Ejemplos**

```bash
# Primera página (6 libros)
curl "http://localhost:9000/api/books"

# Segunda página con 5 libros por página
curl "http://localhost:9000/api/books?page=2&limit=5"

# Solo libros de Fantasía (genre_id = 3)
curl "http://localhost:9000/api/books?genre=3"
```

**Respuesta `200 OK`**

```json
{
  "data": [
    {
      "id": 6,
      "titulo": "El hobbit",
      "sinopsis": "Bilbo Bolsón deja la comodidad de su hogar para acompañar a trece enanos en busca de un tesoro.",
      "precio": 329,
      "stock": 14,
      "disponible": 1,
      "isbn": "9780547928227",
      "portada_url": "https://covers.openlibrary.org/b/isbn/9780547928227-M.jpg",
      "anio_publicacion": 1937,
      "genre_id": 3,
      "genero": "Fantasía",
      "author_id": 6,
      "autor": "J. R. R. Tolkien",
      "autor_nacionalidad": "Británica",
      "created_at": "2026-09-23T21:00:09.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 6,
    "total": 2,
    "totalPages": 1
  }
}
```

Si no hay resultados, `data` es un arreglo vacío y `total` vale `0`.

> Para el botón **"Cargar más"** del frontend: pedir `page + 1` y ocultar el botón cuando `page` sea igual a `totalPages`.

**Respuesta `400 Bad Request`** — `genre` no es un número entero positivo:

```json
{ "error": "El parámetro genre debe ser el id numérico de un género" }
```

---

### `GET /api/books/:id`

Devuelve el detalle de un libro.

```bash
curl "http://localhost:9000/api/books/6"
```

| Código | Respuesta |
|---|---|
| `200` | Un objeto `Book`. |
| `400` | `{ "error": "El id debe ser un número entero positivo" }` |
| `404` | `{ "error": "Libro no encontrado" }` |

---

### `GET /api/genres`

Devuelve todos los géneros ordenados alfabéticamente, con el número de libros de cada uno. Pensado para construir el filtro del catálogo: el `id` de cada género es el valor que se envía en `GET /api/books?genre=`.

```bash
curl "http://localhost:9000/api/genres"
```

**Respuesta `200 OK`**

```json
[
  { "id": 2, "nombre": "Ciencia ficción", "total_libros": 3 },
  { "id": 4, "nombre": "Clásicos", "total_libros": 2 },
  { "id": 3, "nombre": "Fantasía", "total_libros": 2 }
]
```

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | number | Identificador del género. |
| `nombre` | string | Nombre del género (único). |
| `total_libros` | number | Libros registrados en ese género. Puede ser `0`. |

> Con `total_libros` el frontend puede ocultar géneros vacíos o mostrar el conteo junto a cada opción del filtro.

---

### `GET /api/genres/:id`

Devuelve un género por su identificador.

```bash
curl "http://localhost:9000/api/genres/3"
```

| Código | Respuesta |
|---|---|
| `200` | `{ "id": 3, "nombre": "Fantasía", "total_libros": 2 }` |
| `400` | `{ "error": "El id debe ser un número entero positivo" }` |
| `404` | `{ "error": "Género no encontrado" }` |

---

### Errores

Todos los errores siguen el mismo formato:

```json
{ "error": "Descripción del error" }
```

| Código | Cuándo ocurre |
|---|---|
| `400` | Parámetros inválidos (id o género no numérico). |
| `404` | El libro o género solicitado no existe. |
| `500` | Error interno del servidor o de la base de datos. |

### Próximos endpoints públicos

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/auth/register` | Registro de usuarios. |
| `POST` | `/api/auth/login` | Inicio de sesión; devuelve un JWT. |
