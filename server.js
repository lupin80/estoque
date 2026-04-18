import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import db from './src/components/database.js';
import { v4 as uuidv4 } from 'uuid';

const app = express();

// Configuração do multer para上传图片
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mime = allowedTypes.test(file.mimetype);
    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas (JPEG, JPG, PNG, GIF, WebP)'));
    }
  }
});

// Servir arquivos estáticos da pasta uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

/**
 * Security headers including a base CSP. 
 * We explicitly allow picsum.photos for images used in the app.
 */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "https://picsum.photos"],
      "connect-src": ["'self'", "http://localhost:3000", "http://localhost:5173"],
    },
  },
}));

app.use(cors());
app.use(express.json());


const PORT = 3000;

// Rota raiz
app.get('/', (req, res) => {
  res.json({ 
    message: 'Inventory Management API',
    version: '1.0.0',
    status: 'running'
  });
});

// Adicione ANTES das outras rotas (depois do app.use)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: 'connected',
    endpoints: ['products', 'suppliers', 'destinations', 'movements', 'db-test']
  });
});

app.get('/api/db-test', (req, res) => {
  try {
    const row = db.prepare('SELECT 1 AS ok').get();
    res.json({ database: 'connected', ok: row.ok });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PRODUTOS ---
app.get('/api/products', (req, res) => {
  try {
    const stmt = db.prepare("SELECT *, strftime('%Y-%m-%dT%H:%M:%SZ', updatedAt) as updatedAt FROM products WHERE status != 'excluido' ORDER BY name ASC");
    const products = stmt.all();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/products/deleted', (req, res) => {
  try {
    const stmt = db.prepare("SELECT *, strftime('%Y-%m-%dT%H:%M:%SZ', updatedAt) as updatedAt FROM products WHERE status = 'excluido' ORDER BY updatedAt DESC");
    const products = stmt.all();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/products/:id', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM products WHERE id = ?');
    const product = stmt.get(req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Produto não encontrado' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para upload de imagem de produto
app.post('/api/products/upload-image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }
    res.json({
      message: 'Imagem上传ada com sucesso',
      filename: req.file.filename,
      url: `/uploads/${req.file.filename}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para deletar imagem
app.delete('/api/products/image/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), 'uploads', filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: 'Imagem删除ada com sucesso' });
    } else {
      res.status(404).json({ error: 'Imagem não encontrada' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', (req, res) => {
  const id = uuidv4();
  const { name, sku, category, price, stock, maxStock, location, ncm, icms, ipi, pis, invoiceNumber, supplierId, image } = req.body;
  
  try {
    const insert = db.prepare(`
      INSERT INTO products (id, name, sku, category, price, stock, maxStock, location, ncm, icms, ipi, pis, invoiceNumber, supplierId, image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insert.run(id, name, sku, category, price, stock, maxStock, location, ncm, icms, ipi, pis, invoiceNumber, supplierId || null, image || null);
    res.status(201).json({ id, ...req.body });
  } catch (err) {
    console.error('Erro ao inserir produto:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', (req, res) => {
  const { name, sku, category, price, stock, maxStock, location, ncm, icms, ipi, pis, invoiceNumber, supplierId, image, status } = req.body;
  try {
    const update = db.prepare(`
      UPDATE products 
      SET name = ?, sku = ?, category = ?, price = ?, stock = ?, maxStock = ?, 
          location = ?, ncm = ?, icms = ?, ipi = ?, pis = ?, invoiceNumber = ?, supplierId = ?, image = ?, status = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    update.run(name, sku, category, price, stock, maxStock, location, ncm, icms, ipi, pis, invoiceNumber, supplierId || null, image || null, status || 'ativo', req.params.id);
    res.json({ message: 'Produto atualizado' });
  } catch (err) {
    console.error('Erro ao atualizar produto:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ message: 'Produto removido permanentemente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- FORNECEDORES ---
app.get('/api/suppliers', (req, res) => {
  try {
    const suppliers = db.prepare('SELECT * FROM suppliers ORDER BY name ASC').all();
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/suppliers', (req, res) => {
  const id = uuidv4();
  const { name, code, cnpj, city, email, phone, address } = req.body;
  try {
    const insert = db.prepare(`
      INSERT INTO suppliers (id, name, code, cnpj, city, email, phone, address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insert.run(id, name, code, cnpj, city, email, phone, address);
    res.status(201).json({ id, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/suppliers/:id', (req, res) => {
  const { name, code, cnpj, city, email, phone, address } = req.body;
  try {
    const update = db.prepare(`
      UPDATE suppliers 
      SET name = ?, code = ?, cnpj = ?, city = ?, email = ?, phone = ?, address = ?
      WHERE id = ?
    `);
    update.run(name, code, cnpj, city, email, phone, address, req.params.id);
    res.json({ message: 'Fornecedor atualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/suppliers/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM suppliers WHERE id = ?').run(req.params.id);
    res.json({ message: 'Fornecedor removido' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- CATEGORIAS ---
app.get('/api/categories', (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories', (req, res) => {
  const id = uuidv4();
  const { name } = req.body;
  try {
    const insert = db.prepare('INSERT INTO categories (id, name) VALUES (?, ?)');
    insert.run(id, name);
    res.status(201).json({ id, name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/categories/:id', (req, res) => {
  const { name } = req.body;
  try {
    const update = db.prepare('UPDATE categories SET name = ? WHERE id = ?');
    update.run(name, req.params.id);
    res.json({ message: 'Categoria atualizada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/categories/:id', (req, res) => {
  try {
    // Opcional: Verificar se há produtos usando esta categoria antes de deletar
    const inUse = db.prepare('SELECT count(*) as count FROM products WHERE category = (SELECT name FROM categories WHERE id = ?)').get(req.params.id);
    if (inUse.count > 0) return res.status(400).json({ error: 'Categoria em uso por produtos ativos' });

    db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
    res.json({ message: 'Categoria removida' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- DESTINOS ---
app.get('/api/destinations', (req, res) => {
  try {
    const destinations = db.prepare('SELECT * FROM destinations ORDER BY name ASC').all();
    res.json(destinations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/destinations', (req, res) => {
  const { name } = req.body;
  try {
    const insert = db.prepare('INSERT INTO destinations (name) VALUES (?)');
    const info = insert.run(name);
    res.status(201).json({ id: info.lastInsertRowid, name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- USUÁRIOS E CONTROLE DE ACESSO ---
app.get('/api/users', (req, res) => {
  try {
    const users = db.prepare('SELECT id, name, email, role, createdAt FROM usuarios ORDER BY name ASC').all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', (req, res) => {
  const id = uuidv4();
  const { name, email, senha, role } = req.body;
  try {
    const insert = db.prepare('INSERT INTO usuarios (id, name, email, senha, role) VALUES (?, ?, ?, ?, ?)');
    insert.run(id, name, email, senha, role || 'usuario');
    res.status(201).json({ id, name, email, role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', (req, res) => {
  const { name, email, senha, role } = req.body;
  try {
    const update = db.prepare('UPDATE usuarios SET name = ?, email = ?, senha = ?, role = ? WHERE id = ?');
    update.run(name, email, senha, role, req.params.id);
    res.json({ message: 'Usuário atualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM usuarios WHERE id = ?').run(req.params.id);
    res.json({ message: 'Usuário removido' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/login', (req, res) => {
  const { username, senha } = req.body;
  try {
    const user = db.prepare('SELECT id, name, email, role FROM usuarios WHERE email = ? AND senha = ?').get(username, senha);
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ error: 'Usuário ou senha incorretos' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- MOVIMENTAÇÕES (Com Transação) ---
app.post('/api/movements', (req, res) => {
  const { 
    type, 
    productId, 
    targetProductId, 
    quantity, 
    origin, 
    destination, 
    note 
  } = req.body;

  const qty = Number(quantity);
  const now = new Date();
  
  // Força o fuso horário de Brasília para as strings de auditoria
  const date = now.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' }); // sv-SE retorna YYYY-MM-DD
  const time = now.toLocaleTimeString('pt-BR', { 
    timeZone: 'America/Sao_Paulo', 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });

  const transaction = db.transaction(() => {
    const product = db.prepare('SELECT stock FROM products WHERE id = ?').get(productId);
    if (!product) throw new Error('Produto não encontrado');

    let newStock = product.stock;
    if (type === 'entry') newStock += qty;
    else if (type === 'exit' || type === 'product_transfer') {
      if (product.stock < qty) throw new Error('Estoque insuficiente');
      newStock -= qty;
    }

    db.prepare('UPDATE products SET stock = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?')
      .run(newStock, productId);

    if (type === 'product_transfer') {
      if (!targetProductId) throw new Error('Produto de destino é obrigatório para transferências');
      
      const target = db.prepare('SELECT stock FROM products WHERE id = ?').get(targetProductId);
      if (!target) throw new Error('Produto de destino não encontrado');
      
      db.prepare('UPDATE products SET stock = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?')
        .run(target.stock + qty, targetProductId);
    }

    const insertMove = db.prepare(`
      INSERT INTO movements (type, productId, targetProductId, quantity, origin, destination, date, time, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Tratamento de valores nulos para chaves estrangeiras e opcionais
    insertMove.run(
      type, 
      productId, 
      (type === 'product_transfer' && targetProductId) ? targetProductId : null, 
      qty, 
      origin, 
      destination, 
      date, 
      time, 
      note || null
    );
  });

  try {
    transaction();
    res.status(200).json({ message: 'Movimentação realizada com sucesso' });
  } catch (err) {
    console.error('Falha na movimentação:', err.message);
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/movements', (req, res) => {
  try {
    // Converte o timestamp do SQLite (UTC) para o formato ISO 8601 que o JavaScript entende como UTC
    const movements = db.prepare(`
      SELECT *, strftime('%Y-%m-%dT%H:%M:%SZ', createdAt) as createdAt FROM movements ORDER BY createdAt DESC
    `).all();
    res.json(movements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const server = app.listen(PORT, () => {
  console.log(`Backend do Vault rodando em http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Erro: porta ${PORT} já está em uso. Pare o processo que está usando a porta ou altere a variável PORT.`);
  } else {
    console.error('Erro ao iniciar o servidor:', err);
  }
  process.exit(1);
});