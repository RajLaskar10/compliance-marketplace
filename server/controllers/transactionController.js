const pool = require('../config/db');
const { runFlagEngine } = require('../config/flagRules');
const { record } = require('../middleware/auditLogger');

async function createTransaction(req, res) {
  const { product_id } = req.body;
  if (!product_id) return res.status(400).json({ error: 'product_id required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock product row to prevent oversell
    const { rows: productRows } = await client.query(
      `SELECT p.*, u.id AS seller_user_id FROM products p
       JOIN users u ON u.id = p.seller_id
       WHERE p.id = $1 AND p.is_active = TRUE FOR UPDATE`,
      [product_id]
    );
    const product = productRows[0];
    if (!product) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Product not found' }); }
    if (product.stock < 1) { await client.query('ROLLBACK'); return res.status(409).json({ error: 'Out of stock' }); }
    if (product.seller_user_id === req.user.id) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Cannot purchase your own product' }); }

    // Get buyer record for NEW_ACCOUNT rule
    const { rows: buyerRows } = await client.query(`SELECT created_at FROM users WHERE id = $1`, [req.user.id]);
    const buyerCreatedAt = buyerRows[0].created_at;

    const buyerIp = req.ip;

    // Run flag engine
    const ctx = {
      buyerId: req.user.id,
      sellerId: product.seller_user_id,
      amount: parseFloat(product.price),
      buyerIp,
      sellerIp: null, // stored at listing time; MVP: null
      buyerCreatedAt,
    };
    const triggeredRules = await runFlagEngine(ctx, client);
    const txnStatus = triggeredRules.length > 0 ? 'flagged' : 'completed';

    // Decrement stock
    await client.query(`UPDATE products SET stock = stock - 1 WHERE id = $1`, [product_id]);

    // Create transaction
    const { rows: txnRows } = await client.query(
      `INSERT INTO transactions (buyer_id, seller_id, product_id, amount, status, buyer_ip)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, product.seller_user_id, product_id, product.price, txnStatus, buyerIp]
    );
    const txn = txnRows[0];

    // Insert flag rows
    if (triggeredRules.length > 0) {
      for (const ruleName of triggeredRules) {
        await client.query(
          `INSERT INTO transaction_flags (transaction_id, flag_rule) VALUES ($1, $2)`,
          [txn.id, ruleName]
        );
      }
    }

    await client.query('COMMIT');

    const action = triggeredRules.length > 0 ? 'TRANSACTION_FLAGGED' : 'TRANSACTION_COMPLETED';
    record({
      userId: req.user.id,
      action,
      targetId: txn.id,
      targetType: 'transaction',
      metadata: triggeredRules.length > 0 ? { flags: triggeredRules } : null,
      ip: req.ip,
    });

    res.status(201).json({ transaction: txn, flags: triggeredRules });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Transaction failed' });
  } finally {
    client.release();
  }
}

async function listMyTransactions(req, res) {
  const { rows } = await pool.query(
    `SELECT t.*, p.title AS product_title,
            buyer.email AS buyer_email,
            seller.email AS seller_email,
            COALESCE(json_agg(tf.flag_rule) FILTER (WHERE tf.id IS NOT NULL), '[]') AS flags
     FROM transactions t
     JOIN products p ON p.id = t.product_id
     JOIN users buyer ON buyer.id = t.buyer_id
     JOIN users seller ON seller.id = t.seller_id
     LEFT JOIN transaction_flags tf ON tf.transaction_id = t.id
     WHERE t.buyer_id = $1 OR t.seller_id = $1
     GROUP BY t.id, p.title, buyer.email, seller.email
     ORDER BY t.created_at DESC`,
    [req.user.id]
  );
  res.json({ transactions: rows });
}

module.exports = { createTransaction, listMyTransactions };
