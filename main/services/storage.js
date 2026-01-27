/**
 * TM Label Editor - Storage Service
 * Wrapper for GM_* storage functions
 */

const LabelEditorStorage = (function() {
    'use strict';

    const STORAGE_PREFIX = 'labelGroups_';

    /**
     * Get project name from URL
     * @returns {string}
     */
    function getProjectName() {
        const match = globalThis.location.pathname.match(
            /^\/(?:.+\/)?([^/]+)\/-\/(issues|merge_requests)/
        );
        return match ? match[1] : 'default';
    }

    /**
     * Get storage key for current project
     * @param {string} [projectPath] - Optional project path override
     * @returns {string}
     */
    function getKey(projectPath = null) {
        const project = projectPath || getProjectName();
        return `${STORAGE_PREFIX}${project}`;
    }

    /**
     * Get default empty groups configuration
     * @returns {Object}
     */
    function getDefaultGroups() {
        return {};
    }

    /**
     * Load groups configuration from storage
     * @param {string} [projectPath] - Optional project path override
     * @returns {Object}
     */
    function loadGroups(projectPath = null) {
        const key = getKey(projectPath);
        const saved = GM_getValue(key, null);

        if (saved) {
            try {
                TM.Logger.debug('Storage', 'Loaded config', { key });
                return JSON.parse(saved);
            } catch (e) {
                TM.Logger.error('Storage', 'Error parsing config', e);
            }
        }

        return getDefaultGroups();
    }

    /**
     * Save groups configuration to storage
     * @param {string} projectPath - Project path
     * @param {Object} groups - Groups configuration
     */
    function saveGroups(projectPath, groups) {
        const key = getKey(projectPath);
        GM_setValue(key, JSON.stringify(groups));
        TM.Logger.debug('Storage', 'Saved config', { key });
    }

    /**
     * Get the group containing a specific label
     * @param {string} label - Label name
     * @param {string} [projectPath] - Optional project path
     * @returns {{ name: string, labels: string[], exclusive: boolean } | null}
     */
    function getGroupForLabel(label, projectPath = null) {
        const groups = loadGroups(projectPath);
        for (const [groupName, group] of Object.entries(groups)) {
            if (group.labels.includes(label)) {
                return {
                    name: groupName,
                    labels: group.labels,
                    exclusive: group.exclusive !== false
                };
            }
        }
        return null;
    }

    /**
     * Get current project name
     * @returns {string}
     */
    function getCurrentProjectName() {
        return getProjectName();
    }

    return {
        getKey,
        getDefaultGroups,
        loadGroups,
        saveGroups,
        getGroupForLabel,
        getCurrentProjectName
    };
})();
