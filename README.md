# 🍇 Brisa Tropical Açaí — Sistema de Delivery

Sistema completo de delivery de açaí com cardápio online, pagamento via PIX/Cartão, integração com WhatsApp e painel administrativo.

## 🚀 Tecnologias

| Camada | Tech |
|--------|------|
| Frontend | React 18 + Vite |
| Backend | Express.js + Node.js |
| Banco de Dados | SQLite (better-sqlite3) |
| WhatsApp | whatsapp-web.js |
| Estilo | CSS puro com variáveis |

## 📁 Estrutura do Projeto

```
brisa-tropical/
├── frontend/          # React App (porta 5173)
│   └── src/
│       ├── pages/     # Home, Checkout, Confirmação, Admin
│       ├── components/# Header, Cart, ProductCard
│       ├── context/   # CartContext
│       └── services/  # API calls
├── backend/           # Express API (porta 3001)
│   └── src/
│       ├── routes/    # products.js, orders.js
│       ├── db/        # database.js (SQLite)
│       └── services/  # whatsapp.js
└── README.md
```

## ⚙️ Instalação

### 1. Instalar dependências

```bash
# Na raiz do projeto
npm install

# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp backend/.env.example backend/.env
```

Edite o arquivo `backend/.env`:

```env
PORT=3001
PIX_KEY=sua-chave-pix@email.com
PIX_NAME=Brisa Tropical Açaí
WHATSAPP_NUMBER=5584999999999
```

### 3. Rodar o projeto

```bash
# Ambos ao mesmo tempo (da raiz)
npm run dev

# Ou separado:
npm run dev:backend   # porta 3001
npm run dev:frontend  # porta 5173
```

## 📱 Conectar WhatsApp

1. Inicie o backend: `npm run dev:backend`
2. Acesse o painel admin: `http://localhost:5173/admin`
3. Um QR Code aparecerá na tela
4. Abra seu **WhatsApp Business** → Dispositivos conectados → Conectar dispositivo
5. Escaneie o QR Code
6. Pronto! O WhatsApp está conectado ✅

## 🌐 Páginas

| Página | URL |
|--------|-----|
| Cardápio (clientes) | `http://localhost:5173/` |
| Painel Admin | `http://localhost:5173/admin` |
| API | `http://localhost:3001/api` |

## 🍇 Funcionalidades

### Cardápio (Cliente)
- [x] Categorias: Açaí, Combos, Complementos
- [x] Carrinho de compras
- [x] Seleção de complementos/toppings
- [x] Cadastro por celular
- [x] Seleção de bairro com frete automático
- [x] Pagamento: PIX ou Cartão na entrega
- [x] Horários de funcionamento
- [x] Preços e promoções

### Após o Pedido
- [x] WhatsApp do dono recebe notificação completa
- [x] Cliente recebe chave PIX + instruções (se PIX)
- [x] Página de confirmação com resumo

### Painel Admin
- [x] Dashboard com stats do dia
- [x] Lista de pedidos em tempo real
- [x] Atualização de status (Pendente → Confirmado → Preparando → A caminho → Entregue)
- [x] Status do WhatsApp
- [x] QR Code para conectar WhatsApp

## 🗄️ Banco de Dados

O SQLite é criado automaticamente na primeira execução em `backend/data/brisa-tropical.db`.

### Tabelas
- `customers` — clientes (nome + celular)
- `categories` — categorias do cardápio
- `products` — produtos com preço/promo
- `toppings` — complementos disponíveis
- `neighborhoods` — bairros de Natal/RN com frete
- `orders` — pedidos
- `order_items` — itens de cada pedido
- `business_hours` — horários por dia da semana
- `store_settings` — configurações (PIX, WhatsApp, etc.)

## 📦 Deploy

### Backend (Railway ou Render)
```bash
# Variáveis de ambiente necessárias no servidor:
PORT=3001
PIX_KEY=...
PIX_NAME=...
WHATSAPP_NUMBER=...
```

### Frontend (Vercel ou Netlify)
```bash
cd frontend
npm run build
# Fazer deploy da pasta dist/
```

---

Feito com 💜 para Natal/RN 🌴
