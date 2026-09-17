const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'يجب تسجيل الدخول' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_change_me');
    if (payload.role !== 'admin') return res.status(403).json({ error: 'غير مصرح لك بالدخول' });
    req.admin = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'جلسة الدخول غير صالحة، سجّل دخول تاني' });
  }
}

function requireCustomerAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'يجب تسجيل الدخول' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_change_me');
    if (payload.role !== 'customer') return res.status(403).json({ error: 'غير مصرح لك بالدخول' });
    req.customer = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'جلسة الدخول غير صالحة، سجّل دخول تاني' });
  }
}

function optionalCustomerAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_change_me');
      if (payload.role === 'customer') req.customer = payload;
    } catch (e) {}
  }
  next();
}

module.exports = { requireAuth, requireCustomerAuth, optionalCustomerAuth };
