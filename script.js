/* ============================================================
   WAFFLE SKIN ASSETS (Medium Detail SVGs)
   ============================================================ */
const BUTTER_ICON = `
<svg viewBox="0 0 100 100" class="waffle-icon">
    <path d="M 15 70 Q 25 90 50 85 T 85 70 Z" fill="#f4d35e" opacity="0.9"/>
    <rect width="70" height="70" x="15" y="15" rx="8" fill="#f4d35e" stroke="#c09e2e" stroke-width="3"/>
    <rect width="50" height="50" x="20" y="20" rx="4" fill="#fdf0b0"/>
</svg>`;

const BLUEBERRY_ICON = `
<svg viewBox="0 0 100 100" class="waffle-icon">
    <path d="M 50 35 Q 70 15 80 30 Q 60 50 50 35 Z" fill="#4d964d" stroke="#2e662e" stroke-width="2"/>
    <circle cx="65" cy="65" r="18" fill="#3b5e9d" stroke="#203a70" stroke-width="2"/>
    <circle cx="45" cy="50" r="22" fill="#4a73b8" stroke="#203a70" stroke-width="2"/>
</svg>`;

// ============================================================
//  CONFETTI ENGINE
// ============================================================
const ConfettiEngine = (() => {
  let animId = null;
  let canvas = null;
  let ctx = null;
  let particles = [];

  const COLORS = [
    "#ece5df",
    "#e74c3c",
    "#3498db",
    "#f1c40f",
    "#2ecc71",
    "#d1c8c3",
    "#ffffff",
  ];

  function createParticle(w, h) {
    return {
      x: Math.random() * w,
      y: -10 - Math.random() * 120,
      vx: (Math.random() - 0.5) * 3,
      vy: 2.5 + Math.random() * 3.5,
      rot: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.2,
      w: 6 + Math.random() * 8,
      h: 3 + Math.random() * 5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: 0.9 + Math.random() * 0.1,
      shape: Math.random() < 0.3 ? "circle" : "rect",
      gravity: 0.06 + Math.random() * 0.04,
      oscillate: (Math.random() - 0.5) * 0.015,
    };
  }

  function spawn(count) {
    const w = canvas.width,
      h = canvas.height;
    for (let i = 0; i < count; i++) particles.push(createParticle(w, h));
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const h = canvas.height;
    let alive = false;

    for (const p of particles) {
      p.vy += p.gravity;
      p.vx += p.oscillate;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.rotV;

      if (p.y > h * 0.75) p.alpha -= 0.012;
      if (p.alpha <= 0) continue;
      alive = true;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;

      if (p.shape === "circle") {
        ctx.beginPath();
        ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const scaleY = Math.abs(Math.cos(p.rot));
        ctx.fillRect(-p.w / 2, (-p.h / 2) * scaleY, p.w, p.h * scaleY);
      }
      ctx.restore();
    }
    particles = particles.filter((p) => p.alpha > 0);

    if (alive) {
      animId = requestAnimationFrame(draw);
    } else {
      stop();
    }
  }

  return {
    start(duration = 4000) {
      this.stop();
      canvas = document.createElement("canvas");
      canvas.id = "confetti-canvas";
      canvas.style.cssText = [
        "position:fixed",
        "inset:0",
        "width:100vw",
        "height:100vh",
        "pointer-events:none",
        "z-index:99999",
      ].join(";");
      document.body.appendChild(canvas);

      ctx = canvas.getContext("2d");
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = [];

      spawn(160);
      const trickle = setInterval(() => spawn(18), 220);
      setTimeout(() => clearInterval(trickle), duration);
      animId = requestAnimationFrame(draw);
    },
    stop() {
      if (animId) {
        cancelAnimationFrame(animId);
        animId = null;
      }
      if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
      canvas = null;
      ctx = null;
      particles = [];
    },
  };
})();

