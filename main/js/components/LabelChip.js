/**
 * LabelChip Component
 * Represents a single label with selection states
 */

class LabelChip {
    static defaultProps = {
        name: '',
        color: null,
        selected: false,
        toRemove: false,
        disabled: false,
        showRemoveButton: false,
        onClick: null,
        onDoubleClick: null,
        onRemove: null
    };

    constructor(props = {}) {
        this.props = { ...LabelChip.defaultProps, ...props };
        this.state = {
            selected: this.props.selected,
            toRemove: this.props.toRemove
        };
        this.el = null;
    }

    render() {
        const { name, color, disabled, showRemoveButton } = this.props;
        const { selected, toRemove } = this.state;

        const classes = Utils.classNames(
            'label-chip',
            selected && !toRemove && 'label-chip--selected',
            toRemove && 'label-chip--remove',
            disabled && 'label-chip--disabled'
        );

        const bgColor = color || 'var(--lg-bg-tertiary)';
        const textColor = this._getContrastColor(bgColor);

        let style = '';
        if (color) {
            if (selected && !toRemove) {
                style = `background-color: ${bgColor}; color: ${textColor}; border-color: ${bgColor};`;
            } else if (toRemove) {
                style = `background-color: var(--lg-danger-light); color: var(--lg-danger); border-color: var(--lg-danger); text-decoration: line-through;`;
            } else {
                style = `border-color: ${bgColor}; color: ${bgColor};`;
            }
        }

        const span = document.createElement('span');
        span.className = classes;
        span.style.cssText = style;

        const textSpan = document.createElement('span');
        textSpan.className = 'label-chip__text';
        textSpan.textContent = name;
        span.appendChild(textSpan);

        if (showRemoveButton) {
            const removeBtn = document.createElement('button');
            removeBtn.className = 'label-chip__remove';
            removeBtn.title = 'Eliminar';
            removeBtn.textContent = '\u00D7';
            removeBtn.addEventListener('click', (e) => this._handleRemove(e));
            span.appendChild(removeBtn);
        }

        span.addEventListener('click', (e) => this._handleClick(e));
        span.addEventListener('dblclick', (e) => this._handleDoubleClick(e));

        this.el = span;
        return span;
    }

    mount(container) {
        if (!this.el) this.render();
        container.appendChild(this.el);
    }

    replace(placeholder) {
        if (!this.el) this.render();
        placeholder.replaceWith(this.el);
    }

    _handleClick(e) {
        if (this.props.disabled) return;
        if (e.target.classList.contains('label-chip__remove')) return;

        if (this.state.toRemove) {
            this.state.toRemove = false;
            this.state.selected = false;
        } else if (this.state.selected) {
            this.state.selected = false;
        } else {
            this.state.selected = true;
        }

        this._updateDOM();
        this.props.onClick?.(this.getName(), this.getState());
    }

    _handleDoubleClick(e) {
        if (this.props.disabled) return;
        if (e.target.classList.contains('label-chip__remove')) return;

        this.state.selected = false;
        this.state.toRemove = true;

        this._updateDOM();
        this.props.onDoubleClick?.(this.getName(), this.getState());
    }

    _handleRemove(e) {
        e.stopPropagation();
        this.props.onRemove?.(this.getName());
    }

    _updateDOM() {
        if (!this.el) return;
        const { color } = this.props;
        const { selected, toRemove } = this.state;

        this.el.className = Utils.classNames(
            'label-chip',
            selected && !toRemove && 'label-chip--selected',
            toRemove && 'label-chip--remove',
            this.props.disabled && 'label-chip--disabled'
        );

        if (color) {
            const textColor = this._getContrastColor(color);
            if (selected && !toRemove) {
                this.el.style.cssText = `background-color: ${color}; color: ${textColor}; border-color: ${color};`;
            } else if (toRemove) {
                this.el.style.cssText = `background-color: var(--lg-danger-light); color: var(--lg-danger); border-color: var(--lg-danger); text-decoration: line-through;`;
            } else {
                this.el.style.cssText = `border-color: ${color}; color: ${color};`;
            }
        }
    }

    _getContrastColor(hexColor) {
        if (!hexColor || !hexColor.startsWith('#')) return 'inherit';

        const hex = hexColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

        return luminance > 0.5 ? '#000000' : '#ffffff';
    }

    getName() { return this.props.name; }

    getState() {
        return {
            selected: this.state.selected,
            toRemove: this.state.toRemove
        };
    }

    setSelected(selected) {
        this.state.selected = selected;
        this.state.toRemove = false;
        this._updateDOM();
    }

    setToRemove(toRemove) {
        this.state.toRemove = toRemove;
        this.state.selected = false;
        this._updateDOM();
    }

    reset() {
        this.state.selected = false;
        this.state.toRemove = false;
        this._updateDOM();
    }

    isSelected() { return this.state.selected; }
    isToRemove() { return this.state.toRemove; }

    destroy() {
        this.el?.remove();
        this.el = null;
    }
}

window.LabelChip = LabelChip;
