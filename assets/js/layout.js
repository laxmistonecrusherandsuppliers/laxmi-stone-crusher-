// Lakshmi Stone Crusher & Suppliers - Common Page Layout & Navigation Injector

window.LSCLayout = {
  navItems: [
    { key: 'sale-new', label: 'New Sale', href: 'sale-new.html', icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6' },
    { key: 'sales', label: 'Bill Edit', href: 'sales.html', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { key: 'dues', label: 'Outstanding Dues', href: 'reports.html?type=due', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { key: 'customers', label: 'Customers', href: 'customers.html', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5 5 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { key: 'attendance', label: 'Attendance & Staff', href: 'attendance.html', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    { key: 'reports', label: 'Reports & Statement', href: 'reports.html', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { key: 'settings', label: 'Settings', href: 'settings.html', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }
  ],

  init: function (activeKey, pageTitle = '') {
    // 1. Auth Guard
    if (!window.LSCAuth.requireAuth()) {
      return;
    }

    const user = window.LSCAuth.getCurrentUser();
    const appRoot = document.getElementById('app');
    if (!appRoot) return;

    // Preserve existing page content inside root
    const pageContentHtml = appRoot.innerHTML;

    // Construct Layout Template
    const layoutHtml = `
      <div class="app-container">
        <!-- Mobile Overlay -->
        <div id="sidebar-overlay" class="fixed inset-0 bg-black/40 z-40 hidden transition-opacity" onclick="window.LSCLayout.toggleSidebar(false)"></div>

        <!-- Sidebar -->
        <aside id="app-sidebar" class="sidebar">
          <div class="sidebar-header">
            <div class="sidebar-brand">
              <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden bg-white shadow-sm">
                <img src="assets/images/logo.png" alt="LSC Logo" class="w-full h-full object-cover">
              </div>
              <div class="min-w-0">
                <div class="font-bold text-sm text-white leading-snug truncate">Lakshmi Stone</div>
                <div class="text-[11px] text-slate-400 font-medium truncate">Crusher & Suppliers</div>
              </div>
            </div>
          </div>

          <nav class="sidebar-nav">
            <div class="nav-section-label">Navigation Menu</div>
            ${this.navItems.map(item => `
              <a href="${item.href}" class="nav-item ${activeKey === item.key ? 'active' : ''}">
                <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${item.icon}"></path>
                </svg>
                <span class="truncate">${item.label}</span>
              </a>
            `).join('')}
          </nav>

          <div class="sidebar-footer">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center font-bold text-xs text-blue-400 flex-shrink-0">
                  ${user ? user.username.charAt(0).toUpperCase() : 'U'}
                </div>
                <div class="min-w-0">
                  <div class="text-xs font-semibold text-white truncate">${user ? user.username : 'User'}</div>
                  <div class="text-[11px] text-slate-400 capitalize truncate">${user ? user.role : 'Staff'}</div>
                </div>
              </div>
              <button onclick="window.LSCAuth.logout()" title="Sign out" class="text-slate-400 hover:text-red-400 p-1.5 rounded-lg transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
              </button>
            </div>
          </div>
        </aside>

        <!-- Main Content Area -->
        <div class="main-content">
          <header class="header">
            <div class="flex items-center gap-3">
              <button class="menu-toggle md:hidden p-1.5 text-gray-600 rounded-lg hover:bg-gray-100" onclick="window.LSCLayout.toggleSidebar(true)">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
              </button>
              <div class="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                ${pageTitle || this.navItems.find(i => i.key === activeKey)?.label || 'Lakshmi Stone Crusher'}
              </div>
            </div>

            <div class="flex items-center gap-3">
              ${activeKey !== 'sale-new' ? `
                <a href="sale-new.html" class="btn btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                  <span>New Sale</span>
                </a>
              ` : ''}
            </div>
          </header>

          <main class="page-content">
            ${pageContentHtml}
          </main>
        </div>
      </div>
    `;

    appRoot.innerHTML = layoutHtml;
  },

  toggleSidebar: function (open) {
    const sidebar = document.getElementById('app-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (!sidebar || !overlay) return;

    if (open) {
      sidebar.classList.add('open');
      overlay.classList.remove('hidden');
    } else {
      sidebar.classList.remove('open');
      overlay.classList.add('hidden');
    }
  }
};
