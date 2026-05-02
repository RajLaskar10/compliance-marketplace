require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcrypt');
const pool = require('../config/db');

const PASS = 'Password1!';
const ROUNDS = 10;

async function seed() {
  const hash = await bcrypt.hash(PASS, ROUNDS);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Wipe in dependency order
    await client.query('DELETE FROM audit_logs');
    await client.query('DELETE FROM transaction_flags');
    await client.query('DELETE FROM transactions');
    await client.query('DELETE FROM kyc_records');
    await client.query('DELETE FROM products');
    await client.query('DELETE FROM users');

    // Admin
    await client.query(
      `INSERT INTO users (email, password_hash, role, kyc_status) VALUES ('admin@example.com', $1, 'admin', 'approved')`, [hash]
    );

    // Sellers (KYC approved, backdated so NEW_ACCOUNT doesn't fire on their buyers)
    const { rows: [seller1] } = await client.query(
      `INSERT INTO users (email, password_hash, role, kyc_status, created_at) VALUES ('seller1@example.com', $1, 'seller', 'approved', NOW() - INTERVAL '2 days') RETURNING id`, [hash]
    );
    const { rows: [seller2] } = await client.query(
      `INSERT INTO users (email, password_hash, role, kyc_status, created_at) VALUES ('seller2@example.com', $1, 'seller', 'approved', NOW() - INTERVAL '2 days') RETURNING id`, [hash]
    );

    // Buyers — created 2 days ago so they don't trigger NEW_ACCOUNT
    const { rows: [buyer1] } = await client.query(
      `INSERT INTO users (email, password_hash, role, kyc_status, created_at) VALUES ('buyer1@example.com', $1, 'buyer', 'approved', NOW() - INTERVAL '2 days') RETURNING id`, [hash]
    );
    const { rows: [buyer2] } = await client.query(
      `INSERT INTO users (email, password_hash, role, kyc_status, created_at) VALUES ('buyer2@example.com', $1, 'buyer', 'approved', NOW() - INTERVAL '2 days') RETURNING id`, [hash]
    );
    // New account buyer — triggers NEW_ACCOUNT flag (created 30 min ago)
    const { rows: [buyer3] } = await client.query(
      `INSERT INTO users (email, password_hash, role, kyc_status, created_at) VALUES ('newbuyer@example.com', $1, 'buyer', 'approved', NOW() - INTERVAL '30 minutes') RETURNING id`, [hash]
    );

    // Products
    const products = [
      { seller_id: seller1.id, title: 'Laptop Pro 16"', description: 'High-performance laptop', price: 2499.99, stock: 5 },
      { seller_id: seller1.id, title: 'Wireless Headphones', description: 'Noise-cancelling', price: 349.99, stock: 10 },
      { seller_id: seller2.id, title: 'Luxury Watch', description: 'Swiss made', price: 12500.00, stock: 2 },
      { seller_id: seller2.id, title: 'Mechanical Keyboard', description: 'Cherry MX switches', price: 199.99, stock: 8 },
      { seller_id: seller1.id, title: 'USB-C Hub', description: '7-in-1 hub', price: 59.99, stock: 20 },
    ];
    for (const p of products) {
      await client.query(
        `INSERT INTO products (seller_id, title, description, price, stock) VALUES ($1, $2, $3, $4, $5)`,
        [p.seller_id, p.title, p.description, p.price, p.stock]
      );
    }

    await client.query('COMMIT');
    console.log('✓ Seed complete');
    console.log('  admin@example.com / seller1@example.com / seller2@example.com');
    console.log('  buyer1@example.com / buyer2@example.com / newbuyer@example.com');
    console.log('  All passwords:', PASS);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

seed();