// ============================================================
//  SOUND ENGINE
// ============================================================
const SoundEngine = (() => {
  let ctx = null;
  let soundEnabled = true;

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function playTone({
    freq = 440,
    type = "sine",
    gain = 0.3,
    duration = 0.15,
    attack = 0.005,
    decay = 0.05,
    release = 0.1,
    detune = 0,
  }) {
    if (!soundEnabled) return;
    const c = getCtx();
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.connect(g);
    g.connect(c.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime);
    osc.detune.setValueAtTime(detune, c.currentTime);
    g.gain.setValueAtTime(0, c.currentTime);
    g.gain.linearRampToValueAtTime(gain, c.currentTime + attack);
    g.gain.linearRampToValueAtTime(gain * 0.7, c.currentTime + attack + decay);
    g.gain.linearRampToValueAtTime(0, c.currentTime + duration + release);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration + release + 0.05);
  }

  function playNoise({ gain = 0.15, duration = 0.08, bandpass = null }) {
    if (!soundEnabled) return;
    const c = getCtx();
    const buf = c.createBuffer(1, c.sampleRate * duration, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const g = c.createGain();
    g.gain.setValueAtTime(gain, c.currentTime);
    g.gain.linearRampToValueAtTime(0, c.currentTime + duration);
    if (bandpass) {
      const f = c.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = bandpass;
      f.Q.value = 1.5;
      src.connect(f);
      f.connect(g);
    } else {
      src.connect(g);
    }
    g.connect(c.destination);
    src.start(c.currentTime);
  }

  function seq(notes, interval = 0.12) {
    notes.forEach((n, i) => setTimeout(() => playTone(n), i * interval * 1000));
  }

  return {
    isSoundEnabled: () => soundEnabled,
    toggle() {
      soundEnabled = !soundEnabled;
      if (soundEnabled)
        seq(
          [
            {
              freq: 440,
              type: "sine",
              gain: 0.13,
              duration: 0.09,
              release: 0.08,
            },
            {
              freq: 660,
              type: "sine",
              gain: 0.14,
              duration: 0.11,
              release: 0.1,
            },
          ],
          0.11,
        );
      return soundEnabled;
    },
    menuClick() {
      playTone({
        freq: 440,
        type: "sine",
        gain: 0.1,
        duration: 0.07,
        attack: 0.008,
        decay: 0.03,
        release: 0.07,
      });
      playNoise({ gain: 0.02, duration: 0.04, bandpass: 700 });
    },
    playerPlace() {
      playTone({
        freq: 392,
        type: "triangle",
        gain: 0.18,
        duration: 0.11,
        attack: 0.006,
        decay: 0.04,
        release: 0.12,
      });
      playNoise({ gain: 0.02, duration: 0.05, bandpass: 900 });
    },
    botPlace() {
      playTone({
        freq: 262,
        type: "sine",
        gain: 0.16,
        duration: 0.13,
        attack: 0.01,
        decay: 0.05,
        release: 0.12,
      });
      playNoise({ gain: 0.02, duration: 0.06, bandpass: 450 });
    },
    roundWin() {
      seq(
        [
          { freq: 392, type: "sine", gain: 0.2, duration: 0.13, release: 0.12 },
          { freq: 523, type: "sine", gain: 0.2, duration: 0.13, release: 0.12 },
          {
            freq: 659,
            type: "sine",
            gain: 0.23,
            duration: 0.22,
            release: 0.18,
          },
        ],
        0.13,
      );
    },
    roundLose() {
      seq(
        [
          {
            freq: 370,
            type: "sine",
            gain: 0.16,
            duration: 0.13,
            release: 0.12,
          },
          {
            freq: 311,
            type: "sine",
            gain: 0.15,
            duration: 0.13,
            release: 0.12,
          },
          {
            freq: 247,
            type: "triangle",
            gain: 0.16,
            duration: 0.24,
            release: 0.18,
          },
        ],
        0.14,
      );
    },
    roundDraw() {
      seq(
        [
          {
            freq: 349,
            type: "sine",
            gain: 0.13,
            duration: 0.15,
            release: 0.12,
          },
          {
            freq: 349,
            type: "sine",
            gain: 0.1,
            duration: 0.13,
            release: 0.12,
            detune: 12,
          },
        ],
        0.18,
      );
    },
    matchWin() {
      seq(
        [
          { freq: 392, type: "sine", gain: 0.2, duration: 0.13, release: 0.1 },
          { freq: 523, type: "sine", gain: 0.2, duration: 0.13, release: 0.1 },
          { freq: 659, type: "sine", gain: 0.2, duration: 0.13, release: 0.1 },
          { freq: 784, type: "sine", gain: 0.25, duration: 0.3, release: 0.22 },
        ],
        0.13,
      );
      setTimeout(
        () =>
          seq(
            [
              {
                freq: 196,
                type: "triangle",
                gain: 0.12,
                duration: 0.15,
                release: 0.12,
              },
              {
                freq: 247,
                type: "triangle",
                gain: 0.12,
                duration: 0.15,
                release: 0.12,
              },
              {
                freq: 311,
                type: "triangle",
                gain: 0.12,
                duration: 0.15,
                release: 0.12,
              },
              {
                freq: 392,
                type: "triangle",
                gain: 0.14,
                duration: 0.32,
                release: 0.22,
              },
            ],
            0.13,
          ),
        40,
      );
    },
    matchLose() {
      seq(
        [
          {
            freq: 294,
            type: "sine",
            gain: 0.16,
            duration: 0.18,
            release: 0.14,
          },
          {
            freq: 262,
            type: "sine",
            gain: 0.14,
            duration: 0.18,
            release: 0.14,
          },
          {
            freq: 220,
            type: "triangle",
            gain: 0.13,
            duration: 0.24,
            release: 0.18,
          },
          {
            freq: 175,
            type: "triangle",
            gain: 0.16,
            duration: 0.5,
            release: 0.38,
          },
        ],
        0.18,
      );
      setTimeout(
        () =>
          playTone({
            freq: 65,
            type: "sine",
            gain: 0.09,
            duration: 0.75,
            attack: 0.1,
            release: 0.55,
          }),
        420,
      );
    },
  };
})();

// ============================================================
//  BGM TRACK LIST
// ============================================================
const TRACKS = [
  { name: "BEACH LO-FI", file: "artmylife-beach-lo-fi-relax-477166.mp3" },
  { name: "AVENTURE", file: "aventure-lofi-chill-nostalgic-469629.mp3" },
  { name: "PULSEBOX", file: "pulsebox-lofi-smooth-522876.mp3" },
];

let currentTrackIndex = 0;

const AudioManager = (() => {
  const bgAudio = document.getElementById("bg-music");
  let bgmVolume = 35;
  let sfxVolume = 100;
  let bgmEnabled = true;
  let sfxEnabled = true;
  let bgStarted = false;

  function applyBGM() {
    bgAudio.volume = bgmEnabled ? bgmVolume / 100 : 0;
  }

  function syncToggleUI() {
    const mEl = document.getElementById("music-control");
    if (mEl) {
      mEl.querySelector("i").className = bgmEnabled
        ? "fas fa-music"
        : "fas fa-slash";
      mEl.querySelector("span").innerHTML = bgmEnabled
        ? "MUSIC<br>ON"
        : "MUSIC<br>OFF";
    }
    const sEl = document.getElementById("sound-control");
    if (sEl) {
      sEl.querySelector("i").className = sfxEnabled
        ? "fas fa-volume-up"
        : "fas fa-volume-mute";
      sEl.querySelector("span").innerHTML = sfxEnabled
        ? "SOUND<br>ON"
        : "SOUND<br>OFF";
    }
  }

  return {
    tryStart() {
      if (!bgStarted && bgmEnabled) {
        bgAudio
          .play()
          .then(() => {
            bgStarted = true;
          })
          .catch(() => {});
      }
    },
    setBGM(val) {
      bgmVolume = parseInt(val);
      bgmEnabled = bgmVolume > 0;
      applyBGM();
      const v = document.getElementById("bgm-val");
      if (v) v.textContent = bgmVolume;
      syncToggleUI();
    },
    setSFX(val) {
      sfxVolume = parseInt(val);
      sfxEnabled = sfxVolume > 0;
      if (sfxEnabled !== SoundEngine.isSoundEnabled()) SoundEngine.toggle();
      const v = document.getElementById("sfx-val");
      if (v) v.textContent = sfxVolume;
      syncToggleUI();
    },
    toggleBGM() {
      bgmEnabled = !bgmEnabled;
      if (bgmEnabled) {
        bgmVolume = bgmVolume === 0 ? 35 : bgmVolume;
        if (!bgStarted) {
          bgAudio
            .play()
            .then(() => {
              bgStarted = true;
            })
            .catch(() => {});
        } else {
          bgAudio.play().catch(() => {});
        }
      } else {
        bgAudio.pause();
      }
      applyBGM();
      const s = document.getElementById("bgm-slider");
      if (s) s.value = bgmEnabled ? bgmVolume : 0;
      const v = document.getElementById("bgm-val");
      if (v) v.textContent = bgmEnabled ? bgmVolume : 0;
      return bgmEnabled;
    },
    toggleSFX() {
      sfxEnabled = !sfxEnabled;
      sfxVolume = sfxEnabled ? (sfxVolume === 0 ? 100 : sfxVolume) : 0;
      if (sfxEnabled !== SoundEngine.isSoundEnabled()) SoundEngine.toggle();
      const s = document.getElementById("sfx-slider");
      if (s) s.value = sfxVolume;
      const v = document.getElementById("sfx-val");
      if (v) v.textContent = sfxVolume;
      return sfxEnabled;
    },
    resetDefaults() {
      bgmVolume = 35;
      bgmEnabled = true;
      sfxVolume = 100;
      sfxEnabled = true;
      applyBGM();
      if (!SoundEngine.isSoundEnabled()) SoundEngine.toggle();
      const bs = document.getElementById("bgm-slider");
      if (bs) bs.value = 35;
      const bv = document.getElementById("bgm-val");
      if (bv) bv.textContent = 35;
      const ss = document.getElementById("sfx-slider");
      if (ss) ss.value = 100;
      const sv = document.getElementById("sfx-val");
      if (sv) sv.textContent = 100;
      if (currentTrackIndex !== 0) this.selectTrack(0, false);
      syncHighlights();
    },
    selectTrack(idx, playSfx = true) {
      if (idx < 0 || idx >= TRACKS.length) return;
      currentTrackIndex = idx;
      const wasEnabled = bgmEnabled;
      bgAudio.pause();
      bgAudio.src = TRACKS[idx].file;
      bgAudio.load();
      if (bgStarted && wasEnabled) {
        bgAudio.volume = bgmVolume / 100;
        bgAudio.play().catch(() => {});
      }
      if (playSfx) SoundEngine.menuClick();
      syncHighlights();
    },
  };
})();

