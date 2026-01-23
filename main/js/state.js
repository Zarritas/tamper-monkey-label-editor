const State = {
  selectedLabels: new Set(),
  labelsToRemove: new Set(),
  currentLabels: new Set(),
  button: null,

  clear() {
    this.selectedLabels.clear();
    this.labelsToRemove.clear();
  },

  loadCurrentLabels() {
    this.currentLabels.clear();
    const selectors =
      '[data-testid="sidebar-labels"] .gl-label-text, .issuable-show-labels .gl-label-text';
    document.querySelectorAll(selectors).forEach((el) => {
      this.currentLabels.add(el.textContent.trim());
    });
    return this.currentLabels;
  },

  getCommandsToApply() {
    const toAdd = [...this.selectedLabels].filter(
      (l) => !this.currentLabels.has(l),
    );
    const toRemove = [...this.labelsToRemove];

    const commands = [];
    if (toAdd.length > 0) {
      commands.push("/label " + toAdd.map((l) => '~"' + l + '"').join(" "));
    }
    if (toRemove.length > 0) {
      commands.push(
        "/unlabel " + toRemove.map((l) => '~"' + l + '"').join(" "),
      );
    }

    return {
      toAdd,
      toRemove,
      text: commands.join("\n"),
      hasChanges: toAdd.length > 0 || toRemove.length > 0,
    };
  },
};
