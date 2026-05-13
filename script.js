// ============================================================
//  SOUND ENGINE — Web Audio API (tidak butuh file eksternal)
// ============================================================
const SoundEngine = (() => {
    let ctx = null;
    let soundEnabled = true;

    function getCtx() {
        if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
    }

    function playTone({ freq = 440, type = 'sine', gain = 0.3, duration = 0.15, attack = 0.005, decay = 0.05, release = 0.1, detune = 0 }) {
        if (!soundEnabled) return;
        const c = getCtx();
        const osc = c.createOscillator();
        const g   = c.createGain();
        osc.connect(g); g.connect(c.destination);
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
        const c    = getCtx();
        const buf  = c.createBuffer(1, c.sampleRate * duration, c.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const src = c.createBufferSource();
        src.buffer = buf;
        const g = c.createGain();
        g.gain.setValueAtTime(gain, c.currentTime);
        g.gain.linearRampToValueAtTime(0, c.currentTime + duration);
        if (bandpass) {
            const f = c.createBiquadFilter();
            f.type = 'bandpass'; f.frequency.value = bandpass; f.Q.value = 1.5;
            src.connect(f); f.connect(g);
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
            if (soundEnabled) {
                seq([
                    { freq: 440, type: 'sine', gain: 0.13, duration: 0.09, release: 0.08 },
                    { freq: 660, type: 'sine', gain: 0.14, duration: 0.11, release: 0.10 }
                ], 0.11);
            }
            return soundEnabled;
        },

        menuClick() {
            playTone({ freq: 440, type: 'sine', gain: 0.10, duration: 0.07, attack: 0.008, decay: 0.03, release: 0.07 });
            playNoise({ gain: 0.02, duration: 0.04, bandpass: 700 });
        },

        playerPlace() {
            playTone({ freq: 392, type: 'triangle', gain: 0.18, duration: 0.11, attack: 0.006, decay: 0.04, release: 0.12 });
            playNoise({ gain: 0.02, duration: 0.05, bandpass: 900 });
        },

        botPlace() {
            playTone({ freq: 262, type: 'sine', gain: 0.16, duration: 0.13, attack: 0.010, decay: 0.05, release: 0.12 });
            playNoise({ gain: 0.02, duration: 0.06, bandpass: 450 });
        },

        roundWin() {
            seq([
                { freq: 392, type: 'sine', gain: 0.20, duration: 0.13, release: 0.12 },
                { freq: 523, type: 'sine', gain: 0.20, duration: 0.13, release: 0.12 },
                { freq: 659, type: 'sine', gain: 0.23, duration: 0.22, release: 0.18 }
            ], 0.13);
        },

        roundLose() {
            seq([
                { freq: 370, type: 'sine',     gain: 0.16, duration: 0.13, release: 0.12 },
                { freq: 311, type: 'sine',     gain: 0.15, duration: 0.13, release: 0.12 },
                { freq: 247, type: 'triangle', gain: 0.16, duration: 0.24, release: 0.18 }
            ], 0.14);
        },

        roundDraw() {
            seq([
                { freq: 349, type: 'sine', gain: 0.13, duration: 0.15, release: 0.12 },
                { freq: 349, type: 'sine', gain: 0.10, duration: 0.13, release: 0.12, detune: 12 }
            ], 0.18);
        },

        matchWin() {
            seq([
                { freq: 392, type: 'sine', gain: 0.20, duration: 0.13, release: 0.10 },
                { freq: 523, type: 'sine', gain: 0.20, duration: 0.13, release: 0.10 },
                { freq: 659, type: 'sine', gain: 0.20, duration: 0.13, release: 0.10 },
                { freq: 784, type: 'sine', gain: 0.25, duration: 0.30, release: 0.22 }
            ], 0.13);
            setTimeout(() => seq([
                { freq: 196, type: 'triangle', gain: 0.12, duration: 0.15, release: 0.12 },
                { freq: 247, type: 'triangle', gain: 0.12, duration: 0.15, release: 0.12 },
                { freq: 311, type: 'triangle', gain: 0.12, duration: 0.15, release: 0.12 },
                { freq: 392, type: 'triangle', gain: 0.14, duration: 0.32, release: 0.22 }
            ], 0.13), 40);
        },

        matchLose() {
            seq([
                { freq: 294, type: 'sine',     gain: 0.16, duration: 0.18, release: 0.14 },
                { freq: 262, type: 'sine',     gain: 0.14, duration: 0.18, release: 0.14 },
                { freq: 220, type: 'triangle', gain: 0.13, duration: 0.24, release: 0.18 },
                { freq: 175, type: 'triangle', gain: 0.16, duration: 0.50, release: 0.38 }
            ], 0.18);
            setTimeout(() => playTone({ freq: 65, type: 'sine', gain: 0.09, duration: 0.75, attack: 0.10, release: 0.55 }), 420);
        }
    };
})();

// ============================================================
//  BGM TRACK LIST
//  Untuk menambah lagu baru: tambahkan objek baru ke array ini.
//  - name  : label yang tampil di tombol Settings
//  - file  : nama file audio (harus ada di folder yang sama dengan main.html)
// ============================================================
const TRACKS = [
    { name: "BEACH LO-FI", file: "artmylife-beach-lo-fi-relax-477166.mp3" },
    { name: "AVENTURE",    file: "aventure-lofi-chill-nostalgic-469629.mp3" },
    { name: "PULSEBOX",    file: "pulsebox-lofi-smooth-522876.mp3" },
];

let currentTrackIndex = 0;

// ============================================================
//  AUDIO MANAGER — satu sumber global untuk BGM & SFX volume
// ============================================================
const AudioManager = (() => {
    const bgAudio  = document.getElementById('bg-music');
    let bgmVolume  = 35;   // 0–100
    let sfxVolume  = 100;  // 0–100
    let bgmEnabled = true;
    let sfxEnabled = true;
    let bgStarted  = false;

    function applyBGM() {
        bgAudio.volume = bgmEnabled ? bgmVolume / 100 : 0;
    }

    function syncToggleUI() {
        const mEl = document.getElementById('music-control');
        if (mEl) {
            mEl.querySelector('i').className    = bgmEnabled ? 'fas fa-music' : 'fas fa-slash';
            mEl.querySelector('span').innerHTML = bgmEnabled ? 'MUSIC<br>ON' : 'MUSIC<br>OFF';
        }
        const sEl = document.getElementById('sound-control');
        if (sEl) {
            sEl.querySelector('i').className    = sfxEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
            sEl.querySelector('span').innerHTML = sfxEnabled ? 'SOUND<br>ON' : 'SOUND<br>OFF';
        }
    }

    return {
        tryStart() {
            if (!bgStarted && bgmEnabled) {
                bgAudio.play().then(() => { bgStarted = true; }).catch(() => {});
            }
        },

        setBGM(val) {
            bgmVolume  = parseInt(val);
            bgmEnabled = bgmVolume > 0;
            applyBGM();
            const v = document.getElementById('bgm-val');
            if (v) v.textContent = bgmVolume;
            syncToggleUI();
        },

        setSFX(val) {
            sfxVolume  = parseInt(val);
            sfxEnabled = sfxVolume > 0;
            if (sfxEnabled !== SoundEngine.isSoundEnabled()) SoundEngine.toggle();
            const v = document.getElementById('sfx-val');
            if (v) v.textContent = sfxVolume;
            syncToggleUI();
        },

        toggleBGM() {
            bgmEnabled = !bgmEnabled;
            if (bgmEnabled) {
                bgmVolume = bgmVolume === 0 ? 35 : bgmVolume;
                if (!bgStarted) {
                    bgAudio.play().then(() => { bgStarted = true; }).catch(() => {});
                } else {
                    bgAudio.play().catch(() => {});
                }
            } else {
                bgAudio.pause();
            }
            applyBGM();
            const s = document.getElementById('bgm-slider');
            if (s) s.value = bgmEnabled ? bgmVolume : 0;
            const v = document.getElementById('bgm-val');
            if (v) v.textContent = bgmEnabled ? bgmVolume : 0;
            return bgmEnabled;
        },

        toggleSFX() {
            sfxEnabled = !sfxEnabled;
            sfxVolume  = sfxEnabled ? (sfxVolume === 0 ? 100 : sfxVolume) : 0;
            if (sfxEnabled !== SoundEngine.isSoundEnabled()) SoundEngine.toggle();
            const s = document.getElementById('sfx-slider');
            if (s) s.value = sfxVolume;
            const v = document.getElementById('sfx-val');
            if (v) v.textContent = sfxVolume;
            return sfxEnabled;
        },

        resetDefaults() {
            bgmVolume = 35; bgmEnabled = true;
            sfxVolume = 100; sfxEnabled = true;
            applyBGM();
            if (!SoundEngine.isSoundEnabled()) SoundEngine.toggle();
            const bs = document.getElementById('bgm-slider'); if (bs) bs.value = 35;
            const bv = document.getElementById('bgm-val');    if (bv) bv.textContent = 35;
            const ss = document.getElementById('sfx-slider'); if (ss) ss.value = 100;
            const sv = document.getElementById('sfx-val');    if (sv) sv.textContent = 100;
            // Reset track ke Track 1
            if (currentTrackIndex !== 0) this.selectTrack(0, false);
            syncToggleUI();
        },

        // Ganti BGM track; playSfx=true membunyikan klik menu
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
        }
    };
})();

