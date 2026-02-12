/**
 * Label Groups - Simple Modal
 */

class SimpleModal {
    constructor(options = {}) {
        this.options = {
            width: '420px',
            closeOnOverlay: true,
            closeOnEsc: true,
            onClose: null,
            ...options
        };
        this.el = null;
        this.overlay = null;
        this.contentContainer = null;
        this._isOpen = false;
        this._escHandler = (e) => {
            if (e.key === 'Escape' && this._isOpen && this.options.closeOnEsc) {
                this.close();
            }
        };
        this._build();
    }

    _build() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'lg-modal-overlay';

        if (this.options.closeOnOverlay) {
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) this.close();
            });
        }

        this.el = document.createElement('div');
        this.el.className = 'lg-modal';
        this.el.style.width = this.options.width;

        this.contentContainer = document.createElement('div');
        this.contentContainer.className = 'lg-modal__content';
        this.el.appendChild(this.contentContainer);

        this.overlay.appendChild(this.el);
    }

    mount(parent) {
        parent.appendChild(this.overlay);
    }

    open() {
        this._isOpen = true;
        this.overlay.classList.add('lg-modal-overlay--visible');
        document.addEventListener('keydown', this._escHandler);
    }

    close() {
        this._isOpen = false;
        this.overlay.classList.remove('lg-modal-overlay--visible');
        document.removeEventListener('keydown', this._escHandler);
        this.options.onClose?.();
    }

    setContent(content) {
        this.contentContainer.innerHTML = '';
        if (typeof content === 'string') {
            this.contentContainer.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            this.contentContainer.appendChild(content);
        } else if (content && typeof content.render === 'function') {
            // Component instance
            const rendered = content.el || content.render();
            if (rendered instanceof HTMLElement) {
                this.contentContainer.appendChild(rendered);
            }
        }
    }

    isOpen() {
        return this._isOpen;
    }

    destroy() {
        document.removeEventListener('keydown', this._escHandler);
        this.overlay?.remove();
        this.el = null;
        this.overlay = null;
        this.contentContainer = null;
    }
}

window.SimpleModal = SimpleModal;
