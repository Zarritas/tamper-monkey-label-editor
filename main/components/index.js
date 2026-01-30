/**
 * TM Label Editor - Components
 * LabelGroup, LabelGroupsModal, ConfigGroupItem, LabelConfigModal, LabelEditorApp
 */

(function() {
    'use strict';

    const { Component } = TM;
    const { html } = TM;

    // ═══════════════════════════════════════════════════════════════
    // LABEL GROUP
    // ═══════════════════════════════════════════════════════════════

    class LabelGroup extends Component {
        static defaultProps = {
            name: '',
            color: '#666666',
            exclusive: false,
            labels: [],
            selectedLabels: new Set(),
            labelsToRemove: new Set(),
            currentLabels: new Set(),
            onLabelClick: null,
            onLabelDoubleClick: null
        };

        getLabelClasses(label) {
            const { currentLabels, selectedLabels, labelsToRemove } = this.props;
            const classes = ['le-label'];

            if (currentLabels.has(label)) classes.push('le-label--current');
            if (selectedLabels.has(label)) classes.push('le-label--selected');
            if (labelsToRemove.has(label)) classes.push('le-label--remove');

            return classes.join(' ');
        }

        handleLabelClick(e) {
            const label = e.target.dataset.label;
            if (label) this.props.onLabelClick?.(label, this.props.name);
        }

        handleLabelDoubleClick(e) {
            const label = e.target.dataset.label;
            if (label) this.props.onLabelDoubleClick?.(label);
        }

        render() {
            const { name, color, exclusive, labels } = this.props;

            const labelsHtml = labels.map(label => `
                <div
                    class="${this.getLabelClasses(label)}"
                    data-label="${label}"
                    @click="handleLabelClick"
                    @dblclick="handleLabelDoubleClick">
                    ${label}
                </div>
            `).join('');

            return html`
                <div class="le-group">
                    <div class="le-group__header">
                        <span class="le-group__dot" style="background: ${color}"></span>
                        <span class="le-group__name">${name}</span>
                        ${exclusive ? '<span class="le-group__badge">Exclusivo</span>' : ''}
                    </div>
                    <div class="le-group__items">
                        ${labelsHtml}
                    </div>
                </div>
            `;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // LABEL GROUPS MODAL
    // ═══════════════════════════════════════════════════════════════

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

        render() {
            const { groups, selectedLabels, labelsToRemove, currentLabels, commands, onLabelClick, onLabelDoubleClick } = this.props;
            const hasChanges = commands.toAdd.length > 0 || commands.toRemove.length > 0;
            const groupEntries = Object.entries(groups);

            let groupsHtml = '';
            if (groupEntries.length > 0) {
                groupsHtml = groupEntries.map(([name, group]) => {
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
                }).join('');
            } else {
                groupsHtml = '<div class="le-status le-status--loading">No hay grupos configurados. Haz clic en ⚙️ para configurar.</div>';
            }

            return html`
                <div class="le-overlay" @click="handleOverlayClick">
                    <div class="le-modal">
                        <div class="le-modal__header">
                            <span class="le-modal__title">Gestionar Etiquetas</span>
                            <button class="le-btn le-btn--icon" @click="handleOpenConfig" title="Configurar grupos">
                                ⚙️
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
                                ✅ Aplicar
                            </button>
                            <button class="le-btn" @click="handleClose">
                                ❌ Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // CONFIG GROUP ITEM
    // ═══════════════════════════════════════════════════════════════

    class ConfigGroupItem extends Component {
        static defaultProps = {
            name: '',
            color: '#666666',
            exclusive: true,
            labels: [],
            onColorChange: null,
            onNameChange: null,
            onExclusiveChange: null,
            onLabelRemove: null,
            onDelete: null,
            onLabelDrop: null
        };

        initialState() {
            return { isDragOver: false };
        }

        handleColorChange(e) {
            this.props.onColorChange?.(this.props.name, e.target.value);
        }

        handleNameChange(e) {
            this.props.onNameChange?.(this.props.name, e.target.value);
        }

        handleExclusiveChange(e) {
            this.props.onExclusiveChange?.(this.props.name, e.target.checked);
        }

        handleDelete() {
            this.props.onDelete?.(this.props.name);
        }

        handleLabelRemoveClick(e) {
            const label = e.target.dataset.label || e.target.closest('[data-label]')?.dataset.label;
            if (label) this.props.onLabelRemove?.(this.props.name, label);
        }

        handleDragOver(e) {
            e.preventDefault();
            this.state.isDragOver = true;
        }

        handleDragLeave(e) {
            this.state.isDragOver = false;
        }

        handleDrop(e) {
            e.preventDefault();
            this.state.isDragOver = false;
            const label = e.dataTransfer.getData('text/plain');
            if (label) this.props.onLabelDrop?.(this.props.name, label);
        }

        render() {
            const { name, color, exclusive, labels } = this.props;
            const { isDragOver } = this.state;

            const labelsContainerClass = isDragOver
                ? 'le-config-group__labels le-config-group__labels--dragover'
                : 'le-config-group__labels';

            const chipsHtml = labels.length > 0
                ? labels.map(label => `
                    <div class="le-config-chip">
                        ${label}
                        <button class="le-config-chip__remove" data-label="${label}" @click="handleLabelRemoveClick" title="Quitar etiqueta">×</button>
                    </div>
                `).join('')
                : '<span class="le-status--loading">Arrastra etiquetas aquí</span>';

            return html`
                <div class="le-config-group" data-group="${name}">
                    <div class="le-config-group__header">
                        <input type="color" class="le-config-group__color" value="${color}" @change="handleColorChange" title="Color del grupo" />
                        <input type="text" class="le-config-group__name" value="${name}" @change="handleNameChange" placeholder="Nombre del grupo" />
                        <label class="le-config-group__exclusive">
                            <input type="checkbox" ${exclusive ? 'checked' : ''} @change="handleExclusiveChange" />
                            Exclusivo
                        </label>
                        <button class="le-btn le-btn--icon le-btn--danger" @click="handleDelete" title="Eliminar grupo">🗑️</button>
                    </div>
                    <div class="${labelsContainerClass}" @dragover="handleDragOver" @dragleave="handleDragLeave" @drop="handleDrop">
                        ${chipsHtml}
                    </div>
                </div>
            `;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // LABEL CONFIG MODAL
    // ═══════════════════════════════════════════════════════════════

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
                groupSelector: null
            };
        }

        getUsedLabels() {
            const used = new Set();
            Object.values(this.state.editGroups).forEach(group => {
                group.labels.forEach(l => used.add(l));
            });
            return used;
        }

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

        handleGroupColorChange(groupName, color) {
            if (this.state.editGroups[groupName]) {
                this.state.editGroups[groupName].color = color;
                this.state.editGroups = { ...this.state.editGroups };
            }
        }

        handleGroupNameChange(oldName, newName) {
            if (oldName === newName || this.state.editGroups[newName]) return;
            const groupData = this.state.editGroups[oldName];
            const { [oldName]: removed, ...rest } = this.state.editGroups;
            this.state.editGroups = { ...rest, [newName]: groupData };
        }

        handleGroupExclusiveChange(groupName, exclusive) {
            if (this.state.editGroups[groupName]) {
                this.state.editGroups[groupName].exclusive = exclusive;
                this.state.editGroups = { ...this.state.editGroups };
            }
        }

        handleLabelRemove(groupName, label) {
            if (this.state.editGroups[groupName]) {
                this.state.editGroups[groupName].labels =
                    this.state.editGroups[groupName].labels.filter(l => l !== label);
                this.state.editGroups = { ...this.state.editGroups };
            }
        }

        handleGroupDelete(groupName) {
            const { [groupName]: removed, ...rest } = this.state.editGroups;
            this.state.editGroups = rest;
        }

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

        handleAvailableLabelDragStart(e) {
            const label = e.target.dataset.label;
            if (label) {
                this.state.draggedLabel = label;
                e.dataTransfer.setData('text/plain', label);
            }
        }

        handleAvailableLabelClick(e) {
            const label = e.target.dataset.label;
            const used = this.getUsedLabels();
            if (!label || used.has(label)) return;

            const rect = e.target.getBoundingClientRect();
            this.state.groupSelector = { label, x: rect.left, y: rect.bottom + 5 };
        }

        handleGroupSelectorClick(e) {
            const groupName = e.target.dataset.group || e.target.closest('[data-group]')?.dataset.group;
            if (groupName && this.state.groupSelector) {
                this.handleLabelDrop(groupName, this.state.groupSelector.label);
                this.state.groupSelector = null;
            }
        }

        handleGroupSelectorCancel() {
            this.state.groupSelector = null;
        }

        render() {
            const { projectLabels, isLoading } = this.props;
            const { editGroups, groupSelector } = this.state;
            const usedLabels = this.getUsedLabels();
            const groupEntries = Object.entries(editGroups);

            // Render config groups
            const groupsHtml = groupEntries.map(([name, group]) => {
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
            }).join('');

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
                            style="background: ${label.color}20; border: 1px solid ${label.color}"
                            @dragstart="handleAvailableLabelDragStart"
                            @click="handleAvailableLabelClick">
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
                    <button class="le-group-selector__btn" data-group="${name}" @click="handleGroupSelectorClick">
                        <span class="le-group__dot" style="background: ${group.color}"></span>
                        ${name}
                    </button>
                `).join('');

                selectorHtml = `
                    <div class="le-group-selector" style="left: ${groupSelector.x}px; top: ${groupSelector.y}px;">
                        <div class="le-group-selector__title">Añadir a grupo:</div>
                        ${selectorButtons}
                        <button class="le-group-selector__cancel" @click="handleGroupSelectorCancel">Cancelar</button>
                    </div>
                `;
            }

            const projectName = LabelEditorStorage?.getCurrentProjectName?.() || '';

            return html`
                <div class="le-overlay" @click="handleOverlayClick">
                    <div class="le-config-modal">
                        <div class="le-config-modal__header">
                            ⚙️ Configuración de Grupos
                        </div>

                        <div class="le-modal__info">
                            <div><strong>Proyecto:</strong> ${projectName}</div>
                            <div style="margin-top: 5px;">Los grupos exclusivos solo permiten una etiqueta activa a la vez.</div>
                        </div>

                        <div class="le-config-modal__content">
                            <div class="le-config-modal__groups">
                                ${groupsHtml}
                                <button class="le-btn le-btn--add" style="width: 100%" @click="handleAddGroup">
                                    ➕ Añadir grupo
                                </button>
                            </div>

                            <div class="le-config-modal__labels">
                                <div class="le-config-modal__labels-header">
                                    <span>📋 Etiquetas del proyecto</span>
                                    <button class="le-btn le-btn--icon" @click="handleRefresh" ${isLoading ? 'disabled' : ''} title="Recargar etiquetas">
                                        🔄
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
                            <button class="le-btn le-btn--primary" @click="handleSave">✅ Guardar</button>
                            <button class="le-btn" @click="handleClose">❌ Cancelar</button>
                        </div>

                        ${selectorHtml}
                    </div>
                </div>
            `;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // LABEL EDITOR APP
    // ═══════════════════════════════════════════════════════════════

    class LabelEditorApp extends Component {
        static defaultProps = {
            projectPath: null
        };

        initialState() {
            return {
                selectedLabels: new Set(),
                labelsToRemove: new Set(),
                currentLabels: new Set(),
                groups: {},
                projectLabels: [],
                showMainModal: false,
                showConfigModal: false,
                isLoading: false,
                error: null
            };
        }

        // ═══════════════════════════════════════════════════════════
        // LIFECYCLE
        // ═══════════════════════════════════════════════════════════

        onMount() {
            TM.Logger.info('LabelEditorApp', 'Mounted');
            this.loadConfig();
            this.injectSidebarButton();
        }

        onDestroy() {
            this.removeSidebarButton();
        }

        // ═══════════════════════════════════════════════════════════
        // CONFIGURATION
        // ═══════════════════════════════════════════════════════════

        loadConfig() {
            const projectPath = this.props.projectPath || LabelEditorStorage.getCurrentProjectName();
            this.state.groups = LabelEditorStorage.loadGroups(projectPath);
            TM.Logger.debug('LabelEditorApp', 'Config loaded', { groups: Object.keys(this.state.groups) });
        }

        saveConfig(groups) {
            const projectPath = this.props.projectPath || LabelEditorStorage.getCurrentProjectName();
            this.state.groups = groups;
            LabelEditorStorage.saveGroups(projectPath, groups);
            TM.Logger.debug('LabelEditorApp', 'Config saved');
        }

        async loadProjectLabels() {
            this.state.isLoading = true;
            this.state.error = null;
            try {
                const labels = await GitLabAPI.getLabels();
                this.state.projectLabels = labels;
                TM.Logger.debug('LabelEditorApp', 'Labels loaded', { count: labels.length });
            } catch (e) {
                TM.Logger.error('LabelEditorApp', 'Failed to load labels', e);
                this.state.error = 'Error cargando etiquetas';
            } finally {
                this.state.isLoading = false;
            }
        }

        async refreshProjectLabels() {
            GitLabAPI.clearCache();
            await this.loadProjectLabels();
        }

        // ═══════════════════════════════════════════════════════════
        // CURRENT LABELS
        // ═══════════════════════════════════════════════════════════

        loadCurrentLabels() {
            const selectors = '[data-testid="sidebar-labels"] .gl-label-text, .issuable-show-labels .gl-label-text';
            const labelElements = document.querySelectorAll(selectors);
            this.state.currentLabels = new Set([...labelElements].map(el => el.textContent.trim()));
            TM.Logger.debug('LabelEditorApp', 'Current labels loaded', { count: this.state.currentLabels.size });
        }

        // ═══════════════════════════════════════════════════════════
        // LABEL SELECTION
        // ═══════════════════════════════════════════════════════════

        toggleLabel(label, groupName) {
            const group = this.state.groups[groupName];
            if (!group) return;

            if (this.state.selectedLabels.has(label)) {
                const newSet = new Set(this.state.selectedLabels);
                newSet.delete(label);
                this.state.selectedLabels = newSet;
            } else {
                if (group.exclusive) {
                    this.deselectOthersInGroup(groupName);
                    this.markCurrentLabelsForRemoval(groupName);
                }
                this.state.selectedLabels = new Set([...this.state.selectedLabels, label]);
            }
        }

        toggleRemoveLabel(label) {
            if (this.state.labelsToRemove.has(label)) {
                const newSet = new Set(this.state.labelsToRemove);
                newSet.delete(label);
                this.state.labelsToRemove = newSet;
            } else {
                this.state.labelsToRemove = new Set([...this.state.labelsToRemove, label]);
            }
        }

        deselectOthersInGroup(groupName) {
            const group = this.state.groups[groupName];
            if (!group) return;
            this.state.selectedLabels = new Set(
                [...this.state.selectedLabels].filter(l => !group.labels.includes(l))
            );
        }

        markCurrentLabelsForRemoval(groupName) {
            const group = this.state.groups[groupName];
            if (!group) return;
            const toRemove = group.labels.filter(l => this.state.currentLabels.has(l));
            this.state.labelsToRemove = new Set([...this.state.labelsToRemove, ...toRemove]);
        }

        clearSelections() {
            this.state.selectedLabels = new Set();
            this.state.labelsToRemove = new Set();
        }

        // ═══════════════════════════════════════════════════════════
        // COMMANDS
        // ═══════════════════════════════════════════════════════════

        getCommandsToApply() {
            const toAdd = [...this.state.selectedLabels].filter(l => !this.state.currentLabels.has(l));
            const toRemove = [...this.state.labelsToRemove].filter(l => this.state.currentLabels.has(l));
            return { toAdd, toRemove };
        }

        generateCommandString() {
            const { toAdd, toRemove } = this.getCommandsToApply();
            const commands = [];
            if (toAdd.length > 0) commands.push(`/label ${toAdd.map(l => `~"${l}"`).join(' ')}`);
            if (toRemove.length > 0) commands.push(`/unlabel ${toRemove.map(l => `~"${l}"`).join(' ')}`);
            return commands.join('\n');
        }

        // ═══════════════════════════════════════════════════════════
        // GITLAB INTEGRATION
        // ═══════════════════════════════════════════════════════════

        findVisibleTextarea() {
            const selectors = [
                'textarea#note-body',
                'textarea.note-textarea',
                'textarea[data-testid="comment-field"]',
                'textarea.js-note-text',
                '#note_note'
            ];
            for (const selector of selectors) {
                const el = document.querySelector(selector);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) return el;
                }
            }
            return null;
        }

        isRichTextMode() {
            const switchBtn = document.querySelector('[data-testid="editing-mode-switcher"]');
            return switchBtn?.textContent.toLowerCase().includes('plain text');
        }

        async switchToPlainText() {
            const switchBtn = document.querySelector('[data-testid="editing-mode-switcher"]');
            if (switchBtn && this.isRichTextMode()) {
                TM.Logger.debug('LabelEditorApp', 'Switching to plain text mode');
                switchBtn.click();
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }

        switchToRichText() {
            const switchBtn = document.querySelector('[data-testid="editing-mode-switcher"]');
            if (switchBtn?.textContent.toLowerCase().includes('rich text')) {
                TM.Logger.debug('LabelEditorApp', 'Switching back to rich text mode');
                switchBtn.click();
            }
        }

        async applyChanges() {
            const commands = this.generateCommandString();
            if (!commands) {
                this.closeMainModal();
                return;
            }

            TM.Logger.debug('LabelEditorApp', 'Applying changes', { commands });

            const textarea = this.findVisibleTextarea();
            const savedContent = textarea?.value?.trim() || '';
            const wasRichText = this.isRichTextMode();

            await this.switchToPlainText();

            const currentTextarea = this.findVisibleTextarea();
            if (currentTextarea) {
                currentTextarea.focus();
                currentTextarea.value = commands;
                currentTextarea.dispatchEvent(new Event('input', { bubbles: true }));
                currentTextarea.dispatchEvent(new Event('change', { bubbles: true }));

                setTimeout(() => {
                    const submitBtn = document.querySelector('.js-comment-submit-button button[type="submit"]');
                    if (submitBtn) {
                        if (submitBtn.disabled) {
                            submitBtn.removeAttribute('disabled');
                            submitBtn.classList.remove('disabled');
                        }
                        submitBtn.click();

                        setTimeout(() => {
                            if (savedContent) {
                                const restoreTextarea = this.findVisibleTextarea();
                                if (restoreTextarea) {
                                    restoreTextarea.focus();
                                    restoreTextarea.value = savedContent;
                                    restoreTextarea.dispatchEvent(new Event('input', { bubbles: true }));
                                }
                            }
                            if (wasRichText) setTimeout(() => this.switchToRichText(), 300);
                        }, 500);
                    }
                }, 200);

                currentTextarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                await navigator.clipboard.writeText(commands);
                alert('Texto copiado al portapapeles:\n\n' + commands);
            }

            this.closeMainModal();
        }

        // ═══════════════════════════════════════════════════════════
        // MODAL MANAGEMENT
        // ═══════════════════════════════════════════════════════════

        openMainModal() {
            this.loadCurrentLabels();
            this.clearSelections();
            this.state.showMainModal = true;
        }

        closeMainModal() {
            this.state.showMainModal = false;
        }

        openConfigModal() {
            this.loadProjectLabels();
            this.state.showConfigModal = true;
            this.state.showMainModal = false;
        }

        closeConfigModal() {
            this.state.showConfigModal = false;
        }

        handleConfigSave(groups) {
            this.saveConfig(groups);
            this.closeConfigModal();
            this.openMainModal();
        }

        // ═══════════════════════════════════════════════════════════
        // SIDEBAR BUTTON
        // ═══════════════════════════════════════════════════════════

        injectSidebarButton() {
            this._observer = new MutationObserver(() => {
                const labelsSection = document.querySelector('[data-testid="sidebar-labels"]');
                if (!labelsSection) return;

                const editButton = labelsSection.querySelector('[data-testid="edit-button"]');
                if (!editButton) return;

                if (labelsSection.querySelector('.le-sidebar-btn')) return;

                const btn = document.createElement('button');
                btn.className = 'le-sidebar-btn';
                btn.innerHTML = '🏷️';
                btn.title = 'Gestionar etiquetas por grupos';
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.openMainModal();
                });

                editButton.parentElement.insertBefore(btn, editButton);
                TM.Logger.debug('LabelEditorApp', 'Sidebar button injected');
            });

            this._observer.observe(document.body, { childList: true, subtree: true });
        }

        removeSidebarButton() {
            if (this._observer) {
                this._observer.disconnect();
                this._observer = null;
            }
            const btn = document.querySelector('.le-sidebar-btn');
            if (btn) btn.remove();
        }

        // ═══════════════════════════════════════════════════════════
        // RENDER
        // ═══════════════════════════════════════════════════════════

        render() {
            const isDark = TM.theme?.isDark?.() ?? false;
            const { showMainModal, showConfigModal, groups, selectedLabels, labelsToRemove, currentLabels, projectLabels, isLoading } = this.state;

            let modalContent = '';

            if (showMainModal) {
                const modal = new LabelGroupsModal({
                    groups,
                    selectedLabels,
                    labelsToRemove,
                    currentLabels,
                    commands: this.getCommandsToApply(),
                    onClose: () => this.closeMainModal(),
                    onApply: () => this.applyChanges(),
                    onOpenConfig: () => this.openConfigModal(),
                    onLabelClick: (label, group) => this.toggleLabel(label, group),
                    onLabelDoubleClick: (label) => this.toggleRemoveLabel(label)
                });
                modalContent = modal.render();
            }

            if (showConfigModal) {
                const modal = new LabelConfigModal({
                    groups,
                    projectLabels,
                    isLoading,
                    onClose: () => this.closeConfigModal(),
                    onSave: (g) => this.handleConfigSave(g),
                    onRefreshLabels: () => this.refreshProjectLabels()
                });
                modalContent = modal.render();
            }

            return html`
                <div class="label-editor ${isDark ? 'dark-mode' : ''}">
                    ${modalContent}
                </div>
            `;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // EXPORT
    // ═══════════════════════════════════════════════════════════════

    TM.LabelGroup = LabelGroup;
    TM.LabelGroupsModal = LabelGroupsModal;
    TM.ConfigGroupItem = ConfigGroupItem;
    TM.LabelConfigModal = LabelConfigModal;
    TM.LabelEditorApp = LabelEditorApp;

})();
