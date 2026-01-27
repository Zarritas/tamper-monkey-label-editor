/**
 * TM Label Editor - LabelGroup Component
 * Displays a group of labels with header and items
 */

class LabelGroup extends TM.Component {
    static defaultProps = {
        /** Group name */
        name: '',
        /** Group color */
        color: '#666666',
        /** Is exclusive group */
        exclusive: false,
        /** Labels in group */
        labels: [],
        /** Currently selected labels */
        selectedLabels: new Set(),
        /** Labels marked for removal */
        labelsToRemove: new Set(),
        /** Current labels on issue/MR */
        currentLabels: new Set(),
        /** Callback when label clicked */
        onLabelClick: null,
        /** Callback when label double-clicked */
        onLabelDoubleClick: null
    };

    /**
     * Get CSS classes for a label
     * @param {string} label
     * @returns {string}
     */
    getLabelClasses(label) {
        const { currentLabels, selectedLabels, labelsToRemove } = this.props;
        const classes = ['le-label'];

        if (currentLabels.has(label)) {
            classes.push('le-label--current');
        }
        if (selectedLabels.has(label)) {
            classes.push('le-label--selected');
        }
        if (labelsToRemove.has(label)) {
            classes.push('le-label--remove');
        }

        return classes.join(' ');
    }

    /**
     * Handle label click
     * @param {Event} e
     */
    handleLabelClick(e) {
        const label = e.target.dataset.label;
        if (label && this.props.onLabelClick) {
            this.props.onLabelClick(label, this.props.name);
        }
    }

    /**
     * Handle label double-click
     * @param {Event} e
     */
    handleLabelDoubleClick(e) {
        const label = e.target.dataset.label;
        if (label && this.props.onLabelDoubleClick) {
            this.props.onLabelDoubleClick(label);
        }
    }

    render() {
        const { name, color, exclusive, labels } = this.props;

        return TM.html`
            <div class="le-group">
                <div class="le-group__header">
                    <span class="le-group__dot" style="background: ${color}"></span>
                    <span class="le-group__name">${name}</span>
                    ${exclusive ? '<span class="le-group__badge">Exclusivo</span>' : ''}
                </div>
                <div class="le-group__items">
                    ${labels.map(label => TM.html`
                        <div
                            class="${this.getLabelClasses(label)}"
                            data-label="${label}"
                            @click="${(e) => this.handleLabelClick(e)}"
                            @dblclick="${(e) => this.handleLabelDoubleClick(e)}">
                            ${label}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}

// Register component
if (typeof TM !== 'undefined') {
    TM.LabelGroup = LabelGroup;
}
