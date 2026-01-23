### Configuración por proyecto

La configuración se guarda **por proyecto**, lo que significa que cada proyecto de GitLab puede tener sus propios grupos de etiquetas personalizados.

- El nombre del proyecto se extrae de la URL
  - Ejemplo: `https://git.factorlibre.com/odoo-16/fl-v16/-/issues/123` → Proyecto: `fl-v16`
- La configuración se almacena con la clave `labelGroups_<nombre-proyecto>`
- Al abrir la configuración, se muestra el nombre del proyecto actual
- Los proyectos nuevos usan la configuración por defecto hasta que la personalices```
  label-groups/
  ├── css/
  │ └── style.css # Estilos del popup
  ├── html/
  │ ├── popup.html # HTML del popup principal
  │ └── config-popup.html # HTML del popup de configuración
  ├── js/
  │ ├── fallback.js # CSS/HTML de fallback
  │ ├── config.js # Gestión de configuración
  │ ├── state.js # Estado global de la aplicación
  │ ├── api.js # Comunicación con la API de GitLab
  │ ├── labels.js # Lógica de selección de etiquetas
  │ # 🏷️ GitLab Label Groups

Script de Tampermonkey para gestionar etiquetas de GitLab organizadas en grupos mutuamente excluyentes.

## ✨ Características

- **Etiquetas agrupadas**: Organiza tus etiquetas en grupos lógicos (Área, Prioridad, Estado, Tipo, etc.)
- **Exclusividad por grupo**: Al seleccionar una etiqueta, se elimina automáticamente cualquier otra del mismo grupo
- **Configuración por proyecto**: Cada proyecto de GitLab tiene su propia configuración de grupos
- **Configuración visual**: Edita los grupos desde una interfaz amigable sin tocar código
- **Etiquetas del proyecto**: Carga automáticamente las etiquetas disponibles desde la API de GitLab
- **Preserva tu trabajo**: Si tienes texto escrito en el comentario, se mantiene después de aplicar las etiquetas
- **Quick Actions**: Utiliza los comandos nativos `/label` y `/unlabel` de GitLab
- **Compatible con Rich Text**: Cambia automáticamente entre editores para garantizar compatibilidad

## 📸 Capturas de pantalla

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
// @require      https://raw.githubusercontent.com/TU_USUARIO/TU_REPO/main/label-groups/js/labels.js
// @require      https://raw.githubusercontent.com/TU_USUARIO/TU_REPO/main/label-groups/js/gitlab.js
// @require      https://raw.githubusercontent.com/TU_USUARIO/TU_REPO/main/label-groups/js/ui.js
```

5. **Añade los dominios** de tu instancia de GitLab en los `@match`:

```javascript
// @match        https://gitlab.com/*/-/issues/*
// @match        https://gitlab.com/*/-/merge_requests/*
// @match        https://tu-gitlab.com/*/-/issues/*
// @match        https://tu-gitlab.com/*/-/merge_requests/*
```

6. **Guarda** el script

## 📁 Estructura del proyecto

```
label-groups/
├── css/
│   └── style.css           # Estilos del popup
├── html/
│   ├── popup.html          # HTML del popup principal
│   └── config-popup.html   # HTML del popup de configuración
├── js/
│   ├── fallback.js         # CSS/HTML de fallback
│   ├── config.js           # Gestión de configuración
│   ├── state.js            # Estado global de la aplicación
│   ├── labels.js           # Lógica de selección de etiquetas
│   ├── gitlab.js           # Interacción con GitLab
│   └── ui.js               # Renderizado de popups
├── main.user.js            # Script principal (entry point)
└── README.md
```

## ⚙️ Configuración

### Configuración por defecto

El script viene con grupos de ejemplo:

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

### Personalizar grupos

1. Abre cualquier issue o merge request en GitLab
2. Haz clic en el botón 🏷️ junto a "Labels" en el sidebar
3. Haz clic en el botón ⚙️ en la esquina superior derecha del popup
4. Desde la interfaz puedes:
   - **Añadir grupo**: Clic en "➕ Añadir grupo"
   - **Eliminar grupo**: Clic en 🗑️
   - **Cambiar color**: Clic en el selector de color
   - **Renombrar grupo**: Edita el nombre directamente
   - **Marcar como exclusivo/múltiple**: Activa o desactiva el checkbox
   - **Añadir etiqueta**:
     - Escribe en el campo y pulsa Enter, o
     - Haz clic en una etiqueta del panel "Etiquetas del proyecto", o
     - Arrastra una etiqueta del panel al grupo deseado
   - **Eliminar etiqueta**: Clic en la ✕ de la etiqueta
5. Haz clic en "✅ Guardar"

### Etiquetas del proyecto

El panel "📋 Etiquetas del proyecto" muestra todas las etiquetas disponibles en el proyecto actual de GitLab:

- Las etiquetas se cargan automáticamente desde la API de GitLab
- Las etiquetas ya asignadas a un grupo aparecen atenuadas
- Haz clic en 🔄 para recargar las etiquetas
- Puedes arrastrar etiquetas directamente a los grupos

### Formato del JSON

```json
{
  "NombreDelGrupo": {
    "color": "#hexcolor",
    "exclusive": true,
    "labels": ["etiqueta1", "etiqueta2", "etiqueta3"]
  },
  "GrupoMultiple": {
    "color": "#9ca3af",
    "exclusive": false,
    "labels": ["tag1", "tag2", "tag3"]
  }
}
```

- **color**: Color del indicador del grupo (formato hexadecimal)
- **exclusive**: `true` (por defecto) para selección única, `false` para selección múltiple
- **labels**: Array con los nombres exactos de las etiquetas en GitLab

### Grupos exclusivos vs no exclusivos

| Tipo         | `exclusive` | Comportamiento                                                                                             |
| ------------ | ----------- | ---------------------------------------------------------------------------------------------------------- |
| Exclusivo    | `true`      | Solo una etiqueta del grupo puede estar activa. Al seleccionar una, las otras se desmarcan automáticamente |
| No exclusivo | `false`     | Puedes seleccionar múltiples etiquetas del mismo grupo                                                     |

## 🎯 Uso

1. Ve a cualquier **issue** o **merge request** en GitLab
2. En el sidebar derecho, busca la sección "Labels"
3. Haz clic en el botón **🏷️** que aparece junto al botón de editar
4. **Clic** en una etiqueta para seleccionarla (se marca en verde)
5. **Doble clic** en una etiqueta para marcarla para eliminar (se marca en rojo y tachada)
6. Haz clic en **"✅ Aplicar"** para guardar los cambios

> **Nota**: Las etiquetas del mismo grupo son mutuamente excluyentes. Al seleccionar una, las otras del mismo grupo se desmarcan automáticamente.

## 🔧 Solución de problemas

### El botón 🏷️ no aparece

- Asegúrate de que el `@match` incluye el dominio de tu GitLab
- Recarga la página después de instalar/actualizar el script
- Verifica que Tampermonkey está activo

### Las etiquetas no se aplican

- GitLab debe tener las etiquetas creadas con los nombres exactos
- Verifica en la consola del navegador (F12) si hay errores

### El popup no se ve correctamente

- Si los recursos externos no cargan, el script usa estilos de fallback
- Verifica que las URLs de los `@resource` son correctas

## 📝 Licencia

MIT License

## 👤 Autor

**Jesús Lorenzo**

- GitHub: [@FlJesusLorenzo](https://github.com/FlJesusLorenzo)
