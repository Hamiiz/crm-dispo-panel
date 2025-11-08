// ==UserScript==
// @name         CRM Panel
// @namespace    http://tampermonkey.net/
// @version      2025-11-06
// @description  try to take over the world!
// @author       You
// @match        *://
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
console.log('working properly')
    const fieldIDs = {
        disposition: 'dialer_disposition',
        note: 'dialer_notes',
        saveButton: 'save_disposition',
        finishButton:'end_call'
    };

    const DISPOSITIONS = {
  "No answer": {
    value: 12,
    notes: [
      "continuous ringing",
      "dead air",
      "call dropped"
    ]
  },

  "Unidentified Hang Up": {
    value: 105,
    notes: [
      "Tp hung up after hearing the funds name",
      "TP hung up after saying hello",
      "TP hung up before hearing the reason for the call",
      "TP hung up before confirming the address",
      "TP said Wrong Number when asked for Sh and Hung up",
      "Operator transferred me to Sh Voice mail"
    ]
  },
  "Left Message With Third Party": {
    value: 9,
    notes: [
      "left our toll-free number with TP",
      "TP said Not Interested and hu",
      "TP currently busy",
      "TP hung up after hearing the reason for the call",
      "call dropped after TP heard the reason for the call",
      "TP stated that he no longer owns shares in the company and hung up"
    ]
  },

  "Call Intercept": {
    value: 2,
    notes: [
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
    ]
  },

  "Operator Tritone": {
    value: 14,
    notes: [
      "number not in service",
      "number has been disconnected"
    ]
  },

  "DNC by tp": {
    value: 4,
    notes: [
      "TP Sayed do not call me",
      "TP stated to be taken of our list"
    ]
  },

  "Undecided sh not sure": {
    value: 27,
    notes: [
      "SH wants to review the materials",
      "SH stated that he is waiting on financial advisor",
      "SH Stated that he will vote online",
      "SH hung up after hearing the funds name",
      "SH hung up while confirming vote",
      "SH requested a call back cause they're currently busy",
      "SH hung up after hearing the reason for the call"
    ]
  },

  "Not interested": {
    value: 13,
    notes: [
      "SH Stated that she is Not Interested",
      "SH doesn't want to vote on the phone",
      "SH stated that he is not interested in voting and hung up",
      "SH is currently busy and doesn't want to vote"
    ]
  },

  "Undecided sh waiting for an fa": {
    value: 26,
    notes: [
      "SH stated that her Financial Advisor hands this issues and hung up"
    ]
  },

  "Will Vote": {
    value: 30,
    notes: [
      "SH stated she will return the proxy"
    ]
  },

  "Wrong Number": {
    value: 31,
    notes: [
      "TP confirmed the address on record is incorrect"
    ]
  }
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
        const saveBtn = document.getElementById('save_disposition_all')||document.getElementById(fieldIDs.saveButton);
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
})();
