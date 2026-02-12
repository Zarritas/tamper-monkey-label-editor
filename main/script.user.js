// ==UserScript==
// @name         GitLab Label Groups
// @namespace    http://tampermonkey.net/
// @version      2.1.0
// @description  Gestiona etiquetas de GitLab organizadas en grupos mutuamente excluyentes
// @author       Jesús Lorenzo
// @match        https://gitlab.com/*/-/issues/*
// @match        https://gitlab.com/*/-/merge_requests/*
// @match        https://git.factorlibre.com/*/-/issues/*
// @match        https://git.factorlibre.com/*/-/merge_requests/*
// @require      file:///D:/Programing/gitrepos/tm/tamper-monkey-label-editor/main/js/utils.js
// @require      file:///D:/Programing/gitrepos/tm/tamper-monkey-label-editor/main/js/storage.js
// @require      file:///D:/Programing/gitrepos/tm/tamper-monkey-label-editor/main/js/gitlab-helpers.js
// @require      file:///D:/Programing/gitrepos/tm/tamper-monkey-label-editor/main/js/toast.js
// @require      file:///D:/Programing/gitrepos/tm/tamper-monkey-label-editor/main/js/modal.js
// @require      file:///D:/Programing/gitrepos/tm/tamper-monkey-label-editor/main/js/config.js
// @require      file:///D:/Programing/gitrepos/tm/tamper-monkey-label-editor/main/js/components/LabelChip.js
// @require      file:///D:/Programing/gitrepos/tm/tamper-monkey-label-editor/main/js/components/LabelGroup.js
// @require      file:///D:/Programing/gitrepos/tm/tamper-monkey-label-editor/main/js/components/LabelPopup.js
// @require      file:///D:/Programing/gitrepos/tm/tamper-monkey-label-editor/main/js/components/ConfigPopup.js
// @require      file:///D:/Programing/gitrepos/tm/tamper-monkey-label-editor/main/js/app.js
// @resource     APP_CSS file:///D:/Programing/gitrepos/tm/tamper-monkey-label-editor/main/css/style.css
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

    GM_addStyle(GM_getResourceText('APP_CSS'));

    if (GitLabHelper.isGitLab()) {
        GitLabHelper.waitForSidebar().then(() => {
            const app = new LabelGroupsApp();
            app.init();
        }).catch(err => {
            console.warn('[Label Groups] Sidebar not found:', err);
        });
    }
})();
