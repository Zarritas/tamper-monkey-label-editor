# GitLab Label Groups

Script de Tampermonkey para gestionar etiquetas de GitLab organizadas en grupos mutuamente excluyentes.

**Versión:** 2.0.0 (TM Framework)

## Características

### Gestión de Etiquetas

- **Etiquetas agrupadas** - Organiza etiquetas en grupos lógicos (Prioridad, Estado, Tipo, etc.)
- **Grupos exclusivos** - Al seleccionar una etiqueta, se elimina automáticamente cualquier otra del mismo grupo
- **Grupos no exclusivos** - Permite selección múltiple dentro del mismo grupo
- **Selección visual** - Clic para seleccionar, doble clic para marcar eliminación
- **Preview de comandos** - Visualiza los comandos `/label` y `/unlabel` antes de aplicar

### Configuración

- **Configuración por proyecto** - Cada proyecto GitLab tiene su propia configuración
- **Editor visual de grupos** - Interfaz amigable para crear/editar/eliminar grupos
- **Drag & drop** - Arrastra etiquetas del proyecto a los grupos
- **Color personalizado** - Asigna colores a cada grupo
- **Carga automática** - Las etiquetas del proyecto se cargan desde la API de GitLab

### Integración GitLab

- **Quick Actions** - Usa comandos nativos `/label` y `/unlabel`
- **Compatible Rich Text** - Cambia automáticamente entre editores
- **Preserva contenido** - Mantiene el texto del comentario después de aplicar
- **Issues y MRs** - Funciona en issues y merge requests

### UI/UX

- **Tema automático** - Detecta modo oscuro/claro de GitLab
- **Botón en sidebar** - Acceso rápido junto a la sección Labels
- **Modales responsivos** - Interfaz adaptada al espacio disponible

## Arquitectura (v2.0.0)

El script usa **TM Framework** para una arquitectura basada en componentes reactivos.

### Estructura del Proyecto

```
tamper-monkey-label-editor/
├── main/
│   ├── components/
│   │   ├── LabelEditorApp.js      # Componente principal (orquestador)
│   │   ├── LabelGroupsModal.js    # Modal de selección de etiquetas
│   │   ├── LabelGroup.js          # Grupo de etiquetas
│   │   ├── LabelConfigModal.js    # Modal de configuración
│   │   └── ConfigGroupItem.js     # Item de grupo editable
│   ├── services/
│   │   ├── storage.js             # Wrapper GM_getValue/GM_setValue
│   │   └── gitlab-api.js          # API GitLab con cache
│   ├── styles/
│   │   └── label-editor.css       # Estilos BEM con variables CSS
│   └── script.user.js             # Entry point
└── README.md
```

### Componentes

| Componente | Descripción | LOC |
|------------|-------------|-----|
| `LabelEditorApp` | Orquestador principal, estado reactivo, integración GitLab | 482 |
| `LabelConfigModal` | Modal de configuración con editor de grupos | 364 |
| `ConfigGroupItem` | Grupo editable con drag & drop | 184 |
| `LabelGroupsModal` | Modal principal de selección | 141 |
| `LabelGroup` | Grupo con header y etiquetas | 101 |

### Servicios

| Servicio | Descripción |
|----------|-------------|
| `LabelEditorStorage` | Wrapper para GM_getValue/GM_setValue con gestión por proyecto |
| `GitLabAPI` | Wrapper para API de GitLab con cache de 5 minutos |

### Estado Reactivo

```javascript
{
    // Selección (transient)
    selectedLabels: Set<string>,      // Etiquetas a añadir
    labelsToRemove: Set<string>,      // Etiquetas a eliminar
    currentLabels: Set<string>,       // Etiquetas actuales en issue/MR

    // Configuración (persistente)
    groups: {
        [groupName]: {
            color: string,
            exclusive: boolean,
            labels: string[]
        }
    },

    // API (cached)
    projectLabels: Array<{name, color, description}>,

    // UI
    showMainModal: boolean,
    showConfigModal: boolean,
    isLoading: boolean
}
```

## Instalación

### Requisitos

