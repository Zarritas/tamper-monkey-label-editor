// ==UserScript==
// @name         GitLab Label Groups (TM Framework)
// @namespace    http://tampermonkey.net/
// @version      2.0.0
// @description  Gestiona etiquetas de GitLab organizadas en grupos mutuamente excluyentes
// @author       Jesús Lorenzo
// @match        https://gitlab.com/*/-/issues/*
// @match        https://gitlab.com/*/-/merge_requests/*
// @match        https://git.factorlibre.com/*/-/issues/*
// @match        https://git.factorlibre.com/*/-/merge_requests/*
// @require      https://raw.githubusercontent.com/Zarritas/tm-framework/main/dist/tm-framework.js
// @require      https://raw.githubusercontent.com/Zarritas/tm-framework/main/dist/tm-gitlab.js
// @require      https://raw.githubusercontent.com/FlJesusLorenzo/tamper-monkey-label-editor/main/js/config.js
// @require      https://raw.githubusercontent.com/FlJesusLorenzo/tamper-monkey-label-editor/main/js/components/LabelChip.js
// @require      https://raw.githubusercontent.com/FlJesusLorenzo/tamper-monkey-label-editor/main/js/components/LabelGroup.js
// @require      https://raw.githubusercontent.com/FlJesusLorenzo/tamper-monkey-label-editor/main/js/components/LabelPopup.js
// @require      https://raw.githubusercontent.com/FlJesusLorenzo/tamper-monkey-label-editor/main/js/components/ConfigPopup.js
// @require      https://raw.githubusercontent.com/FlJesusLorenzo/tamper-monkey-label-editor/main/js/app.js
// @resource     TM_CSS https://raw.githubusercontent.com/Zarritas/tm-framework/main/dist/tm-styles.css
// @resource     APP_CSS https://raw.githubusercontent.com/FlJesusLorenzo/tamper-monkey-label-editor/main/css/styles.css
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    GM_addStyle(GM_getResourceText('TM_CSS'));
    GM_addStyle(GM_getResourceText('APP_CSS'));

    if (TM.gitlab.isGitLab()) {
        TM.gitlab.waitForSidebar().then(() => {
            const app = new LabelGroupsApp();
            app.init();
        }).catch(err => {
            console.warn('[Label Groups] Sidebar not found:', err);
        });
    }
})();