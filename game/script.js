// ------------------------------
// 🔹 Основні змінні гри
// ------------------------------
let coins = 0;
let energy = 500;
const maxEnergy = 500;
const regenRate = 1;
const regenInterval = 2000; // +1 енергія кожні 2 секунди
let xp = 0;
let level = 1;

// ------------------------------
// 🔹 Елементи DOM
// ------------------------------
const tapButton    = document.getElementById('tapButton');
const coinsDisplay = document.getElementById('coins');
const profileCoins = document.getElementById('profileCoins');
const energyBar    = document.getElementById('energy-bar');
const energyLabel  = document.getElementById('energy-label');
const xpDisplay    = document.getElementById('xp');
const levelDisplay = document.getElementById('level');
const usernameEl   = document.getElementById('username');
const photoEl      = document.getElementById('userPhoto');

// 🔹 статус синхронізації
const syncStatus = document.createElement("div");
syncStatus.id = "sync-status";
syncStatus.style.cssText = `
  position: fixed; bottom: 8px; right: 10px;
  background: rgba(0,0,0,0.5); color: #fff;
  font-size: 12px; padding: 2px 8px;
  border-radius: 6px; z-index: 9999;
  pointer-events: none; transition: opacity 0.3s;
`;
syncStatus.textContent = "⏳ Хмара: очікування…";
document.body.appendChild(syncStatus);

// ------------------------------
// 🧩 Telegram WebApp інтеграція
// ------------------------------
const tg = window.Telegram?.WebApp;
if (tg) tg.expand();

// --- DEBUG MODE ---
if (!tg?.initDataUnsafe?.user) {
  tg.initDataUnsafe = {
    user: {
      id: 999999,
      username: "test_user",
      first_name: "Tester",
      photo_url: "https://cdn-icons-png.flaticon.com/512/149/149071.png"
    }
  };
  console.log("⚠️ DEBUG MODE: Telegram user data підставлені вручну");
}

if (tg && tg.initDataUnsafe?.user) {
  const user = tg.initDataUnsafe.user;
  if (usernameEl) usernameEl.textContent = user.username ? `@${user.username}` : (user.first_name || "Користувач");
  if (photoEl && user.photo_url) photoEl.src = user.photo_url;
}

// хелпери
function getInitData() {
  try { return tg?.initData || ''; } catch { return ''; }
}
function getUserId() {
  try { return tg?.initDataUnsafe?.user?.id ?? null; } catch { return null; }
}

// ------------------------------
// 💾 Локальне збереження / завантаження
// ------------------------------
function saveGame() {
  const data = { coins, xp, level, energy };
  localStorage.setItem('tapgame_save', JSON.stringify(data));
  localStorage.setItem('tapgame_last_update', Date.now().toString());
  cloudSave(); // фонове збереження у хмару
}
function loadGame() {
  const saved = localStorage.getItem('tapgame_save');
  if (!saved) return;
  const data = JSON.parse(saved);
  coins  = data.coins  ?? 0;
  xp     = data.xp     ?? 0;
  level  = data.level  ?? 1;
  energy = data.energy ?? maxEnergy;
}

// ------------------------------
// ☁️ Хмара: завантаження / збереження
// ------------------------------
async function cloudLoad() {
  const userId = getUserId();
  if (!userId) { syncStatus.textContent = "⚠️ Хмара: Telegram ID відсутній"; return false; }

  const params = new URLSearchParams({ user_id: String(userId), init_data: getInitData() });
  try {
    const r = await fetch(`/api/load?${params.toString()}`);
    const j = await r.json();
    if (!j.ok) { syncStatus.textContent = "❌ Хмара: помилка"; return false; }

    const cloud = j.data || {};
    coins  = Math.max(Number(coins),  Number(cloud.coins ?? 0));
    level  = Math.max(Number(level),  Number(cloud.level ?? 1));
    xp     = Math.max(Number(xp),     Number(cloud.xp ?? 0));
    energy = Math.min(maxEnergy, Number(cloud.energy ?? energy));

    syncStatus.textContent = "✅ Хмара: синхронізовано";
    return true;
  } catch (e) {
    console.error(e);
    syncStatus.textContent = "❌ Хмара: offline";
    return false;
  }
}

async function cloudSave() {
  const userId = getUserId();
  if (!userId) return false;
  try {
    const r = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: String(userId), init_data: getInitData(), coins, xp, level, energy })
    });
    const j = await r.json();
    if (j.ok) syncStatus.textContent = "☁️ Хмара: збережено";
    else syncStatus.textContent = "❌ Хмара: помилка";
    return !!j.ok;
  } catch {
    syncStatus.textContent = "❌ Хмара: offline";
    return false;
  }
}

