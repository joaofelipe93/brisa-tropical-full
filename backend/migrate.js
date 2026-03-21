// migrate.js — insere os dados iniciais do cardápio
// Seguro para rodar múltiplas vezes: verifica antes de inserir
// Uso: npm run migrate

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'data/brisa-tropical.db');
const db = new Database(DB_PATH);

console.log('🔄 Iniciando migração...\n');

// ── Categorias ──────────────────────────────────────────────
const catCount = db.prepare('SELECT COUNT(*) as c FROM categories').get();
if (catCount.c === 0) {
  const ins = db.prepare('INSERT INTO categories (name, slug, icon, sort_order) VALUES (?, ?, ?, ?)');
  ins.run('Açaí no Copo',       'acai',         '🍇', 1);
  ins.run('Combos e Promoções', 'combos',        '🔥', 2);
  ins.run('Complementos',       'complementos',  '✨', 3);
  console.log('✅ Categorias inseridas');
} else {
  console.log('⏭️  Categorias já existem — pulando');
}

// ── Produtos ────────────────────────────────────────────────
const prodCount = db.prepare('SELECT COUNT(*) as c FROM products').get();
if (prodCount.c === 0) {
  const ins = db.prepare('INSERT INTO products (category_id, name, description, price, promo_price, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
  // Açaí no copo
  ins.run(1, 'Açaí 300ml',    'Açaí puro cremoso no copo',       12.00, null,  1);
  ins.run(1, 'Açaí 500ml',    'Açaí puro cremoso no copo',       18.00, null,  2);
  ins.run(1, 'Açaí 700ml',    'Açaí puro cremoso no copo',       24.00, null,  3);
  ins.run(1, 'Açaí 1 Litro',  'Açaí puro cremoso no copo grande',32.00, null,  4);
  // Combos
  ins.run(2, 'Combo Casal',   '2 copos de 500ml + 4 complementos', 38.00, 32.00, 1);
  ins.run(2, 'Combo Família', '4 copos de 500ml + 8 complementos', 72.00, 59.90, 2);
  ins.run(2, 'Combo Fit',     'Tigela M + 3 frutas + granola zero',28.00, 24.00, 3);
  // Complementos avulsos
  ins.run(3, 'Granola Extra',    'Porção extra de granola crocante', 2.00, null, 1);
  ins.run(3, 'Leite Condensado', 'Leite condensado cremoso',         2.00, null, 2);
  ins.run(3, 'Nutella',          'Dose de Nutella',                  4.00, null, 3);
  ins.run(3, 'Banana',           'Banana fatiada fresca',            1.50, null, 4);
  ins.run(3, 'Morango',          'Morangos frescos fatiados',        3.00, null, 5);
  ins.run(3, 'Paçoca',           'Paçoca esfarelada',                2.00, null, 6);
  console.log('✅ Produtos inseridos');
} else {
  console.log('⏭️  Produtos já existem — pulando');
}

// ── Toppings ────────────────────────────────────────────────
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

// ── Bairros ─────────────────────────────────────────────────
const neighCount = db.prepare('SELECT COUNT(*) as c FROM neighborhoods').get();
if (neighCount.c === 0) {
  const ins = db.prepare('INSERT INTO neighborhoods (name, zone, delivery_fee, min_time, max_time) VALUES (?, ?, ?, ?, ?)');
  ins.run('Lagoa Nova',       'Sul',   5.00, 30, 45);
  ins.run('Candelária',       'Sul',   5.00, 30, 45);
  ins.run('Capim Macio',      'Sul',   6.00, 35, 50);
  ins.run('Nova Parnamirim',  'Sul',   8.00, 40, 60);
  ins.run('Ponta Negra',      'Sul',   7.00, 35, 50);
  ins.run('Neópolis',         'Sul',   6.00, 30, 45);
  ins.run('Tirol',            'Leste', 6.00, 30, 45);
  ins.run('Petrópolis',       'Leste', 6.00, 30, 45);
  ins.run('Alecrim',          'Leste', 7.00, 35, 50);
  ins.run('Cidade Alta',      'Leste', 7.00, 35, 50);
  ins.run('Ribeira',          'Leste', 8.00, 40, 60);
  ins.run('Quintas',          'Norte', 9.00, 45, 65);
  ins.run('Igapó',            'Norte', 9.00, 45, 65);
  ins.run('Redinha',          'Norte', 12.00,50, 70);
  ins.run('Pajuçara',         'Norte', 9.00, 45, 65);
  ins.run('Lagoa Azul',       'Norte', 10.00,45, 65);
  ins.run('Pitimbu',          'Oeste', 8.00, 40, 60);
  ins.run('Potengi',          'Norte', 9.00, 45, 65);
  console.log('✅ Bairros inseridos');
} else {
  console.log('⏭️  Bairros já existem — pulando');
}

// ── Passos de personalização ────────────────────────────────
const stepCount = db.prepare('SELECT COUNT(*) as c FROM customization_steps').get();
if (stepCount.c === 0) {
  const insStep = db.prepare('INSERT INTO customization_steps (title, subtitle, emoji, min_selections, max_selections, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
  insStep.run('ESCOLHA SUAS FRUTAS', 'Escolha 1 opção',         '🍓', 1, 1,  1);
  insStep.run('COBERTURA OU CALDA',  'Escolha 1 opção',         '🍯', 1, 1,  2);
  insStep.run('COMPLEMENTOS',        'Escolha de 1 a 5 opções', '🥣', 1, 5,  3);
  insStep.run('ADICIONAIS',          'Opcional — à vontade',    '✨', 0, 99, 4);

  const insOpt = db.prepare('INSERT INTO step_options (step_id, name, extra_price, sort_order) VALUES (?, ?, ?, ?)');

  // Passo 1 — Frutas
  ['Morango','Banana','Kiwi','Manga','Uva','Sem fruta'].forEach((name, i) => {
    insOpt.run(1, name, 0, i + 1);
  });

  // Passo 2 — Cobertura
  ['Leite Condensado','Nutella','Mel','Calda de Chocolate','Calda de Morango','Sem cobertura'].forEach((name, i) => {
    insOpt.run(2, name, 0, i + 1);
  });

  // Passo 3 — Complementos
  ['Granola','Granola Zero','Paçoca','Bis','Confete','Flocos de Milho','Amendoim','Castanha','Leite em Pó','Ovomaltine','Jujuba'].forEach((name, i) => {
    insOpt.run(3, name, 0, i + 1);
  });

  // Passo 4 — Adicionais
  [
    ['Extra de Granola',          2.00],
    ['Extra de Leite Condensado', 2.00],
    ['Extra de Nutella',          4.00],
    ['Extra de Morango',          3.00],
    ['Extra de Banana',           1.50],
  ].forEach(([name, price], i) => {
    insOpt.run(4, name, price, i + 1);
  });

  console.log('✅ Passos de personalização inseridos');
} else {
  console.log('⏭️  Passos já existem — pulando');
}

console.log('\n🎉 Migração concluída! Dados preservados.\n');
db.close();
