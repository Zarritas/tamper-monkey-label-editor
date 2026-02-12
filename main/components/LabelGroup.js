/**
 * TM Label Editor - LabelGroup Render Function
 * Renders a group of labels with selection states
 * Uses data-attributes for event delegation (handled by parent component)
 */

(function() {
    'use strict';

    /**
     * Get CSS classes for a label based on its state
     * @param {string} label - Label name
     * @param {Object} state - State object with Sets
     * @returns {string} CSS class string
     */
    function getLabelClasses(label, state) {
        const { currentLabels, selectedLabels, labelsToRemove } = state;
        const classes = ['le-label'];

        if (currentLabels?.has(label)) classes.push('le-label--current');
        if (selectedLabels?.has(label)) classes.push('le-label--selected');
        if (labelsToRemove?.has(label)) classes.push('le-label--remove');

        return classes.join(' ');
    }

    /**
     * Render a label group
     * @param {Object} props - Group properties
     * @param {string} props.name - Group name
     * @param {string} props.color - Group color
     * @param {boolean} props.exclusive - Is exclusive group
     * @param {string[]} props.labels - Labels in the group
     * @param {Set} props.currentLabels - Currently applied labels
     * @param {Set} props.selectedLabels - Selected labels
     * @param {Set} props.labelsToRemove - Labels marked for removal
     * @returns {string} HTML string
     */
    function renderLabelGroup(props) {
        const { name, color, exclusive, labels, currentLabels, selectedLabels, labelsToRemove } = props;

        const state = { currentLabels, selectedLabels, labelsToRemove };

        const labelsHtml = labels.map(label => `
            <div
                class="${getLabelClasses(label, state)}"
                data-label="${label}"
                data-group="${name}">
                ${label}
            </div>
        `).join('');

        return `
            <div class="le-group" data-group-name="${name}">
                <div class="le-group__header">
                    <span class="le-group__dot" style="background: ${color}"></span>
                    <span class="le-group__name">${name}</span>
                    ${exclusive ? '<span class="le-group__badge">Exclusivo</span>' : ''}
                </div>
                <div class="le-group__items">
                    ${labelsHtml}
                </div>
            </div>
        `;
    }

    // ═══════════════════════════════════════════════════════════════
    // EXPORT
    // ═══════════════════════════════════════════════════════════════

    globalThis.renderLabelGroup = renderLabelGroup;

    if (typeof TM !== 'undefined') {
        TM.renderLabelGroup = renderLabelGroup;
    }

})();