// ============================================================
//  GLOBAL AUDIO TOGGLE (tombol atas kanan)
// ============================================================
function toggleAudio(type) {
    if (type === 'sound') {
        const isOn = AudioManager.toggleSFX();
        const el   = document.getElementById('sound-control');
        el.querySelector('i').className    = isOn ? 'fas fa-volume-up' : 'fas fa-volume-mute';
        el.querySelector('span').innerHTML = isOn ? 'SOUND<br>ON' : 'SOUND<br>OFF';
    } else if (type === 'music') {
        const isOn = AudioManager.toggleBGM();
        const el   = document.getElementById('music-control');
        el.querySelector('i').className    = isOn ? 'fas fa-music' : 'fas fa-slash';
        el.querySelector('span').innerHTML = isOn ? 'MUSIC<br>ON' : 'MUSIC<br>OFF';
    }
}

// ============================================================
//  GAME STATE
// ============================================================
let currentSize       = 3;
let currentDifficulty = 'Hard';
let firstTurnChoice   = 'Player';
let currentBlur       = 6;
let winCondition      = 3;
let board = [], pScore = 0, bScore = 0, isPlayerTurn = true, gameActive = false;
let prevBoard = []; // Tracks previous state to trigger animation only on new pieces

// Simpan screen sebelum buka Credits agar tombol Back kembali ke sana
let _prevScreen = 'lobby-screen';

