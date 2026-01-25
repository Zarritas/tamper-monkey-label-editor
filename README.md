# 🏷️ GitLab Label Groups

Script de Tampermonkey para gestionar etiquetas de GitLab organizadas en grupos mutuamente excluyentes.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![TM Framework](https://img.shields.io/badge/requires-TM%20Framework-purple)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Características

- **Etiquetas agrupadas**: Organiza tus etiquetas en grupos lógicos (Área, Prioridad, Estado, Tipo, etc.)
- **Exclusividad por grupo**: Al seleccionar una etiqueta de un grupo exclusivo, se eliminan automáticamente las otras del mismo grupo
- **Grupos no exclusivos**: Permite crear grupos donde puedes seleccionar múltiples etiquetas
- **Configuración por proyecto**: Cada proyecto de GitLab tiene su propia configuración independiente
- **Editor visual**: Crea y edita grupos desde una interfaz amigable sin tocar código
- **Editor JSON**: Para usuarios avanzados, edición directa del JSON de configuración
- **Etiquetas del proyecto**: Carga automáticamente las etiquetas disponibles desde la API de GitLab
- **Modo oscuro/claro**: Detecta automáticamente el tema de GitLab
- **Quick Actions**: Utiliza los comandos nativos `/label` y `/unlabel` de GitLab
- **Almacenamiento optimizado**: Usa GM_setValue/GM_getValue para persistencia segura
- **API robusta**: Peticiones con GM_xmlhttpRequest y mejor manejo de errores
- **Sin stack overflow**: Sistema de eventos protegido contra recursión infinita

## 📁 Estructura del Proyecto

```text
label-editor/
├── main/
│   ├── css/
│   │   └── style.css           # Estilos específicos del editor
│   ├── script.user.js          # Entry point (instalar en Tampermonkey)
│   └── js/
│       ├── config.js            # Gestión de configuración y storage
│       ├── app.js               # Clase principal LabelGroupsApp
│       └── components/
│           ├── LabelChip.js     # Etiqueta individual con estados
│           ├── LabelGroup.js    # Grupo de etiquetas con exclusividad
│           ├── LabelPopup.js    # Popup principal de selección
│           └── ConfigPopup.js   # Popup de configuración
└── README.md
```

## 🚀 Instalación

### Requisitos previos

1. Navegador con [Tampermonkey](https://www.tampermonkey.net/) instalado
2. [TM Framework](https://github.com/Zarritas/tm-framework) (se carga automáticamente via @require)

### Pasos

1. **Crea un nuevo script** en Tampermonkey

2. **Copia el contenido** de `script.user.js`:

```javascript
// ==UserScript==
// @name         GitLab Label Groups
// @namespace    http://tampermonkey.net/
// @version      2.0.0
// @description  Gestiona etiquetas de GitLab en grupos mutuamente excluyentes
// @author       Jesús Lorenzo
// @match        https://gitlab.com/*/-/issues/*
// @match        https://gitlab.com/*/-/merge_requests/*
// @match        https://git.factorlibre.com/*/-/issues/*
// @match        https://git.factorlibre.com/*/-/merge_requests/*
// @require      https://raw.githubusercontent.com/Zarritas/tm-framework/main/dist/tm-framework.js
// @require      https://raw.githubusercontent.com/Zarritas/tm-framework/main/dist/tm-gitlab.js
// @require      https://raw.githubusercontent.com/FlJesusLorenzo/label-editor/main/js/config.js
// @require      https://raw.githubusercontent.com/FlJesusLorenzo/label-editor/main/js/components/LabelChip.js
// @require      https://raw.githubusercontent.com/FlJesusLorenzo/label-editor/main/js/components/LabelGroup.js
// @require      https://raw.githubusercontent.com/FlJesusLorenzo/label-editor/main/js/components/LabelPopup.js
// @require      https://raw.githubusercontent.com/FlJesusLorenzo/label-editor/main/js/components/ConfigPopup.js
// @require      https://raw.githubusercontent.com/FlJesusLorenzo/label-editor/main/js/app.js
// @resource     TM_CSS https://raw.githubusercontent.com/Zarritas/tm-framework/main/dist/tm-styles.css
// @resource     APP_CSS https://raw.githubusercontent.com/FlJesusLorenzo/label-editor/main/css/style.css
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

    // Inyectar estilos
    GM_addStyle(GM_getResourceText('TM_CSS'));
    GM_addStyle(GM_getResourceText('APP_CSS'));

    // Inicializar
    if (TM.gitlab.isGitLab()) {
        TM.gitlab.waitForSidebar().then(() => {
            new LabelGroupsApp().init();
        }).catch(err => {
            console.warn('[Label Groups] Sidebar not found:', err);
        });
    }
})();
```

3. **Añade tus dominios** de GitLab en los `@match` si usas una instancia propia

4. **Guarda** el script

## 🎯 Uso

### Seleccionar etiquetas

1. Ve a cualquier **issue** o **merge request** en GitLab
2. En el sidebar derecho, haz clic en el botón **🏷️** junto a "Labels"
3. **Clic** en una etiqueta para seleccionarla (se marca en verde)
4. **Doble clic** en una etiqueta para marcarla para eliminar (se marca en rojo tachado)
5. Haz clic en **"✅ Aplicar"** para guardar los cambios

> **Nota**: En grupos exclusivos, al seleccionar una etiqueta se deseleccionan automáticamente las otras del mismo grupo.

### Estados de las etiquetas

| Estado | Visual | Acción |
|--------|--------|--------|
| Normal | Borde de color | Clic para seleccionar |
| Seleccionada | Fondo de color | Se añadirá al aplicar |
| Para eliminar | Rojo tachado | Se eliminará al aplicar |

## ⚙️ Configuración

### Acceder a la configuración

1. Abre el popup de etiquetas (🏷️)
2. Haz clic en el botón **⚙️** en la esquina superior derecha

### Modos de edición

| Pestaña | Descripción |
|---------|-------------|
| **🎨 Visual** | Interfaz gráfica para gestionar grupos |
| **📄 JSON** | Editor de texto para editar el JSON directamente |

Los cambios se sincronizan automáticamente entre ambos modos.

### Gestionar grupos (modo Visual)

- **Añadir grupo**: Clic en "➕ Añadir grupo"
- **Eliminar grupo**: Clic en 🗑️
- **Cambiar color**: Clic en el selector de color
- **Renombrar grupo**: Edita el nombre directamente
- **Marcar como exclusivo**: Activa o desactiva el checkbox
- **Añadir etiqueta**: Escribe en el campo y pulsa Enter, o haz clic en una etiqueta del panel "Etiquetas del proyecto"
- **Eliminar etiqueta**: Clic en la ✕ de la etiqueta

### Configuración por defecto

```json
{
    "Área": {
        "color": "#6366f1",
        "exclusive": true,
        "labels": ["conectores", "almacén", "ventas", "compras", "contabilidad"]
    },
    "Prioridad": {
        "color": "#ef4444",
        "exclusive": true,
        "labels": ["crítico", "alto", "medio", "bajo"]
    },
    "Estado": {
        "color": "#22c55e",
        "exclusive": true,
        "labels": ["pendiente", "en progreso", "en revisión", "bloqueado"]
    },
    "Tipo": {
        "color": "#f59e0b",
        "exclusive": true,
        "labels": ["bug", "feature", "mejora", "documentación", "refactor"]
    },
    "Otro": {
        "color": "#9ca3af",
        "exclusive": false,
        "labels": ["urgente", "requiere-review", "documentar", "tech-debt"]
    }
}
```

### Formato del JSON

```json
{
    "NombreDelGrupo": {
        "color": "#hexcolor",
        "exclusive": true,
        "labels": ["etiqueta1", "etiqueta2", "etiqueta3"]
    }
}
```

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `color` | string | Color hexadecimal del grupo |
| `exclusive` | boolean | `true` = solo una etiqueta activa, `false` = múltiples |
| `labels` | string[] | Nombres exactos de las etiquetas en GitLab |

### Configuración por proyecto

La configuración se guarda **por proyecto**:

- El nombre del proyecto se extrae de la URL (ej: `fl-v16` de `.../odoo-16/fl-v16/-/issues/123`)
- Se almacena con GM_setValue/GM_getValue usando la clave `labelGroups_<nombre-proyecto>` (con fallback a localStorage)
- Los proyectos nuevos usan la configuración por defecto hasta que la personalices

## 🧩 Componentes

El editor está construido con [TM Framework](https://github.com/Zarritas/tm-framework) usando componentes reactivos:

| Componente | Descripción |
|------------|-------------|
| `LabelChip` | Etiqueta individual con estados (normal, selected, toRemove) |
| `LabelGroup` | Grupo de etiquetas con lógica de exclusividad |
| `LabelPopup` | Popup principal de selección de etiquetas |
| `ConfigPopup` | Popup de configuración con editor visual y JSON |
| `LabelGroupsApp` | Orquestador principal que gestiona los modales |

### Arquitectura

```text
┌─────────────────────────────────────────────────────────────┐
│                      LabelGroupsApp                         │
│  - Crea Modal                                               │
│  - Añade botón trigger al sidebar                           │
│  - Orquesta LabelPopup y ConfigPopup                        │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌──────────────────────┐         ┌──────────────────────┐
│     LabelPopup       │ ──────► │    ConfigPopup       │
│  - Muestra grupos    │   ⚙️    │  - Editor visual     │
│  - Selección labels  │         │  - Editor JSON       │
│  - Aplica cambios    │         │  - Labels del proyecto│
└──────────────────────┘         └──────────────────────┘
              │                               
              ▼                               
┌──────────────────────┐                      
│     LabelGroup       │                      
│  - Contiene N chips  │                      
│  - Gestiona exclusiv.│                      
└──────────────────────┘                      
              │                               
              ▼                               
┌──────────────────────┐                      
│     LabelChip        │                      
│  - Click: seleccionar│                      
│  - DblClick: eliminar│                      
└──────────────────────┘                      
```

## 🔧 Desarrollo

### Modificar el código

1. Clona el repositorio
2. Edita los archivos en `main/js` y `main/css`
3. En Tampermonkey, cambia los `@require` para apuntar a tus archivos locales:

```javascript
// @require      file:///ruta/a/tu/proyecto/main/js/config.js
// @require      file:///ruta/a/tu/proyecto/main/js/components/LabelChip.js
// ...
```

> **Nota**: Necesitas habilitar el acceso a archivos locales en la configuración de Tampermonkey.

### Dependencias

Este proyecto depende de [TM Framework](https://github.com/Zarritas/tm-framework):

- `tm-framework.js` - Core del framework (componentes, estado reactivo, utilidades)
- `tm-gitlab.js` - Plugin con helpers específicos para GitLab
- `tm-styles.css` - Estilos base y variables CSS

## 🐛 Solución de problemas

### El botón 🏷️ no aparece

- Verifica que el `@match` incluye el dominio de tu GitLab
- Recarga la página después de instalar/actualizar el script
- Comprueba que Tampermonkey está activo
- Revisa la consola del navegador (F12) para ver errores

### Las etiquetas no se aplican

- Las etiquetas deben existir en GitLab con los nombres exactos
- Verifica que tienes permisos para editar el issue/MR
- Comprueba la consola para ver si hay errores de API

### El tema no se detecta correctamente

- El framework detecta el tema de GitLab automáticamente
- Si usas una versión antigua de GitLab, puede que no funcione
- Puedes forzar el tema añadiendo `TM.theme.setMode('dark')` o `'light'`

## 📝 Licencia

MIT © Jesús Lorenzo

## 🔗 Enlaces

- [TM Framework](https://github.com/Zarritas/tm-framework) - Framework base
- [Tampermonkey](https://www.tampermonkey.net/) - Gestor de userscripts