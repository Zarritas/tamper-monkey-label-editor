/**
 * Label Groups - Utility Functions
 */

const Utils = (function() {
    'use strict';

    function deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        try {
            return structuredClone(obj);
        } catch {
            return JSON.parse(JSON.stringify(obj));
        }
    }

    function classNames(...args) {
        return args.filter(Boolean).join(' ');
    }

    function escapeHtml(str) {
        if (typeof str !== 'string') return '';
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return str.replace(/[&<>"']/g, c => map[c]);
    }

    function waitForElement(selector, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const el = document.querySelector(selector);
            if (el) return resolve(el);

            const observer = new MutationObserver(() => {
                const found = document.querySelector(selector);
                if (found) {
                    observer.disconnect();
                    clearTimeout(timer);
                    resolve(found);
                }
            });

            const timer = setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element "${selector}" not found after ${timeout}ms`));
            }, timeout);

            observer.observe(document.body, { childList: true, subtree: true });
        });
    }

    function debounce(fn, delay) {
        let timer;
        return function(...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    return { deepClone, classNames, escapeHtml, waitForElement, debounce };
})();

window.Utils = Utils;
