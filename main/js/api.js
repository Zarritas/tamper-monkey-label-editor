function getProjectPath() {
  // Extraer el path del proyecto desde la URL
  // Ejemplo: /grupo/proyecto/-/issues/123 -> grupo/proyecto
  const match = globalThis.location.pathname.match(
    /^\/(.+?)\/-\/(issues|merge_requests)/,
  );
  return match ? match[1] : null;
}

function getGitLabBaseUrl() {
  return globalThis.location.origin;
}

function fetchProjectLabels() {
  return new Promise((resolve, reject) => {
    const projectPath = getProjectPath();
    if (!projectPath) {
      console.error("[LabelGroups] No se pudo obtener el path del proyecto");
      resolve([]);
      return;
    }

    const encodedPath = encodeURIComponent(projectPath);
    const baseUrl = getGitLabBaseUrl();
    const url = `${baseUrl}/api/v4/projects/${encodedPath}/labels?per_page=100`;

    console.log("[LabelGroups] Fetching labels from:", url);

    GM_xmlhttpRequest({
      method: "GET",
      url: url,
      headers: {
        Accept: "application/json",
      },
      withCredentials: true, // Usa las cookies de sesión del usuario
      onload: function (response) {
        if (response.status >= 200 && response.status < 300) {
          try {
            const labels = JSON.parse(response.responseText);
            console.log("[LabelGroups] Labels obtenidas:", labels.length);

            resolve(
              labels.map((label) => ({
                name: label.name,
                color: label.color,
                description: label.description || "",
              })),
            );
          } catch (e) {
            console.error("[LabelGroups] Error parsing labels:", e);
            resolve([]);
          }
        } else {
          console.error("[LabelGroups] Error HTTP:", response.status);
          resolve([]);
        }
      },
      onerror: function (error) {
        console.error("[LabelGroups] Error de red:", error);
        resolve([]);
      },
    });
  });
}

// Cache de labels para no hacer peticiones repetidas
let cachedLabels = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

async function getProjectLabels() {
  const now = Date.now();

  if (cachedLabels && now - cacheTimestamp < CACHE_DURATION) {
    return cachedLabels;
  }

  cachedLabels = await fetchProjectLabels();
  cacheTimestamp = now;
  return cachedLabels;
}

function clearLabelsCache() {
  cachedLabels = null;
  cacheTimestamp = 0;
}
