const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const s3 = require('../config/s3');
const { record } = require('../middleware/auditLogger');

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

async function presign(req, res) {
  const { filename, contentType } = req.body;
  if (!filename || !contentType) return res.status(400).json({ error: 'filename and contentType required' });

  const key = `kyc/${req.user.id}/${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  try {
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
    res.json({ uploadUrl, key });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not generate upload URL' });
  }
}

function evaluateKYCRules(full_name, date_of_birth, document_s3_key) {
  const reasons = [];
  if (!full_name || full_name.trim().split(/\s+/).length < 2) reasons.push('Full name must include first and last name');
  const dob = new Date(date_of_birth);
  const age = (Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  if (isNaN(age) || age < 18) reasons.push('Must be 18 or older');
  if (!document_s3_key) reasons.push('Document upload required');
  return reasons;
}

async function submit(req, res) {
  const { full_name, date_of_birth, document_s3_key } = req.body;
  if (!full_name || !date_of_birth || !document_s3_key) {
    return res.status(400).json({ error: 'full_name, date_of_birth, and document_s3_key required' });
  }

  const rejectionReasons = evaluateKYCRules(full_name, date_of_birth, document_s3_key);
  const approved = rejectionReasons.length === 0;
  const newStatus = approved ? 'approved' : 'rejected';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO kyc_records (user_id, full_name, date_of_birth, document_s3_key, status, rejection_reason)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [req.user.id, full_name, date_of_birth, document_s3_key, newStatus, approved ? null : rejectionReasons.join('; ')]
    );
    await client.query(`UPDATE users SET kyc_status = $1 WHERE id = $2`, [newStatus, req.user.id]);
    await client.query('COMMIT');

    record({
      userId: req.user.id,
      action: approved ? 'KYC_APPROVED' : 'KYC_REJECTED',
      targetId: rows[0].id,
      targetType: 'kyc_record',
      metadata: approved ? null : { reasons: rejectionReasons },
      ip: req.ip,
    });

    // Re-issue JWT so the new kyc_status takes effect immediately (no logout required)
    const newToken = jwt.sign(
      { id: req.user.id, email: req.user.email, role: req.user.role, kyc_status: newStatus },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.cookie('token', newToken, COOKIE_OPTS);

    res.status(201).json({ status: newStatus, rejection_reason: approved ? null : rejectionReasons.join('; ') });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'KYC submission failed' });
  } finally {
    client.release();
  }
}

async function getMyKYC(req, res) {
  const { rows } = await pool.query(
    `SELECT id, full_name, date_of_birth, status, rejection_reason, submitted_at FROM kyc_records WHERE user_id = $1 ORDER BY submitted_at DESC LIMIT 1`,
    [req.user.id]
  );
  res.json({ kyc: rows[0] || null });
}

module.exports = { presign, submit, getMyKYC };
