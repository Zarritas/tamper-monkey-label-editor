# 🏷️ GitLab Label Groups

Script de Tampermonkey para gestionar etiquetas de GitLab organizadas en grupos mutuamente excluyentes.

![Version](https://img.shields.io/badge/version-2.1.0-blue)
![Vanilla JS](https://img.shields.io/badge/vanilla-JS-yellow)
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
- **Sin dependencias externas**: Vanilla JS puro, sin frameworks
- **Almacenamiento persistente**: Usa GM_setValue/GM_getValue para persistencia segura

## 📁 Estructura del Proyecto

```text
tamper-monkey-label-editor/
├── main/
│   ├── css/
│   │   └── style.css              # Estilos completos (variables, modal, toast, componentes)
│   ├── script.user.js             # Entry point (instalar en Tampermonkey)
│   └── js/
│       ├── utils.js               # Utilidades (deepClone, classNames, waitForElement, debounce)
│       ├── storage.js             # Wrapper de GM_getValue/setValue/deleteValue
│       ├── gitlab-helpers.js      # Helpers de GitLab (API, DOM, quick actions)
│       ├── toast.js               # Sistema de notificaciones toast
│       ├── modal.js               # Modal simple (SimpleModal)
│       ├── config.js              # Gestión de configuración y storage
│       ├── app.js                 # Clase principal LabelGroupsApp
│       └── components/
│           ├── LabelChip.js       # Etiqueta individual con estados
│           ├── LabelGroup.js      # Grupo de etiquetas con exclusividad
│           ├── LabelPopup.js      # Popup principal de selección
│           └── ConfigPopup.js     # Popup de configuración
└── README.md
```

## 🚀 Instalación

### Requisitos previos

1. Navegador con [Tampermonkey](https://www.tampermonkey.net/) instalado

### Pasos

1. **Crea un nuevo script** en Tampermonkey

2. **Copia el contenido** de `script.user.js`, ajustando las URLs de `@require` según tu entorno:

   - **Desarrollo local**: usa rutas `file:///` apuntando a tus archivos locales
   - **Producción**: usa URLs raw de GitHub apuntando a tu repositorio

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
- Se almacena con la clave `labelGroups_<nombre-proyecto>`
- Los proyectos nuevos usan la configuración por defecto hasta que la personalices

## 🧩 Componentes

El editor está construido con clases vanilla JS independientes:

| Componente | Descripción |
|------------|-------------|
| `LabelChip` | Etiqueta individual con estados (normal, selected, toRemove) |
| `LabelGroup` | Grupo de etiquetas con lógica de exclusividad y debounce |
| `LabelPopup` | Popup principal de selección de etiquetas |
| `ConfigPopup` | Popup de configuración con editor visual y JSON |
| `LabelGroupsApp` | Orquestador principal que gestiona los modales |

### Módulos de soporte

| Módulo | Descripción |
|--------|-------------|
| `Utils` | deepClone, classNames, escapeHtml, waitForElement, debounce |
| `StorageHelper` | Wrapper de GM_getValue/setValue/deleteValue |
| `GitLabHelper` | API de GitLab, detección de contexto, quick actions |
| `Toast` | Notificaciones flotantes (success, error, warning, info) |
| `SimpleModal` | Modal con overlay, cierre por ESC/overlay, setContent |

### Arquitectura

```text
┌─────────────────────────────────────────────────────────────┐
│                      LabelGroupsApp                         │
│  - Crea SimpleModal                                         │
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
// @require      file:///ruta/a/tu/proyecto/main/js/utils.js
// @require      file:///ruta/a/tu/proyecto/main/js/storage.js
// @require      file:///ruta/a/tu/proyecto/main/js/gitlab-helpers.js
// ...
```

> **Nota**: Necesitas habilitar el acceso a archivos locales en la configuración de Tampermonkey.

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

- El script detecta el tema de GitLab automáticamente via clases CSS y atributos `data-gitlab-theme-id`
- Soporta: `.gl-dark`, `[data-theme="dark"]`, y temas oscuros de GitLab (IDs 6-11)
- También respeta `prefers-color-scheme: dark` del sistema

## 📝 Licencia

MIT © Jesús Lorenzo

## 🔗 Enlaces

- [Tampermonkey](https://www.tampermonkey.net/) - Gestor de userscripts
