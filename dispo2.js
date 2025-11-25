// ==UserScript==
// @name         CRM Panel (Always-On-Top Floating)
// @namespace    http://tampermonkey.net/
// @version      2025-11-09
// @description  CRM helper with always-visible panel
// @author       Hamza
// @match        *://69.10.47.54/*
// @match        *://proxy2.alliancedialer.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function () {
    'use strict';

    // Create a truly isolated panel that stays on top
    const createFloatingPanel = () => {
        const iframe = document.createElement('iframe');
        iframe.id = 'crm-floating-panel';
        iframe.style.cssText = `
            position: fixed !important;
            top: 50px !important;
            right: 20px !important;
            width: 320px !important;
            height: 500px !important;
            border: none !important;
            border-radius: 12px !important;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3) !important;
            z-index: 2147483647 !important; /* Maximum z-index */
            background: white !important;
            resize: both !important;
            overflow: hidden !important;
        `;

        // Create the HTML content for the iframe
        const panelHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { 
                        margin: 0; 
                        padding: 15px;
                        font-family: 'Inter', sans-serif;
                        background: white;
                        height: 100vh;
                        overflow-y: auto;
                    }
                    .header { 
                        background: linear-gradient(135deg, #2e7d32, #43a047);
                        color: white;
                        padding: 12px;
                        margin: -15px -15px 15px -15px;
                        border-radius: 0;
                        cursor: move;
                        user-select: none;
                    }
                    .search-box {
                        width: 100%;
                        padding: 8px;
                        margin: 10px 0;
                        border: 1px solid #ccc;
                        border-radius: 6px;
                        box-sizing: border-box;
                    }
                    .dispo-group {
                        margin: 15px 0;
                    }
                    .group-label {
                        font-weight: bold;
                        color: #2e7d32;
                        margin: 8px 0;
                        border-left: 3px solid #2e7d32;
                        padding-left: 8px;
                    }
                    .dispo-button {
                        width: 100%;
                        background: #f8f9fa;
                        border: 1px solid #dee2e6;
                        border-radius: 6px;
                        padding: 8px 12px;
                        margin: 3px 0;
                        cursor: pointer;
                        text-align: left;
                        font-size: 0.8rem;
                        transition: all 0.2s;
                    }
                    .dispo-button:hover {
                        background: #e9ecef;
                        border-color: #2e7d32;
                    }
                    .action-button {
                        width: 100%;
                        background: #2e7d32;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        padding: 10px;
                        margin: 5px 0;
                        cursor: pointer;
                        font-weight: bold;
                    }
                    .action-button:hover {
                        background: #1b5e20;
                    }
                    .controls {
                        position: sticky;
                        bottom: 0;
                        background: white;
                        padding: 10px 0;
                        border-top: 1px solid #eee;
                        margin: 0 -15px;
                        padding: 10px 15px;
                    }
                </style>
            </head>
            <body>
                <div class="header">CRM Disposition Panel</div>
                
                <input type="text" class="search-box" placeholder="Search dispositions..." id="searchInput">
                
                <div id="buttonContainer"></div>
                
                <div class="controls">
                    <button class="action-button" id="saveBtn">💾 Save</button>
                    <button class="action-button" id="finishBtn">📞 Finish Call</button>
                    <button class="action-button" id="machineBtn">🤖 Answering Machine</button>
                    <button class="action-button" id="duplicateBtn">⎘ Duplicate Tab</button>
                    <button class="action-button" id="minimizeBtn">➖ Minimize</button>
                </div>

                <script>
                    const DISPOSITIONS = ${JSON.stringify(DISPOSITIONS)};
                    const IB_DISPOSITIONS = ${JSON.stringify(IB_Dispos)};

                    // Populate buttons
                    function populateButtons() {
                        const container = document.getElementById('buttonContainer');
                        container.innerHTML = '';

                        // Main dispositions
                        Object.entries(DISPOSITIONS).forEach(([dispo, { value, notes }]) => {
                            const groupDiv = document.createElement('div');
                            groupDiv.className = 'dispo-group';
                            
                            const label = document.createElement('div');
                            label.className = 'group-label';
                            label.textContent = dispo;
                            groupDiv.appendChild(label);

                            notes.forEach(note => {
                                const btn = document.createElement('button');
                                btn.className = 'dispo-button';
                                btn.textContent = note;
                                btn.onclick = () => {
                                    window.parent.postMessage({
                                        type: 'APPLY_DISPOSITION',
                                        value: value,
                                        note: note
                                    }, '*');
                                };
                                groupDiv.appendChild(btn);
                            });
                            
                            container.appendChild(groupDiv);
                        });

                        // Search functionality
                        document.getElementById('searchInput').addEventListener('input', function(e) {
                            const searchTerm = e.target.value.toLowerCase();
                            const buttons = document.querySelectorAll('.dispo-button');
                            const groups = document.querySelectorAll('.dispo-group');
                            
                            groups.forEach(group => {
                                let hasVisibleButtons = false;
                                const buttonsInGroup = group.querySelectorAll('.dispo-button');
                                
                                buttonsInGroup.forEach(btn => {
                                    const matches = btn.textContent.toLowerCase().includes(searchTerm);
                                    btn.style.display = matches ? 'block' : 'none';
                                    if (matches) hasVisibleButtons = true;
                                });
                                
                                group.style.display = hasVisibleButtons ? 'block' : 'none';
                            });
                        });
                    }

                    // Action buttons
                    document.getElementById('saveBtn').onclick = () => {
                        window.parent.postMessage({ type: 'PERFORM_ACTION', action: 'save' }, '*');
                    };
                    document.getElementById('finishBtn').onclick = () => {
                        window.parent.postMessage({ type: 'PERFORM_ACTION', action: 'finish' }, '*');
                    };
                    document.getElementById('machineBtn').onclick = () => {
                        window.parent.postMessage({ type: 'PERFORM_ACTION', action: 'machine' }, '*');
                    };
                    document.getElementById('duplicateBtn').onclick = () => {
                        window.parent.postMessage({ type: 'PERFORM_ACTION', action: 'duplicate' }, '*');
                    };
                    document.getElementById('minimizeBtn').onclick = () => {
                        const iframe = window.frameElement;
                        iframe.style.height = iframe.style.height === '60px' ? '500px' : '60px';
                    };

                    // Initialize
                    populateButtons();
                </script>
            </body>
            </html>
        `;

        document.body.appendChild(iframe);
        
        // Write content to iframe
        iframe.contentDocument.write(panelHTML);
        iframe.contentDocument.close();

        return iframe;
    };

    // Message listener for iframe communication
    window.addEventListener('message', (event) => {
        if (event.data.type === 'APPLY_DISPOSITION') {
            const dispoField = document.getElementById('dialer_disposition');
            const noteField = document.getElementById('dialer_notes');
            if (dispoField) dispoField.value = event.data.value;
            if (noteField) noteField.value = event.data.note;
        }
        else if (event.data.type === 'PERFORM_ACTION') {
            switch(event.data.action) {
                case 'save': safeClick(['save_disposition_all', 'save_disposition']); break;
                case 'finish': safeClick(['end_call']); break;
                case 'machine': safeClick(['end_call_am']); break;
                case 'duplicate': duplicateTab(); break;
            }
        }
    });

    // Initialize
    createFloatingPanel();
})();