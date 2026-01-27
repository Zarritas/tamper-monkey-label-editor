/**
 * TM Label Editor - LabelConfigModal Component
 * Modal for configuring label groups
 */

class LabelConfigModal extends TM.Component {
    static defaultProps = {
        /** Groups configuration */
        groups: {},
        /** Project labels from API */
        projectLabels: [],
        /** Is loading labels */
        isLoading: false,
        /** Callback when modal closed */
        onClose: null,
        /** Callback when save clicked */
        onSave: null,
        /** Callback when refresh labels clicked */
        onRefreshLabels: null
    };

    initialState() {
        return {
            // Deep clone groups for editing
            editGroups: JSON.parse(JSON.stringify(this.props.groups)),
            // Currently dragged label
            draggedLabel: null,
            // Group selector popup
            groupSelector: null
        };
    }

    /**
     * Get set of labels already used in groups
     * @returns {Set<string>}
     */
    getUsedLabels() {
        const used = new Set();
        Object.values(this.state.editGroups).forEach(group => {
            group.labels.forEach(l => used.add(l));
        });
        return used;
    }

    /**
     * Handle overlay click (close modal)
     * @param {Event} e
     */
    handleOverlayClick(e) {
        if (e.target.classList.contains('le-overlay')) {
            this.closeGroupSelector();
            this.props.onClose?.();
        }
    }

    /**
     * Handle save button click
     */
    handleSave() {
        this.props.onSave?.(this.state.editGroups);
    }

    /**
     * Handle add group button click
     */
    handleAddGroup() {
        const groupCount = Object.keys(this.state.editGroups).length + 1;
        const newName = `Grupo ${groupCount}`;

        this.state.editGroups = {
            ...this.state.editGroups,
            [newName]: {
                color: '#666666',
                exclusive: true,
                labels: []
            }
        };
    }

    /**
     * Handle group color change
     * @param {string} groupName
     * @param {string} color
     */
    handleGroupColorChange(groupName, color) {
        if (this.state.editGroups[groupName]) {
            this.state.editGroups[groupName].color = color;
            this.state.editGroups = { ...this.state.editGroups };
        }
    }

    /**
     * Handle group name change
     * @param {string} oldName
     * @param {string} newName
     */
    handleGroupNameChange(oldName, newName) {
        if (oldName === newName) return;
        if (this.state.editGroups[newName]) return; // Name already exists

        const groupData = this.state.editGroups[oldName];
        const { [oldName]: removed, ...rest } = this.state.editGroups;
        this.state.editGroups = { ...rest, [newName]: groupData };
    }

    /**
     * Handle group exclusive change
     * @param {string} groupName
     * @param {boolean} exclusive
     */
    handleGroupExclusiveChange(groupName, exclusive) {
        if (this.state.editGroups[groupName]) {
            this.state.editGroups[groupName].exclusive = exclusive;
            this.state.editGroups = { ...this.state.editGroups };
        }
    }

    /**
     * Handle label removed from group
     * @param {string} groupName
     * @param {string} label
     */
    handleLabelRemove(groupName, label) {
        if (this.state.editGroups[groupName]) {
            this.state.editGroups[groupName].labels =
                this.state.editGroups[groupName].labels.filter(l => l !== label);
            this.state.editGroups = { ...this.state.editGroups };
        }
    }

    /**
     * Handle group deleted
     * @param {string} groupName
     */
    handleGroupDelete(groupName) {
        const { [groupName]: removed, ...rest } = this.state.editGroups;
        this.state.editGroups = rest;
    }

