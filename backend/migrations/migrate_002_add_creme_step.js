// migrate_002_add_creme_step.js
// Adiciona o passo "Escolha o creme" e reorganiza os passos para 5 etapas
// Uso: node migrate_002_add_creme_step.js

import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "../data/brisa-tropical.db");
const db = new Database(DB_PATH);

console.log("🔄 Iniciando migração 002 — Adicionar passo Creme...\n");

// ── 1. Verificar se já foi rodada ────────────────────────────
const cremeExists = db
  .prepare(
    `
  SELECT COUNT(*) as c FROM customization_steps WHERE title = 'ESCOLHA O CREME'
`,
  )
  .get();

if (cremeExists.c > 0) {
  console.log('⚠️  Passo "Creme" já existe — migração ignorada.');
  process.exit(0);
}

// ── 2. Reorganizar sort_order dos passos existentes ──────────
// Frutas    → sort_order 1 (não muda)
// Creme     → sort_order 2 (novo)
// Cobertura → sort_order 3 (era 2)
// Complementos → sort_order 4 (era 3)
// Adicionais   → sort_order 5 (era 4)

db.prepare(
  `UPDATE customization_steps SET sort_order = 3 WHERE title = 'COBERTURA OU CALDA'`,
).run();
db.prepare(
  `UPDATE customization_steps SET sort_order = 4 WHERE title = 'COMPLEMENTOS'`,
).run();
db.prepare(
  `UPDATE customization_steps SET sort_order = 5 WHERE title = 'ADICIONAIS'`,
).run();

console.log("✅ sort_order dos passos existentes reorganizado");

// ── 3. Inserir o novo passo Creme ────────────────────────────
const result = db
  .prepare(
    `
  INSERT INTO customization_steps (title, subtitle, emoji, min_selections, max_selections, sort_order)
  VALUES (?, ?, ?, ?, ?, ?)
`,
  )
  .run("ESCOLHA O CREME", "Escolha 1 opção", "🍦", 1, 1, 2);

const cremeStepId = result.lastInsertRowid;
console.log(`✅ Passo "Creme" inserido (id: ${cremeStepId})`);

// ── 4. Inserir opções do passo Creme ─────────────────────────
const insOpt = db.prepare(`
  INSERT INTO step_options (step_id, name, extra_price, sort_order)
  VALUES (?, ?, ?, ?)
`);

["Creme de Cupuaçu", "Creme de Ninho", "Sem creme"].forEach((name, i) => {
  insOpt.run(cremeStepId, name, 0, i + 1);
});

console.log("✅ Opções do creme inseridas");

// ── 5. Atualizar o máximo de Complementos para 3 ─────────────
db.prepare(
  `
  UPDATE customization_steps SET max_selections = 3 WHERE title = 'COMPLEMENTOS'
`,
).run();

console.log("✅ Complementos atualizado para máximo de 3 opções");

// ── 6. Verificar resultado final ─────────────────────────────
const steps = db
  .prepare(
    `
  SELECT id, title, subtitle, sort_order, min_selections, max_selections
  FROM customization_steps
  ORDER BY sort_order
`,
  )
  .all();

console.log("\n📋 Passos atualizados:");
steps.forEach((s) => {
  console.log(
    `  ${s.sort_order}. ${s.title} (${s.min_selections}-${s.max_selections} opções)`,
  );
});

console.log("\n🎉 Migração 002 concluída!\n");
db.close();
