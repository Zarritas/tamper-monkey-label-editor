/**
 * Label Groups - Configuration Management
 * Handles storage and default settings per project
 */

const LabelConfig = (function() {
    'use strict';

    // Default label groups
    const DEFAULT_GROUPS = {
        "Área": {
            color: "#6366f1",
            exclusive: true,
            labels: []
        },
        "Criticidad": {
            color: "#ef4444",
            exclusive: true,
            labels: []
        },
        "Etapa": {
            color: "#22c55e",
            exclusive: true,
            labels: []
        },
        "Tipología": {
            color: "#f59e0b",
            exclusive: true,
            labels: []
        },
        "Otro": {
            color: "#9ca3af",
            exclusive: false,
            labels: []
        }
    };

    // Cache for project labels from API
    let projectLabelsCache = null;
    let projectLabelsCacheTime = 0;
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    /**
     * Get current project name from URL
     */
    function getProjectName() {
        const ctx = TM.gitlab.getContext();
        return ctx.project || 'default';
    }

    /**
     * Get storage key for current project
     */
    function getStorageKey() {
        return `labelGroups_${getProjectName()}`;
    }

    /**
     * Get label groups for current project
     */
    function getGroups() {
        const key = getStorageKey();
        const stored = TM.storage.get(key);
        
        if (stored && typeof stored === 'object') {
            return TM.deepClone(stored);
        }
        
        return TM.deepClone(DEFAULT_GROUPS);
    }

    /**
     * Save label groups for current project
     */
    function saveGroups(groups) {
        const key = getStorageKey();
        TM.storage.set(key, groups);
    }

    /**
     * Reset to default groups
     */
    function resetGroups() {
        const key = getStorageKey();
        TM.storage.remove(key);
        return TM.deepClone(DEFAULT_GROUPS);
    }

    /**
     * Get all labels from all groups (flat list)
     */
    function getAllConfiguredLabels(groups = null) {
        groups = groups || getGroups();
        const labels = new Set();
        
        Object.values(groups).forEach(group => {
            group.labels.forEach(label => labels.add(label));
        });
        
        return Array.from(labels);
    }

    /**
     * Find which group a label belongs to
     */
    function findLabelGroup(labelName, groups = null) {
        groups = groups || getGroups();
        
        for (const [groupName, group] of Object.entries(groups)) {
            if (group.labels.includes(labelName)) {
                return { groupName, group };
            }
        }
        
        return null;
    }

    /**
     * Fetch labels from GitLab API (with caching)
     */
    async function fetchProjectLabels(forceRefresh = false) {
        const now = Date.now();
        
        if (!forceRefresh && projectLabelsCache && (now - projectLabelsCacheTime) < CACHE_TTL) {
            return projectLabelsCache;
        }
        
        try {
            const labels = await TM.gitlab.getLabels();
            projectLabelsCache = labels.map(l => ({
                name: l.name,
                color: l.color,
                description: l.description
            }));
            projectLabelsCacheTime = now;
            return projectLabelsCache;
        } catch (error) {
            console.error('[Label Groups] Error fetching labels:', error);
            return projectLabelsCache || [];
        }
    }

    /**
     * Clear labels cache
     */
    function clearLabelsCache() {
        projectLabelsCache = null;
        projectLabelsCacheTime = 0;
    }

    /**
     * Get current labels on the issue/MR
     */
    function getCurrentLabels() {
        const labels = TM.gitlab.getCurrentLabels();
        return (labels ?? []).map(l => l.name);
    }

    /**
     * Export config as JSON string
     */
    function exportConfig() {
        return JSON.stringify(getGroups(), null, 2);
    }

    /**
     * Import config from JSON string
     */
    function importConfig(jsonString) {
        try {
            const groups = JSON.parse(jsonString);
            
            // Validate structure
            if (typeof groups !== 'object' || groups === null) {
                throw new Error('Debe ser un objeto JSON');
            }
            
            for (const [name, group] of Object.entries(groups)) {
                if (!group.color || !Array.isArray(group.labels)) {
                    throw new Error(`Grupo "${name}" inválido`);
                }
                
                if (typeof group.exclusive !== 'boolean') {
                    throw new Error(`Grupo "${name}" inválido: la propiedad "exclusive" debe ser booleana`);
                }
            }
            
            saveGroups(groups);
            return { success: true, groups };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    return {
        DEFAULT_GROUPS,
        getProjectName,
        getGroups,
        saveGroups,
        resetGroups,
        getAllConfiguredLabels,
        findLabelGroup,
        fetchProjectLabels,
        clearLabelsCache,
        getCurrentLabels,
        exportConfig,
        importConfig
    };
})();

// Make available globally
window.LabelConfig = LabelConfig;