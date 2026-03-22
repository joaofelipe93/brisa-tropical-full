import { productRepository } from '../repositories/productRepository.js';

export const productController = {

  getCategories(req, res) {
    const categories = productRepository.findAllCategories();
    res.json(categories);
  },

  getProducts(req, res) {
    const { category } = req.query;
    const products = productRepository.findAllProducts(category);
    res.json(products);
  },

  getToppings(req, res) {
    const toppings = productRepository.findAllToppings();
    res.json(toppings);
  },

  getNeighborhoods(req, res) {
    const neighborhoods = productRepository.findAllNeighborhoods();
    res.json(neighborhoods);
  },

  getStore(req, res) {
    const settings = productRepository.findAllSettings();
    const hours    = productRepository.findAllBusinessHours();
    const settingsObj = Object.fromEntries(settings.map(s => [s.key, s.value]));

    // Verificar se está aberto agora
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Fortaleza' }));
    const dayOfWeek   = now.getDay();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const todayHours  = hours.find(h => h.day_of_week === dayOfWeek);

    let isOpenNow = false;
    if (todayHours?.is_open && settingsObj.is_open === 'true') {
      isOpenNow = currentTime >= todayHours.open_time && currentTime <= todayHours.close_time;
    }

    res.json({ settings: settingsObj, hours, isOpenNow });
  },

  getCustomizationSteps(req, res) {
    const steps = productRepository.findAllCustomizationSteps();
    res.json(steps);
  },
};
