/**
 * LabelGroup Component
 * A group of labels with mutual exclusivity support
 */

class LabelGroup extends TM.Component {
    static defaultProps = {
        name: '',
        color: '#6366f1',
        exclusive: true,
        labels: [],
        currentLabels: [],
        onChange: null
    };

    initialState() {
        return {
            labelStates: this.initLabelStates()
        };
    }

    initLabelStates() {
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
        const { labelStates } = this.state;

        return TM.html`
            <div class="label-group">
                <div class="label-group__header">
                    <span class="label-group__indicator" style="background-color: ${color};"></span>
                    <span class="label-group__name">${name}</span>
                    ${exclusive ? '<span class="label-group__badge">exclusivo</span>' : ''}
                </div>
                <div class="label-group__labels" ref="labelsContainer">
                    ${labels.map(labelName => `
                        <span 
                            class="label-chip-placeholder" 
                            data-label="${labelName}"
                        ></span>
                    `).join('')}
                </div>
            </div>
        `;
    }

    onMount() {
        this.renderLabelChips();
    }

    onUpdate() {
        this.renderLabelChips();
    }

    renderLabelChips() {
        const { labels, color } = this.props;
        const { labelStates } = this.state;
        
        if (this._chips) {
            this._chips.forEach(chip => chip.destroy());
        }
        this._chips = [];

        labels.forEach(labelName => {
            const placeholder = this._el.querySelector(`[data-label="${labelName}"]`);
            if (!placeholder) return;
            
            const state = labelStates[labelName] || { selected: false, toRemove: false };
            
            const chip = new LabelChip({
                name: labelName,
                color: color,
                selected: state.selected,
                toRemove: state.toRemove,
                onClick: (name, newState) => this.handleLabelChange(name, newState),
                onDoubleClick: (name, newState) => this.handleLabelChange(name, newState)
            });
            
            chip.replace(placeholder);
            this._chips.push(chip);
            this.addChild(labelName, chip);
        });
    }

    handleLabelChange(labelName, newState) {
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
        
        this.notifyChange();
    }

    notifyChange() {
        const changes = this.getChanges();
        this.props.onChange?.(this.props.name, changes);
        this.emit('change', { groupName: this.props.name, changes });
    }

    /**
     * Get labels to add and remove
     */
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

    /**
     * Reset all labels to initial state
     */
    reset() {
        this.state.labelStates = this.initLabelStates();
        this._chips?.forEach(chip => {
            const state = this.state.labelStates[chip.getName()];
            if (state.selected) {
                chip.setSelected(true);
            } else {
                chip.reset();
            }
        });
    }

    onDestroy() {
        this._chips?.forEach(chip => chip.destroy());
    }
}

window.LabelGroup = LabelGroup;