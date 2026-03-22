import Database from 'better-sqlite3';

export function createTestDb() {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

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
      payment_method TEXT NOT NULL CHECK(payment_method IN ('pix','card')),
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

  // Seed
  db.prepare('INSERT INTO categories (name, slug, icon, sort_order) VALUES (?, ?, ?, ?)').run('Açaí no Copo', 'acai', '🍇', 1);
  db.prepare('INSERT INTO categories (name, slug, icon, sort_order) VALUES (?, ?, ?, ?)').run('Combos', 'combos', '🔥', 2);

  db.prepare('INSERT INTO products (category_id, name, description, price, sort_order) VALUES (?, ?, ?, ?, ?)').run(1, 'Açaí 300ml', 'Açaí cremoso', 12.00, 1);
  db.prepare('INSERT INTO products (category_id, name, description, price, promo_price, sort_order) VALUES (?, ?, ?, ?, ?, ?)').run(1, 'Açaí 500ml', 'Açaí cremoso', 18.00, 15.00, 2);
  db.prepare('INSERT INTO products (category_id, name, description, price, sort_order) VALUES (?, ?, ?, ?, ?)').run(2, 'Combo Casal', '2 copos 500ml', 38.00, 1);

  db.prepare('INSERT INTO toppings (name, price) VALUES (?, ?)').run('Granola', 0);
  db.prepare('INSERT INTO toppings (name, price) VALUES (?, ?)').run('Nutella', 4.00);

  db.prepare('INSERT INTO neighborhoods (name, zone, delivery_fee, min_time, max_time) VALUES (?, ?, ?, ?, ?)').run('Lagoa Nova', 'Sul', 5.00, 30, 45);
  db.prepare('INSERT INTO neighborhoods (name, zone, delivery_fee, min_time, max_time) VALUES (?, ?, ?, ?, ?)').run('Ponta Negra', 'Sul', 7.00, 35, 50);

  db.prepare('INSERT OR REPLACE INTO store_settings (key, value) VALUES (?, ?)').run('pix_key', 'teste@pix.com');
  db.prepare('INSERT OR REPLACE INTO store_settings (key, value) VALUES (?, ?)').run('pix_name', 'Brisa Tropical');
  db.prepare('INSERT OR REPLACE INTO store_settings (key, value) VALUES (?, ?)').run('whatsapp_number', '5584999999999');
  db.prepare('INSERT OR REPLACE INTO store_settings (key, value) VALUES (?, ?)').run('is_open', 'true');

  db.prepare('INSERT INTO business_hours (day_of_week, open_time, close_time, is_open) VALUES (?, ?, ?, ?)').run(0, '14:00', '22:00', 1);
  db.prepare('INSERT INTO business_hours (day_of_week, open_time, close_time, is_open) VALUES (?, ?, ?, ?)').run(1, '00:00', '00:00', 0);

  db.prepare('INSERT INTO customization_steps (title, subtitle, emoji, min_selections, max_selections, sort_order) VALUES (?, ?, ?, ?, ?, ?)').run('FRUTAS', 'Escolha 1', '🍓', 1, 1, 1);
  db.prepare('INSERT INTO step_options (step_id, name, extra_price, sort_order) VALUES (?, ?, ?, ?)').run(1, 'Morango', 0, 1);
  db.prepare('INSERT INTO step_options (step_id, name, extra_price, sort_order) VALUES (?, ?, ?, ?)').run(1, 'Banana', 0, 2);

  return db;
}
