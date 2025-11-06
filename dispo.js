(function() {
    'use strict';

    const fieldIDs = {
        disposition: 'disposition', 
        note: 'notes', 
        saveButton: 'saveDispo'
    };

    const DISPOSITIONS = {
        "No Answer": ["Dead Air", "Call Dropped", "Continuous Ring"],
        "Answering Machine": ["Voicemail Detected", "No Message Left"],
        "Callback": ["Customer requested callback", "Scheduled follow-up"],
        "Completed": ["Issue resolved", "Customer satisfied"]
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
