import { Router } from 'express';
import { orderController } from '../controllers/orderController.js';

const router = Router();

router.post('/',             orderController.createOrder);
router.get('/',              orderController.listOrders);
router.get('/stats/today',   orderController.getTodayStats);
router.get('/:id',           orderController.getOrder);
router.patch('/:id/status',  orderController.updateStatus);

export default router;