// ============================================================
//  NAVIGATION
// ============================================================
function showScreen(screenId) {
    SoundEngine.menuClick();
    const active = document.querySelector('.ui-container:not(.hidden)');
    if (active && screenId === 'credits-screen') _prevScreen = active.id;

    document.querySelectorAll('.ui-container').forEach(el => el.classList.add('hidden'));
    document.getElementById(screenId).classList.remove('hidden');

    const videoBg = document.getElementById('bg-video');
    if (screenId === 'lobby-screen') {
        videoBg.classList.remove('video-blurred');
    } else {
        videoBg.classList.add('video-blurred');
    }
    syncHighlights();
}

function openCredits() {
    showScreen('credits-screen');
}

function closeCredits() {
    showScreen(_prevScreen);
}

// ============================================================
//  HIGHLIGHT / GLOW SYNC
// ============================================================
function syncHighlights() {
    // Blur intensity
    document.querySelectorAll('#blur-opts .menu-btn').forEach(b => b.classList.remove('selected-opt'));
    if (currentBlur === 2)  document.querySelector('#blur-opts .menu-btn:nth-child(1)').classList.add('selected-opt');
    if (currentBlur === 6)  document.querySelector('#blur-opts .menu-btn:nth-child(2)').classList.add('selected-opt');
    if (currentBlur === 12) document.querySelector('#blur-opts .menu-btn:nth-child(3)').classList.add('selected-opt');

    // Board size
    document.querySelectorAll('#size-opts .menu-btn').forEach(b => b.classList.remove('selected-opt'));
    if (currentSize === 3) document.querySelector('#size-opts .menu-btn:nth-child(1)').classList.add('selected-opt');
    if (currentSize === 5) document.querySelector('#size-opts .menu-btn:nth-child(2)').classList.add('selected-opt');
    if (currentSize === 6) document.querySelector('#size-opts .menu-btn:nth-child(3)').classList.add('selected-opt');

    // Difficulty
    document.querySelectorAll('#diff-opts .menu-btn').forEach(b => b.classList.remove('selected-opt'));
    if (currentDifficulty === 'Easy')   document.querySelector('#diff-opts .menu-btn:nth-child(1)').classList.add('selected-opt');
    if (currentDifficulty === 'Medium') document.querySelector('#diff-opts .menu-btn:nth-child(2)').classList.add('selected-opt');
    if (currentDifficulty === 'Hard')   document.querySelector('#diff-opts .menu-btn:nth-child(3)').classList.add('selected-opt');

    // First turn
    document.querySelectorAll('#turn-opts .menu-btn').forEach(b => b.classList.remove('selected-opt'));
    if (firstTurnChoice === 'Player') document.querySelector('#turn-opts .menu-btn:nth-child(1)').classList.add('selected-opt');
    if (firstTurnChoice === 'Bot')    document.querySelector('#turn-opts .menu-btn:nth-child(2)').classList.add('selected-opt');

    // BGM Track selection
    document.querySelectorAll('#track-opts .menu-btn').forEach(b => b.classList.remove('selected-opt'));
    const activeTrackBtn = document.querySelector(`#track-opts .menu-btn:nth-child(${currentTrackIndex + 1})`);
    if (activeTrackBtn) activeTrackBtn.classList.add('selected-opt');
}