// ------------------------------
// 🕓 Відновлення енергії після паузи
// ------------------------------
function restoreEnergyAfterPause() {
  const lastSave = localStorage.getItem('tapgame_last_update');
  if (!lastSave) return;
  const diff = Date.now() - parseInt(lastSave, 10);
  const gained = Math.floor(diff / regenInterval) * regenRate;
  if (gained > 0 && energy < maxEnergy) {
    energy = Math.min(maxEnergy, energy + gained);
  }
}

// ------------------------------
// 🔹 Рендер елементів UI
// ------------------------------
function renderCoins() {
  if (coinsDisplay) coinsDisplay.textContent = coins;
  if (profileCoins) profileCoins.textContent = coins;
}
function renderXP() {
  if (xpDisplay) xpDisplay.textContent = xp;
  if (levelDisplay) levelDisplay.textContent = level;
}

// ------------------------------
// 🔹 Енергія
// ------------------------------
const DEFAULT_GLOW = '0 0 3px rgba(0,0,0,0.8), 0 0 6px rgba(0,0,0,0.6), 0 0 8px rgba(0,255,255,0.4)';
function updateEnergy(animated = false) {
  energy = Math.max(0, Math.min(maxEnergy, Math.floor(energy)));
  const percent = (energy / maxEnergy) * 100;
  if (energyBar) energyBar.style.width = `${percent}%`;

  const text = `${energy}/${maxEnergy} ⚡`;
  if (energyLabel) {
    energyLabel.textContent = text;
    if (animated) {
      energyLabel.style.textShadow = '0 0 10px #00f6ff, 0 0 20px #00ffff';
      setTimeout(() => (energyLabel.style.textShadow = DEFAULT_GLOW), 180);
    }
  }

  if (energyBar) {
    if (percent > 70) energyBar.style.background = 'linear-gradient(90deg,#00f6ff,#00ff99)';
    else if (percent > 30) energyBar.style.background = 'linear-gradient(90deg,#f6ff00,#ffaa00)';
    else energyBar.style.background = 'linear-gradient(90deg,#ff5f5f,#ff0000)';
  }

  if (tapButton) {
    tapButton.disabled = energy <= 0;
    tapButton.style.opacity = energy <= 0 ? '0.5' : '1';
    tapButton.style.cursor = energy <= 0 ? 'not-allowed' : 'pointer';
  }
}

// ------------------------------
// 🔹 XP і рівень
// ------------------------------
function addXP(amount = 1) {
  xp += amount;
  while (xp >= 100) {
    xp -= 100;
    level++;
  }
  renderXP();
  saveGame();
}

// ------------------------------
// 🔹 Ефекти
// ------------------------------
function spawnCoin() {
  const coin = document.createElement('div');
  coin.classList.add('coin');
  document.body.appendChild(coin);
  const x = window.innerWidth / 2 + (Math.random() * 60 - 30);
  const y = window.innerHeight / 2;
  coin.style.left = `${x}px`; coin.style.top = `${y}px`;
  setTimeout(() => coin.remove(), 1200);
}
function spawnFlash() {
  const flash = document.createElement('div');
  flash.classList.add('energy-flash');
  flash.textContent = '⚡ +1';
  const offsetX = 40 + Math.random() * 20;
  const offsetY = 100 + Math.random() * 10;
  flash.style.left = `${offsetX}px`; flash.style.bottom = `${offsetY}px`;
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 1200);
}

// ------------------------------
// 🔸 TAP натискання
// ------------------------------
if (tapButton) {
  tapButton.addEventListener('click', () => {
    if (energy <= 0) return;
    coins++; energy--;
    addXP(1); renderCoins();
    updateEnergy(true); spawnCoin();
    saveGame();
  });
}

// ------------------------------
// 🔹 Автовідновлення енергії
// ------------------------------
setInterval(() => {
  if (energy < maxEnergy) {
    energy += regenRate;
    if (energy > maxEnergy) energy = maxEnergy;
    updateEnergy(true); spawnFlash(); saveGame();
  }
}, regenInterval);

// ------------------------------
// 🔸 Перемикання вкладок
// ------------------------------
const buttons = document.querySelectorAll('.bottom-nav button');
const screens = document.querySelectorAll('.screen');
buttons.forEach((btn) => {
  btn.addEventListener('click', () => {
    buttons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    screens.forEach((s) => s.classList.remove('active'));
    const target = document.getElementById(btn.dataset.screen);
    if (target) target.classList.add('active');
  });
});

// ------------------------------
// 🔹 Ініціалізація
// ------------------------------
(async function init() {
  loadGame();
  restoreEnergyAfterPause();
  renderCoins();
  renderXP();
  updateEnergy();
  await cloudLoad(); // підтягнути хмарний прогрес
  renderCoins();
  renderXP();
  updateEnergy();
})();