function toggleAudio(type) {
  if (type === "sound") {
    const isOn = AudioManager.toggleSFX();
    const el = document.getElementById("sound-control");
    el.querySelector("i").className = isOn
      ? "fas fa-volume-up"
      : "fas fa-volume-mute";
    el.querySelector("span").innerHTML = isOn ? "SOUND<br>ON" : "SOUND<br>OFF";
  } else if (type === "music") {
    const isOn = AudioManager.toggleBGM();
    const el = document.getElementById("music-control");
    el.querySelector("i").className = isOn ? "fas fa-music" : "fas fa-slash";
    el.querySelector("span").innerHTML = isOn ? "MUSIC<br>ON" : "MUSIC<br>OFF";
  }
}

// ============================================================
//  GAME STATE
// ============================================================
let currentSize = 3;
let currentDifficulty = "Hard";
let firstTurnChoice = "Player";
let currentBlur = 6;
let winCondition = 3;
let currentSkin = "default";
let previewSize = 3; // Untuk live preview skin
let gameMode = "bot";  // "bot" | "local"
let board = [],
  pScore = 0,
  bScore = 0,
  isPlayerTurn = true,
  gameActive = false;
let prevBoard = [];
let _prevScreen = "lobby-screen";

function showScreen(screenId) {
  SoundEngine.menuClick();
  const active = document.querySelector(".ui-container:not(.hidden)");
  if (active && screenId === "credits-screen") _prevScreen = active.id;
  if (screenId !== "result-screen") ConfettiEngine.stop();
  document
    .querySelectorAll(".ui-container")
    .forEach((el) => el.classList.add("hidden"));
  document.getElementById(screenId).classList.remove("hidden");

  const videoBg = document.getElementById("bg-video");
  if (screenId === "lobby-screen") {
    videoBg.classList.remove("video-blurred");
  } else {
    videoBg.classList.add("video-blurred");
  }
  syncHighlights();
}

function openCredits() {
  showScreen("credits-screen");
}
function closeCredits() {
  showScreen(_prevScreen);
}

function syncHighlights() {
  document
    .querySelectorAll("#blur-opts .menu-btn")
    .forEach((b) => b.classList.remove("selected-opt"));
  if (currentBlur === 2)
    document
      .querySelector("#blur-opts .menu-btn:nth-child(1)")
      .classList.add("selected-opt");
  if (currentBlur === 6)
    document
      .querySelector("#blur-opts .menu-btn:nth-child(2)")
      .classList.add("selected-opt");
  if (currentBlur === 12)
    document
      .querySelector("#blur-opts .menu-btn:nth-child(3)")
      .classList.add("selected-opt");

  document
    .querySelectorAll("#size-opts .menu-btn")
    .forEach((b) => b.classList.remove("selected-opt"));
  if (currentSize === 3)
    document
      .querySelector("#size-opts .menu-btn:nth-child(1)")
      .classList.add("selected-opt");
  if (currentSize === 5)
    document
      .querySelector("#size-opts .menu-btn:nth-child(2)")
      .classList.add("selected-opt");
  if (currentSize === 6)
    document
      .querySelector("#size-opts .menu-btn:nth-child(3)")
      .classList.add("selected-opt");

  document
    .querySelectorAll("#diff-opts .menu-btn")
    .forEach((b) => b.classList.remove("selected-opt"));
  if (currentDifficulty === "Easy")
    document
      .querySelector("#diff-opts .menu-btn:nth-child(1)")
      .classList.add("selected-opt");
  if (currentDifficulty === "Medium")
    document
      .querySelector("#diff-opts .menu-btn:nth-child(2)")
      .classList.add("selected-opt");
  if (currentDifficulty === "Hard")
    document
      .querySelector("#diff-opts .menu-btn:nth-child(3)")
      .classList.add("selected-opt");

  document
    .querySelectorAll("#turn-opts .menu-btn")
    .forEach((b) => b.classList.remove("selected-opt"));
  if (firstTurnChoice === "Player")
    document
      .querySelector("#turn-opts .menu-btn:nth-child(1)")
      .classList.add("selected-opt");
  if (firstTurnChoice === "Bot")
    document
      .querySelector("#turn-opts .menu-btn:nth-child(2)")
      .classList.add("selected-opt");

  document
    .querySelectorAll("#track-opts .menu-btn")
    .forEach((b) => b.classList.remove("selected-opt"));
  const activeTrackBtn = document.querySelector(
    `#track-opts .menu-btn:nth-child(${currentTrackIndex + 1})`,
  );
  if (activeTrackBtn) activeTrackBtn.classList.add("selected-opt");

  const skinOpts = document.querySelectorAll("#app-skin-opts .menu-btn");
  if (skinOpts.length > 0) {
    skinOpts.forEach((b) => b.classList.remove("selected-opt"));
    if (currentSkin === "default") skinOpts[0].classList.add("selected-opt");
    if (currentSkin === "neon") skinOpts[1].classList.add("selected-opt");
    if (currentSkin === "waffle") skinOpts[2].classList.add("selected-opt");
  }

  const prevOpts = document.querySelectorAll("#app-size-opts .menu-btn");
  if (prevOpts.length > 0) {
    prevOpts.forEach((b) => b.classList.remove("selected-opt"));
    if (previewSize === 3) prevOpts[0].classList.add("selected-opt");
    if (previewSize === 5) prevOpts[1].classList.add("selected-opt");
    if (previewSize === 6) prevOpts[2].classList.add("selected-opt");
  }

  // ── Mode selection highlights ─────────────────────────────
  document
    .querySelectorAll("#mode-opts .menu-btn")
    .forEach((b) => b.classList.remove("selected-opt"));
  const modeIdx = gameMode === "bot" ? 0 : 1;
  const modeBtn = document.querySelector(
    `#mode-opts .menu-btn:nth-child(${modeIdx + 1})`,
  );
  if (modeBtn) modeBtn.classList.add("selected-opt");

  // ── Local turn highlights ─────────────────────────────────
  document
    .querySelectorAll("#turn-local-opts .menu-btn")
    .forEach((b) => b.classList.remove("selected-opt"));
  if (firstTurnChoice === "Player1")
    document
      .querySelector("#turn-local-opts .menu-btn:nth-child(1)")
      ?.classList.add("selected-opt");
  if (firstTurnChoice === "Player2")
    document
      .querySelector("#turn-local-opts .menu-btn:nth-child(2)")
      ?.classList.add("selected-opt");
}

