import { describe, test, expect, beforeAll } from '@jest/globals';
import { createTestDb } from './testDb.js';

function createProductRepository(db) {
  return {
    findAllCategories() {
      return db.prepare(`
        SELECT c.*, COUNT(p.id) as product_count FROM categories c
        LEFT JOIN products p ON p.category_id = c.id AND p.available = 1
        WHERE c.active = 1 GROUP BY c.id ORDER BY c.sort_order
      `).all();
    },
    findAllProducts(slug) {
      let query = `SELECT p.*, c.name as category_name, c.slug as category_slug
        FROM products p JOIN categories c ON c.id = p.category_id WHERE p.available = 1`;
      const params = [];
      if (slug) { query += ' AND c.slug = ?'; params.push(slug); }
      return db.prepare(query + ' ORDER BY p.sort_order').all(...params);
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
      const steps = db.prepare('SELECT * FROM customization_steps WHERE active = 1 ORDER BY sort_order').all();
      return steps.map(step => ({
        ...step,
        options: db.prepare('SELECT * FROM step_options WHERE step_id = ? AND active = 1 ORDER BY sort_order').all(step.id),
      }));
    },
  };
}

describe('productRepository', () => {
  let db, repo;

  beforeAll(() => {
    db   = createTestDb();
    repo = createProductRepository(db);
  });

  describe('findAllCategories', () => {
    test('deve retornar todas as categorias ativas', () => {
      expect(repo.findAllCategories()).toHaveLength(2);
    });

    test('deve retornar ordenado por sort_order', () => {
      const cats = repo.findAllCategories();
      expect(cats[0].slug).toBe('acai');
      expect(cats[1].slug).toBe('combos');
    });

    test('cada categoria deve ter product_count', () => {
      const cats = repo.findAllCategories();
      cats.forEach(c => expect(typeof c.product_count).toBe('number'));
    });

    test('não deve retornar categorias inativas', () => {
      db.prepare('INSERT INTO categories (name, slug, icon, active) VALUES (?, ?, ?, ?)').run('Inativa', 'inativa', '❌', 0);
      const cats = repo.findAllCategories();
      expect(cats.find(c => c.slug === 'inativa')).toBeUndefined();
    });
  });

  describe('findAllProducts', () => {
    test('deve retornar todos os produtos disponíveis', () => {
      expect(repo.findAllProducts().length).toBeGreaterThan(0);
    });

    test('deve filtrar por categoria', () => {
      const products = repo.findAllProducts('acai');
      expect(products).toHaveLength(2);
      products.forEach(p => expect(p.category_slug).toBe('acai'));
    });

    test('deve retornar array vazio para categoria inexistente', () => {
      expect(repo.findAllProducts('inexistente')).toHaveLength(0);
    });

    test('não deve retornar produtos indisponíveis', () => {
      db.prepare('UPDATE products SET available = 0 WHERE name = ?').run('Açaí 300ml');
      expect(repo.findAllProducts().find(p => p.name === 'Açaí 300ml')).toBeUndefined();
      db.prepare('UPDATE products SET available = 1 WHERE name = ?').run('Açaí 300ml');
    });
  });

  describe('findProductById', () => {
    test('deve retornar o produto correto', () => {
      const p = repo.findProductById(1);
      expect(p.name).toBe('Açaí 300ml');
      expect(p.price).toBe(12.00);
    });

    test('deve retornar undefined para ID inexistente', () => {
      expect(repo.findProductById(9999)).toBeUndefined();
    });

    test('deve retornar promo_price quando disponível', () => {
      expect(repo.findProductById(2).promo_price).toBe(15.00);
    });
  });

  describe('findAllToppings', () => {
    test('deve retornar todos os toppings', () => {
      expect(repo.findAllToppings()).toHaveLength(2);
    });

    test('deve retornar ordenado por nome', () => {
      const toppings = repo.findAllToppings();
      expect(toppings[0].name).toBe('Granola');
      expect(toppings[1].name).toBe('Nutella');
    });
  });

  describe('findAllNeighborhoods', () => {
    test('deve retornar bairros ativos', () => {
      expect(repo.findAllNeighborhoods()).toHaveLength(2);
    });

    test('deve ter delivery_fee, min_time e max_time', () => {
      const n = repo.findAllNeighborhoods()[0];
      expect(n.delivery_fee).toBeGreaterThanOrEqual(0);
      expect(n.min_time).toBeGreaterThan(0);
      expect(n.max_time).toBeGreaterThan(0);
    });
  });

  describe('findNeighborhoodById', () => {
    test('deve retornar o bairro correto', () => {
      const n = repo.findNeighborhoodById(1);
      expect(n.name).toBe('Lagoa Nova');
      expect(n.delivery_fee).toBe(5.00);
    });

    test('deve retornar undefined para ID inexistente', () => {
      expect(repo.findNeighborhoodById(9999)).toBeUndefined();
    });
  });

  describe('findAllSettings', () => {
    test('deve conter pix_key e pix_name', () => {
      const settings = Object.fromEntries(repo.findAllSettings().map(s => [s.key, s.value]));
      expect(settings.pix_key).toBeTruthy();
      expect(settings.pix_name).toBeTruthy();
    });
  });

  describe('findAllCustomizationSteps', () => {
    test('deve retornar passos com opções', () => {
      const steps = repo.findAllCustomizationSteps();
      expect(steps).toHaveLength(1);
      expect(Array.isArray(steps[0].options)).toBe(true);
    });

    test('cada passo deve ter título, emoji e opções', () => {
      const step = repo.findAllCustomizationSteps()[0];
      expect(step.title).toBeTruthy();
      expect(step.emoji).toBeTruthy();
      expect(step.options.length).toBeGreaterThan(0);
    });
  });
});
