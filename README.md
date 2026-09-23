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