// ==UserScript==
// @name         CRM Panel (Enhanced UI)
// @namespace    http://tampermonkey.net/
// @version      2025-11-09
// @description  CRM helper
// @author       Hamza
// @match        *://69.10.47.54/*
// @match        *://127.0.0.1:5500/drake.html
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
      "Machine answer":{value:11,notes:["Quick Disposition"]},
      "Unidentified Hang Up": { value: 105, notes: ["Tp hu after saying hello","Tp hung up after hearing the funds name", "TP hung up before reason for the call", "TP hung up before confirming the address"] },
      "Left Message With Third Party": { value: 9, notes: ["left message without tfn","tp said not interested and hu","left toll-free number with TP", "TP hung up after hearing the reason"] },
      "Machine answer":{value:11,notes:["Quick Disposition"]},
      "Call Intercept": { value: 2, notes: ["Google/Virtual Assistant","Ads","Nomo Robo","soundboard", "Smart Call Blocker", "Number not accepting calls","number has been blocked"] },
      "Operator Tritone": { value: 14, notes: ["number not in service", "number has been disconnected"] },
      "DNC by tp": { value: 119, notes: ["TP said 'do not call me'", "TP requested removal from list"] },
      "DNC by SH": { value: 4, notes: ["SH asked not to be called", "sh requested to be removed from the list"] },
      "Hang Up by contact":{value:6,notes:["sh hu after hearing the funds name", "sh hu before hearing the reason of the call"]},
      "Undecided sh not sure": { value: 27, notes: ["requested call back","sh is busy", "sh hu after hearing the reason of the call"]},
      "Not interested": { value: 13, notes: ["sh said they are not interested in voting", "Doesn't want to vote on phone"] },
      "Undecided sh waiting for an fa": { value: 26, notes: ["waiting for FA","SH waiting for significant other"] },
      "Will Vote": { value: 30, notes: ["will return the proxy","sh will vote online"] },
      "Wrong Number": { value: 31, notes: ["address incorrect"] }
  };

  const IB_Dispos = {
      "Sh called in":{value:20, notes:["SH Called in"]},
      "Endeavour":{value:61,notes:["endeavour"]},
      "Directory":{value:40,notes:["directory assistance"]}
  };

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

    #tm-tabs {
        display: flex;
        background: #f5f5f5;
        border-bottom: 1px solid #ddd;
    }

    .tm-tab {
        flex: 1;
        padding: 8px 0;
        text-align: center;
        background: #e0e0e0;
        border: none;
        cursor: pointer;
        font-size: 0.8rem;
        font-weight: 600;
        transition: all 0.2s ease;
        color: #666;
    }

    .tm-tab.active {
        background: #4CAF50;
        color: white;
    }

    .tm-tab:hover:not(.active) {
        background: #d6d6d6;
    }

    #tm-button-container {
        display: flex;
        flex-wrap: wrap;
        justify-content: start;
        overflow-y: auto;
        margin: 0.5rem;
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

    #tm-search-input{
      border-radius: .5rem;
      outline: none;
      border: .5px solid gray;
      margin: 0% 3%;
      padding: 1% 3%;
      width: 94%;
    }

    #tm-search-input::placeholder{
       color: gray;
    }

    #IbCont{
       width: 100%;
       display: flex;
       flex-wrap: wrap;
    }

    #IbCont button{
      margin: 1% 3%;
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

    #IbCont button:hover {
        background: #e8f5e9;
        border-color: #4CAF50;
        color: #2e7d32;
    }

    .tab-content {
        display: none;
    }

    .tab-content.active {
        display: flex;
        flex-wrap: wrap;
    }
