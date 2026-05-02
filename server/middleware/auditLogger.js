const pool = require('../config/db');

function record({ userId, action, targetId = null, targetType = null, metadata = null, ip = null }) {
  pool.query(
    `INSERT INTO audit_logs (user_id, action, target_id, target_type, metadata, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [userId, action, targetId, targetType, metadata ? JSON.stringify(metadata) : null, ip]
  ).catch((err) => console.error('Audit log write failed:', err));
}

// Express middleware: records after response is sent
function auditMiddleware(action, getParams) {
  return (req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const params = getParams(req, res);
        record({ userId: req.user?.id, action, ip: req.ip, ...params });
      }
    });
    next();
  };
}

module.exports = { record, auditMiddleware };
