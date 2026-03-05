/**
 * Label Groups - GitLab Helpers
 * Vanilla JS replacement for TM.gitlab plugin
 */

const GitLabHelper = (function() {
    'use strict';

    const selectors = {
        sidebar: '.issuable-sidebar',
        sidebarLabels: '[data-testid="sidebar-labels"]',
        noteTextarea: '.js-note-text',
        submitButton: '.js-comment-button',
        currentLabels: '.issuable-show-labels .gl-label'
    };

    function isGitLab() {
        return document.querySelector('meta[content="GitLab"]') !== null ||
               location.hostname.includes('gitlab');
    }

    function getContext() {
        const url = location.pathname;
        const parts = url.split('/').filter(Boolean);

        let type = 'unknown';
        let iid = null;

        if (url.includes('/-/issues/')) {
            type = 'issue';
            iid = parts[parts.indexOf('issues') + 1];
        } else if (url.includes('/-/merge_requests/')) {
            type = 'merge_request';
            iid = parts[parts.indexOf('merge_requests') + 1];
        }

        const projectMatch = url.match(/^\/(.+?)\/-\//);
        const fullPath = projectMatch ? projectMatch[1] : null;
        const pathParts = fullPath ? fullPath.split('/') : [];

        return {
            type,
            namespace: pathParts.slice(0, -1).join('/'),
            project: pathParts[pathParts.length - 1] || 'default',
            fullPath,
            iid,
            url: location.href
        };
    }

    function getProjectId() {
        const meta = document.querySelector('meta[name="project-id"]');
        if (meta) return meta.content;

        if (document.body.dataset.projectId) return document.body.dataset.projectId;

        const pageData = document.querySelector('[data-page]');
        if (pageData?.dataset.projectId) return pageData.dataset.projectId;

        return null;
    }

    function getProjectInfo() {
        const ctx = getContext();
        const id = getProjectId();
        return id ? { id, fullPath: ctx.fullPath, project: ctx.project } : null;
    }

    function getIssueInfo() {
        const ctx = getContext();
        if (!ctx.iid) return null;
        return { type: ctx.type, iid: ctx.iid };
    }

    function getCsrfToken() {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta?.content || '';
    }

    function apiRequest(endpoint, options = {}) {
        const baseUrl = location.origin;
        const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
        const method = options.method || 'GET';
        const headers = {
            'Content-Type': 'application/json',
            'X-CSRF-Token': getCsrfToken(),
            ...options.headers
        };

        return new Promise((resolve, reject) => {
            const reqOpts = {
                method,
                url,
                headers,
                onload(response) {
                    try {
                        const data = JSON.parse(response.responseText);
                        if (response.status >= 200 && response.status < 300) {
                            resolve(data);
                        } else {
                            reject(new Error(`GitLab API error: ${response.status}`));
                        }
                    } catch (e) {
                        reject(new Error(`GitLab API parse error: ${e.message}`));
                    }
                },
                onerror(error) {
                    reject(new Error(`GitLab API network error: ${error?.message || 'Unknown'}`));
                }
            };

            if (method !== 'GET' && options.body) {
                reqOpts.data = typeof options.body === 'string'
                    ? options.body
                    : JSON.stringify(options.body);
            }

            GM_xmlhttpRequest(reqOpts);
        });
    }

    async function getLabels(projectId) {
        const pid = projectId || getProjectId();
        if (!pid) throw new Error('Project ID not found');
        const encoded = encodeURIComponent(pid);
        return apiRequest(`/api/v4/projects/${encoded}/labels?per_page=100`);
    }

    function getCurrentLabels() {
        const labels = document.querySelectorAll(selectors.currentLabels);
        return Array.from(labels).map(el => ({
            name: el.querySelector('.gl-label-text')?.textContent?.trim(),
            color: el.style.backgroundColor || el.dataset.color
        })).filter(l => l.name);
    }

    async function waitForSidebar(timeout = 5000) {
        return Utils.waitForElement(selectors.sidebar, timeout);
    }

    function applyLabelsViaQuickAction(addLabels = [], removeLabels = []) {
        const textarea = document.querySelector(selectors.noteTextarea);
        if (!textarea) return { success: false, error: 'Textarea not found' };

        // Switch to plain text mode if needed
        const plainTextBtn = document.querySelector('[data-testid="plain-text-button"]');
        if (plainTextBtn && !plainTextBtn.classList.contains('active')) {
            plainTextBtn.click();
        }

        const actions = [];
        if (addLabels.length) {
            const labelStr = addLabels.map(l => `~"${l}"`).join(' ');
            actions.push(`/label ${labelStr}`);
        }
        if (removeLabels.length) {
            const labelStr = removeLabels.map(l => `~"${l}"`).join(' ');
            actions.push(`/unlabel ${labelStr}`);
        }

        if (actions.length === 0) return { success: false, error: 'No actions' };

        const existingContent = textarea.value.trim();
        const newContent = existingContent
            ? `${existingContent}\n\n${actions.join('\n')}`
            : actions.join('\n');

        textarea.value = newContent;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));

        return { success: true };
    }

    function submitComment() {
        const button = document.querySelector(selectors.submitButton);
        if (button && !button.disabled) {
            button.click();
            return { success: true };
        }
        return { success: false, error: 'Submit button not found or disabled' };
    }

    async function updateLabels(addLabels = [], removeLabels = []) {
        const ctx = getContext();
        const fullPath = ctx.fullPath;
        const iid = ctx.iid;
        const resourceType = ctx.type === 'merge_request' ? 'merge_requests' : 'issues';

        if (!fullPath || !iid) {
            throw new Error('No se pudo determinar el proyecto o recurso');
        }

        const encodedPath = encodeURIComponent(fullPath);
        const body = {};
        if (addLabels.length > 0) body.add_labels = addLabels.join(',');
        if (removeLabels.length > 0) body.remove_labels = removeLabels.join(',');

        return apiRequest(`/api/v4/projects/${encodedPath}/${resourceType}/${iid}`, {
            method: 'PUT',
            body
        });
    }

    return {
        isGitLab,
        getContext,
        getProjectId,
        getProjectInfo,
        getIssueInfo,
        getLabels,
        getCurrentLabels,
        waitForSidebar,
        updateLabels,
        applyLabelsViaQuickAction,
        submitComment
    };
})();

window.GitLabHelper = GitLabHelper;
