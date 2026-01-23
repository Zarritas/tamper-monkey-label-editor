function loadStyles() {
  try {
    GM_addStyle(GM_getResourceText("POPUP_CSS"));
  } catch (e) {
    console.error("[LabelGroups] Error loading CSS, using fallback:", e);
    GM_addStyle(FALLBACK_CSS);
  }
}

function isDarkMode() {
  // Detectar tema de GitLab
  const body = document.body;
  const html = document.documentElement;

  // GitLab usa estas clases/atributos para el tema oscuro
  if (
    html.classList.contains("gl-dark") ||
    body.classList.contains("gl-dark") ||
    html.dataset.theme === "gl-dark" ||
    body.dataset.theme === "gl-dark"
  ) {
    return true;
  }

  // Fallback: detectar preferencia del sistema
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return true;
  }

  return false;
}

function applyTheme(popup) {
  if (isDarkMode()) {
    popup.classList.add("dark-mode");
  } else {
    popup.classList.remove("dark-mode");
  }
}

function getPopupHTML() {
  try {
    return GM_getResourceText("POPUP_HTML");
  } catch (e) {
    console.error("[LabelGroups] Error loading popup HTML:", e);
    return FALLBACK_POPUP_HTML;
  }
}

function getConfigHTML() {
  try {
    return GM_getResourceText("CONFIG_HTML");
  } catch (e) {
    console.error("[LabelGroups] Error loading config HTML:", e);
    return FALLBACK_CONFIG_HTML;
  }
}

function createOverlay(className = "label-groups-overlay") {
  const overlay = document.createElement("div");
  overlay.className = className;
  return overlay;
}

// =====================================================
// POPUP PRINCIPAL
// =====================================================
function createPopup() {
  State.loadCurrentLabels();
  State.clear();

  const overlay = createOverlay();
  const popup = document.createElement("div");
  popup.className = "label-groups-popup";
  popup.innerHTML = getPopupHTML();
  overlay.appendChild(popup);

  applyTheme(popup);
  renderLabelGroups(popup);
  bindPopupEvents(popup, overlay);

  document.body.appendChild(overlay);
}

function renderLabelGroups(popup) {
  const content = popup.querySelector("#label-groups-content");
  const groups = getLabelGroups();

  for (const [groupName, group] of Object.entries(groups)) {
    const groupEl = createGroupElement(groupName, group);
    content.appendChild(groupEl);
  }
}

function createGroupElement(groupName, group) {
  const isExclusive = group.exclusive !== false;
  const exclusiveHint = isExclusive
    ? ""
    : '<span class="label-group-multi">(múltiple)</span>';

  const groupEl = document.createElement("div");
  groupEl.className = "label-group";
  groupEl.innerHTML = `
        <div class="label-group-header">
            <span class="label-group-dot" style="background: ${group.color}"></span>
            <span>${groupName}</span>
            ${exclusiveHint}
        </div>
        <div class="label-group-items"></div>
    `;

  const itemsContainer = groupEl.querySelector(".label-group-items");

  for (const label of group.labels) {
    const labelEl = createLabelElement(label);
    itemsContainer.appendChild(labelEl);
  }

  return groupEl;
}

function createLabelElement(label) {
  const labelEl = document.createElement("div");
  labelEl.className = "label-item";
  labelEl.textContent = label;
  labelEl.dataset.label = label;

  if (State.currentLabels.has(label)) {
    labelEl.classList.add("selected", "current");
    labelEl.title = "Etiqueta actual";
  }

  labelEl.addEventListener("click", () => toggleLabel(labelEl, label));
  labelEl.addEventListener("dblclick", () => toggleRemove(labelEl, label));

  return labelEl;
}

