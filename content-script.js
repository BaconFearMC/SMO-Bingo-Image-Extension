console.log("🎉 Super Mario Bingo Extension is active");

// ================================
// @font-face-Injektion für Bangers
// ================================
(function injectBangersFont() {
  const fontUrl = chrome.runtime.getURL("fonts/Bangers.woff2");
  const style = document.createElement("style");
  style.textContent = `
    @font-face {
      font-family: 'Bangers';
      src: url('${fontUrl}') format('woff2');
      font-weight: normal;
      font-style: normal;
      font-display: swap;
    }
  `;
  document.head.appendChild(style);
})();

const mapFiles = {
    'SMO':                  'bingo-mapping.json',
    'SMO Short':            'bingo-mapping-short.json',
    'SMO Long':             'bingo-mapping-long.json',
    'SMO All Kingdoms':     'bingo-mapping-all-kingdoms.json',
    'SMO AK + PG':          'bingo-mapping-all-kingdoms-post-game.json'
  };

let currentVariant = null;
let bingoMapping = null;
let showDifficulty = false;
let enableRightClickGlow = false;

// Lade gespeicherte Einstellungen
chrome.storage.sync.get(
  { showDifficulty: false, enableRightClickGlow: false },
  prefs => {
    showDifficulty = prefs.showDifficulty;
    enableRightClickGlow = prefs.enableRightClickGlow;
    console.log('Right‑Click Glow enabled:', enableRightClickGlow);
  }
);

// Optional: auf Änderungen reagieren (falls in Options-Tab umgeschaltet)
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && 'showDifficulty' in changes) {
    showDifficulty = changes.showDifficulty.newValue;
    console.log("Show Difficulty changed:", showDifficulty);
    updateBoard();
  }
});

// Reagiere auf Änderungen zur Laufzeit
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && 'enableRightClickGlow' in changes) {
    enableRightClickGlow = changes.enableRightClickGlow.newValue;
    console.log('Right‑Click Glow toggled:', enableRightClickGlow);
  }
});

// Fetch the room-settings JSON and extract the game
async function fetchRoomSettings() {
  // Build the URL: ensure trailing slash so relative resolution works
  const base = window.location.href.endsWith('/') 
    ? window.location.href 
    : window.location.href + '/';
  const settingsUrl = new URL('room-settings', base).href;
  
  console.log('Fetching room settings from', settingsUrl);
  try {
    const resp = await fetch(settingsUrl, { headers: { 'Accept': 'application/json' } });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    console.log('Room settings JSON:', data);
    return data.settings?.variant || null;
  } catch (e) {
    console.warn('Could not fetch room settings:', e);
    return null;
  }
}

// Laden des Mappings, abhängig von currentVariant
async function loadMapping() {
  // 1) Game aus room-settings ermitteln
  currentVariant = await fetchRoomSettings();
  console.log('Detected Variant:', currentVariant);

  // 2) Map-Datei auswählen
  const mapFiles = {
    'SMO':                  'bingo-mapping.json',
    'SMO Short':            'bingo-mapping-short.json',
    'SMO Long':             'bingo-mapping-long.json',
    'SMO All Kingdoms':     'bingo-mapping-all-kingdoms.json',
    'SMO AK + PG':          'bingo-mapping-all-kingdoms-post-game.json'
  };

  const filename = mapFiles[currentVariant];
  if (!filename) {
    console.warn(`No mapping defined for Game="${currentVariant}".`);
    bingoMapping = null;
    return;
  }

  // 3) Mapping‑JSON laden
  const url = chrome.runtime.getURL(`data/${filename}`);
  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    bingoMapping = await resp.json();
    console.log(`Loaded ${filename}`, bingoMapping);
  } catch (e) {
    console.error(`Error loading ${filename}:`, e);
    bingoMapping = null;
  }
}


// Liste der möglichen Kingdom-Namen (kleingeschrieben, um CSS-Klassen abzuleiten)
const worlds = [
  "cap",
  "cascade",
  "sand",
  "lake",
  "wooded",
  "cloud",
  "lost",
  "metro",
  "snow",
  "seaside",
  "luncheon",
  "ruined",
  "bowsers",
  "moon",
  "mushroom",
  "all"
];

