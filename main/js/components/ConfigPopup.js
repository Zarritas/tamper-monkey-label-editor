/**
 * ConfigPopup Component
 * Configuration modal for editing label groups
 */

class ConfigPopup extends TM.Component {
    static defaultProps = {
        groups: {},
        onSave: null,
        onCancel: null
    };

    initialState() {
        return {
            groups: TM.deepClone(this.props.groups),
            activeTab: 'visual',
            projectLabels: [],
            loadingLabels: true,
            selectedGroup: null,
            jsonError: null
        };
    }

    render() {
        const { activeTab, loadingLabels, jsonError } = this.state;
        const projectName = LabelConfig.getProjectName();

        return TM.html`
            <div class="config-popup">
                <div class="config-popup__header">
                    <h3>⚙️ Configuración de Grupos</h3>
                    <span class="tm-tag tm-tag--sm tm-tag--primary">${projectName}</span>
                </div>
                
                <div class="config-popup__tabs">
                    <button class="config-tab ${activeTab === 'visual' ? 'config-tab--active' : ''}" 
                            data-tab="visual" @click="switchTab">🎨 Visual</button>
                    <button class="config-tab ${activeTab === 'json' ? 'config-tab--active' : ''}" 
                            data-tab="json" @click="switchTab">📄 JSON</button>
                </div>
                
                <div class="config-popup__body">
                    <!-- Visual Tab -->
                    <div class="config-tab-content ${activeTab !== 'visual' ? 'hidden' : ''}" ref="visualTab">
                        <div class="config-groups-list" ref="groupsList">
                            <!-- Groups rendered here -->
                        </div>
                        <button class="tm-btn tm-btn--secondary tm-btn--sm tm-btn--block" @click="addGroup">
                            ➕ Añadir grupo
                        </button>
                        
                        <div class="config-project-labels">
                            <div class="config-project-labels__header">
                                <span>📋 Etiquetas del proyecto</span>
                                <button class="tm-btn tm-btn--ghost tm-btn--icon tm-btn--sm" 
                                        @click="refreshLabels" title="Recargar">🔄</button>
                            </div>
                            <div class="config-project-labels__list" ref="projectLabelsList">
                                ${loadingLabels 
                                    ? '<span class="config-loading">Cargando etiquetas...</span>'
                                    : ''
                                }
                            </div>
                            <div class="config-project-labels__hint">
                                Haz clic en una etiqueta para añadirla al grupo seleccionado
                            </div>
                        </div>
                    </div>
                    
                    <!-- JSON Tab -->
                    <div class="config-tab-content ${activeTab !== 'json' ? 'hidden' : ''}" ref="jsonTab">
                        <textarea class="config-json-editor tm-input tm-textarea" 
                                  ref="jsonEditor" rows="15" 
                                  @input="handleJsonInput">${this.getJsonContent()}</textarea>
                        ${jsonError ? `<div class="tm-error">${jsonError}</div>` : ''}
                        <div class="config-json-hint">
                            Edita el JSON directamente. Los cambios se validarán al guardar.
                        </div>
                    </div>
                </div>
                
                <div class="config-popup__footer">
                    <button class="tm-btn tm-btn--ghost tm-btn--sm" @click="handleReset">🔄 Restaurar</button>
                    <div class="config-popup__footer-right">
                        <button class="tm-btn tm-btn--secondary tm-btn--sm" @click="handleCancel">Cancelar</button>
                        <button class="tm-btn tm-btn--primary tm-btn--sm" @click="handleSave">✅ Guardar</button>
                    </div>
                </div>
            </div>
        `;
    }

    onMount() {
        this.renderVisualGroups();
        this.loadProjectLabels();
    }

    // ═══════════════════════════════════════════════════════════════
    // TAB MANAGEMENT
    // ═══════════════════════════════════════════════════════════════

