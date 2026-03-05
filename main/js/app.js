/**
 * LabelGroupsApp - Main Application
 * Orchestrates the label editor components
 */

class LabelGroupsApp {
    constructor() {
        this.modal = null;
        this.labelPopup = null;
        this.configModal = null;
        this.triggerButton = null;
    }

    init() {
        console.log('[Label Groups] Initializing...');

        this.createModal();
        this.addTriggerButton();

        console.log('[Label Groups] Ready!');
    }

    createModal() {
        this.modal = new SimpleModal({
            width: '420px',
            closeOnOverlay: true,
            closeOnEsc: true,
            onClose: () => this.handleModalClose()
        });

        this.modal.mount(document.body);
    }

    addTriggerButton() {
        const btn = document.createElement('button');
        btn.className = 'lg-floating-btn';
        btn.textContent = '\uD83C\uDFF7\uFE0F';
        btn.title = 'Grupos de etiquetas';
        btn.addEventListener('click', () => this.openLabelPopup());
        document.body.appendChild(btn);
        this.triggerButton = btn;
    }

    openLabelPopup() {
        const groups = LabelConfig.getGroups();
        const currentLabels = LabelConfig.getCurrentLabels();

        if (this.labelPopup) {
            this.labelPopup.destroy();
        }

        this.labelPopup = new LabelPopup({
            groups,
            currentLabels,
            onApply: (changes) => this.handleApply(changes),
            onConfig: () => this.openConfigPopup(),
            onClose: () => this.closeModal()
        });

        this.modal.open();
        this.modal.setContent(this.labelPopup);
    }

    openConfigPopup() {
        if (this.labelPopup) {
            this.labelPopup.destroy();
            this.labelPopup = null;
        }

        const groups = LabelConfig.getGroups();

        if (!this.configModal) {
            this.configModal = new SimpleModal({
                width: '600px',
                closeOnOverlay: false,
                closeOnEsc: true,
                onClose: () => {}
            });
            this.configModal.mount(document.body);
        }

        const configPopup = new ConfigPopup({
            groups,
            onSave: (newGroups) => {
                this.configModal.close();
                setTimeout(() => this.openLabelPopup(), 100);
            },
            onCancel: () => {
                this.configModal.close();
                setTimeout(() => this.openLabelPopup(), 100);
            }
        });

        this.modal.close();
        this.configModal.open();
        this.configModal.setContent(configPopup);
    }

    async handleApply(changes) {
        try {
            if (!changes || (!changes.labelsAdded?.length && !changes.labelsRemoved?.length)) {
                console.log('[Label Groups] No changes to apply');
                return;
            }

            console.log('[Label Groups] Labels applied:', changes);
            this.modal.close();
        } catch (error) {
            console.error('[Label Groups] Error applying labels:', error);
            Toast.error('Error al aplicar etiquetas');
        }
    }

    handleModalClose() {
        if (this.labelPopup) {
            this.labelPopup.destroy();
            this.labelPopup = null;
        }
    }

    closeModal() {
        this.modal.close();
    }

    destroy() {
        this.labelPopup?.destroy();
        this.triggerButton?.remove();
        this.modal?.destroy();
        this.configModal?.destroy();
    }
}

window.LabelGroupsApp = LabelGroupsApp;
