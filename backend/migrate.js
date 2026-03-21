// migrate.js — cria tabelas + insere dados iniciais
// ✅ Seguro para rodar múltiplas vezes: verifica antes de inserir
// Uso: npm run migrate  ou  npm run db:migrate (na raiz)

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR  = path.join(__dirname, 'data');
const DB_PATH   = path.join(DATA_DIR, 'brisa-tropical.db');

// Garante que a pasta data existe
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log('🔄 Iniciando migração...\n');

// ── 1. Criar tabelas ─────────────────────────────────────────
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
console.log('✅ Tabelas verificadas');

// ── 2. Configurações da loja (.env) ──────────────────────────
const insSet = db.prepare('INSERT OR REPLACE INTO store_settings (key, value) VALUES (?, ?)');
insSet.run('store_name',      process.env.PIX_NAME        || '');
insSet.run('pix_key',         process.env.PIX_KEY         || '');
insSet.run('pix_name',        process.env.PIX_NAME        || '');
insSet.run('whatsapp_number', process.env.WHATSAPP_NUMBER || '');
insSet.run('min_order',       '15.00');
insSet.run('is_open',         'true');
console.log('✅ Configurações atualizadas');

// ── 3. Horários ───────────────────────────────────────────────
const hoursCount = db.prepare('SELECT COUNT(*) as c FROM business_hours').get();
if (hoursCount.c === 0) {
  const ins = db.prepare('INSERT INTO business_hours (day_of_week, open_time, close_time, is_open) VALUES (?, ?, ?, ?)');
  ins.run(0, '14:00', '22:00', 1); // Domingo
  ins.run(1, '00:00', '00:00', 0); // Segunda — fechado
  ins.run(2, '14:00', '22:00', 1); // Terça
  ins.run(3, '14:00', '22:00', 1); // Quarta
  ins.run(4, '14:00', '22:00', 1); // Quinta
  ins.run(5, '14:00', '23:00', 1); // Sexta
  ins.run(6, '13:00', '23:00', 1); // Sábado
  console.log('✅ Horários inseridos');
} else {
  console.log('⏭️  Horários já existem — pulando');
}

// ── 4. Categorias ─────────────────────────────────────────────
const catCount = db.prepare('SELECT COUNT(*) as c FROM categories').get();
if (catCount.c === 0) {
  const ins = db.prepare('INSERT INTO categories (name, slug, icon, sort_order) VALUES (?, ?, ?, ?)');
  ins.run('Açaí no Copo',       'acai',        '🍇', 1);
  ins.run('Combos e Promoções', 'combos',       '🔥', 2);
  ins.run('Complementos',       'complementos', '✨', 3);
  console.log('✅ Categorias inseridas');
} else {
  console.log('⏭️  Categorias já existem — pulando');
}

