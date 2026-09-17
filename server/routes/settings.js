const express = require('express');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  const result = await pool.query('SELECT * FROM settings WHERE id=1');
  res.json(result.rows[0]);
});

router.put('/', requireAuth, async (req, res) => {
  const b = req.body || {};
  const nn = v => (v === undefined ? null : v);
  const result = await pool.query(
    `UPDATE settings SET
      site_name=COALESCE($1, site_name),
      tagline=COALESCE($2, tagline),
      hero_title=COALESCE($3, hero_title),
      logo=COALESCE($4, logo),
      bg=COALESCE($5, bg),
      invoice_note=COALESCE($6, invoice_note),
      payment_info=COALESCE($7, payment_info),
      shipping_info=COALESCE($8, shipping_info),
      admin_access_code=COALESCE($9, admin_access_code)
     WHERE id=1 RETURNING *`,
    [nn(b.site_name), nn(b.tagline), nn(b.hero_title), nn(b.logo), nn(b.bg), nn(b.invoice_note), nn(b.payment_info), nn(b.shipping_info), nn(b.admin_access_code)]
  );
  res.json(result.rows[0]);
});

module.exports = router;
