// ==UserScript==
// @name         TOPLIST Panel (Enhanced UI)
// @namespace    http://tampermonkey.net/
// @version      2025-11-14
// @description  CRM helper with Synced Theme Colors and Expanded Palette
// @author       Hamza
// @match        *://69.10.47.54/*
// @match        *://proxy2.alliancedialer.com/*
// @grant        GM_setClipboard
// ==/UserScript==

(function () {

    const TL_fieldIDs = {
        disposition: 'dialer_disposition',
        note: 'dialer_notes'
    };

    const TL_DISPOSITIONS = {
        "Directory Assistance": 40,
        "No New Number Found": 164,
        "Directory Assistance Phone Added": 155,
        "LVM": 8
    };

    const tlPanel = document.createElement('div');
    tlPanel.id = 'tm-toplist-panel';
    tlPanel.innerHTML = `
    <div class='tm-header'>Toplist Panel</div>
    <div id="tl-container"></div>
    `;

    const tlStyle = document.createElement('style');
    tlStyle.textContent = `
    #tm-toplist-panel {
        position: fixed; bottom: 20px; left: 20px; background: #fff;
        border: 1px solid #e0e0e0; border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.2); width: 220px;
        z-index: 99999; font-family: 'Segoe UI', Tahoma, sans-serif;
    }
    #tm-toplist-panel .tm-header {
        background: var(--tm-header-bg); color: white; padding: 10px;
        text-align: center; border-radius: 12px 12px 0 0;
        font-size: 0.8rem; cursor: move; font-weight: 700;
    }
    #tl-container { display: flex; flex-direction: column; gap: 6px; padding: 10px; }
    #tl-container button {
        background: #fff; border: 1px solid #ddd; border-radius: 6px;
        padding: 6px; font-size: 0.75rem; cursor: pointer; transition: 0.2s;
    }
    #tl-container button:hover { border-color: var(--tm-primary-color); color: var(--tm-primary-color); }
    #tl-adv-search {
        background: var(--tm-primary-color) !important;
        color: white !important;
        border-color: transparent !important;
        font-weight: 600;
    }
    #tl-adv-search:hover { filter: brightness(1.1); color: white !important; }
    #tl-adv-search.tl-flash-ok  { background: #27ae60 !important; }
    #tl-adv-search.tl-flash-err { background: #e74c3c !important; }
    #tl-no-notes-label { font-size: 10px; color: #666; text-align: center; cursor: pointer; padding-bottom: 6px; }
    `;
    document.head.appendChild(tlStyle);
    document.body.appendChild(tlPanel);

    const tlContainer = tlPanel.querySelector('#tl-container');

    // --- Helper: insert "LVM" before the LAST run of slash(es) in a note. ---
    // Scans from the end of the string for "/" or "//", finds the final
    // (rightmost) run of consecutive slashes, and inserts "LVM" right
    // before it, with clean single-space padding on both sides.
    // If no slash exists anywhere in the note, "LVM" is simply appended.
    function insertLVM(current) {
        current = current || '';

        // Rightmost run of one-or-more slashes: a slash run with no
        // other slash appearing anywhere after it in the string.
        const match = current.match(/\/+(?!.*\/)/);

        if (!match) {
            // No slash at all -> just append
            return current.trim() ? current.trim() + ' LVM' : 'LVM';
        }

        const idx = match.index;
        let prefix = current.slice(0, idx).replace(/\s+$/, ''); // strip trailing spaces
        const suffix = current.slice(idx); // starts with the slash run, unchanged

        return (prefix ? prefix + ' ' : '') + 'LVM ' + suffix;
    }

    // --- Dispo buttons ---
    Object.entries(TL_DISPOSITIONS).forEach(([label, value]) => {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.onclick = () => {
            const df = document.getElementById(TL_fieldIDs.disposition);
            if (df) df.value = value;

            // Only the LVM button ever touches the note field. All other
            // dispositions leave the note field completely untouched,
            // regardless of the "No Notes Mode" toggle state.
            if (label === 'LVM' && localStorage.getItem('tm-no-notes-state') !== 'true') {
                const noteField = document.getElementById(TL_fieldIDs.note);
                if (noteField) {
                    const newValue = insertLVM(noteField.value);
                    console.log('[TL] Setting note field. Old:', JSON.stringify(noteField.value), 'New:', JSON.stringify(newValue));
                    noteField.value = newValue;
                    // Notify any listeners on the page that the field changed
                    // (mirrors what the Advanced Search button does for zip/address)
                    noteField.dispatchEvent(new Event('input', { bubbles: true }));
                    noteField.dispatchEvent(new Event('change', { bubbles: true }));
                    noteField.focus();
                } else {
                    console.warn('[TL] Note field not found:', TL_fieldIDs.note);
                }
            } else if (label === 'LVM') {
                console.log('[TL] Skipped note field — "No Notes Mode" is ON.');
            }
        };
        tlContainer.appendChild(btn);
    });

    // --- Advanced Search button ---
    const advBtn = document.createElement('button');
    advBtn.id = 'tl-adv-search';
    advBtn.textContent = '🔍 Advanced Search';

    const flashBtn = (ok) => {
        advBtn.classList.add(ok ? 'tl-flash-ok' : 'tl-flash-err');
        setTimeout(() => advBtn.classList.remove('tl-flash-ok', 'tl-flash-err'), 700);
    };

    advBtn.onclick = async () => {
        let text = '';
        try {
            text = await navigator.clipboard.readText();
        } catch (e) {
            console.warn('[TL] Clipboard read failed:', e);
            flashBtn(false);
            return;
        }

        if (!text.trim()) {
            console.warn('[TL] Clipboard is empty');
            flashBtn(false);
            return;
        }

        // --- Parse zip: first 5-digit block (ignore the trailing -XXXX if present) ---
        // --- Parse zip: 5-digit number preceded by a 2-letter state abbreviation ---
        const zipMatch = text.match(/\b[A-Z]{2}\s+(\d{5})(?:-\d{4})?\b/);
        const zip = zipMatch ? zipMatch[1] : null;
        // --- Parse street address: leading house number + street name ---
        // Strips anything from a comma, or a known city/state boundary onward.
        // Works on formats like:
        //   "123 Main St, Detroit, MI 48201"
        //   "123 Main Street Detroit MI 48201-4567"
        //   "123 N. Oak Ave Apt 4B, Springfield IL"
        // --- Parse street number only (first standalone number at the start) ---
        const poMatch = text.trim().match(/^(P\.?\s*O\.?\s*BOX\s+\d+)/i);
        const addrMatch = !poMatch && text.trim().match(/^([NSEW]\d+[NSEW]\d+|\d+)\b/i);
        const address = poMatch ? poMatch[1].trim() : (addrMatch ? addrMatch[1] : null);
        // Fill fields and trigger search
        let filled = false;

        const zipField = document.getElementById('search_zip');
        if (zip && zipField) {
            zipField.value = zip;
            zipField.dispatchEvent(new Event('input', { bubbles: true }));
            filled = true;
        } else if (!zip) {
            console.warn('[TL] Could not parse zip from:', text);
        }

        const addrField = document.getElementById('search_address');
        if (address && addrField) {
            addrField.value = address;
            addrField.dispatchEvent(new Event('input', { bubbles: true }));
            filled = true;
        } else if (!address) {
            console.warn('[TL] Could not parse address from:', text);
        }

        if (filled) {
            // Small delay so any CRM listeners can process the field values first
            setTimeout(() => {
                const searchBtn = document.getElementById('search_search');
                if (searchBtn) searchBtn.click();
            }, 80);
            flashBtn(true);
        } else {
            flashBtn(false);
        }
    };

    tlContainer.appendChild(advBtn);

    // --- No Notes Mode toggle (shared key with CRM panel) ---
    const noNotesLabel = document.createElement('label');
    noNotesLabel.id = 'tl-no-notes-label';
    const noNotesCheck = document.createElement('input');
    noNotesCheck.type = 'checkbox';
    noNotesCheck.checked = localStorage.getItem('tm-no-notes-state') === 'true';
    noNotesCheck.onchange = () => localStorage.setItem('tm-no-notes-state', noNotesCheck.checked);
    noNotesLabel.appendChild(noNotesCheck);
    noNotesLabel.appendChild(document.createTextNode(' No Notes Mode'));
    tlContainer.appendChild(noNotesLabel);

    // --- Dragging ---
    let isDragging = false, ox, oy;
    tlPanel.querySelector('.tm-header').onmousedown = (e) => {
        isDragging = true;
        ox = e.clientX - tlPanel.offsetLeft;
        oy = e.clientY - tlPanel.offsetTop;
    };
    document.addEventListener('mouseup', () => {
        if (isDragging) localStorage.setItem('tl-panel-pos', JSON.stringify({ left: tlPanel.offsetLeft, top: tlPanel.offsetTop }));
        isDragging = false;
    });
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            tlPanel.style.left = e.clientX - ox + 'px';
            tlPanel.style.top = e.clientY - oy + 'px';
            tlPanel.style.right = 'auto';
            tlPanel.style.bottom = 'auto';
        }
    });

    const tlPos = JSON.parse(localStorage.getItem('tl-panel-pos') || '{}');
    if (tlPos.left) {
        tlPanel.style.left = tlPos.left + 'px';
        tlPanel.style.top = tlPos.top + 'px';
        tlPanel.style.right = 'auto';
        tlPanel.style.bottom = 'auto';
    }

})();
