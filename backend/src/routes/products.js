import { Router } from 'express';
import { productController } from '../controllers/productController.js';

const router = Router();

router.get('/categories',           productController.getCategories);
router.get('/products',             productController.getProducts);
router.get('/toppings',             productController.getToppings);
router.get('/neighborhoods',        productController.getNeighborhoods);
router.get('/store',                productController.getStore);
router.get('/customization-steps',  productController.getCustomizationSteps);

export default router;
