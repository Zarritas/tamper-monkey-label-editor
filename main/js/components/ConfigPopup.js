/**
 * ConfigPopup Component
 * Configuration modal for editing label groups
 */

class ConfigPopup {
    static defaultProps = {
        groups: {},
        onSave: null,
        onCancel: null
    };

    constructor(props = {}) {
        this.props = { ...ConfigPopup.defaultProps, ...props };
        this.state = {
            groups: Utils.deepClone(this.props.groups),
            activeTab: 'visual',
            projectLabels: [],
            loadingLabels: true,
            selectedGroup: null,
            jsonError: null
        };
        this.el = null;
        this._refs = {};
    }

    render() {
        const { loadingLabels } = this.state;
        const projectName = LabelConfig.getProjectName();

        const div = document.createElement('div');
        div.className = 'config-popup';

        // Header
        const header = document.createElement('div');
        header.className = 'config-popup__header';

        const h3 = document.createElement('h3');
        h3.textContent = '\u2699\uFE0F Configuración de Grupos';
        header.appendChild(h3);

        const projectTag = document.createElement('span');
        projectTag.className = 'lg-tag lg-tag--sm lg-tag--primary';
        projectTag.textContent = projectName;
        header.appendChild(projectTag);

        div.appendChild(header);

        // Tabs
        const tabs = document.createElement('div');
        tabs.className = 'config-popup__tabs';

        const visualTabBtn = document.createElement('button');
        visualTabBtn.className = 'config-tab config-tab--active';
        visualTabBtn.dataset.tab = 'visual';
        visualTabBtn.textContent = '\uD83C\uDFA8 Visual';
        visualTabBtn.addEventListener('click', (e) => this._switchTab(e));
        tabs.appendChild(visualTabBtn);

        const jsonTabBtn = document.createElement('button');
        jsonTabBtn.className = 'config-tab';
        jsonTabBtn.dataset.tab = 'json';
        jsonTabBtn.textContent = '\uD83D\uDCC4 JSON';
        jsonTabBtn.addEventListener('click', (e) => this._switchTab(e));
        tabs.appendChild(jsonTabBtn);

        this._refs.visualTabBtn = visualTabBtn;
        this._refs.jsonTabBtn = jsonTabBtn;
        div.appendChild(tabs);

        // Body
        const body = document.createElement('div');
        body.className = 'config-popup__body';

        // Visual Tab Content
        const visualContent = document.createElement('div');
        visualContent.className = 'config-tab-content';
        this._refs.visualTab = visualContent;

        const groupsList = document.createElement('div');
        groupsList.className = 'config-groups-list';
        this._refs.groupsList = groupsList;
        visualContent.appendChild(groupsList);

        const addGroupBtn = document.createElement('button');
        addGroupBtn.className = 'lg-btn lg-btn--secondary lg-btn--sm lg-btn--block';
        addGroupBtn.textContent = '\u2795 Añadir grupo';
        addGroupBtn.addEventListener('click', () => this._addGroup());
        visualContent.appendChild(addGroupBtn);

        // Project labels panel
        const projectLabelsPanel = document.createElement('div');
        projectLabelsPanel.className = 'config-project-labels';

        const plHeader = document.createElement('div');
        plHeader.className = 'config-project-labels__header';

        const plTitle = document.createElement('span');
        plTitle.textContent = '\uD83D\uDCCB Etiquetas del proyecto';
        plHeader.appendChild(plTitle);

        const refreshBtn = document.createElement('button');
        refreshBtn.className = 'lg-btn lg-btn--ghost lg-btn--icon lg-btn--sm';
        refreshBtn.title = 'Recargar';
        refreshBtn.textContent = '\uD83D\uDD04';
        refreshBtn.addEventListener('click', () => this._refreshLabels());
        plHeader.appendChild(refreshBtn);

        projectLabelsPanel.appendChild(plHeader);

        const plList = document.createElement('div');
        plList.className = 'config-project-labels__list';
        if (loadingLabels) {
            const loading = document.createElement('span');
            loading.className = 'config-loading';
            loading.textContent = 'Cargando etiquetas...';
            plList.appendChild(loading);
        }
        this._refs.projectLabelsList = plList;
        projectLabelsPanel.appendChild(plList);

        const plHint = document.createElement('div');
        plHint.className = 'config-project-labels__hint';
        plHint.textContent = 'Haz clic en una etiqueta para añadirla al grupo seleccionado';
        projectLabelsPanel.appendChild(plHint);

        visualContent.appendChild(projectLabelsPanel);
        body.appendChild(visualContent);

        // JSON Tab Content
        const jsonContent = document.createElement('div');
        jsonContent.className = 'config-tab-content hidden';
        this._refs.jsonTab = jsonContent;

        const jsonEditor = document.createElement('textarea');
        jsonEditor.className = 'config-json-editor lg-input lg-textarea';
        jsonEditor.rows = 15;
        jsonEditor.value = this._getJsonContent();
        jsonEditor.addEventListener('input', () => {
            this.state.jsonError = null;
            this._updateJsonError();
        });
        this._refs.jsonEditor = jsonEditor;
        jsonContent.appendChild(jsonEditor);

        this._refs.jsonErrorEl = document.createElement('div');
        this._refs.jsonErrorEl.className = 'lg-error';
        this._refs.jsonErrorEl.style.display = 'none';
        jsonContent.appendChild(this._refs.jsonErrorEl);

        // Import/Export buttons
        const jsonActions = document.createElement('div');
        jsonActions.className = 'config-json-actions';

        const exportBtn = document.createElement('button');
        exportBtn.className = 'lg-btn lg-btn--secondary lg-btn--sm';
        exportBtn.textContent = '\uD83D\uDCE4 Exportar';
        exportBtn.addEventListener('click', () => this._exportJson());
        jsonActions.appendChild(exportBtn);

        const importBtn = document.createElement('button');
        importBtn.className = 'lg-btn lg-btn--secondary lg-btn--sm';
        importBtn.textContent = '\uD83D\uDCE5 Importar';
        importBtn.addEventListener('click', () => this._importJson());
        jsonActions.appendChild(importBtn);

        const importInput = document.createElement('input');
        importInput.type = 'file';
        importInput.accept = '.json';
        importInput.style.display = 'none';
        importInput.addEventListener('change', (e) => this._handleImportFile(e));
        this._refs.importInput = importInput;
        jsonActions.appendChild(importInput);

        jsonContent.appendChild(jsonActions);

        const jsonHint = document.createElement('div');
        jsonHint.className = 'config-json-hint';
        jsonHint.textContent = 'Edita el JSON directamente. Los cambios se validarán al guardar.';
        jsonContent.appendChild(jsonHint);

        body.appendChild(jsonContent);
        div.appendChild(body);

        // Footer
        const footer = document.createElement('div');
        footer.className = 'config-popup__footer';

        const resetBtn = document.createElement('button');
        resetBtn.className = 'lg-btn lg-btn--ghost lg-btn--sm';
        resetBtn.textContent = '\uD83D\uDD04 Restaurar';
        resetBtn.addEventListener('click', () => this._handleReset());
        footer.appendChild(resetBtn);

        const footerRight = document.createElement('div');
        footerRight.className = 'config-popup__footer-right';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'lg-btn lg-btn--secondary lg-btn--sm';
        cancelBtn.textContent = 'Cancelar';
        cancelBtn.addEventListener('click', () => this.props.onCancel?.());
        footerRight.appendChild(cancelBtn);

        const saveBtn = document.createElement('button');
        saveBtn.className = 'lg-btn lg-btn--primary lg-btn--sm';
        saveBtn.textContent = '\u2705 Guardar';
        saveBtn.addEventListener('click', () => this._handleSave());
        footerRight.appendChild(saveBtn);

        footer.appendChild(footerRight);
        div.appendChild(footer);

        this.el = div;

        // Initial render
        this._renderVisualGroups();
        this._loadProjectLabels();

        return div;
    }

