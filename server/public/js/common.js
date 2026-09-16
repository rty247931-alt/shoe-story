let __settingsCache = null;
async function loadSettings(){
  if (__settingsCache) return __settingsCache;
  try { __settingsCache = await api('/settings'); } catch(e){ __settingsCache = { storeName: 'متجر الأحذية' }; }
  return __settingsCache;
}

async function renderHeader(active){
  const s = await loadSettings();
  const user = getUser();
  const header = document.getElementById('siteHeader');
  if (!header) return;
  header.innerHTML = `
    <div class="container header-inner">
      <a href="/index.html" class="brand">${s.logo ? `<img src="${s.logo}">` : ''}${escapeHtml(s.storeName)}<span class="dot">.</span></a>
      <nav class="nav-links">
        <a href="/index.html" class="${active==='home'?'active':''}">الرئيسية</a>
        <a href="/store.html" class="${active==='store'?'active':''}">المتجر</a>
        <a href="/track.html" class="${active==='track'?'active':''}">تتبع طلبك</a>
      </nav>
      <div class="header-actions">
        <button class="icon-btn" onclick="toggleTheme()" title="الوضع الليلي/النهاري">🌓</button>
        <a href="${user ? '/account.html' : '/login.html'}" class="icon-btn" title="حسابي">👤</a>
        <a href="/cart.html" class="icon-btn" title="السلة">
          🛒<span class="cart-count" id="cartCount">0</span>
        </a>
      </div>
    </div>`;
  updateCartBadge();

  const footer = document.getElementById('siteFooter');
  if (footer) {
    footer.innerHTML = `
      <div class="container">
        <div class="footer-grid">
          <div>
            <h5>${escapeHtml(s.storeName)}</h5>
            <p>${escapeHtml(s.welcomeMessage || '')}</p>
          </div>
          <div>
            <h5>روابط</h5>
            <a href="/store.html">المتجر</a>
            <a href="/track.html">تتبع الطلب</a>
            <a href="/account.html">حسابي</a>
          </div>
          <div>
            <h5>تواصل معنا</h5>
            <a href="tel:${s.phone||''}">📞 ${escapeHtml(s.phone||'')}</a>
            <a href="https://wa.me/${(s.whatsapp||'').replace(/[^0-9]/g,'')}">💬 واتساب</a>
            <a href="mailto:${s.email||''}">✉️ ${escapeHtml(s.email||'')}</a>
          </div>
        </div>
        <div class="footer-bottom">© ${new Date().getFullYear()} ${escapeHtml(s.storeName)} — جميع الحقوق محفوظة</div>
      </div>`;
  }
}
