/**
 * Label Groups - Storage Helper
 * Wrapper around Tampermonkey GM_getValue/GM_setValue
 */

const StorageHelper = (function() {
    'use strict';

    function get(key, defaultValue = null) {
        try {
            const raw = GM_getValue(key, null);
            if (raw === null || raw === undefined) return defaultValue;
            if (typeof raw === 'string') {
                try { return JSON.parse(raw); } catch { return raw; }
            }
            return raw;
        } catch {
            return defaultValue;
        }
    }

    function set(key, value) {
        try {
            GM_setValue(key, typeof value === 'object' ? JSON.stringify(value) : value);
        } catch (e) {
            console.error('[Storage] Error saving:', e);
        }
    }

    function remove(key) {
        try {
            GM_deleteValue(key);
        } catch (e) {
            console.error('[Storage] Error removing:', e);
        }
    }

    return { get, set, remove };
})();

window.StorageHelper = StorageHelper;