// ============================================================
//  APPEARANCE SETTINGS & PREVIEW LOGIC
// ============================================================
function setBlur(amount) {
  SoundEngine.menuClick();
  currentBlur = amount;
  document.documentElement.style.setProperty("--blur-amount", amount + "px");
  syncHighlights();
}

function setSkin(skin) {
  SoundEngine.menuClick();
  currentSkin = skin;

  // Update main game board if exists
  const boardEl = document.getElementById("board");
  if (boardEl) {
    boardEl.classList.remove("skin-default", "skin-neon", "skin-waffle");
    boardEl.classList.add("skin-" + skin);
  }

  syncHighlights();
  renderPreview(); // Update preview visual
}

function setPreviewSize(size) {
  SoundEngine.menuClick();
  previewSize = size;
  syncHighlights();
  renderPreview();
}

function renderPreview() {
  const previewEl = document.getElementById("preview-board");
  if (!previewEl) return;

  previewEl.innerHTML = "";
  previewEl.className = "board skin-" + currentSkin; // Terapkan skin ke preview

  // Ukuran preview board sedikit lebih kecil dari main board agar pas di menu (320px vs 450px)
  const maxPreview = 320;
  const cellSize = Math.floor(maxPreview / previewSize);

  previewEl.style.gridTemplateColumns = `repeat(${previewSize}, ${cellSize}px)`;
  previewEl.style.gridTemplateRows = `repeat(${previewSize}, ${cellSize}px)`;

  for (let i = 0; i < previewSize * previewSize; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.style.fontSize = `${Math.floor(cellSize * 0.6)}px`;

    let piece = null;
    // Bikin pattern buatan untuk ditunjukkan di preview
    if (i === 0 || i === previewSize + 2 || i === previewSize * 2 + 1)
      piece = "X";
    if (i === 1 || i === previewSize || i === previewSize * 2 + 2) piece = "O";

    if (piece) {
      if (currentSkin === "waffle") {
        cell.innerHTML = piece === "X" ? BUTTER_ICON : BLUEBERRY_ICON;
      } else {
        cell.innerText = piece;
      }
      cell.classList.add(piece.toLowerCase());
    }

    previewEl.appendChild(cell);
  }
}

function resetDefaults() {
  SoundEngine.menuClick();
  setBlur(6);
  setSkin("default");
  setPreviewSize(3);
  AudioManager.resetDefaults();
}

// ============================================================
//  MAIN GAME FLOW
// ============================================================
function enterGame() {
  const splash = document.getElementById("splash-screen");
  splash.classList.add("fade-out");
  setTimeout(() => splash.remove(), 800);
  AudioManager.tryStart();
}

function chooseSize(size) {
  SoundEngine.menuClick();
  currentSize = size;
  syncHighlights();
  // Now goes to mode selection first
  setTimeout(() => showScreen("mode-screen"), 300);
}

// ── New: choose game mode ─────────────────────────────────────
function chooseMode(mode) {
  SoundEngine.menuClick();
  gameMode = mode;
  syncHighlights();
  if (mode === "bot") {
    setTimeout(() => showScreen("difficulty-screen"), 300);
  } else {
    // Local 2-player: set winCondition here (no difficulty screen)
    winCondition = currentSize === 3 ? 3 : 4;
    setTimeout(() => showScreen("turn-screen-local"), 300);
  }
}

function setDifficulty(diff) {
  SoundEngine.menuClick();
  currentDifficulty = diff;
  winCondition = currentSize === 3 ? 3 : 4;
  syncHighlights();
  setTimeout(() => showScreen("turn-screen"), 300);
}

function setFirstTurn(choice) {
  SoundEngine.menuClick();
  firstTurnChoice = choice;
  document.getElementById("game-tip").innerText =
    `Tip: Get ${winCondition} in a row to win!`;
  pScore = 0;
  bScore = 0;
  updateScoreboard();
  syncHighlights();
  setTimeout(() => {
    showScreen("game-screen");
    startRound();
  }, 400);
}

// ── New: 2-player local first turn ───────────────────────────
function setFirstTurnLocal(choice) {
  SoundEngine.menuClick();
  firstTurnChoice = choice; // "Player1" | "Player2"
  document.getElementById("game-tip").innerText =
    `Tip: Get ${winCondition} in a row to win!`;
  pScore = 0;
  bScore = 0;
  updateScoreboard();
  syncHighlights();
  setTimeout(() => {
    showScreen("game-screen");
    startRound();
  }, 400);
}