// ============================================================
//  SETTINGS LOGIC
// ============================================================
function setBlur(amount) {
    SoundEngine.menuClick();
    currentBlur = amount;
    document.documentElement.style.setProperty('--blur-amount', amount + 'px');
    syncHighlights();
}

function resetDefaults() {
    SoundEngine.menuClick();
    setBlur(6);
    AudioManager.resetDefaults();
}

// ============================================================
//  SPLASH SCREEN
// ============================================================
function enterGame() {
    const splash = document.getElementById('splash-screen');
    splash.classList.add('fade-out');
    setTimeout(() => splash.remove(), 800);
    AudioManager.tryStart();
}

// ============================================================
//  MENU FLOW
// ============================================================
function chooseSize(size) {
    SoundEngine.menuClick();
    currentSize = size;
    syncHighlights();
    setTimeout(() => showScreen('difficulty-screen'), 300);
}

function setDifficulty(diff) {
    SoundEngine.menuClick();
    currentDifficulty = diff;
    winCondition = currentSize === 3 ? 3 : 4;
    syncHighlights();
    setTimeout(() => showScreen('turn-screen'), 300);
}

function setFirstTurn(choice) {
    SoundEngine.menuClick();
    firstTurnChoice = choice;
    document.getElementById('game-tip').innerText = `Tip: Get ${winCondition} in a row to win!`;
    pScore = 0; bScore = 0;
    updateScoreboard();
    syncHighlights();
    setTimeout(() => { showScreen('game-screen'); startRound(); }, 400);
}

// ============================================================
//  GAME LOGIC
// ============================================================
function startRound() {
    board        = Array(currentSize * currentSize).fill(null);
    prevBoard    = Array(currentSize * currentSize).fill(null); // Reset snapshot
    gameActive   = true;
    isPlayerTurn = (firstTurnChoice === 'Player');
    renderBoard();
    if (!isPlayerTurn) {
        document.getElementById('round-status').innerText = "Bot is thinking...";
        setTimeout(botMove, getThinkingDelay());
    } else {
        document.getElementById('round-status').innerText = `Your turn! (${currentDifficulty})`;
    }
}

function renderBoard() {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';
    const maxBoardSize = 450;
    const cellSize     = Math.floor(maxBoardSize / currentSize);
    boardEl.style.gridTemplateColumns = `repeat(${currentSize}, ${cellSize}px)`;
    boardEl.style.gridTemplateRows    = `repeat(${currentSize}, ${cellSize}px)`;

    for (let i = 0; i < board.length; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.style.fontSize = `${Math.floor(cellSize * 0.6)}px`;
        if (board[i]) {
            cell.innerText = board[i];
            cell.classList.add(board[i].toLowerCase());
            // Hanya picu animasi jika pion ini baru saja ditempatkan (tidak ada di prevBoard)
            if (board[i] !== prevBoard[i]) {
                cell.classList.add('just-placed');
                // Hapus class setelah animasi selesai agar tidak loop
                cell.addEventListener('animationend', () => cell.classList.remove('just-placed'), { once: true });
            }
        }
        cell.onclick = () => handlePlayerMove(i);
        boardEl.appendChild(cell);
    }

    prevBoard = [...board]; // Simpan snapshot board saat ini
}

