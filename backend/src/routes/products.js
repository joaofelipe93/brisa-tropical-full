import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET /api/categories
router.get('/categories', (req, res) => {
  const categories = db.prepare(`
    SELECT c.*, COUNT(p.id) as product_count
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id AND p.available = 1
    WHERE c.active = 1
    GROUP BY c.id
    ORDER BY c.sort_order
  `).all();
  res.json(categories);
});

// GET /api/products
router.get('/products', (req, res) => {
  const { category } = req.query;
  let query = `
    SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM products p
    JOIN categories c ON c.id = p.category_id
    WHERE p.available = 1
  `;
  const params = [];
  if (category) {
    query += ' AND c.slug = ?';
    params.push(category);
  }
  query += ' ORDER BY p.sort_order';
  const products = db.prepare(query).all(...params);
  res.json(products);
});

// GET /api/toppings
router.get('/toppings', (req, res) => {
  const toppings = db.prepare('SELECT * FROM toppings WHERE available = 1 ORDER BY name').all();
  res.json(toppings);
});

// GET /api/neighborhoods
router.get('/neighborhoods', (req, res) => {
  const neighborhoods = db.prepare(`
    SELECT * FROM neighborhoods WHERE active = 1 ORDER BY zone, name
  `).all();
  res.json(neighborhoods);
});

// GET /api/store
router.get('/store', (req, res) => {
  const settings = db.prepare('SELECT key, value FROM store_settings').all();
  const hours = db.prepare('SELECT * FROM business_hours ORDER BY day_of_week').all();
  const settingsObj = Object.fromEntries(settings.map(s => [s.key, s.value]));

  // Verificar se está aberto agora
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Fortaleza' }));
  const dayOfWeek = now.getDay();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const todayHours = hours.find(h => h.day_of_week === dayOfWeek);

  let isOpenNow = false;
  if (todayHours?.is_open && settingsObj.is_open === 'true') {
    isOpenNow = currentTime >= todayHours.open_time && currentTime <= todayHours.close_time;
  }

  res.json({ settings: settingsObj, hours, isOpenNow });
});

export default router;
