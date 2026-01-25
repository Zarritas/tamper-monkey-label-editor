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

    /**
     * Initialize the application
     */
    init() {
        console.log('[Label Groups] Initializing...');
        
        this.createModal();
        
        this.addTriggerButton();
        
        console.log('[Label Groups] Ready!');
    }

    /**
     * Create the main modal container
     */
    createModal() {
        this.modal = new TM.Modal({
            title: '',
            width: '420px',
            footer: false,
            closable: false,
            closeOnOverlay: true,
            closeOnEsc: true,
            onClose: () => this.handleModalClose()
        });
        
        this.modal.mount(document.body);
    }

    /**
     * Add trigger button next to labels in sidebar
     */
    addTriggerButton() {
        const labelsBlock = document.querySelector(
            '[data-testid="sidebar-labels"], .js-labels-block, .block.labels'
        );
        
        if (!labelsBlock) {
            console.warn('[Label Groups] Labels block not found, using floating button');
            this.addFloatingButton();
            return;
        }
        
        const editBtn = labelsBlock.querySelector(
            '.js-sidebar-dropdown-toggle, .edit-link, button[title="Edit"]'
        );
        
        if (editBtn) {
            this.triggerButton = new TM.Button({
                icon: '🏷️',
                variant: 'ghost',
                size: 'sm',
                onClick: () => this.openLabelPopup()
            });
            this.triggerButton.insertAfter(editBtn);
        } else {
            this.triggerButton = new TM.Button({
                text: 'Grupos',
                icon: '🏷️',
                variant: 'secondary',
                size: 'sm',
                onClick: () => this.openLabelPopup()
            });
            this.triggerButton.mount(labelsBlock);
        }
    }

    /**
     * Fallback: floating button
     */
    addFloatingButton() {
        this.triggerButton = new TM.FloatingButton({
            icon: '🏷️',
            position: 'bottom-right',
            tooltip: 'Grupos de etiquetas',
            onClick: () => this.openLabelPopup()
        });
        this.triggerButton.mount(document.body);
    }

    /**
     * Open the main label selection popup
     */
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
        
        this.modal.setProps({ title: '' });
        this.modal.open();
        this.modal.setContent(this.labelPopup);
    }

    /**
     * Open configuration popup
     */
    openConfigPopup() {
        if (this.labelPopup) {
            this.labelPopup.destroy();
            this.labelPopup = null;
        }
        
        const groups = LabelConfig.getGroups();
        
        if (!this.configModal) {
            this.configModal = new TM.Modal({
                title: '',
                width: '600px',
                footer: false,
                closable: false,
                closeOnOverlay: false,
                closeOnEsc: true,
                onClose: () => this.handleConfigClose()
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

    /**
     * Handle labels applied
     */
    async handleApply(changes) {
        try {
            if (!changes || (!changes.labelsAdded?.length && !changes.labelsRemoved?.length)) {
                console.log('[Label Groups] No changes to apply');
                return;
            }

            // Generate Quick Action commands
            const quickActions = [];
            
            // Add label commands
            if (changes.labelsAdded?.length) {
                changes.labelsAdded.forEach(label => {
                    quickActions.push(`/label ${label}`);
                });
            }
            
            // Remove label commands
            if (changes.labelsRemoved?.length) {
                changes.labelsRemoved.forEach(label => {
                    quickActions.push(`/unlabel ${label}`);
                });
            }

            if (quickActions.length === 0) {
                console.log('[Label Groups] No valid quick actions generated');
                return;
            }

            // Concatenate into single comment body
            const commentBody = quickActions.join('\n');
            
            // Get project and issue/MR identifiers from context
            const projectInfo = TM.gitlab.getProjectInfo();
            const issueInfo = TM.gitlab.getIssueInfo();
            
            if (!projectInfo || !issueInfo) {
                console.error('[Label Groups] Could not get project or issue information');
                TM.Toast.error('No se pudo obtener información del proyecto/issue');
                return;
            }

            // Submit comment with Quick Actions to GitLab
            const result = await TM.gitlab.submitComment({
                body: commentBody,
                projectId: projectInfo.id,
                issueIid: issueInfo.iid
            });

            if (result?.success) {
                console.log('[Label Groups] Labels applied successfully:', quickActions);
                TM.Toast.success(`Etiquetas aplicadas: +${changes.labelsAdded?.length || 0} -${changes.labelsRemoved?.length || 0}`);
            } else {
                console.error('[Label Groups] Failed to apply labels:', result?.error);
                TM.Toast.error('Error al aplicar etiquetas');
            }
        } catch (error) {
            console.error('[Label Groups] Error applying labels:', error);
            TM.Toast.error('Error al aplicar etiquetas');
        }
    }

    /**
     * Handle modal close
     */
    handleModalClose() {
        if (this.labelPopup) {
            this.labelPopup.destroy();
            this.labelPopup = null;
        }
    }

    /**
     * Handle config close
     */
    handleConfigClose() {
    }

    /**
     * Close the main modal
     */
    closeModal() {
        this.modal.close();
    }

    /**
     * Destroy the application
     */
    destroy() {
        this.labelPopup?.destroy();
        this.triggerButton?.destroy();
        this.modal?.destroy();
        this.configModal?.destroy();
    }
}

window.LabelGroupsApp = LabelGroupsApp;