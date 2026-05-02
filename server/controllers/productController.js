const pool = require('../config/db');
const { record } = require('../middleware/auditLogger');

async function listProducts(req, res) {
  const { rows } = await pool.query(
    `SELECT p.id, p.title, p.description, p.price, p.stock,
            u.email AS seller_email, p.created_at
     FROM products p JOIN users u ON u.id = p.seller_id
     WHERE p.is_active = TRUE
     ORDER BY p.created_at DESC`
  );
  res.json({ products: rows });
}

async function getProduct(req, res) {
  const { rows } = await pool.query(
    `SELECT p.*, u.email AS seller_email FROM products p JOIN users u ON u.id = p.seller_id WHERE p.id = $1`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Product not found' });
  res.json({ product: rows[0] });
}

async function createProduct(req, res) {
  const { title, description, price, stock } = req.body;
  if (!title || !price) return res.status(400).json({ error: 'title and price required' });

  const { rows } = await pool.query(
    `INSERT INTO products (seller_id, title, description, price, stock)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [req.user.id, title, description || '', price, stock || 0]
  );
  record({ userId: req.user.id, action: 'PRODUCT_CREATED', targetId: rows[0].id, targetType: 'product', ip: req.ip });
  res.status(201).json({ product: rows[0] });
}

async function updateProduct(req, res) {
  const { title, description, price, stock, is_active } = req.body;
  const { rows } = await pool.query(
    `UPDATE products SET
       title = COALESCE($1, title),
       description = COALESCE($2, description),
       price = COALESCE($3, price),
       stock = COALESCE($4, stock),
       is_active = COALESCE($5, is_active)
     WHERE id = $6 AND seller_id = $7 RETURNING *`,
    [title, description, price, stock, is_active, req.params.id, req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Product not found or not yours' });
  res.json({ product: rows[0] });
}

module.exports = { listProducts, getProduct, createProduct, updateProduct };