function bindPopupEvents(popup, overlay) {
  const configBtn = popup.querySelector("#label-groups-config");
  if (configBtn) {
    configBtn.addEventListener("click", () => {
      overlay.remove();
      createConfigPopup();
    });
  }

  popup
    .querySelector("#label-groups-cancel")
    .addEventListener("click", () => overlay.remove());
  popup
    .querySelector("#label-groups-submit")
    .addEventListener("click", () => applyChanges(overlay));

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

// =====================================================
// POPUP DE CONFIGURACIÓN
// =====================================================
let configGroups = {};
let projectLabels = [];
let selectedTargetGroup = null;

function createConfigPopup() {
  configGroups = JSON.parse(JSON.stringify(getLabelGroups())); // Deep copy

  const overlay = createOverlay();
  const popup = document.createElement("div");
  popup.className = "label-groups-popup";
  popup.style.minWidth = "550px";
  popup.innerHTML = getConfigHTML();
  overlay.appendChild(popup);

  applyTheme(popup);

  // Mostrar nombre del proyecto
  const projectNameEl = popup.querySelector("#config-project-name");
  if (projectNameEl) {
    projectNameEl.textContent = getCurrentProjectName();
  }

  renderConfigGroups(popup);
  bindConfigEvents(popup, overlay);
  loadProjectLabels(popup);

  document.body.appendChild(overlay);
}

async function loadProjectLabels(popup) {
  const container = popup.querySelector("#config-available-labels");

  try {
    projectLabels = await getProjectLabels();
    renderProjectLabels(popup);
  } catch (error) {
    container.innerHTML =
      '<span class="config-loading">Error al cargar etiquetas</span>';
  }
}

function renderProjectLabels(popup) {
  const container = popup.querySelector("#config-available-labels");

  if (projectLabels.length === 0) {
    container.innerHTML =
      '<span class="config-loading">No se encontraron etiquetas</span>';
    return;
  }

  // Obtener etiquetas ya usadas en grupos
  const usedLabels = new Set();
  Object.values(configGroups).forEach((group) => {
    group.labels.forEach((label) => usedLabels.add(label));
  });

  container.innerHTML = projectLabels
    .map((label) => {
      const isUsed = usedLabels.has(label.name);
      const textColor = getContrastColor(label.color);
      return `
            <span class="config-available-label ${isUsed ? "used" : ""}" 
                  data-label="${label.name}"
                  style="background: ${label.color}; color: ${textColor}"
                  title="${isUsed ? "Ya está en un grupo" : label.description || "Clic para añadir"}"
                  draggable="${!isUsed}">
                ${label.name}
            </span>
        `;
    })
    .join("");

  // Bind click events
  container
    .querySelectorAll(".config-available-label:not(.used)")
    .forEach((el) => {
      el.addEventListener("click", () => handleLabelClick(el, popup));
      el.addEventListener("dragstart", (e) => handleDragStart(e, el));
    });
}

function getContrastColor(hexColor) {
  // Convertir hex a RGB y calcular luminosidad
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

function handleLabelClick(el, popup) {
  const labelName = el.dataset.label;

  // Si no hay grupo seleccionado, seleccionar el primero o mostrar mensaje
  const groups = Object.keys(configGroups);
  if (groups.length === 0) {
    alert("Primero crea un grupo para añadir etiquetas");
    return;
  }

  // Mostrar selector de grupo
  showGroupSelector(labelName, popup, el);
}

function showGroupSelector(labelName, popup, sourceEl) {
  // Remover selector previo si existe
  const existing = popup.querySelector(".config-group-selector");
  if (existing) existing.remove();

  const groups = Object.keys(configGroups);

  const selector = document.createElement("div");
  selector.className = "config-group-selector";
  selector.innerHTML = `
        <div class="config-group-selector-title">Añadir "${labelName}" a:</div>
        ${groups
          .map(
            (name) => `
            <button class="config-group-selector-btn" data-group="${name}">
                <span class="label-group-dot" style="background: ${configGroups[name].color}"></span>
                ${name}
            </button>
        `,
          )
          .join("")}
        <button class="config-group-selector-cancel">Cancelar</button>
    `;

  // Posicionar cerca del elemento clickeado
  const rect = sourceEl.getBoundingClientRect();
  const popupRect = popup.getBoundingClientRect();
  selector.style.position = "absolute";
  selector.style.left = `${rect.left - popupRect.left}px`;
  selector.style.top = `${rect.bottom - popupRect.top + 5}px`;

  popup.style.position = "relative";
  popup.appendChild(selector);

  // Bind events
  selector.querySelectorAll(".config-group-selector-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      addLabelToGroup(labelName, btn.dataset.group, popup);
      selector.remove();
    });
  });

  selector
    .querySelector(".config-group-selector-cancel")
    .addEventListener("click", () => {
      selector.remove();
    });

  // Cerrar al clicar fuera
  setTimeout(() => {
    document.addEventListener("click", function closeSelector(e) {
      if (!selector.contains(e.target) && e.target !== sourceEl) {
        selector.remove();
        document.removeEventListener("click", closeSelector);
      }
    });
  }, 0);
}

