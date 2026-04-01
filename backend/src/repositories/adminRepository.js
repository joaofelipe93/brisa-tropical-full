// src/repositories/adminRepository.js
import db from '../db/database.js';

export const adminRepository = {

  // ── Produtos ───────────────────────────────────────────────

  findAllProductsAdmin() {
    return db.prepare(`
      SELECT p.*, c.name as category_name
      FROM products p
      JOIN categories c ON c.id = p.category_id
      ORDER BY c.sort_order, p.sort_order
    `).all();
  },

  findProductByIdAdmin(id) {
    return db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  },

  createProduct({ categoryId, name, description, price, promoPrice, sortOrder }) {
    const result = db.prepare(`
      INSERT INTO products (category_id, name, description, price, promo_price, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(categoryId, name, description || null, price, promoPrice || null, sortOrder || 0);
    return result.lastInsertRowid;
  },

  updateProduct(id, { categoryId, name, description, price, promoPrice, available, sortOrder }) {
    db.prepare(`
      UPDATE products
      SET category_id = ?, name = ?, description = ?, price = ?,
          promo_price = ?, available = ?, sort_order = ?
      WHERE id = ?
    `).run(categoryId, name, description || null, price, promoPrice || null, available, sortOrder || 0, id);
  },

  toggleProductAvailability(id, available) {
    db.prepare('UPDATE products SET available = ? WHERE id = ?').run(available, id);
  },

  deleteProduct(id) {
    db.prepare('DELETE FROM products WHERE id = ?').run(id);
  },

  // ── Categorias ─────────────────────────────────────────────

  findAllCategoriesAdmin() {
    return db.prepare(`
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY c.sort_order
    `).all();
  },

  findCategoryById(id) {
    return db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  },

  createCategory({ name, slug, icon, sortOrder }) {
    const result = db.prepare(`
      INSERT INTO categories (name, slug, icon, sort_order)
      VALUES (?, ?, ?, ?)
    `).run(name, slug, icon || '🍇', sortOrder || 0);
    return result.lastInsertRowid;
  },

  updateCategory(id, { name, slug, icon, sortOrder, active }) {
    db.prepare(`
      UPDATE categories SET name = ?, slug = ?, icon = ?, sort_order = ?, active = ?
      WHERE id = ?
    `).run(name, slug, icon || '🍇', sortOrder || 0, active, id);
  },

  deleteCategory(id) {
    const products = db.prepare('SELECT COUNT(*) as c FROM products WHERE category_id = ?').get(id);
    if (products.c > 0) throw new Error('Categoria possui produtos. Remova os produtos primeiro.');
    db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  },

  // ── Passos de personalização ───────────────────────────────

  findAllSteps() {
    const steps = db.prepare(`
      SELECT * FROM customization_steps ORDER BY sort_order
    `).all();
    return steps.map(step => ({
      ...step,
      options: db.prepare(`
        SELECT * FROM step_options WHERE step_id = ? ORDER BY sort_order
      `).all(step.id),
    }));
  },

  findStepById(id) {
    return db.prepare('SELECT * FROM customization_steps WHERE id = ?').get(id);
  },

  updateStep(id, { title, subtitle, emoji, minSelections, maxSelections, sortOrder, active }) {
    db.prepare(`
      UPDATE customization_steps
      SET title = ?, subtitle = ?, emoji = ?, min_selections = ?,
          max_selections = ?, sort_order = ?, active = ?
      WHERE id = ?
    `).run(title, subtitle, emoji, minSelections, maxSelections, sortOrder, active, id);
  },

  // ── Opções dos passos ──────────────────────────────────────

  findOptionById(id) {
    return db.prepare('SELECT * FROM step_options WHERE id = ?').get(id);
  },

  createOption({ stepId, name, extraPrice, sortOrder }) {
    const result = db.prepare(`
      INSERT INTO step_options (step_id, name, extra_price, sort_order)
      VALUES (?, ?, ?, ?)
    `).run(stepId, name, extraPrice || 0, sortOrder || 0);
    return result.lastInsertRowid;
  },

  updateOption(id, { name, extraPrice, sortOrder, active }) {
    db.prepare(`
      UPDATE step_options SET name = ?, extra_price = ?, sort_order = ?, active = ?
      WHERE id = ?
    `).run(name, extraPrice || 0, sortOrder || 0, active, id);
  },

  deleteOption(id) {
    db.prepare('DELETE FROM step_options WHERE id = ?').run(id);
  },
};
