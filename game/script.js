// ------------------------------
// 🔹 Основні змінні
// ------------------------------
let coins = 0;
let energy = 500;
const maxEnergy = 500;
const regenRate = 1;
const regenInterval = 2000;
let xp = 0;
let level = 1;
let currentUserId = "guest"; // за замовчуванням

// softCoins (невиводимі монетки для пасиву/карток)
let softCoins = 0;

// максимальна кількість годин пасиву, яку можна накопичити разом
const MAX_PASSIVE_HOURS = 24;

// ------------------------------
// 🔹 Елементи DOM
// ------------------------------
const tapButton    = document.getElementById("tapButton");
const coinsDisplay = document.getElementById("coins");
const profileCoins = document.getElementById("profileCoins");
const energyBar    = document.getElementById("energy-bar");
const energyLabel  = document.getElementById("energy-label");
const xpDisplay    = document.getElementById("xp");
const levelDisplay = document.getElementById("level");
const usernameEl   = document.getElementById("username");
const photoEl      = document.getElementById("userPhoto");
const userIdEl     = document.getElementById("userId");

// елементи для soft-монет
const softBalanceEl        = document.getElementById("soft-balance");
const profileSoftCoinsEl   = document.getElementById("profileSoftCoins");

// ------------------------------
// 🧩 Telegram WebApp інтеграція
// ------------------------------
const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;

if (tg) {
  tg.ready();
  console.log("✅ Telegram WebApp знайдено");

  const init = tg.initDataUnsafe || {};
  console.log("initDataUnsafe:", init);

  if (init.user) {
    const user = init.user;
    currentUserId = user.id?.toString() || "guest";

    // імʼя / юзернейм
    if (usernameEl) {
      usernameEl.textContent = user.username
        ? `@${user.username}`
        : user.first_name || "Користувач";
    }

    // аватар
    if (photoEl && user.photo_url) {
      photoEl.src = user.photo_url;
    }

    // ID
    if (userIdEl) {
      userIdEl.textContent = `ID: ${user.id}`;
    }
  } else {
    console.log("⚠️ WebApp є, але user всередині initDataUnsafe відсутній");
    if (usernameEl) usernameEl.textContent = "Гість";
    if (userIdEl) userIdEl.textContent = "ID: offline";
  }
} else {
  console.log("❌ Telegram WebApp API відсутній — браузерний режим");
  if (usernameEl) usernameEl.textContent = "Гість";
  if (userIdEl) userIdEl.textContent = "ID: offline";
}

// ------------------------------
// 💾 Локальне збереження (на userId)
// ------------------------------
function getSaveKey() {
  return `tapgame_save_${currentUserId}`;
}

function getTimeKey() {
  return `tapgame_last_update_${currentUserId}`;
}

// key для пасивного доходу (час останнього збору)
function getPassiveTimeKey() {
  return `tapgame_passive_last_claim_${currentUserId}`;
}

// key для карток
function getCardsKey() {
  return `tapgame_cards_${currentUserId}`;
}

function saveGame() {
  const data = { coins, xp, level, energy, softCoins };
  try {
    localStorage.setItem(getSaveKey(), JSON.stringify(data));
    localStorage.setItem(getTimeKey(), Date.now().toString());
  } catch (e) {
    console.warn("Помилка збереження:", e);
  }
}

function loadGame() {
  try {
    const saved = localStorage.getItem(getSaveKey());
    if (!saved) return;
    const data = JSON.parse(saved);
    coins     = data.coins     ?? 0;
    xp        = data.xp        ?? 0;
    level     = data.level     ?? 1;
    energy    = data.energy    ?? maxEnergy;
    softCoins = data.softCoins ?? 0;
  } catch (e) {
    console.warn("Помилка завантаження сейву:", e);
  }
}

