SMO-specific extension that adds images on Bingosync.

<p>
  <img src="https://github.com/user-attachments/assets/50788279-c6a6-47ea-a8e3-cd70de20b489" width="300px">
  <img src="https://github.com/user-attachments/assets/e80e9c45-3c50-43c6-93c8-323fe300fc36" width="300px">
</p>

# How to install:

Only Chrome, Edge, Opera have been tested but the extension should work in all Chromium‑based browsers (Chrome, Edge, Brave, Opera, Vivaldi) under Manifest V3. Trying to use it with Firefox results in major issues.

1. Clone or download (Code -> Download ZIP) this repo.  
2. Open your browser and navigate to its extensions page:  
   - Chrome/Edge: `chrome://extensions/`  
   - Opera: `opera://extensions/`  
3. Enable **Developer mode**.  
4. Click **Load unpacked** (or **Load temporary extension** in Opera) and select the project folder.

# Features
- **Replaces tile text** with images (32 px height) defined in a JSON mapping.  
- **Adds colored badges** (e.g. `CASADE`, `SAND`, `LAKE`, `ALL`) to each tile based on its “kingdom.”
- **Toggleable difficulty labels**: Show or hide a small difficulty number (1–25) in the bottom‑right of each tile via the extension’s Settings.
- **Optional glow effect on tiles**: Right-click a tile to toggle a glowing border (white, yellow with Ctrl, red with Alt), configurable via the extension’s Settings.   
- **“Load Images”** button lets you manually (re‑)apply the image/badge overlay.  

# Configuration & Settings:

### Open the Settings (Options) page

- **Via Extensions page**  
  1. Go to `chrome://extensions/`  
  2. Find **Super Mario Bingo Overlay** and click **Details**  
  3. Click **Extension options**  

- **Via Toolbar menu**  
  1. Click the Puzzle‑icon (Extensions) in your browser toolbar  
  2. Find **Super Mario Bingo Overlay**  
  3. Click the three‑dot menu → **Options**

### Available settings

1. **Show or hide Difficulty Labels**

On the Settings page you’ll see a toggle:

> **Show Difficulty Labels**  ◯─|   

- **Off** (default): no numbers appear on tiles.  
- **On**: a small number representing the difficulty (1–25) appears in the bottom‑right of each bingo tile.  

Your choice is saved automatically via `chrome.storage` and persists across browser restarts.

2. **Enable Glow Effect on Tiles**

On the Settings page you’ll see another toggle:

> **Enable additional glow effect when right-clicking tiles**   ◯─|

- **Off (default)**: right-clicking tiles does nothing.
- **On**: right-click toggles a glowing border effect on individual tiles:
  - Right-Click: white glow
  - Ctrl + Right-Click: yellow glow
  - Alt + Right-Click: red glow

The glow is purely visual and only affects your local view of the board.

# Additional Notes
- The button may appear on other games, but it won’t have any functionality there.
- It won’t do anything while the board cover is still active.
- To switch back to the standard text-only squares, simply refresh your browser.
- The extension might not play nicely with all other extensions — it’s only been tested with Bingosync counters, which seem to work fine alongside it.