function addLabelToGroup(labelName, groupName, popup) {
  if (!configGroups[groupName]) return;
  if (configGroups[groupName].labels.includes(labelName)) return;

  configGroups[groupName].labels.push(labelName);

  // Actualizar UI del grupo
  renderConfigGroups(popup);
  renderProjectLabels(popup);
}

function handleDragStart(e, el) {
  e.dataTransfer.setData("text/plain", el.dataset.label);
  e.dataTransfer.effectAllowed = "copy";
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "copy";
  e.currentTarget.classList.add("drag-over");
}

function handleDragLeave(e) {
  e.currentTarget.classList.remove("drag-over");
}

function handleDrop(e, groupName, popup) {
  e.preventDefault();
  e.currentTarget.classList.remove("drag-over");

  const labelName = e.dataTransfer.getData("text/plain");
  if (labelName) {
    addLabelToGroup(labelName, groupName, popup);
  }
}

function renderConfigGroups(popup) {
  const container = popup.querySelector("#config-groups-list");
  container.innerHTML = "";

  for (const [groupName, group] of Object.entries(configGroups)) {
    const groupEl = createConfigGroupElement(groupName, group, popup);
    container.appendChild(groupEl);
  }
}

function createConfigGroupElement(groupName, group, popup) {
  const groupEl = document.createElement("div");
  groupEl.className = "config-group-item";
  groupEl.dataset.groupName = groupName;

  groupEl.innerHTML = `
        <div class="config-group-header">
            <input type="color" class="config-color" value="${group.color}" title="Color del grupo">
            <input type="text" class="config-name" value="${groupName}" placeholder="Nombre del grupo">
            <button class="config-group-delete" title="Eliminar grupo">🗑️</button>
        </div>
        <div class="config-group-options">
            <label>
                <input type="checkbox" class="config-exclusive" ${group.exclusive !== false ? "checked" : ""}>
                Exclusivo (solo una etiqueta a la vez)
            </label>
        </div>
        <div class="config-labels-container">
            ${group.labels
              .map(
                (label) => `
                <span class="config-label-chip" data-label="${label}">
                    ${label}
                    <button type="button" title="Eliminar">&times;</button>
                </span>
            `,
              )
              .join("")}
            <input type="text" class="config-label-input" placeholder="Escribe o arrastra aquí">
        </div>
    `;

  // Bind events para este grupo
  bindConfigGroupEvents(groupEl, groupName, popup);

  return groupEl;
}