    mount(container) {
        if (!this.el) this.render();
        container.appendChild(this.el);
    }

    // ═══════════════════════════════════════════════════════════════
    // TAB MANAGEMENT
    // ═══════════════════════════════════════════════════════════════

    _switchTab(e) {
        const tab = e.target.dataset.tab;
        if (!tab || tab === this.state.activeTab) return;

        if (this.state.activeTab === 'json' && tab === 'visual') {
            if (!this._syncJsonToVisual()) return;
        } else if (this.state.activeTab === 'visual' && tab === 'json') {
            this._syncVisualToJson();
        }

        this.state.activeTab = tab;

        this._refs.visualTabBtn.classList.toggle('config-tab--active', tab === 'visual');
        this._refs.jsonTabBtn.classList.toggle('config-tab--active', tab === 'json');

        this._refs.visualTab.classList.toggle('hidden', tab !== 'visual');
        this._refs.jsonTab.classList.toggle('hidden', tab !== 'json');
    }

    _syncJsonToVisual() {
        try {
            const json = this._refs.jsonEditor?.value || '{}';
            const parsed = JSON.parse(json);
            this.state.groups = parsed;
            this.state.jsonError = null;
            this._updateJsonError();
            this._renderVisualGroups();
            return true;
        } catch (e) {
            this.state.jsonError = `JSON inválido: ${e.message}`;
            this._updateJsonError();
            return false;
        }
    }

