/**
 * LabelGroup Component
 * A group of labels with mutual exclusivity support
 */

class LabelGroup {
    static defaultProps = {
        name: '',
        color: '#6366f1',
        exclusive: true,
        labels: [],
        currentLabels: [],
        onChange: null
    };

    constructor(props = {}) {
        this.props = { ...LabelGroup.defaultProps, ...props };
        this.state = {
            labelStates: this._initLabelStates()
        };
        this.el = null;
        this._chips = [];
        this._changeTimeout = null;
    }

    _initLabelStates() {
        const states = {};
        const { labels, currentLabels } = this.props;

        labels.forEach(label => {
            states[label] = {
                selected: currentLabels.includes(label),
                toRemove: false
            };
        });

        return states;
    }

    render() {
        const { name, color, exclusive, labels } = this.props;

        const div = document.createElement('div');
        div.className = 'label-group';

        // Header
        const header = document.createElement('div');
        header.className = 'label-group__header';

        const indicator = document.createElement('span');
        indicator.className = 'label-group__indicator';
        indicator.style.backgroundColor = color;
        header.appendChild(indicator);

        const nameSpan = document.createElement('span');
        nameSpan.className = 'label-group__name';
        nameSpan.textContent = name;
        header.appendChild(nameSpan);

        if (exclusive) {
            const badge = document.createElement('span');
            badge.className = 'label-group__badge';
            badge.textContent = 'exclusivo';
            header.appendChild(badge);
        }

        div.appendChild(header);

        // Labels container
        const labelsContainer = document.createElement('div');
        labelsContainer.className = 'label-group__labels';

        labels.forEach(labelName => {
            const state = this.state.labelStates[labelName] || { selected: false, toRemove: false };

            const chip = new LabelChip({
                name: labelName,
                color: color,
                selected: state.selected,
                toRemove: state.toRemove,
                onClick: (n, newState) => this._handleLabelChange(n, newState),
                onDoubleClick: (n, newState) => this._handleLabelChange(n, newState)
            });

            chip.mount(labelsContainer);
            this._chips.push(chip);
        });

        div.appendChild(labelsContainer);
        this.el = div;
        return div;
    }

    mount(container) {
        if (!this.el) this.render();
        container.appendChild(this.el);
    }

    _handleLabelChange(labelName, newState) {
        const { exclusive } = this.props;

        if (exclusive && newState.selected && !newState.toRemove) {
            this._chips.forEach(chip => {
                if (chip.getName() !== labelName && chip.isSelected()) {
                    chip.reset();
                    this.state.labelStates[chip.getName()] = { selected: false, toRemove: false };
                }
            });
        }

        this.state.labelStates[labelName] = newState;
        this._notifyChange();
    }

    _notifyChange() {
        if (this._changeTimeout) {
            clearTimeout(this._changeTimeout);
        }

        this._changeTimeout = setTimeout(() => {
            const changes = this.getChanges();
            this.props.onChange?.(this.props.name, changes);
            this._changeTimeout = null;
        }, 50);
    }

    getChanges() {
        const { currentLabels } = this.props;
        const { labelStates } = this.state;

        const toAdd = [];
        const toRemove = [];

        Object.entries(labelStates).forEach(([label, state]) => {
            const wasActive = currentLabels.includes(label);

            if (state.selected && !wasActive) {
                toAdd.push(label);
            } else if (state.toRemove && wasActive) {
                toRemove.push(label);
            } else if (!state.selected && !state.toRemove && wasActive) {
                toRemove.push(label);
            }
        });

        return { toAdd, toRemove };
    }

    reset() {
        this.state.labelStates = this._initLabelStates();
        this._chips.forEach(chip => {
            const state = this.state.labelStates[chip.getName()];
            if (state?.selected) {
                chip.setSelected(true);
            } else {
                chip.reset();
            }
        });
    }

    destroy() {
        if (this._changeTimeout) {
            clearTimeout(this._changeTimeout);
            this._changeTimeout = null;
        }
        this._chips.forEach(chip => chip.destroy());
        this._chips = [];
        this.el?.remove();
        this.el = null;
    }
}

window.LabelGroup = LabelGroup;
