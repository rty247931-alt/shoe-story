const jwt = require('jsonwebtoken');

const DEFAULT_SECRET = 'shoe-store-super-secret-change-me';
if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET === DEFAULT_SECRET)) {
  console.error('❌ خطأ: لازم تحدد JWT_SECRET حقيقي وعشوائي في متغيرات البيئة قبل تشغيل السيرفر في بيئة الإنتاج.');
  console.error('   شوف ملف server/.env.example لمعرفة الطريقة.');
  process.exit(1);
}
const SECRET = process.env.JWT_SECRET || DEFAULT_SECRET;

function auth(required = true) {
  return (req, res, next) => {
    const header = req.headers.authorization;
    const token = header && header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      if (required) return res.status(401).json({ error: 'يجب تسجيل الدخول' });
      req.user = null;
      return next();
    }
    try {
      const payload = jwt.verify(token, SECRET);
      req.user = payload;
      next();
    } catch (e) {
      if (required) return res.status(401).json({ error: 'الجلسة غير صالحة، سجل الدخول مرة أخرى' });
      req.user = null;
      next();
    }
  };
}

function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'هذه الصفحة للأدمن فقط' });
  }
  next();
}

module.exports = { auth, adminOnly, SECRET };
