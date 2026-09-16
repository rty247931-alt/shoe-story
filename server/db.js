// db.js — قاعدة بيانات بسيطة مبنية على ملف JSON (بدون الحاجة لتثبيت أي قاعدة بيانات خارجية)
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');

// STORAGE_DIR: مجلد التخزين الدائم (يحتوي على data/ و uploads/)
// قابل للتغيير عبر متغير بيئة عشان يسهل تركيب قرص دائم واحد (persistent disk) عليه في منصات النشر
const STORAGE_DIR = process.env.STORAGE_DIR || __dirname;
const DB_PATH = path.join(STORAGE_DIR, 'data', 'db.json');

function defaultData() {
  const adminId = uuid();
  return {
    users: [
      {
        id: adminId,
        name: 'مدير المتجر',
        email: 'admin@store.com',
        password: bcrypt.hashSync('admin123', 8),
        role: 'admin',
        phone: '',
        address: '',
        banned: false,
        createdAt: new Date().toISOString()
      }
    ],
    categories: [
      { id: uuid(), name: 'رجالي', image: '', order: 1 },
      { id: uuid(), name: 'حريمي', image: '', order: 2 },
      { id: uuid(), name: 'أطفال', image: '', order: 3 }
    ],
    products: [],
    orders: [],
    settings: {
      storeName: 'متجر الأحذية',
      logo: '',
      primaryColor: '#0b0b0b',
      accentColor: '#c9a227',
      phone: '01000000000',
      whatsapp: '01000000000',
      email: 'info@store.com',
      address: 'مصر',
      welcomeMessage: 'وصل حديثاً: أحدث موديلات الأحذية بأفضل الأسعار',
      banner: '',
      payment: {
        vodafoneCash: { enabled: true, number: '01000000000' },
        instapay: { enabled: true, account: 'store@instapay' },
        card: { enabled: false, provider: 'Paymob', apiKey: '', integrationId: '' },
        cod: { enabled: true, fee: 0 }
      },
      shippingFee: 50
    },
    counters: { invoice: 1000 }
  };
}

function ensureDB() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultData(), null, 2), 'utf8');
    console.log('✅ تم إنشاء قاعدة بيانات جديدة مع حساب أدمن افتراضي');
    console.log('   البريد: admin@store.com  |  كلمة السر: admin123');
  }
}

function readDB() {
  ensureDB();
  const raw = fs.readFileSync(DB_PATH, 'utf8');
  return JSON.parse(raw);
}

function writeDB(data) {
  // كتابة atomic: نكتب في ملف مؤقت الأول وبعدين نعمل rename
  // كده لو السيرفر وقع أثناء الكتابة، ملف db.json الأصلي مايتلفش
  const tmpPath = `${DB_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmpPath, DB_PATH);
}

module.exports = { readDB, writeDB, ensureDB, DB_PATH, STORAGE_DIR };
