/**
 * LabelPopup Component
 * Main popup for selecting/deselecting labels
 */

class LabelPopup {
    static defaultProps = {
        groups: {},
        currentLabels: [],
        onApply: null,
        onConfig: null,
        onClose: null
    };

    constructor(props = {}) {
        this.props = { ...LabelPopup.defaultProps, ...props };
        this.state = {
            loading: false,
            changes: { toAdd: [], toRemove: [] }
        };
        this.el = null;
        this._groupComponents = [];
        this._footerResetBtn = null;
        this._footerApplyBtn = null;
        this._infoContainer = null;
    }

    render() {
        const { groups } = this.props;
        const projectName = LabelConfig.getProjectName();

        const div = document.createElement('div');
        div.className = 'label-popup';

        // Header
        const header = document.createElement('div');
        header.className = 'label-popup__header';

        const title = document.createElement('h3');
        title.className = 'label-popup__title';
        title.textContent = '\uD83C\uDFF7\uFE0F Etiquetas';
        header.appendChild(title);

        const actions = document.createElement('div');
        actions.className = 'label-popup__actions';

        const configBtn = document.createElement('button');
        configBtn.className = 'lg-btn lg-btn--ghost lg-btn--icon lg-btn--sm';
        configBtn.title = 'Configuración';
        configBtn.textContent = '\u2699\uFE0F';
        configBtn.addEventListener('click', () => this.props.onConfig?.());
        actions.appendChild(configBtn);

        const closeBtn = document.createElement('button');
        closeBtn.className = 'lg-btn lg-btn--ghost lg-btn--icon lg-btn--sm';
        closeBtn.title = 'Cerrar';
        closeBtn.textContent = '\u2715';
        closeBtn.addEventListener('click', () => this.props.onClose?.());
        actions.appendChild(closeBtn);

        header.appendChild(actions);
        div.appendChild(header);

        // Info bar
        this._infoContainer = document.createElement('div');
        this._infoContainer.className = 'label-popup__info';

        const projectTag = document.createElement('span');
        projectTag.className = 'lg-tag lg-tag--sm';
        projectTag.textContent = `\uD83D\uDCC1 ${projectName}`;
        this._infoContainer.appendChild(projectTag);

        div.appendChild(this._infoContainer);

        // Body (groups container)
        const body = document.createElement('div');
        body.className = 'label-popup__body';

        if (Object.keys(groups).length === 0) {
            const empty = document.createElement('div');
            empty.className = 'label-popup__empty';
            empty.textContent = 'No hay grupos configurados. Haz clic en \u2699\uFE0F para configurar.';
            body.appendChild(empty);
        } else {
            this._renderGroups(body);
        }

        div.appendChild(body);

        // Footer
        const footer = document.createElement('div');
        footer.className = 'label-popup__footer';

        this._footerResetBtn = document.createElement('button');
        this._footerResetBtn.className = 'lg-btn lg-btn--secondary lg-btn--sm';
        this._footerResetBtn.textContent = '\uD83D\uDD04 Resetear';
        this._footerResetBtn.disabled = true;
        this._footerResetBtn.addEventListener('click', () => this._handleReset());
        footer.appendChild(this._footerResetBtn);

        this._footerApplyBtn = document.createElement('button');
        this._footerApplyBtn.className = 'lg-btn lg-btn--primary lg-btn--sm';
        this._footerApplyBtn.textContent = '\u2705 Aplicar';
        this._footerApplyBtn.disabled = true;
        this._footerApplyBtn.addEventListener('click', () => this._handleApply());
        footer.appendChild(this._footerApplyBtn);

        div.appendChild(footer);

        this.el = div;
        return div;
    }

    mount(container) {
        if (!this.el) this.render();
        container.appendChild(this.el);
    }

    _renderGroups(container) {
        const { groups, currentLabels } = this.props;
        this._groupComponents = [];

        Object.entries(groups).forEach(([groupName, group]) => {
            const groupComponent = new LabelGroup({
                name: groupName,
                color: group.color,
                exclusive: group.exclusive !== false,
                labels: group.labels,
                currentLabels: currentLabels,
                onChange: () => this._handleGroupChange()
            });

            groupComponent.mount(container);
            this._groupComponents.push(groupComponent);
        });
    }

    _handleGroupChange() {
        const allChanges = { toAdd: [], toRemove: [] };

        this._groupComponents.forEach(group => {
            const groupChanges = group.getChanges();
            allChanges.toAdd.push(...groupChanges.toAdd);
            allChanges.toRemove.push(...groupChanges.toRemove);
        });

        allChanges.toAdd = [...new Set(allChanges.toAdd)];
        allChanges.toRemove = [...new Set(allChanges.toRemove)];
        allChanges.toRemove = allChanges.toRemove.filter(l => !allChanges.toAdd.includes(l));

        this.state.changes = allChanges;
        this._updateFooter();
    }

    _updateFooter() {
        const { changes, loading } = this.state;
        const hasChanges = changes.toAdd.length > 0 || changes.toRemove.length > 0;

        if (this._footerResetBtn) this._footerResetBtn.disabled = !hasChanges;
        if (this._footerApplyBtn) {
            this._footerApplyBtn.disabled = loading || !hasChanges;
            this._footerApplyBtn.textContent = loading ? '\u23F3 Aplicando...' : '\u2705 Aplicar';
        }

        // Update changes summary in info bar
        if (this._infoContainer) {
            const existing = this._infoContainer.querySelectorAll('.label-popup__change');
            existing.forEach(el => el.remove());

            if (changes.toAdd.length) {
                const addSpan = document.createElement('span');
                addSpan.className = 'label-popup__change label-popup__change--add';
                addSpan.textContent = `+${changes.toAdd.length}`;
                this._infoContainer.appendChild(addSpan);
            }
            if (changes.toRemove.length) {
                const removeSpan = document.createElement('span');
                removeSpan.className = 'label-popup__change label-popup__change--remove';
                removeSpan.textContent = `-${changes.toRemove.length}`;
                this._infoContainer.appendChild(removeSpan);
            }
        }
    }

    async _handleApply() {
        const { changes } = this.state;

        if (changes.toAdd.length === 0 && changes.toRemove.length === 0) {
            Toast.info('No hay cambios que aplicar');
            return;
        }

        try {
            this.state.loading = true;
            this._updateFooter();

            await GitLabHelper.updateLabels(changes.toAdd, changes.toRemove);

            Toast.success(`Aplicado: +${changes.toAdd.length} -${changes.toRemove.length} etiquetas`);
            this.props.onApply?.(changes);
            this.props.onClose?.();

            // Recargar para reflejar los cambios en la sidebar
            setTimeout(() => location.reload(), 500);
        } catch (error) {
            console.error('[Label Popup] Error applying labels:', error);
            Toast.error('Error al aplicar etiquetas');
        } finally {
            this.state.loading = false;
            this._updateFooter();
        }
    }

    _handleReset() {
        this._groupComponents.forEach(group => group.reset());
        this.state.changes = { toAdd: [], toRemove: [] };
        this._updateFooter();
    }

    destroy() {
        this._groupComponents.forEach(g => g.destroy());
        this._groupComponents = [];
        this.el?.remove();
        this.el = null;
    }
}

window.LabelPopup = LabelPopup;
