/**
 * TM Label Editor - LabelGroupsModal Component
 * Modal for selecting/deselecting labels by groups
 * Uses event delegation for label interactions
 */

(function() {
    'use strict';

    const { Component, html } = TM;

    class LabelGroupsModal extends Component {
        static defaultProps = {
            groups: {},
            selectedLabels: new Set(),
            labelsToRemove: new Set(),
            currentLabels: new Set(),
            commands: { toAdd: [], toRemove: [] },
            onClose: null,
            onApply: null,
            onOpenConfig: null,
            onLabelClick: null,
            onLabelDoubleClick: null
        };

        // ═══════════════════════════════════════════════════════════
        // LIFECYCLE
        // ═══════════════════════════════════════════════════════════

        onMount() {
            // Event delegation for label clicks
            this._el.addEventListener('click', (e) => {
                const labelEl = e.target.closest('[data-label]');
                if (labelEl && !e.target.closest('.le-config-chip__remove')) {
                    const label = labelEl.dataset.label;
                    const group = labelEl.dataset.group;
                    this.props.onLabelClick?.(label, group);
                }
            });

            // Event delegation for double clicks (mark for removal)
            this._el.addEventListener('dblclick', (e) => {
                const labelEl = e.target.closest('[data-label]');
                if (labelEl) {
                    const label = labelEl.dataset.label;
                    this.props.onLabelDoubleClick?.(label);
                }
            });
        }

        // ═══════════════════════════════════════════════════════════
        // HANDLERS
        // ═══════════════════════════════════════════════════════════

        handleOverlayClick(e) {
            if (e.target.classList.contains('le-overlay')) {
                this.props.onClose?.();
            }
        }

        handleClose() {
            this.props.onClose?.();
        }

        handleApply() {
            this.props.onApply?.();
        }

        handleOpenConfig() {
            this.props.onOpenConfig?.();
        }

        // ═══════════════════════════════════════════════════════════
        // RENDER HELPERS
        // ═══════════════════════════════════════════════════════════

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

        // ═══════════════════════════════════════════════════════════
        // RENDER
        // ═══════════════════════════════════════════════════════════

        render() {
            const { groups, selectedLabels, labelsToRemove, currentLabels, commands } = this.props;
            const hasChanges = commands.toAdd.length > 0 || commands.toRemove.length > 0;
            const groupEntries = Object.entries(groups);

            // Use renderLabelGroup function (defined in LabelGroup.js)
            const groupsHtml = groupEntries.length > 0
                ? groupEntries.map(([name, group]) => renderLabelGroup({
                    name,
                    color: group.color,
                    exclusive: group.exclusive,
                    labels: group.labels,
                    selectedLabels,
                    labelsToRemove,
                    currentLabels
                })).join('')
                : '<div class="le-status le-status--loading">No hay grupos configurados. Haz clic en Configurar.</div>';

            return html`
                <div class="le-overlay" @click="handleOverlayClick">
                    <div class="le-modal">
                        <div class="le-modal__header">
                            <span class="le-modal__title">Gestionar Etiquetas</span>
                            <button class="le-btn le-btn--icon" @click="handleOpenConfig" title="Configurar grupos">
                                Configurar
                            </button>
                        </div>

                        <div class="le-modal__info">
                            Clic = seleccionar | Doble clic = eliminar
                        </div>

                        <div class="le-modal__content">
                            ${groupsHtml}
                        </div>

                        <div class="le-modal__preview">
                            ${this.renderPreview()}
                        </div>

                        <div class="le-modal__footer">
                            <button class="le-btn le-btn--primary" @click="handleApply" ${!hasChanges ? 'disabled' : ''}>
                                Aplicar
                            </button>
                            <button class="le-btn" @click="handleClose">
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // EXPORT
    // ═══════════════════════════════════════════════════════════════

    globalThis.LabelGroupsModal = LabelGroupsModal;

    if (typeof TM !== 'undefined') {
        TM.LabelGroupsModal = LabelGroupsModal;
    }

})();
