const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'يجب تسجيل الدخول' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_change_me');
    req.admin = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'جلسة الدخول غير صالحة، سجّل دخول تاني' });
  }
}

module.exports = { requireAuth };
