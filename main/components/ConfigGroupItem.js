/**
 * TM Label Editor - ConfigGroupItem Component
 * Editable group item for configuration modal
 */

class ConfigGroupItem extends TM.Component {
    static defaultProps = {
        /** Group name */
        name: '',
        /** Group color */
        color: '#666666',
        /** Is exclusive group */
        exclusive: true,
        /** Labels in group */
        labels: [],
        /** Callback when color changes */
        onColorChange: null,
        /** Callback when name changes */
        onNameChange: null,
        /** Callback when exclusive changes */
        onExclusiveChange: null,
        /** Callback when label removed */
        onLabelRemove: null,
        /** Callback when group deleted */
        onDelete: null,
        /** Callback when label dropped */
        onLabelDrop: null
    };

    initialState() {
        return {
            isDragOver: false
        };
    }

    /**
     * Handle color input change
     * @param {Event} e
     */
    handleColorChange(e) {
        this.props.onColorChange?.(this.props.name, e.target.value);
    }

    /**
     * Handle name input change
     * @param {Event} e
     */
    handleNameChange(e) {
        this.props.onNameChange?.(this.props.name, e.target.value);
    }

    /**
     * Handle exclusive checkbox change
     * @param {Event} e
     */
    handleExclusiveChange(e) {
        this.props.onExclusiveChange?.(this.props.name, e.target.checked);
    }

    /**
     * Handle label remove button click
     * @param {string} label
     */
    handleLabelRemove(label) {
        this.props.onLabelRemove?.(this.props.name, label);
    }

    /**
     * Handle delete group button click
     */
    handleDelete() {
        this.props.onDelete?.(this.props.name);
    }

    /**
     * Handle drag over
     * @param {DragEvent} e
     */
    handleDragOver(e) {
        e.preventDefault();
        this.state.isDragOver = true;
    }

    /**
     * Handle drag leave
     * @param {DragEvent} e
     */
    handleDragLeave(e) {
        this.state.isDragOver = false;
    }

    /**
     * Handle drop
     * @param {DragEvent} e
     */
    handleDrop(e) {
        e.preventDefault();
        this.state.isDragOver = false;

        const label = e.dataTransfer.getData('text/plain');
        if (label) {
            this.props.onLabelDrop?.(this.props.name, label);
        }
    }

    /**
     * Render a label chip
     * @param {string} label
     * @returns {string}
     */
    renderLabelChip(label) {
        return TM.html`
            <div class="le-config-chip">
                ${label}
                <button
                    class="le-config-chip__remove"
                    @click="${() => this.handleLabelRemove(label)}"
                    title="Quitar etiqueta">
                    ×
                </button>
            </div>
        `;
    }

    render() {
        const { name, color, exclusive, labels } = this.props;
        const { isDragOver } = this.state;

        const labelsContainerClass = isDragOver
            ? 'le-config-group__labels le-config-group__labels--dragover'
            : 'le-config-group__labels';

        return TM.html`
            <div class="le-config-group" data-group="${name}">
                <div class="le-config-group__header">
                    <input
                        type="color"
                        class="le-config-group__color"
                        value="${color}"
                        @change="${(e) => this.handleColorChange(e)}"
                        title="Color del grupo"
                    />
                    <input
                        type="text"
                        class="le-config-group__name"
                        value="${name}"
                        @change="${(e) => this.handleNameChange(e)}"
                        placeholder="Nombre del grupo"
                    />
                    <label class="le-config-group__exclusive">
                        <input
                            type="checkbox"
                            ${exclusive ? 'checked' : ''}
                            @change="${(e) => this.handleExclusiveChange(e)}"
                        />
                        Exclusivo
                    </label>
                    <button
                        class="le-btn le-btn--icon le-btn--danger"
                        @click="${() => this.handleDelete()}"
                        title="Eliminar grupo">
                        🗑️
                    </button>
                </div>

                <div
                    class="${labelsContainerClass}"
                    @dragover="${(e) => this.handleDragOver(e)}"
                    @dragleave="${(e) => this.handleDragLeave(e)}"
                    @drop="${(e) => this.handleDrop(e)}">
                    ${labels.length > 0
                        ? labels.map(label => this.renderLabelChip(label)).join('')
                        : '<span class="le-status--loading">Arrastra etiquetas aquí</span>'
                    }
                </div>
            </div>
        `;
    }
}

// Register component
if (typeof TM !== 'undefined') {
    TM.ConfigGroupItem = ConfigGroupItem;
}