// ── 5. Produtos ───────────────────────────────────────────────
const prodCount = db.prepare('SELECT COUNT(*) as c FROM products').get();
if (prodCount.c === 0) {
  const ins = db.prepare('INSERT INTO products (category_id, name, description, price, promo_price, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
  ins.run(1, 'Açaí 300ml',    'Açaí puro cremoso no copo',        12.00, null,  1);
  ins.run(1, 'Açaí 500ml',    'Açaí puro cremoso no copo',        18.00, null,  2);
  ins.run(1, 'Açaí 700ml',    'Açaí puro cremoso no copo',        24.00, null,  3);
  ins.run(1, 'Açaí 1 Litro',  'Açaí puro cremoso no copo grande', 32.00, null,  4);
  ins.run(2, 'Combo Casal',   '2 copos de 500ml + 4 complementos',38.00, 32.00, 1);
  ins.run(2, 'Combo Família', '4 copos de 500ml + 8 complementos',72.00, 59.90, 2);
  ins.run(2, 'Combo Fit',     'Copo 500ml + 3 frutas + granola',  28.00, 24.00, 3);
  ins.run(3, 'Granola Extra',    'Porção extra de granola',        2.00, null, 1);
  ins.run(3, 'Leite Condensado', 'Leite condensado cremoso',       2.00, null, 2);
  ins.run(3, 'Nutella',          'Dose de Nutella',                4.00, null, 3);
  ins.run(3, 'Banana',           'Banana fatiada fresca',          1.50, null, 4);
  ins.run(3, 'Morango',          'Morangos frescos fatiados',      3.00, null, 5);
  ins.run(3, 'Paçoca',           'Paçoca esfarelada',              2.00, null, 6);
  console.log('✅ Produtos inseridos');
} else {
  console.log('⏭️  Produtos já existem — pulando');
}

// ── 6. Toppings ───────────────────────────────────────────────
const toppingCount = db.prepare('SELECT COUNT(*) as c FROM toppings').get();
if (toppingCount.c === 0) {
  const ins = db.prepare('INSERT INTO toppings (name, price) VALUES (?, ?)');
  ins.run('Granola',          0);
  ins.run('Banana',           0);
  ins.run('Leite Condensado', 0);
  ins.run('Granola Extra',    2.00);
  ins.run('Morango',          3.00);
  ins.run('Nutella',          4.00);
  ins.run('Paçoca',           2.00);
  ins.run('Kiwi',             3.00);
  ins.run('Mel',              2.50);
  ins.run('Leite em Pó',      0);
  ins.run('Ovomaltine',       2.00);
  ins.run('Jujuba',           1.50);
  console.log('✅ Toppings inseridos');
} else {
  console.log('⏭️  Toppings já existem — pulando');
}

// ── 7. Bairros ────────────────────────────────────────────────
const neighCount = db.prepare('SELECT COUNT(*) as c FROM neighborhoods').get();
if (neighCount.c === 0) {
  const ins = db.prepare('INSERT INTO neighborhoods (name, zone, delivery_fee, min_time, max_time) VALUES (?, ?, ?, ?, ?)');
  ins.run('Lagoa Nova',      'Sul',   5.00,  30, 45);
  ins.run('Candelária',      'Sul',   5.00,  30, 45);
  ins.run('Capim Macio',     'Sul',   6.00,  35, 50);
  ins.run('Nova Parnamirim', 'Sul',   8.00,  40, 60);
  ins.run('Ponta Negra',     'Sul',   7.00,  35, 50);
  ins.run('Neópolis',        'Sul',   6.00,  30, 45);
  ins.run('Tirol',           'Leste', 6.00,  30, 45);
  ins.run('Petrópolis',      'Leste', 6.00,  30, 45);
  ins.run('Alecrim',         'Leste', 7.00,  35, 50);
  ins.run('Cidade Alta',     'Leste', 7.00,  35, 50);
  ins.run('Ribeira',         'Leste', 8.00,  40, 60);
  ins.run('Quintas',         'Norte', 9.00,  45, 65);
  ins.run('Igapó',           'Norte', 9.00,  45, 65);
  ins.run('Redinha',         'Norte', 12.00, 50, 70);
  ins.run('Pajuçara',        'Norte', 9.00,  45, 65);
  ins.run('Lagoa Azul',      'Norte', 10.00, 45, 65);
  ins.run('Pitimbu',         'Oeste', 8.00,  40, 60);
  ins.run('Potengi',         'Norte', 9.00,  45, 65);
  console.log('✅ Bairros inseridos');
} else {
  console.log('⏭️  Bairros já existem — pulando');
}

// ── 8. Passos de personalização ───────────────────────────────
const stepCount = db.prepare('SELECT COUNT(*) as c FROM customization_steps').get();
if (stepCount.c === 0) {
  const insStep = db.prepare('INSERT INTO customization_steps (title, subtitle, emoji, min_selections, max_selections, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
  insStep.run('ESCOLHA SUAS FRUTAS', 'Escolha 1 opção',         '🍓', 1, 1,  1);
  insStep.run('COBERTURA OU CALDA',  'Escolha 1 opção',         '🍯', 1, 1,  2);
  insStep.run('COMPLEMENTOS',        'Escolha de 1 a 5 opções', '🥣', 1, 5,  3);
  insStep.run('ADICIONAIS',          'Opcional — à vontade',    '✨', 0, 99, 4);

  const insOpt = db.prepare('INSERT INTO step_options (step_id, name, extra_price, sort_order) VALUES (?, ?, ?, ?)');

  ['Morango','Banana','Kiwi','Manga','Uva','Sem fruta'].forEach((n, i) =>
    insOpt.run(1, n, 0, i + 1));

  ['Leite Condensado','Nutella','Mel','Calda de Chocolate','Calda de Morango','Sem cobertura'].forEach((n, i) =>
    insOpt.run(2, n, 0, i + 1));

  ['Granola','Granola Zero','Paçoca','Bis','Confete','Flocos de Milho','Amendoim','Castanha','Leite em Pó','Ovomaltine','Jujuba'].forEach((n, i) =>
    insOpt.run(3, n, 0, i + 1));

  [['Extra de Granola',2],['Extra de Leite Condensado',2],['Extra de Nutella',4],['Extra de Morango',3],['Extra de Banana',1.5]].forEach(([n, p], i) =>
    insOpt.run(4, n, p, i + 1));

  console.log('✅ Passos de personalização inseridos');
} else {
  console.log('⏭️  Passos já existem — pulando');
}

console.log('\n🎉 Migração concluída!\n');
db.close();
