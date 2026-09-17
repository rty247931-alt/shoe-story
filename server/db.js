const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost')
    ? false
    : { rejectUnauthorized: false }
});

function svgPlaceholder(color, emoji) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="${color}"/><text x="50%" y="50%" font-size="90" text-anchor="middle" dominant-baseline="central">${emoji}</text></svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

const DEFAULT_PRODUCTS = [
  ['حذاء رياضي رجالي', 850, 'رجالي', 25, 'حذاء رياضي مريح مناسب للجري والاستخدام اليومي.', svgPlaceholder('%23DCEFE9', '👟')],
  ['حذاء كلاسيك جلد رجالي', 1100, 'رجالي', 12, 'حذاء جلد طبيعي أنيق مناسب للمناسبات الرسمية.', svgPlaceholder('%23F6E4BE', '👞')],
  ['حذاء كعب حريمي', 690, 'حريمي', 18, 'تصميم عصري أنيق يناسب السهرات والمناسبات.', svgPlaceholder('%23E9D8F5', '👠')],
  ['سنيكرز حريمي كاجوال', 590, 'حريمي', 30, 'سنيكرز خفيف ومريح مناسب للاستخدام اليومي.', svgPlaceholder('%23D6E8F7', '👟')],
  ['حذاء أطفال رياضي', 340, 'أطفال', 22, 'حذاء مرن وآمن مناسب للعب والمدرسة.', svgPlaceholder('%23FBE1D6', '👟')],
  ['صندل أطفال صيفي', 210, 'أطفال', 35, 'صندل خفيف ومريح لأيام الصيف.', svgPlaceholder('%23E1F1EC', '🩴')],
  ['بوت شتوي رجالي', 1350, 'رجالي', 9, 'بوت متين يتحمل الشتاء وأجواء البرد.', svgPlaceholder('%23FDEBD3', '🥾')],
  ['شبشب منزلي حريمي', 150, 'حريمي', 50, 'شبشب ناعم ومريح للاستخدام المنزلي.', svgPlaceholder('%23F3DDE5', '🥿')]
];

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin (
      id serial PRIMARY KEY,
      email text UNIQUE NOT NULL,
      password_hash text NOT NULL
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      id int PRIMARY KEY DEFAULT 1,
      site_name text DEFAULT 'متجر الأحذية',
      tagline text DEFAULT 'أحدث تشكيلات الأحذية الرجالي والحريمي والأطفال',
      hero_title text DEFAULT 'خطوتك الجاية تبدأ من هنا',
      logo text DEFAULT '',
      bg text DEFAULT '',
      invoice_note text DEFAULT 'شكرًا لتسوقكم معنا، نتمنى نشوفكم تاني قريب 🌸',
      payment_info text DEFAULT 'الدفع عند الاستلام، أو تحويل على محفظة فودافون كاش: 01000000000',
      shipping_info text DEFAULT 'التوصيل من 2 إلى 4 أيام عمل داخل الجمهورية، ومجاني للطلبات فوق 1000 ج.م.',
      CHECK (id = 1)
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id serial PRIMARY KEY,
      name text NOT NULL,
      price numeric NOT NULL,
      category text NOT NULL,
      stock int DEFAULT 0,
      description text DEFAULT '',
      image text DEFAULT ''
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id serial PRIMARY KEY,
      order_number text UNIQUE NOT NULL,
      customer_name text NOT NULL,
      phone text NOT NULL,
      address text NOT NULL,
      payment_method text,
      status text DEFAULT 'قيد المراجعة',
      total numeric NOT NULL,
      created_at timestamp DEFAULT now()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id serial PRIMARY KEY,
      order_id int REFERENCES orders(id) ON DELETE CASCADE,
      product_name text NOT NULL,
      qty int NOT NULL,
      price numeric NOT NULL
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id serial PRIMARY KEY,
      name text NOT NULL,
      email text UNIQUE NOT NULL,
      phone text,
      address text,
      password_hash text NOT NULL,
      created_at timestamp DEFAULT now()
    );
  `);
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id int REFERENCES customers(id);`);

  // Seed admin
  const adminCount = await pool.query('SELECT COUNT(*) FROM admin');
  if (parseInt(adminCount.rows[0].count) === 0) {
    const hash = await bcrypt.hash('admin123', 10);
    await pool.query('INSERT INTO admin (email, password_hash) VALUES ($1,$2)', ['admin@store.com', hash]);
    console.log('✔ تم إنشاء حساب المدير الافتراضي: admin@store.com / admin123');
  }

  // Seed settings
  const settingsCount = await pool.query('SELECT COUNT(*) FROM settings');
  if (parseInt(settingsCount.rows[0].count) === 0) {
    await pool.query('INSERT INTO settings (id) VALUES (1)');
  }

  // Seed products
  const prodCount = await pool.query('SELECT COUNT(*) FROM products');
  if (parseInt(prodCount.rows[0].count) === 0) {
    for (const p of DEFAULT_PRODUCTS) {
      await pool.query(
        'INSERT INTO products (name, price, category, stock, description, image) VALUES ($1,$2,$3,$4,$5,$6)',
        p
      );
    }
    console.log('✔ تم إضافة منتجات افتراضية');
  }
}

module.exports = { pool, initDb };
