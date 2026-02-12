/**
 * Label Groups - Configuration Management
 * Handles storage and default settings per project
 */

const LabelConfig = (function() {
    'use strict';

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

    let projectLabelsCache = null;
    let projectLabelsCacheTime = 0;
    const CACHE_TTL = 5 * 60 * 1000;

    function getProjectName() {
        const ctx = GitLabHelper.getContext();
        return ctx.project || 'default';
    }

    function getStorageKey() {
        return `labelGroups_${getProjectName()}`;
    }

    function getGroups() {
        const key = getStorageKey();
        const stored = StorageHelper.get(key);

        if (stored && typeof stored === 'object') {
            return Utils.deepClone(stored);
        }

        return Utils.deepClone(DEFAULT_GROUPS);
    }

    function saveGroups(groups) {
        const key = getStorageKey();
        StorageHelper.set(key, groups);
    }

    function resetGroups() {
        const key = getStorageKey();
        StorageHelper.remove(key);
        return Utils.deepClone(DEFAULT_GROUPS);
    }

    function getAllConfiguredLabels(groups) {
        groups = groups || getGroups();
        const labels = new Set();

        Object.values(groups).forEach(group => {
            group.labels.forEach(label => labels.add(label));
        });

        return Array.from(labels);
    }

    function findLabelGroup(labelName, groups) {
        groups = groups || getGroups();

        for (const [groupName, group] of Object.entries(groups)) {
            if (group.labels.includes(labelName)) {
                return { groupName, group };
            }
        }

        return null;
    }

    async function fetchProjectLabels(forceRefresh = false) {
        const now = Date.now();

        if (!forceRefresh && projectLabelsCache && (now - projectLabelsCacheTime) < CACHE_TTL) {
            return projectLabelsCache;
        }

        try {
            const labels = await GitLabHelper.getLabels();
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

    function clearLabelsCache() {
        projectLabelsCache = null;
        projectLabelsCacheTime = 0;
    }

    function getCurrentLabels() {
        const labels = GitLabHelper.getCurrentLabels();
        return (labels ?? []).map(l => l.name);
    }

    function exportConfig() {
        return JSON.stringify(getGroups(), null, 2);
    }

    function importConfig(jsonString) {
        try {
            const groups = JSON.parse(jsonString);

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

window.LabelConfig = LabelConfig;