`;
  document.head.appendChild(style);

  const panel = document.createElement('div');
  panel.id = 'tm-dispo-panel';
  panel.innerHTML = `
    <h3>Disposition Panel</h3>
    <div id="tm-tabs">
        <button class="tm-tab active" data-tab="dialer">Dialer</button>
        <button class="tm-tab" data-tab="ib">IB</button>
    </div>
    <div id="tm-tab-contents">
        <div class="tab-content active" id="dialer-tab">
            <div id="tm-button-container"></div>
        </div>
        <div class="tab-content" id="ib-tab">
            <div id="IbCont"></div>
        </div>
    </div>
    <div id="tm-quick-container">
        <button data-dispo="Finish" id="tm-call-finish" class="tm-action-buttons" data-note="Call Completed">Finish</button>
        <button data-dispo="Answering Machine" class="tm-action-buttons" id="tm-quick-am" data-note="Voicemail Detected">Ans Mach</button>
        <button data-dispo="Fax" id="tm-quick-fax" class="tm-action-buttons" data-note="Fax Tone Heard">Fax</button>
        <button class="tm-action-buttons" id="tm-save">Save</button>
        <button class="tm-action-buttons" id="tm-dupl">Duplicate</button>
        <input id="tm-search-input" placeholder="Search ..." />
    </div>
`;
  document.body.appendChild(panel);

  // Build Dialer dispositions
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

  // Build IB dispositions
  const ibCont = panel.querySelector('#IbCont');
  Object.entries(IB_Dispos).forEach(([dispo, { value, notes }]) => {
    

      notes.forEach(note => {
          const btn1 = document.createElement('button');
          btn1.textContent = note;
          btn1.dataset.dispo = dispo;
          btn1.dataset.value = value;
          btn1.dataset.note = note;
          btn1.addEventListener('click', () => {
              const dispoField = document.getElementById(fieldIDs.disposition);
              const noteField = document.getElementById(fieldIDs.note);
              if (dispoField) dispoField.value = value;
              if (noteField) noteField.value = note;
          });
          ibCont.appendChild(btn1);
      });
  });

  // Tab switching functionality
  const tabs = panel.querySelectorAll('.tm-tab');
  const tabContents = panel.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
      tab.addEventListener('click', () => {
          const targetTab = tab.dataset.tab;

          // Update active tab
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');

          // Show corresponding content
          tabContents.forEach(content => {
              content.classList.remove('active');
              if (content.id === `${targetTab}-tab`) {
                  content.classList.add('active');
              }
          });
      });
  });

  const savedPosition = JSON.parse(localStorage.getItem('tm-panel-position') || '{}');
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

  const actionButtons = panel.querySelectorAll('.tm-action-buttons');
  panel.querySelector('#tm-dupl').addEventListener('click',()=>{
      const currentUrl = window.location.href;
      const newTab = window.open(currentUrl,'_blank');
      const transferData = {
          referrer:window.location.href
      };
      sessionStorage.setItem('tabDuplicateData',JSON.stringify(transferData));
  });

  actionButtons.forEach(btn => {
      btn.addEventListener('click', () => {
          btn.disabled = true;
          btn.classList.add('disabled-btn');

          setTimeout(() => {
              btn.disabled = false;
              btn.classList.remove('disabled-btn');
          }, 2000);
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

  const TABLE_SELECTOR = "#search_result_table";
  const HIGHLIGHT_COLOR = "rgba(255,255,0,0.4)";
  const table = document.querySelector(TABLE_SELECTOR);
  if (!table) return;
  const advSearch = document.querySelector("#tm-search-input");

  let matchedCells = [];
  advSearch.addEventListener("input", function() {
      const query = this.value.toLowerCase();
      const tds = table.getElementsByTagName("td");
      matchedCells = [];
      for (let td of tds) {
          td.style.backgroundColor = "";
      }
      if (!query) return;
      for (let td of tds) {
          if (td.textContent.toLowerCase().includes(query)) {
              td.style.backgroundColor = HIGHLIGHT_COLOR;
              matchedCells.push(td);
          }
      }
  });
  advSearch.addEventListener("keydown", function(e) {
      if (e.key === "Enter") {
          if (matchedCells.length > 0) {
              matchedCells[0].scrollIntoView({
                  behavior: "smooth",
                  block: "center"
              });
          }
      }
  });
})();
