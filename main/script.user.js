// ==UserScript==
// @name         GitLab Label Groups
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Gestiona etiquetas de GitLab agrupadas mediante quick actions
// @author       Jesús Lorenzo
// @match        https://gitlab.com/*/-/issues/*
// @match        https://gitlab.com/*/-/merge_requests/*
// @match        https://git.factorlibre.com/*/-/issues/*
// @match        https://git.factorlibre.com/*/-/merge_requests/*
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @connect      gitlab.com
// @connect      git.factorlibre.com
// @connect      *
// @resource     POPUP_CSS   https://raw.githubusercontent.com/FlJesusLorenzo/tamper-monkey-label-editor/main/main/css/style.css
// @resource     POPUP_HTML  https://raw.githubusercontent.com/FlJesusLorenzo/tamper-monkey-label-editor/main/main/html/popup.html
// @resource     CONFIG_HTML https://raw.githubusercontent.com/FlJesusLorenzo/tamper-monkey-label-editor/main/main/html/config-popup.html
// @require      https://raw.githubusercontent.com/FlJesusLorenzo/tamper-monkey-label-editor/main/main/js/fallback.js
// @require      https://raw.githubusercontent.com/FlJesusLorenzo/tamper-monkey-label-editor/main/main/js/config.js
// @require      https://raw.githubusercontent.com/FlJesusLorenzo/tamper-monkey-label-editor/main/main/js/state.js
// @require      https://raw.githubusercontent.com/FlJesusLorenzo/tamper-monkey-label-editor/main/main/js/api.js
// @require      https://raw.githubusercontent.com/FlJesusLorenzo/tamper-monkey-label-editor/main/main/js/labels.js
// @require      https://raw.githubusercontent.com/FlJesusLorenzo/tamper-monkey-label-editor/main/main/js/gitlab.js
// @require      https://raw.githubusercontent.com/FlJesusLorenzo/tamper-monkey-label-editor/main/main/js/ui.js
// @updateURL    https://github.com/FlJesusLorenzo/tamper-monkey-label-editor/raw/refs/heads/main/main/script.user.js
// @downloadURL  https://github.com/FlJesusLorenzo/tamper-monkey-label-editor/raw/refs/heads/main/main/script.user.js
// ==/UserScript==

(function () {
  "use strict";

  function addSidebarButton(editButton) {
    State.button = document.createElement("button");
    State.button.className = "label-groups-sidebar-btn";
    State.button.innerHTML = "🏷️";
    State.button.title = "Gestionar etiquetas por grupos";
    State.button.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      createPopup();
    });

    editButton.parentElement.insertBefore(State.button, editButton);
  }

  function startObserver() {
    const observer = new MutationObserver(() => {
      const labelsSection = document.querySelector(
        "[data-testid='sidebar-labels']",
      );
      if (!labelsSection) return;

      const editButton = labelsSection.querySelector(
        "[data-testid='edit-button']",
      );
      if (!editButton || State.button) return;

      addSidebarButton(editButton);
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  function init() {
    const path = globalThis.location.pathname;
    if (!path.includes("/issues/") && !path.includes("/merge_requests/")) {
      return;
    }

    loadStyles();
    startObserver();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
