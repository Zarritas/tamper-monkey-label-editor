const FALLBACK_CSS = `
.label-groups-popup { --lg-bg-primary: #fff; --lg-bg-secondary: #f5f5f5; --lg-bg-tertiary: #e8ecf0; --lg-bg-input: #fff; --lg-border: #d0d0d0; --lg-border-light: #e0e0e0; --lg-text-primary: #1a1a1a; --lg-text-secondary: #333; --lg-text-muted: #666; --lg-chip-bg: #e0e4e8; --lg-preview-bg: #1e1e1e; --lg-preview-text: #b0b0b0; }
.label-groups-popup.dark-mode { --lg-bg-primary: #1f2937; --lg-bg-secondary: #374151; --lg-bg-tertiary: #2d3748; --lg-bg-input: #1a202c; --lg-border: #4a5568; --lg-border-light: #4a5568; --lg-text-primary: #f3f4f6; --lg-text-secondary: #d1d5db; --lg-text-muted: #9ca3af; --lg-chip-bg: #4a5568; --lg-preview-bg: #111827; --lg-preview-text: #9ca3af; }
.label-groups-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 9999; }
.label-groups-popup { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: var(--lg-bg-primary); border-radius: 10px; padding: 25px; z-index: 10000; min-width: 450px; max-height: 90vh; overflow-y: auto; color: var(--lg-text-primary); }
.label-groups-popup h3 { margin: 0 0 20px 0; text-align: center; color: var(--lg-text-primary); }
.label-groups-info { background: var(--lg-bg-secondary); padding: 10px; border-radius: 5px; margin-bottom: 15px; font-size: 12px; color: var(--lg-text-secondary); }
.label-group { margin-bottom: 15px; }
.label-group-header { font-weight: bold; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; color: var(--lg-text-secondary); }
.label-group-dot { width: 12px; height: 12px; border-radius: 50%; }
.label-group-multi { font-size: 11px; font-weight: normal; color: var(--lg-text-muted); font-style: italic; }
.label-group-items { display: flex; flex-wrap: wrap; gap: 8px; }
.label-item { padding: 8px 12px; background: var(--lg-bg-secondary); border: 2px solid transparent; border-radius: 5px; cursor: pointer; color: var(--lg-text-primary); }
.label-item.selected { border-color: #22a352; background: rgba(34,163,82,0.12); color: #1a7f3e; }
.label-groups-popup.dark-mode .label-item.selected { border-color: #34d058; background: rgba(52,208,88,0.15); color: #4ade6a; }
.label-item.to-remove { border-color: #d93545; background: rgba(217,53,69,0.12); text-decoration: line-through; color: #b32d3a; }
.label-groups-popup.dark-mode .label-item.to-remove { border-color: #f85149; background: rgba(248,81,73,0.15); color: #ff7b72; }
.label-groups-buttons { display: flex; gap: 10px; justify-content: center; margin-top: 20px; }
.label-groups-btn { padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; }
.label-groups-btn-primary { background: #6366f1; color: white; }
.label-groups-btn-secondary { background: #6c757d; color: white; }
.label-groups-btn-config { position: absolute; top: 15px; right: 15px; }
.label-groups-preview { margin-top: 15px; padding: 10px; background: var(--lg-preview-bg); color: var(--lg-preview-text); border-radius: 5px; font-family: monospace; min-height: 40px; }
.label-groups-sidebar-btn { background: none; border: none; cursor: pointer; font-size: 14px; padding: 4px 8px; }
.label-groups-loading, .label-groups-success, .label-groups-error { text-align: center; margin-top: 10px; }
.label-groups-error { color: #b32d3a; }
.label-groups-popup.dark-mode .label-groups-error { color: #ff7b72; }
.label-groups-success { color: #1a7f3e; }
.label-groups-popup.dark-mode .label-groups-success { color: #4ade6a; }
.config-groups-list { max-height: 350px; overflow-y: auto; margin-bottom: 15px; }
.config-group-item { background: var(--lg-bg-secondary); border: 1px solid var(--lg-border); border-radius: 8px; padding: 15px; margin-bottom: 12px; }
.config-group-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.config-group-header input[type="text"] { flex: 1; padding: 8px; border: 1px solid var(--lg-border); border-radius: 5px; background: var(--lg-bg-input); color: var(--lg-text-primary); }
.config-group-header input[type="color"] { width: 40px; height: 36px; border: none; cursor: pointer; }
.config-group-delete { background: #dc3545; color: white; border: none; border-radius: 5px; width: 36px; height: 36px; cursor: pointer; }
.config-group-options { margin-bottom: 12px; font-size: 13px; color: var(--lg-text-secondary); }
.config-group-options label { display: flex; align-items: center; gap: 6px; cursor: pointer; }
.config-labels-container { display: flex; flex-wrap: wrap; gap: 8px; padding: 10px; background: var(--lg-bg-input); border: 1px solid var(--lg-border); border-radius: 5px; min-height: 42px; }
.config-label-chip { display: flex; align-items: center; gap: 6px; background: var(--lg-chip-bg); padding: 5px 10px; border-radius: 15px; font-size: 13px; color: var(--lg-text-primary); }
.config-label-chip button { background: none; border: none; cursor: pointer; color: var(--lg-text-muted); }
.config-label-input { border: none; outline: none; padding: 5px; font-size: 13px; min-width: 120px; flex: 1; background: transparent; color: var(--lg-text-primary); }
.config-add-group { text-align: center; margin-bottom: 15px; }
.config-project-labels { background: var(--lg-bg-tertiary); border: 1px solid var(--lg-border); border-radius: 8px; padding: 12px; margin-bottom: 15px; }
.config-project-labels-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 13px; color: var(--lg-text-secondary); }
.config-available-labels { display: flex; flex-wrap: wrap; gap: 6px; max-height: 120px; overflow-y: auto; padding: 8px; background: var(--lg-bg-input); border-radius: 5px; }
.config-available-label { padding: 4px 10px; border-radius: 12px; font-size: 12px; cursor: pointer; }
.config-available-label.used { opacity: 0.4; cursor: not-allowed; }
.config-project-labels-hint { font-size: 11px; color: var(--lg-text-muted); margin-top: 8px; text-align: center; }
.config-loading { color: var(--lg-text-muted); font-style: italic; }
.config-labels-container.drag-over { background: rgba(99,102,241,0.1); border-color: #6366f1; }
.config-group-selector { position: absolute; background: var(--lg-bg-primary); border: 1px solid var(--lg-border); border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); padding: 8px; z-index: 10001; }
.config-group-selector-title { font-size: 12px; color: var(--lg-text-muted); padding: 4px 8px 8px; }
.config-group-selector-btn { display: flex; align-items: center; gap: 8px; width: 100%; padding: 8px; border: none; background: none; cursor: pointer; color: var(--lg-text-primary); }
.config-group-selector-btn:hover { background: var(--lg-bg-secondary); }
.config-group-selector-cancel { width: 100%; padding: 6px; border: none; background: var(--lg-bg-secondary); cursor: pointer; font-size: 12px; color: var(--lg-text-muted); }
`;