function getThinkingDelay() {
    if (currentDifficulty === 'Easy')   return 1500;
    if (currentDifficulty === 'Medium') return 800;
    return 300;
}

function handlePlayerMove(index) {
    if (!gameActive || board[index] || !isPlayerTurn) return;
    board[index] = 'X';
    SoundEngine.playerPlace();
    renderBoard();
    if (checkWin('X')) return endRound('X');
    if (board.every(cell => cell !== null)) return endRound('DRAW');
    isPlayerTurn = false;
    document.getElementById('round-status').innerText = "Bot is thinking...";
    setTimeout(botMove, getThinkingDelay());
}

function botMove() {
    if (!gameActive) return;
    let bestMove;
    // Hard: always tactical | Medium: 60% tactical, 40% random (but still blocks instant wins)
    const useTactic = (currentDifficulty === 'Hard') || (currentDifficulty === 'Medium' && Math.random() > 0.4);

    if (useTactic) {
        bestMove = (currentSize === 3) ? getBestMoveMinimax() : getHeuristicMove();
    } else {
        // Medium "dumb" turn: still blocks a 1-move win by player
        if (currentDifficulty === 'Medium') {
            for (let i = 0; i < board.length; i++) {
                if (board[i] === null) {
                    board[i] = 'X';
                    if (checkWin('X')) { board[i] = null; bestMove = i; break; }
                    board[i] = null;
                }
            }
        }
        if (bestMove === undefined) bestMove = getRandomMove();
    }

    // Safety fallback
    if (bestMove === undefined || bestMove === null) bestMove = getRandomMove();

    board[bestMove] = 'O';
    SoundEngine.botPlace();
    renderBoard();
    if (checkWin('O')) return endRound('O');
    if (board.every(cell => cell !== null)) return endRound('DRAW');
    isPlayerTurn = true;
    document.getElementById('round-status').innerText = `Your turn! (${currentDifficulty})`;
}

function endRound(winner) {
    gameActive = false;
    if (winner === 'X')      { pScore++; SoundEngine.roundWin(); }
    else if (winner === 'O') { bScore++; SoundEngine.roundLose(); }
    else                     { SoundEngine.roundDraw(); }
    document.getElementById('round-status').innerText =
        winner === 'DRAW' ? "Round Draw!" :
        (winner === 'X'   ? "You won this round!" : "Bot won this round!");
    updateScoreboard();
    if (pScore === 3 || bScore === 3) {
        setTimeout(() => endMatch(pScore === 3 ? 'PLAYER' : 'BOT'), 1000);
    } else {
        setTimeout(startRound, 1500);
    }
}

function endMatch(winner) {
    const wintxt = document.getElementById('match-winner-text');
    wintxt.innerText   = winner === 'PLAYER' ? "YOU WIN!" : "YOU LOSE";
    wintxt.style.color = winner === 'PLAYER' ? "#2ecc71" : "#e74c3c";
    if (winner === 'PLAYER') SoundEngine.matchWin(); else SoundEngine.matchLose();
    showScreen('result-screen');
}

function updateScoreboard() {
    document.getElementById('score-player').innerText = pScore;
    document.getElementById('score-bot').innerText    = bScore;
}