// Wandelt einen Kingdom-Namen in die entsprechende Badge-Klasse um
function getBadgeClass(kingdom) {
  const key = kingdom.toLowerCase().replace(/[^a-z0-9]/g, "");
  return worlds.includes(key) ? `smobadge smobadge-${key}` : null;
}

// Fügt für einen Slot (slotId) ein Badge oben rechts ein
function addBadge(slotId, kingdom) {
  const td = document.getElementById("slot" + slotId);
  if (!td) return;

  // Damit das Badge relativ zum <td> absolut positioniert werden kann
  td.style.position = "relative";

  const badgeClass = getBadgeClass(kingdom);
  if (!badgeClass) return;

  // Verhindere doppelte Badges
  if (td.querySelector(`.smobadge-${kingdom.toLowerCase().replace(/[^a-z0-9]/g, "")}`)) {
    return;
  }

  const span = document.createElement("span");
  span.className = badgeClass;
  span.textContent = kingdom
  td.appendChild(span);
}

// Ersetzt in jedem Slot-Element den Text durch das Bild (falls vorhanden) und hängt das Badge an
async function updateBoard() {
  // 1) Mapping neu laden
  await loadMapping();

  // 2) Wenn kein Mapping verfügbar, nichts tun
  if (!bingoMapping) {
    console.log('updateBoard: no mapping, skipping tile update.');
    return;
  }

  // 3) Nur laufen lassen, wenn das Cover weg ist
  const cover = document.querySelector('.board-cover');
  if (cover && window.getComputedStyle(cover).display !== 'none') {
    console.log('updateBoard: board-cover still visible, skipping.');
    return;
  }

  // 4) Alle 25 Slots updaten
  for (let slotId = 1; slotId <= 25; slotId++) {
    const td = document.getElementById('slot' + slotId);
    if (!td) continue;

    const textDiv = td.querySelector('.text-container');
    console.log(textDiv);
    if (!textDiv) continue;

    const currentText = textDiv.textContent.trim();
    const entry = bingoMapping[currentText];
    if (!entry) continue;

    // — Bild & optional Text —
    if (entry.image && !textDiv.querySelector('img')) {
      textDiv.innerHTML = '';
      const img = document.createElement('img');
      img.src = chrome.runtime.getURL(entry.image);
      img.style.position = 'absolute';
      img.style.top = '50%';
      img.style.left = '50%';
      img.style.transform = 'translate(-50%, -50%)';
      img.style.opacity = '0.5';
      img.style.zIndex = '0';
      img.style.maxWidth = '80%';
      img.style.maxHeight = '80%';
      img.style.pointerEvents = 'none';
      textDiv.appendChild(img);

      if (entry.text) {
        const textNode = document.createElement('div');
        textNode.className = 'text-overlay';
        textNode.textContent = entry.text;
        textDiv.appendChild(textNode);
      }
    }

    // — Badge —
    addBadge(slotId, entry.kingdom);

    // — Difficulty Label (falls aktiviert) —
    if (showDifficulty && entry.difficulty != null) {
      if (!td.querySelector('.difficulty-label')) {
        const diffLabel = document.createElement('div');
        diffLabel.className = 'difficulty-label';
        diffLabel.textContent = entry.difficulty;
        td.appendChild(diffLabel);
      }
    }
  }

  console.log('updateBoard: completed');
}


// === Zwischen ColorChooser und Bingo-Board einen Container + Button injizieren ===

