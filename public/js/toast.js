const Toast = {
    init() {
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        document.body.appendChild(this.container);

        const style = document.createElement('style');
        style.innerHTML = `
            #toast-container {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .toast {
                background: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                display: flex;
                align-items: center;
                gap: 12px;
                min-width: 300px;
                transform: translateX(120%);
                transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                border-left: 4px solid #333;
            }
            .toast.show {
                transform: translateX(0);
            }
            .toast-icon {
                font-size: 1.2rem;
            }
            .toast-content {
                flex: 1;
            }
            .toast-title {
                font-weight: 600;
                font-size: 0.95rem;
                margin-bottom: 2px;
            }
            .toast-message {
                font-size: 0.85rem;
                color: #666;
            }
            .toast-success { border-left-color: #10b981; }
            .toast-success .toast-icon { color: #10b981; }
            .toast-error { border-left-color: #ef4444; }
            .toast-error .toast-icon { color: #ef4444; }
            .toast-info { border-left-color: #3b82f6; }
            .toast-info .toast-icon { color: #3b82f6; }
        `;
        document.head.appendChild(style);
    },

    show(type, title, message, duration = 5000) {
        if (!this.container) this.init();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        let icon = 'info-circle';
        if (type === 'success') icon = 'check-circle';
        if (type === 'error') icon = 'exclamation-circle';

        toast.innerHTML = `
            <div class="toast-icon"><i class="fas fa-${icon}"></i></div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <div class="toast-close" style="cursor:pointer; color:#999;"><i class="fas fa-times"></i></div>
        `;

        this.container.appendChild(toast);

        // Trigger reflow
        toast.offsetHeight;
        toast.classList.add('show');

        const remove = () => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        };

        toast.querySelector('.toast-close').onclick = remove;
        setTimeout(remove, duration);
    }
};

window.Toast = Toast;
