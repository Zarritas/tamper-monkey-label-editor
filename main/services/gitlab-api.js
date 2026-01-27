/**
 * TM Label Editor - GitLab API Service
 * Wrapper for GitLab API requests with caching
 */

const GitLabAPI = (function() {
    'use strict';

    // Cache configuration
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    let cachedLabels = null;
    let cacheTimestamp = 0;

    /**
     * Get project path from URL
     * @returns {string|null}
     */
    function getProjectPath() {
        const match = globalThis.location.pathname.match(
            /^\/(.+?)\/-\/(issues|merge_requests)/
        );
        return match ? match[1] : null;
    }

    /**
     * Get GitLab base URL
     * @returns {string}
     */
    function getBaseUrl() {
        return globalThis.location.origin;
    }

    /**
     * Fetch project labels from GitLab API
     * @returns {Promise<Array<{name: string, color: string, description: string}>>}
     */
    function fetchLabels() {
        return new Promise((resolve) => {
            const projectPath = getProjectPath();
            if (!projectPath) {
                TM.Logger.error('GitLabAPI', 'Could not get project path');
                resolve([]);
                return;
            }

            const encodedPath = encodeURIComponent(projectPath);
            const baseUrl = getBaseUrl();
            const url = `${baseUrl}/api/v4/projects/${encodedPath}/labels?per_page=100`;

            TM.Logger.debug('GitLabAPI', 'Fetching labels', { url });

            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                headers: {
                    'Accept': 'application/json'
                },
                withCredentials: true,
                onload: function(response) {
                    if (response.status >= 200 && response.status < 300) {
                        try {
                            const labels = JSON.parse(response.responseText);
                            TM.Logger.debug('GitLabAPI', 'Labels fetched', { count: labels.length });
                            resolve(labels.map(label => ({
                                name: label.name,
                                color: label.color,
                                description: label.description || ''
                            })));
                        } catch (e) {
                            TM.Logger.error('GitLabAPI', 'Error parsing labels', e);
                            resolve([]);
                        }
                    } else {
                        TM.Logger.error('GitLabAPI', 'HTTP error', { status: response.status });
                        resolve([]);
                    }
                },
                onerror: function(error) {
                    TM.Logger.error('GitLabAPI', 'Network error', error);
                    resolve([]);
                }
            });
        });
    }

    /**
     * Get project labels (with caching)
     * @param {boolean} [forceRefresh=false] - Force refresh cache
     * @returns {Promise<Array<{name: string, color: string, description: string}>>}
     */
    async function getLabels(forceRefresh = false) {
        const now = Date.now();

        if (!forceRefresh && cachedLabels && (now - cacheTimestamp < CACHE_DURATION)) {
            TM.Logger.debug('GitLabAPI', 'Using cached labels');
            return cachedLabels;
        }

        cachedLabels = await fetchLabels();
        cacheTimestamp = now;
        return cachedLabels;
    }

    /**
     * Clear labels cache
     */
    function clearCache() {
        cachedLabels = null;
        cacheTimestamp = 0;
        TM.Logger.debug('GitLabAPI', 'Cache cleared');
    }

    /**
     * Get current project path
     * @returns {string|null}
     */
    function getCurrentProjectPath() {
        return getProjectPath();
    }

    return {
        getLabels,
        clearCache,
        getCurrentProjectPath,
        getBaseUrl
    };
})();