    switchTab(e) {
        const tab = e.target.dataset.tab;
        if (!tab || tab === this.state.activeTab) return;
        
        if (this.state.activeTab === 'json' && tab === 'visual') {
            if (!this.syncJsonToVisual()) return;
        } else if (this.state.activeTab === 'visual' && tab === 'json') {
            this.syncVisualToJson();
        }
        
        this.state.activeTab = tab;
    }

    syncJsonToVisual() {
        try {
            const json = this.refs.jsonEditor?.value || '{}';
            const parsed = JSON.parse(json);
            this.state.groups = parsed;
            this.state.jsonError = null;
            this.renderVisualGroups();
            return true;
        } catch (e) {
            this.state.jsonError = `JSON inválido: ${e.message}`;
            return false;
        }
    }

    syncVisualToJson() {
        this.collectVisualData();
        if (this.refs.jsonEditor) {
            this.refs.jsonEditor.value = this.getJsonContent();
        }
    }

    getJsonContent() {
        return JSON.stringify(this.state.groups, null, 2);
    }

    handleJsonInput() {
        this.state.jsonError = null;
    }

    // ═══════════════════════════════════════════════════════════════
    // VISUAL EDITOR
    // ═══════════════════════════════════════════════════════════════

    renderVisualGroups() {
        const container = this.refs.groupsList;
        if (!container) return;
        
        container.innerHTML = '';
        
        Object.entries(this.state.groups).forEach(([groupName, group]) => {
            const groupEl = this.createGroupElement(groupName, group);
            container.appendChild(groupEl);
        });
    }

    createGroupElement(groupName, group) {
        const div = document.createElement('div');
        div.className = 'config-group-item';
        div.dataset.groupName = groupName;
        
        div.innerHTML = TM.html`
            <div class="config-group-header">
                <input type="color" class="config-group-color" value="${group.color}" title="Color">
                <input type="text" class="config-group-name tm-input tm-input--sm" value="${groupName}" placeholder="Nombre">
                <label class="config-group-exclusive">
                    <input type="checkbox" ${group.exclusive !== false ? 'checked' : ''}> Exclusivo
                </label>
                <button class="tm-btn tm-btn--danger tm-btn--icon tm-btn--sm config-group-delete" title="Eliminar">🗑️</button>
            </div>
            <div class="config-group-labels">
                ${group.labels.map(label => `
                    <span class="config-label-chip" data-label="${label}">
                        ${label}
                        <button class="config-label-remove">×</button>
                    </span>
                `).join('')}
                <input type="text" class="config-label-input tm-input tm-input--sm" 
                       placeholder="Nueva etiqueta + Enter" style="width: 150px;">
            </div>
        `;
        
        this.bindGroupEvents(div, groupName);
        
        return div;
    }

