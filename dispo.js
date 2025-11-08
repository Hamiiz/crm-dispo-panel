// ==UserScript==
// @name         CRM Panel
// @namespace    http://tampermonkey.net/
// @version      2025-11-06
// @description  try to take over the world!
// @author       You
// @match        *://*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    console.log('working properly')

    const githubToken = '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' //read only token from my github
    const GITHUB_JSON_URL = 'https://raw.githubusercontent.com/hamiiz/crm-dispo-panel/main/dispositions.json';

    GM.xmlHttpRequest({
        method: 'GET',
        url: GITHUB_JSON_URL,
        onload: function(response) {
            if (response.status === 200) {
                try {
                    const data = JSON.parse(response.responseText);
                    initializePanel(data);
                    console.log(' Dispositions loaded successfully.');
                } catch (err) {
                    console.error(' Failed to parse dispositions JSON:', err);
                }
            } else {
                console.error(' GitHub request failed. Status:', response.status);
            }
        },
        onerror: function(err) {
            console.error(' Failed to fetch dispositions:', err);
        }
    });

    function initializePanel(DISPOSITIONS) {


        const fieldIDs = {
            disposition: 'dialer_disposition',
            note: 'dialer_notes',
            saveButton: 'save_disposition',
            finishButton: 'end_call'
        };





        const style = document.createElement('style');
        style.textContent = `

    #tm-dispo-panel {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #f9f9f9;
        border: 2px solid #4CAF50;
        border-radius: 12px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        padding: 10px;
        width: 250px;
        z-index: 99999;
        resize: both;
        overflow: auto;
        max-height:500px;
    }
    #tm-dispo-panel h3 {
        margin-top: 0;
        background: #4CAF50;
        color: white;
        padding: 0px;
        text-align: center;
        border-radius: 8px;
        font-size:.7rem;
        cursor: move;
        user-select: none;
    }
    #tm-dispo-panel button {
        display: block;
        margin: 5px auto;
        width: 90%;
        padding: 6px;
        border-radius: 8px;
        border: none;
        background: #4CAF50;
        color: white;
        cursor: pointer;
        font-weight: 600;
    }
    #tm-dispo-panel button:hover {
        background: #45a049;
    }
    #collapseBtn {
        background: #666;
        margin-bottom: 5px;
    }
    #tm-button-container {
        display: flex;
        flex-wrap: wrap;
        justify-content: start;
       overflow-y:scroll;
       margin:1rem 0;
       border-radius:4mm;
       border-top: 1px solid grey;
       padding-top:5px;
       height:40vh;
    }
    #tm-button-container button {
        width:auto;
        margin:.2rem;
    }
    #tm-quick-container {
       display:flex;
       justify-contents:start;
       flex-wrap:wrap;
       gap;5px;

    }
    #tm-quick-container button {
        background-color: #8f3633;
        width:min-content;
    }
    #tm-quick-container button:hover {
        background-color: #812d2a;
    }
    h4{
        width: 100%;
    }
    `;
        document.head.appendChild(style);

        const panel = document.createElement('div');
        panel.id = 'tm-dispo-panel';
        panel.innerHTML = `
        <h3>Dispo Panel</h3>
        <button id="collapseBtn">Toggle Panel</button>
        <div id="tm-button-container"></div>
        <div id="tm-quick-container">
            <button data-dispo="Finish" id="tm-call-finish" data-note="Call Completed">Finish</button>
            <button data-dispo="Answering Machine" id="tm-quick-am"  data-note="Voicemail Detected">Ans Mach</button>
            <button data-dispo="Fax" id="tm-quick-fax" data-note="Fax Tone Heard">Fax</button>
            <button id="tm-save">Save Dispo</button>
        </div>
    `;
        document.body.appendChild(panel);

        const buttonContainer = panel.querySelector('#tm-button-container');

        Object.entries(DISPOSITIONS).forEach(([dispo, { value, notes }]) => {
            const groupLabel = document.createElement('h4');
            groupLabel.textContent = dispo;
            groupLabel.style.margin = '4px 0';
            groupLabel.style.color = '#333';
            buttonContainer.appendChild(groupLabel);

            notes.forEach(note => {
                const btn = document.createElement('button');
                btn.textContent = note;
                btn.dataset.dispo = dispo;
                btn.dataset.value = value;
                btn.dataset.note = note;
                btn.style.margin = '2px';

                btn.addEventListener('click', () => {
                    const dispoField = document.getElementById(fieldIDs.disposition);
                    const noteField = document.getElementById(fieldIDs.note);

                    if (dispoField) dispoField.value = value;
                    if (noteField) noteField.value = note;
                });

                buttonContainer.appendChild(btn);
            });
        });


        const collapseBtn = panel.querySelector('#collapseBtn');
        collapseBtn.addEventListener('click', () => {
            buttonContainer.style.display =
                buttonContainer.style.display === 'none' ? 'flex' : 'none';
        });
        buttonContainer.style.display = 'flex';

        panel.querySelector('#tm-save').addEventListener('click', () => {
            const saveBtn = document.getElementById('save_disposition_all') || document.getElementById(fieldIDs.saveButton);
            if (saveBtn) saveBtn.click();
            else alert('Save button not found!');
        });
        panel.querySelector('#tm-quick-am').addEventListener('click', () => {
            const amBtn = document.getElementById('end_call_am');
            if (amBtn) amBtn.click();
            else alert('Save button not found!');
        });
        panel.querySelector('#tm-call-finish').addEventListener('click', () => {
            const finBtn = document.getElementById(fieldIDs.finishButton);
            if (finBtn) finBtn.click();
            else alert('Save button not found!');
        });
        panel.querySelector('#tm-quick-fax').addEventListener('click', () => {
            const faxBtn = document.getElementById('end_call_fm');
            if (faxBtn) faxBtn.click();
            else alert('Save button not found!');
        });



        let isDragging = false, offsetX, offsetY;
        const header = panel.querySelector('h3');
        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            offsetX = e.clientX - panel.offsetLeft;
            offsetY = e.clientY - panel.offsetTop;
        });
        document.addEventListener('mouseup', () => isDragging = false);
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                panel.style.left = e.clientX - offsetX + 'px';
                panel.style.top = e.clientY - offsetY + 'px';
                panel.style.right = 'auto';
                panel.style.bottom = 'auto';
            }
        });
    }
})();
