/**
 * LabelChip Component
 * Represents a single label with selection states
 */

class LabelChip extends TM.Component {
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

    initialState() {
        return {
            selected: this.props.selected,
            toRemove: this.props.toRemove
        };
    }

    render() {
        const { name, color, disabled, showRemoveButton } = this.props;
        const { selected, toRemove } = this.state;
        
        const classes = TM.classNames(
            'label-chip',
            selected && !toRemove && 'label-chip--selected',
            toRemove && 'label-chip--remove',
            disabled && 'label-chip--disabled'
        );
        
        const bgColor = color || 'var(--tm-bg-tertiary)';
        const textColor = this.getContrastColor(bgColor);
        
        let style = '';
        if (color) {
            if (selected && !toRemove) {
                style = `background-color: ${bgColor}; color: ${textColor}; border-color: ${bgColor};`;
            } else if (toRemove) {
                style = `background-color: var(--tm-danger-light); color: var(--tm-danger); border-color: var(--tm-danger); text-decoration: line-through;`;
            } else {
                style = `border-color: ${bgColor}; color: ${bgColor};`;
            }
        }

        return TM.html`
            <span class="${classes}" style="${style}" @click="handleClick" @dblclick="handleDoubleClick">
                <span class="label-chip__text">${name}</span>
                ${showRemoveButton ? `
                    <button class="label-chip__remove" @click="handleRemove" title="Eliminar">×</button>
                ` : ''}
            </span>
        `;
    }

    handleClick(e) {
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
        
        this.props.onClick?.(this.getName(), this.getState());
        this.emit('change', { name: this.getName(), ...this.getState() });
    }

    handleDoubleClick(e) {
        if (this.props.disabled) return;
        if (e.target.classList.contains('label-chip__remove')) return;
        
        this.state.selected = false;
        this.state.toRemove = true;
        
        this.props.onDoubleClick?.(this.getName(), this.getState());
        this.emit('change', { name: this.getName(), ...this.getState() });
    }

    handleRemove(e) {
        e.stopPropagation();
        this.props.onRemove?.(this.getName());
        this.emit('remove', { name: this.getName() });
    }

    getContrastColor(hexColor) {
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
    }

    setToRemove(toRemove) {
        this.state.toRemove = toRemove;
        this.state.selected = false;
    }

    reset() {
        this.state.selected = false;
        this.state.toRemove = false;
    }

    isSelected() { return this.state.selected; }
    isToRemove() { return this.state.toRemove; }
}

window.LabelChip = LabelChip;