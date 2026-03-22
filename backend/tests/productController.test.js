import { describe, test, expect, beforeAll } from '@jest/globals';
import { createTestDb } from './testDb.js';

function mockRes() {
  const res = { statusCode: 200, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json   = (data)  => { res.body = data;       return res; };
  return res;
}

function mockReq(query = {}, params = {}, body = {}) {
  return { query, params, body };
}

function createProductController(db) {
  return {
    getCategories(req, res) {
      res.json(db.prepare(`
        SELECT c.*, COUNT(p.id) as product_count FROM categories c
        LEFT JOIN products p ON p.category_id = c.id AND p.available = 1
        WHERE c.active = 1 GROUP BY c.id ORDER BY c.sort_order
      `).all());
    },
    getProducts(req, res) {
      let query = `SELECT p.*, c.name as category_name, c.slug as category_slug
        FROM products p JOIN categories c ON c.id = p.category_id WHERE p.available = 1`;
      const params = [];
      if (req.query.category) { query += ' AND c.slug = ?'; params.push(req.query.category); }
      res.json(db.prepare(query + ' ORDER BY p.sort_order').all(...params));
    },
    getToppings(req, res) {
      res.json(db.prepare('SELECT * FROM toppings WHERE available = 1 ORDER BY name').all());
    },
    getNeighborhoods(req, res) {
      res.json(db.prepare('SELECT * FROM neighborhoods WHERE active = 1 ORDER BY zone, name').all());
    },
    getStore(req, res) {
      const settings    = db.prepare('SELECT key, value FROM store_settings').all();
      const hours       = db.prepare('SELECT * FROM business_hours ORDER BY day_of_week').all();
      const settingsObj = Object.fromEntries(settings.map(s => [s.key, s.value]));
      const now         = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Fortaleza' }));
      const currentTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      const todayHours  = hours.find(h => h.day_of_week === now.getDay());
      let isOpenNow     = false;
      if (todayHours?.is_open && settingsObj.is_open === 'true') {
        isOpenNow = currentTime >= todayHours.open_time && currentTime <= todayHours.close_time;
      }
      res.json({ settings: settingsObj, hours, isOpenNow });
    },
    getCustomizationSteps(req, res) {
      const steps = db.prepare('SELECT * FROM customization_steps WHERE active = 1 ORDER BY sort_order').all();
      res.json(steps.map(step => ({
        ...step,
        options: db.prepare('SELECT * FROM step_options WHERE step_id = ? AND active = 1 ORDER BY sort_order').all(step.id),
      })));
    },
  };
}

describe('productController', () => {
  let db, controller;

  beforeAll(() => {
    db         = createTestDb();
    controller = createProductController(db);
  });

  describe('getCategories', () => {
    test('deve retornar array de categorias', () => {
      const res = mockRes();
      controller.getCategories(mockReq(), res);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    test('cada categoria deve ter slug e name', () => {
      const res = mockRes();
      controller.getCategories(mockReq(), res);
      res.body.forEach(c => {
        expect(c.slug).toBeTruthy();
        expect(c.name).toBeTruthy();
      });
    });
  });

  describe('getProducts', () => {
    test('deve retornar todos os produtos sem filtro', () => {
      const res = mockRes();
      controller.getProducts(mockReq(), res);
      expect(res.body.length).toBeGreaterThan(0);
    });

    test('deve filtrar por categoria', () => {
      const res = mockRes();
      controller.getProducts(mockReq({ category: 'acai' }), res);
      res.body.forEach(p => expect(p.category_slug).toBe('acai'));
    });

    test('deve retornar array vazio para categoria inexistente', () => {
      const res = mockRes();
      controller.getProducts(mockReq({ category: 'inexistente' }), res);
      expect(res.body).toHaveLength(0);
    });
  });

  describe('getToppings', () => {
    test('deve retornar lista de toppings com name e price', () => {
      const res = mockRes();
      controller.getToppings(mockReq(), res);
      expect(res.body.length).toBeGreaterThan(0);
      res.body.forEach(t => {
        expect(t.name).toBeTruthy();
        expect(typeof t.price).toBe('number');
      });
    });
  });

  describe('getNeighborhoods', () => {
    test('deve retornar bairros com delivery_fee', () => {
      const res = mockRes();
      controller.getNeighborhoods(mockReq(), res);
      expect(res.body.length).toBeGreaterThan(0);
      res.body.forEach(n => expect(typeof n.delivery_fee).toBe('number'));
    });
  });

  describe('getStore', () => {
    test('deve retornar settings, hours e isOpenNow', () => {
      const res = mockRes();
      controller.getStore(mockReq(), res);
      expect(res.body.settings).toBeTruthy();
      expect(Array.isArray(res.body.hours)).toBe(true);
      expect(typeof res.body.isOpenNow).toBe('boolean');
    });

    test('settings deve ter pix_key e pix_name', () => {
      const res = mockRes();
      controller.getStore(mockReq(), res);
      expect(res.body.settings.pix_key).toBeTruthy();
      expect(res.body.settings.pix_name).toBeTruthy();
    });
  });

  describe('getCustomizationSteps', () => {
    test('deve retornar passos com opções', () => {
      const res = mockRes();
      controller.getCustomizationSteps(mockReq(), res);
      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach(step => {
        expect(step.title).toBeTruthy();
        expect(Array.isArray(step.options)).toBe(true);
      });
    });
  });
});
