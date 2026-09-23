-- =====================================================================
--  Turing-IA | Periodo de prueba Desarrollo de Software
--  Proyecto: Librería en línea
--
--  Diseño en tercera forma normal (3NF):
--    - roles, users, genres, authors, books
--  Autores y generos viven en tablas propias; books solo guarda sus FK.
--
--  Uso:
--    mysql -u root -p < libreria_db.sql
-- =====================================================================

DROP DATABASE IF EXISTS turing_libreria;
CREATE DATABASE turing_libreria
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE turing_libreria;

-- ---------------------------------------------------------------------
-- 1. roles: catálogo de tipos de usuario (admin, user)
-- ---------------------------------------------------------------------
CREATE TABLE roles (
  id          TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre      VARCHAR(20)      NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT uq_roles_nombre UNIQUE (nombre)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- 2. users: usuarios registrados (la contraseña se guarda con bcrypt)
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id             INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  nombre         VARCHAR(100)     NOT NULL,
  email          VARCHAR(150)     NOT NULL,
  password_hash  CHAR(60)         NOT NULL,          -- longitud fija de bcrypt
  role_id        TINYINT UNSIGNED NOT NULL DEFAULT 2, -- por defecto los usuarios son user
  created_at     TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                  ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uq_users_email UNIQUE (email),
  CONSTRAINT fk_users_role
    FOREIGN KEY (role_id) REFERENCES roles (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- 3. genres: generos literarios
-- ---------------------------------------------------------------------
CREATE TABLE genres (
  id      SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre  VARCHAR(60)       NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT uq_genres_nombre UNIQUE (nombre)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- 4. authors: autores
-- ---------------------------------------------------------------------
CREATE TABLE authors (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre         VARCHAR(120) NOT NULL,
  nacionalidad   VARCHAR(60)  NULL,
  PRIMARY KEY (id),
  CONSTRAINT uq_authors_nombre UNIQUE (nombre)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- 5. books: libros del catálogo
--    portada_url: si no se envía, toma una imagen por defecto.
-- ---------------------------------------------------------------------
CREATE TABLE books (
  id                INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  titulo            VARCHAR(200)      NOT NULL,
  sinopsis          TEXT              NULL,
  precio            DECIMAL(10,2)     NOT NULL,
  stock             INT UNSIGNED      NOT NULL DEFAULT 0,
  isbn              VARCHAR(13)       NOT NULL,
  portada_url       VARCHAR(255)      NOT NULL
                    DEFAULT 'https://placehold.co/300x450?text=Sin+portada',
  anio_publicacion  SMALLINT          NULL,
  genre_id          SMALLINT UNSIGNED NOT NULL,
  author_id         INT UNSIGNED      NOT NULL,
  created_by        INT UNSIGNED      NULL,  -- admin que dio de alta el libro
  created_at        TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP
                                      ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uq_books_isbn UNIQUE (isbn),
  CONSTRAINT chk_books_precio CHECK (precio >= 0),
  CONSTRAINT chk_books_isbn   CHECK (CHAR_LENGTH(isbn) IN (10, 13)),
  CONSTRAINT chk_books_anio   CHECK (anio_publicacion IS NULL
                                     OR anio_publicacion BETWEEN 1000 AND 2100),
  CONSTRAINT fk_books_genre
    FOREIGN KEY (genre_id) REFERENCES genres (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,           -- no se borra un genero con libros
  CONSTRAINT fk_books_author
    FOREIGN KEY (author_id) REFERENCES authors (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,           -- no se borra un autor con libros
  CONSTRAINT fk_books_created_by
    FOREIGN KEY (created_by) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL            -- si se borra el admin, el libro permanece
) ENGINE = InnoDB;


-- =====================================================================
--  DATOS DE PRUEBA
-- =====================================================================

-- Roles
INSERT INTO roles (id, nombre) VALUES
  (1, 'admin'),
  (2, 'user');

-- Usuarios de prueba
--   admin@libreria.com  /  Admin123!
--   user@libreria.com   /  User123!
INSERT INTO users (nombre, email, password_hash, role_id) VALUES
  ('Administrador', 'admin@libreria.com',
   '$2b$10$oSDsryI5PSgc.wDkeK.RWezv7MRRtdy0QAMC1NazPbjj.NbB2qR6u', 1),
  ('Usuario Demo',  'user@libreria.com',
   '$2b$10$wCja57jERYgkpi2DYK6vxekSv.hLbtwtXR/qmxfD2c5xynKA5.F/K', 2);

-- generos
INSERT INTO genres (id, nombre) VALUES
  (1, 'Realismo mágico'),
  (2, 'Ciencia ficción'),
  (3, 'Fantasía'),
  (4, 'Clásicos'),
  (5, 'Terror'),
  (6, 'Misterio'),
  (7, 'Divulgación'),
  (8, 'Desarrollo personal');

-- Autores
INSERT INTO authors (id, nombre, nacionalidad) VALUES
  (1,  'Gabriel García Márquez',     'Colombiana'),
  (2,  'Juan Rulfo',                 'Mexicana'),
  (3,  'George Orwell',              'Británica'),
  (4,  'Frank Herbert',              'Estadounidense'),
  (5,  'Ray Bradbury',               'Estadounidense'),
  (6,  'J. R. R. Tolkien',           'Británica'),
  (7,  'J. K. Rowling',              'Británica'),
  (8,  'Jane Austen',                'Británica'),
  (9,  'Antoine de Saint-Exupéry',   'Francesa'),
  (10, 'Stephen King',               'Estadounidense'),
  (11, 'Agatha Christie',            'Británica'),
  (12, 'Dan Brown',                  'Estadounidense'),
  (13, 'Yuval Noah Harari',          'Israelí'),
  (14, 'Stephen Hawking',            'Británica'),
  (15, 'James Clear',                'Estadounidense');

-- Libros (sin portada: toman la imagen por defecto)
INSERT INTO books
  (titulo, sinopsis, precio, stock, isbn, anio_publicacion,
   genre_id, author_id, created_by)
VALUES
  ('Cien años de soledad',
   'La historia de la familia Buendía a lo largo de siete generaciones en el pueblo de Macondo.',
   349.00, 12, '9780307474728', 1967, 1, 1, 1),

  ('Pedro Páramo',
   'Juan Preciado viaja a Comala en busca de su padre y encuentra un pueblo habitado por murmullos.',
   229.00, 8, '9780802133908', 1955, 1, 2, 1),

  ('1984',
   'En un estado totalitario vigilado por el Gran Hermano, Winston Smith se atreve a pensar distinto.',
   279.00, 15, '9780451524935', 1949, 2, 3, 1),

  ('Dune',
   'Paul Atreides llega al desértico planeta Arrakis, fuente de la especia más valiosa del universo.',
   419.00, 10, '9780441172719', 1965, 2, 4, 1),

  ('Fahrenheit 451',
   'Un bombero cuyo trabajo es quemar libros empieza a cuestionar la sociedad en la que vive.',
   259.00, 9, '9781451673319', 1953, 2, 5, 1),

  ('El hobbit',
   'Bilbo Bolsón deja la comodidad de su hogar para acompañar a trece enanos en busca de un tesoro.',
   329.00, 14, '9780547928227', 1937, 3, 6, 1),

  ('Harry Potter y la piedra filosofal',
   'Un niño descubre en su cumpleaños número once que es un mago y entra al colegio Hogwarts.',
   389.00, 20, '9780590353427', 1997, 3, 7, 1),

  ('Orgullo y prejuicio',
   'Elizabeth Bennet y el señor Darcy superan sus primeras impresiones en la Inglaterra del siglo XIX.',
   199.00, 7, '9780141439518', 1813, 4, 8, 1),

  ('El principito',
   'Un piloto perdido en el desierto conoce a un pequeño príncipe llegado de otro planeta.',
   179.00, 25, '9780156012195', 1943, 4, 9, 1),

  ('El resplandor',
   'Jack Torrance acepta cuidar un hotel aislado durante el invierno junto a su esposa y su hijo.',
   299.00, 6, '9780307743657', 1977, 5, 10, 1),

  ('It',
   'Un grupo de amigos de Derry enfrenta a una entidad que despierta cada veintisiete años.',
   459.00, 5, '9781501142970', 1986, 5, 10, 1),

  ('Asesinato en el Orient Express',
   'Hércules Poirot investiga un crimen cometido en un tren detenido por la nieve.',
   239.00, 11, '9780062693662', 1934, 6, 11, 1),

  ('El código Da Vinci',
   'Un simbolista y una criptóloga siguen pistas ocultas tras un asesinato en el Louvre.',
   269.00, 9, '9780307474278', 2003, 6, 12, 1),

  ('Sapiens: De animales a dioses',
   'Un recorrido por la historia de la humanidad desde la Edad de Piedra hasta el siglo XXI.',
   399.00, 13, '9780062316097', 2011, 7, 13, 1),

  ('Breve historia del tiempo',
   'Una explicación accesible sobre el origen del universo, los agujeros negros y el tiempo.',
   289.00, 6, '9780553380163', 1988, 7, 14, 1),

  ('Hábitos atómicos',
   'Un método práctico para crear buenos hábitos, eliminar los malos y mejorar un poco cada día.',
   349.00, 18, '9780735211292', 2018, 8, 15, 1);