function startRound() {
  board = Array(currentSize * currentSize).fill(null);
  prevBoard = Array(currentSize * currentSize).fill(null);
  gameActive = true;

  if (gameMode === "local") {
    // Player 1 = X, Player 2 = O
    isPlayerTurn = firstTurnChoice !== "Player2";
    renderBoard();
    const bannerText = isPlayerTurn ? "PLAYER 1 TURN" : "PLAYER 2 TURN";
    updateLocalStatus(); // sets round-status text + scoreboard highlight
    setTimeout(() => showTurnBanner(bannerText), 200);
  } else {
    isPlayerTurn = firstTurnChoice === "Player";
    renderBoard();
    if (!isPlayerTurn) {
      document.getElementById("round-status").innerText = "Bot is thinking...";
      document.getElementById("round-status").className = "";
      setTimeout(botMove, getThinkingDelay());
    } else {
      document.getElementById("round-status").innerText =
        `Your turn! (${currentDifficulty})`;
      document.getElementById("round-status").className = "";
    }
  }
}

function renderBoard() {
  const boardEl = document.getElementById("board");
  boardEl.innerHTML = "";
  boardEl.classList.remove("skin-default", "skin-neon", "skin-waffle");
  boardEl.classList.add("skin-" + currentSkin);

  const maxBoardSize = 450;
  const cellSize = Math.floor(maxBoardSize / currentSize);
  boardEl.style.gridTemplateColumns = `repeat(${currentSize}, ${cellSize}px)`;
  boardEl.style.gridTemplateRows = `repeat(${currentSize}, ${cellSize}px)`;

  for (let i = 0; i < board.length; i++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");

    cell.style.fontSize = `${Math.floor(cellSize * 0.6)}px`;

    if (board[i]) {
      if (currentSkin === "waffle") {
        if (board[i] === "X") {
          cell.innerHTML = BUTTER_ICON;
        } else if (board[i] === "O") {
          cell.innerHTML = BLUEBERRY_ICON;
        }
      } else {
        cell.innerText = board[i];
      }

      cell.classList.add(board[i].toLowerCase());
      if (board[i] !== prevBoard[i]) {
        cell.classList.add("just-placed");
        cell.addEventListener(
          "animationend",
          () => cell.classList.remove("just-placed"),
          { once: true },
        );
      }
    }
    cell.onclick = () => handlePlayerMove(i);
    boardEl.appendChild(cell);
  }
  prevBoard = [...board];
}

function getThinkingDelay() {
  if (currentDifficulty === "Easy") return 1500;
  if (currentDifficulty === "Medium") return 800;
  return 300;
}

function handlePlayerMove(index) {
  if (!gameActive || board[index]) return;

  if (gameMode === "local") {
    // Both players click — piece depends on whose turn it is
    const piece = isPlayerTurn ? "X" : "O";
    board[index] = piece;
    SoundEngine.playerPlace();
    renderBoard();
    if (checkWin(piece)) return endRound(piece);
    if (board.every((cell) => cell !== null)) return endRound("DRAW");
    // Toggle turn
    isPlayerTurn = !isPlayerTurn;
    updateLocalStatus(); // sets round-status text + scoreboard highlight
    setTimeout(
      () => showTurnBanner(isPlayerTurn ? "PLAYER 1 TURN" : "PLAYER 2 TURN"),
      120,
    );
  } else {
    // Bot mode — only player (X) can click
    if (!isPlayerTurn) return;
    board[index] = "X";
    SoundEngine.playerPlace();
    renderBoard();
    if (checkWin("X")) return endRound("X");
    if (board.every((cell) => cell !== null)) return endRound("DRAW");
    isPlayerTurn = false;
    document.getElementById("round-status").innerText = "Bot is thinking...";
    document.getElementById("round-status").className = "";
    setTimeout(botMove, getThinkingDelay());
  }
}

function botMove() {
  if (!gameActive) return;
  let bestMove;
  const useTactic =
    currentDifficulty === "Hard" ||
    (currentDifficulty === "Medium" && Math.random() > 0.4);

  if (useTactic) {
    bestMove = currentSize === 3 ? getBestMoveMinimax() : getHeuristicMove();
  } else {
    if (currentDifficulty === "Medium") {
      for (let i = 0; i < board.length; i++) {
        if (board[i] === null) {
          board[i] = "X";
          if (checkWin("X")) {
            board[i] = null;
            bestMove = i;
            break;
          }
          board[i] = null;
        }
      }
    }
    if (bestMove === undefined) bestMove = getRandomMove();
  }

  if (bestMove === undefined || bestMove === null) bestMove = getRandomMove();
  board[bestMove] = "O";
  SoundEngine.botPlace();
  renderBoard();
  if (checkWin("O")) return endRound("O");
  if (board.every((cell) => cell !== null)) return endRound("DRAW");
  isPlayerTurn = true;
  const rs = document.getElementById("round-status");
  rs.innerText = `Your turn! (${currentDifficulty})`;
  rs.className = "";
}

function endRound(winner) {
  gameActive = false;
  const rs = document.getElementById("round-status");

  if (gameMode === "local") {
    // ── LOCAL 2-PLAYER round end ──────────────────────────────
    if (winner === "X") {
      pScore++;
      SoundEngine.roundWin();
      rs.className = "status-p1";
      rs.innerText = "PLAYER 1 wins this round!";
    } else if (winner === "O") {
      bScore++;
      SoundEngine.roundWin(); // both are players — both celebrate
      rs.className = "status-p2";
      rs.innerText = "PLAYER 2 wins this round!";
    } else {
      SoundEngine.roundDraw();
      rs.className = "";
      rs.innerText = "Round Draw!";
    }
  } else {
    // ── BOT MODE round end ────────────────────────────────────
    if (winner === "X") {
      pScore++;
      SoundEngine.roundWin();
      rs.className = "";
      rs.innerText = "You won this round!";
    } else if (winner === "O") {
      bScore++;
      SoundEngine.roundLose();
      rs.className = "";
      rs.innerText = "Bot won this round!";
    } else {
      SoundEngine.roundDraw();
      rs.className = "";
      rs.innerText = "Round Draw!";
    }
  }

  // Clear active turn glow during break
  updateScoreboardActiveTurn(null);
  updateScoreboard();

  if (pScore === 3 || bScore === 3) {
    setTimeout(() => endMatch(pScore === 3 ? "PLAYER" : "BOT"), 1000);
  } else {
    setTimeout(startRound, 1500);
  }
}