function bindConfigGroupEvents(groupEl, originalName, popup) {
  // Eliminar grupo
  groupEl
    .querySelector(".config-group-delete")
    .addEventListener("click", () => {
      delete configGroups[originalName];
      groupEl.remove();
      renderProjectLabels(popup);
    });

  // Eliminar etiqueta (chips)
  groupEl.querySelectorAll(".config-label-chip button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const chip = btn.closest(".config-label-chip");
      const label = chip.dataset.label;
      const name = getConfigGroupName(groupEl);

      if (configGroups[name]) {
        configGroups[name].labels = configGroups[name].labels.filter(
          (l) => l !== label,
        );
      }
      chip.remove();
      renderProjectLabels(popup);
    });
  });

  // Añadir etiqueta manualmente
  const input = groupEl.querySelector(".config-label-input");
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && input.value.trim()) {
      e.preventDefault();
      const label = input.value.trim();
      const name = getConfigGroupName(groupEl);

      if (configGroups[name] && !configGroups[name].labels.includes(label)) {
        configGroups[name].labels.push(label);
        renderConfigGroups(popup);
        renderProjectLabels(popup);
      }
      input.value = "";
    }
  });

  // Drag and drop
  const labelsContainer = groupEl.querySelector(".config-labels-container");
  labelsContainer.addEventListener("dragover", handleDragOver);
  labelsContainer.addEventListener("dragleave", handleDragLeave);
  labelsContainer.addEventListener("drop", (e) => {
    handleDrop(e, getConfigGroupName(groupEl), popup);
  });

  // Actualizar nombre/color/exclusividad
  groupEl.querySelector(".config-name").addEventListener("change", (e) => {
    const oldName = groupEl.dataset.groupName;
    const newName = e.target.value.trim();

    if (newName && newName !== oldName && !configGroups[newName]) {
      configGroups[newName] = configGroups[oldName];
      delete configGroups[oldName];
      groupEl.dataset.groupName = newName;
    }
  });

  groupEl.querySelector(".config-color").addEventListener("change", (e) => {
    const name = getConfigGroupName(groupEl);
    if (configGroups[name]) {
      configGroups[name].color = e.target.value;
    }
  });

  groupEl.querySelector(".config-exclusive").addEventListener("change", (e) => {
    const name = getConfigGroupName(groupEl);
    if (configGroups[name]) {
      configGroups[name].exclusive = e.target.checked;
    }
  });
}

function getConfigGroupName(groupEl) {
  return groupEl.dataset.groupName;
}

function bindConfigEvents(popup, overlay) {
  // Cancelar
  popup.querySelector("#config-cancel").addEventListener("click", () => {
    overlay.remove();
    createPopup();
  });

  // Guardar
  popup.querySelector("#config-save").addEventListener("click", () => {
    handleConfigSave(popup, overlay);
  });

  // Añadir grupo
  popup.querySelector("#config-add-group").addEventListener("click", () => {
    const newName = generateUniqueGroupName();
    configGroups[newName] = {
      color: "#6366f1",
      exclusive: true,
      labels: [],
    };

    renderConfigGroups(popup);

    // Focus en el nombre del nuevo grupo
    const newGroupEl = popup.querySelector(
      `.config-group-item[data-group-name="${newName}"]`,
    );
    if (newGroupEl) {
      newGroupEl.querySelector(".config-name").focus();
      newGroupEl.querySelector(".config-name").select();
    }
  });

  // Refrescar etiquetas del proyecto
  const refreshBtn = popup.querySelector("#config-refresh-labels");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", async () => {
      const container = popup.querySelector("#config-available-labels");
      container.innerHTML =
        '<span class="config-loading">Cargando etiquetas...</span>';
      clearLabelsCache();
      await loadProjectLabels(popup);
    });
  }

  // Cerrar al clicar fuera
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

function generateUniqueGroupName() {
  let i = 1;
  while (configGroups[`Nuevo grupo ${i}`]) {
    i++;
  }
  return `Nuevo grupo ${i}`;
}

function handleConfigSave(popup, overlay) {
  const statusEl = popup.querySelector("#config-status");

  // Validar que no haya grupos sin nombre o sin etiquetas
  const emptyGroups = Object.entries(configGroups).filter(
    ([name, group]) => !name.trim() || group.labels.length === 0,
  );

  if (emptyGroups.length > 0) {
    statusEl.innerHTML =
      '<div class="label-groups-error">❌ Hay grupos sin nombre o sin etiquetas</div>';
    return;
  }

  saveLabelGroups(configGroups);
  statusEl.innerHTML =
    '<div class="label-groups-success">✅ Configuración guardada</div>';

  setTimeout(() => {
    overlay.remove();
    createPopup();
  }, 1000);
}
