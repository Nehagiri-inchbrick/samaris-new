/**
 * Lightweight Lucide replacement using local SVG sprite (icons.svg).
 * Injects the sprite into the page so <use href="#icon-…"> works in all browsers.
 */
(function () {
    const ALIASES = {
        'check-circle': 'circle-check',
        train: 'train-front',
    };

    let injectPromise = null;

    function iconId(name) {
        const key = ALIASES[name] || name;
        return `icon-${key}`;
    }

    function hasSprite() {
        return !!document.querySelector('symbol[id^="icon-"]');
    }

    function ensureSprite() {
        if (hasSprite()) return Promise.resolve();
        if (injectPromise) return injectPromise;

        injectPromise = fetch('icons.svg', { credentials: 'same-origin' })
            .then((res) => {
                if (!res.ok) throw new Error(`icons.svg HTTP ${res.status}`);
                return res.text();
            })
            .then((html) => {
                if (hasSprite()) return;
                const tpl = document.createElement('template');
                tpl.innerHTML = html.trim();
                const sprite = tpl.content.firstElementChild;
                if (!sprite) return;
                sprite.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
                sprite.setAttribute('aria-hidden', 'true');
                document.body.insertBefore(sprite, document.body.firstChild);
            })
            .catch((err) => {
                console.warn('Icon sprite failed to load:', err);
            });

        return injectPromise;
    }

    function createIconElement(name, sourceEl) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        const extraClass = sourceEl && sourceEl.getAttribute('class');
        svg.setAttribute('class', extraClass ? `${extraClass} icon` : 'icon');
        svg.setAttribute('aria-hidden', 'true');
        const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        use.setAttribute('href', `#${iconId(name)}`);
        svg.appendChild(use);
        return svg;
    }

    function renderIcons(root) {
        const scope = root && root.querySelectorAll ? root : document;
        scope.querySelectorAll('[data-lucide]').forEach((el) => {
            const name = el.getAttribute('data-lucide');
            if (!name) return;
            el.replaceWith(createIconElement(name, el));
        });
    }

    function createIcons(root) {
        return ensureSprite().then(() => renderIcons(root));
    }

    window.createIcons = createIcons;
})();
