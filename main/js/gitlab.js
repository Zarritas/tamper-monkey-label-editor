let savedUserContent = "";

function applyChanges(overlay) {
  const commands = State.getCommandsToApply();
  const statusEl = document.querySelector("#label-groups-status");

  console.log("[LabelGroups] toAdd:", commands.toAdd);
  console.log("[LabelGroups] toRemove:", commands.toRemove);

  if (!commands.hasChanges) {
    overlay.remove();
    return;
  }

  console.log("[LabelGroups] Commands:", commands.text);

  if (statusEl) {
    statusEl.innerHTML =
      '<div class="label-groups-loading">⏳ Aplicando cambios...</div>';
  }

  const switchBtn = document.querySelector(
    '[data-testid="editing-mode-switcher"]',
  );
  const isRichTextMode = switchBtn?.textContent
    .toLowerCase()
    .includes("plain text");

  if (isRichTextMode) {
    console.log("[LabelGroups] Switching to plain text mode");
    switchBtn.click();
    setTimeout(() => {
      saveUserContent();
      insertAndSubmit(commands.text, overlay, true);
    }, 300);
  } else {
    saveUserContent();
    insertAndSubmit(commands.text, overlay, false);
  }
}

function saveUserContent() {
  const textarea = findVisibleTextarea();
  if (textarea?.value.trim()) {
    savedUserContent = textarea.value.trim();
    console.log("[LabelGroups] Saved user content:", savedUserContent);
  } else {
    savedUserContent = "";
  }
}

function insertAndSubmit(commentText, overlay, switchBackToRich) {
  const textarea = findVisibleTextarea();

  if (textarea) {
    textarea.focus();
    textarea.value = commentText;
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    textarea.dispatchEvent(new Event("change", { bubbles: true }));

    console.log("[LabelGroups] Textarea value:", textarea.value);

    setTimeout(() => {
      submitComment(() => {
        restoreUserContent(switchBackToRich);
      });
    }, 200);

    textarea.scrollIntoView({ behavior: "smooth", block: "center" });
    overlay.remove();
  } else {
    console.log("[LabelGroups] No textarea found");
    copyToClipboardFallback(commentText);
    overlay.remove();
  }
}

function findVisibleTextarea() {
  const selectors = [
    "textarea#note-body",
    "textarea.note-textarea",
    'textarea[data-testid="comment-field"]',
    "textarea.js-note-text",
    "#note_note",
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        console.log("[LabelGroups] Found textarea:", selector);
        return el;
      }
    }
  }
  return null;
}

function submitComment(onComplete) {
  const submitBtn = document.querySelector(
    '.js-comment-submit-button button[type="submit"]',
  );
  console.log("[LabelGroups] Submit button disabled:", submitBtn?.disabled);

  if (submitBtn) {
    if (submitBtn.disabled) {
      submitBtn.removeAttribute("disabled");
      submitBtn.classList.remove("disabled");
    }
    submitBtn.click();

    setTimeout(onComplete, 500);
  }
}

function restoreUserContent(switchBackToRich) {
  if (savedUserContent) {
    console.log("[LabelGroups] Restoring user content:", savedUserContent);

    // Esperar a que el textarea esté listo después del submit
    setTimeout(() => {
      const textarea = findVisibleTextarea();
      if (textarea) {
        textarea.focus();
        textarea.value = savedUserContent;
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
        textarea.dispatchEvent(new Event("change", { bubbles: true }));
      }

      savedUserContent = "";

      if (switchBackToRich) {
        setTimeout(switchToRichText, 300);
      }
    }, 300);
  } else if (switchBackToRich) {
    setTimeout(switchToRichText, 300);
  }
}

function switchToRichText() {
  const switchBtn = document.querySelector(
    '[data-testid="editing-mode-switcher"]',
  );
  if (switchBtn?.textContent.toLowerCase().includes("rich text")) {
    console.log("[LabelGroups] Switching back to rich text mode");
    switchBtn.click();
  }
}

function copyToClipboardFallback(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert("Texto copiado al portapapeles:\n\n" + text);
  });
}
