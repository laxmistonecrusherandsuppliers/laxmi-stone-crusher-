// Lakshmi Stone Crusher & Suppliers - Utilities

window.LSCUtils = {
  formatCurrency: function (amount) {
    const num = parseFloat(amount) || 0;
    return '₹' + num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  },

  formatDate: function (dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  },

  formatISO: function (date) {
    const d = date ? new Date(date) : new Date();
    return d.toISOString().split('T')[0];
  },

  getQueryParam: function (param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  },

  showNotification: function (message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = 'position:fixed; top:20px; right:20px; z-index:9999; display:flex; flex-direction:column; gap:10px; pointer-events:none;';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const bgColors = {
      success: '#059669',
      error: '#dc2626',
      warning: '#d97706',
      info: '#2563eb'
    };

    toast.style.cssText = `
      background: ${bgColors[type] || bgColors.info};
      color: white;
      padding: 12px 18px;
      border-radius: 8px;
      font-size: 13.5px;
      font-weight: 500;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.2);
      pointer-events: auto;
      transition: all 0.3s ease;
      transform: translateY(-10px);
      opacity: 0;
      display: flex;
      align-items: center;
      gap: 10px;
    `;
    toast.innerHTML = `<span>${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    }, 10);

    setTimeout(() => {
      toast.style.transform = 'translateY(-10px)';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  checkOnlineStatus: function () {
    if (!navigator.onLine) {
      window.LSCUtils.showNotification('Internet connection unavailable. Please reconnect and try again.', 'warning');
      return false;
    }
    return true;
  }
};

// Global network listener
window.addEventListener('offline', () => {
  window.LSCUtils.showNotification('Internet connection lost. Please reconnect to continue.', 'error');
});
window.addEventListener('online', () => {
  window.LSCUtils.showNotification('Internet connection restored.', 'success');
});
