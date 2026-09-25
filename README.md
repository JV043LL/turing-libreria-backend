# turing-libreria-backend

API REST de una librería en línea, desarrollada para el periodo de prueba de Desarrollo de Software de Turing-IA.

Permite consultar un catálogo de libros filtrable por género, iniciar sesión con dos roles (`admin` y `user`), administrar el inventario (solo `admin`) y guardar libros favoritos (cualquier usuario con sesión).

## Stack

| Área | Tecnología |
|---|---|
| Servidor | Node.js 18+ y Express 5 |
| Base de datos | MySQL 8 con `mysql2` (pool de conexiones y consultas parametrizadas) |
| Autenticación | JWT (`jsonwebtoken`) y contraseñas cifradas con bcrypt (`bcryptjs`) |
| Validación | `express-validator` |
| Seguridad | `helmet`, `cors`, `express-rate-limit` |
| Pruebas | Jest y `light-my-request` (pruebas de integración) |

## Estructura del proyecto

```text
turing-libreria-backend/
├── database/
│   └── script.sql              # crea la BD, tablas, vista, trigger y datos de prueba
├── docs/
│   ├── diagrama-er.md          # diagrama entidad-relación y reglas de integridad
│   └── turing-libreria.postman_collection.json
├── src/
│   ├── config/
│   │   ├── db.js               # pool de conexiones a MySQL
│   │   └── env.js              # lectura y validación de variables de entorno
│   ├── controllers/            # reciben la petición y devuelven la respuesta
│   ├── middlewares/
│   │   ├── auth.middleware.js       # authenticate (JWT) y authorize (roles)
│   │   ├── error.middleware.js      # 404 y manejo centralizado de errores
│   │   ├── rateLimit.middleware.js  # límite de peticiones
│   │   └── validate.middleware.js   # respuesta 400 si falla una validación
│   ├── routes/                 # endpoints y el orden de sus middlewares
│   ├── services/               # lógica de negocio y consultas SQL
│   ├── utils/httpError.js      # error con código HTTP
│   ├── validators/             # reglas de express-validator
│   ├── app.js                  # configuración de Express
│   └── server.js               # verifica la BD y levanta el servidor
├── tests/
│   └── api.test.js             # pruebas de integración (22 casos)
├── .env.example
└── package.json
```

### Cómo viaja una petición

Cada capa tiene una sola responsabilidad:

```text
petición
  → app.js          helmet, cors, rate limit, lectura de JSON
  → routes/         decide qué pasos aplican a esa URL
  → authenticate    ¿trae un token válido?            (401 si no)
  → authorize       ¿su rol tiene permiso?            (403 si no)
  → validators      ¿los datos son correctos?         (400 si no)
  → controller      toma los datos y llama al service
  → service         lógica de negocio y SQL
  → respuesta JSON

Si algo falla en cualquier paso → error.middleware.js responde con el código y mensaje adecuados.
```

## Puesta en marcha

Requisitos: Node.js 18 o superior y MySQL 8.

**1. Instalar dependencias**

```bash
npm install
```

**2. Configurar variables de entorno**

```bash
cp .env.example .env
```

| Variable | Obligatoria | Descripción | Ejemplo |
|---|---|---|---|
| `PORT` | No | Puerto del servidor (por defecto 9000). | `9000` |
| `DB_HOST` | Sí | Host de MySQL. | `127.0.0.1` |
| `DB_PORT` | No | Puerto de MySQL. | `3306` |
| `DB_USER` | Sí | Usuario de MySQL. | `root` |
| `DB_PASSWORD` | No | Contraseña de MySQL. | |
| `DB_NAME` | Sí | Nombre de la base de datos. | `turing_libreria` |
| `JWT_SECRET` | Sí | Clave para firmar los tokens. Usa una cadena larga y aleatoria. | |
| `JWT_EXPIRES_IN` | No | Duración del token (por defecto 2h). | `2h` |
| `CORS_ORIGIN` | No | Orígenes permitidos, separados por coma (por defecto el frontend de Vite). | `http://localhost:5173` |

Si falta una variable obligatoria, el servidor no arranca e indica cuál falta.

**3. Crear la base de datos**

```bash
mysql -u root -p < database/script.sql
```

> ⚠️ El script elimina la base de datos `turing_libreria` si ya existe y la vuelve a crear con los datos de prueba.

**4. Levantar el servidor**

```bash
npm run dev    # desarrollo, se reinicia al guardar cambios
npm start      # producción
```

La API queda disponible en `http://localhost:9000/api`. Para comprobarlo: `GET http://localhost:9000/api/health`.

**5. Ejecutar las pruebas**

```bash
npm test
```

Resultado esperado:

