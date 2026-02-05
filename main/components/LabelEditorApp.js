/**
 * TM Label Editor - LabelEditorApp Component
 * Main application component that manages state and renders modals
 *
 * Note: Uses Arrays instead of Sets for state because TM Framework's
 * Proxy-based reactivity doesn't work well with Set methods.
 */

(function() {
    'use strict';

    const { Component, html } = TM;

    class LabelEditorApp extends Component {
        static defaultProps = {
            projectPath: null
        };

        initialState() {
            return {
                // Using arrays instead of Sets (Proxy compatibility)
                selectedLabels: [],
                labelsToRemove: [],
                currentLabels: [],
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
            this._loadConfig();
            this._injectSidebarButton();
        }

        onDestroy() {
            this._removeSidebarButton();
        }

        // ═══════════════════════════════════════════════════════════
        // CONFIGURATION
        // ═══════════════════════════════════════════════════════════

        _loadConfig() {
            const projectPath = this.props.projectPath || LabelEditorStorage.getCurrentProjectName();
            this.state.groups = LabelEditorStorage.loadGroups(projectPath);
            TM.Logger.debug('LabelEditorApp', 'Config loaded', { groups: Object.keys(this.state.groups) });
        }

        _saveConfig(groups) {
            const projectPath = this.props.projectPath || LabelEditorStorage.getCurrentProjectName();
            this.state.groups = groups;
            LabelEditorStorage.saveGroups(projectPath, groups);
            TM.Logger.debug('LabelEditorApp', 'Config saved');
        }

        async _loadProjectLabels() {
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

        async _refreshProjectLabels() {
            GitLabAPI.clearCache();
            await this._loadProjectLabels();
        }

        // ═══════════════════════════════════════════════════════════
        // CURRENT LABELS (from GitLab sidebar)
        // ═══════════════════════════════════════════════════════════

        _loadCurrentLabels() {
            const selectors = '[data-testid="sidebar-labels"] .gl-label-text, .issuable-show-labels .gl-label-text';
            const labelElements = document.querySelectorAll(selectors);
            this.state.currentLabels = [...labelElements].map(el => el.textContent.trim());
            TM.Logger.debug('LabelEditorApp', 'Current labels loaded', { count: this.state.currentLabels.length });
        }

        // ═══════════════════════════════════════════════════════════
        // LABEL SELECTION LOGIC (using arrays)
        // ═══════════════════════════════════════════════════════════

        _toggleLabel(label, groupName) {
            const group = this.state.groups[groupName];
            if (!group) return;

            const selected = [...this.state.selectedLabels];
            const idx = selected.indexOf(label);

            if (idx >= 0) {
                // Remove from selection
                selected.splice(idx, 1);
                this.state.selectedLabels = selected;
            } else {
                // Add to selection
                if (group.exclusive) {
                    this._deselectOthersInGroup(groupName);
                    this._markCurrentLabelsForRemoval(groupName);
                }
                this.state.selectedLabels = [...this.state.selectedLabels, label];
            }
        }

        _toggleRemoveLabel(label) {
            const toRemove = [...this.state.labelsToRemove];
            const idx = toRemove.indexOf(label);

            if (idx >= 0) {
                toRemove.splice(idx, 1);
                this.state.labelsToRemove = toRemove;
            } else {
                this.state.labelsToRemove = [...toRemove, label];
            }
        }

        _deselectOthersInGroup(groupName) {
            const group = this.state.groups[groupName];
            if (!group) return;
            this.state.selectedLabels = this.state.selectedLabels.filter(
                l => !group.labels.includes(l)
            );
        }

        _markCurrentLabelsForRemoval(groupName) {
            const group = this.state.groups[groupName];
            if (!group) return;
            const current = this.state.currentLabels;
            const toRemove = group.labels.filter(l => current.includes(l));
            // Add unique items
            const existing = [...this.state.labelsToRemove];
            toRemove.forEach(l => {
                if (!existing.includes(l)) existing.push(l);
            });
            this.state.labelsToRemove = existing;
        }

        _clearSelections() {
            this.state.selectedLabels = [];
            this.state.labelsToRemove = [];
        }

        // ═══════════════════════════════════════════════════════════
        // COMMANDS GENERATION
        // ═══════════════════════════════════════════════════════════

        _getCommandsToApply() {
            const current = this.state.currentLabels;
            const toAdd = this.state.selectedLabels.filter(l => !current.includes(l));
            const toRemove = this.state.labelsToRemove.filter(l => current.includes(l));
            return { toAdd, toRemove };
        }

        _generateCommandString() {
            const { toAdd, toRemove } = this._getCommandsToApply();
            const commands = [];
            if (toAdd.length > 0) commands.push(`/label ${toAdd.map(l => `~"${l}"`).join(' ')}`);
            if (toRemove.length > 0) commands.push(`/unlabel ${toRemove.map(l => `~"${l}"`).join(' ')}`);
            return commands.join('\n');
        }

        // ═══════════════════════════════════════════════════════════
        // GITLAB INTEGRATION
        // ═══════════════════════════════════════════════════════════

        _findVisibleTextarea() {
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

        _isRichTextMode() {
            const switchBtn = document.querySelector('[data-testid="editing-mode-switcher"]');
            return switchBtn?.textContent.toLowerCase().includes('plain text');
        }

        async _switchToPlainText() {
            const switchBtn = document.querySelector('[data-testid="editing-mode-switcher"]');
            if (switchBtn && this._isRichTextMode()) {
                TM.Logger.debug('LabelEditorApp', 'Switching to plain text mode');
                switchBtn.click();
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }

        _switchToRichText() {
            const switchBtn = document.querySelector('[data-testid="editing-mode-switcher"]');
            if (switchBtn?.textContent.toLowerCase().includes('rich text')) {
                TM.Logger.debug('LabelEditorApp', 'Switching back to rich text mode');
                switchBtn.click();
            }
        }

        async _applyChanges() {
            const commands = this._generateCommandString();
            if (!commands) {
                this._closeMainModal();
                return;
            }

            TM.Logger.debug('LabelEditorApp', 'Applying changes', { commands });

            const textarea = this._findVisibleTextarea();
            const savedContent = textarea?.value?.trim() || '';
            const wasRichText = this._isRichTextMode();

            await this._switchToPlainText();

            const currentTextarea = this._findVisibleTextarea();
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
                                const restoreTextarea = this._findVisibleTextarea();
                                if (restoreTextarea) {
                                    restoreTextarea.focus();
                                    restoreTextarea.value = savedContent;
                                    restoreTextarea.dispatchEvent(new Event('input', { bubbles: true }));
                                }
                            }
                            if (wasRichText) setTimeout(() => this._switchToRichText(), 300);
                        }, 500);
                    }
                }, 200);

                currentTextarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                await navigator.clipboard.writeText(commands);
                alert('Texto copiado al portapapeles:\n\n' + commands);
            }

            this._closeMainModal();
        }

        // ═══════════════════════════════════════════════════════════
        // MODAL MANAGEMENT
        // ═══════════════════════════════════════════════════════════

        _openMainModal() {
            this._loadCurrentLabels();
            this._clearSelections();
            this.state.showMainModal = true;
        }

        _closeMainModal() {
            this.state.showMainModal = false;
        }

        _openConfigModal() {
            this._loadProjectLabels();
            this.state.showConfigModal = true;
            this.state.showMainModal = false;
        }

        _closeConfigModal() {
            this.state.showConfigModal = false;
        }

        _handleConfigSave(groups) {
            this._saveConfig(groups);
            this._closeConfigModal();
            this._openMainModal();
        }

        // ═══════════════════════════════════════════════════════════
        // SIDEBAR BUTTON
        // ═══════════════════════════════════════════════════════════

        _injectSidebarButton() {
            this._observer = new MutationObserver(() => {
                const labelsSection = document.querySelector('[data-testid="sidebar-labels"]');
                if (!labelsSection) return;

                const editButton = labelsSection.querySelector('[data-testid="edit-button"]');
                if (!editButton) return;

                if (labelsSection.querySelector('.le-sidebar-btn')) return;

                const btn = document.createElement('button');
                btn.className = 'le-sidebar-btn';
                btn.innerHTML = 'G';
                btn.title = 'Gestionar etiquetas por grupos';
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this._openMainModal();
                });

                editButton.parentElement.insertBefore(btn, editButton);
                TM.Logger.debug('LabelEditorApp', 'Sidebar button injected');
            });

            this._observer.observe(document.body, { childList: true, subtree: true });
        }

        _removeSidebarButton() {
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
            const isDark = TM.theme?.isDark ?? false;
            const themeClass = isDark ? 'dark-mode' : '';

            // Always render a stable container - modals are mounted in onUpdate
            return `<div class="label-editor ${themeClass}"></div>`;
        }

        onUpdate() {
            if (!this._el) return;

            const { showMainModal, showConfigModal, groups, selectedLabels, labelsToRemove, currentLabels, projectLabels, isLoading } = this.state;

            // Clean up modals when closed
            if (!showMainModal) {
                const mainModal = this.getChild('mainModal');
                if (mainModal) {
                    mainModal.destroy();
                    this.removeChild('mainModal');
                }
            }

            if (!showConfigModal) {
                const configModal = this.getChild('configModal');
                if (configModal) {
                    configModal.destroy();
                    this.removeChild('configModal');
                }
            }

            // Mount main modal if needed
            if (showMainModal && !this.getChild('mainModal')) {
                const modal = new LabelGroupsModal({
                    groups,
                    selectedLabels: new Set(selectedLabels),
                    labelsToRemove: new Set(labelsToRemove),
                    currentLabels: new Set(currentLabels),
                    commands: this._getCommandsToApply(),
                    onClose: () => this._closeMainModal(),
                    onApply: () => this._applyChanges(),
                    onOpenConfig: () => this._openConfigModal(),
                    onLabelClick: (label, group) => this._toggleLabel(label, group),
                    onLabelDoubleClick: (label) => this._toggleRemoveLabel(label)
                });

                this.addChild('mainModal', modal);
                modal.mount(this._el);
            }

            // Mount config modal if needed
            if (showConfigModal && !this.getChild('configModal')) {
                const modal = new LabelConfigModal({
                    groups,
                    projectLabels,
                    isLoading,
                    onClose: () => this._closeConfigModal(),
                    onSave: (g) => this._handleConfigSave(g),
                    onRefreshLabels: () => this._refreshProjectLabels()
                });

                this.addChild('configModal', modal);
                modal.mount(this._el);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // EXPORT
    // ═══════════════════════════════════════════════════════════════

    globalThis.LabelEditorApp = LabelEditorApp;

    if (typeof TM !== 'undefined') {
        TM.LabelEditorApp = LabelEditorApp;
    }

})();
