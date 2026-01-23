const DEFAULT_LABEL_GROUPS = {};

function getProjectName() {
  // Extraer el nombre del proyecto de la URL
  // Ejemplo: /odoo-16/fl-v16/-/issues/7859 -> fl-v16
  const match = globalThis.location.pathname.match(
    /^\/(?:.+\/)?([^/]+)\/-\/(issues|merge_requests)/,
  );
  return match ? match[1] : "default";
}

function getStorageKey() {
  const projectName = getProjectName();
  return `labelGroups_${projectName}`;
}

function getLabelGroups() {
  const key = getStorageKey();
  const saved = GM_getValue(key, null);

  if (saved) {
    try {
      console.log("[LabelGroups] Loaded config for project:", getProjectName());
      return JSON.parse(saved);
    } catch (e) {
      console.error("[LabelGroups] Error parsing saved config:", e);
    }
  }

  return DEFAULT_LABEL_GROUPS;
}

function saveLabelGroups(groups) {
  const key = getStorageKey();
  GM_setValue(key, JSON.stringify(groups));
  console.log("[LabelGroups] Saved config for project:", getProjectName());
}

function getGroupForLabel(label) {
  const groups = getLabelGroups();
  for (const [groupName, group] of Object.entries(groups)) {
    if (group.labels.includes(label)) {
      return {
        name: groupName,
        labels: group.labels,
        exclusive: group.exclusive !== false,
      };
    }
  }
  return null;
}

function getCurrentProjectName() {
  return getProjectName();
}