// ------------------------------
// ⏰ Відновлення енергії офлайн
// ------------------------------
function restoreEnergyAfterPause() {
  const lastSave = localStorage.getItem(getTimeKey());
  if (!lastSave) return;
  const diff = Date.now() - parseInt(lastSave, 10);
  const gained = Math.floor(diff / regenInterval) * regenRate;
  if (gained > 0 && energy < maxEnergy) {
    energy = Math.min(maxEnergy, energy + gained);
  }
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
  const percent = (energy / maxEnergy) * 100;

  if (energyBar) {
    energyBar.style.width = `${percent}%`;

    if (percent > 70) {
      energyBar.style.background = "linear-gradient(90deg, #00f6ff, #00ff99)";
    } else if (percent > 30) {
      energyBar.style.background = "linear-gradient(90deg, #f6ff00, #ffaa00)";
    } else {
      energyBar.style.background = "linear-gradient(90deg, #ff5f5f, #ff0000)";
    }
  }

  const text = `${energy}/${maxEnergy} ⚡`;
  if (energyLabel) {
    energyLabel.textContent = text;
    if (animated) {
      energyLabel.style.textShadow = "0 0 10px #00f6ff, 0 0 20px #00ffff";
      setTimeout(() => (energyLabel.style.textShadow = "none"), 180);
    }
  }

  if (tapButton) {
    tapButton.disabled = energy <= 0;
    tapButton.style.opacity = energy <= 0 ? "0.5" : "1";
    tapButton.style.cursor = energy <= 0 ? "not-allowed" : "pointer";
  }
}

// оновлення відображення soft-монет
function updateSoftUI() {
  if (softBalanceEl) {
    softBalanceEl.textContent = softCoins;
  }
  if (profileSoftCoinsEl) {
    profileSoftCoinsEl.textContent = softCoins;
  }
}

// ------------------------------
// 🔹 XP
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
// ✨ Анімації
// ------------------------------
function spawnCoin() {
  const coin = document.createElement("div");
  coin.classList.add("coin");
  document.body.appendChild(coin);
  const x = window.innerWidth / 2 + (Math.random() * 60 - 30);
  const y = window.innerHeight / 2;
  coin.style.left = `${x}px`;
  coin.style.top  = `${y}px`;
  setTimeout(() => coin.remove(), 1200);
}

function spawnFlash() {
  const flash = document.createElement("div");
  flash.classList.add("energy-flash");
  flash.textContent = "⚡ +1";
  const offsetX = 40 + Math.random() * 20;
  const offsetY = 100 + Math.random() * 10;
  flash.style.left   = `${offsetX}px`;
  flash.style.bottom = `${offsetY}px`;
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 1200);
}

// ------------------------------
// 🧠 PASIVE INCOME + CARDS
// ------------------------------

// Базові дефініції карток (мінімальний набір, потім можна розширити)
const CARD_DEFS = {
  miner_1: {
    cardId: 'miner_1',
    name: 'Майнер',
    description: 'Видобуває монети щогодини.',
    type: 'soft_income', // дає soft монети / год
    rarity: 'common',
    baseIncomePerHour: 80,
    incomePerLevel: 20,
    maxLevel: 10,
    baseUpgradeCostSoft: 800,
    upgradeCostMultiplier: 1.5
  },
  vault_1: {
    cardId: 'vault_1',
    name: 'Склад монет',
    description: 'Додає стабільний пасивний дохід.',
    type: 'soft_income',
    rarity: 'common',
    baseIncomePerHour: 50,
    incomePerLevel: 15,
    maxLevel: 10,
    baseUpgradeCostSoft: 600,
    upgradeCostMultiplier: 1.4
  },
  energy_lamp: {
    cardId: 'energy_lamp',
    name: 'Ліхтар енергії',
    description: 'Додає енергію щодня (можна буде додати пізніше).',
    type: 'energy_income',
    rarity: 'common',
    baseIncomePerHour: 0,
    incomePerLevel: 0,
    maxLevel: 10,
    baseUpgradeCostSoft: 500,
    upgradeCostMultiplier: 1.4
  },
  coin_magnet: {
    cardId: 'coin_magnet',
    name: 'Магніт монет',
    description: '+% бонусу до пасивного доходу.',
    type: 'bonus',
    rarity: 'common',
    baseIncomePerHour: 0,
    incomePerLevel: 0,
    baseBonusPercent: 1,
    bonusPercentPerLevel: 0.5,
    maxLevel: 8,
    baseUpgradeCostSoft: 1000,
    upgradeCostMultiplier: 1.6
  }
};

// масив карток користувача
let userCards = [];

