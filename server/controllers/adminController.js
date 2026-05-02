const pool = require('../config/db');
const { record } = require('../middleware/auditLogger');

// ── Flag review queue ──────────────────────────────────────────────────────

async function listFlaggedTransactions(req, res) {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = parseInt(req.query.offset) || 0;

  const { rows } = await pool.query(
    `SELECT t.id, t.amount, t.status, t.created_at, t.buyer_ip,
            p.title AS product_title,
            buyer.email AS buyer_email,
            seller.email AS seller_email,
            json_agg(json_build_object(
              'id', tf.id, 'flag_rule', tf.flag_rule, 'flagged_at', tf.flagged_at,
              'resolution', tf.resolution
            )) AS flags
     FROM transactions t
     JOIN products p ON p.id = t.product_id
     JOIN users buyer ON buyer.id = t.buyer_id
     JOIN users seller ON seller.id = t.seller_id
     JOIN transaction_flags tf ON tf.transaction_id = t.id
     WHERE t.status = 'flagged'
     GROUP BY t.id, p.title, buyer.email, seller.email
     ORDER BY t.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  res.json({ transactions: rows });
}

async function resolveFlag(req, res) {
  const { resolution } = req.body; // 'approved' | 'rejected'
  if (!['approved', 'rejected'].includes(resolution)) {
    return res.status(400).json({ error: 'resolution must be approved or rejected' });
  }

  const newTxnStatus = resolution === 'approved' ? 'completed' : 'cancelled';
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: flagRows } = await client.query(
      `UPDATE transaction_flags
       SET resolution = $1, reviewed_by = $2, resolved_at = NOW()
       WHERE transaction_id = $3 AND resolution IS NULL
       RETURNING transaction_id`,
      [resolution, req.user.id, req.params.txnId]
    );
    if (flagRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Transaction not found or already resolved' });
    }

    await client.query(
      `UPDATE transactions SET status = $1 WHERE id = $2`,
      [newTxnStatus, req.params.txnId]
    );
    await client.query('COMMIT');

    record({
      userId: req.user.id,
      action: resolution === 'approved' ? 'FLAG_APPROVED' : 'FLAG_REJECTED',
      targetId: req.params.txnId,
      targetType: 'transaction',
      metadata: { resolution },
      ip: req.ip,
    });

    res.json({ message: `Transaction ${newTxnStatus}` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Resolution failed' });
  } finally {
    client.release();
  }
}

// ── KYC review ────────────────────────────────────────────────────────────

async function listPendingKYC(req, res) {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = parseInt(req.query.offset) || 0;
  const { rows } = await pool.query(
    `SELECT k.id, k.full_name, k.date_of_birth, k.document_s3_key, k.submitted_at,
            u.email AS user_email, u.id AS user_id
     FROM kyc_records k JOIN users u ON u.id = k.user_id
     WHERE k.status = 'pending'
     ORDER BY k.submitted_at ASC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  res.json({ kyc_records: rows });
}

async function reviewKYC(req, res) {
  const { resolution, rejection_reason } = req.body;
  if (!['approved', 'rejected'].includes(resolution)) {
    return res.status(400).json({ error: 'resolution must be approved or rejected' });
  }

  const kycStatus = resolution;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `UPDATE kyc_records SET status = $1, reviewed_by = $2, reviewed_at = NOW(), rejection_reason = $3
       WHERE id = $4 AND status = 'pending' RETURNING user_id`,
      [kycStatus, req.user.id, rejection_reason || null, req.params.kycId]
    );
    if (!rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'KYC record not found or already reviewed' }); }

    await client.query(`UPDATE users SET kyc_status = $1 WHERE id = $2`, [kycStatus, rows[0].user_id]);
    await client.query('COMMIT');

    record({
      userId: req.user.id,
      action: resolution === 'approved' ? 'KYC_ADMIN_APPROVED' : 'KYC_ADMIN_REJECTED',
      targetId: req.params.kycId,
      targetType: 'kyc_record',
      ip: req.ip,
    });

    res.json({ message: `KYC ${kycStatus}` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'KYC review failed' });
  } finally {
    client.release();
  }
}

// ── Audit log ─────────────────────────────────────────────────────────────

async function getAuditLog(req, res) {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const offset = parseInt(req.query.offset) || 0;
  const { user_id, action, from, to } = req.query;

  const conditions = [];
  const params = [limit, offset];
  let idx = 3;

  if (user_id) { conditions.push(`a.user_id = $${idx++}`); params.push(user_id); }
  if (action) { conditions.push(`a.action ILIKE $${idx++}`); params.push(`%${action}%`); }
  if (from) { conditions.push(`a.created_at >= $${idx++}`); params.push(from); }
  if (to) { conditions.push(`a.created_at <= $${idx++}`); params.push(to); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT a.*, u.email AS user_email
     FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id
     ${where}
     ORDER BY a.created_at DESC
     LIMIT $1 OFFSET $2`,
    params
  );
  res.json({ logs: rows });
}

module.exports = { listFlaggedTransactions, resolveFlag, listPendingKYC, reviewKYC, getAuditLog };
