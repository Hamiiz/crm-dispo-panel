// ==UserScript==
// @name         CRM Multi Timezone + Click-to-Call
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Add CST, PST, AKST, HST with work-hour coloring + call buttons for phone fields + dial buttons for numbers found in call notes
// @match        http://69.10.47.54/*
// @match        *://proxy2.alliancedialer.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // ---------- Timezones ----------

    const timezones = [
        { label: 'CST', tz: 'America/Chicago' },
        { label: 'PST', tz: 'America/Los_Angeles' },
        { label: 'AKST', tz: 'America/Anchorage' },
        { label: 'HST', tz: 'Pacific/Honolulu' }
    ];

    function formatTime(date, tz) {
        return new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: tz
        }).format(date);
    }

    function getHour(date, tz) {
        return new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            hour12: false,
            timeZone: tz
        }).format(date);
    }

    function getColor(hour) {
        return (hour < 9 || hour >= 17) ? 'red' : 'white';
    }

    function injectClocks() {
        const estSpan = document.querySelector('#localclock');
        if (!estSpan) return;
        if (document.getElementById('extra-timezones')) return;

        const container = document.createElement('span');
        container.id = 'extra-timezones';
        container.style.marginLeft = '10px';

        timezones.forEach(tz => {
            const span = document.createElement('span');
            span.id = `tz-${tz.label}`;
            span.style.marginLeft = '8px';
            span.style.fontWeight = 'bold';
            container.appendChild(span);
        });

        estSpan.parentNode.appendChild(container);

        function update() {
            const now = new Date();
            timezones.forEach(tz => {
                const el = document.getElementById(`tz-${tz.label}`);
                const hour = parseInt(getHour(now, tz.tz), 10);
                el.textContent = `${tz.label}: ${formatTime(now, tz.tz)}`;
                el.style.color = getColor(hour);
            });
        }

        update();
        const delay = 60000 - (Date.now() % 60000);
        setTimeout(() => {
            update();
            setInterval(update, 60000);
        }, delay);
    }

    // ---------- Shared dial logic ----------

    function dialNumber(number) {
        // Default behavior: trigger a tel: link, which most softphones/dialers intercept.
        // If your dialer exposes a JS hook (e.g. window.clickToDial(number)) swap the line below.
        if (typeof window.clickToDial === 'function') {
            window.clickToDial(number);
        } else {
            window.location.href = `tel:${number}`;
        }
    }

    function makeCallButton(dialable, { requireDblClick = false } = {}) {
        const btn = document.createElement('button');
        btn.textContent = requireDblClick ? '📞' : 'Call';
        btn.type = 'button';
        btn.title = requireDblClick
            ? `Double-click to dial ${dialable}`
            : `Dial ${dialable}`;
        btn.style.marginLeft = '4px';
        btn.style.fontSize = '0.75em';
        btn.style.padding = requireDblClick ? '0px 4px' : '1px 6px';
        btn.style.cursor = 'pointer';
        btn.style.border = '1px solid #888';
        btn.style.borderRadius = '4px';
        btn.style.background = requireDblClick ? '#1c6dd0' : '#2b8a3e';
        btn.style.color = '#fff';
        btn.style.lineHeight = '1.4';
        btn.style.verticalAlign = 'middle';

        if (requireDblClick) {
            // Prevent stray single clicks from bubbling up into the note's
            // "click to copy" handler, but don't dial on single click.
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
            btn.addEventListener('dblclick', (e) => {
                e.preventDefault();
                e.stopPropagation();
                dialNumber(dialable);
            });
        } else {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                dialNumber(dialable);
            });
        }

        return btn;
    }

    // ---------- Click-to-Call: phone fields (top panel) ----------

    const PHONE_FIELD_IDS = [
        'dialnumberdetails_phone1',
        'dialnumberdetails_phone2',
        'dialnumberdetails_cellphone'
    ];

    function cleanDigits(raw) {
        return (raw || '').replace(/\D/g, '');
    }

    function toDialable(raw) {
        const digits = cleanDigits(raw);
        if (!digits) return null;
        if (digits.length === 10) return '1' + digits;
        if (digits.length === 11 && digits.startsWith('1')) return digits;
        return digits;
    }

    function addFieldCallButton(span) {
        if (!span || span.dataset.callBtnAdded) return;
        const raw = span.textContent.trim();
        if (!raw) return;
        const dialable = toDialable(raw);
        if (!dialable) return;

        const btn = makeCallButton(dialable, { requireDblClick: false });
        span.insertAdjacentElement('afterend', btn);
        span.dataset.callBtnAdded = 'true';
    }

    function injectFieldCallButtons() {
        PHONE_FIELD_IDS.forEach(id => {
            addFieldCallButton(document.getElementById(id));
        });
    }

    // ---------- Click-to-Call: numbers embedded in call-history notes ----------

    // Matches an optional leading "1" followed by 10 digits, not touching other digits.
    const NUMBER_REGEX = /(?<!\d)(1)?(\d{10})(?!\d)/g;

    function toDialableFromMatch(hasLeadingOne, tenDigits) {
        return hasLeadingOne ? '1' + tenDigits : '1' + tenDigits;
        // (both branches prepend "1" to the bare 10-digit number;
        //  if it already had a leading 1 we still just want "1" + the 10 digits)
    }

    function processNoteSpan(span) {
        if (!span || span.dataset.dialProcessed) return;

        const originalText = span.textContent;
        NUMBER_REGEX.lastIndex = 0;

        let match;
        let lastIndex = 0;
        const frag = document.createDocumentFragment();
        let foundAny = false;

        while ((match = NUMBER_REGEX.exec(originalText)) !== null) {
            foundAny = true;
            const [fullMatch, leadingOne, tenDigits] = match;
            const matchStart = match.index;
            const matchEnd = matchStart + fullMatch.length;

            // text before this number
            if (matchStart > lastIndex) {
                frag.appendChild(document.createTextNode(originalText.slice(lastIndex, matchStart)));
            }
            // the number itself, unchanged
            frag.appendChild(document.createTextNode(fullMatch));

            // dial button right after it
            const dialable = toDialableFromMatch(!!leadingOne, tenDigits);
            frag.appendChild(makeCallButton(dialable, { requireDblClick: true }));

            lastIndex = matchEnd;
        }

        if (!foundAny) {
            span.dataset.dialProcessed = 'true';
            return;
        }

        // remaining trailing text
        if (lastIndex < originalText.length) {
            frag.appendChild(document.createTextNode(originalText.slice(lastIndex)));
        }

        span.textContent = '';
        span.appendChild(frag);
        span.dataset.dialProcessed = 'true';
    }

    function injectNoteDialButtons() {
        document
            .querySelectorAll('.tm-note-copyable:not([data-dial-processed])')
            .forEach(processNoteSpan);
    }

    // ---------- Bootstrapping ----------

    function injectAll() {
        injectClocks();
        injectFieldCallButtons();
        injectNoteDialButtons();
    }

    const observer = new MutationObserver(injectAll);
    observer.observe(document.body, { childList: true, subtree: true });

    injectAll();
})();
