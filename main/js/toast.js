/**
 * Label Groups - Toast Notifications
 */

const Toast = (function() {
    'use strict';

    let container = null;

    function getContainer() {
        if (!container || !document.body.contains(container)) {
            container = document.createElement('div');
            container.className = 'lg-toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    function show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `lg-toast lg-toast--${type}`;

        const icons = { success: '\u2705', error: '\u274C', warning: '\u26A0\uFE0F', info: '\u2139\uFE0F' };
        toast.textContent = `${icons[type] || ''} ${message}`;

        const c = getContainer();
        c.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add('lg-toast--visible'));

        setTimeout(() => {
            toast.classList.remove('lg-toast--visible');
            toast.addEventListener('transitionend', () => toast.remove(), { once: true });
            setTimeout(() => toast.remove(), 500);
        }, duration);
    }

    return {
        success: (msg, dur) => show(msg, 'success', dur),
        error: (msg, dur) => show(msg, 'error', dur),
        warning: (msg, dur) => show(msg, 'warning', dur),
        info: (msg, dur) => show(msg, 'info', dur)
    };
})();

window.Toast = Toast;