const FALLBACK_POPUP_HTML = `
<button id="label-groups-config" class="label-groups-btn label-groups-btn-secondary label-groups-btn-config">⚙️</button>
<h3>🏷️ Gestionar Etiquetas</h3>
<div class="label-groups-info">Clic = seleccionar | Doble clic = eliminar</div>
<div id="label-groups-content"></div>
<div class="label-groups-preview" id="label-groups-preview"></div>
<div class="label-groups-buttons">
    <button class="label-groups-btn label-groups-btn-primary" id="label-groups-submit">✅ Aplicar</button>
    <button class="label-groups-btn label-groups-btn-secondary" id="label-groups-cancel">❌ Cancelar</button>
</div>
<div id="label-groups-status"></div>
`;

const FALLBACK_CONFIG_HTML = `
<h3>⚙️ Configuración de Grupos</h3>
<div class="label-groups-info">
    <div><strong>Proyecto:</strong> <span id="config-project-name"></span></div>
    <div style="margin-top: 5px;">Los grupos exclusivos solo permiten una etiqueta activa a la vez.</div>
</div>
<div id="config-groups-list" class="config-groups-list"></div>
<div class="config-add-group">
    <button class="label-groups-btn label-groups-btn-secondary" id="config-add-group">➕ Añadir grupo</button>
</div>
<div class="config-project-labels">
    <div class="config-project-labels-header">
        <span>📋 Etiquetas del proyecto</span>
        <button class="label-groups-btn label-groups-btn-secondary" id="config-refresh-labels">🔄</button>
    </div>
    <div id="config-available-labels" class="config-available-labels">
        <span class="config-loading">Cargando etiquetas...</span>
    </div>
    <div class="config-project-labels-hint">Haz clic en una etiqueta para añadirla a un grupo</div>
</div>
<div class="label-groups-buttons">
    <button class="label-groups-btn label-groups-btn-primary" id="config-save">✅ Guardar</button>
    <button class="label-groups-btn label-groups-btn-secondary" id="config-cancel">❌ Cancelar</button>
</div>
<div id="config-status"></div>
`;
