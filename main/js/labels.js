function toggleLabel(el, label) {
  // Si estaba marcada para eliminar, quitarla de esa lista
  if (State.labelsToRemove.has(label)) {
    State.labelsToRemove.delete(label);
    el.classList.remove("to-remove");
  }

  const group = getGroupForLabel(label);

  if (State.selectedLabels.has(label)) {
    // Deseleccionar
    State.selectedLabels.delete(label);
    el.classList.remove("selected");
  } else {
    // Seleccionar - aplicar exclusividad solo si el grupo es exclusivo
    if (group?.exclusive) {
      deselectOthersInGroup(group, label);
      markCurrentLabelsForRemoval(group, label);
    }

    State.selectedLabels.add(label);
    el.classList.add("selected");
    el.classList.remove("current");
  }

  updatePreview();
}

function toggleRemove(el, label) {
  // Si estaba seleccionada, quitarla
  if (State.selectedLabels.has(label)) {
    State.selectedLabels.delete(label);
    el.classList.remove("selected");
  }

  if (State.labelsToRemove.has(label)) {
    // Quitar de la lista de eliminar
    State.labelsToRemove.delete(label);
    el.classList.remove("to-remove");
    if (State.currentLabels.has(label)) {
      el.classList.add("current");
    }
  } else {
    // Añadir a la lista de eliminar
    State.labelsToRemove.add(label);
    el.classList.add("to-remove");
    el.classList.remove("current");
  }

  updatePreview();
}

function deselectOthersInGroup(group, exceptLabel) {
  group.labels.forEach((groupLabel) => {
    if (groupLabel !== exceptLabel) {
      State.selectedLabels.delete(groupLabel);
      State.labelsToRemove.delete(groupLabel);

      const otherEl = document.querySelector(
        `.label-item[data-label="${groupLabel}"]`,
      );
      if (otherEl) {
        otherEl.classList.remove("selected", "to-remove");
        if (State.currentLabels.has(groupLabel)) {
          otherEl.classList.add("current");
        }
      }
    }
  });
}

function markCurrentLabelsForRemoval(group, exceptLabel) {
  group.labels.forEach((groupLabel) => {
    if (groupLabel !== exceptLabel && State.currentLabels.has(groupLabel)) {
      State.labelsToRemove.add(groupLabel);

      const otherEl = document.querySelector(
        `.label-item[data-label="${groupLabel}"]`,
      );
      if (otherEl) {
        otherEl.classList.remove("current");
        otherEl.classList.add("to-remove");
      }
    }
  });
}

function updatePreview() {
  const preview = document.querySelector("#label-groups-preview");
  if (preview) {
    preview.textContent = State.getCommandsToApply().text;
  }
}