function endMatch(winner) {
  const wintxt = document.getElementById("match-winner-text");

  if (gameMode === "local") {
    // ── LOCAL 2-PLAYER match end ──────────────────────────────
    if (winner === "PLAYER") {
      wintxt.innerText = "PLAYER 1 WINS";
      wintxt.style.color = "#e74c3c";
    } else {
      wintxt.innerText = "PLAYER 2 WINS";
      wintxt.style.color = "#3498db";
    }
    SoundEngine.matchWin(); // champion fanfare for both
    setTimeout(() => ConfettiEngine.start(4500), 300);
  } else {
    // ── BOT MODE match end ────────────────────────────────────
    wintxt.innerText = winner === "PLAYER" ? "YOU WIN!" : "YOU LOSE";
    wintxt.style.color = winner === "PLAYER" ? "#2ecc71" : "#e74c3c";
    if (winner === "PLAYER") {
      SoundEngine.matchWin();
      setTimeout(() => ConfettiEngine.start(4500), 300);
    } else {
      SoundEngine.matchLose();
      ConfettiEngine.stop();
    }
  }
  showScreen("result-screen");
}

function updateScoreboard() {
  document.getElementById("score-player").innerText = pScore;
  document.getElementById("score-bot").innerText = bScore;

  const lp = document.getElementById("label-player");
  const lb = document.getElementById("label-bot");
  if (lp && lb) {
    if (gameMode === "local") {
      lp.innerText = "PLAYER 1  (X)";
      lb.innerText = "PLAYER 2  (O)";
    } else {
      lp.innerText = "PLAYER (X)";
      lb.innerText = "BOT (O)";
    }
  }
}

// ── Highlight the active player's scoreboard row ─────────────
function updateScoreboardActiveTurn(activeSide) {
  // activeSide: "player" | "bot" | null (clear)
  const pItem = document.getElementById("score-item-player");
  const bItem = document.getElementById("score-item-bot");
  if (!pItem || !bItem) return;
  pItem.classList.remove("active-turn");
  bItem.classList.remove("active-turn");
  if (activeSide === "player") pItem.classList.add("active-turn");
  if (activeSide === "bot") bItem.classList.add("active-turn");
}

// ── Update round-status text for local mode ───────────────────
function updateLocalStatus() {
  if (gameMode !== "local") return;
  const rs = document.getElementById("round-status");
  if (isPlayerTurn) {
    rs.innerText = "PLAYER 1 TURN";
    rs.className = "status-p1";
    updateScoreboardActiveTurn("player");
  } else {
    rs.innerText = "PLAYER 2 TURN";
    rs.className = "status-p2";
    updateScoreboardActiveTurn("bot");
  }
}

// ── Cinematic turn banner ─────────────────────────────────────
function showTurnBanner(text) {
  const banner = document.getElementById("turn-banner");
  const inner = document.getElementById("turn-banner-inner");
  const label = document.getElementById("turn-banner-label");
  const pip = document.getElementById("turn-banner-pip");
  if (!banner || !inner || !label) return;

  const isP1 = text.includes("1");
  label.innerText = text;
  if (pip) pip.className = isP1 ? "turn-banner-pip" : "turn-banner-pip pip-p2";

  // Reset animation
  inner.classList.remove("banner-enter", "banner-exit");
  banner.classList.remove("hidden");
  void inner.offsetWidth; // force reflow

  inner.classList.add("banner-enter");

  // Hold → exit  (enter ~0.6s + hold 1.6s + exit ~0.45s)
  const holdTimer = setTimeout(() => {
    inner.classList.remove("banner-enter");
    inner.classList.add("banner-exit");
    inner.addEventListener(
      "animationend",
      () => {
        banner.classList.add("hidden");
        inner.classList.remove("banner-exit");
      },
      { once: true },
    );
  }, 2000);

  // Safety fallback
  setTimeout(() => {
    banner.classList.add("hidden");
    inner.classList.remove("banner-enter", "banner-exit");
  }, 3200);
}

// ============================================================
//  WIN DETECTION
// ============================================================
function checkWin(player) {
  const s = currentSize,
    w = winCondition;
  for (let r = 0; r < s; r++) {
    for (let c = 0; c < s; c++) {
      if (c <= s - w && checkDirection(r, c, 0, 1, player, w, s)) return true;
      if (r <= s - w && checkDirection(r, c, 1, 0, player, w, s)) return true;
      if (r <= s - w && c <= s - w && checkDirection(r, c, 1, 1, player, w, s))
        return true;
      if (r <= s - w && c >= w - 1 && checkDirection(r, c, 1, -1, player, w, s))
        return true;
    }
  }
  return false;
}

function checkDirection(r, c, rDir, cDir, player, winCond, size) {
  for (let i = 0; i < winCond; i++) {
    if (board[(r + i * rDir) * size + (c + i * cDir)] !== player) return false;
  }
  return true;
}

function getRandomMove() {
  const available = [];
  board.forEach((val, idx) => {
    if (!val) available.push(idx);
  });
  return available[Math.floor(Math.random() * available.length)];
}

function getHeuristicMove() {
  for (let i = 0; i < board.length; i++) {
    if (board[i] === null) {
      board[i] = "O";
      if (checkWin("O")) {
        board[i] = null;
        return i;
      }
      board[i] = null;
    }
  }
  for (let i = 0; i < board.length; i++) {
    if (board[i] === null) {
      board[i] = "X";
      if (checkWin("X")) {
        board[i] = null;
        return i;
      }
      board[i] = null;
    }
  }
  let bestScore = -Infinity;
  let bestMoves = [];
  const center = (currentSize - 1) / 2;

  for (let i = 0; i < board.length; i++) {
    if (board[i] === null) {
      const r = Math.floor(i / currentSize);
      const c = i % currentSize;
      let score = evaluateCell(i, "O") + evaluateCell(i, "X") * 0.95;
      score -= (Math.abs(r - center) + Math.abs(c - center)) * 0.1;

      if (score > bestScore) {
        bestScore = score;
        bestMoves = [i];
      } else if (score === bestScore) {
        bestMoves.push(i);
      }
    }
  }
  if (bestMoves.length > 0)
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  return getRandomMove();
}

