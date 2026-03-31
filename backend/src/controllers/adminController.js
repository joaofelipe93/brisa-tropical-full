// src/controllers/adminController.js
import { adminRepository } from '../repositories/adminRepository.js';

export const adminController = {

  // ── Produtos ───────────────────────────────────────────────

  listProducts(req, res) {
    const products = adminRepository.findAllProductsAdmin();
    res.json(products);
  },

  getProduct(req, res) {
    const product = adminRepository.findProductByIdAdmin(req.params.id);
    if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json(product);
  },

  createProduct(req, res) {
    const { category_id, name, description, price, promo_price, sort_order } = req.body;
    if (!category_id || !name || !price)
      return res.status(400).json({ error: 'category_id, name e price são obrigatórios' });

    const id = adminRepository.createProduct({
      categoryId:  category_id,
      name,
      description,
      price:       Number(price),
      promoPrice:  promo_price ? Number(promo_price) : null,
      sortOrder:   sort_order || 0,
    });
    res.status(201).json({ success: true, id });
  },

  updateProduct(req, res) {
    const { category_id, name, description, price, promo_price, available, sort_order } = req.body;
    if (!category_id || !name || price === undefined)
      return res.status(400).json({ error: 'category_id, name e price são obrigatórios' });

    const product = adminRepository.findProductByIdAdmin(req.params.id);
    if (!product) return res.status(404).json({ error: 'Produto não encontrado' });

    adminRepository.updateProduct(req.params.id, {
      categoryId:  category_id,
      name,
      description,
      price:       Number(price),
      promoPrice:  promo_price ? Number(promo_price) : null,
      available:   available !== undefined ? available : product.available,
      sortOrder:   sort_order || 0,
    });
    res.json({ success: true });
  },

  toggleAvailability(req, res) {
    const product = adminRepository.findProductByIdAdmin(req.params.id);
    if (!product) return res.status(404).json({ error: 'Produto não encontrado' });

    const newAvailable = product.available === 1 ? 0 : 1;
    adminRepository.toggleProductAvailability(req.params.id, newAvailable);
    res.json({ success: true, available: newAvailable });
  },

  deleteProduct(req, res) {
    const product = adminRepository.findProductByIdAdmin(req.params.id);
    if (!product) return res.status(404).json({ error: 'Produto não encontrado' });

    adminRepository.deleteProduct(req.params.id);
    res.json({ success: true });
  },

  // ── Categorias ─────────────────────────────────────────────

  listCategories(req, res) {
    const categories = adminRepository.findAllCategoriesAdmin();
    res.json(categories);
  },

  createCategory(req, res) {
    const { name, slug, icon, sort_order } = req.body;
    if (!name || !slug)
      return res.status(400).json({ error: 'name e slug são obrigatórios' });

    try {
      const id = adminRepository.createCategory({ name, slug, icon, sortOrder: sort_order });
      res.status(201).json({ success: true, id });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  updateCategory(req, res) {
    const { name, slug, icon, sort_order, active } = req.body;
    if (!name || !slug)
      return res.status(400).json({ error: 'name e slug são obrigatórios' });

    const category = adminRepository.findCategoryById(req.params.id);
    if (!category) return res.status(404).json({ error: 'Categoria não encontrada' });

    adminRepository.updateCategory(req.params.id, {
      name, slug, icon,
      sortOrder: sort_order || 0,
      active:    active !== undefined ? active : category.active,
    });
    res.json({ success: true });
  },

  deleteCategory(req, res) {
    try {
      adminRepository.deleteCategory(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },
};
