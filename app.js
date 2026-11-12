(() => {
  'use strict';

  // ---------- Réglages ----------
  const COLORS = [
    { id: 'rouge',  name: 'Rouge',       hex: '#ff2b1c' },
    { id: 'ambre',  name: 'Ambre',       hex: '#ffb000' },
    { id: 'orange', name: 'Orange',      hex: '#ff6a00' },
    { id: 'jaune',  name: 'Jaune doux',  hex: '#e6d37a' },
    { id: 'vert',   name: 'Vert',        hex: '#3ddc5a' },
    { id: 'cyan',   name: 'Cyan',        hex: '#2fd3dd' },
    { id: 'bleu',   name: 'Bleu',        hex: '#4170ff' },
    { id: 'blanc',  name: 'Blanc chaud', hex: '#ffe4c4' },
  ];

  const DEFAULTS = {
    color: 'rouge',
    bright: 25,       // %
    on: '04:30',
    off: '07:00',
    offEnabled: true,
    alarmEnabled: false,
    alarmTime: '06:30',
  };
  const KEY = 'veilleuse.settings.v1';

  function loadSettings() {
    let s = {};
    try { s = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { s = {}; }
    const out = Object.assign({}, DEFAULTS, s);
    if (!COLORS.some(c => c.id === out.color)) out.color = DEFAULTS.color;
    out.bright = Math.min(100, Math.max(3, Number(out.bright) || DEFAULTS.bright));
    if (!/^\d{2}:\d{2}$/.test(out.on)) out.on = DEFAULTS.on;
    if (!/^\d{2}:\d{2}$/.test(out.off)) out.off = DEFAULTS.off;
    out.offEnabled = out.offEnabled !== false;
    out.alarmEnabled = out.alarmEnabled === true;
    if (!/^\d{2}:\d{2}$/.test(out.alarmTime)) out.alarmTime = DEFAULTS.alarmTime;
    return out;
  }
  function saveSettings() {
    try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch (e) { /* stockage indisponible */ }
  }

  let settings = loadSettings();

  // ---------- Éléments ----------
  const $ = (id) => document.getElementById(id);
  const root = document.documentElement;
  const scene = $('scene');
  const clock = $('clock');
  const timeEl = $('time');
  const notice = $('notice');
  const video = $('nosleep');
  const panel = $('settings');
  const colorsEl = $('colors');
  const brightEl = $('bright');
  const brightVal = $('brightVal');
  const onEl = $('onTime');
  const offEl = $('offTime');
  const offEnabledEl = $('offEnabled');
  const offRow = $('offRow');
  const hintEl = $('scheduleHint');
  const closeBtn = $('close');
  const alarmAudio = $('alarm');
  const alarmEnabledEl = $('alarmEnabled');
  const alarmTimeEl = $('alarmTime');
  const alarmTimeRow = $('alarmTimeRow');
  const alarmNameEl = $('alarmName');
  const alarmFileEl = $('alarmFile');
  const alarmTestEl = $('alarmTest');
  const alarmHintEl = $('alarmHint');

  // ---------- Plage horaire ----------
  const toMin = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  };

  function inWindow(date) {
    const now = date.getHours() * 60 + date.getMinutes();
    const on = toMin(settings.on);
    if (!settings.offEnabled) return now >= on;          // jusqu'à minuit
    const off = toMin(settings.off);
    if (on === off) return true;                           // 24 h/24
    if (on < off) return now >= on && now < off;           // ex. 4:30–7:00
    return now >= on || now < off;                         // passe minuit, ex. 22:00–7:00
  }

  // ---------- Affichage ----------
  let peekUntil = 0;
  let peekTimer = null;
  let lastMinuteKey = '';

  function applyStyle() {
    const c = COLORS.find(x => x.id === settings.color) || COLORS[0];
    root.style.setProperty('--digit', c.hex);
    root.style.setProperty('--bright', String(settings.bright / 100));
  }

  function formatTime(d) {
    return d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function render() {
    const d = new Date();
    const key = formatTime(d);
    if (key !== lastMinuteKey) {
      lastMinuteKey = key;
      timeEl.textContent = key;
      shift();
    }
    const visible = inWindow(d) || Date.now() < peekUntil || ringFailed;
    clock.classList.toggle('on', visible);
    clock.classList.toggle('wake', ringFailed);
    checkAlarm(d);
  }

  // Ajuste la taille de police pour remplir l'écran (même largeur pour 4 ou 5 caractères)
  function fit() {
    const probe = document.createElement('span');
    Object.assign(probe.style, {
      position: 'absolute', visibility: 'hidden', fontSize: '100px', whiteSpace: 'nowrap',
      fontFamily: getComputedStyle(timeEl).fontFamily, fontWeight: getComputedStyle(timeEl).fontWeight,
      letterSpacing: '0.02em', fontVariantNumeric: 'tabular-nums',
    });
    probe.textContent = '20:08';
    document.body.appendChild(probe);
    const w = probe.getBoundingClientRect().width || 300;
    const h = probe.getBoundingClientRect().height || 100;
    probe.remove();

    const cs = getComputedStyle(scene);
    const availW = scene.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const availH = scene.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const landscape = availW > availH;
    const size = Math.min(
      (availW * (landscape ? 0.84 : 0.82)) / w * 100,
      (availH * (landscape ? 0.7 : 0.45)) / h * 100
    );
    timeEl.style.fontSize = Math.max(24, Math.floor(size)) + 'px';
    shift();
  }

  // Anti-marquage : petit déplacement aléatoire à chaque minute
  function shift() {
    const vw = scene.clientWidth, vh = scene.clientHeight;
    const r = timeEl.getBoundingClientRect();
    const maxX = Math.max(0, Math.min(14, (vw - r.width) / 2 - 4));
    const maxY = Math.max(0, Math.min(14, (vh - r.height) / 2 - 4));
    const dx = Math.round((Math.random() * 2 - 1) * maxX);
    const dy = Math.round((Math.random() * 2 - 1) * maxY);
    timeEl.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  function peek() {
    peekUntil = Date.now() + 10000;
    clearTimeout(peekTimer);
    peekTimer = setTimeout(render, 10050);
    render();
  }

  // ---------- Écran toujours allumé ----------
  let wakeLock = null;
  let wakePending = null;

  function requestWakeLock() {
    if (!('wakeLock' in navigator)) return Promise.resolve(false);
    if (wakeLock && !wakeLock.released) return Promise.resolve(true);
    if (wakePending) return wakePending;
    wakePending = navigator.wakeLock.request('screen').then((lock) => {
      wakeLock = lock;
      lock.addEventListener('release', () => { wakeLock = null; updateNotice(); });
      return true;
    }).catch(() => {
      wakeLock = null;
      return false;
    }).finally(() => {
      wakePending = null;
      updateNotice();
    });
    return wakePending;
  }

  function videoActive() {
    return !video.paused && !video.ended && video.readyState > 2;
  }

  function startVideo() {
    if (videoActive()) return;
    video.muted = true;
    const p = video.play();
    if (p && p.catch) p.catch(() => {}).then(updateNotice);
  }

  async function keepAwake() {
    if (document.visibilityState !== 'visible') return;
    const ok = await requestWakeLock();
    // Repli : vidéo muette en boucle. Sans geste de l'utilisateur la lecture peut être
    // refusée ; elle sera retentée au prochain toucher.
    if (!ok) startVideo();
    updateNotice();
  }

  function awake() {
    return (wakeLock && !wakeLock.released) || videoActive();
  }

  function updateNotice() {
    let msg = '';
    if (!awake()) msg = 'Écran : veille non bloquée — touchez l’écran';
    else if (ringFailed) msg = 'Réveil — touchez l’écran pour arrêter';
    else if (settings.alarmEnabled && !alarmUnlocked) msg = 'Réveil : touchez l’écran une fois pour l’armer';
    notice.textContent = msg;
    notice.classList.toggle('alarm', !!msg && awake());
    notice.hidden = !msg || !panel.hidden;
  }

  video.addEventListener('playing', updateNotice);
  video.addEventListener('pause', updateNotice);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // Après un passage en arrière-plan, iOS peut couper la session audio : on réarme.
      if (!ringing) alarmUnlocked = false;
      lastMinuteKey = '';
      render();
      keepAwake();
    }
  });

  // ---------- Gestes ----------
  const LONG_MS = 2000;
  let pressTimer = null;
  let pressStart = 0;
  let pressX = 0, pressY = 0;
  let longFired = false;

  function cancelPress() {
    clearTimeout(pressTimer);
    pressTimer = null;
  }

  scene.addEventListener('pointerdown', (e) => {
    if (!panel.hidden) return;
    longFired = false;
    pressStart = Date.now();
    pressX = e.clientX; pressY = e.clientY;
    cancelPress();
    pressTimer = setTimeout(() => { longFired = true; pressTimer = null; openSettings(); }, LONG_MS);
  });

  scene.addEventListener('pointermove', (e) => {
    if (pressTimer && Math.hypot(e.clientX - pressX, e.clientY - pressY) > 30) cancelPress();
  });

  scene.addEventListener('pointerup', () => {
    const wasPending = !!pressTimer;
    cancelPress();
    keepAwake();
    if (ringing) { stopRing(); return; }
    unlockAudio();
    if (longFired) return;
    if (wasPending && Date.now() - pressStart < 700) {
      if (!inWindow(new Date())) peek();
    }
  });
  scene.addEventListener('pointercancel', cancelPress);

  // Pas de zoom, pas de sélection, pas de menu contextuel
  ['gesturestart', 'gesturechange', 'gestureend', 'dblclick', 'contextmenu', 'selectstart']
    .forEach(t => document.addEventListener(t, (e) => {
      if (t === 'selectstart' && e.target.closest && e.target.closest('input')) return;
      e.preventDefault();
    }, { passive: false }));
  document.addEventListener('touchmove', (e) => {
    if (panel.hidden || !panel.contains(e.target)) e.preventDefault();
  }, { passive: false });
  document.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) e.preventDefault();
  }, { passive: false });
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd < 350 && !(e.target.closest && e.target.closest('input, button, label'))) e.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });

  // ---------- Panneau de réglages ----------
  function buildColors() {
    colorsEl.innerHTML = '';
    COLORS.forEach(c => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'swatch';
      b.setAttribute('role', 'radio');
      b.dataset.id = c.id;
      const prev = document.createElement('b');
      prev.textContent = '4:30';
      prev.style.color = c.hex;
      const label = document.createElement('span');
      label.textContent = c.name;
      b.append(prev, label);
      b.addEventListener('click', () => {
        settings.color = c.id;
        saveSettings(); applyStyle(); syncForm();
      });
      colorsEl.appendChild(b);
    });
  }

  function scheduleText() {
    const fmt = (s) => String(Number(s.split(':')[0])) + ':' + s.split(':')[1];
    if (!settings.offEnabled) return `Heure visible de ${fmt(settings.on)} à minuit.`;
    if (settings.on === settings.off) return 'Heure visible en permanence.';
    const night = toMin(settings.on) > toMin(settings.off) ? ' (passe minuit)' : '';
    return `Heure visible de ${fmt(settings.on)} à ${fmt(settings.off)}${night}.`;
  }

  function syncForm() {
    [...colorsEl.children].forEach(b => {
      const sel = b.dataset.id === settings.color;
      b.setAttribute('aria-checked', String(sel));
      b.querySelector('b').style.opacity = String(Math.max(0.35, settings.bright / 100));
    });
    brightEl.value = settings.bright;
    brightVal.textContent = settings.bright + ' %';
    onEl.value = settings.on;
    offEl.value = settings.off;
    offEnabledEl.checked = settings.offEnabled;
    offEl.disabled = !settings.offEnabled;
    offRow.classList.toggle('disabled', !settings.offEnabled);
    hintEl.textContent = scheduleText();
  }

  brightEl.addEventListener('input', () => {
    settings.bright = Number(brightEl.value);
    saveSettings(); applyStyle(); syncForm();
  });
  onEl.addEventListener('change', () => {
    if (/^\d{2}:\d{2}$/.test(onEl.value)) { settings.on = onEl.value; saveSettings(); }
    syncForm(); render();
  });
  offEl.addEventListener('change', () => {
    if (/^\d{2}:\d{2}$/.test(offEl.value)) { settings.off = offEl.value; saveSettings(); }
    syncForm(); render();
  });
  offEnabledEl.addEventListener('change', () => {
    settings.offEnabled = offEnabledEl.checked;
    saveSettings(); syncForm(); render();
  });

  function openSettings() {
    cancelPress();
    syncForm();
    syncAlarmForm();
    panel.hidden = false;
    panel.scrollTop = 0;
    updateNotice();
  }
  function closeSettings() {
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    panel.hidden = true;
    stopTest();
    unlockAudio();
    lastMinuteKey = '';
    render();
    keepAwake();
  }
  closeBtn.addEventListener('click', closeSettings);
  panel.addEventListener('click', () => keepAwake());

  // ---------- Réveil ----------
  // iOS interdit à une page de lancer un son sans geste de l'utilisateur. On « déverrouille »
  // l'élément <audio> lors d'un toucher (lecture d'un silence) ; il peut ensuite jouer seul.
  const SILENCE = 'media/silence.m4a';
  const RING_MAX_MS = 30 * 60 * 1000;
  let alarmUrl = null;
  let alarmFileName = '';
  let alarmUnlocked = false;
  let ringing = false;
  let ringFailed = false;
  let testing = false;
  let ringTimer = null;
  let lastFiredKey = '';

  if (navigator.audioSession) {
    try { navigator.audioSession.type = 'playback'; } catch (e) { /* ignoré */ }
  }

  function idb() {
    return new Promise((resolve, reject) => {
      const r = indexedDB.open('veilleuse', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('files');
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  }
  async function idbGet(key) {
    const db = await idb();
    return new Promise((resolve, reject) => {
      const q = db.transaction('files').objectStore('files').get(key);
      q.onsuccess = () => resolve(q.result);
      q.onerror = () => reject(q.error);
    });
  }
  async function idbPut(key, value) {
    const db = await idb();
    return new Promise((resolve, reject) => {
      const t = db.transaction('files', 'readwrite');
      t.objectStore('files').put(value, key);
      t.oncomplete = () => resolve();
      t.onerror = () => reject(t.error);
    });
  }

  function guessType(name) {
    const ext = (name.split('.').pop() || '').toLowerCase();
    return { mp3: 'audio/mpeg', m4a: 'audio/mp4', aac: 'audio/aac', wav: 'audio/wav', caf: 'audio/x-caf' }[ext] || 'audio/mpeg';
  }

  function setAlarmSound(buf, type, name) {
    if (alarmUrl) URL.revokeObjectURL(alarmUrl);
    alarmUrl = URL.createObjectURL(new Blob([buf], { type }));
    alarmFileName = name;
  }

  async function loadAlarmSound() {
    try {
      const rec = await idbGet('alarm');
      if (rec && rec.data) setAlarmSound(rec.data, rec.type, rec.name);
    } catch (e) { /* pas de son enregistré */ }
    syncAlarmForm();
  }

  function unlockAudio() {
    if (alarmUnlocked || ringing || testing || !settings.alarmEnabled) return;
    alarmAudio.loop = false;
    alarmAudio.src = SILENCE;
    const p = alarmAudio.play();
    if (p && p.then) {
      p.then(() => { alarmUnlocked = true; updateNotice(); }).catch(() => {});
    }
  }

  function checkAlarm(d) {
    if (!settings.alarmEnabled || ringing) return;
    const hm = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    const key = d.toDateString() + ' ' + hm;
    if (hm === settings.alarmTime && key !== lastFiredKey) {
      lastFiredKey = key;
      ring();
    }
  }

  function ring() {
    stopTest();
    ringing = true;
    clearTimeout(ringTimer);
    ringTimer = setTimeout(stopRing, RING_MAX_MS);
    const fail = () => { ringFailed = true; updateNotice(); render(); };
    if (!alarmUrl) { fail(); return; }
    alarmAudio.src = alarmUrl;
    alarmAudio.loop = true;
    const p = alarmAudio.play();
    if (p && p.catch) p.catch(fail);
    syncAlarmForm();
  }

  function stopRing() {
    ringing = false;
    ringFailed = false;
    clearTimeout(ringTimer);
    alarmAudio.pause();
    alarmAudio.loop = false;
    updateNotice();
    syncAlarmForm();
    render();
  }

  function stopTest() {
    if (!testing) return;
    testing = false;
    alarmAudio.pause();
    syncAlarmForm();
  }

  alarmAudio.addEventListener('ended', () => { if (testing) stopTest(); });

  function syncAlarmForm() {
    alarmEnabledEl.checked = settings.alarmEnabled;
    alarmTimeEl.value = settings.alarmTime;
    alarmTimeEl.disabled = !settings.alarmEnabled;
    alarmTimeRow.classList.toggle('disabled', !settings.alarmEnabled);
    alarmNameEl.textContent = alarmFileName || 'Aucun';
    alarmTestEl.textContent = (testing || ringing) ? 'Arrêter' : 'Écouter';
    alarmTestEl.disabled = !alarmUrl && !ringing;
    let hint;
    if (!settings.alarmEnabled) hint = 'Réveil désactivé.';
    else if (!alarmUrl) hint = 'Choisissez un fichier audio (app Fichiers) : il est copié dans l’app et fonctionne hors ligne.';
    else hint = 'Le son démarre à ' + Number(settings.alarmTime.split(':')[0]) + ':' + settings.alarmTime.split(':')[1] +
      ' et tourne en boucle (30 min max). Touchez l’écran pour l’arrêter. Le soir, touchez l’écran une fois pour armer le réveil. Volume : boutons de l’iPhone.';
    alarmHintEl.textContent = hint;
  }

  alarmEnabledEl.addEventListener('change', () => {
    settings.alarmEnabled = alarmEnabledEl.checked;
    saveSettings();
    if (settings.alarmEnabled) unlockAudio();
    syncAlarmForm(); updateNotice();
  });
  alarmTimeEl.addEventListener('change', () => {
    if (/^\d{2}:\d{2}$/.test(alarmTimeEl.value)) { settings.alarmTime = alarmTimeEl.value; saveSettings(); }
    lastFiredKey = '';
    syncAlarmForm();
  });
  alarmFileEl.addEventListener('change', async () => {
    const f = alarmFileEl.files && alarmFileEl.files[0];
    if (!f) return;
    try {
      const buf = await f.arrayBuffer();
      const type = f.type || guessType(f.name);
      setAlarmSound(buf, type, f.name);
      await idbPut('alarm', { data: buf, type, name: f.name });
      syncAlarmForm();
    } catch (e) {
      syncAlarmForm();
      alarmHintEl.textContent = 'Impossible d’enregistrer ce fichier. Essayez un mp3 ou m4a plus court.';
    }
    alarmFileEl.value = '';
  });
  alarmTestEl.addEventListener('click', () => {
    if (ringing) { stopRing(); return; }
    if (testing) { stopTest(); return; }
    if (!alarmUrl) return;
    testing = true;
    alarmAudio.loop = false;
    alarmAudio.src = alarmUrl;
    const p = alarmAudio.play();
    if (p && p.then) {
      p.then(() => { alarmUnlocked = true; updateNotice(); }).catch(() => { testing = false; syncAlarmForm(); });
    }
    syncAlarmForm();
  });

  // ---------- Démarrage ----------
  applyStyle();
  loadAlarmSound();
  buildColors();
  syncForm();
  render();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit); else fit();
  fit();

  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', () => setTimeout(fit, 300));
  setInterval(render, 1000);
  keepAwake();
  updateNotice();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }
})();
