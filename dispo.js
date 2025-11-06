(function() {
    'use strict';

    const fieldIDs = {
        disposition: 'disposition',
        note: 'notes',
        saveButton: 'saveDispo'
    };

    const DISPOSITIONS = {
  "No answer": [
    "continuous ringing",
    "dead air",
    "call dropped",
    "Unidentified Hang Up",
    "Tp hung up after hearing the funds name",
    "TP hung up after saying hello",
    "TP hung up before hearing the reason for the call",
    "TP hung up before confirming the address",
    "TP said Wrong Number when asked for Sh and Hung up",
    "Operator transferred me to Sh Voice mail"
  ],

  "Left Message With Third Party": [
    "left our toll-free number with TP",
    "TP Not Interested",
    "TP currently busy",
    "TP hung up after hearing the reason for the call",
    "call dropped after TP heard the reason for the call",
    "TP stated that he no longer owns shares in the company and hung up"
  ],

  "Call Intercept": [
    "Google/Virtual Assistant",
    "Sound board",
    "Smart Call Blocker",
    "Nomo Robo",
    "Number your calling is not accepting your call",
    "number has been blocked",
    "Number cannot be dialed",
    "Ads",
    "The party you are trying to reach is not accepting calls from this number",
    "The number you have called cannot be dialed"
  ],

  "Operator Tritone": [
    "number not in service",
    "number has been disconnected"
  ],

  "DNC by tp": [
    "TP Sayed do not call me",
    "TP stated to be taken of our list"
  ],

  "Undecided sh not sure": [
    "SH wants to review the materials",
    "SH stated that he is waiting on financial advisor",
    "SH Stated that he will vote online",
    "SH hung up after hearing the funds name",
    "SH hung up while confirming vote",
    "SH requested a call back cause they're currently busy",
    "SH hung up after hearing the reason for the call"
  ],

  "Not interested": [
    "SH Stated that she is Not Interested",
    "SH doesn't want to vote on the phone",
    "SH stated that he is not interested in voting and hung up",
    "SH is currently busy and doesn't want to vote"
  ],

  "Undecided sh waiting for an fa": [
    "SH stated that her Financial Advisor hands this issues and hung up"
  ],

  "Will Vote": [
    "SH stated she will return the proxy"
  ],

  "Wrong Number": [
    "TP confirmed the address on record is incorrect"
  ]
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
    }
    #tm-dispo-panel h3 {
        margin-top: 0;
        background: #4CAF50;
        color: white;
        padding: 5px;
        text-align: center;
        border-radius: 8px;
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
    }
    #tm-button-container button {
        width:auto;
        margin:.2rem;
    }
    #tm-quick-container button {
        background-color: #8f3633;
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
            <button data-dispo="Finish" data-note="Call Completed">Finish</button>
            <button data-dispo="Answering Machine" data-note="Voicemail Detected">Answering Machine</button>
            <button data-dispo="Fax" data-note="Fax Tone Heard">Fax</button>
            <button id="tm-save">Save Dispo</button>
        </div>
    `;
    document.body.appendChild(panel);

    const buttonContainer = panel.querySelector('#tm-button-container');

    Object.entries(DISPOSITIONS).forEach(([dispo, notes]) => {
        const groupLabel = document.createElement('h4');
        groupLabel.textContent = dispo;
        groupLabel.style.margin = '4px 0';
        groupLabel.style.color = '#333';
        buttonContainer.appendChild(groupLabel);

        notes.forEach(note => {
            const btn = document.createElement('button');
            btn.textContent = note;
            btn.dataset.dispo = dispo;
            btn.dataset.note = note;
            btn.addEventListener('click', () => {
                const dispoField = document.getElementById(fieldIDs.disposition);
                const noteField = document.getElementById(fieldIDs.note);
                if (dispoField) dispoField.value = dispo;
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
        const saveBtn = document.getElementById(fieldIDs.saveButton);
        if (saveBtn) saveBtn.click();
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
})();
