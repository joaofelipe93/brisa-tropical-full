// src/routes/admin.js
import { Router } from 'express';
import { adminController } from '../controllers/adminController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Todas as rotas admin são protegidas
router.use(authMiddleware);

// ── Produtos ───────────────────────────────────────────────
router.get('/products',              adminController.listProducts);
router.get('/products/:id',          adminController.getProduct);
router.post('/products',             adminController.createProduct);
router.put('/products/:id',          adminController.updateProduct);
router.patch('/products/:id/toggle', adminController.toggleAvailability);
router.delete('/products/:id',       adminController.deleteProduct);

// ── Categorias ─────────────────────────────────────────────
router.get('/categories',            adminController.listCategories);
router.post('/categories',           adminController.createCategory);
router.put('/categories/:id',        adminController.updateCategory);
router.delete('/categories/:id',     adminController.deleteCategory);

export default router;
