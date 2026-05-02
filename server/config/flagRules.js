// Each rule: { name, evaluate(ctx, db) → Promise<boolean> }
// ctx: { buyerId, sellerId, amount, buyerIp, sellerIp, buyerCreatedAt }
const flagRules = [
  {
    name: 'HIGH_VALUE',
    threshold: 10000,
    async evaluate(ctx) {
      return ctx.amount > this.threshold;
    },
  },
  {
    name: 'VELOCITY',
    maxCount: 5,
    windowMinutes: 10,
    async evaluate(ctx, db) {
      const { rows } = await db.query(
        `SELECT COUNT(*) AS cnt FROM transactions
         WHERE buyer_id = $1
           AND created_at > NOW() - INTERVAL '${this.windowMinutes} minutes'
           AND status != 'cancelled'`,
        [ctx.buyerId]
      );
      return parseInt(rows[0].cnt, 10) >= this.maxCount;
    },
  },
  {
    name: 'SAME_IP',
    async evaluate(ctx) {
      return !!(ctx.buyerIp && ctx.sellerIp && ctx.buyerIp === ctx.sellerIp);
    },
  },
  {
    name: 'NEW_ACCOUNT',
    windowHours: 1,
    async evaluate(ctx) {
      const ageMs = Date.now() - new Date(ctx.buyerCreatedAt).getTime();
      return ageMs < this.windowHours * 60 * 60 * 1000;
    },
  },
];

async function runFlagEngine(ctx, db) {
  const triggered = [];
  for (const rule of flagRules) {
    if (await rule.evaluate(ctx, db)) triggered.push(rule.name);
  }
  return triggered;
}

module.exports = { flagRules, runFlagEngine };
