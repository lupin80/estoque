import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(path.join(__dirname, 'vault.db'));

// Habilitar chaves estrangeiras
db.pragma('foreign_keys = ON');

// Verificar e corrigir estrutura da tabela usuarios (se existir com estrutura antiga)
try {
  const tableInfo = db.prepare("PRAGMA table_info(usuarios)").all();
  const columns = tableInfo.map(col => col.name);
  if (columns.includes('password') && !columns.includes('senha')) {
    console.log('Recriando tabela usuarios com nova estrutura...');
    db.exec('DROP TABLE IF EXISTS usuarios');
  }
} catch (e) {
  // Tabela não existe, será criada
}

// Inicialização do Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    cnpj TEXT,
    city TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS usuarios (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'operador', 'usuario')) DEFAULT 'usuario',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    category TEXT,
    price REAL DEFAULT 0,
    stock INTEGER DEFAULT 0,
    maxStock INTEGER DEFAULT 1000,
    location TEXT,
    ncm TEXT,
    icms REAL DEFAULT 0,
    ipi REAL DEFAULT 0,
    pis REAL DEFAULT 0,
    invoiceNumber TEXT,
    supplierId TEXT,
    image TEXT,
    status TEXT DEFAULT 'ativo',
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplierId) REFERENCES suppliers(id)
  );

  CREATE TABLE IF NOT EXISTS movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT CHECK(type IN ('entry', 'exit', 'transfer', 'product_transfer', 'initial')),
    productId TEXT NOT NULL,
    targetProductId TEXT,
    quantity INTEGER NOT NULL,
    origin TEXT,
    destination TEXT,
    date TEXT,
    time TEXT,
    note TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (productId) REFERENCES products(id),
    FOREIGN KEY (targetProductId) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS destinations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed de destinos iniciais caso a tabela esteja vazia
const checkDest = db.prepare('SELECT count(*) as count FROM destinations').get();
if (checkDest.count === 0) {
  const insertDest = db.prepare('INSERT INTO destinations (name) VALUES (?)');
  const defaults = ['Ribeira', 'Expedição', 'Acabamento', 'Acondiconamento'];
  defaults.forEach(name => insertDest.run(name));
  console.log('Destinos padrão inicializados no SQLite.');
}

// Seed de categorias iniciais
const checkCats = db.prepare('SELECT count(*) as count FROM categories').get();
if (checkCats.count === 0) {
  const insertCat = db.prepare('INSERT INTO categories (id, name) VALUES (?, ?)');
  const defaults = ['Componentes', 'Redes', 'Módulos IA', 'Eletrônicos'];
  defaults.forEach(name => insertCat.run(uuidv4(), name));
  console.log('Categorias padrão inicializadas no SQLite.');
}

// Seed de usuário administrador inicial
const checkUsers = db.prepare('SELECT count(*) as count FROM usuarios').get();
if (checkUsers.count === 0) {
  const insertUser = db.prepare('INSERT INTO usuarios (id, name, email, senha, role) VALUES (?, ?, ?, ?, ?)');
  insertUser.run(uuidv4(), 'Administrador do Sistema', 'admin@vault.com', 'admin123', 'admin');
  console.log('Usuário admin inicial criado no SQLite. Login: admin@vault.com / Senha: admin123');
}

export default db;