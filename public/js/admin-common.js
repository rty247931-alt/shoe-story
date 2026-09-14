function guardAdmin(){
  if (!getToken() || !isAdmin()) {
    location.href = '/login.html';
    return false;
  }
  return true;
}

function renderAdminShell(active, title){
  const user = getUser();
  document.body.insertAdjacentHTML('afterbegin', `
    <div class="admin-shell">
      <aside class="admin-side">
        <div class="brand">لوحة الإدارة<span class="dot">.</span></div>
        <nav class="admin-nav">
          <a href="/admin/index.html" class="${active==='dashboard'?'active':''}">📊 لوحة التحكم</a>
          <a href="/admin/products.html" class="${active==='products'?'active':''}">👟 المنتجات</a>
          <a href="/admin/categories.html" class="${active==='categories'?'active':''}">📂 الأقسام</a>
          <a href="/admin/orders.html" class="${active==='orders'?'active':''}">📦 الطلبات</a>
          <a href="/admin/customers.html" class="${active==='customers'?'active':''}">👥 العملاء</a>
          <a href="/admin/payments.html" class="${active==='payments'?'active':''}">💳 وسائل الدفع</a>
          <a href="/admin/settings.html" class="${active==='settings'?'active':''}">⚙️ إعدادات المتجر</a>
          <a href="/index.html" style="margin-top:14px;border-top:1px solid #2a251d;padding-top:16px">🌐 عرض المتجر</a>
          <a href="#" onclick="adminLogout()">🚪 تسجيل الخروج</a>
        </nav>
      </aside>
      <main class="admin-main">
        <div class="admin-topbar">
          <h1>${title}</h1>
          <div style="display:flex;align-items:center;gap:12px">
            <button class="icon-btn" onclick="toggleTheme()">🌓</button>
            <span style="font-weight:700">${user ? escapeHtml(user.name) : ''}</span>
          </div>
        </div>
        <div id="adminContent"></div>
      </main>
    </div>
  `);
}

function adminLogout(){ clearToken(); location.href = '/login.html'; }
