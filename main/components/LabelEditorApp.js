/**
 * TM Label Editor - LabelEditorApp Component
 * Main orchestrator component for the Label Editor
 */

class LabelEditorApp extends TM.Component {
    static defaultProps = {
        /** GitLab project path */
        projectPath: null
    };

    initialState() {
        return {
            // Selection state
            selectedLabels: new Set(),
            labelsToRemove: new Set(),
            currentLabels: new Set(),

            // Configuration
            groups: {},
            projectLabels: [],

            // UI state
            showMainModal: false,
            showConfigModal: false,
            isLoading: false,
            error: null
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // LIFECYCLE
    // ═══════════════════════════════════════════════════════════════════════

    onMount() {
        TM.Logger.info('LabelEditorApp', 'Mounted');
        this.loadConfig();
        this.injectSidebarButton();
    }

    onDestroy() {
        this.removeSidebarButton();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Load groups configuration from storage
     */
    loadConfig() {
        const projectPath = this.props.projectPath || LabelEditorStorage.getCurrentProjectName();
        this.state.groups = LabelEditorStorage.loadGroups(projectPath);
        TM.Logger.debug('LabelEditorApp', 'Config loaded', { groups: Object.keys(this.state.groups) });
    }

    /**
     * Save groups configuration to storage
     * @param {Object} groups - New groups configuration
     */
    saveConfig(groups) {
        const projectPath = this.props.projectPath || LabelEditorStorage.getCurrentProjectName();
        this.state.groups = groups;
        LabelEditorStorage.saveGroups(projectPath, groups);
        TM.Logger.debug('LabelEditorApp', 'Config saved');
    }

    /**
     * Load project labels from GitLab API
     */
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

    /**
     * Refresh project labels (force)
     */
    async refreshProjectLabels() {
        GitLabAPI.clearCache();
        await this.loadProjectLabels();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CURRENT LABELS (from DOM)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Read current labels from GitLab sidebar
     */
    loadCurrentLabels() {
        const selectors = '[data-testid="sidebar-labels"] .gl-label-text, .issuable-show-labels .gl-label-text';
        const labelElements = document.querySelectorAll(selectors);
        this.state.currentLabels = new Set(
            [...labelElements].map(el => el.textContent.trim())
        );
        TM.Logger.debug('LabelEditorApp', 'Current labels loaded', { count: this.state.currentLabels.size });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // LABEL SELECTION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Toggle label selection
     * @param {string} label - Label name
     * @param {string} groupName - Group name
     */
    toggleLabel(label, groupName) {
        const group = this.state.groups[groupName];
        if (!group) return;

        if (this.state.selectedLabels.has(label)) {
            // Deselect
            const newSet = new Set(this.state.selectedLabels);
            newSet.delete(label);
            this.state.selectedLabels = newSet;
        } else {
            // Select
            if (group.exclusive) {
                this.deselectOthersInGroup(groupName);
                this.markCurrentLabelsForRemoval(groupName);
            }
            this.state.selectedLabels = new Set([...this.state.selectedLabels, label]);
        }
    }

    /**
     * Toggle label for removal
     * @param {string} label - Label name
     */
    toggleRemoveLabel(label) {
        if (this.state.labelsToRemove.has(label)) {
            const newSet = new Set(this.state.labelsToRemove);
            newSet.delete(label);
            this.state.labelsToRemove = newSet;
        } else {
            this.state.labelsToRemove = new Set([...this.state.labelsToRemove, label]);
        }
    }

    /**
     * Deselect other labels in the same exclusive group
     * @param {string} groupName
     */
    deselectOthersInGroup(groupName) {
        const group = this.state.groups[groupName];
        if (!group) return;

        this.state.selectedLabels = new Set(
            [...this.state.selectedLabels].filter(l => !group.labels.includes(l))
        );
    }

    /**
     * Mark current labels in group for removal (exclusive groups)
     * @param {string} groupName
     */
    markCurrentLabelsForRemoval(groupName) {
        const group = this.state.groups[groupName];
        if (!group) return;

        const toRemove = group.labels.filter(l => this.state.currentLabels.has(l));
        this.state.labelsToRemove = new Set([...this.state.labelsToRemove, ...toRemove]);
    }

    /**
     * Clear all selections
     */
    clearSelections() {
        this.state.selectedLabels = new Set();
        this.state.labelsToRemove = new Set();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // COMMANDS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Get commands to apply based on current selections
     * @returns {{ toAdd: string[], toRemove: string[] }}
     */
    getCommandsToApply() {
        const toAdd = [...this.state.selectedLabels]
            .filter(l => !this.state.currentLabels.has(l));

        const toRemove = [...this.state.labelsToRemove]
            .filter(l => this.state.currentLabels.has(l));

        return { toAdd, toRemove };
    }

    /**
     * Generate command string for GitLab
     * @returns {string}
     */
    generateCommandString() {
        const { toAdd, toRemove } = this.getCommandsToApply();
        const commands = [];

        if (toAdd.length > 0) {
            commands.push(`/label ${toAdd.map(l => `~"${l}"`).join(' ')}`);
        }
        if (toRemove.length > 0) {
            commands.push(`/unlabel ${toRemove.map(l => `~"${l}"`).join(' ')}`);
        }

        return commands.join('\n');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GITLAB INTEGRATION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Find visible textarea for comments
     * @returns {HTMLTextAreaElement|null}
     */
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
                if (rect.width > 0 && rect.height > 0) {
                    return el;
                }
            }
        }
        return null;
    }

    /**
     * Check if in rich text mode
     * @returns {boolean}
     */
    isRichTextMode() {
        const switchBtn = document.querySelector('[data-testid="editing-mode-switcher"]');
        return switchBtn?.textContent.toLowerCase().includes('plain text');
    }

    /**
     * Switch to plain text mode
     * @returns {Promise<void>}
     */
    async switchToPlainText() {
        const switchBtn = document.querySelector('[data-testid="editing-mode-switcher"]');
        if (switchBtn && this.isRichTextMode()) {
            TM.Logger.debug('LabelEditorApp', 'Switching to plain text mode');
            switchBtn.click();
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    }

    /**
     * Switch back to rich text mode
     */
    switchToRichText() {
        const switchBtn = document.querySelector('[data-testid="editing-mode-switcher"]');
        if (switchBtn?.textContent.toLowerCase().includes('rich text')) {
            TM.Logger.debug('LabelEditorApp', 'Switching back to rich text mode');
            switchBtn.click();
        }
    }

    /**
     * Apply label changes to GitLab
     */
    async applyChanges() {
        const commands = this.generateCommandString();
        if (!commands) {
            this.closeMainModal();
            return;
        }

        TM.Logger.debug('LabelEditorApp', 'Applying changes', { commands });

        // Save user's current content
        const textarea = this.findVisibleTextarea();
        const savedContent = textarea?.value?.trim() || '';
        const wasRichText = this.isRichTextMode();

        // Switch to plain text if needed
        await this.switchToPlainText();

        // Insert commands
        const currentTextarea = this.findVisibleTextarea();
        if (currentTextarea) {
            currentTextarea.focus();
            currentTextarea.value = commands;
            currentTextarea.dispatchEvent(new Event('input', { bubbles: true }));
            currentTextarea.dispatchEvent(new Event('change', { bubbles: true }));

            // Submit
            setTimeout(() => {
                const submitBtn = document.querySelector('.js-comment-submit-button button[type="submit"]');
                if (submitBtn) {
                    if (submitBtn.disabled) {
                        submitBtn.removeAttribute('disabled');
                        submitBtn.classList.remove('disabled');
                    }
                    submitBtn.click();

                    // Restore content after submit
                    setTimeout(() => {
                        if (savedContent) {
                            const restoreTextarea = this.findVisibleTextarea();
                            if (restoreTextarea) {
                                restoreTextarea.focus();
                                restoreTextarea.value = savedContent;
                                restoreTextarea.dispatchEvent(new Event('input', { bubbles: true }));
                            }
                        }

                        if (wasRichText) {
                            setTimeout(() => this.switchToRichText(), 300);
                        }
                    }, 500);
                }
            }, 200);

            currentTextarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            // Fallback: copy to clipboard
            await navigator.clipboard.writeText(commands);
            alert('Texto copiado al portapapeles:\n\n' + commands);
        }

        this.closeMainModal();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MODAL MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════

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

    // ═══════════════════════════════════════════════════════════════════════
    // SIDEBAR BUTTON
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Inject sidebar button into GitLab UI
     */
    injectSidebarButton() {
        // Use MutationObserver to wait for sidebar
        this._observer = new MutationObserver(() => {
            const labelsSection = document.querySelector('[data-testid="sidebar-labels"]');
            if (!labelsSection) return;

            const editButton = labelsSection.querySelector('[data-testid="edit-button"]');
            if (!editButton) return;

            // Check if already injected
            if (labelsSection.querySelector('.le-sidebar-btn')) return;

            // Create button
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

    /**
     * Remove sidebar button and observer
     */
    removeSidebarButton() {
        if (this._observer) {
            this._observer.disconnect();
            this._observer = null;
        }

        const btn = document.querySelector('.le-sidebar-btn');
        if (btn) {
            btn.remove();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════

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

        return TM.html`
            <div class="label-editor ${isDark ? 'dark-mode' : ''}">
                ${modalContent}
            </div>
        `;
    }
}

// Register component
if (typeof TM !== 'undefined') {
    TM.LabelEditorApp = LabelEditorApp;
}