function injectLoadButtonBelowChooser() {
  const chooser = document.getElementById('color-chooser');
  if (!chooser) return console.warn('Color Chooser nicht gefunden.');

  // Only show the button if we detected a valid game mapping
  if (!currentVariant || !mapFiles[currentVariant]) {
    console.log(`Skipping Load Images button: no mapping for Game="${currentVariant}".`);
    return;
  }

  // Prüfen, ob wir schon injiziert haben
  if (document.getElementById('smo-load-container')) return;

  // 1. Erstelle Container-DIV
  const container = document.createElement('div');
  container.id = 'smo-load-container';
  Object.assign(container.style, {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: '8px 16px',
    background: 'transparent'
  });

  // 2. Erstelle den Button
  const btn = document.createElement('button');
  btn.id = 'smo-load-images-btn';
  btn.type = 'button';
  btn.textContent = 'Load Images';
  Object.assign(btn.style, {
    background: '#B22222',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    fontSize: '1.2em',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    fontFamily: "'Bangers', cursive"
  });

  // 3. Icon hinzufügen (optional)
  const icon = document.createElement('img');
  icon.src = chrome.runtime.getURL('images/bingo.png');
  icon.style.cssText = 'height:16px;margin-right:6px;vertical-align:middle;';
  btn.insertBefore(icon, btn.firstChild);

  // 4. Klick-Handler
  btn.addEventListener('click', () => {
    btn.disabled = true;
    btn.textContent = '';
    btn.appendChild(icon);
    btn.appendChild(document.createTextNode('Loading…'));
    setTimeout(() => {
      updateBoard();
      btn.textContent = '';
      btn.appendChild(icon);
      btn.appendChild(document.createTextNode('Load Images'));
      btn.disabled = false;
    }, 100);
  });

  // 5. Container direkt unter den ColorChooser einfügen
  //    (das Board ist das nächste Element nach chooser)
  chooser.parentNode.insertBefore(container, chooser.nextSibling);

  // 6. Button in Container hängen
  container.appendChild(btn);
}

// Hilfsfunktion: entfernt den Load-Button-Container, falls kein Mapping da ist
function cleanupLoadButton() {
  const container = document.getElementById('smo-load-container');
  if (container && !bingoMapping) {
    container.remove();
    console.log('Removed Load Images button (no mapping).');
  }
}

// Nach Page‑Load: nur Button injizieren (wenn Mapping da ist)
window.addEventListener('load', async () => {
  await loadMapping();                    // lädt bingoMapping (oder null)
  setTimeout(injectLoadButtonBelowChooser, 500);
});

function setupRightClickGlow() {
  document.querySelectorAll('.inset-glow-overlay').forEach(el => el.remove());

  document.querySelectorAll('td[id^="slot"]').forEach(slot => {
    slot.oncontextmenu = e => {
      if (e.button !== 2) return;            // nur Rechtsklick
      if (!enableRightClickGlow) return;     // Option aus?

      // Modifier-abhängiges Prevent
      const isCtrl  = e.ctrlKey;
      const isAlt   = e.altKey;
      if (isCtrl || isAlt) {
        e.preventDefault();  // Menü nur bei Ctrl+Rechts und Alt+Rechts unterbinden
      }

      // Bestimme Glow-Farbe
      let glowColor = 'rgba(255, 255, 255, 0.8)'; // Standard weiß
      if (isCtrl)        glowColor = 'rgba(255, 255, 0, 0.8)'; // Gelb
      else if (isAlt)    glowColor = 'rgba(255, 0, 0, 0.8)';   // Rot

      // Toggle Overlay
      const existing = slot.querySelector('.inset-glow-overlay');
      if (existing) {
        existing.remove();
      } else {
        slot.style.position  = 'relative';
        slot.style.overflow  = 'hidden';
        const glow = document.createElement('div');
        glow.className = 'inset-glow-overlay';
        Object.assign(glow.style, {
          position:      'absolute',
          top:           '0',
          left:          '0',
          width:         '100%',
          height:        '100%',
          pointerEvents: 'none',
          boxShadow:     `inset 0 0 10px 5px ${glowColor}`,
          zIndex:        '9999'
        });
        slot.appendChild(glow);
      }
    };
  });
}


// Starte den Glow‑Setup nach Page‑Load und nach jedem Board‑Update:
window.addEventListener('load', () => {
  // nach einem kurzen Delay, wenn das Board da ist
  setTimeout(setupRightClickGlow, 500);
});
