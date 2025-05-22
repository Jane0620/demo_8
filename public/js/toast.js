// toast.js - Toast 訊息模組

class Toast {
  constructor(options = {}) {
    this.config = {
      position: options.position || 'top-right', // top-right, top-left, bottom-right, bottom-left, top-center, bottom-center
      duration: options.duration || 3000,
      maxToasts: options.maxToasts || 5,
      spacing: options.spacing || 10,
      animation: options.animation || 'slide', // slide, fade, bounce
      showProgress: options.showProgress || false,
      ...options
    };
    
    this.toasts = [];
    this.container = null;
    this.init();
  }

  init() {
    this.createContainer();
    this.addStyles();
  }

  createContainer() {
    if (this.container) return;
    
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    this.container.setAttribute('data-position', this.config.position);
    
    document.body.appendChild(this.container);
  }

  addStyles() {
    if (document.getElementById('toast-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'toast-styles';
    styles.textContent = `
      .toast-container {
        position: fixed;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: ${this.config.spacing}px;
        pointer-events: none;
      }
      
      .toast-container[data-position="top-right"] {
        top: 20px;
        right: 20px;
      }
      
      .toast-container[data-position="top-left"] {
        top: 20px;
        left: 20px;
      }
      
      .toast-container[data-position="bottom-right"] {
        bottom: 20px;
        right: 20px;
      }
      
      .toast-container[data-position="bottom-left"] {
        bottom: 20px;
        left: 20px;
      }
      
      .toast-container[data-position="top-center"] {
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
      }
      
      .toast-container[data-position="bottom-center"] {
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
      }
      
      .toast-item {
        background: #333;
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        font-size: 14px;
        min-width: 280px;
        max-width: 400px;
        word-wrap: break-word;
        pointer-events: auto;
        position: relative;
        overflow: hidden;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .toast-item.toast-success {
        background: #4CAF50;
      }
      
      .toast-item.toast-error {
        background: #f44336;
      }
      
      .toast-item.toast-warning {
        background: #FF9800;
      }
      
      .toast-item.toast-info {
        background: #2196F3;
      }
      
      .toast-content {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .toast-icon {
        font-size: 16px;
        font-weight: bold;
        flex-shrink: 0;
      }
      
      .toast-message {
        flex: 1;
        line-height: 1.4;
      }
      
      .toast-close {
        background: none;
        border: none;
        color: inherit;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        margin-left: 10px;
        opacity: 0.7;
        transition: opacity 0.2s;
      }
      
      .toast-close:hover {
        opacity: 1;
      }
      
      .toast-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        background: rgba(255,255,255,0.3);
        transition: width linear;
      }
      
      /* 動畫效果 */
      .toast-slide-enter {
        opacity: 0;
        transform: translateX(100%);
      }
      
      .toast-slide-enter[data-position*="left"] {
        transform: translateX(-100%);
      }
      
      .toast-slide-enter[data-position*="center"] {
        transform: translateY(-100%);
      }
      
      .toast-slide-exit {
        opacity: 0;
        transform: translateX(100%);
      }
      
      .toast-slide-exit[data-position*="left"] {
        transform: translateX(-100%);
      }
      
      .toast-slide-exit[data-position*="center"] {
        transform: translateY(-100%);
      }
      
      .toast-fade-enter {
        opacity: 0;
        transform: scale(0.8);
      }
      
      .toast-fade-exit {
        opacity: 0;
        transform: scale(0.8);
      }
      
      .toast-bounce-enter {
        opacity: 0;
        transform: scale(0.3);
      }
      
      .toast-bounce-exit {
        opacity: 0;
        transform: scale(0.3);
      }
      
      @media (max-width: 480px) {
        .toast-container {
          left: 10px !important;
          right: 10px !important;
          transform: none !important;
        }
        
        .toast-item {
          min-width: auto;
          max-width: none;
        }
      }
    `;
    
    document.head.appendChild(styles);
  }

  show(message, type = 'info', options = {}) {
    // 如果超過最大數量，移除最舊的
    if (this.toasts.length >= this.config.maxToasts) {
      this.remove(this.toasts[0].id);
    }

    const toastId = Date.now() + Math.random();
    const duration = options.duration || this.config.duration;
    const showClose = options.showClose !== false;
    
    const toast = this.createToastElement(message, type, toastId, showClose);
    this.container.appendChild(toast);
    
    const toastData = {
      id: toastId,
      element: toast,
      timer: null
    };
    
    this.toasts.push(toastData);
    
    // 顯示動畫
    this.animateIn(toast);
    
    // 進度條
    if (this.config.showProgress && duration > 0) {
      this.showProgress(toast, duration);
    }
    
    // 自動移除
    if (duration > 0) {
      toastData.timer = setTimeout(() => {
        this.remove(toastId);
      }, duration);
    }
    
    return toastId;
  }

  createToastElement(message, type, id, showClose) {
    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;
    toast.setAttribute('data-toast-id', id);
    toast.setAttribute('data-position', this.config.position);
    
    const icon = this.getIcon(type);
    const closeButton = showClose ? '<button class="toast-close" type="button">×</button>' : '';
    
    toast.innerHTML = `
      <div class="toast-content">
        ${icon ? `<span class="toast-icon">${icon}</span>` : ''}
        <span class="toast-message">${message}</span>
        ${closeButton}
      </div>
      ${this.config.showProgress ? '<div class="toast-progress"></div>' : ''}
    `;
    
    // 綁定關閉事件
    if (showClose) {
      const closeBtn = toast.querySelector('.toast-close');
      closeBtn.addEventListener('click', () => {
        this.remove(id);
      });
    }
    
    return toast;
  }

  getIcon(type) {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[type] || '';
  }

  animateIn(toast) {
    const animationClass = `toast-${this.config.animation}-enter`;
    toast.classList.add(animationClass);
    
    // 強制重新計算樣式
    toast.offsetHeight;
    
    setTimeout(() => {
      toast.classList.remove(animationClass);
    }, 10);
  }

  animateOut(toast, callback) {
    const animationClass = `toast-${this.config.animation}-exit`;
    toast.classList.add(animationClass);
    
    setTimeout(() => {
      if (callback) callback();
    }, 300);
  }

  showProgress(toast, duration) {
    const progressBar = toast.querySelector('.toast-progress');
    if (!progressBar) return;
    
    progressBar.style.width = '100%';
    
    setTimeout(() => {
      progressBar.style.width = '0%';
      progressBar.style.transitionDuration = `${duration}ms`;
    }, 10);
  }

  remove(toastId) {
    const toastIndex = this.toasts.findIndex(t => t.id === toastId);
    if (toastIndex === -1) return;
    
    const toastData = this.toasts[toastIndex];
    
    // 清除計時器
    if (toastData.timer) {
      clearTimeout(toastData.timer);
    }
    
    // 移除動畫
    this.animateOut(toastData.element, () => {
      if (toastData.element.parentNode) {
        toastData.element.remove();
      }
    });
    
    // 從陣列中移除
    this.toasts.splice(toastIndex, 1);
  }

  removeAll() {
    this.toasts.forEach(toast => {
      if (toast.timer) {
        clearTimeout(toast.timer);
      }
      if (toast.element.parentNode) {
        toast.element.remove();
      }
    });
    this.toasts = [];
  }

  // 便捷方法
  success(message, options = {}) {
    return this.show(message, 'success', options);
  }

  error(message, options = {}) {
    return this.show(message, 'error', options);
  }

  warning(message, options = {}) {
    return this.show(message, 'warning', options);
  }

  info(message, options = {}) {
    return this.show(message, 'info', options);
  }

  // 更新配置
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    if (this.container) {
      this.container.setAttribute('data-position', this.config.position);
    }
  }
}

// 創建預設實例
const toast = new Toast();

// 導出模組
// ES6 導出
export { Toast, toast };
export default toast;

// 使用範例：
/*
// 基本使用
toast.success('操作成功！');
toast.error('發生錯誤！');
toast.warning('注意事項');
toast.info('提示訊息');

// 自訂選項
toast.show('自訂訊息', 'success', {
  duration: 5000,
  showClose: true
});

// 創建自訂 Toast 實例
const customToast = new Toast({
  position: 'bottom-center',
  duration: 2000,
  maxToasts: 3,
  showProgress: true
});

customToast.success('自訂 Toast！');
*/