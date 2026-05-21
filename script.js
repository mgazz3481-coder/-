/* ════════════════════════════════════════
   HARDCORE CLICKER TYCOON — script.js
   ════════════════════════════════════════ */

// ── УТИЛИТЫ ──────────────────────────────
function fmt(n) {
    return Math.floor(n).toLocaleString('ru-RU');
}

// ── СТЕЙТ ────────────────────────────────
let clicks      = parseFloat(localStorage.getItem('clicks'))      || 0;
let clickPower  = parseInt(localStorage.getItem('clickPower'))     || 1;
let clickCost   = parseInt(localStorage.getItem('clickCost'))      || 100;

let autoLevel   = parseInt(localStorage.getItem('autoLevel'))      || 0;
let autoCost    = parseInt(localStorage.getItem('autoCost'))       || 1000;
// autoCPS всегда пересчитываем из autoLevel — не доверяем localStorage
let autoCPS     = autoLevel * 5;

let critChance  = parseInt(localStorage.getItem('critChance'))     || 0;
let critCost    = parseInt(localStorage.getItem('critCost'))       || 500;

let goldenMulti = parseInt(localStorage.getItem('goldenMulti'))    || 1;
let goldenCost  = parseInt(localStorage.getItem('goldenCost'))     || 5000;

let comboLevel  = parseInt(localStorage.getItem('comboLevel'))     || 0;
let comboCost   = parseInt(localStorage.getItem('comboCost'))      || 15000;

let rageLevel   = parseInt(localStorage.getItem('rageLevel'))      || 0;
let rageCost    = parseInt(localStorage.getItem('rageCost'))       || 30000;

let megaUnlocked = localStorage.getItem('megaUnlocked') === 'true';

// runtime-only (не сохраняем)
let currentCombo  = 0;
let lastClickTime = 0;
let rageActive    = false;
let rageMultiplier= 1;
let rageEndTime   = 0;

let megaCooldown  = false;
// Флаг: setInterval для мега уже запущен
let megaIntervalStarted = false;

// ── DOM ──────────────────────────────────
const counterDisplay = document.getElementById('counter');
const statsDisplay   = document.getElementById('stats');
const image          = document.getElementById('clickImage');
const hammer         = document.getElementById('hammer-overlay');
const skovordka      = document.getElementById('sk-overlay');
const megaOverlay    = document.getElementById('mega-overlay');
const megaTextEl     = document.getElementById('megaText');
const clickSound     = document.getElementById('clickSound');
const megaSound      = document.getElementById('megaSound');
const rageTimerDiv   = document.getElementById('rageTimer');
const rageTimerText  = document.getElementById('rageTimerText');
const cooldownDiv    = document.getElementById('megaCooldown');
const cooldownTimer  = document.getElementById('cooldownTimer');
const comboDisplay   = (() => {
    const d = document.createElement('div');
    d.className = 'combo-display';
    document.querySelector('.game-area').appendChild(d);
    return d;
})();

// ── СОХРАНЕНИЕ ───────────────────────────
function save() {
    localStorage.setItem('clicks',      clicks);
    localStorage.setItem('clickPower',  clickPower);
    localStorage.setItem('clickCost',   clickCost);
    localStorage.setItem('autoLevel',   autoLevel);
    localStorage.setItem('autoCost',    autoCost);
    localStorage.setItem('critChance',  critChance);
    localStorage.setItem('critCost',    critCost);
    localStorage.setItem('goldenMulti', goldenMulti);
    localStorage.setItem('goldenCost',  goldenCost);
    localStorage.setItem('comboLevel',  comboLevel);
    localStorage.setItem('comboCost',   comboCost);
    localStorage.setItem('rageLevel',   rageLevel);
    localStorage.setItem('rageCost',    rageCost);
    localStorage.setItem('megaUnlocked',megaUnlocked);
}

