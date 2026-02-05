// ==UserScript==
// @name         GitLab Label Groups
// @namespace    http://tampermonkey.net/
// @version      2.0.1
// @description  Gestiona etiquetas de GitLab agrupadas mediante quick actions (TM Framework)
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
// @resource     LE_CSS https://raw.githubusercontent.com/Zarritas/tamper-monkey-label-editor/main/main/styles/label-editor.css
// @require      https://raw.githubusercontent.com/Zarritas/tm-framework/main/dist/tm-framework.js
// @require      https://raw.githubusercontent.com/Zarritas/tamper-monkey-label-editor/main/main/services/storage.js
// @require      https://raw.githubusercontent.com/Zarritas/tamper-monkey-label-editor/main/main/services/gitlab-api.js
// @require      https://raw.githubusercontent.com/Zarritas/tamper-monkey-label-editor/main/main/components/LabelGroup.js
// @require      https://raw.githubusercontent.com/Zarritas/tamper-monkey-label-editor/main/main/components/ConfigGroupItem.js
// @require      https://raw.githubusercontent.com/Zarritas/tamper-monkey-label-editor/main/main/components/LabelGroupsModal.js
// @require      https://raw.githubusercontent.com/Zarritas/tamper-monkey-label-editor/main/main/components/LabelConfigModal.js
// @require      https://raw.githubusercontent.com/Zarritas/tamper-monkey-label-editor/main/main/components/LabelEditorApp.js
// @updateURL    https://github.com/Zarritas/tamper-monkey-label-editor/raw/refs/heads/main/main/script.user.js
// @downloadURL  https://github.com/Zarritas/tamper-monkey-label-editor/raw/refs/heads/main/main/script.user.js
// ==/UserScript==

(function () {
  "use strict";

  /**
   * Load CSS styles
   */
  function loadStyles() {
    // Load TM Framework styles (if available)
    if (typeof TM !== "undefined" && TM.injectStyles) {
      TM.injectStyles();
    }

    // Load Label Editor styles
    try {
      const css = GM_getResourceText("LE_CSS");
      if (css) {
        GM_addStyle(css);
      }
    } catch (e) {
      // Fallback: inject inline styles if resource fails
      console.warn("[LabelEditor] Could not load CSS resource, using fallback");
    }
  }

  /**
   * Initialize the Label Editor application
   */
  function init() {
    const path = globalThis.location.pathname;

    // Only run on issues and merge requests pages
    if (!path.includes("/issues/") && !path.includes("/merge_requests/")) {
      return;
    }

    // Load styles
    loadStyles();

    // Configure TM Logger (optional debugging)
    if (typeof TM !== "undefined" && TM.Logger) {
      TM.Logger.configure({
        enabled: false, // Set to true for debugging
        level: "debug",
        prefix: "[LabelEditor]",
      });
    }

    // Create container for the app
    const container = document.createElement("div");
    container.id = "label-editor-root";
    document.body.appendChild(container);

    // Initialize the LabelEditorApp component
    if (typeof TM !== "undefined" && typeof LabelEditorApp !== "undefined") {
      const app = new LabelEditorApp({
        projectPath: null, // Will be auto-detected
      });

      app.mount(container);

      TM.Logger.info("LabelEditor", "Application initialized");
    } else {
      console.error("[LabelEditor] TM Framework or LabelEditorApp not loaded");
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
