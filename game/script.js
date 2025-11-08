// ------------------------------
// 🔹 Основні змінні гри
// ------------------------------
let coins = 0;
let energy = 500;
const maxEnergy = 500;
const regenRate = 1;
const regenInterval = 2000;
let xp = 0;
let level = 1;

// ------------------------------
// 🔹 Елементи DOM
// ------------------------------
const tapButton = document.getElementById("tapButton");
const coinsDisplay = document.getElementById("coins");
const profileCoins = document.getElementById("profileCoins");
const energyBar = document.getElementById("energy-bar");
const energyLabel = document.getElementById("energy-label");
const xpDisplay = document.getElementById("xp");
const levelDisplay = document.getElementById("level");
const usernameEl = document.getElementById("username");
const photoEl = document.getElementById("userPhoto");

// ------------------------------
// 🧩 Telegram WebApp інтеграція
// ------------------------------
const tg = window.Telegram?.WebApp;
if (tg) tg.expand();

// --- DEBUG MODE для браузера ---
if (!tg?.initDataUnsafe?.user) {
  tg.initDataUnsafe = {
    user: {
      id: 999999,
      username: "test_user",
      first_name: "Tester",
      photo_url: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    },
  };
  console.log("⚠️ DEBUG MODE: Telegram user data підставлені вручну");
}

const user = tg?.initDataUnsafe?.user || {};
if (usernameEl)
  usernameEl.textContent = user.username
    ? `@${user.username}`
    : user.first_name || "Користувач";
if (photoEl && user.photo_url) photoEl.src = user.photo_url;

function getInitData() {
  try {
    return tg?.initData || "";
  } catch {
    return "";
  }
}
function getUserId() {
  try {
    return tg?.initDataUnsafe?.user?.id ?? null;
  } catch {
    return null;
  }
}

// ------------------------------
// 💾 Локальне збереження
// ------------------------------
function saveLocal() {
  localStorage.setItem(
    "tapgame_save",
    JSON.stringify({ coins, xp, level, energy })
  );
  localStorage.setItem("tapgame_last_update", Date.now().toString());
}
function loadLocal() {
  const saved = localStorage.getItem("tapgame_save");
  if (!saved) return;
  const d = JSON.parse(saved);
  coins = d.coins ?? 0;
  xp = d.xp ?? 0;
  level = d.level ?? 1;
  energy = d.energy ?? maxEnergy;
}

// ------------------------------
// ☁️ Хмарна синхронізація
// ------------------------------
const syncStatus = document.createElement("div");
syncStatus.id = "sync-status";
Object.assign(syncStatus.style, {
  position: "fixed",
  bottom: "8px",
  right: "10px",
  background: "rgba(0,0,0,0.6)",
  color: "#fff",
  fontSize: "12px",
  padding: "3px 8px",
  borderRadius: "6px",
  zIndex: 9999,
  opacity: 0,
  transition: "opacity 0.3s",
});
document.body.appendChild(syncStatus);

function showStatus(msg, color = "#fff") {
  syncStatus.textContent = msg;
  syncStatus.style.color = color;
  syncStatus.style.opacity = 1;
  setTimeout(() => (syncStatus.style.opacity = 0), 2000);
}

async function cloudLoad() {
  const id = getUserId();
  if (!id) return false;
  try {
    const r = await fetch(`/api/load?user_id=${id}&init_data=${getInitData()}`);
    const j = await r.json();
    if (!j.ok) throw 0;
    const d = j.data || {};
    coins = Math.max(coins, +d.coins || 0);
    level = Math.max(level, +d.level || 1);
    xp = Math.max(xp, +d.xp || 0);
    energy = Math.min(maxEnergy, +d.energy || energy);
    showStatus("☁️ Хмара: завантажено", "#0f0");
    return true;
  } catch {
    showStatus("⚠️ Хмара: offline", "#f66");
    return false;
  }
}

async function cloudSave() {
  const id = getUserId();
  if (!id) return;
  try {
    await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: id, init_data: getInitData(), coins, xp, level, energy }),
    });
    showStatus("☁️ Хмара: збережено", "#0f0");
  } catch {
    showStatus("⚠️ Хмара: offline", "#f66");
  }
}

// ------------------------------
// 🕓 Відновлення енергії після паузи
// ------------------------------
function restoreEnergyAfterPause() {
  const last = localStorage.getItem("tapgame_last_update");
  if (!last) return;
  const diff = Date.now() - +last;
  const gained = Math.floor(diff / regenInterval) * regenRate;
  if (gained > 0 && energy < maxEnergy)
    energy = Math.min(maxEnergy, energy + gained);
}

// ------------------------------
// 🔹 Рендер UI
// ------------------------------
function renderCoins() {
  if (coinsDisplay) coinsDisplay.textContent = coins;
  if (profileCoins) profileCoins.textContent = coins;
}
function renderXP() {
  if (xpDisplay) xpDisplay.textContent = xp;
  if (levelDisplay) levelDisplay.textContent = level;
}
function updateEnergy(animated = false) {
  energy = Math.max(0, Math.min(maxEnergy, Math.floor(energy)));
  const p = (energy / maxEnergy) * 100;
  if (energyBar) energyBar.style.width = `${p}%`;
  const txt = `${energy}/${maxEnergy} ⚡`;
  if (energyLabel) energyLabel.textContent = txt;
  tapButton.disabled = energy <= 0;
  tapButton.style.opacity = energy <= 0 ? "0.5" : "1";
}

// ------------------------------
// 🔹 XP, ефекти, логіка
// ------------------------------
function addXP(a = 1) {
  xp += a;
  while (xp >= 100) {
    xp -= 100;
    level++;
  }
  renderXP();
  saveLocal();
  cloudSave();
}
function spawnCoin() {
  const c = document.createElement("div");
  c.className = "coin";
  document.body.appendChild(c);
  c.style.left = `${window.innerWidth / 2 + (Math.random() * 60 - 30)}px`;
  c.style.top = `${window.innerHeight / 2}px`;
  setTimeout(() => c.remove(), 1200);
}
function spawnFlash() {
  const f = document.createElement("div");
  f.className = "energy-flash";
  f.textContent = "⚡ +1";
  f.style.left = `${40 + Math.random() * 20}px`;
  f.style.bottom = `${100 + Math.random() * 10}px`;
  document.body.appendChild(f);
  setTimeout(() => f.remove(), 1200);
}

// ------------------------------
// 🔸 TAP
// ------------------------------
if (tapButton)
  tapButton.addEventListener("click", () => {
    if (energy <= 0) return;
    coins++;
    energy--;
    addXP(1);
    renderCoins();
    updateEnergy(true);
    spawnCoin();
    saveLocal();
  });

// ------------------------------
// 🔹 Автовідновлення енергії
// ------------------------------
setInterval(() => {
  if (energy < maxEnergy) {
    energy += regenRate;
    if (energy > maxEnergy) energy = maxEnergy;
    updateEnergy(true);
    spawnFlash();
    saveLocal();
  }
}, regenInterval);

// ------------------------------
// 🔹 Ініціалізація
// ------------------------------
(async function init() {
  loadLocal();
  restoreEnergyAfterPause();
  renderCoins();
  renderXP();
  updateEnergy();
  await cloudLoad(); // якщо нема Telegram ID — просто пропустить
  renderCoins();
  renderXP();
  updateEnergy();
})();
console.log("✅ TapGame JS запущено");
alert("TapGame запущено!");