// ── UI ───────────────────────────────────
function updateUI() {
    counterDisplay.textContent = fmt(clicks);

    const rageText = rageActive ? '⚡ БЕРСЕРК ⚡' : '';
    statsDisplay.textContent =
        `Клик: +${clickPower} | Авто: ${autoCPS}/сек` +
        (rageText ? ' | ' + rageText : '');

    document.getElementById('click-cost').textContent = `${fmt(clickCost)} кликов`;
    document.getElementById('click-lv').textContent   = `Клик: +${clickPower}`;

    document.getElementById('auto-cost').textContent  = `${fmt(autoCost)} кликов`;
    document.getElementById('auto-lv').textContent    = `Уровень: ${autoLevel} (${autoCPS}/сек)`;

    document.getElementById('crit-cost').textContent  = critChance >= 50
        ? 'МАКС' : `${fmt(critCost)} кликов`;
    document.getElementById('crit-lv').textContent    = `Шанс: ${critChance}%`;

    document.getElementById('gold-cost').textContent  = goldenMulti >= 10
        ? 'МАКС' : `${fmt(goldenCost)} кликов`;
    document.getElementById('gold-lv').textContent    = `Множитель: x${goldenMulti}`;

    document.getElementById('combo-cost').textContent = comboLevel >= 5
        ? 'МАКС' : `${fmt(comboCost)} кликов`;
    document.getElementById('combo-lv').textContent   = `Уровень: ${comboLevel}/5`;

    document.getElementById('rage-cost').textContent  = `${fmt(rageCost)} кликов`;
    document.getElementById('rage-lv').textContent    = rageLevel === 0
        ? 'Не куплен' : `Уровень: ${rageLevel} (${rageLevel * 5}с)`;

    // Молоток
    const card20 = document.getElementById('card-20000');
    const status20 = document.getElementById('status-20000');
    if (clicks >= 20000) {
        card20.classList.add('unlocked');
        card20.classList.remove('locked');
        status20.textContent = '✅ АКТИВНО — кликни!';
    } else {
        card20.classList.remove('unlocked');
        card20.classList.add('locked');
        status20.textContent = `🔒 ${fmt(clicks)} / 20 000`;
    }

    // Сковородка
    const card70 = document.getElementById('card-70000');
    const status70 = document.getElementById('status-70000');
    if (clicks >= 70000) {
        card70.classList.add('unlocked');
        card70.classList.remove('locked');
        status70.textContent = '✅ УЛЬТРА — кликни!';
    } else {
        card70.classList.remove('unlocked');
        card70.classList.add('locked');
        status70.textContent = `🔒 ${fmt(clicks)} / 70 000`;
    }

    // Меганайт
    const megaCard   = document.getElementById('secret-mega');
    const megaStatus = document.getElementById('mega-status');
    const megaCostEl = document.getElementById('mega-cost');
    if (megaUnlocked) {
        megaCard.classList.add('unlocked');
        megaStatus.textContent = '✅ АКТИВЕН (авто-прыжок)';
        megaCostEl.textContent  = 'АКТИВИРОВАН';
    } else if (clicks >= 100000) {
        megaCard.classList.add('unlocked');
        megaStatus.textContent = '🔥 ГОТОВ — кликни!';
        megaCostEl.textContent  = 'БЕСПЛАТНО';
    } else {
        megaCard.classList.remove('unlocked');
        megaStatus.textContent = `🔒 ${fmt(clicks)} / 100 000`;
        megaCostEl.textContent  = '100 000 кликов';
    }

    // Rage pulse
    if (rageActive) {
        image.classList.add('rage-pulse');
    } else {
        image.classList.remove('rage-pulse');
    }
}

// ── КЛИКИ ────────────────────────────────
function addClicks(amount, fromPlayer = false) {
    let final = amount;

    if (fromPlayer) {
        // Комбо
        const now = Date.now();
        if (now - lastClickTime < 800) {
            currentCombo++;
        } else {
            currentCombo = 1;
        }
        lastClickTime = now;

        if (comboLevel > 0 && currentCombo > 1) {
            const bonus = 1 + (currentCombo * 0.08 * comboLevel);
            final *= bonus;
            comboDisplay.textContent = `КОМБО x${currentCombo}  (+${Math.round((bonus-1)*100)}%)`;
            comboDisplay.classList.add('visible');
            clearTimeout(comboDisplay._hide);
            comboDisplay._hide = setTimeout(() => comboDisplay.classList.remove('visible'), 1200);
        }

        // Крит
        let isCrit = false;
        if (critChance > 0 && Math.random() * 100 < critChance) {
            final *= 2;
            isCrit = true;
            image.style.filter = 'brightness(2) saturate(2)';
            setTimeout(() => image.style.filter = '', 120);
        }

        // Золотой множитель
        final *= goldenMulti;

        // Берсерк
        if (rageActive) final *= rageMultiplier;

        // Плавающий урон
        spawnFloatDmg(final, isCrit);
    }

    clicks += final;
    updateUI();
}

