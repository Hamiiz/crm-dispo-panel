// ==UserScript==
// @name         CRM Panel (Enhanced UI)
// @namespace    http://tampermonkey.net/
// @version      2025-11-14
// @description  CRM helper with Synced Theme Colors and Expanded Palette
// @author       Hamza
// @match        *://69.10.47.54/*
// @match        *://proxy2.alliancedialer.com/*
// @grant        GM_setClipboard
// ==/UserScript==

(function () {
    'use strict';

    const fieldIDs = {
        disposition: 'dialer_disposition',
        note: 'dialer_notes',
        saveButton: 'save_disposition',
        finishButton: 'end_call'
    };

    const THEMES = {
        cyber: { name: 'Cyber', primary: '#bc13fe', gradient: 'linear-gradient(135deg, #2b1055, #7597de)' },
        frost: { name: 'Frost', primary: '#00d2ff', gradient: 'linear-gradient(135deg, #00d2ff, #3a7bd5)' },
        lava: { name: 'Lava', primary: '#ff4b2b', gradient: 'linear-gradient(135deg, #ff416c, #ff4b2b)' },
        forest: { name: 'Forest', primary: '#27ae60', gradient: 'linear-gradient(135deg, #11998e, #38ef7d)' },
        midnight: { name: 'Midnight', primary: '#9d50bb', gradient: 'linear-gradient(135deg, #6e48aa, #9d50bb)' },
           lava: { name: 'Lava', primary: '#b71c1c', gradient: 'linear-gradient(135deg, #eb3349, #f45c43)' },
        void: { name: 'Void', primary: '#212121', gradient: 'linear-gradient(135deg, #000000, #434343)' }
    };

    let savedKey = localStorage.getItem('tm-theme-key') || 'cyber';
    const currentTheme = THEMES[savedKey] || THEMES.cyber;
    const DISPOSITIONS = {
        "No answer": { value: 12, notes: ["continuous ringing", "dead air", "call dropped"] },
        "Machine answer":{value:11,notes:["Quick Disposition"]},
        "Unidentified Hang Up": { value: 105, notes: ["Tp hu after saying hello","Tp hung up after hearing the funds name", "TP hung up before reason for the call", "TP hung up before confirming the address"] },
        "Left Message With Third Party": { value: 9, notes: ["left message without tfn","tp said not interested and hu","left toll-free number with TP", "TP hung up after hearing the reason"] },
        "Machine answer":{value:11,notes:["Quick Disposition"]},
        "Call Intercept": { value: 2, notes: ["Virtual Assistant did not connect","Ads","Nomo Robo","number barn", "IVR", "Number not accepting calls","number has been blocked"] },
        "Operator Tritone": { value: 14, notes: ["number not in service", "number has been disconnected"] },
        "DNC by tp": { value: 119, notes: ["TP said 'do not call me'", "TP requested to be removed from list"] },
        "DNC by SH": { value: 4, notes: ["SH asked not to be called", "sh requested to be removed from the list"] },
        "Hang Up by contact":{value:6,notes:["sh hu after hearing the funds name", "sh hu before hearing the reason of the call"]},
        "Undecided sh not sure": { value: 27, notes: ["requested call back","sh is busy","sh wants to review the materials","sh wants to think about it", "sh hu after hearing the reason of the call"]},
        "Not interested": { value: 13, notes: ["sh is not interested in voting", "Doesn't want to vote over phone","sh hu after saying he wants to vote"] },
        "Undecided sh waiting for an fa": { value: 26, notes: ["waiting for FA","SH waiting for significant other"] },
        "Will Vote": { value: 30, notes: ["will return the proxy","sh will vote online"] },
        "Wrong Number": { value: 31, notes: [""]}
        };



    const IB_Dispos = {
        "Sh called in": { value: 20, notes: [""] },
        "Endeavour": { value: 61, notes: [""] },
        "Directory": { value: 155, notes: [""] },
        "Nahha": { value: null, notes: [" // nahha"] },
        "Copy AHHA": { value: null, notes: ["Ahha "] }
    };

    const style = document.createElement('style');
    style.textContent = `
    :root { --tm-primary-color: ${currentTheme.primary}; --tm-header-bg: ${currentTheme.gradient}; }
    #tm-dispo-panel {
        position: fixed; bottom: 20px; right: 20px; background: #fff; border: 1px solid #e0e0e0;
        border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.2); width: 280px; z-index: 99999;
        resize: both; overflow: hidden; max-height: 90vh; font-family: 'Segoe UI', Tahoma, sans-serif;
    }
    #tm-dispo-panel .tm-header {
        margin: 0; background: var(--tm-header-bg); color: white; padding: 12px;
        text-align: center; border-radius: 12px 12px 0 0; font-size: 0.85rem; cursor: move;
        user-select: none; letter-spacing: 1px; font-weight: 700; text-transform: uppercase;
        transition: background 0.4s ease; text-shadow: 1px 1px 3px rgba(0,0,0,0.3);
    }
    #tm-tabs { display: flex; background: #f5f5f5; border-bottom: 1px solid #ddd; }
    .tm-tab { flex: 1; padding: 8px 0; text-align: center; background: #e0e0e0; border: none; cursor: pointer; font-size: 0.75rem; font-weight: 600; color: #666; transition: 0.2s; }
    .tm-tab.active { background: var(--tm-primary-color); color: white; }
    #tm-button-container { display: flex; flex-wrap: wrap; overflow-y: auto; margin: 0.5rem; gap: 5px; height: 35vh; scrollbar-width: thin; }
    #tm-button-container h4 { width: 100%; margin: 8px 0 4px; color: #333; font-size: 0.75rem; border-left: 4px solid var(--tm-primary-color); padding-left: 6px; }
    #tm-button-container button, #IbCont button { flex: 1 1 auto; background: #fff; border: 1px solid #eee; border-radius: 6px; padding: 5px 8px; font-size: 0.72rem; cursor: pointer; transition: 0.1s; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    #tm-button-container button:active, #IbCont button:active, #tm-quick-container button:active { transform: scale(0.94); }
    #tm-button-container button:hover { border-color: var(--tm-primary-color); color: var(--tm-primary-color); background: #fdfdfd; }
    #tm-quick-container { display: flex; flex-wrap: wrap; justify-content: center; gap: 5px; border-top: 1px solid #ddd; padding: 10px 0; background: #fafafa; }
    #tm-quick-container button { flex: 1 1 40%; background: var(--tm-primary-color); color: white; border: none; border-radius: 6px; padding: 6px 0; cursor: pointer; font-weight: 600; font-size: 0.75rem; transition: filter 0.2s; }
    #tm-quick-container button:hover { filter: brightness(1.1); }
    #tm-theme-picker { display: flex; justify-content: center; gap: 6px; margin: 8px 0; width: 100%; }
    .tm-theme-dot { width: 18px; height: 18px; border-radius: 50%; cursor: pointer; border: 2px solid white; box-shadow: 0 0 3px rgba(0,0,0,0.2); transition: transform 0.2s; }
    .tm-theme-dot:hover { transform: scale(1.2); }
    .tab-content { display: none; padding-top: 5px; }
    .tab-content.active { display: flex; flex-wrap: wrap; }
    #tm-extentionNo { display: block; cursor: pointer; margin-top: 4px; font-size: 10px; font-weight: normal; background: rgba(0,0,0,0.2); border-radius: 4px; padding: 2px 6px; width: fit-content; margin-left: auto; margin-right: auto; }
    `;
    document.head.appendChild(style);

    const panel = document.createElement('div');
    panel.id = 'tm-dispo-panel';
    panel.innerHTML = `
    <div class='tm-header'>Dispo Panel <span id="tm-extentionNo">Ext: --</span></div>
    <div id="tm-tabs"><button class="tm-tab active" data-tab="dialer">Dialer</button><button class="tm-tab" data-tab="ib">IB</button></div>
    <div id="tm-tab-contents">
        <div class="tab-content active" id="dialer-tab"><div id="tm-button-container"></div></div>
        <div class="tab-content" id="ib-tab"><div id="IbCont"></div></div>
    </div>
    <div id="tm-quick-container">
        <button id="tm-call-finish">Finish</button><button id="tm-quick-am">Ans Mach</button>
        <button id="tm-quick-fax">Fax</button>
        <button id="tm-save" >Save</button>
        <button id="tm-dupl">duplicate</button>

        <div id="tm-theme-picker"></div>
        <label style="font-size: 10px; color: #666; width: 100%; text-align: center; cursor:pointer; padding-bottom: 5px;">
            <input type="checkbox" id="tm-append-mode"> Append Notes Mode
        </label>
    </div>
    `;
    document.body.appendChild(panel);

    let extNo = localStorage.getItem('tm-ext-no') || "";
    const agentNameEl = document.querySelector('.sidebar-nav .user_side h5');
    if (agentNameEl) {
        const match = agentNameEl.textContent.match(/\((\d+)\)/);
        if (match) { extNo = match[1]; localStorage.setItem('tm-ext-no', extNo); }
    }
    const extDisplay = panel.querySelector('#tm-extentionNo');
    if (extNo) { extDisplay.textContent = "Ext: " + extNo; extDisplay.onclick = () => GM_setClipboard(extNo); }

    const appendCheck = document.getElementById('tm-append-mode');
    appendCheck.checked = localStorage.getItem('tm-append-state') === 'true';
    appendCheck.onchange = () => localStorage.setItem('tm-append-state', appendCheck.checked);

    const updateNotes = (newNote) => {
        const noteField = document.getElementById(fieldIDs.note);
        if (!noteField) return;
        if (appendCheck.checked && noteField.value.trim().length > 0) {
            noteField.value += " // " + newNote;
        } else { noteField.value = newNote; }
        noteField.focus();
    };

    const saveSize = () => {
        localStorage.setItem('tm-panel-size', JSON.stringify({ width: panel.offsetWidth, height: panel.offsetHeight }));
    };
    new ResizeObserver(saveSize).observe(panel);

    const lastPos = JSON.parse(localStorage.getItem('tm-panel-position') || '{}');
    const lastSize = JSON.parse(localStorage.getItem('tm-panel-size') || '{}');
    if(lastPos.left) Object.assign(panel.style, {left: lastPos.left+'px', top: lastPos.top+'px', right: 'auto', bottom: 'auto'});
    if(lastSize.width) Object.assign(panel.style, {width: lastSize.width+'px', height: lastSize.height+'px'});

    const themePicker = panel.querySelector('#tm-theme-picker');
    Object.keys(THEMES).forEach(key => {
        const dot = document.createElement('div');
        dot.className = 'tm-theme-dot';
        dot.style.background = THEMES[key].gradient;
        dot.onclick = () => {
            document.documentElement.style.setProperty('--tm-primary-color', THEMES[key].primary);
            document.documentElement.style.setProperty('--tm-header-bg', THEMES[key].gradient);
            localStorage.setItem('tm-theme-key', key);
        };
        themePicker.appendChild(dot);
    });
document.addEventListener('keydown', (e) => { if (e.key ==="Tab") { e.preventDefault(); document.getElementById('tm-quick-am').click(); } });
    const buttonContainer = panel.querySelector('#tm-button-container');
    Object.entries(DISPOSITIONS).forEach(([dispo, { value, notes }]) => {
        const groupLabel = document.createElement('h4');
        groupLabel.textContent = dispo;
        buttonContainer.appendChild(groupLabel);
        notes.forEach(note => {
            const btn = document.createElement('button');
            btn.textContent = note;
            btn.onclick = () => {
                const df = document.getElementById(fieldIDs.disposition);
                if (df) df.value = value;
                updateNotes(note);
            };
            buttonContainer.appendChild(btn);
        });
    });

    const ibCont = panel.querySelector('#IbCont');
    Object.entries(IB_Dispos).forEach(([dispo, { value, notes }]) => {
        notes.forEach(note => {
            const btn = document.createElement('button');
            btn.textContent = dispo;
            btn.onclick = () => {
                if (dispo === "Copy AHHA") {
                    const ctrls = [...document.querySelectorAll('#search_result_table tbody tr')].map(r => r.cells[1]?.textContent?.trim()).filter(Boolean);
                    GM_setClipboard(ctrls.join(" // "));
                } else {
                    const df = document.getElementById(fieldIDs.disposition);
                    if (df && value) df.value = value;
                    updateNotes(note || dispo);
                }
            };
            ibCont.appendChild(btn);
        });
    });

    const tabs = panel.querySelectorAll('.tm-tab');
    tabs.forEach(t => t.onclick = () => {
        tabs.forEach(x => x.classList.remove('active')); t.classList.add('active');
        panel.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === t.dataset.tab + '-tab'));
    });

    const safeClick = (idList) => { for (let id of idList) { const el = document.getElementById(id); if (el) { el.click(); return; } } };
    panel.querySelector('#tm-save').onclick = () => safeClick(['save_disposition_all', fieldIDs.saveButton]);
    panel.querySelector('#tm-quick-am').onclick = () => safeClick(['end_call_am']);
    panel.querySelector('#tm-call-finish').onclick = () => safeClick([fieldIDs.finishButton]);
    panel.querySelector('#tm-quick-fax').onclick = () => safeClick(['end_call_fm']);
    panel.querySelector('#tm-dupl').onclick = () => window.open(window.location.href, '_blank');

    let isDragging = false, ox, oy;
    panel.querySelector('.tm-header').onmousedown = (e) => { isDragging = true; ox = e.clientX - panel.offsetLeft; oy = e.clientY - panel.offsetTop; };
    document.onmouseup = () => { if(isDragging) localStorage.setItem('tm-panel-position', JSON.stringify({left: panel.offsetLeft, top: panel.offsetTop})); isDragging = false; };
    document.onmousemove = (e) => { if(isDragging) { panel.style.left = e.clientX - ox + 'px'; panel.style.top = e.clientY - oy + 'px'; panel.style.right = 'auto'; panel.style.bottom = 'auto'; } };



})();
