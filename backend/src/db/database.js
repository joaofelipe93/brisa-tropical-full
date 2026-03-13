import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "../../data/brisa-tropical.db");

import fs from "fs";
fs.mkdirSync(path.join(__dirname, "../../data"), { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export function initDatabase() {
  db.exec(`
    -- Clientes
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Categorias
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      icon TEXT,
      sort_order INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1
    );

    -- Produtos
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

    -- Complementos
    CREATE TABLE IF NOT EXISTS toppings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL DEFAULT 0,
      available INTEGER DEFAULT 1
    );

    -- Bairros e fretes
    CREATE TABLE IF NOT EXISTS neighborhoods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      zone TEXT NOT NULL,
      delivery_fee REAL NOT NULL,
      min_time INTEGER NOT NULL,
      max_time INTEGER NOT NULL,
      active INTEGER DEFAULT 1
    );

    -- Pedidos
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

    -- Itens do pedido
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

    -- Configurações da loja
    CREATE TABLE IF NOT EXISTS store_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- Horários de funcionamento
    CREATE TABLE IF NOT EXISTS business_hours (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
      open_time TEXT,
      close_time TEXT,
      is_open INTEGER DEFAULT 1
    );
  `);

  seedDatabase();
  console.log("✅ Banco de dados inicializado");
}

function seedDatabase() {
  const catCount = db.prepare("SELECT COUNT(*) as c FROM categories").get();
  if (catCount.c > 0) return;

  // Categorias
  const insertCat = db.prepare(
    "INSERT INTO categories (name, slug, icon, sort_order) VALUES (?, ?, ?, ?)",
  );
  insertCat.run("Açaí no Copo", "acai", "🍇", 1);
  insertCat.run("Combos e Promoções", "combos", "🔥", 2);
  insertCat.run("Complementos", "complementos", "✨", 3);

  // Produtos - Açaí
  const insertProd = db.prepare(`
    INSERT INTO products (category_id, name, description, price, promo_price, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertProd.run(1, "Açaí 300ml", "Açaí puro cremoso no copo", 12.0, null, 1);
  insertProd.run(1, "Açaí 500ml", "Açaí puro cremoso no copo", 18.0, null, 2);
  insertProd.run(1, "Açaí 700ml", "Açaí puro cremoso no copo", 24.0, null, 3);
  insertProd.run(
    1,
    "Açaí 1 Litro",
    "Açaí puro cremoso no copo grande",
    32.0,
    null,
    4,
  );

  // Combos
  insertProd.run(
    2,
    "Combo Casal",
    "2 copos de 500ml + 4 complementos à escolha",
    38.0,
    32.0,
    1,
  );
  insertProd.run(
    2,
    "Combo Família",
    "4 copos de 500ml + 8 complementos à escolha",
    72.0,
    59.9,
    2,
  );
  insertProd.run(
    2,
    "Combo Fit",
    "Tigela M + 3 frutas + granola zero",
    28.0,
    24.0,
    3,
  );

  // Complementos (categoria 3 = produtos avulsos, mas também tem tabela de toppings)
  insertProd.run(
    3,
    "Granola Extra",
    "Porção extra de granola crocante",
    2.0,
    null,
    1,
  );
  insertProd.run(
    3,
    "Leite Condensado",
    "Leite condensado cremoso",
    2.0,
    null,
    2,
  );
  insertProd.run(3, "Nutella", "Dose de Nutella", 4.0, null, 3);
  insertProd.run(3, "Banana", "Banana fatiada fresca", 1.5, null, 4);
  insertProd.run(3, "Morango", "Morangos frescos fatiados", 3.0, null, 5);
  insertProd.run(3, "Paçoca", "Paçoca esfarelada", 2.0, null, 6);

  // Toppings disponíveis
  const insertTopping = db.prepare(
    "INSERT INTO toppings (name, price) VALUES (?, ?)",
  );
  insertTopping.run("Granola", 0);
  insertTopping.run("Banana", 0);
  insertTopping.run("Leite Condensado", 0);
  insertTopping.run("Granola Extra", 2.0);
  insertTopping.run("Morango", 3.0);
  insertTopping.run("Nutella", 4.0);
  insertTopping.run("Paçoca", 2.0);
  insertTopping.run("Kiwi", 3.0);
  insertTopping.run("Mel", 2.5);

  // Bairros de Natal/RN
  const insertNeighborhood = db.prepare(`
    INSERT INTO neighborhoods (name, zone, delivery_fee, min_time, max_time)
    VALUES (?, ?, ?, ?, ?)
  `);
  // Zona Norte
  insertNeighborhood.run("Lagoa Nova", "Sul", 5.0, 30, 45);
  insertNeighborhood.run("Candelária", "Sul", 5.0, 30, 45);
  insertNeighborhood.run("Capim Macio", "Sul", 6.0, 35, 50);
  insertNeighborhood.run("Nova Parnamirim", "Sul", 8.0, 40, 60);
  insertNeighborhood.run("Ponta Negra", "Sul", 7.0, 35, 50);
  insertNeighborhood.run("Neópolis", "Sul", 6.0, 30, 45);
  insertNeighborhood.run("Tirol", "Leste", 6.0, 30, 45);
  insertNeighborhood.run("Petrópolis", "Leste", 6.0, 30, 45);
  insertNeighborhood.run("Alecrim", "Leste", 7.0, 35, 50);
  insertNeighborhood.run("Cidade Alta", "Leste", 7.0, 35, 50);
  insertNeighborhood.run("Ribeira", "Leste", 8.0, 40, 60);
  insertNeighborhood.run("Quintas", "Norte", 9.0, 45, 65);
  insertNeighborhood.run("Igapó", "Norte", 9.0, 45, 65);
  insertNeighborhood.run("Redinha", "Norte", 12.0, 50, 70);
  insertNeighborhood.run("Pajuçara", "Norte", 9.0, 45, 65);
  insertNeighborhood.run("Lagoa Azul", "Norte", 10.0, 45, 65);
  insertNeighborhood.run("Pitimbu", "Oeste", 8.0, 40, 60);
  insertNeighborhood.run("Potengi", "Norte", 9.0, 45, 65);

  // Configurações da loja
  const insertSetting = db.prepare(
    "INSERT OR REPLACE INTO store_settings (key, value) VALUES (?, ?)",
  );
  insertSetting.run("store_name", "Brisa Tropical Açaí");
  insertSetting.run("pix_key", "016.487.354-60");
  insertSetting.run("pix_name", "Brisa Tropical Açaí");
  insertSetting.run("whatsapp_number", "5584991646369");
  insertSetting.run("min_order", "15.00");
  insertSetting.run("is_open", "true");

  // Horários
  const insertHour = db.prepare(`
    INSERT INTO business_hours (day_of_week, open_time, close_time, is_open)
    VALUES (?, ?, ?, ?)
  `);
  insertHour.run(0, "14:00", "23:59", 1); // Domingo
  insertHour.run(1, "00:00", "00:00", 0); // Segunda fechado
  insertHour.run(2, "14:00", "23:59", 1); // Terça
  insertHour.run(3, "14:00", "23:59", 1); // Quarta
  insertHour.run(4, "14:00", "23:59", 1); // Quinta
  insertHour.run(5, "14:00", "23:59", 1); // Sexta
  insertHour.run(6, "13:00", "23:59", 1); // Sábado

  console.log("🌱 Banco de dados populado com dados iniciais");
}

export default db;
