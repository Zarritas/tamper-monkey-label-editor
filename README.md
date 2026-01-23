# 🏷️ GitLab Label Groups

Script de Tampermonkey para gestionar etiquetas de GitLab organizadas en grupos mutuamente excluyentes.

![Version](https://img.shields.io/badge/version-1.2-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Características

- **Etiquetas agrupadas**: Organiza tus etiquetas en grupos lógicos (Área, Prioridad, Estado, Tipo, etc.)
- **Exclusividad por grupo**: Al seleccionar una etiqueta de un grupo exclusivo, se elimina automáticamente cualquier otra del mismo grupo
- **Grupos no exclusivos**: Permite crear grupos donde puedes seleccionar múltiples etiquetas
- **Configuración por proyecto**: Cada proyecto de GitLab tiene su propia configuración independiente
- **Interfaz visual**: Crea y edita grupos desde una interfaz amigable sin tocar código
- **Etiquetas del proyecto**: Carga automáticamente las etiquetas disponibles desde la API de GitLab
- **Drag & Drop**: Arrastra etiquetas del proyecto directamente a los grupos
- **Modo oscuro/claro**: Detecta automáticamente el tema de GitLab y adapta la interfaz
- **Preserva tu trabajo**: Si tienes texto escrito en el comentario, se mantiene después de aplicar las etiquetas
- **Quick Actions**: Utiliza los comandos nativos `/label` y `/unlabel` de GitLab

## 📸 Vista previa

<!-- Añadir capturas de pantalla aquí -->

## 🚀 Instalación

### Requisitos previos

- Navegador con [Tampermonkey](https://www.tampermonkey.net/) instalado

### Pasos

1. **Instala Tampermonkey** en tu navegador si aún no lo tienes

2. **Crea un nuevo script** en Tampermonkey

3. **Copia el contenido** de `main.user.js`

4. **Actualiza las URLs** reemplazando `USER/REPO` con tu usuario y repositorio de GitHub:

```javascript
// @resource     POPUP_CSS   https://raw.githubusercontent.com/TU_USUARIO/TU_REPO/main/label-groups/css/style.css
// @resource     POPUP_HTML  https://raw.githubusercontent.com/TU_USUARIO/TU_REPO/main/label-groups/html/popup.html
// @resource     CONFIG_HTML https://raw.githubusercontent.com/TU_USUARIO/TU_REPO/main/label-groups/html/config-popup.html
// @require      https://raw.githubusercontent.com/TU_USUARIO/TU_REPO/main/label-groups/js/fallback.js
// @require      https://raw.githubusercontent.com/TU_USUARIO/TU_REPO/main/label-groups/js/config.js
// @require      https://raw.githubusercontent.com/TU_USUARIO/TU_REPO/main/label-groups/js/state.js
// @require      https://raw.githubusercontent.com/TU_USUARIO/TU_REPO/main/label-groups/js/api.js
// @require      https://raw.githubusercontent.com/TU_USUARIO/TU_REPO/main/label-groups/js/labels.js
// @require      https://raw.githubusercontent.com/TU_USUARIO/TU_REPO/main/label-groups/js/gitlab.js
// @require      https://raw.githubusercontent.com/TU_USUARIO/TU_REPO/main/label-groups/js/ui.js
```

5. **Añade los dominios** de tu instancia de GitLab:

```javascript
// @match        https://gitlab.com/*/-/issues/*
// @match        https://gitlab.com/*/-/merge_requests/*
// @match        https://tu-gitlab.com/*/-/issues/*
// @match        https://tu-gitlab.com/*/-/merge_requests/*
// @connect      gitlab.com
// @connect      tu-gitlab.com
```

6. **Guarda** el script

## 📁 Estructura del proyecto

```
label-groups/
├── css/
│   └── style.css           # Estilos del popup (modo claro/oscuro)
├── html/
│   ├── popup.html          # HTML del popup principal
│   └── config-popup.html   # HTML del popup de configuración
├── js/
│   ├── fallback.js         # CSS/HTML de fallback
│   ├── config.js           # Gestión de configuración por proyecto
│   ├── state.js            # Estado global de la aplicación
│   ├── api.js              # Comunicación con la API de GitLab
│   ├── labels.js           # Lógica de selección de etiquetas
│   ├── gitlab.js           # Interacción con GitLab (comentarios)
│   └── ui.js               # Renderizado de popups y detección de tema
├── main.user.js            # Script principal (entry point)
└── README.md
```

## 🎯 Uso

1. Ve a cualquier **issue** o **merge request** en GitLab

2. En el sidebar derecho, busca la sección **"Labels"**

3. Haz clic en el botón **🏷️** que aparece junto al botón de editar

4. **Selecciona etiquetas**:
   - **Clic** → Seleccionar (se marca en verde)
   - **Doble clic** → Marcar para eliminar (se marca en rojo y tachada)

5. Haz clic en **"✅ Aplicar"** para guardar los cambios

> **Nota**: En grupos exclusivos, al seleccionar una etiqueta las otras del mismo grupo se desmarcan automáticamente.

## ⚙️ Configuración

### Acceder a la configuración

1. Abre el popup de etiquetas (🏷️)
2. Haz clic en el botón **⚙️** en la esquina superior derecha

### Gestionar grupos

Desde la interfaz de configuración puedes:

| Acción | Cómo hacerlo |
|--------|--------------|
| **Añadir grupo** | Clic en "➕ Añadir grupo" |
| **Eliminar grupo** | Clic en 🗑️ |
| **Cambiar color** | Clic en el selector de color |
| **Renombrar grupo** | Edita el nombre directamente |
| **Exclusivo/múltiple** | Activa o desactiva el checkbox |
| **Añadir etiqueta** | Escribe + Enter, o clic/arrastra desde el panel |
| **Eliminar etiqueta** | Clic en la ✕ de la etiqueta |

### Etiquetas del proyecto

El panel **"📋 Etiquetas del proyecto"** muestra todas las etiquetas disponibles:

- Se cargan automáticamente desde la API de GitLab
- Las ya asignadas a un grupo aparecen atenuadas
- Haz clic en 🔄 para recargar
- **Clic** en una etiqueta → Selecciona el grupo destino
- **Arrastra** una etiqueta → Suéltala en el grupo deseado

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
        "labels": ["etiqueta1", "etiqueta2"]
    }
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `color` | string | Color hexadecimal del indicador |
| `exclusive` | boolean | `true` = solo una etiqueta, `false` = múltiples |
| `labels` | array | Nombres exactos de las etiquetas en GitLab |

### Grupos exclusivos vs no exclusivos

| Tipo | Comportamiento |
|------|----------------|
| **Exclusivo** (`true`) | Solo una etiqueta activa. Al seleccionar una, las otras se desmarcan |
| **No exclusivo** (`false`) | Múltiples etiquetas. Aparece indicador *(múltiple)* |

## 💾 Almacenamiento

### Configuración por proyecto

Cada proyecto tiene su configuración independiente:

- **URL**: `https://gitlab.com/grupo/mi-proyecto/-/issues/123`
- **Proyecto detectado**: `mi-proyecto`
- **Clave de almacenamiento**: `labelGroups_mi-proyecto`

Los proyectos nuevos usan la configuración por defecto hasta que la personalices.

### Tema oscuro/claro

El script detecta automáticamente el tema:

1. Clase `gl-dark` en GitLab
2. Atributo `data-theme="gl-dark"`
3. Preferencia del sistema (`prefers-color-scheme`)

## 🔧 Solución de problemas

### El botón 🏷️ no aparece

- Verifica que el `@match` incluye tu dominio de GitLab
- Recarga la página después de instalar el script
- Comprueba que Tampermonkey está activo

### Las etiquetas no se aplican

- Las etiquetas deben existir en GitLab con los nombres exactos
- Revisa la consola del navegador (F12) para ver errores
- Verifica que tienes permisos para editar el issue

### No se cargan las etiquetas del proyecto

- Asegúrate de que el dominio está en `@connect`
- Verifica que estás autenticado en GitLab
- Haz clic en 🔄 para reintentar

### El popup no se ve correctamente

- Si los recursos externos fallan, el script usa estilos de fallback
- Verifica que las URLs de los `@resource` son accesibles

## 📝 Licencia

MIT License

## 👤 Autor

**Jesús Lorenzo**

- GitHub: [@FlJesusLorenzo](https://github.com/FlJesusLorenzo)
