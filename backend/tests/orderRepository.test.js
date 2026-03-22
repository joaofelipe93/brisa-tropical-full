import { describe, test, expect, beforeAll } from '@jest/globals';
import { createTestDb } from './testDb.js';

function createOrderRepository(db) {
  return {
    findCustomerByPhone(phone) {
      return db.prepare('SELECT * FROM customers WHERE phone = ?').get(phone);
    },
    createCustomer(name, phone) {
      const result = db.prepare('INSERT INTO customers (name, phone) VALUES (?, ?)').run(name, phone);
      return { id: result.lastInsertRowid, name, phone };
    },
    updateCustomerName(id, name) {
      db.prepare('UPDATE customers SET name = ? WHERE id = ?').run(name, id);
    },
    createOrder({ customerId, neighborhoodId, address, addressComplement, paymentMethod, subtotal, deliveryFee, total, notes }) {
      const result = db.prepare(`
        INSERT INTO orders (customer_id, neighborhood_id, address, address_complement, payment_method, subtotal, delivery_fee, total, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(customerId, neighborhoodId, address, addressComplement || null, paymentMethod, subtotal, deliveryFee, total, notes || null);
      return result.lastInsertRowid;
    },
    createOrderItem({ orderId, productId, quantity, unitPrice, toppings, notes }) {
      db.prepare(`INSERT INTO order_items (order_id, product_id, quantity, unit_price, toppings, notes) VALUES (?, ?, ?, ?, ?, ?)`)
        .run(orderId, productId, quantity, unitPrice, toppings ? JSON.stringify(toppings) : null, notes || null);
    },
    findOrderById(id) {
      return db.prepare(`
        SELECT o.*, c.name as customer_name, c.phone as customer_phone,
               n.name as neighborhood_name, n.min_time, n.max_time
        FROM orders o
        JOIN customers c ON c.id = o.customer_id
        JOIN neighborhoods n ON n.id = o.neighborhood_id
        WHERE o.id = ?
      `).get(id);
    },
    findOrderItems(orderId) {
      return db.prepare(`
        SELECT oi.*, p.name as product_name FROM order_items oi
        JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?
      `).all(orderId);
    },
    findAllOrders({ status, date, page = 1 }) {
      const limit = 20, offset = (page - 1) * limit;
      let where = '1=1';
      const params = [];
      if (status) { where += ' AND o.status = ?';           params.push(status); }
      if (date)   { where += ' AND DATE(o.created_at) = ?'; params.push(date); }
      const orders = db.prepare(`
        SELECT o.*, c.name as customer_name, n.name as neighborhood_name
        FROM orders o JOIN customers c ON c.id = o.customer_id
        JOIN neighborhoods n ON n.id = o.neighborhood_id
        WHERE ${where} ORDER BY o.created_at DESC LIMIT ? OFFSET ?
      `).all(...params, limit, offset);
      const total = db.prepare(`SELECT COUNT(*) as c FROM orders o WHERE ${where}`).get(...params).c;
      return { orders, total, page: Number(page), pages: Math.ceil(total / limit) };
    },
    updateOrderStatus(id, status) {
      db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
    },
    findTodayStats() {
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Fortaleza' });
      return db.prepare(`
        SELECT COUNT(*) as total_orders, COALESCE(SUM(total),0) as total_revenue,
          COALESCE(SUM(CASE WHEN payment_method='pix'  THEN total ELSE 0 END),0) as pix_revenue,
          COALESCE(SUM(CASE WHEN payment_method='card' THEN total ELSE 0 END),0) as card_revenue,
          COUNT(CASE WHEN status='pending'    THEN 1 END) as pending_count,
          COUNT(CASE WHEN status='delivering' THEN 1 END) as delivering_count
        FROM orders WHERE DATE(created_at) = ?
      `).get(today);
    },
  };
}

describe('orderRepository', () => {
  let db, repo;

  beforeAll(() => {
    db   = createTestDb();
    repo = createOrderRepository(db);
  });

  describe('findCustomerByPhone', () => {
    test('deve retornar undefined para cliente inexistente', () => {
      expect(repo.findCustomerByPhone('84900000000')).toBeUndefined();
    });

    test('deve encontrar cliente após criação', () => {
      repo.createCustomer('João', '84911111111');
      expect(repo.findCustomerByPhone('84911111111').name).toBe('João');
    });
  });

  describe('createCustomer', () => {
    test('deve criar cliente e retornar com id', () => {
      const c = repo.createCustomer('Maria', '84922222222');
      expect(c.id).toBeTruthy();
      expect(c.name).toBe('Maria');
    });

    test('deve lançar erro para telefone duplicado', () => {
      repo.createCustomer('Ana', '84933333333');
      expect(() => repo.createCustomer('Ana 2', '84933333333')).toThrow();
    });
  });

  describe('updateCustomerName', () => {
    test('deve atualizar o nome do cliente', () => {
      const c = repo.createCustomer('Pedro', '84944444444');
      repo.updateCustomerName(c.id, 'Pedro Silva');
      expect(repo.findCustomerByPhone('84944444444').name).toBe('Pedro Silva');
    });
  });

  describe('createOrder', () => {
    test('deve criar pedido e retornar o id', () => {
      const c = repo.createCustomer('Cliente Teste', '84955555555');
      const id = repo.createOrder({ customerId: c.id, neighborhoodId: 1, address: 'Rua A', paymentMethod: 'pix', subtotal: 18, deliveryFee: 5, total: 23 });
      expect(id).toBeGreaterThan(0);
    });

    test('deve criar pedido com cartão', () => {
      const c = repo.createCustomer('Cliente Card', '84966666666');
      const id = repo.createOrder({ customerId: c.id, neighborhoodId: 1, address: 'Rua B', paymentMethod: 'card', subtotal: 12, deliveryFee: 5, total: 17 });
      expect(repo.findOrderById(id).payment_method).toBe('card');
    });
  });

  describe('findOrderById', () => {
    test('deve retornar pedido com dados do cliente e bairro', () => {
      const c = repo.createCustomer('Cliente Find', '84977777777');
      const id = repo.createOrder({ customerId: c.id, neighborhoodId: 1, address: 'Rua C', paymentMethod: 'pix', subtotal: 18, deliveryFee: 5, total: 23 });
      const order = repo.findOrderById(id);
      expect(order.customer_name).toBe('Cliente Find');
      expect(order.neighborhood_name).toBe('Lagoa Nova');
      expect(order.total).toBe(23);
    });

    test('deve retornar undefined para ID inexistente', () => {
      expect(repo.findOrderById(9999)).toBeUndefined();
    });
  });

  describe('createOrderItem / findOrderItems', () => {
    test('deve criar itens e retornar na listagem', () => {
      const c  = repo.createCustomer('Cliente Item', '84988888888');
      const id = repo.createOrder({ customerId: c.id, neighborhoodId: 1, address: 'Rua D', paymentMethod: 'pix', subtotal: 18, deliveryFee: 5, total: 23 });
      repo.createOrderItem({ orderId: id, productId: 1, quantity: 2, unitPrice: 12 });
      repo.createOrderItem({ orderId: id, productId: 2, quantity: 1, unitPrice: 15, toppings: ['Granola'] });
      const items = repo.findOrderItems(id);
      expect(items).toHaveLength(2);
      expect(items[0].product_name).toBe('Açaí 300ml');
    });
  });

  describe('findAllOrders', () => {
    test('deve retornar pedidos paginados', () => {
      const result = repo.findAllOrders({ page: 1 });
      expect(Array.isArray(result.orders)).toBe(true);
      expect(typeof result.total).toBe('number');
      expect(result.page).toBe(1);
    });

    test('deve filtrar por status', () => {
      const result = repo.findAllOrders({ status: 'pending' });
      result.orders.forEach(o => expect(o.status).toBe('pending'));
    });
  });

  describe('updateOrderStatus', () => {
    test('deve atualizar o status', () => {
      const c  = repo.createCustomer('Status Test', '84999999999');
      const id = repo.createOrder({ customerId: c.id, neighborhoodId: 1, address: 'Rua E', paymentMethod: 'pix', subtotal: 12, deliveryFee: 5, total: 17 });
      repo.updateOrderStatus(id, 'confirmed');
      expect(repo.findOrderById(id).status).toBe('confirmed');
    });
  });

  describe('findTodayStats', () => {
    test('deve retornar estatísticas do dia', () => {
      const stats = repo.findTodayStats();
      expect(typeof stats.total_orders).toBe('number');
      expect(typeof stats.total_revenue).toBe('number');
      expect(typeof stats.pending_count).toBe('number');
    });
  });
});