- Navegador con [Tampermonkey](https://www.tampermonkey.net/)
- [TM Framework](https://github.com/user/tm-framework) (se carga automáticamente)

### Pasos

1. **Instala Tampermonkey** en tu navegador
2. **Instala el script** desde el archivo `main/script.user.js`
3. **Configura los dominios** si usas GitLab privado:

```javascript
// @match        https://tu-gitlab.com/*/-/issues/*
// @match        https://tu-gitlab.com/*/-/merge_requests/*
```

### URLs de Recursos

El script carga estos recursos externos:

```javascript
// TM Framework
// @require      https://raw.githubusercontent.com/user/tm-framework/main/dist/tm-framework.js

// Servicios
// @require      .../services/storage.js
// @require      .../services/gitlab-api.js

// Componentes
// @require      .../components/LabelGroup.js
// @require      .../components/LabelGroupsModal.js
// @require      .../components/ConfigGroupItem.js
// @require      .../components/LabelConfigModal.js
// @require      .../components/LabelEditorApp.js

// Estilos
// @resource     LE_CSS .../styles/label-editor.css
```

## Uso

### Seleccionar Etiquetas

1. Ve a un **issue** o **merge request** en GitLab
2. En el sidebar, busca la sección **Labels**
3. Haz clic en el botón **🏷️**
4. **Clic** en una etiqueta para seleccionarla (verde)
5. **Doble clic** en una etiqueta para eliminarla (rojo tachado)
6. Revisa el preview de comandos
7. Haz clic en **✅ Aplicar**

### Configurar Grupos

1. En el modal principal, haz clic en **⚙️**
2. **Añadir grupo**: Clic en "➕ Añadir grupo"
3. **Editar grupo**:
   - Cambia el color con el selector
   - Edita el nombre directamente
   - Activa/desactiva "Exclusivo"
4. **Añadir etiquetas**:
   - Arrastra desde el panel derecho
   - O haz clic en una etiqueta disponible
5. **Eliminar etiqueta**: Clic en ✕
6. **Eliminar grupo**: Clic en 🗑️
7. Haz clic en **✅ Guardar**

### Grupos Exclusivos vs No Exclusivos

| Tipo | `exclusive` | Comportamiento |
|------|-------------|----------------|
| Exclusivo | `true` | Solo una etiqueta activa. Al seleccionar una, las otras se desmarcan |
| No exclusivo | `false` | Múltiples etiquetas del mismo grupo pueden estar activas |

## Configuración

### Almacenamiento

La configuración se guarda por proyecto usando `GM_setValue`:

- **Clave**: `labelGroups_<nombre-proyecto>`
- **Formato**: JSON con estructura de grupos

### Formato de Configuración

```json
{
    "Prioridad": {
        "color": "#ef4444",
        "exclusive": true,
        "labels": ["crítico", "alto", "medio", "bajo"]
    },
    "Estado": {
        "color": "#22c55e",
        "exclusive": true,
        "labels": ["pendiente", "en progreso", "completado"]
    },
    "Tags": {
        "color": "#9ca3af",
        "exclusive": false,
        "labels": ["urgente", "documentar", "tech-debt"]
    }
}
```

### Detección de Proyecto

El nombre del proyecto se extrae de la URL:

```
https://gitlab.com/grupo/proyecto/-/issues/123
                      ^^^^^^^^
                      proyecto
```

## Estilos CSS

### Nomenclatura BEM

Todos los estilos usan el prefijo `le-` (Label Editor):

```css
/* Bloques */
.le-overlay
.le-modal
.le-group
.le-label
.le-btn

/* Elementos */
.le-modal__header
.le-modal__content
.le-group__items

/* Modificadores */
.le-label--selected
.le-label--current
.le-label--remove
.le-btn--primary
```

### Variables CSS

```css
.label-editor {
    --le-bg-primary: #fff;
    --le-bg-secondary: #f5f5f5;
    --le-text-primary: #1a1a1a;
    --le-border: #d0d0d0;
    --le-accent: #6366f1;
    --le-success: #22a352;
    --le-danger: #d93545;
}

.label-editor.dark-mode {
    --le-bg-primary: #1f2937;
    --le-bg-secondary: #374151;
    --le-text-primary: #f3f4f6;
    /* ... */
}
```

## Debugging

Activa el logger para debug:

```javascript
TM.Logger.configure({
    enabled: true,
    level: 'debug',
    prefix: '[LabelEditor]'
});
```

Niveles disponibles: `debug`, `info`, `warn`, `error`

## Solución de Problemas

### El botón 🏷️ no aparece

- Verifica que `@match` incluye tu dominio GitLab
- Recarga la página
- Verifica que Tampermonkey está activo
- Revisa la consola por errores de carga

### Las etiquetas no se aplican

- Las etiquetas deben existir en GitLab con el nombre exacto
- Verifica la consola del navegador (F12)
- Activa el debug del Logger

### El modal no se ve correctamente

- Verifica que el CSS se cargó (`@resource LE_CSS`)
- El script tiene fallback de estilos inline

### Error "TM Framework not loaded"

- Verifica la URL del `@require` de tm-framework.js
- El framework debe cargarse antes que los componentes

## Changelog

### v2.0.0 (2026-01-26)

- **BREAKING**: Requiere TM Framework
- Migración a arquitectura de componentes reactivos
- 0 variables globales (antes 8)
- 0 event listeners manuales (antes 28)
- Nuevo sistema de estilos BEM
- Integración con TM.Logger
- Detección automática de tema

### v1.0.0

- Versión inicial
- Arquitectura procedural con 8 archivos JS

## Licencia

MIT License

## Autor

**Jesús Lorenzo**

- GitHub: [@FlJesusLorenzo](https://github.com/FlJesusLorenzo)