```text
Test Suites: 1 passed, 1 total
Tests:       20 passed, 20 total
```

Antes de correrlas:

- MySQL debe estar encendido y la base de datos creada con `database/script.sql` (paso 3).
- El `.env` debe estar configurado (paso 2). Las pruebas usan esa misma base de datos.
- No hace falta levantar el servidor: las pruebas no abren ningún puerto, así que pueden correr aunque `npm start` esté activo.

Las pruebas crean y borran sus propios registros (un libro con ISBN `9999999999999` y un usuario `prueba_<timestamp>@test.com`), por lo que se pueden ejecutar varias veces seguidas sin volver a cargar el script.

Para guardar el resultado en un archivo (PowerShell, con acentos en UTF-8):

```powershell
npm test 2>&1 | Out-File -Encoding utf8 resultado.txt
```

`resultado.txt` está en `.gitignore`.

### Qué cubren las pruebas

| Grupo | Casos |
|---|---|
| Auth | Login correcto sin exponer la contraseña, login incorrecto (401), registro con rol `user`, email repetido (409), contraseña débil (400 con detalles), `/me` sin token (401) |
| Libros (público) | Paginación, filtro por género, id no numérico (400) |
| Libros (admin) | Crear sin token (401), crear como `user` (403), crear como `admin` con portada de Open Library, ISBN repetido (409), actualizar y eliminar |
| Favoritos | Sin sesión (401), agregar, listar y quitar un favorito |
| Catálogos y errores | Géneros con conteo de libros, autores, espacios y espacio inexistente (404), ruta inexistente (404) |

### Por qué `light-my-request` y no Supertest

Las pruebas se escribieron primero con Supertest, pero en Windows fallaban al azar con `read ECONNRESET`, incluso en rutas que no tocan la base de datos. Para descartar la API, se hicieron 100 peticiones seguidas al servidor desde PowerShell y ninguna falló; en Linux las pruebas pasaban siempre. El problema estaba en las conexiones TCP que Supertest abre dentro de Jest.

`light-my-request` inyecta cada petición directamente en la app de Express, en memoria, sin abrir un puerto. Las peticiones siguen pasando por todos los middlewares, validaciones, controladores y la base de datos, así que siguen siendo pruebas de integración, y ya no dependen de la red del sistema operativo.

## Usuarios de prueba

| Rol | Email | Contraseña |
|---|---|---|
| admin | `admin@libreria.com` | `Admin123!` |
| user | `user@libreria.com` | `User123!` |

Los registros públicos (`/api/auth/register`) siempre crean usuarios con rol `user`.

## Autenticación

1. Inicia sesión con `POST /api/auth/login`; la respuesta incluye un `token`.
2. Envía ese token en las rutas protegidas con el header:

```text
Authorization: Bearer <token>
```

El token dura lo indicado en `JWT_EXPIRES_IN`. Al expirar, la API responde `401` y hay que iniciar sesión de nuevo.

