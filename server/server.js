require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./db');

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));

app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`🚀 السيرفر شغال على بورت ${PORT}`));
  })
  .catch(err => {
    console.error('❌ فشل الاتصال بقاعدة البيانات:', err);
    process.exit(1);
  });

