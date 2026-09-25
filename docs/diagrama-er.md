# Diagrama entidad-relación

Base de datos `turing_libreria` (MySQL 8), diseñada en tercera forma normal (3NF). GitHub dibuja este diagrama automáticamente a partir del bloque Mermaid.

```mermaid
erDiagram
    roles ||--o{ users : "tiene"
    users ||--o{ books : "da de alta"
    genres ||--o{ books : "clasifica"
    authors ||--o{ books : "escribe"
    users ||--o{ favorites : "guarda"
    books ||--o{ favorites : "es guardado en"

    roles {
        TINYINT id PK
        VARCHAR nombre UK
    }
    users {
        INT id PK
        VARCHAR nombre
        VARCHAR email UK
        CHAR password_hash "bcrypt, 60 caracteres"
        TINYINT role_id FK
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }
    genres {
        SMALLINT id PK
        VARCHAR nombre UK
    }
    authors {
        INT id PK
        VARCHAR nombre UK
        VARCHAR nacionalidad
    }
    books {
        INT id PK
        VARCHAR titulo
        TEXT sinopsis
        DECIMAL precio "CHECK >= 0"
        INT stock
        VARCHAR isbn UK "CHECK 10 o 13 caracteres"
        VARCHAR portada_url
        SMALLINT anio_publicacion "CHECK 1000 a 2100"
        SMALLINT genre_id FK
        INT author_id FK
        INT created_by FK
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }
    favorites {
        INT user_id PK, FK
        INT book_id PK, FK
        TIMESTAMP created_at
    }
```

## Reglas de integridad

| Relación | Al borrar el registro padre |
|---|---|
| `roles` → `users` | `RESTRICT`: no se puede borrar un rol con usuarios. |
| `genres` → `books` | `RESTRICT`: no se puede borrar un género con libros. |
| `authors` → `books` | `RESTRICT`: no se puede borrar un autor con libros. |
| `users` → `books.created_by` | `SET NULL`: el libro se conserva aunque se borre el admin que lo creó. |
| `users` → `favorites` | `CASCADE`: se borran los favoritos del usuario. |
| `books` → `favorites` | `CASCADE`: el libro desaparece de los favoritos. |

## Por qué está en 3NF

- **1NF:** cada columna guarda un solo valor; no hay listas dentro de un campo.
- **2NF:** en `favorites`, la única tabla con llave compuesta, `created_at` depende de la llave completa (usuario + libro).
- **3NF:** los libros no repiten el nombre del autor ni del género; solo guardan su id. Así, cambiar el nombre de un autor se hace en un solo lugar.

## Objetos adicionales

- **Vista `v_libros`:** une `books` con `genres` y `authors`, y calcula `disponible` (`stock > 0`). La API lee el catálogo desde aquí.
- **Trigger `trg_books_antes_de_agregar`:** si un libro se da de alta sin portada, la arma con su ISBN usando Open Library.
