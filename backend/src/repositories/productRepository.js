import db from '../db/database.js';

export const productRepository = {

  findAllCategories() {
    return db.prepare(`
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.available = 1
      WHERE c.active = 1
      GROUP BY c.id
      ORDER BY c.sort_order
    `).all();
  },

  findAllProducts(categorySlug) {
    let query = `
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      JOIN categories c ON c.id = p.category_id
      WHERE p.available = 1
    `;
    const params = [];
    if (categorySlug) {
      query += ' AND c.slug = ?';
      params.push(categorySlug);
    }
    query += ' ORDER BY p.sort_order';
    return db.prepare(query).all(...params);
  },

  findProductById(id) {
    return db.prepare('SELECT * FROM products WHERE id = ? AND available = 1').get(id);
  },

  findAllToppings() {
    return db.prepare('SELECT * FROM toppings WHERE available = 1 ORDER BY name').all();
  },

  findAllNeighborhoods() {
    return db.prepare('SELECT * FROM neighborhoods WHERE active = 1 ORDER BY zone, name').all();
  },

  findNeighborhoodById(id) {
    return db.prepare('SELECT * FROM neighborhoods WHERE id = ? AND active = 1').get(id);
  },

  findAllSettings() {
    return db.prepare('SELECT key, value FROM store_settings').all();
  },

  findAllBusinessHours() {
    return db.prepare('SELECT * FROM business_hours ORDER BY day_of_week').all();
  },

  findAllCustomizationSteps() {
    const steps = db.prepare(`
      SELECT * FROM customization_steps WHERE active = 1 ORDER BY sort_order
    `).all();

    return steps.map(step => {
      const options = db.prepare(`
        SELECT * FROM step_options WHERE step_id = ? AND active = 1 ORDER BY sort_order
      `).all(step.id);
      return { ...step, options };
    });
  },
};