    /**
     * Handle label dropped on group
     * @param {string} groupName
     * @param {string} label
     */
    handleLabelDrop(groupName, label) {
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

    /**
     * Handle available label drag start
     * @param {DragEvent} e
     * @param {string} label
     */
    handleLabelDragStart(e, label) {
        this.state.draggedLabel = label;
        e.dataTransfer.setData('text/plain', label);
    }

    /**
     * Handle available label click (show group selector)
     * @param {MouseEvent} e
     * @param {string} label
     */
    handleAvailableLabelClick(e, label) {
        const used = this.getUsedLabels();
        if (used.has(label)) return;

        const rect = e.target.getBoundingClientRect();
        this.state.groupSelector = {
            label,
            x: rect.left,
            y: rect.bottom + 5
        };
    }

    /**
     * Close group selector popup
     */
    closeGroupSelector() {
        this.state.groupSelector = null;
    }

    /**
     * Add label to group from selector
     * @param {string} groupName
     */
    addLabelToGroup(groupName) {
        const { label } = this.state.groupSelector;
        this.handleLabelDrop(groupName, label);
        this.closeGroupSelector();
    }

    /**
     * Render a config group item
     * @param {string} name
     * @param {Object} group
     * @returns {string}
     */
    renderConfigGroup(name, group) {
        const item = new ConfigGroupItem({
            name,
            color: group.color,
            exclusive: group.exclusive,
            labels: group.labels,
            onColorChange: (n, c) => this.handleGroupColorChange(n, c),
            onNameChange: (o, n) => this.handleGroupNameChange(o, n),
            onExclusiveChange: (n, e) => this.handleGroupExclusiveChange(n, e),
            onLabelRemove: (n, l) => this.handleLabelRemove(n, l),
            onDelete: (n) => this.handleGroupDelete(n),
            onLabelDrop: (n, l) => this.handleLabelDrop(n, l)
        });

        return item.render();
    }

    /**
     * Render available label
     * @param {Object} label
     * @param {boolean} used
     * @returns {string}
     */
    renderAvailableLabel(label, used) {
        const className = used
            ? 'le-available-label le-available-label--used'
            : 'le-available-label';

        return TM.html`
            <div
                class="${className}"
                draggable="${!used}"
                style="background: ${label.color}20; border: 1px solid ${label.color}"
                @dragstart="${(e) => !used && this.handleLabelDragStart(e, label.name)}"
                @click="${(e) => this.handleAvailableLabelClick(e, label.name)}">
                ${label.name}
            </div>
        `;
    }

    /**
     * Render group selector popup
     * @returns {string}
     */
    renderGroupSelector() {
        const { groupSelector } = this.state;
        if (!groupSelector) return '';

        const groups = Object.entries(this.state.editGroups);

        return TM.html`
            <div
                class="le-group-selector"
                style="left: ${groupSelector.x}px; top: ${groupSelector.y}px;">
                <div class="le-group-selector__title">Añadir a grupo:</div>
                ${groups.map(([name, group]) => TM.html`
                    <button
                        class="le-group-selector__btn"
                        @click="${() => this.addLabelToGroup(name)}">
                        <span class="le-group__dot" style="background: ${group.color}"></span>
                        ${name}
                    </button>
                `).join('')}
                <button
                    class="le-group-selector__cancel"
                    @click="${() => this.closeGroupSelector()}">
                    Cancelar
                </button>
            </div>
        `;
    }

    render() {
        const { projectLabels, isLoading, onRefreshLabels, onClose } = this.props;
        const { editGroups } = this.state;
        const usedLabels = this.getUsedLabels();
        const groupEntries = Object.entries(editGroups);

        return TM.html`
            <div class="le-overlay" @click="${(e) => this.handleOverlayClick(e)}">
                <div class="le-config-modal">
                    <div class="le-config-modal__header">
                        ⚙️ Configuración de Grupos
                    </div>

                    <div class="le-modal__info">
                        <div><strong>Proyecto:</strong> ${LabelEditorStorage.getCurrentProjectName()}</div>
                        <div style="margin-top: 5px;">Los grupos exclusivos solo permiten una etiqueta activa a la vez.</div>
                    </div>

                    <div class="le-config-modal__content">
                        <div class="le-config-modal__groups">
                            ${groupEntries.map(([name, group]) =>
                                this.renderConfigGroup(name, group)
                            ).join('')}

                            <button
                                class="le-btn le-btn--add"
                                style="width: 100%"
                                @click="${() => this.handleAddGroup()}">
                                ➕ Añadir grupo
                            </button>
                        </div>

                        <div class="le-config-modal__labels">
                            <div class="le-config-modal__labels-header">
                                <span>📋 Etiquetas del proyecto</span>
                                <button
                                    class="le-btn le-btn--icon"
                                    @click="${() => onRefreshLabels?.()}"
                                    ${isLoading ? 'disabled' : ''}
                                    title="Recargar etiquetas">
                                    🔄
                                </button>
                            </div>
                            <div class="le-config-modal__labels-list">
                                ${isLoading
                                    ? '<div class="le-spinner"></div>'
                                    : projectLabels.length > 0
                                        ? projectLabels.map(label =>
                                            this.renderAvailableLabel(label, usedLabels.has(label.name))
                                        ).join('')
                                        : '<span class="le-status--loading">No hay etiquetas</span>'
                                }
                            </div>
                            <div style="font-size: 11px; color: var(--le-text-muted); margin-top: 8px; text-align: center;">
                                Haz clic o arrastra para añadir a un grupo
                            </div>
                        </div>
                    </div>

                    <div class="le-config-modal__footer">
                        <button
                            class="le-btn le-btn--primary"
                            @click="${() => this.handleSave()}">
                            ✅ Guardar
                        </button>
                        <button
                            class="le-btn"
                            @click="${() => onClose?.()}">
                            ❌ Cancelar
                        </button>
                    </div>

                    ${this.renderGroupSelector()}
                </div>
            </div>
        `;
    }
}

// Register component
if (typeof TM !== 'undefined') {
    TM.LabelConfigModal = LabelConfigModal;
}