    _syncVisualToJson() {
        this._collectVisualData();
        if (this._refs.jsonEditor) {
            this._refs.jsonEditor.value = this._getJsonContent();
        }
    }

    _getJsonContent() {
        return JSON.stringify(this.state.groups, null, 2);
    }

    _updateJsonError() {
        if (this._refs.jsonErrorEl) {
            if (this.state.jsonError) {
                this._refs.jsonErrorEl.textContent = this.state.jsonError;
                this._refs.jsonErrorEl.style.display = '';
            } else {
                this._refs.jsonErrorEl.style.display = 'none';
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // VISUAL EDITOR
    // ═══════════════════════════════════════════════════════════════

    _renderVisualGroups() {
        const container = this._refs.groupsList;
        if (!container) return;

        container.innerHTML = '';

        Object.entries(this.state.groups).forEach(([groupName, group]) => {
            const groupEl = this._createGroupElement(groupName, group);
            container.appendChild(groupEl);
        });
    }

    _createGroupElement(groupName, group) {
        const div = document.createElement('div');
        div.className = 'config-group-item';
        if (typeof groupName === 'string' && groupName.trim()) {
            div.dataset.groupName = groupName.trim();
        }

        // Header
        const header = document.createElement('div');
        header.className = 'config-group-header';

        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.className = 'config-group-color';
        colorInput.value = group.color || '#000000';
        colorInput.title = 'Color';
        header.appendChild(colorInput);

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'config-group-name lg-input lg-input--sm';
        nameInput.value = groupName;
        nameInput.placeholder = 'Nombre';
        header.appendChild(nameInput);

        const exclusiveLabel = document.createElement('label');
        exclusiveLabel.className = 'config-group-exclusive';

        const exclusiveCheckbox = document.createElement('input');
        exclusiveCheckbox.type = 'checkbox';
        exclusiveCheckbox.checked = group.exclusive !== false;
        exclusiveLabel.appendChild(exclusiveCheckbox);
        exclusiveLabel.appendChild(document.createTextNode(' Exclusivo'));
        header.appendChild(exclusiveLabel);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'lg-btn lg-btn--danger lg-btn--icon lg-btn--sm config-group-delete';
        deleteButton.title = 'Eliminar';
        deleteButton.textContent = '\uD83D\uDDD1\uFE0F';
        header.appendChild(deleteButton);

        div.appendChild(header);

        // Labels container
        const labelsContainer = document.createElement('div');
        labelsContainer.className = 'config-group-labels';

        if (Array.isArray(group.labels)) {
            group.labels.forEach(label => {
                if (typeof label === 'string' && label.trim()) {
                    const labelChip = document.createElement('span');
                    labelChip.className = 'config-label-chip';
                    labelChip.dataset.label = label.trim();
                    labelChip.textContent = label.trim();

                    const removeButton = document.createElement('button');
                    removeButton.className = 'config-label-remove';
                    removeButton.textContent = '\u00D7';

                    labelChip.appendChild(removeButton);
                    labelsContainer.appendChild(labelChip);
                }
            });
        }

        const labelInput = document.createElement('input');
        labelInput.type = 'text';
        labelInput.className = 'config-label-input lg-input lg-input--sm';
        labelInput.placeholder = 'Nueva etiqueta + Enter';
        labelInput.style.width = '150px';
        labelsContainer.appendChild(labelInput);

        div.appendChild(labelsContainer);

        this._bindGroupEvents(div, groupName);

        return div;
    }

    _bindGroupEvents(groupEl, originalName) {
        groupEl.querySelector('.config-group-delete').addEventListener('click', () => {
            delete this.state.groups[originalName];
            groupEl.remove();
            this._renderProjectLabels();
        });

        groupEl.querySelectorAll('.config-label-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const chip = e.target.closest('.config-label-chip');
                const label = chip.dataset.label;
                const group = this.state.groups[originalName];
                if (group) {
                    group.labels = group.labels.filter(l => l !== label);
                    chip.remove();
                    this._renderProjectLabels();
                }
            });
        });

        const input = groupEl.querySelector('.config-label-input');
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && input.value.trim()) {
                this._addLabelToGroup(originalName, input.value.trim());
                input.value = '';
            }
        });

        groupEl.addEventListener('click', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;

            document.querySelectorAll('.config-group-item').forEach(el => {
                el.classList.remove('config-group-item--selected');
            });
            groupEl.classList.add('config-group-item--selected');
            this.state.selectedGroup = originalName;
        });
    }

    _addGroup() {
        const newName = `Grupo ${Object.keys(this.state.groups).length + 1}`;
        this.state.groups[newName] = {
            color: '#6366f1',
            exclusive: true,
            labels: []
        };
        this._renderVisualGroups();
    }

    _addLabelToGroup(groupName, labelName) {
        const group = this.state.groups[groupName];
        if (!group) return;

        if (group.labels.includes(labelName)) return;

        let changed = false;

        Object.values(this.state.groups).forEach(g => {
            if (g.labels.includes(labelName)) {
                g.labels = g.labels.filter(l => l !== labelName);
                changed = true;
            }
        });

        if (!group.labels.includes(labelName)) {
            group.labels.push(labelName);
            changed = true;
        }

        if (changed) {
            this._renderVisualGroups();
            this._renderProjectLabels();
        }
    }

    _collectVisualData() {
        const container = this._refs.groupsList;
        if (!container) return;

        const newGroups = {};

        container.querySelectorAll('.config-group-item').forEach(groupEl => {
            const originalName = groupEl.dataset.groupName;
            const newName = groupEl.querySelector('.config-group-name').value.trim() || originalName;
            const color = groupEl.querySelector('.config-group-color').value;
            const exclusive = groupEl.querySelector('.config-group-exclusive input').checked;
            const labels = Array.from(groupEl.querySelectorAll('.config-label-chip'))
                .map(chip => chip.dataset.label);

            newGroups[newName] = { color, exclusive, labels };
        });

        if (JSON.stringify(this.state.groups) !== JSON.stringify(newGroups)) {
            this.state.groups = newGroups;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // PROJECT LABELS
    // ═══════════════════════════════════════════════════════════════

    async _loadProjectLabels() {
        this.state.loadingLabels = true;

        try {
            const labels = await LabelConfig.fetchProjectLabels();
            this.state.projectLabels = labels;
            this._renderProjectLabels();
        } catch (e) {
            console.error('[Config] Error loading labels:', e);
        } finally {
            this.state.loadingLabels = false;
        }
    }

    async _refreshLabels() {
        LabelConfig.clearLabelsCache();
        await this._loadProjectLabels();
    }

    _renderProjectLabels() {
        const container = this._refs.projectLabelsList;
        if (!container) return;

        const { projectLabels, groups } = this.state;
        const assignedLabels = new Set(
            Object.values(groups).flatMap(g => g.labels)
        );

        container.innerHTML = '';

        projectLabels.forEach(label => {
            const isAssigned = assignedLabels.has(label.name);
            const span = document.createElement('span');
            span.className = `config-project-label ${isAssigned ? 'config-project-label--assigned' : ''}`;
            span.setAttribute('data-label', label.name);
            span.style.borderColor = label.color;
            if (isAssigned) {
                span.style.opacity = '0.5';
            }
            span.textContent = label.name;
            container.appendChild(span);
        });

        container.querySelectorAll('.config-project-label').forEach(labelEl => {
            labelEl.addEventListener('click', () => {
                const labelName = labelEl.dataset.label;
                const targetGroup = this.state.selectedGroup || Object.keys(this.state.groups)[0];

                if (targetGroup) {
                    this._addLabelToGroup(targetGroup, labelName);
                } else {
                    Toast.warning('Selecciona un grupo primero');
                }
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // ACTIONS
    // ═══════════════════════════════════════════════════════════════

    _exportJson() {
        if (this.state.activeTab === 'visual') {
            this._collectVisualData();
        }
        const json = JSON.stringify(this.state.groups, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `label-groups-${LabelConfig.getProjectName()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        Toast.success('Configuración exportada');
    }

    _importJson() {
        this._refs.importInput?.click();
    }

    async _handleImportFile(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const parsed = JSON.parse(text);
            if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
                throw new Error('El archivo debe contener un objeto JSON');
            }

            // Obtener etiquetas del proyecto para validar
            const projectLabels = await LabelConfig.fetchProjectLabels();
            const validNames = new Set(projectLabels.map(l => l.name));

            const filtered = {};
            const removed = [];

            for (const [groupName, group] of Object.entries(parsed)) {
                const validLabels = (group.labels || []).filter(label => {
                    if (validNames.has(label)) return true;
                    removed.push(label);
                    return false;
                });
                filtered[groupName] = { ...group, labels: validLabels };
            }

            this.state.groups = filtered;
            this._renderVisualGroups();
            if (this._refs.jsonEditor) {
                this._refs.jsonEditor.value = this._getJsonContent();
            }
            this._renderProjectLabels();

            if (removed.length > 0) {
                Toast.warning(`Importado. Se eliminaron ${removed.length} etiquetas inexistentes: ${removed.join(', ')}`);
            } else {
                Toast.success('Configuración importada');
            }
        } catch (err) {
            Toast.error(`Error al importar: ${err.message}`);
        }
        // Reset para permitir reimportar el mismo archivo
        e.target.value = '';
    }

    _handleSave() {
        if (this.state.activeTab === 'visual') {
            this._collectVisualData();
        } else {
            if (!this._syncJsonToVisual()) {
                Toast.error('JSON inválido, corrige los errores');
                return;
            }
        }

        LabelConfig.saveGroups(this.state.groups);
        Toast.success('Configuración guardada');

        this.props.onSave?.(this.state.groups);
    }

    _handleReset() {
        if (confirm('¿Restaurar la configuración por defecto? Se perderán los cambios.')) {
            this.state.groups = LabelConfig.resetGroups();
            this._renderVisualGroups();
            if (this._refs.jsonEditor) {
                this._refs.jsonEditor.value = this._getJsonContent();
            }
            Toast.info('Configuración restaurada');
        }
    }

    destroy() {
        this.el?.remove();
        this.el = null;
        this._refs = {};
    }
}

window.ConfigPopup = ConfigPopup;
