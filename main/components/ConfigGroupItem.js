/**
 * TM Label Editor - ConfigGroupItem Render Function
 * Renders a configuration group item with controls
 * Uses data-attributes for event delegation (handled by parent component)
 */

(function() {
    'use strict';

    /**
     * Render a configuration group item
     * @param {Object} props - Group item properties
     * @param {string} props.name - Group name
     * @param {string} props.color - Group color
     * @param {boolean} props.exclusive - Is exclusive group
     * @param {string[]} props.labels - Labels in the group
     * @param {boolean} [props.isDragOver=false] - Is drag target active
     * @returns {string} HTML string
     */
    function renderConfigGroupItem(props) {
        const { name, color, exclusive, labels, isDragOver = false } = props;

        const labelsContainerClass = isDragOver
            ? 'le-config-group__labels le-config-group__labels--dragover'
            : 'le-config-group__labels';

        const chipsHtml = labels.length > 0
            ? labels.map(label => `
                <div class="le-config-chip">
                    ${label}
                    <button
                        class="le-config-chip__remove"
                        data-remove-label="${label}"
                        data-from-group="${name}"
                        title="Quitar etiqueta">
                        x
                    </button>
                </div>
            `).join('')
            : '<span class="le-status--loading">Arrastra etiquetas aqui</span>';

        return `
            <div class="le-config-group" data-group="${name}">
                <div class="le-config-group__header">
                    <input
                        type="color"
                        class="le-config-group__color"
                        value="${color}"
                        data-color-group="${name}"
                        title="Color del grupo"
                    />
                    <input
                        type="text"
                        class="le-config-group__name"
                        value="${name}"
                        data-name-group="${name}"
                        placeholder="Nombre del grupo"
                    />
                    <label class="le-config-group__exclusive">
                        <input
                            type="checkbox"
                            ${exclusive ? 'checked' : ''}
                            data-exclusive-group="${name}"
                        />
                        Exclusivo
                    </label>
                    <button
                        class="le-btn le-btn--icon le-btn--danger"
                        data-delete-group="${name}"
                        title="Eliminar grupo">
                        -
                    </button>
                </div>
                <div class="${labelsContainerClass}" data-drop-target="${name}">
                    ${chipsHtml}
                </div>
            </div>
        `;
    }

    // ═══════════════════════════════════════════════════════════════
    // EXPORT
    // ═══════════════════════════════════════════════════════════════

    globalThis.renderConfigGroupItem = renderConfigGroupItem;

    if (typeof TM !== 'undefined') {
        TM.renderConfigGroupItem = renderConfigGroupItem;
    }

})();