// ============================================================
//  WIN DETECTION
// ============================================================
function checkWin(player) {
    const s = currentSize, w = winCondition;
    for (let r = 0; r < s; r++) {
        for (let c = 0; c < s; c++) {
            if (c <= s - w && checkDirection(r, c, 0,  1,  player, w, s)) return true;
            if (r <= s - w && checkDirection(r, c, 1,  0,  player, w, s)) return true;
            if (r <= s - w && c <= s - w && checkDirection(r, c, 1,  1,  player, w, s)) return true;
            if (r <= s - w && c >= w - 1 && checkDirection(r, c, 1, -1,  player, w, s)) return true;
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

// ============================================================
//  AI — RANDOM
// ============================================================
function getRandomMove() {
    const available = [];
    board.forEach((val, idx) => { if (!val) available.push(idx); });
    return available[Math.floor(Math.random() * available.length)];
}

// ============================================================
//  AI — HEURISTIC (papan 5x5 & 6x6)
// ============================================================
function getHeuristicMove() {
    // 1. Instant win
    for (let i = 0; i < board.length; i++) {
        if (board[i] === null) {
            board[i] = 'O'; if (checkWin('O')) { board[i] = null; return i; } board[i] = null;
        }
    }
    // 2. Block player's instant win
    for (let i = 0; i < board.length; i++) {
        if (board[i] === null) {
            board[i] = 'X'; if (checkWin('X')) { board[i] = null; return i; } board[i] = null;
        }
    }
    // 3. Positional scoring
    let bestScore = -Infinity;
    let bestMoves = [];
    const center  = (currentSize - 1) / 2;

    for (let i = 0; i < board.length; i++) {
        if (board[i] === null) {
            const r   = Math.floor(i / currentSize);
            const c   = i % currentSize;
            let score = evaluateCell(i, 'O') + (evaluateCell(i, 'X') * 0.95);
            // Slight center bias to break ties
            score -= (Math.abs(r - center) + Math.abs(c - center)) * 0.1;

            if (score > bestScore) { bestScore = score; bestMoves = [i]; }
            else if (score === bestScore) { bestMoves.push(i); }
        }
    }

    if (bestMoves.length > 0) return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    return getRandomMove();
}

// Nilai seberapa bagus menaruh bidak di sel tertentu
function evaluateCell(index, player) {
    const s = currentSize, w = winCondition;
    const r = Math.floor(index / s);
    const c = index % s;
    let score = 0;
    const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];

    for (const [rDir, cDir] of dirs) {
        for (let offset = 0; offset < w; offset++) {
            const startR = r - offset * rDir;
            const startC = c - offset * cDir;
            const endR   = startR + (w - 1) * rDir;
            const endC   = startC + (w - 1) * cDir;

            if (startR >= 0 && startR < s && startC >= 0 && startC < s &&
                endR   >= 0 && endR   < s && endC   >= 0 && endC   < s) {
                let playerCount = 0, blocked = false;
                for (let i = 0; i < w; i++) {
                    const cell = board[(startR + i * rDir) * s + (startC + i * cDir)];
                    if (cell === player)      { playerCount++; }
                    else if (cell !== null)   { blocked = true; break; }
                }
                if (!blocked) {
                    if      (playerCount === w - 1) score += 10000;  // 1 langkah lagi menang
                    else if (playerCount === w - 2) score += 100;
                    else if (playerCount === w - 3) score += 10;
                    else                            score += 1;
                }
            }
        }
    }
    return score;
}

// ============================================================
//  AI — MINIMAX (papan 3x3)
// ============================================================
function getBestMoveMinimax() {
    let bestScore = -Infinity, move;
    for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
            board[i] = 'O';
            const score = minimax(board, 0, false);
            board[i] = null;
            if (score > bestScore) { bestScore = score; move = i; }
        }
    }
    return move;
}

function minimax(newBoard, depth, isMaximizing) {
    if (checkWin('O')) return 10 - depth;
    if (checkWin('X')) return depth - 10;
    if (newBoard.every(cell => cell !== null)) return 0;
    if (isMaximizing) {
        let best = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (newBoard[i] === null) {
                newBoard[i] = 'O';
                best = Math.max(best, minimax(newBoard, depth + 1, false));
                newBoard[i] = null;
            }
        }
        return best;
    } else {
        let best = Infinity;
        for (let i = 0; i < 9; i++) {
            if (newBoard[i] === null) {
                newBoard[i] = 'X';
                best = Math.min(best, minimax(newBoard, depth + 1, true));
                newBoard[i] = null;
            }
        }
        return best;
    }
}

// ============================================================
//  INIT
// ============================================================
window.onload = () => {
    // Build track selector buttons dynamically from TRACKS array
    const trackOpts = document.getElementById('track-opts');
    if (trackOpts) {
        TRACKS.forEach((track, idx) => {
            const btn = document.createElement('button');
            btn.className = 'menu-btn size-btn';
            btn.style.cssText = 'width:120px; padding:10px; flex-direction:column; gap:4px;';
            btn.innerHTML = `
                <span style="font-size:18px;">♪</span>
                <span class="btn-title" style="font-size:11px; letter-spacing:1.5px;">${track.name}</span>
            `;
            btn.onclick = () => AudioManager.selectTrack(idx);
            trackOpts.appendChild(btn);
        });
    }
    syncHighlights();
};