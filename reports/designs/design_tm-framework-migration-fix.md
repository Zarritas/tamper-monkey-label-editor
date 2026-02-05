# Technical Design: Corrección Migración TM-Framework

## 1. Overview

### Problem Statement

La migración actual del `tamper-monkey-label-editor` a tm-framework tiene varios problemas críticos que impiden su funcionamiento:

1. Referencias a archivos de componentes que no existen
2. URL incorrecta del framework
3. Componentes hijos instanciados incorrectamente (llamando a `.render()` en lugar de montar)
4. Event bindings (`@click`) que nunca se procesan en componentes hijos

### Goals

- [ ] Corregir estructura de archivos y `@require` statements
- [ ] Usar la URL correcta del repositorio tm-framework (usuario: Zarritas)
- [ ] Implementar patrón correcto de composición de componentes
- [ ] Garantizar que los event bindings funcionen en toda la jerarquía

### Non-Goals

- Reescritura completa del sistema de componentes
- Migración a componentes UI de tm-framework (TM.Modal, TM.Button, etc.)
- Optimización de rendimiento

---

## 2. Background

### Estado Actual de la Migración

```
main/
├── script.user.js          # Entry point (con URLs incorrectas)
├── components/
│   └── index.js            # ÚNICO archivo (contiene 5 componentes)
├── services/
│   ├── storage.js          # OK
│   └── gitlab-api.js       # OK
└── styles/
    └── label-editor.css    # OK
```

### Problema Principal: Composición de Componentes

El código actual hace esto:

```javascript
// ❌ INCORRECTO - En LabelGroupsModal.render()
const labelGroup = new LabelGroup({...props});
return labelGroup.render();  // Solo devuelve HTML string, sin binding
```

Esto no funciona porque:
- `render()` solo devuelve un string HTML
- Los atributos `@click` necesitan procesamiento por `_bindEvents()`
- `_bindEvents()` solo se ejecuta durante `mount()`

---

## 3. Detailed Design

### 3.1 Architecture

**Opción A: Funciones de Render (Recomendada)**

