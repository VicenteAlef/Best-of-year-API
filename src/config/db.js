const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const bcrypt = require("bcryptjs");
const path = require("path");

async function openDb() {
  return open({
    filename: path.resolve(__dirname, "../../database.sqlite"),
    driver: sqlite3.Database,
  });
}

async function initDb() {
  const db = await openDb();

  // Ativar Foreign Keys
  await db.exec("PRAGMA foreign_keys = ON;");

  // 1. Tabela de Usuários
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user', -- 'admin' ou 'user'
      photo_path TEXT,
      voted INTEGER DEFAULT 0 -- 0 para false, 1 para true
    )
  `);

  // 2. Tabela de Categorias
  await db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL
    )
  `);

  // 3. Tabela de Nomeados (Quem concorre em qual categoria)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS nominees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 4. Tabela de Votos
  await db.exec(`
    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voter_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      nominee_id INTEGER NOT NULL,
      FOREIGN KEY (voter_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
      FOREIGN KEY (nominee_id) REFERENCES nominees(id) ON DELETE CASCADE
    )
  `);

  // --- SEED: Criar Admin Inicial ---
  const adminExists = await db.get(
    "SELECT * FROM users WHERE email = 'admin@email.com'"
  );

  if (!adminExists) {
    const passwordHash = await bcrypt.hash("admin123", 10);
    await db.run(
      `
      INSERT INTO users (name, email, password, role, photo_path)
      VALUES (?, ?, ?, ?, ?)
    `,
      ["Administrador", "admin@email.com", passwordHash, "admin", null]
    );
    console.log("Usuário Admin padrão criado: admin@email.com / admin123");
  }

  console.log("Banco de dados inicializado com sucesso.");
}

module.exports = { openDb, initDb };
