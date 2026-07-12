const STATE = {
  text: '',
  icon: null,
  panel: null,
  hideTimer: 0,
  loadingTimer: 0,
  requestId: 0,
  selectionRect: null,
  mode: 'idle',
  panelText: '',
  panelMuted: false
};

const STYLE_ID = 'selection-translate-popup-style';
const ICON_ID = 'selection-translate-popup-icon';
const PANEL_ID = 'selection-translate-popup-panel';

function installStyles() {
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #${ICON_ID} {
      position: fixed;
      width: 30px;
      height: 30px;
      border: 0;
      border-radius: 15px;
      background: #fff;
      box-shadow: 0 2px 10px rgba(0, 0, 0, .22);
      color: #1a73e8;
      font: 700 17px/30px Arial, sans-serif;
      text-align: center;
      cursor: pointer;
      z-index: 2147483647;
      user-select: none;
      opacity: 1;
      transform: translateY(0) scale(1);
      transition:
        background-color 140ms ease,
        box-shadow 140ms ease,
        transform 140ms ease;
      will-change: transform, opacity;
    }

    #${ICON_ID}:hover {
      background: #f8fbff;
      box-shadow: 0 4px 14px rgba(0, 0, 0, .26);
      transform: translateY(-1px) scale(1.04);
    }

    #${ICON_ID}:active {
      transform: translateY(0) scale(.96);
    }

    #${PANEL_ID} {
      position: fixed;
      width: min(360px, calc(100vw - 24px));
      max-height: 260px;
      overflow: auto;
      padding: 12px 14px;
      border-radius: 8px;
      background: #fff;
      box-shadow: 0 8px 28px rgba(0, 0, 0, .22);
      color: #202124;
      font: 14px/1.45 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      z-index: 2147483647;
      white-space: pre-wrap;
      opacity: 1;
      transform: translateY(0) scale(1);
      transform-origin: top center;
      will-change: transform, opacity;
    }

    #${PANEL_ID}.selection-translate-muted {
      color: #5f6368;
    }

  `;
  document.documentElement.appendChild(style);
}

function getSelectedText() {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return '';
  }

  return selection.toString().trim();
}

function getSelectionRect() {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const rects = Array.from(selection.getRangeAt(0).getClientRects())
    .filter(rect => rect.width > 0 && rect.height > 0);

  return rects[rects.length - 1] || null;
}

function clamp(value, min, max) {
  if (max < min) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
}

function removeIcon() {
  if (STATE.icon) {
    STATE.icon.remove();
    STATE.icon = null;
  }
}

function hideIcon() {
  if (STATE.icon) {
    STATE.icon.style.display = 'none';
  }
}

function removePanel() {
  stopLoadingText();

  if (STATE.panel) {
    STATE.panel.remove();
    STATE.panel = null;
  }
}

function hidePanel() {
  stopLoadingText();

  if (STATE.panel) {
    STATE.panel.style.display = 'none';
  }
}

function clearUi() {
  STATE.text = '';
  STATE.selectionRect = null;
  STATE.mode = 'idle';
  STATE.panelText = '';
  STATE.panelMuted = false;
  removeIcon();
  removePanel();
}

function isExtensionElement(target) {
  return Boolean(
    target &&
    (
      STATE.icon && STATE.icon.contains(target) ||
      STATE.panel && STATE.panel.contains(target)
    )
  );
}

function playIconAnimation(element) {
  element.getAnimations().forEach(animation => animation.cancel());
  element.animate(
    [
      { opacity: 0, transform: 'translateY(14px) scale(.35) rotate(-14deg)' },
      { opacity: 1, transform: 'translateY(-5px) scale(1.26) rotate(4deg)', offset: .65 },
      { opacity: 1, transform: 'translateY(0) scale(1) rotate(0)' }
    ],
    {
      duration: 420,
      easing: 'cubic-bezier(.16, 1, .3, 1)',
      fill: 'both'
    }
  );
}

function playPanelAnimation(element) {
  element.getAnimations().forEach(animation => animation.cancel());
  element.animate(
    [
      { opacity: 0, transform: 'translateY(18px) scale(.9)', filter: 'blur(3px)' },
      { opacity: 1, transform: 'translateY(-2px) scale(1.02)', filter: 'blur(0)', offset: .75 },
      { opacity: 1, transform: 'translateY(0) scale(1)', filter: 'blur(0)' }
    ],
    {
      duration: 360,
      easing: 'cubic-bezier(.16, 1, .3, 1)',
      fill: 'both'
    }
  );
}

function startLoadingText(panel) {
  stopLoadingText();

  let index = 0;
  const frames = ['Translating', 'Translating.', 'Translating..', 'Translating...'];
  panel.textContent = frames[0];
  STATE.loadingTimer = window.setInterval(() => {
    index = (index + 1) % frames.length;
    panel.textContent = frames[index];
  }, 260);
}

function stopLoadingText() {
  if (STATE.loadingTimer) {
    window.clearInterval(STATE.loadingTimer);
    STATE.loadingTimer = 0;
  }
}

function positionIcon(element, rect) {
  const left = clamp(
    rect.right + 8,
    8,
    window.innerWidth - element.offsetWidth - 8
  );
  const top = clamp(
    rect.bottom + 8,
    8,
    window.innerHeight - element.offsetHeight - 8
  );

  element.style.left = `${left}px`;
  element.style.top = `${top}px`;
}

function positionPanel(element, rect) {
  const margin = 8;
  const panelWidth = element.offsetWidth;
  const panelHeight = element.offsetHeight;
  const belowTop = rect.bottom + margin;
  const aboveTop = rect.top - panelHeight - margin;
  const hasRoomBelow = belowTop + panelHeight <= window.innerHeight - margin;
  const top = hasRoomBelow
    ? belowTop
    : clamp(aboveTop, margin, window.innerHeight - panelHeight - margin);
  const preferredLeft = rect.left + (rect.width / 2) - (panelWidth / 2);
  const left = clamp(preferredLeft, margin, window.innerWidth - panelWidth - margin);

  element.style.left = `${left}px`;
  element.style.top = `${top}px`;
}

function isRectVisible(rect) {
  const tolerance = 4;

  return (
    rect.bottom >= -tolerance &&
    rect.top <= window.innerHeight + tolerance &&
    rect.right >= -tolerance &&
    rect.left <= window.innerWidth + tolerance
  );
}

function refreshPosition() {
  const rect = getSelectionRect();
  const text = getSelectedText();

  if (!rect || !text) {
    clearUi();
    return;
  }

  STATE.text = text;
  STATE.selectionRect = rect;

  if (!isRectVisible(rect)) {
    hideUiOffscreen();
    return;
  }

  if (STATE.mode === 'icon') {
    ensureIcon(rect);
  } else if (STATE.mode === 'panel') {
    ensurePanel(rect);
  }
}

function showIcon() {
  clearTimeout(STATE.hideTimer);
  removePanel();

  const text = getSelectedText();
  const rect = getSelectionRect();

  if (!text || !rect) {
    STATE.text = '';
    removeIcon();
    return;
  }

  STATE.text = text;
  STATE.selectionRect = rect;
  STATE.mode = 'icon';
  ensureIcon(rect, true);
}

function targetLanguage() {
  const language = navigator.language.split('-')[0].toLowerCase();
  return language === 'en' ? 'zh-CN' : language;
}

function translate(text) {
  const url = new URL('https://translate.googleapis.com/translate_a/single');
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('dt', 't');
  url.searchParams.set('sl', 'auto');
  url.searchParams.set('tl', targetLanguage());
  url.searchParams.set('q', text);

  return fetch(url.toString())
    .then(response => response.json())
    .then(response => response[0].map(item => item[0]).join(''));
}

function setPanelText(text, muted = false) {
  if (!STATE.panel) {
    return;
  }

  STATE.panelText = text;
  STATE.panelMuted = muted;
  STATE.panel.textContent = text;
  STATE.panel.classList.toggle('selection-translate-muted', muted);
  stopLoadingText();
}

function ensureIcon(rect, animate = false) {
  installStyles();

  const icon = STATE.icon || document.createElement('button');
  icon.id = ICON_ID;
  icon.type = 'button';
  icon.textContent = 'G';
  icon.title = 'Translate';

  if (!STATE.icon) {
    icon.addEventListener('mousedown', event => event.preventDefault());
    icon.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      showPanel(STATE.selectionRect || rect);
    });
    document.body.appendChild(icon);
    STATE.icon = icon;
  }

  icon.style.display = '';
  positionIcon(icon, rect);

  if (animate) {
    playIconAnimation(icon);
  }
}

function ensurePanel(rect, animate = false) {
  installStyles();

  const panel = STATE.panel || document.createElement('div');
  panel.id = PANEL_ID;

  if (!STATE.panel) {
    panel.className = STATE.panelMuted ? 'selection-translate-muted' : '';
    document.body.appendChild(panel);
    STATE.panel = panel;
  }

  panel.style.display = '';

  if (STATE.panelText) {
    panel.textContent = STATE.panelText;
  } else {
    startLoadingText(panel);
  }

  positionPanel(panel, rect);

  if (animate) {
    requestAnimationFrame(() => playPanelAnimation(panel));
  }

  return panel;
}

function hideUiOffscreen() {
  hideIcon();
  hidePanel();
}

function showPanel(rect) {
  const text = STATE.text;

  if (!text) {
    return;
  }

  removeIcon();
  removePanel();
  STATE.mode = 'panel';
  STATE.panelText = '';
  STATE.panelMuted = true;
  const panel = ensurePanel(rect, true);
  startLoadingText(panel);

  const requestId = ++STATE.requestId;
  translate(text)
    .then(result => {
      if (requestId === STATE.requestId) {
        setPanelText(result || 'No translation returned.', !result);
        refreshPosition();
      }
    })
    .catch(() => {
      if (requestId === STATE.requestId) {
        setPanelText('Translation failed.', true);
        refreshPosition();
      }
    });
}

function scheduleIcon() {
  clearTimeout(STATE.hideTimer);
  STATE.hideTimer = setTimeout(showIcon, 180);
}

document.addEventListener('mouseup', event => {
  if (!isExtensionElement(event.target)) {
    scheduleIcon();
  }
});
document.addEventListener('keyup', event => {
  if (event.key === 'Shift' || event.key.startsWith('Arrow')) {
    scheduleIcon();
  }
});

document.addEventListener('mousedown', event => {
  if (isExtensionElement(event.target)) {
    return;
  }

  clearUi();
});

document.addEventListener('scroll', refreshPosition, true);
window.addEventListener('resize', refreshPosition);