function evaluateCell(index, player) {
  const s = currentSize,
    w = winCondition;
  const r = Math.floor(index / s);
  const c = index % s;
  let score = 0;
  const dirs = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];

  for (const [rDir, cDir] of dirs) {
    for (let offset = 0; offset < w; offset++) {
      const startR = r - offset * rDir;
      const startC = c - offset * cDir;
      const endR = startR + (w - 1) * rDir;
      const endC = startC + (w - 1) * cDir;

      if (
        startR >= 0 &&
        startR < s &&
        startC >= 0 &&
        startC < s &&
        endR >= 0 &&
        endR < s &&
        endC >= 0 &&
        endC < s
      ) {
        let playerCount = 0,
          blocked = false;
        for (let i = 0; i < w; i++) {
          const cell = board[(startR + i * rDir) * s + (startC + i * cDir)];
          if (cell === player) {
            playerCount++;
          } else if (cell !== null) {
            blocked = true;
            break;
          }
        }
        if (!blocked) {
          if (playerCount === w - 1) score += 10000;
          else if (playerCount === w - 2) score += 100;
          else if (playerCount === w - 3) score += 10;
          else score += 1;
        }
      }
    }
  }
  return score;
}

function getBestMoveMinimax() {
  let bestScore = -Infinity,
    move;
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      board[i] = "O";
      const score = minimax(board, 0, false);
      board[i] = null;
      if (score > bestScore) {
        bestScore = score;
        move = i;
      }
    }
  }
  return move;
}

function minimax(newBoard, depth, isMaximizing) {
  if (checkWin("O")) return 10 - depth;
  if (checkWin("X")) return depth - 10;
  if (newBoard.every((cell) => cell !== null)) return 0;
  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (newBoard[i] === null) {
        newBoard[i] = "O";
        best = Math.max(best, minimax(newBoard, depth + 1, false));
        newBoard[i] = null;
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (newBoard[i] === null) {
        newBoard[i] = "X";
        best = Math.min(best, minimax(newBoard, depth + 1, true));
        newBoard[i] = null;
      }
    }
    return best;
  }
}

// ============================================================
//   WATER RIPPLE CLICK EFFECT
// ============================================================
(function initWaterRipple() {
  function spawnRipple(x, y) {
    const classes = ['ring-1', 'ring-2', 'ring-3', 'drop'];
    classes.forEach(cls => {
      const el = document.createElement('div');
      el.className = `water-ripple ${cls}`;
      el.style.left = x + 'px';
      el.style.top  = y + 'px';
      document.body.appendChild(el);
      el.addEventListener('animationend', () => el.remove());
    });
  }
  document.addEventListener('mousedown', e => spawnRipple(e.clientX, e.clientY));
  document.addEventListener('touchstart', e => {
    const t = e.touches[0];
    if (t) spawnRipple(t.clientX, t.clientY);
  }, { passive: true });
})();

window.onload = () => {
  const trackOpts = document.getElementById("track-opts");
  if (trackOpts) {
    TRACKS.forEach((track, idx) => {
      const btn = document.createElement("button");
      btn.className = "menu-btn size-btn";
      btn.style.cssText =
        "width:120px; padding:10px; flex-direction:column; gap:4px;";
      btn.innerHTML = `
                <span style="font-size:18px;">♪</span>
                <span class="btn-title" style="font-size:11px; letter-spacing:1.5px;">${track.name}</span>
            `;
      btn.onclick = () => AudioManager.selectTrack(idx);
      trackOpts.appendChild(btn);
    });
  }
  syncHighlights();
  renderPreview(); // Render live preview board saat halaman di-load
};

// ============================================================
// FITUR BARU 1: LOGIKA GANTI KURSOR (APPEARANCE)
// ============================================================
function setCustomCursor(type) {
  // Bersihkan kelas kursor sebelumnya
  document.body.classList.remove('cursor-butter', 'cursor-blueberry');
  
  // Pasang kelas baru berdasarkan pilihan model & warna
  if (type === 'butter') {
    document.body.classList.add('cursor-butter');
  } else if (type === 'blueberry') {
    document.body.classList.add('cursor-blueberry');
  }
  
  // Berikan style visual 'active' pada tombol yang diklik
  const container = document.getElementById('app-cursor-opts');
  if (container) {
    const buttons = container.getElementsByClassName('menu-btn');
    for (let btn of buttons) {
      btn.classList.remove('active');
      if (type === 'butter' && btn.innerText.includes('Butter')) btn.classList.add('active');
      else if (type === 'blueberry' && btn.innerText.includes('Blueberry')) btn.classList.add('active');
      else if (type === 'default' && btn.innerText.includes('Default')) btn.classList.add('active');
    }
  }
}

// Tambahkan inisialisasi status active saat pertama kali dibuka
document.addEventListener("DOMContentLoaded", () => {
  setCustomCursor('default');
});


