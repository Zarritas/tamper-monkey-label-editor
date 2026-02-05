/**
 * TM Label Editor - LabelConfigModal Component
 * Modal for configuring label groups
 * Uses event delegation for all interactions
 */

(function() {
    'use strict';

    const { Component, html } = TM;

    class LabelConfigModal extends Component {
        static defaultProps = {
            groups: {},
            projectLabels: [],
            isLoading: false,
            onClose: null,
            onSave: null,
            onRefreshLabels: null
        };

        initialState() {
            return {
                editGroups: JSON.parse(JSON.stringify(this.props.groups)),
                draggedLabel: null,
                groupSelector: null,
                dragOverGroup: null
            };
        }

        // ═══════════════════════════════════════════════════════════
        // LIFECYCLE
        // ═══════════════════════════════════════════════════════════

        onMount() {
            this._setupEventDelegation();
        }

        _setupEventDelegation() {
            // Click delegation
            this._el.addEventListener('click', (e) => {
                // Remove label from group
                const removeBtn = e.target.closest('[data-remove-label]');
                if (removeBtn) {
                    const label = removeBtn.dataset.removeLabel;
                    const group = removeBtn.dataset.fromGroup;
                    this._handleLabelRemove(group, label);
                    return;
                }

                // Delete group
                const deleteBtn = e.target.closest('[data-delete-group]');
                if (deleteBtn) {
                    const group = deleteBtn.dataset.deleteGroup;
                    this._handleGroupDelete(group);
                    return;
                }

                // Group selector click
                const selectorBtn = e.target.closest('.le-group-selector__btn');
                if (selectorBtn) {
                    const groupName = selectorBtn.dataset.group;
                    if (groupName && this.state.groupSelector) {
                        this._handleLabelDrop(groupName, this.state.groupSelector.label);
                        this.state.groupSelector = null;
                    }
                    return;
                }

                // Available label click (show selector)
                const availableLabel = e.target.closest('.le-available-label:not(.le-available-label--used)');
                if (availableLabel) {
                    const label = availableLabel.dataset.label;
                    const rect = availableLabel.getBoundingClientRect();
                    this.state.groupSelector = { label, x: rect.left, y: rect.bottom + 5 };
                    return;
                }

                // Cancel selector
                if (e.target.closest('.le-group-selector__cancel')) {
                    this.state.groupSelector = null;
                    return;
                }
            });

            // Change delegation
            this._el.addEventListener('change', (e) => {
                // Color change
                const colorInput = e.target.closest('[data-color-group]');
                if (colorInput) {
                    const group = colorInput.dataset.colorGroup;
                    this._handleGroupColorChange(group, colorInput.value);
                    return;
                }

                // Name change
                const nameInput = e.target.closest('[data-name-group]');
                if (nameInput) {
                    const oldName = nameInput.dataset.nameGroup;
                    this._handleGroupNameChange(oldName, nameInput.value);
                    return;
                }

                // Exclusive change
                const exclusiveInput = e.target.closest('[data-exclusive-group]');
                if (exclusiveInput) {
                    const group = exclusiveInput.dataset.exclusiveGroup;
                    this._handleGroupExclusiveChange(group, exclusiveInput.checked);
                    return;
                }
            });

            // Drag events for available labels
            this._el.addEventListener('dragstart', (e) => {
                const labelEl = e.target.closest('.le-available-label:not(.le-available-label--used)');
                if (labelEl) {
                    const label = labelEl.dataset.label;
                    this.state.draggedLabel = label;
                    e.dataTransfer.setData('text/plain', label);
                }
            });

            // Drag over for drop targets
            this._el.addEventListener('dragover', (e) => {
                const dropTarget = e.target.closest('[data-drop-target]');
                if (dropTarget) {
                    e.preventDefault();
                    const groupName = dropTarget.dataset.dropTarget;
                    if (this.state.dragOverGroup !== groupName) {
                        this.state.dragOverGroup = groupName;
                    }
                }
            });

            this._el.addEventListener('dragleave', (e) => {
                const dropTarget = e.target.closest('[data-drop-target]');
                if (dropTarget && !dropTarget.contains(e.relatedTarget)) {
                    this.state.dragOverGroup = null;
                }
            });

            this._el.addEventListener('drop', (e) => {
                e.preventDefault();
                const dropTarget = e.target.closest('[data-drop-target]');
                if (dropTarget) {
                    const groupName = dropTarget.dataset.dropTarget;
                    const label = e.dataTransfer.getData('text/plain');
                    if (label) {
                        this._handleLabelDrop(groupName, label);
                    }
                }
                this.state.dragOverGroup = null;
                this.state.draggedLabel = null;
            });
        }

        // ═══════════════════════════════════════════════════════════
        // INTERNAL HANDLERS
        // ═══════════════════════════════════════════════════════════

        _getUsedLabels() {
            const used = new Set();
            Object.values(this.state.editGroups).forEach(group => {
                group.labels.forEach(l => used.add(l));
            });
            return used;
        }

        _handleGroupColorChange(groupName, color) {
            if (this.state.editGroups[groupName]) {
                this.state.editGroups[groupName].color = color;
                this.state.editGroups = { ...this.state.editGroups };
            }
        }

        _handleGroupNameChange(oldName, newName) {
            if (oldName === newName || this.state.editGroups[newName]) return;
            const groupData = this.state.editGroups[oldName];
            const { [oldName]: removed, ...rest } = this.state.editGroups;
            this.state.editGroups = { ...rest, [newName]: groupData };
        }

        _handleGroupExclusiveChange(groupName, exclusive) {
            if (this.state.editGroups[groupName]) {
                this.state.editGroups[groupName].exclusive = exclusive;
                this.state.editGroups = { ...this.state.editGroups };
            }
        }

        _handleLabelRemove(groupName, label) {
            if (this.state.editGroups[groupName]) {
                this.state.editGroups[groupName].labels =
                    this.state.editGroups[groupName].labels.filter(l => l !== label);
                this.state.editGroups = { ...this.state.editGroups };
            }
        }

        _handleGroupDelete(groupName) {
            const { [groupName]: removed, ...rest } = this.state.editGroups;
            this.state.editGroups = rest;
        }

        _handleLabelDrop(groupName, label) {
            if (!this.state.editGroups[groupName]) return;
            if (this.state.editGroups[groupName].labels.includes(label)) return;

            // Remove from other groups first
            Object.keys(this.state.editGroups).forEach(name => {
                this.state.editGroups[name].labels =
                    this.state.editGroups[name].labels.filter(l => l !== label);
            });

            // Add to target group
            this.state.editGroups[groupName].labels.push(label);
            this.state.editGroups = { ...this.state.editGroups };
        }

        // ═══════════════════════════════════════════════════════════
        // PUBLIC HANDLERS (for @click bindings)
        // ═══════════════════════════════════════════════════════════

        handleOverlayClick(e) {
            if (e.target.classList.contains('le-overlay')) {
                this.state.groupSelector = null;
                this.props.onClose?.();
            }
        }

        handleClose() {
            this.props.onClose?.();
        }

        handleSave() {
            this.props.onSave?.(this.state.editGroups);
        }

        handleRefresh() {
            this.props.onRefreshLabels?.();
        }

        handleAddGroup() {
            const groupCount = Object.keys(this.state.editGroups).length + 1;
            const newName = `Grupo ${groupCount}`;
            this.state.editGroups = {
                ...this.state.editGroups,
                [newName]: { color: '#666666', exclusive: true, labels: [] }
            };
        }

        // ═══════════════════════════════════════════════════════════
        // RENDER
        // ═══════════════════════════════════════════════════════════

        render() {
            const { projectLabels, isLoading } = this.props;
            const { editGroups, groupSelector, dragOverGroup } = this.state;
            const usedLabels = this._getUsedLabels();
            const groupEntries = Object.entries(editGroups);

            // Use renderConfigGroupItem function (defined in ConfigGroupItem.js)
            const groupsHtml = groupEntries.map(([name, group]) =>
                renderConfigGroupItem({
                    name,
                    color: group.color,
                    exclusive: group.exclusive,
                    labels: group.labels,
                    isDragOver: dragOverGroup === name
                })
            ).join('');

            // Render available labels
            let labelsListHtml = '';
            if (isLoading) {
                labelsListHtml = '<div class="le-spinner"></div>';
            } else if (projectLabels.length > 0) {
                labelsListHtml = projectLabels.map(label => {
                    const used = usedLabels.has(label.name);
                    const className = used ? 'le-available-label le-available-label--used' : 'le-available-label';
                    return `
                        <div
                            class="${className}"
                            draggable="${!used}"
                            data-label="${label.name}"
                            style="background: ${label.color}20; border: 1px solid ${label.color}">
                            ${label.name}
                        </div>
                    `;
                }).join('');
            } else {
                labelsListHtml = '<span class="le-status--loading">No hay etiquetas</span>';
            }

            // Render group selector popup
            let selectorHtml = '';
            if (groupSelector) {
                const selectorButtons = groupEntries.map(([name, group]) => `
                    <button class="le-group-selector__btn" data-group="${name}">
                        <span class="le-group__dot" style="background: ${group.color}"></span>
                        ${name}
                    </button>
                `).join('');

                selectorHtml = `
                    <div class="le-group-selector" style="left: ${groupSelector.x}px; top: ${groupSelector.y}px;">
                        <div class="le-group-selector__title">Añadir a grupo:</div>
                        ${selectorButtons}
                        <button class="le-group-selector__cancel">Cancelar</button>
                    </div>
                `;
            }

            const projectName = LabelEditorStorage?.getCurrentProjectName?.() || '';

            return html`
                <div class="le-overlay" @click="handleOverlayClick">
                    <div class="le-config-modal">
                        <div class="le-config-modal__header">
                            Configuracion de Grupos
                        </div>

                        <div class="le-modal__info">
                            <div><strong>Proyecto:</strong> ${projectName}</div>
                            <div style="margin-top: 5px;">Los grupos exclusivos solo permiten una etiqueta activa a la vez.</div>
                        </div>

                        <div class="le-config-modal__content">
                            <div class="le-config-modal__groups">
                                ${groupsHtml}
                                <button class="le-btn le-btn--add" style="width: 100%" @click="handleAddGroup">
                                    + Añadir grupo
                                </button>
                            </div>

                            <div class="le-config-modal__labels">
                                <div class="le-config-modal__labels-header">
                                    <span>Etiquetas del proyecto</span>
                                    <button class="le-btn le-btn--icon" @click="handleRefresh" ${isLoading ? 'disabled' : ''} title="Recargar etiquetas">
                                        Recargar
                                    </button>
                                </div>
                                <div class="le-config-modal__labels-list">
                                    ${labelsListHtml}
                                </div>
                                <div style="font-size: 11px; color: var(--le-text-muted); margin-top: 8px; text-align: center;">
                                    Haz clic o arrastra para añadir a un grupo
                                </div>
                            </div>
                        </div>

                        <div class="le-config-modal__footer">
                            <button class="le-btn le-btn--primary" @click="handleSave">Guardar</button>
                            <button class="le-btn" @click="handleClose">Cancelar</button>
                        </div>

                        ${selectorHtml}
                    </div>
                </div>
            `;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // EXPORT
    // ═══════════════════════════════════════════════════════════════

    globalThis.LabelConfigModal = LabelConfigModal;

    if (typeof TM !== 'undefined') {
        TM.LabelConfigModal = LabelConfigModal;
    }

})();