## Endpoints

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/api/health` | Público | Estado de la API. |
| `POST` | `/api/auth/register` | Público | Registro de usuario (rol `user`). |
| `POST` | `/api/auth/login` | Público | Inicio de sesión; devuelve un JWT. |
| `GET` | `/api/auth/me` | Con sesión | Perfil del usuario del token. |
| `GET` | `/api/books` | Público | Lista paginada con filtro por género. |
| `GET` | `/api/books/:id` | Público | Detalle de un libro. |
| `POST` | `/api/books` | Admin | Crear libro. |
| `PUT` | `/api/books/:id` | Admin | Actualizar libro. |
| `DELETE` | `/api/books/:id` | Admin | Eliminar libro. |
| `GET` | `/api/genres` | Público | Géneros con número de libros. |
| `GET` | `/api/genres/:id` | Público | Detalle de un género. |
| `GET` | `/api/authors` | Público | Autores con número de libros. |
| `GET` | `/api/authors/:id` | Público | Detalle de un autor. |
| `GET` | `/api/favorites` | Con sesión | Favoritos del usuario. |
| `POST` | `/api/favorites/:bookId` | Con sesión | Agregar un libro a favoritos. |
| `DELETE` | `/api/favorites/:bookId` | Con sesión | Quitar un libro de favoritos. |
| `GET` | `/api/spaces` | Público | Espacios de la librería (sección "Nuestro espacio"). |
| `GET` | `/api/spaces/:id` | Público | Detalle de un espacio. |

La colección de Postman con todas las peticiones está en [`docs/turing-libreria.postman_collection.json`](docs/turing-libreria.postman_collection.json). Al ejecutar **Login admin** o **Login user**, el token se guarda solo y las demás peticiones lo usan.

---

### Auth

#### `POST /api/auth/register`

```json
{ "nombre": "Ana López", "email": "ana@example.com", "password": "Segura123" }
```

Reglas: nombre de 2 a 100 caracteres, email válido, contraseña de 8 a 72 caracteres con al menos una letra y un número.

| Código | Respuesta |
|---|---|
| `201` | `{ "token": "...", "user": { "id", "nombre", "email", "rol", "created_at" } }` |
| `400` | Datos inválidos (ver formato de errores). |
| `409` | Ya existe una cuenta con ese email. |
| `429` | Demasiados intentos. |

#### `POST /api/auth/login`

```json
{ "email": "admin@libreria.com", "password": "Admin123!" }
```

| Código | Respuesta |
|---|---|
| `200` | `{ "token": "...", "user": { ... } }` |
| `401` | Email o contraseña incorrectos (mismo mensaje en ambos casos). |
| `429` | Más de 10 intentos fallidos en 15 minutos. |

#### `GET /api/auth/me`

Requiere token. Devuelve `{ "id", "nombre", "email", "rol", "created_at" }`.

---

### Libros

#### Objeto `Book`

Los libros se leen desde la vista `v_libros`, que une `books` con `genres` y `authors`:

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | number | Identificador del libro. |
| `titulo` | string | Título. |
| `sinopsis` | string \| null | Resumen. |
| `precio` | number | Precio en MXN. |
| `stock` | number | Ejemplares disponibles. |
| `disponible` | number | `1` si hay stock, `0` si está agotado. |
| `isbn` | string | ISBN de 10 o 13 caracteres. |
| `portada_url` | string | URL de la portada. |
| `anio_publicacion` | number \| null | Año de publicación. |
| `genre_id` / `genero` | number / string | Id y nombre del género. |
| `author_id` / `autor` | number / string | Id y nombre del autor. |
| `autor_nacionalidad` | string \| null | Nacionalidad del autor. |
| `created_at` | string (ISO 8601) | Fecha de alta. |

#### `GET /api/books`

| Parámetro | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `genre` | number | — | Id del género (de `GET /api/genres`). |
| `page` | number | `1` | Página, desde 1. |
| `limit` | number | `6` | Libros por página, de 1 a 50. |

```bash
curl "http://localhost:9000/api/books?genre=3&page=1&limit=6"
```

```json
{
  "data": [
    {
      "id": 6,
      "titulo": "El hobbit",
      "precio": 329,
      "stock": 14,
      "disponible": 1,
      "isbn": "9780547928227",
      "portada_url": "https://covers.openlibrary.org/b/isbn/9780547928227-M.jpg",
      "genre_id": 3,
      "genero": "Fantasía",
      "author_id": 6,
      "autor": "J. R. R. Tolkien"
    }
  ],
  "pagination": { "page": 1, "limit": 6, "total": 2, "totalPages": 1 }
}
```

(Ejemplo abreviado; cada libro trae todos los campos del objeto `Book`).

> Para el botón **"Cargar más"**: pedir `page + 1` y ocultar el botón cuando `page` sea igual a `totalPages`.

#### `GET /api/books/:id`

Devuelve un objeto `Book`, `400` si el id no es numérico o `404` si no existe.

#### `POST /api/books` (admin)

```json
{
  "titulo": "Emma",
  "sinopsis": "Emma Woodhouse se empeña en arreglar la vida amorosa de quienes la rodean.",
  "precio": 199.5,
  "stock": 5,
  "isbn": "9780141439587",
  "anio_publicacion": 1815,
  "genre_id": 4,
  "author_id": 8
}
```

| Campo | Obligatorio | Regla |
|---|---|---|
| `titulo` | Sí | 1 a 200 caracteres. |
| `precio` | Sí | Número ≥ 0. |
| `isbn` | Sí | 10 o 13 dígitos, sin guiones (el de 10 puede terminar en X). Único. |
| `genre_id`, `author_id` | Sí | Ids existentes. |
| `sinopsis` | No | Texto. |
| `stock` | No | Entero ≥ 0 (por defecto 0). |
| `portada_url` | No | URL http(s). Si se omite, se genera con el ISBN desde Open Library. |
| `anio_publicacion` | No | Entre 1000 y el año siguiente al actual. |

El campo `created_by` se llena con el id del admin del token. Campos como `id` o `created_at` se ignoran aunque se envíen.

| Código | Respuesta |
|---|---|
| `201` | El libro creado (objeto `Book`). |
| `400` | Datos inválidos, o el género o autor no existe. |
| `401` / `403` | Sin sesión / el usuario no es admin. |
| `409` | ISBN repetido. |

#### `PUT /api/books/:id` (admin)

Mismas reglas que al crear, pero todos los campos son opcionales: solo se envía lo que cambia.

```json
{ "precio": 179, "stock": 8 }
```

Responde `200` con el libro actualizado, `400` si no se envía ningún campo válido o `404` si no existe.

#### `DELETE /api/books/:id` (admin)

Responde `200` con `{ "message": "Libro eliminado" }` o `404` si no existe. El libro también se elimina de los favoritos de los usuarios.

---

### Géneros y autores

Catálogos pensados para el filtro del frontend y el formulario del panel de administración.

```bash
curl "http://localhost:9000/api/genres"
curl "http://localhost:9000/api/authors"
```

```json
[
  { "id": 2, "nombre": "Ciencia ficción", "total_libros": 3 },
  { "id": 3, "nombre": "Fantasía", "total_libros": 2 }
]
```

Los autores incluyen además `nacionalidad`. Ambos se ordenan alfabéticamente. `GET /api/genres/:id` y `GET /api/authors/:id` responden `404` si no existe el registro.

---

### Favoritos

Todas las rutas requieren sesión, con cualquier rol. Cada usuario solo ve y modifica sus propios favoritos.

| Petición | Respuesta |
|---|---|
| `GET /api/favorites` | Arreglo de libros (objeto `Book` + `agregado_en`), del más reciente al más antiguo. |
| `POST /api/favorites/:bookId` | `201` si se agregó, `200` si ya estaba, `404` si el libro no existe. |
| `DELETE /api/favorites/:bookId` | `200` si se quitó, `404` si no estaba en favoritos. |

---

### Espacios

Alimentan la sección "Nuestro espacio" del frontend y su página de detalle. Se devuelven en el orden de la galería.

```bash
curl "http://localhost:9000/api/spaces"
curl "http://localhost:9000/api/spaces/2"
```

```json
{
  "id": 2,
  "nombre": "Club de lectura",
  "resumen": "Cada jueves comentamos un libro distinto del catálogo.",
  "descripcion": "Un grupo abierto de lectores que se reúne a comentar el libro del mes...",
  "horario": "Jueves de 19:00 a 20:30",
  "imagen_url": "/espacios/club-de-lectura.svg"
}
```

`imagen_url` acepta una URL absoluta o una ruta que sirve el frontend (carpeta `public/`). `GET /api/spaces/:id` responde `404` si el espacio no existe.

---

## Errores

Todos los errores tienen la misma forma:

```json
{ "error": "Descripción del error" }
```

Los errores de validación incluyen el detalle por campo:

```json
{
  "error": "Datos inválidos",
  "detalles": [
    { "campo": "precio", "mensaje": "El precio debe ser un número mayor o igual a 0" },
    { "campo": "isbn", "mensaje": "El ISBN debe tener 10 o 13 dígitos (sin guiones)" }
  ]
}
```

| Código | Significado |
|---|---|
| `400` | Datos inválidos o JSON mal formado. |
| `401` | Falta el token, es inválido o expiró. |
| `403` | El rol del usuario no tiene permiso. |
| `404` | El recurso o la ruta no existe. |
| `409` | Conflicto: registro duplicado o con registros que dependen de él. |
| `429` | Se superó el límite de peticiones. |
| `500` | Error interno. El detalle se registra en el servidor y no se expone al cliente. |

## Seguridad

- **Contraseñas** cifradas con bcrypt (10 rondas). El hash nunca se devuelve en las respuestas.
- **JWT** firmado con `JWT_SECRET` y con expiración.
- **Roles:** solo `admin` puede crear, editar y borrar libros. Nadie puede registrarse como admin desde la API.
- **Login:** mismo mensaje si falla el email o la contraseña, y tiempo de respuesta similar en ambos casos, para no revelar qué cuentas existen.
- **Validación** de todos los datos de entrada, más restricciones `CHECK`, `UNIQUE` y llaves foráneas en la base de datos.
- **Lista blanca de campos:** al crear o editar libros solo se guardan los campos permitidos.
- **Inyección SQL:** todas las consultas usan parámetros (`?`).
- **Rate limit:** 300 peticiones cada 15 minutos por IP, y 10 intentos fallidos de login o registro cada 15 minutos.
- **Helmet** para cabeceras HTTP seguras y **CORS** restringido al frontend.
- **Body** JSON limitado a 100 kb.
- **Credenciales** en `.env`, excluido del repositorio.

## Base de datos

Siete tablas en 3NF (`roles`, `users`, `genres`, `authors`, `books`, `favorites`, `spaces`), la vista `v_libros` y un trigger para las portadas. El diagrama entidad-relación y las reglas de integridad están en [`docs/diagrama-er.md`](docs/diagrama-er.md).