function spawnFloatDmg(amount, isCrit) {
    const el = document.createElement('div');
    el.className = 'float-dmg' + (isCrit ? ' float-crit' : '');
    el.textContent = `+${fmt(amount)}${isCrit ? ' КРИТ!' : ''}`;
    // Случайный X внутри картинки
    const offsetX = 30 + Math.random() * 40; // 30-70%
    el.style.top  = '20%';
    el.style.left = offsetX + '%';
    document.querySelector('.game-area').appendChild(el);
    setTimeout(() => el.remove(), 1200);
}

// ── КЛИК ПО КАРТИНКЕ ─────────────────────
document.getElementById('clickZone').addEventListener('pointerdown', (e) => {
    // Предотвращаем скролл/зум браузера
    e.preventDefault();

    addClicks(clickPower, true);

    // Звук
    if (clickSound) {
        clickSound.currentTime = 0;
        clickSound.play().catch(() => {});
    }

    // Анимация нажатия через style (не через CSS-класс с transform,
    // чтобы не конфликтовать с shake/mega-slam)
    image.style.transform = 'scale(0.87)';
    setTimeout(() => image.style.transform = '', 90);

    // Молоток при >= 20000
    if (clicks >= 20000) {
        showHit(hammer);
        image.classList.add('shake');
        setTimeout(() => image.classList.remove('shake'), 120);
    }
    // Сковородка при >= 70000
    if (clicks >= 70000) {
        showHit(skovordka);
    }

    save();
});

// ── МАГАЗИН ──────────────────────────────
window.buyClickPower = function() {
    if (clicks < clickCost) return;
    clicks -= clickCost;
    clickPower++;
    clickCost = Math.floor(clickCost * 1.8);
    save(); updateUI();
};

window.buyAutoClicker = function() {
    if (clicks < autoCost) return;
    clicks -= autoCost;
    autoLevel++;
    autoCPS = autoLevel * 5;
    autoCost = Math.floor(autoCost * 1.5);
    save(); updateUI();
};

window.buyCritChance = function() {
    if (critChance >= 50) return;
    if (clicks < critCost) return;
    clicks -= critCost;
    critChance += 5;
    critCost = Math.floor(critCost * 1.8);
    save(); updateUI();
};

window.buyGoldenClick = function() {
    if (goldenMulti >= 10) return;
    if (clicks < goldenCost) return;
    clicks -= goldenCost;
    goldenMulti++;
    goldenCost = Math.floor(goldenCost * 2.5);
    save(); updateUI();
};

window.buyComboMaster = function() {
    if (comboLevel >= 5) return;
    if (clicks < comboCost) return;
    clicks -= comboCost;
    comboLevel++;
    comboCost = Math.floor(comboCost * 2);
    save(); updateUI();
};

window.buyRageMode = function() {
    if (clicks < rageCost) return;
    clicks -= rageCost;
    rageLevel++;
    rageCost = Math.floor(rageCost * 1.5);
    save();

    activateRage();
    updateUI();
};

function activateRage() {
    if (rageLevel === 0) return;
    rageActive     = true;
    rageMultiplier = 3;
    const duration = rageLevel * 5000;
    rageEndTime    = Date.now() + duration;
    rageTimerDiv.style.display = 'block';

    // Таймер на экране
    clearInterval(activateRage._interval);
    activateRage._interval = setInterval(() => {
        const left = Math.ceil((rageEndTime - Date.now()) / 1000);
        if (left <= 0) {
            clearInterval(activateRage._interval);
            rageActive     = false;
            rageMultiplier = 1;
            rageTimerDiv.style.display = 'none';
            updateUI();
        } else {
            rageTimerText.textContent = left;
        }
    }, 250);
}