// ============================================================
// MUSIC DISC WIDGET — Premium Vinyl Player
// Fully integrated with AudioManager, TRACKS & bgmEnabled
// ============================================================
const MusicDisc = (() => {

    // ── DOM refs ──────────────────────────────────────────────
    const widget    = document.getElementById('music-disc-widget');
    const discBody  = document.getElementById('disc-body');
    const discLabel = document.getElementById('disc-label');
    const discAura  = document.getElementById('disc-aura');
    const discName  = document.getElementById('disc-track-name');
    const ripple1   = widget?.querySelector('.disc-ripple--1');
    const ripple2   = widget?.querySelector('.disc-ripple--2');

    // ── Internal state ────────────────────────────────────────
    let  _trackIdx      = 0;      // mirrors currentTrackIndex
    let  _isPlaying     = false;
    let  _spinAngle     = 0;      // current visual rotation (deg)
    let  _spinSpeed     = 0;      // current deg/frame
    const TARGET_SPEED  = 0.45;   // deg/frame at full RPM (≈8s/rev @60fps)
    const ACCEL         = 0.012;
    const DECEL         = 0.008;
    let  _rafId         = null;
    let  _rippleTimeout = null;
    let  _transitionBusy = false;

    // Track meta for disc UI
    const TRACK_META = [
        { label: 'BEACH LO-FI',  trackClass: 'track-0' },
        { label: 'AVENTURE',     trackClass: 'track-1' },
        { label: 'PULSEBOX',     trackClass: 'track-2' },
    ];

    // ── Rotation loop ─────────────────────────────────────────
    function rotateTick() {
        if (!widget) return;

        if (_isPlaying) {
            _spinSpeed = Math.min(_spinSpeed + ACCEL, TARGET_SPEED);
        } else {
            _spinSpeed = Math.max(_spinSpeed - DECEL, 0);
        }

        _spinAngle = (_spinAngle + _spinSpeed) % 360;
        if (discBody) discBody.style.transform = `rotate(${_spinAngle}deg)`;

        // keep loop alive while spinning or decelerating
        if (_spinSpeed > 0 || _isPlaying) {
            _rafId = requestAnimationFrame(rotateTick);
        } else {
            _rafId = null;
        }
    }

    function startLoop() {
        if (!_rafId) _rafId = requestAnimationFrame(rotateTick);
    }

    // ── Play / Pause state ────────────────────────────────────
    function setPlaying(playing) {
        if (_isPlaying === playing) return;
        _isPlaying = playing;

        if (widget) {
            widget.classList.toggle('disc-idle', !playing);
        }

        startLoop(); // let loop decelerate if pausing
    }

    // ── Track change ──────────────────────────────────────────
    function setTrack(idx) {
        if (!widget || idx < 0 || idx >= TRACK_META.length) return;
        if (idx === _trackIdx && !_transitionBusy) {
            _trackIdx = idx;
            return;
        }

        _trackIdx = idx;
        _transitionBusy = true;

        // 1. Remove old track class, add new
        TRACK_META.forEach((_, i) => widget.classList.remove(`track-${i}`));
        widget.classList.add(TRACK_META[idx].trackClass);

        // 2. Update track name label with fade
        if (discName)  discName.textContent = TRACK_META[idx].label;
        if (discLabel) {
            discLabel.classList.remove('disc-label-fade');
            // Force reflow
            void discLabel.offsetWidth;
            discLabel.classList.add('disc-label-fade');
        }

        // 3. Pulse glow on disc body
        if (discBody) {
            discBody.classList.remove('disc-pulse');
            void discBody.offsetWidth;
            discBody.classList.add('disc-pulse');
            discBody.addEventListener('animationend', () => {
                discBody.classList.remove('disc-pulse');
                _transitionBusy = false;
            }, { once: true });
        }

        // 4. Fire ripple rings
        fireRipple();
    }

    function fireRipple() {
        if (_rippleTimeout) clearTimeout(_rippleTimeout);

        [ripple1, ripple2].forEach(r => {
            if (!r) return;
            r.classList.remove('disc-ripple-fire');
            void r.offsetWidth;
            r.classList.add('disc-ripple-fire');
        });

        // Clean up class after animation
        _rippleTimeout = setTimeout(() => {
            [ripple1, ripple2].forEach(r => r?.classList.remove('disc-ripple-fire'));
        }, 1200);
    }

    // ── Visibility (show/hide per screen) ─────────────────────
    function setVisible(visible) {
        if (!widget) return;
        widget.classList.toggle('disc-hidden', !visible);
    }

    // ── Sync with AudioManager (called from audio polling) ────
    function sync() {
        const bgMusic = document.getElementById('bg-music');
        if (!bgMusic || !widget) return;

        const isActuallyPlaying = !bgMusic.paused && !bgMusic.ended && bgMusic.currentTime > 0;
        setPlaying(isActuallyPlaying);
    }

    // ── Screen visibility watcher ─────────────────────────────
    function observeScreens() {
        // Show disc on most screens; hide on turn/difficulty/game (optional)
        // Currently: always visible once game window is active
        const allScreens = document.querySelectorAll('.ui-container');
        allScreens.forEach(s => {
            const observer = new MutationObserver(() => {
                // Always show disc when game window is active
                setVisible(true);
            });
            observer.observe(s, { attributes: true, attributeFilter: ['class'] });
        });
    }

    // ── Click interaction: toggle BGM ─────────────────────────
    function onDiscClick() {
        if (typeof AudioManager !== 'undefined') {
            AudioManager.toggleBGM();
        }
    }

    // ── Init ──────────────────────────────────────────────────
    function init() {
        if (!widget) return;

        // Set initial track theme
        widget.classList.add('track-0');
        widget.classList.add('disc-idle');

        // Click to toggle music
        widget.addEventListener('click', onDiscClick);

        // Poll audio state every 250ms (matches old vinyl logic)
        setInterval(sync, 250);

        // Observe screen transitions
        observeScreens();

        // Hide on splash, show after enter
        setVisible(false);
    }

    return { init, setTrack, setPlaying, setVisible, sync, fireRipple };
})();

// ── Hook into AudioManager.selectTrack ───────────────────────
// Wrap selectTrack to also notify MusicDisc
(function patchAudioManager() {
    const checkReady = setInterval(() => {
        if (typeof AudioManager === 'undefined') return;
        clearInterval(checkReady);

        const _origSelect = AudioManager.selectTrack.bind(AudioManager);
        AudioManager.selectTrack = function(idx, playSfx = true) {
            _origSelect(idx, playSfx);
            MusicDisc.setTrack(idx);
        };
    }, 50);
})();

// ── Show disc after user enters game (enterGame hook) ────────
const _origEnterGame = typeof enterGame !== 'undefined' ? enterGame : null;
// We'll patch enterGame after DOMContentLoaded since it's defined later in script
document.addEventListener('DOMContentLoaded', () => {
    MusicDisc.init();

    // Patch enterGame to show disc
    const _nativeEnter = window.enterGame;
    if (typeof _nativeEnter === 'function') {
        window.enterGame = function() {
            _nativeEnter();
            MusicDisc.setVisible(true);
        };
    }
});

// Fallback: also listen for splash click to reveal disc
document.addEventListener('click', function revealOnce(e) {
    const splash = document.getElementById('splash-screen');
    if (splash && (splash.style.display === 'none' || splash.classList.contains('hidden') || splash.style.opacity === '0')) {
        MusicDisc.setVisible(true);
        document.removeEventListener('click', revealOnce);
    }
}, { capture: true });

// Also reveal after 100ms if splash is gone
setInterval(() => {
    const splash = document.getElementById('splash-screen');
    if (splash && splash.style.display === 'none') {
        MusicDisc.setVisible(true);
    }
}, 300);