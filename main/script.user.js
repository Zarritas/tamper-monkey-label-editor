// ==UserScript==
// @name         GitLab Label Groups
// @namespace    http://tampermonkey.net/
// @version      2.2.1
// @description  Gestiona etiquetas de GitLab organizadas en grupos mutuamente excluyentes
// @author       Jesús Lorenzo
// @match        https://gitlab.com/*/-/issues/*
// @match        https://gitlab.com/*/-/merge_requests/*
// @match        https://git.factorlibre.com/*/-/issues/*
// @match        https://git.factorlibre.com/*/-/merge_requests/*
// @require      https://raw.githubusercontent.com/Zarritas/tamper-monkey-label-editor/refs/heads/main/main/js/utils.js
// @require      https://raw.githubusercontent.com/Zarritas/tamper-monkey-label-editor/refs/heads/main/main/js/storage.js
// @require      https://raw.githubusercontent.com/Zarritas/tamper-monkey-label-editor/refs/heads/main/main/js/gitlab-helpers.js
// @require      https://raw.githubusercontent.com/Zarritas/tamper-monkey-label-editor/refs/heads/main/main/js/toast.js
// @require      https://raw.githubusercontent.com/Zarritas/tamper-monkey-label-editor/refs/heads/main/main/js/modal.js
// @require      https://raw.githubusercontent.com/Zarritas/tamper-monkey-label-editor/refs/heads/main/main/js/config.js
// @require      https://raw.githubusercontent.com/Zarritas/tamper-monkey-label-editor/refs/heads/main/main/js/components/LabelChip.js
// @require      https://raw.githubusercontent.com/Zarritas/tamper-monkey-label-editor/refs/heads/main/main/js/components/LabelGroup.js
// @require      https://raw.githubusercontent.com/Zarritas/tamper-monkey-label-editor/refs/heads/main/main/js/components/LabelPopup.js
// @require      https://raw.githubusercontent.com/Zarritas/tamper-monkey-label-editor/refs/heads/main/main/js/components/ConfigPopup.js
// @require      https://raw.githubusercontent.com/Zarritas/tamper-monkey-label-editor/refs/heads/main/main/js/app.js
// @resource     APP_CSS https://raw.githubusercontent.com/Zarritas/tamper-monkey-label-editor/refs/heads/main/main/css/style.css
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_xmlhttpRequest
// @updateURL    https://raw.githubusercontent.com/Zarritas/tamper-monkey-label-editor/refs/heads/main/main/script.user.js
// @downloadURL  https://raw.githubusercontent.com/Zarritas/tamper-monkey-label-editor/refs/heads/main/main/script.user.js
// ==/UserScript==

(function () {
  "use strict";

  GM_addStyle(GM_getResourceText("APP_CSS"));

  if (GitLabHelper.isGitLab()) {
    const app = new LabelGroupsApp();
    app.init();
  }
})();
