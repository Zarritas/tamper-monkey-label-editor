/**
 * TM Label Editor - LabelGroupsModal Component
 * Main modal for selecting and removing labels
 */

class LabelGroupsModal extends TM.Component {
    static defaultProps = {
        /** Groups configuration */
        groups: {},
        /** Currently selected labels */
        selectedLabels: new Set(),
        /** Labels marked for removal */
        labelsToRemove: new Set(),
        /** Current labels on issue/MR */
        currentLabels: new Set(),
        /** Commands to apply */
        commands: { toAdd: [], toRemove: [] },
        /** Callback when modal closed */
        onClose: null,
        /** Callback when apply clicked */
        onApply: null,
        /** Callback when config button clicked */
        onOpenConfig: null,
        /** Callback when label clicked */
        onLabelClick: null,
        /** Callback when label double-clicked */
        onLabelDoubleClick: null
    };

    /**
     * Handle overlay click (close modal)
     * @param {Event} e
     */
    handleOverlayClick(e) {
        if (e.target.classList.contains('le-overlay')) {
            this.props.onClose?.();
        }
    }

    /**
     * Render preview section
     * @returns {string}
     */
    renderPreview() {
        const { commands } = this.props;
        const parts = [];

        if (commands.toAdd.length > 0) {
            const labelStr = commands.toAdd.map(l => `~"${l}"`).join(' ');
            parts.push(`<span class="le-preview__add">/label ${labelStr}</span>`);
        }
        if (commands.toRemove.length > 0) {
            const labelStr = commands.toRemove.map(l => `~"${l}"`).join(' ');
            parts.push(`<span class="le-preview__remove">/unlabel ${labelStr}</span>`);
        }

        return parts.length > 0
            ? parts.join('<br>')
            : '<span class="le-preview__empty">Sin cambios</span>';
    }

    /**
     * Render a label group
     * @param {string} name
     * @param {Object} group
     * @returns {string}
     */
    renderGroup(name, group) {
        const { selectedLabels, labelsToRemove, currentLabels, onLabelClick, onLabelDoubleClick } = this.props;

        const labelGroup = new LabelGroup({
            name,
            color: group.color,
            exclusive: group.exclusive,
            labels: group.labels,
            selectedLabels,
            labelsToRemove,
            currentLabels,
            onLabelClick,
            onLabelDoubleClick
        });

        return labelGroup.render();
    }

    render() {
        const { groups, commands } = this.props;
        const hasChanges = commands.toAdd.length > 0 || commands.toRemove.length > 0;
        const groupEntries = Object.entries(groups);

        return TM.html`
            <div class="le-overlay" @click="${(e) => this.handleOverlayClick(e)}">
                <div class="le-modal">
                    <div class="le-modal__header">
                        <span class="le-modal__title">Gestionar Etiquetas</span>
                        <button
                            class="le-btn le-btn--icon"
                            @click="${() => this.props.onOpenConfig?.()}"
                            title="Configurar grupos">
                            ⚙️
                        </button>
                    </div>

                    <div class="le-modal__info">
                        Clic = seleccionar | Doble clic = eliminar
                    </div>

                    <div class="le-modal__content">
                        ${groupEntries.length > 0
                            ? groupEntries.map(([name, group]) => this.renderGroup(name, group)).join('')
                            : '<div class="le-status le-status--loading">No hay grupos configurados. Haz clic en ⚙️ para configurar.</div>'
                        }
                    </div>

                    <div class="le-modal__preview">
                        ${this.renderPreview()}
                    </div>

                    <div class="le-modal__footer">
                        <button
                            class="le-btn le-btn--primary"
                            @click="${() => this.props.onApply?.()}"
                            ${!hasChanges ? 'disabled' : ''}>
                            ✅ Aplicar
                        </button>
                        <button
                            class="le-btn"
                            @click="${() => this.props.onClose?.()}">
                            ❌ Cancelar
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}

// Register component
if (typeof TM !== 'undefined') {
    TM.LabelGroupsModal = LabelGroupsModal;
}