// завантаження карток із localStorage
function loadUserCards() {
  try {
    const raw = localStorage.getItem(getCardsKey());
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn("Помилка завантаження карток:", e);
    return [];
  }
}

function saveUserCards() {
  try {
    localStorage.setItem(getCardsKey(), JSON.stringify(userCards));
  } catch (e) {
    console.warn("Помилка збереження карток:", e);
  }
}

// ініціалізація стартових карток (якщо пусто)
function initDefaultCardsIfNeeded() {
  userCards = loadUserCards();

  if (!userCards || userCards.length === 0) {
    userCards = [
      { cardId: 'miner_1', level: 1, acquiredAt: Date.now() },
      { cardId: 'vault_1', level: 1, acquiredAt: Date.now() }
    ];
    saveUserCards();
  }
}

// час останнього збору пасиву
function getLastPassiveClaim() {
  const raw = localStorage.getItem(getPassiveTimeKey());
  if (!raw) {
    const now = Date.now();
    localStorage.setItem(getPassiveTimeKey(), now.toString());
    return now;
  }
  const t = parseInt(raw, 10);
  return isNaN(t) ? Date.now() : t;
}

function setLastPassiveClaim(ts) {
  localStorage.setItem(getPassiveTimeKey(), ts.toString());
}

// розрахунок доходу з картки
function calcCardIncome(cardDef, level) {
  const softIncomePerHour =
    (cardDef.baseIncomePerHour || 0) +
    (level - 1) * (cardDef.incomePerLevel || 0);

  const bonusPercent =
    (cardDef.baseBonusPercent || 0) +
    (level - 1) * (cardDef.bonusPercentPerLevel || 0);

  return { softIncomePerHour, bonusPercent };
}

// загальний пасивний стан
function calcPassiveState() {
  let totalSoftIncomePerHour = 0;
  let totalBonusPercent = 0;

  for (const uc of userCards) {
    const def = CARD_DEFS[uc.cardId];
    if (!def) continue;

    const { softIncomePerHour, bonusPercent } = calcCardIncome(def, uc.level);

    if (['soft_income', 'hybrid'].includes(def.type)) {
      totalSoftIncomePerHour += softIncomePerHour;
    }
    if (def.type === 'bonus') {
      totalBonusPercent += bonusPercent;
    }
  }

  const now = Date.now();
  const last = getLastPassiveClaim();
  let hours = (now - last) / 3600000;
  if (hours < 0) hours = 0;
  if (hours > MAX_PASSIVE_HOURS) hours = MAX_PASSIVE_HOURS;

  const baseSoft = totalSoftIncomePerHour * hours;
  const softWithBonus = baseSoft * (1 + totalBonusPercent / 100);

  return {
    totalSoftIncomePerHour,
    totalBonusPercent,
    unclaimedSoft: Math.floor(softWithBonus),
    hours
  };
}

// забрати пасив
function claimPassive() {
  const state = calcPassiveState();
  if (state.unclaimedSoft <= 0) {
    console.log("Немає накопиченого пасиву");
    return;
  }

  softCoins += state.unclaimedSoft;
  setLastPassiveClaim(Date.now());
  saveGame();
  updateSoftUI();
  updatePassiveUI();
}

// апгрейд картки
function upgradeCard(cardId) {
  const def = CARD_DEFS[cardId];
  if (!def) return;

  const uc = userCards.find(c => c.cardId === cardId);
  if (!uc) return;

  if (uc.level >= def.maxLevel) {
    console.log("Максимальний рівень картки");
    return;
  }

  const currentLevel = uc.level;
  const cost = Math.floor(
    def.baseUpgradeCostSoft * Math.pow(def.upgradeCostMultiplier, currentLevel - 1)
  );

  if (softCoins < cost) {
    console.log("Не вистачає softCoins");
    return;
  }

  softCoins -= cost;
  uc.level += 1;

  saveGame();
  saveUserCards();
  updateSoftUI();
  updatePassiveUI();
  renderCardsList();
}

