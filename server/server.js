require('dotenv').config();

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const { ensureDB, readDB, STORAGE_DIR } = require('./db');

ensureDB();

const app = express();
const PORT = process.env.PORT || 3000;

// لازم نقولها للسيرفر إنه خلف بروكسي (Render / Railway / Heroku) عشان الـ IP والـ HTTPS يتعرفوا صح
app.set('trust proxy', 1);

// حماية أساسية على الهيدرز — CSP متعطّلة عشان الفرونت إند بيستخدم inline scripts/onclick
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));
app.use(compression());

// CORS: لو الفرونت والباك على نفس الدومين مش هتحتاج تحدد حاجة
const corsOrigin = process.env.CORS_ORIGIN;
if (corsOrigin) {
  app.use(cors({ origin: corsOrigin.split(',').map(o => o.trim()), credentials: true }));
}

app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(STORAGE_DIR, 'uploads')));

// حماية ضد محاولات تسجيل الدخول المتكررة (brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'محاولات كتير، حاول تاني بعد شوية' }
});

// حد عام لباقي الـ API عشان يمنع إساءة الاستخدام
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api', apiLimiter);

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/upload', require('./routes/upload'));

// Serve frontend
const publicDir = path.join(__dirname, 'public');
console.log('DEBUG publicDir =', publicDir);
app.use(express.static(publicDir));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(publicDir, req.path.endsWith('.html') ? req.path : 'index.html'), err => {
    if (err) res.sendFile(path.join(publicDir, 'index.html'));
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'حدث خطأ في السيرفر' });
});

app.listen(PORT, () => {
  console.log(`
🟢 المتجر شغال على: http://localhost:${PORT}
🔐 لوحة الأدمن: http://localhost:${PORT}/admin/login.html
`);

  // تنبيه لو حساب الأدمن لسه بكلمة السر الافتراضية
  try {
    const db = readDB();
    const admin = db.users.find(u => u.email === 'admin@store.com' && u.role === 'admin');
    if (admin && bcrypt.compareSync('admin123', admin.password)) {
      console.warn('⚠️  تنبيه أمان: حساب الأدمن لسه بكلمة السر الافتراضية (admin123). غيّرها فوراً من صفحة "حسابي".');
    }
  } catch (e) {
    // تجاهل أي خطأ في فحص التنبيه، مش لازم يوقف السيرفر
  }
});