```
┌─────────────────────────────────────────────────────────────┐
│                    LabelEditorApp                           │
│  (Component - se monta con app.mount())                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  render() {                                                 │
│    ┌─────────────────┐   ┌──────────────────────┐          │
│    │ renderLabelGroup│   │ renderLabelGroupsModal│          │
│    │   (función)     │   │     (función)        │          │
│    └─────────────────┘   └──────────────────────┘          │
│           │                        │                        │
│           └────────┬───────────────┘                        │
│                    ▼                                        │
│         HTML con event handlers                             │
│         delegados al componente padre                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Opción B: Child Components con mount()**

```
┌─────────────────────────────────────────────────────────────┐
│                    LabelEditorApp                           │
│                                                             │
│  onMount() / onUpdate() {                                   │
│    ┌─────────────────┐   ┌──────────────────────┐          │
│    │   LabelGroup    │   │  LabelGroupsModal    │          │
│    │ (Component)     │   │   (Component)        │          │
│    │ .mount(slot)    │   │   .mount(slot)       │          │
│    └─────────────────┘   └──────────────────────┘          │
│    this.addChild()       this.addChild()                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Estructura de Archivos Propuesta

```
main/
├── script.user.js              # Entry point corregido
├── components/
│   └── index.js                # Todos los componentes (mantener)
├── services/
│   ├── storage.js              # Sin cambios
│   └── gitlab-api.js           # Sin cambios
└── styles/
    └── label-editor.css        # Sin cambios
```

### 3.3 Corrección del script.user.js

```javascript
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
// @resource     LE_CSS https://raw.githubusercontent.com/FlJesusLorenzo/tamper-monkey-label-editor/migration_tm-framework/main/styles/label-editor.css
// @require      https://raw.githubusercontent.com/Zarritas/tm-framework/main/dist/tm-framework.js
// @require      https://raw.githubusercontent.com/FlJesusLorenzo/tamper-monkey-label-editor/migration_tm-framework/main/services/storage.js
// @require      https://raw.githubusercontent.com/FlJesusLorenzo/tamper-monkey-label-editor/migration_tm-framework/main/services/gitlab-api.js
// @require      https://raw.githubusercontent.com/FlJesusLorenzo/tamper-monkey-label-editor/migration_tm-framework/main/components/index.js
// @updateURL    https://github.com/FlJesusLorenzo/tamper-monkey-label-editor/raw/refs/heads/migration_tm-framework/main/script.user.js
// @downloadURL  https://github.com/FlJesusLorenzo/tamper-monkey-label-editor/raw/refs/heads/migration_tm-framework/main/script.user.js
// ==/UserScript==
```

**Cambios clave:**
1. URL de tm-framework: `https://raw.githubusercontent.com/Zarritas/tm-framework/main/dist/tm-framework.js`
2. Un solo `@require` para componentes: `.../main/components/index.js`
3. Rama `migration_tm-framework` en las URLs

### 3.4 Patrón de Componentes Corregido

#### Opción A: Funciones de Render (Recomendada)

Convertir `LabelGroup` y `ConfigGroupItem` de clases a funciones:

```javascript
/**
 * Render function for LabelGroup
 * @param {Object} props
 * @param {Object} handlers - Event handlers del componente padre
 * @returns {string} HTML
 */
function renderLabelGroup(props, handlers) {
    const { name, color, exclusive, labels, currentLabels, selectedLabels, labelsToRemove } = props;

    const getLabelClasses = (label) => {
        const classes = ['le-label'];
        if (currentLabels.has(label)) classes.push('le-label--current');
        if (selectedLabels.has(label)) classes.push('le-label--selected');
        if (labelsToRemove.has(label)) classes.push('le-label--remove');
        return classes.join(' ');
    };

    const labelsHtml = labels.map(label => `
        <div
            class="${getLabelClasses(label)}"
            data-label="${label}"
            data-group="${name}">
            ${label}
        </div>
    `).join('');

    return html`
        <div class="le-group" data-group-name="${name}">
            <div class="le-group__header">
                <span class="le-group__dot" style="background: ${color}"></span>
                <span class="le-group__name">${name}</span>
                ${exclusive ? '<span class="le-group__badge">Exclusivo</span>' : ''}
            </div>
            <div class="le-group__items">
                ${labelsHtml}
            </div>
        </div>
    `;
}
```

Y en el componente padre, usar **event delegation**:

```javascript
class LabelEditorApp extends TM.Component {
    // ...

    onMount() {
        // Event delegation para labels
        this._el.addEventListener('click', (e) => {
            const labelEl = e.target.closest('[data-label]');
            if (labelEl) {
                const label = labelEl.dataset.label;
                const group = labelEl.dataset.group;
                this.toggleLabel(label, group);
            }
        });

        this._el.addEventListener('dblclick', (e) => {
            const labelEl = e.target.closest('[data-label]');
            if (labelEl) {
                const label = labelEl.dataset.label;
                this.toggleRemoveLabel(label);
            }
        });
    }

    render() {
        // Usar funciones de render en lugar de instanciar componentes
        const groupsHtml = Object.entries(this.state.groups).map(([name, group]) =>
            renderLabelGroup({
                name,
                color: group.color,
                exclusive: group.exclusive,
                labels: group.labels,
                currentLabels: this.state.currentLabels,
                selectedLabels: this.state.selectedLabels,
                labelsToRemove: this.state.labelsToRemove
            })
        ).join('');

        return html`...${groupsHtml}...`;
    }
}
```

#### Opción B: Uso de setContent() como TM.Modal

Usar el patrón de `setContent()` de TM.Modal para montar componentes hijos:

```javascript
class LabelGroupsModal extends TM.Component {
    onMount() {
        // Montar grupos como children
        this._mountGroups();
    }

    onUpdate() {
        // Re-montar cuando cambie el estado
        this._mountGroups();
    }

    _mountGroups() {
        const container = this.refs.groupsContainer;
        if (!container) return;

        // Limpiar children anteriores
        this._children.forEach(child => child.destroy());
        this._children.clear();
        container.innerHTML = '';

        // Montar nuevos
        Object.entries(this.props.groups).forEach(([name, group], idx) => {
            const labelGroup = new LabelGroup({
                name,
                color: group.color,
                exclusive: group.exclusive,
                labels: group.labels,
                selectedLabels: this.props.selectedLabels,
                labelsToRemove: this.props.labelsToRemove,
                currentLabels: this.props.currentLabels,
                onLabelClick: this.props.onLabelClick,
                onLabelDoubleClick: this.props.onLabelDoubleClick
            });

            labelGroup.mount(container);
            this.addChild(`group_${idx}`, labelGroup);
        });
    }

    render() {
        return html`
            <div class="le-modal">
                <div class="le-modal__content" ref="groupsContainer">
                    <!-- Groups se montan aqui via _mountGroups() -->
                </div>
            </div>
        `;
    }
}
```

### 3.5 Resumen de Cambios por Archivo

| Archivo | Cambio | Prioridad |
|---------|--------|-----------|
| `script.user.js` | Corregir URLs y consolidar @require | Alta |
| `components/index.js` | Convertir LabelGroup/ConfigGroupItem a funciones o usar mount() | Alta |
| `services/storage.js` | Sin cambios | - |
| `services/gitlab-api.js` | Sin cambios | - |
| `styles/label-editor.css` | Sin cambios | - |

---

## 4. Alternatives Considered

| Opción | Pros | Cons |
|--------|------|------|
| **A: Funciones de Render** | Simple, menos código, event delegation eficiente | Pierde encapsulación de clase |
| **B: mount() en children** | Mantiene clases, lifecycle hooks disponibles | Más complejo, requiere manejo de children |
| **C: Usar TM.Modal/Button** | Reutiliza componentes del framework | Requiere adaptar estilos, más cambios |

**Recomendación: Opción A** por simplicidad y mejor rendimiento con event delegation.

---

## 5. Implementation Plan

### Fase 1: Correcciones Inmediatas
- [ ] Corregir URL de tm-framework a `Zarritas/tm-framework`
- [ ] Consolidar `@require` a un solo archivo `components/index.js`
- [ ] Actualizar URLs de rama a `migration_tm-framework`

### Fase 2: Refactor de Componentes
- [ ] Convertir `LabelGroup` de clase a función `renderLabelGroup()`
- [ ] Convertir `ConfigGroupItem` de clase a función `renderConfigGroupItem()`
- [ ] Implementar event delegation en `LabelEditorApp`
- [ ] Implementar event delegation en `LabelConfigModal`

### Fase 3: Mantener Modales como Componentes
- [ ] `LabelGroupsModal` - mantener como Component
- [ ] `LabelConfigModal` - mantener como Component
- [ ] `LabelEditorApp` - mantener como Component (root)

---

## 6. Testing Strategy

1. **Test de carga**: Verificar que tm-framework se carga correctamente
2. **Test de UI**: Abrir modal principal, verificar que se renderiza
3. **Test de eventos**: Clic en labels debe togglear selección
4. **Test de configuración**: Abrir config, drag & drop de labels
5. **Test de persistencia**: Guardar grupos, recargar página

---

## 7. Código de Implementación

### 7.1 script.user.js Corregido

```javascript
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
// @resource     LE_CSS https://raw.githubusercontent.com/FlJesusLorenzo/tamper-monkey-label-editor/migration_tm-framework/main/styles/label-editor.css
// @require      https://raw.githubusercontent.com/Zarritas/tm-framework/main/dist/tm-framework.js
// @require      https://raw.githubusercontent.com/FlJesusLorenzo/tamper-monkey-label-editor/migration_tm-framework/main/services/storage.js
// @require      https://raw.githubusercontent.com/FlJesusLorenzo/tamper-monkey-label-editor/migration_tm-framework/main/services/gitlab-api.js
// @require      https://raw.githubusercontent.com/FlJesusLorenzo/tamper-monkey-label-editor/migration_tm-framework/main/components/index.js
// @updateURL    https://github.com/FlJesusLorenzo/tamper-monkey-label-editor/raw/refs/heads/migration_tm-framework/main/script.user.js
// @downloadURL  https://github.com/FlJesusLorenzo/tamper-monkey-label-editor/raw/refs/heads/migration_tm-framework/main/script.user.js
// ==/UserScript==

(function() {
    'use strict';

    function loadStyles() {
        if (typeof TM !== 'undefined' && TM.injectStyles) {
            TM.injectStyles();
        }

        try {
            const css = GM_getResourceText('LE_CSS');
            if (css) {
                GM_addStyle(css);
            }
        } catch (e) {
            console.warn('[LabelEditor] Could not load CSS resource');
        }
    }

    function init() {
        const path = location.pathname;
        if (!path.includes('/issues/') && !path.includes('/merge_requests/')) {
            return;
        }

        loadStyles();

        if (typeof TM !== 'undefined' && TM.Logger) {
            TM.Logger.configure({
                enabled: false,
                level: 'debug',
                prefix: '[LabelEditor]'
            });
        }

        const container = document.createElement('div');
        container.id = 'label-editor-root';
        document.body.appendChild(container);

        if (typeof TM !== 'undefined' && typeof LabelEditorApp !== 'undefined') {
            const app = new LabelEditorApp();
            app.mount(container);
            TM.Logger.info('LabelEditor', 'Application initialized');
        } else {
            console.error('[LabelEditor] TM Framework or LabelEditorApp not loaded');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
```

### 7.2 components/index.js Corregido (Extracto Principal)

```javascript
/**
 * TM Label Editor - Components
 * Refactored to use render functions + event delegation
 */

(function() {
    'use strict';

    const { Component, html } = TM;

    // ═══════════════════════════════════════════════════════════════
    // RENDER FUNCTIONS (no son Components, solo funciones de render)
    // ═══════════════════════════════════════════════════════════════

    /**
     * Render a label group
     */
    function renderLabelGroup(props) {
        const { name, color, exclusive, labels, currentLabels, selectedLabels, labelsToRemove } = props;

        const getLabelClasses = (label) => {
            const classes = ['le-label'];
            if (currentLabels?.has(label)) classes.push('le-label--current');
            if (selectedLabels?.has(label)) classes.push('le-label--selected');
            if (labelsToRemove?.has(label)) classes.push('le-label--remove');
            return classes.join(' ');
        };

        const labelsHtml = labels.map(label => `
            <div class="${getLabelClasses(label)}" data-label="${label}" data-group="${name}">
                ${label}
            </div>
        `).join('');

        return `
            <div class="le-group" data-group-name="${name}">
                <div class="le-group__header">
                    <span class="le-group__dot" style="background: ${color}"></span>
                    <span class="le-group__name">${name}</span>
                    ${exclusive ? '<span class="le-group__badge">Exclusivo</span>' : ''}
                </div>
                <div class="le-group__items">
                    ${labelsHtml}
                </div>
            </div>
        `;
    }

    /**
     * Render a config group item
     */
    function renderConfigGroupItem(props) {
        const { name, color, exclusive, labels, isDragOver } = props;

        const labelsContainerClass = isDragOver
            ? 'le-config-group__labels le-config-group__labels--dragover'
            : 'le-config-group__labels';

        const chipsHtml = labels.length > 0
            ? labels.map(label => `
                <div class="le-config-chip">
                    ${label}
                    <button class="le-config-chip__remove" data-remove-label="${label}" data-from-group="${name}" title="Quitar etiqueta">x</button>
                </div>
            `).join('')
            : '<span class="le-status--loading">Arrastra etiquetas aqui</span>';

        return `
            <div class="le-config-group" data-group="${name}">
                <div class="le-config-group__header">
                    <input type="color" class="le-config-group__color" value="${color}" data-color-group="${name}" title="Color del grupo" />
                    <input type="text" class="le-config-group__name" value="${name}" data-name-group="${name}" placeholder="Nombre del grupo" />
                    <label class="le-config-group__exclusive">
                        <input type="checkbox" ${exclusive ? 'checked' : ''} data-exclusive-group="${name}" />
                        Exclusivo
                    </label>
                    <button class="le-btn le-btn--icon le-btn--danger" data-delete-group="${name}" title="Eliminar grupo">-</button>
                </div>
                <div class="${labelsContainerClass}" data-drop-target="${name}">
                    ${chipsHtml}
                </div>
            </div>
        `;
    }

    // ═══════════════════════════════════════════════════════════════
    // LABEL GROUPS MODAL (Component)
    // ═══════════════════════════════════════════════════════════════

    class LabelGroupsModal extends Component {
        static defaultProps = {
            groups: {},
            selectedLabels: new Set(),
            labelsToRemove: new Set(),
            currentLabels: new Set(),
            commands: { toAdd: [], toRemove: [] },
            onClose: null,
            onApply: null,
            onOpenConfig: null,
            onLabelClick: null,
            onLabelDoubleClick: null
        };

        onMount() {
            // Event delegation para clicks en labels
            this._el.addEventListener('click', (e) => {
                const labelEl = e.target.closest('[data-label]');
                if (labelEl) {
                    const label = labelEl.dataset.label;
                    const group = labelEl.dataset.group;
                    this.props.onLabelClick?.(label, group);
                }
            });

            // Event delegation para double clicks
            this._el.addEventListener('dblclick', (e) => {
                const labelEl = e.target.closest('[data-label]');
                if (labelEl) {
                    const label = labelEl.dataset.label;
                    this.props.onLabelDoubleClick?.(label);
                }
            });
        }

        handleOverlayClick(e) {
            if (e.target.classList.contains('le-overlay')) {
                this.props.onClose?.();
            }
        }

        handleClose() {
            this.props.onClose?.();
        }

        handleApply() {
            this.props.onApply?.();
        }

        handleOpenConfig() {
            this.props.onOpenConfig?.();
        }

        renderPreview() {
            const { commands } = this.props;
            const parts = [];

            if (commands.toAdd.length > 0) {
                const labelStr = commands.toAdd.map(l => `~"${l}"`).join(' ');
                parts.push(`<span class="le-preview__add">/label ${labelStr}</span>`);
            }
            if (commands.toRemove.length > 0) {
                const labelStr = commands.toRemove.map(l => `~"${l}"`).join(' ');
                parts.push(`<span class="le-preview__remove">/unlabel ${labelStr}</span>`);
            }

            return parts.length > 0
                ? parts.join('<br>')
                : '<span class="le-preview__empty">Sin cambios</span>';
        }

        render() {
            const { groups, selectedLabels, labelsToRemove, currentLabels, commands } = this.props;
            const hasChanges = commands.toAdd.length > 0 || commands.toRemove.length > 0;
            const groupEntries = Object.entries(groups);

            // Usar funcion de render en lugar de instanciar Component
            const groupsHtml = groupEntries.length > 0
                ? groupEntries.map(([name, group]) => renderLabelGroup({
                    name,
                    color: group.color,
                    exclusive: group.exclusive,
                    labels: group.labels,
                    selectedLabels,
                    labelsToRemove,
                    currentLabels
                })).join('')
                : '<div class="le-status le-status--loading">No hay grupos configurados. Haz clic en el engranaje para configurar.</div>';

            return html`
                <div class="le-overlay" @click="handleOverlayClick">
                    <div class="le-modal">
                        <div class="le-modal__header">
                            <span class="le-modal__title">Gestionar Etiquetas</span>
                            <button class="le-btn le-btn--icon" @click="handleOpenConfig" title="Configurar grupos">
                                Configurar
                            </button>
                        </div>

                        <div class="le-modal__info">
                            Clic = seleccionar | Doble clic = eliminar
                        </div>

                        <div class="le-modal__content">
                            ${groupsHtml}
                        </div>

                        <div class="le-modal__preview">
                            ${this.renderPreview()}
                        </div>

                        <div class="le-modal__footer">
                            <button class="le-btn le-btn--primary" @click="handleApply" ${!hasChanges ? 'disabled' : ''}>
                                Aplicar
                            </button>
                            <button class="le-btn" @click="handleClose">
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    // ... (LabelConfigModal similar, usando renderConfigGroupItem y event delegation)

    // ═══════════════════════════════════════════════════════════════
    // EXPORT
    // ═══════════════════════════════════════════════════════════════

    // Funciones de render
    globalThis.renderLabelGroup = renderLabelGroup;
    globalThis.renderConfigGroupItem = renderConfigGroupItem;

    // Componentes
    globalThis.LabelGroupsModal = LabelGroupsModal;
    globalThis.LabelConfigModal = LabelConfigModal;
    globalThis.LabelEditorApp = LabelEditorApp;

    // Tambien al namespace TM
    if (typeof TM !== 'undefined') {
        TM.renderLabelGroup = renderLabelGroup;
        TM.renderConfigGroupItem = renderConfigGroupItem;
        TM.LabelGroupsModal = LabelGroupsModal;
        TM.LabelConfigModal = LabelConfigModal;
        TM.LabelEditorApp = LabelEditorApp;
    }

})();
```

---

## 8. Open Questions

- [ ] ¿Se deberia usar `TM.Modal` del framework en lugar de crear modales custom?
- [ ] ¿Mantener compatibilidad con la rama `main` o romper retrocompatibilidad?
- [ ] ¿Publicar tm-framework a npm para tener versiones fijas?

---

## 9. Diagrama de Event Delegation

```
Usuario hace clic en label "Bug"
            │
            ▼
┌───────────────────────────────────────┐
│  LabelEditorApp._el (root)            │
│  └─ addEventListener('click')         │
│       │                               │
│       ▼                               │
│  e.target.closest('[data-label]')     │
│       │                               │
│       ▼                               │
│  Encuentra: <div data-label="Bug"     │
│                  data-group="Status"> │
│       │                               │
│       ▼                               │
│  this.toggleLabel("Bug", "Status")    │
│       │                               │
│       ▼                               │
│  this.state.selectedLabels cambia     │
│       │                               │
│       ▼                               │
│  Re-render automatico (reactivity)    │
└───────────────────────────────────────┘
```

Este patron es mas eficiente que tener un listener por cada label.
