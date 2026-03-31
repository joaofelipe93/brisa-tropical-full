import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "../../data/brisa-tropical.db");
fs.mkdirSync(path.join(__dirname, "../../data"), { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export function initDatabase() {
  // ✅ Apenas criação de tabelas
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      icon TEXT,
      sort_order INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      promo_price REAL,
      image_url TEXT,
      available INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );
    CREATE TABLE IF NOT EXISTS toppings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL DEFAULT 0,
      available INTEGER DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS customization_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      subtitle TEXT NOT NULL,
      emoji TEXT NOT NULL,
      min_selections INTEGER DEFAULT 1,
      max_selections INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS step_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      step_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      extra_price REAL DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      FOREIGN KEY (step_id) REFERENCES customization_steps(id)
    );
    CREATE TABLE IF NOT EXISTS neighborhoods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      zone TEXT NOT NULL,
      delivery_fee REAL NOT NULL,
      min_time INTEGER NOT NULL,
      max_time INTEGER NOT NULL,
      active INTEGER DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      neighborhood_id INTEGER NOT NULL,
      address TEXT NOT NULL,
      address_complement TEXT,
      payment_method TEXT NOT NULL CHECK(payment_method IN ('pix', 'card')),
      subtotal REAL NOT NULL,
      delivery_fee REAL NOT NULL,
      total REAL NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','confirmed','preparing','delivering','delivered','cancelled')),
      notes TEXT,
      whatsapp_sent INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (neighborhood_id) REFERENCES neighborhoods(id)
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      toppings TEXT,
      notes TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
    CREATE TABLE IF NOT EXISTS store_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS business_hours (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
      open_time TEXT,
      close_time TEXT,
      is_open INTEGER DEFAULT 1
    );
  `);

  // ✅ Configurações — sempre do .env
  const insertSetting = db.prepare(
    "INSERT OR REPLACE INTO store_settings (key, value) VALUES (?, ?)",
  );
  insertSetting.run("store_name", process.env.PIX_NAME || "");
  insertSetting.run("pix_key", process.env.PIX_KEY || "");
  insertSetting.run("pix_name", process.env.PIX_NAME || "");
  insertSetting.run("whatsapp_number", process.env.WHATSAPP_NUMBER || "");
  insertSetting.run("min_order", "15.00");
  insertSetting.run("is_open", "true");

  // ✅ Horários — só insere se ainda não existirem
  const hoursCount = db
    .prepare("SELECT COUNT(*) as c FROM business_hours")
    .get();
  if (hoursCount.c === 0) {
    const insertHour = db.prepare(
      "INSERT INTO business_hours (day_of_week, open_time, close_time, is_open) VALUES (?, ?, ?, ?)",
    );
    insertHour.run(0, "14:00", "22:00", 1); // Domingo
    insertHour.run(1, "00:00", "00:00", 0); // Segunda — fechado
    insertHour.run(2, "14:00", "22:00", 1); // Terça
    insertHour.run(3, "14:00", "22:00", 1); // Quarta
    insertHour.run(4, "14:00", "22:00", 1); // Quinta
    insertHour.run(5, "14:00", "23:00", 1); // Sexta
    insertHour.run(6, "13:00", "23:00", 1); // Sábado
  }

  console.log("✅ Banco de dados inicializado");
}

export default db;
