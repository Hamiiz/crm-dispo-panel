// ==UserScript==
// @name         CRM Panel (Enhanced UI)
// @namespace    http://tampermonkey.net/
// @version      2025-11-09
// @description  Sleek CRM helper panel with persistent state and responsive UI
// @author       Hamza
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';
  console.log('CRM Dispo Panel Loaded ✅');

  const fieldIDs = {
    disposition: 'dialer_disposition',
    note: 'dialer_notes',
    saveButton: 'save_disposition',
    finishButton: 'end_call'
  };

  const DISPOSITIONS = {
    "No answer": { value: 12, notes: ["continuous ringing", "dead air", "call dropped"] },
    "Unidentified Hang Up": { value: 105, notes: ["Tp hung up after hearing the funds name", "TP hung up before reason for the call", "TP hung up before confirming the address"] },
    "Left Message With Third Party": { value: 9, notes: ["left toll-free number with TP", "TP currently busy", "TP hung up after hearing the reason"] },
    "Call Intercept": { value: 2, notes: ["Google/Virtual Assistant", "Smart Call Blocker", "Number not accepting calls"] },
    "Operator Tritone": { value: 14, notes: ["number not in service", "number has been disconnected"] },
    "DNC by tp": { value: 4, notes: ["TP said 'do not call me'", "TP requested removal from list"] },
    "Undecided sh not sure": { value: 27, notes: ["waiting on financial advisor", "will vote online", "requested call back"] },
    "Not interested": { value: 13, notes: ["Not interested", "Doesn't want to vote on phone"] },
    "Undecided sh waiting for an fa": { value: 26, notes: ["waiting for FA"] },
    "Will Vote": { value: 30, notes: ["will return the proxy"] },
    "Wrong Number": { value: 31, notes: ["address incorrect"] }
  };

  // --- STYLING ---
  const style = document.createElement('style');
  style.textContent = `
      #tm-dispo-panel {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: #ffffff;
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          box-shadow: 0 6px 18px rgba(0,0,0,0.15);
          padding: 0;
          width: 280px;
          z-index: 99999;
          resize: both;
          overflow: hidden;
          max-height: 90vh;
          transition: all 0 ease;
          font-family: 'Inter', sans-serif;
      }

      #tm-dispo-panel h3 {
          margin: 0;
          background: linear-gradient(135deg, #2e7d32, #43a047);
          color: white;
          padding: 10px;
          text-align: center;
          border-radius: 12px 12px 0 0;
          font-size: 0.9rem;
          cursor: move;
          user-select: none;
          letter-spacing: 0.5px;
          font-weight: 600;
      }

      #collapseBtn {
          background: #2e7d32;
          border-radius: 6px;
          padding: 5px 8px;
          font-size: 0.75rem;
          border: none;
          margin: 8px auto;
          display: block;
          color: white;
          cursor: pointer;
          transition: 0.2s ease;
      }

      #collapseBtn:hover {
          background: #1b5e20;
      }

      #tm-button-container {
          display: flex;
          flex-wrap: wrap;
          justify-content: start;
          overflow-y: auto;
          margin: 0.5rem;
          border-top: 1px solid #ddd;
          padding-top: 8px;
          gap: 5px;
          height: 40vh;
          transition: all 0.2s ease;
      }

      #tm-button-container h4 {
          width: 100%;
          margin: 8px 0 4px;
          color: #333;
          font-size: 0.8rem;
          border-left: 4px solid #4CAF50;
          padding-left: 6px;
      }

      #tm-button-container button {
          flex: 1 1 auto;
          background: #f4f4f4;
          border: 1px solid #ddd;
          border-radius: 6px;
          padding: 5px 8px;
          font-size: 0.75rem;
          cursor: pointer;
          color: #333;
          transition: 0.2s ease;
      }

      #tm-button-container button:hover {
          background: #e8f5e9;
          border-color: #4CAF50;
          color: #2e7d32;
      }

      #tm-quick-container {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 5px;
          border-top: 1px solid #ddd;
          padding: 10px 0;
          background: #fafafa;
      }

      #tm-quick-container button {
          flex: 1 1 40%;
          background: #388e3c;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 6px 0;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.8rem;
          transition: 0.2s ease;
      }
     .disabled-btn {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
    opacity: 0.8;
}

      #tm-quick-container button:hover {
          background: #2e7d32;
      }

      #tm-save {
          background: #1976d2;
      }

      #tm-save:hover {
          background: #1565c0;
      }

      @media (max-width: 600px) {
          #tm-dispo-panel {
              width: 95%;
              left: 50%;
              transform: translateX(-50%);
              right: auto;
          }
          #tm-button-container {
              height: 35vh;
          }
      }
  `;
  document.head.appendChild(style);

  const panel = document.createElement('div');
  panel.id = 'tm-dispo-panel';
  panel.innerHTML = `
      <h3>CRM Disposition Panel</h3>
      <button id="collapseBtn">Toggle Dispositions</button>
      <div id="tm-button-container"></div>
      <div id="tm-quick-container">
          <button data-dispo="Finish" id="tm-call-finish" class="tm-action-buttons" data-note="Call Completed">Finish</button>
          <button data-dispo="Answering Machine" class="tm-action-buttons" id="tm-quick-am" data-note="Voicemail Detected">Ans Mach</button>
          <button data-dispo="Fax" id="tm-quick-fax" class="tm-action-buttons" data-note="Fax Tone Heard">Fax</button>
          <button class="tm-action-buttons" id="tm-save">Save</button>
      </div>
  `;
  document.body.appendChild(panel);

  const buttonContainer = panel.querySelector('#tm-button-container');

  Object.entries(DISPOSITIONS).forEach(([dispo, { value, notes }]) => {
    const groupLabel = document.createElement('h4');
    groupLabel.textContent = dispo;
    buttonContainer.appendChild(groupLabel);

    notes.forEach(note => {
      const btn = document.createElement('button');
      btn.textContent = note;
      btn.dataset.dispo = dispo;
      btn.dataset.value = value;
      btn.dataset.note = note;
      btn.addEventListener('click', () => {
        const dispoField = document.getElementById(fieldIDs.disposition);
        const noteField = document.getElementById(fieldIDs.note);
        if (dispoField) dispoField.value = value;
        if (noteField) noteField.value = note;
      });
      buttonContainer.appendChild(btn);
    });
  });

  const savedPosition = JSON.parse(localStorage.getItem('tm-panel-position') || '{}');
  const savedCollapsed = localStorage.getItem('tm-panel-collapsed') === 'true';
  const savedSize = JSON.parse(localStorage.getItem('tm-panel-size') || '{}');

  if (savedPosition.left && savedPosition.top) {
    panel.style.left = savedPosition.left + 'px';
    panel.style.top = savedPosition.top + 'px';
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
  }

  if (savedSize.width && savedSize.height) {
    panel.style.width = savedSize.width + 'px';
    panel.style.height = savedSize.height + 'px';
  }

  if (savedCollapsed) buttonContainer.style.display = 'none';

  const collapseBtn = panel.querySelector('#collapseBtn');
  collapseBtn.addEventListener('click', () => {
    const isCollapsed = buttonContainer.style.display === 'none';
    buttonContainer.style.display = isCollapsed ? 'flex' : 'none';
    localStorage.setItem('tm-panel-collapsed', (!isCollapsed).toString());
  });

  const safeClick = (idList) => {
    for (let id of idList) {
      const el = document.getElementById(id);
      if (el) { el.click(); return; }
    }
    alert('Action button not found!');
  };

  panel.querySelector('#tm-save').addEventListener('click', () => safeClick(['save_disposition_all', fieldIDs.saveButton]));
  panel.querySelector('#tm-quick-am').addEventListener('click', () => safeClick(['end_call_am']));
  panel.querySelector('#tm-call-finish').addEventListener('click', () => safeClick([fieldIDs.finishButton]));
  panel.querySelector('#tm-quick-fax').addEventListener('click', () => safeClick(['end_call_fm']));

  const actionButtons = panel.querySelectorAll('.tm-action-buttons ');

  actionButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      btn.disabled = true;
      btn.classList.add('disabled-btn');

      setTimeout(() => {
        btn.disabled = false;
        btn.classList.remove('disabled-btn');
      }, 4000);
    });
  });

  let isDragging = false, offsetX, offsetY;
  const header = panel.querySelector('h3');

  header.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - panel.offsetLeft;
    offsetY = e.clientY - panel.offsetTop;
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      localStorage.setItem('tm-panel-position', JSON.stringify({
        left: panel.offsetLeft,
        top: panel.offsetTop
      }));
    }
    isDragging = false;
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      panel.style.left = e.clientX - offsetX + 'px';
      panel.style.top = e.clientY - offsetY + 'px';
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
    }
  });

  const savePanelSize = () => {
    localStorage.setItem('tm-panel-size', JSON.stringify({
      width: panel.offsetWidth,
      height: panel.offsetHeight
    }));
  };
  new ResizeObserver(() => savePanelSize()).observe(panel);
})();