    bindGroupEvents(groupEl, originalName) {
        groupEl.querySelector('.config-group-delete').addEventListener('click', () => {
            delete this.state.groups[originalName];
            groupEl.remove();
            this.renderProjectLabels();
        });
        
        groupEl.querySelectorAll('.config-label-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const chip = e.target.closest('.config-label-chip');
                const label = chip.dataset.label;
                const group = this.state.groups[originalName];
                if (group) {
                    group.labels = group.labels.filter(l => l !== label);
                    chip.remove();
                    this.renderProjectLabels();
                }
            });
        });
        
        const input = groupEl.querySelector('.config-label-input');
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && input.value.trim()) {
                this.addLabelToGroup(originalName, input.value.trim());
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

    addGroup() {
        const newName = `Grupo ${Object.keys(this.state.groups).length + 1}`;
        this.state.groups[newName] = {
            color: '#6366f1',
            exclusive: true,
            labels: []
        };
        this.renderVisualGroups();
    }

    addLabelToGroup(groupName, labelName) {
        const group = this.state.groups[groupName];
        if (!group) return;
        
        // Check if label is already in target group
        if (group.labels.includes(labelName)) {
            return; // No change needed
        }
        
        let changed = false;
        
        // Remove from other groups
        Object.values(this.state.groups).forEach(g => {
            if (g.labels.includes(labelName)) {
                g.labels = g.labels.filter(l => l !== labelName);
                changed = true;
            }
        });
        
        // Add to target group
        if (!group.labels.includes(labelName)) {
            group.labels.push(labelName);
            changed = true;
        }
        
        // Only re-render if something changed
        if (changed) {
            this.renderVisualGroups();
        }
    }
        
        this.renderVisualGroups();
        this.renderProjectLabels();
        
        // Use requestAnimationFrame for better performance and race condition prevention
        requestAnimationFrame(() => {
            if (!this.refs.groupsList || !this._mounted) return;
            
            const groupEl = this.refs.groupsList.querySelector(`[data-group-name="${groupName}"]`);
            if (groupEl) {
                groupEl.classList.add('config-group-item--selected');
                this.state.selectedGroup = groupName;
            }
        });
    }

    collectVisualData() {
        const container = this.refs.groupsList;
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
        
        // Only update state if groups actually changed
        if (JSON.stringify(this.state.groups) !== JSON.stringify(newGroups)) {
            this.state.groups = newGroups;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // PROJECT LABELS
    // ═══════════════════════════════════════════════════════════════

    async loadProjectLabels() {
        this.state.loadingLabels = true;
        
        try {
            const labels = await LabelConfig.fetchProjectLabels();
            this.state.projectLabels = labels;
            this.renderProjectLabels();
        } catch (e) {
            console.error('[Config] Error loading labels:', e);
        } finally {
            this.state.loadingLabels = false;
        }
    }

    async refreshLabels() {
        LabelConfig.clearLabelsCache();
        await this.loadProjectLabels();
    }

    renderProjectLabels() {
        const container = this.refs.projectLabelsList;
        if (!container) return;
        
        const { projectLabels, groups } = this.state;
        const assignedLabels = new Set(
            Object.values(groups).flatMap(g => g.labels)
        );
        
        container.innerHTML = projectLabels.map(label => {
            const isAssigned = assignedLabels.has(label.name);
            return `
                <span class="config-project-label ${isAssigned ? 'config-project-label--assigned' : ''}"
                      data-label="${label.name}"
                      style="border-color: ${label.color}; ${isAssigned ? 'opacity: 0.5;' : ''}">
                    ${label.name}
                </span>
            `;
        }).join('');
        
        container.querySelectorAll('.config-project-label').forEach(labelEl => {
            labelEl.addEventListener('click', () => {
                const labelName = labelEl.dataset.label;
                const targetGroup = this.state.selectedGroup || Object.keys(this.state.groups)[0];
                
                if (targetGroup) {
                    this.addLabelToGroup(targetGroup, labelName);
                } else {
                    TM.Toast.warning('Selecciona un grupo primero');
                }
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // ACTIONS
    // ═══════════════════════════════════════════════════════════════

    handleSave() {
        if (this.state.activeTab === 'visual') {
            this.collectVisualData();
        } else {
            if (!this.syncJsonToVisual()) {
                TM.Toast.error('JSON inválido, corrige los errores');
                return;
            }
        }
        
        LabelConfig.saveGroups(this.state.groups);
        TM.Toast.success('Configuración guardada');
        
        this.props.onSave?.(this.state.groups);
        this.emit('save', { groups: this.state.groups });
    }

    handleCancel() {
        this.props.onCancel?.();
        this.emit('cancel');
    }

    handleReset() {
        if (confirm('¿Restaurar la configuración por defecto? Se perderán los cambios.')) {
            this.state.groups = LabelConfig.resetGroups();
            this.renderVisualGroups();
            if (this.refs.jsonEditor) {
                this.refs.jsonEditor.value = this.getJsonContent();
            }
            TM.Toast.info('Configuración restaurada');
        }
    }
}

window.ConfigPopup = ConfigPopup;