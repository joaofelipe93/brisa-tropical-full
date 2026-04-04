import db from "../db/database.js";
import { orderRepository } from "../repositories/orderRepository.js";
import { productRepository } from "../repositories/productRepository.js";
import { getWhatsAppLinks } from "../services/whatsapp.js";

export const orderController = {
  async createOrder(req, res) {
    const {
      customer,
      items,
      neighborhood_id,
      address,
      address_complement,
      payment_method,
      notes,
    } = req.body;

    // Validações
    if (!customer?.name || !customer?.phone)
      return res.status(400).json({ error: "Dados do cliente inválidos" });
    if (!items?.length)
      return res.status(400).json({ error: "Carrinho vazio" });
    if (!neighborhood_id || !address)
      return res.status(400).json({ error: "Endereço obrigatório" });
    if (!["pix", "card"].includes(payment_method))
      return res.status(400).json({ error: "Pagamento inválido" });

    const createOrderTransaction = db.transaction(() => {
      // Upsert cliente
      let cust = orderRepository.findCustomerByPhone(customer.phone);
      if (!cust) {
        cust = orderRepository.createCustomer(customer.name, customer.phone);
      } else {
        orderRepository.updateCustomerName(cust.id, customer.name);
      }

      // Buscar bairro
      const neighborhood =
        productRepository.findNeighborhoodById(neighborhood_id);
      if (!neighborhood) throw new Error("Bairro inválido");

      // Calcular subtotal
      let subtotal = 0;
      const enrichedItems = items.map((item) => {
        const product = productRepository.findProductById(item.product_id);
        if (!product)
          throw new Error(`Produto ${item.product_id} não encontrado`);

        let price = product.promo_price || product.price;

        // Adicionar preço dos toppings ao unit_price
        let toppingsTotalPrice = 0;
        if (item.toppings?.length > 0) {
          item.toppings.forEach((topping) => {
            if (typeof topping === "object" && topping.price) {
              toppingsTotalPrice += topping.price;
            }
          });
        }

        const unitPrice = price + toppingsTotalPrice;
        subtotal += unitPrice * item.quantity;
        return { ...item, product, unit_price: unitPrice };
      });

      const total = subtotal + neighborhood.delivery_fee;

      // Criar pedido
      const orderId = orderRepository.createOrder({
        customerId: cust.id,
        neighborhoodId: neighborhood_id,
        address,
        addressComplement: address_complement,
        paymentMethod: payment_method,
        subtotal,
        deliveryFee: neighborhood.delivery_fee,
        total,
        notes,
      });

      // Inserir itens
      enrichedItems.forEach((item) => {
        orderRepository.createOrderItem({
          orderId,
          productId: item.product_id,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          toppings: item.toppings,
          notes: item.notes,
        });
      });

      return {
        orderId,
        cust,
        neighborhood,
        enrichedItems,
        subtotal,
        total,
        deliveryFee: neighborhood.delivery_fee,
      };
    });

    try {
      const { orderId, cust, neighborhood, enrichedItems, total, deliveryFee } =
        createOrderTransaction();

      const order = orderRepository.findOrderById(orderId);
      const settings = Object.fromEntries(
        orderRepository.findAllSettings().map((s) => [s.key, s.value]),
      );

      const itemsForWA = enrichedItems.map((item) => ({
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        toppings: item.toppings
          ?.map((t) => (typeof t === "object" ? t.name : t))
          .join(", "),
        notes: item.notes,
      }));

      const waLinks = getWhatsAppLinks({
        order,
        customer: cust,
        items: itemsForWA,
        neighborhood,
        settings,
      });

      res.status(201).json({
        success: true,
        order_id: orderId,
        order_number: String(orderId).padStart(4, "0"),
        total,
        delivery_fee: deliveryFee,
        payment_method,
        pix_key: payment_method === "pix" ? settings.pix_key : null,
        pix_name: payment_method === "pix" ? settings.pix_name : null,
        estimated_time: `${neighborhood.min_time}–${neighborhood.max_time} min`,
        whatsapp_owner_link: waLinks.ownerLink,
        whatsapp_customer_link: waLinks.customerLink,
      });
    } catch (err) {
      console.error("Erro ao criar pedido:", err);
      res.status(500).json({ error: err.message || "Erro interno" });
    }
  },

  listOrders(req, res) {
    const result = orderRepository.findAllOrders(req.query);
    res.json(result);
  },

  getOrder(req, res) {
    const order = orderRepository.findOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: "Pedido não encontrado" });

    const items = orderRepository.findOrderItems(order.id);
    res.json({ ...order, items });
  },

  updateStatus(req, res) {
    const { status } = req.body;
    const validStatuses = [
      "pending",
      "confirmed",
      "preparing",
      "delivering",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(status))
      return res.status(400).json({ error: "Status inválido" });

    orderRepository.updateOrderStatus(req.params.id, status);
    res.json({ success: true, status });
  },

  getTodayStats(req, res) {
    const stats = orderRepository.findTodayStats();
    res.json(stats);
  },
};
