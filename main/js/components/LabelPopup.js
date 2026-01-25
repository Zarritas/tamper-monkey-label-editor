/**
 * LabelPopup Component
 * Main popup for selecting/deselecting labels
 */

class LabelPopup extends TM.Component {
    static defaultProps = {
        groups: {},
        currentLabels: [],
        onApply: null,
        onConfig: null,
        onClose: null
    };

    initialState() {
        return {
            loading: false,
            changes: { toAdd: [], toRemove: [] }
        };
    }

    render() {
        const { groups } = this.props;
        const { loading, changes } = this.state;
        
        const hasChanges = changes.toAdd.length > 0 || changes.toRemove.length > 0;
        const projectName = LabelConfig.getProjectName();

        return TM.html`
            <div class="label-popup">
                <div class="label-popup__header">
                    <h3 class="label-popup__title">🏷️ Etiquetas</h3>
                    <div class="label-popup__actions">
                        <button class="tm-btn tm-btn--ghost tm-btn--icon tm-btn--sm" 
                                title="Configuración" @click="handleConfig">⚙️</button>
                        <button class="tm-btn tm-btn--ghost tm-btn--icon tm-btn--sm" 
                                title="Cerrar" @click="handleClose">✕</button>
                    </div>
                </div>
                
                <div class="label-popup__info">
                    <span class="tm-tag tm-tag--sm">📁 ${projectName}</span>
                    ${hasChanges ? this.renderChangesSummary() : ''}
                </div>
                
                <div class="label-popup__body" ref="groupsContainer">
                    ${Object.keys(groups).length === 0 
                        ? '<div class="label-popup__empty">No hay grupos configurados. Haz clic en ⚙️ para configurar.</div>'
                        : '<div class="label-popup__loading">Cargando grupos...</div>'
                    }
                </div>
                
                <div class="label-popup__footer">
                    <button class="tm-btn tm-btn--secondary tm-btn--sm" @click="handleReset" ${!hasChanges ? 'disabled' : ''}>
                        🔄 Resetear
                    </button>
                    <button class="tm-btn tm-btn--primary tm-btn--sm" @click="handleApply" ${loading || !hasChanges ? 'disabled' : ''}>
                        ${loading ? '⏳' : '✅'} Aplicar
                    </button>
                </div>
            </div>
        `;
    }

    renderChangesSummary() {
        const { changes } = this.state;
        const parts = [];
        
        if (changes.toAdd.length) {
            parts.push(`<span class="label-popup__change label-popup__change--add">+${changes.toAdd.length}</span>`);
        }
        if (changes.toRemove.length) {
            parts.push(`<span class="label-popup__change label-popup__change--remove">-${changes.toRemove.length}</span>`);
        }
        
        return parts.join(' ');
    }

    onMount() {
        this.renderGroups();
    }

    renderGroups() {
        const { groups, currentLabels } = this.props;
        const container = this.refs.groupsContainer;
        
        if (!container || Object.keys(groups).length === 0) return;
        
        container.innerHTML = '';
        this._groupComponents = [];

        Object.entries(groups).forEach(([groupName, group]) => {
            const groupComponent = new LabelGroup({
                name: groupName,
                color: group.color,
                exclusive: group.exclusive !== false,
                labels: group.labels,
                currentLabels: currentLabels,
                onChange: (name, changes) => this.handleGroupChange()
            });
            
            groupComponent.mount(container);
            this._groupComponents.push(groupComponent);
            this.addChild(groupName, groupComponent);
        });
    }

    handleGroupChange() {
        const allChanges = { toAdd: [], toRemove: [] };
        
        this._groupComponents?.forEach(group => {
            const groupChanges = group.getChanges();
            allChanges.toAdd.push(...groupChanges.toAdd);
            allChanges.toRemove.push(...groupChanges.toRemove);
        });
        
        allChanges.toAdd = [...new Set(allChanges.toAdd)];
        allChanges.toRemove = [...new Set(allChanges.toRemove)];
        
        allChanges.toRemove = allChanges.toRemove.filter(l => !allChanges.toAdd.includes(l));
        
        this.state.changes = allChanges;
    }

    async handleApply() {
        const { changes } = this.state;
        
        if (changes.toAdd.length === 0 && changes.toRemove.length === 0) {
            TM.Toast.info('No hay cambios que aplicar');
            return;
        }
        
        try {
            this.state.loading = true;
            
            // Apply labels via Quick Action
            const applyResult = await TM.gitlab.applyLabelsViaQuickAction(changes.toAdd, changes.toRemove);
            
            if (!applyResult?.success) {
                throw new Error(applyResult?.error || 'Failed to apply labels');
            }
            
            // Submit comment to execute the quick actions
            const commentResult = await TM.gitlab.submitComment();
            
            if (!commentResult?.success) {
                throw new Error(commentResult?.error || 'Failed to submit comment');
            }
            
            TM.Toast.success(`Aplicado: +${changes.toAdd.length} -${changes.toRemove.length} etiquetas`);
            
            // Call callbacks and emit events after successful operations
            this.props.onApply?.(changes);
            this.emit('apply', changes);
            
            // Close popup deterministically after successful operations
            this.props.onClose?.();
            
        } catch (error) {
            console.error('[Label Popup] Error applying labels:', error);
            TM.Toast.error('Error al aplicar etiquetas');
        } finally {
            // Always reset loading state
            this.state.loading = false;
        }
    }

    handleReset() {
        this._groupComponents?.forEach(group => group.reset());
        this.state.changes = { toAdd: [], toRemove: [] };
    }

    handleConfig() {
        this.props.onConfig?.();
        this.emit('config');
    }

    handleClose() {
        this.props.onClose?.();
        this.emit('close');
    }

    /**
     * Update with new groups config
     */
    updateGroups(groups) {
        this.props.groups = groups;
        this.renderGroups();
        this.state.changes = { toAdd: [], toRemove: [] };
    }

    onDestroy() {
        this._groupComponents?.forEach(g => g.destroy());
    }
}

window.LabelPopup = LabelPopup;