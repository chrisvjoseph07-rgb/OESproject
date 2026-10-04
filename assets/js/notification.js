/**
 * Toast and Modal Notification Utility
 */

const Toast = {
  container: null,

  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show(message, type = 'info', duration = 3500) {
    this.init();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const iconMap = {
      success: '✓',
      danger: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.6rem;">
        <span style="font-weight: bold; font-size: 1.1rem;">${iconMap[type] || 'ℹ'}</span>
        <span>${message}</span>
      </div>
      <button style="background: none; border: none; font-size: 1.1rem; cursor: pointer; color: inherit; padding-left: 0.5rem;" onclick="this.parentElement.remove()">&times;</button>
    `;

    this.container.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 400);
    }, duration);
  },

  success(msg) { this.show(msg, 'success'); },
  error(msg) { this.show(msg, 'danger'); },
  warning(msg) { this.show(msg, 'warning'); },
  info(msg) { this.show(msg, 'info'); }
};

window.Toast = Toast;