window.useHammer = function() {
    if (clicks < 20000) return;
    showHit(hammer);
    image.classList.add('shake');
    setTimeout(() => image.classList.remove('shake'), 150);
    addClicks(clickPower * 50);
    save();
};

window.useSk = function() {
    if (clicks < 70000) return;
    showHit(skovordka);
    addClicks(clickPower * 200);
    save();
};

window.summonMegaKnight = function() {
    if (megaCooldown) return;
    if (!megaUnlocked && clicks < 100000) return;

    megaUnlocked = true;
    save();

    performMegaJump();

    // Запускаем авто-интервал ТОЛЬКО один раз
    if (!megaIntervalStarted) {
        megaIntervalStarted = true;
        setInterval(autoMegaJump, 10000);
    }

    updateUI();
};

// ── МЕГАНАЙТ ─────────────────────────────
function autoMegaJump() {
    if (!megaUnlocked || megaCooldown) return;
    performMegaJump();
    startMegaCooldown();
}

function startMegaCooldown() {
    megaCooldown = true;
    cooldownDiv.style.display = 'block';
    let t = 10;
    cooldownTimer.textContent = t;
    clearInterval(startMegaCooldown._iv);
    startMegaCooldown._iv = setInterval(() => {
        t--;
        cooldownTimer.textContent = t;
        if (t <= 0) {
            clearInterval(startMegaCooldown._iv);
            megaCooldown = false;
            cooldownDiv.style.display = 'none';
        }
    }, 1000);
}

function performMegaJump() {
    megaOverlay.style.display = 'block';
    megaTextEl.style.display  = 'block';
    // Перезапускаем анимацию
    megaTextEl.style.animation = 'none';
    void megaTextEl.offsetWidth;
    megaTextEl.style.animation = 'megaTextPop 1s ease-out forwards';
    setTimeout(() => megaTextEl.style.display = 'none', 1000);

    image.classList.add('mega-slam');
    document.body.classList.add('earthquake');

    if (megaSound) {
        megaSound.currentTime = 0;
        megaSound.volume = 0.6;
        megaSound.play().catch(() => {});
    }

    const damage = 100 + clickPower * 5;
    clicks += damage;
    spawnFloatDmg(damage, false);

    setTimeout(() => {
        megaOverlay.style.display = 'none';
        image.classList.remove('mega-slam');
        document.body.classList.remove('earthquake');
    }, 820);

    save();
    updateUI();
}

function showHit(el) {
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 200);
}

// ── ЭМОЦИИ ───────────────────────────────
window.sendEmote = function(file) {
    const old = document.querySelector('.flying-emote');
    if (old) old.remove();

    const wrap = document.createElement('div');
    wrap.className = 'flying-emote';
    const img = document.createElement('img');
    img.src = file;
    wrap.appendChild(img);
    document.body.appendChild(wrap);

    setTimeout(() => {
        if (!wrap.parentNode) return;
        wrap.style.transition = 'opacity 0.3s';
        wrap.style.opacity = '0';
        setTimeout(() => wrap.remove(), 300);
    }, 3000);
};

// ── СБРОС ────────────────────────────────
window.resetGame = function() {
    if (!confirm('Сбросить весь прогресс? Это нельзя отменить!')) return;
    localStorage.clear();
    location.reload();
};

// ── АВТОКЛИКЕР (интервал) ────────────────
// Сохраняем раз в 5 сек, а не на каждый тик
setInterval(() => {
    if (autoCPS > 0) {
        clicks += autoCPS;
        updateUI();
    }
}, 1000);

setInterval(save, 5000);

// ── МЕГАНАЙТ ПРИ ЗАГРУЗКЕ ────────────────
if (megaUnlocked && !megaIntervalStarted) {
    megaIntervalStarted = true;
    setInterval(autoMegaJump, 10000);
    setTimeout(autoMegaJump, 2000);
}

// ── СТАРТ ────────────────────────────────
updateUI();