// оновлення UI панелі пасиву
function updatePassiveUI() {
  const state = calcPassiveState();

  const elPerHour   = document.getElementById("passive-soft-per-hour");
  const elUnclaimed = document.getElementById("passive-unclaimed");
  const elLast      = document.getElementById("passive-last-claim");

  if (elPerHour)   elPerHour.textContent   = state.totalSoftIncomePerHour;
  if (elUnclaimed) elUnclaimed.textContent = state.unclaimedSoft;

  if (elLast) {
    const last = getLastPassiveClaim();
    const d = new Date(last);
    elLast.textContent = d.toLocaleString();
  }

  // паралельно оновлюємо soft-баланс
  updateSoftUI();
}

// рендер списку карток
function renderCardsList() {
  const container = document.getElementById("cards-list");
  if (!container) return;

  container.innerHTML = "";

  userCards.forEach(uc => {
    const def = CARD_DEFS[uc.cardId];
    if (!def) return;

    const { softIncomePerHour, bonusPercent } = calcCardIncome(def, uc.level);
    const currentLevel = uc.level;

    const nextCost = Math.floor(
      def.baseUpgradeCostSoft * Math.pow(def.upgradeCostSoftMultiplier || def.upgradeCostMultiplier, currentLevel - 1)
    );

    // Виправлення: якщо помилились у назві поля
    const realCost = Math.floor(
      def.baseUpgradeCostSoft * Math.pow(def.upgradeCostMultiplier, currentLevel - 1)
    );

    const div = document.createElement("div");
    div.className = "card-item";

    div.innerHTML = `
      <div class="card-header">
        <div class="card-title">${def.name}</div>
        <div class="card-rarity card-rarity-${def.rarity}">${def.rarity}</div>
      </div>
      <div class="card-body">
        <div class="card-level">Рівень: <span>${uc.level}</span> / ${def.maxLevel}</div>
        <div class="card-desc">${def.description}</div>
        <div class="card-stats">
          ${softIncomePerHour > 0 ? `<div>Пасив: +${softIncomePerHour}/год</div>` : ""}
          ${bonusPercent > 0 ? `<div>Бонус: +${bonusPercent.toFixed(1)}%</div>` : ""}
        </div>
      </div>
      <div class="card-footer">
        <button class="btn-upgrade" data-card-id="${def.cardId}">
          Покращити за ${realCost} soft
        </button>
      </div>
    `;

    container.appendChild(div);
  });

  // обробники натискань на "Покращити"
  container.querySelectorAll(".btn-upgrade").forEach(btn => {
    btn.addEventListener("click", () => {
      const cardId = btn.getAttribute("data-card-id");
      upgradeCard(cardId);
    });
  });
}

// ініціалізація пасивної системи
function initPassiveSystem() {
  initDefaultCardsIfNeeded();
  renderCardsList();
  updatePassiveUI();

  const btnClaim = document.getElementById("btn-claim-passive");
  if (btnClaim) {
    btnClaim.addEventListener("click", () => {
      claimPassive();
    });
  }

  // періодично оновлюємо панель пасиву (щоб число "накопичено" збільшувалось)
  setInterval(updatePassiveUI, 5000);
}

// ------------------------------
// 🖱️ TAP
// ------------------------------
if (tapButton) {
  tapButton.addEventListener("click", () => {
    if (energy <= 0) return;
    coins++;
    energy--;
    addXP(1);
    renderCoins();
    updateEnergy(true);
    spawnCoin();
    saveGame();
  });
}

// ------------------------------
// 🔁 Автовідновлення енергії
// ------------------------------
setInterval(() => {
  if (energy < maxEnergy) {
    energy += regenRate;
    if (energy > maxEnergy) energy = maxEnergy;
    updateEnergy(true);
    spawnFlash();
    saveGame();
  }
}, regenInterval);

// ------------------------------
// 📱 Перемикання вкладок
// ------------------------------
const buttons = document.querySelectorAll(".bottom-nav button");
const screens = document.querySelectorAll(".screen");

buttons.forEach((btn) => {
  btn.addEventListener("click", () => {
    buttons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    screens.forEach((s) => s.classList.remove("active"));
    const target = document.getElementById(btn.dataset.screen);
    if (target) target.classList.add("active");
  });
});

// ------------------------------
// 🚀 Ініціалізація
// ------------------------------
loadGame();
restoreEnergyAfterPause();
renderCoins();
renderXP();
updateEnergy();
updateSoftUI();
initPassiveSystem();
