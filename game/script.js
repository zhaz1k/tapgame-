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

// ⭐ зірки для донату
let stars = 0;

// буст пасивного доходу
let passiveBoostMultiplier = 1;
let passiveBoostEndAt = 0; // timestamp мс, до якого активний буст

// максимальна кількість годин пасиву, яку можна накопичити за раз
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

// soft
const softBalanceEl      = document.getElementById("soft-balance");
const profileSoftCoinsEl = document.getElementById("profileSoftCoins");

// ⭐
const starsBalanceEl = document.getElementById("starsBalance");
const profileStarsEl = document.getElementById("profileStars");
const shopStarsEl    = document.getElementById("shop-stars");

// пасив
const passiveBoostStatusEl = document.getElementById("passive-boost-status");

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
  const data = {
    coins,
    xp,
    level,
    energy,
    softCoins,
    stars,
    passiveBoostMultiplier,
    passiveBoostEndAt
  };
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
    if (!saved) {
      // перший старт — дамо трохи зірок
      stars = 20;
      return;
    }
    const data = JSON.parse(saved);
    coins                  = data.coins ?? 0;
    xp                     = data.xp ?? 0;
    level                  = data.level ?? 1;
    energy                 = data.energy ?? maxEnergy;
    softCoins              = data.softCoins ?? 0;
    stars                  = data.stars ?? 20;
    passiveBoostMultiplier = data.passiveBoostMultiplier ?? 1;
    passiveBoostEndAt      = data.passiveBoostEndAt ?? 0;
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

// оновлення відображення зірок
function updateStarsUI() {
  if (starsBalanceEl) starsBalanceEl.textContent = stars;
  if (profileStarsEl) profileStarsEl.textContent = stars;
  if (shopStarsEl)    shopStarsEl.textContent = stars;
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
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 1200);
}

// ------------------------------
// 🧠 PASIVE INCOME + CARDS
// ------------------------------

// 20 карток (common / rare / epic / legendary)
const CARD_DEFS = {
  // COMMON
  miner_1: {
    cardId: 'miner_1',
    name: 'Майнер',
    description: 'Видобуває soft-монети щогодини.',
    type: 'soft_income',
    rarity: 'common',
    baseIncomePerHour: 80,
    incomePerLevel: 20,
    baseEnergyPerDay: 0,
    energyPerLevel: 0,
    baseBonusPercent: 0,
    bonusPercentPerLevel: 0,
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
    baseEnergyPerDay: 0,
    energyPerLevel: 0,
    baseBonusPercent: 0,
    bonusPercentPerLevel: 0,
    maxLevel: 10,
    baseUpgradeCostSoft: 600,
    upgradeCostMultiplier: 1.4
  },
  energy_lamp: {
    cardId: 'energy_lamp',
    name: 'Ліхтар енергії',
    description: 'Додає енергію щодня (можна реалізувати пізніше).',
    type: 'energy_income',
    rarity: 'common',
    baseIncomePerHour: 0,
    incomePerLevel: 0,
    baseEnergyPerDay: 10,
    energyPerLevel: 5,
    baseBonusPercent: 0,
    bonusPercentPerLevel: 0,
    maxLevel: 10,
    baseUpgradeCostSoft: 500,
    upgradeCostMultiplier: 1.4
  },
  robot_old: {
    cardId: 'robot_old',
    name: 'Старий робот',
    description: 'Трохи допомагає з пасивом.',
    type: 'soft_income',
    rarity: 'common',
    baseIncomePerHour: 60,
    incomePerLevel: 18,
    baseEnergyPerDay: 0,
    energyPerLevel: 0,
    baseBonusPercent: 0,
    bonusPercentPerLevel: 0,
    maxLevel: 10,
    baseUpgradeCostSoft: 700,
    upgradeCostMultiplier: 1.45
  },
  coin_magnet: {
    cardId: 'coin_magnet',
    name: 'Магніт монет',
    description: '+% бонусу до пасивного доходу.',
    type: 'bonus',
    rarity: 'common',
    baseIncomePerHour: 0,
    incomePerLevel: 0,
    baseEnergyPerDay: 0,
    energyPerLevel: 0,
    baseBonusPercent: 1,
    bonusPercentPerLevel: 0.5,
    maxLevel: 8,
    baseUpgradeCostSoft: 1000,
    upgradeCostMultiplier: 1.6
  },

  // RARE
  miner_2: {
    cardId: 'miner_2',
    name: 'Супер Майнер',
    description: 'Сильно піднімає пасивний дохід.',
    type: 'soft_income',
    rarity: 'rare',
    baseIncomePerHour: 200,
    incomePerLevel: 40,
    baseEnergyPerDay: 0,
    energyPerLevel: 0,
    baseBonusPercent: 0,
    bonusPercentPerLevel: 0,
    maxLevel: 12,
    baseUpgradeCostSoft: 2500,
    upgradeCostMultiplier: 1.7
  },
  power_station: {
    cardId: 'power_station',
    name: 'Енергостанція',
    description: 'Генерує енергію щодня.',
    type: 'energy_income',
    rarity: 'rare',
    baseIncomePerHour: 0,
    incomePerLevel: 0,
    baseEnergyPerDay: 30,
    energyPerLevel: 8,
    baseBonusPercent: 0,
    bonusPercentPerLevel: 0,
    maxLevel: 12,
    baseUpgradeCostSoft: 2200,
    upgradeCostMultiplier: 1.65
  },
  passive_server: {
    cardId: 'passive_server',
    name: 'Пасивний сервер',
    description: 'Тримає стабільний soft-потік.',
    type: 'soft_income',
    rarity: 'rare',
    baseIncomePerHour: 150,
    incomePerLevel: 35,
    baseEnergyPerDay: 0,
    energyPerLevel: 0,
    baseBonusPercent: 0,
    bonusPercentPerLevel: 0,
    maxLevel: 12,
    baseUpgradeCostSoft: 2300,
    upgradeCostMultiplier: 1.7
  },
  drone_collector: {
    cardId: 'drone_collector',
    name: 'Дрон-збирач',
    description: 'Дає soft і трохи енергії.',
    type: 'hybrid',
    rarity: 'rare',
    baseIncomePerHour: 100,
    incomePerLevel: 25,
    baseEnergyPerDay: 5,
    energyPerLevel: 2,
    baseBonusPercent: 0,
    bonusPercentPerLevel: 0,
    maxLevel: 10,
    baseUpgradeCostSoft: 2600,
    upgradeCostMultiplier: 1.7
  },
  ref_hub: {
    cardId: 'ref_hub',
    name: 'Реферальний хаб',
    description: 'Підсилює пасив за рахунок мережі.',
    type: 'bonus',
    rarity: 'rare',
    baseIncomePerHour: 0,
    incomePerLevel: 0,
    baseEnergyPerDay: 0,
    energyPerLevel: 0,
    baseBonusPercent: 1,
    bonusPercentPerLevel: 1,
    maxLevel: 8,
    baseUpgradeCostSoft: 3000,
    upgradeCostMultiplier: 1.8
  },

  // EPIC
  neon_factory: {
    cardId: 'neon_factory',
    name: 'Неонова фабрика',
    description: 'Потужний пасивний дохід у neon-стилі.',
    type: 'soft_income',
    rarity: 'epic',
    baseIncomePerHour: 400,
    incomePerLevel: 80,
    baseEnergyPerDay: 0,
    energyPerLevel: 0,
    baseBonusPercent: 0,
    bonusPercentPerLevel: 0,
    maxLevel: 15,
    baseUpgradeCostSoft: 6000,
    upgradeCostMultiplier: 1.9
  },
  core_reactor: {
    cardId: 'core_reactor',
    name: 'Центральний реактор',
    description: 'Дає багато енергії щодня.',
    type: 'energy_income',
    rarity: 'epic',
    baseIncomePerHour: 0,
    incomePerLevel: 0,
    baseEnergyPerDay: 80,
    energyPerLevel: 15,
    baseBonusPercent: 0,
    bonusPercentPerLevel: 0,
    maxLevel: 15,
    baseUpgradeCostSoft: 6500,
    upgradeCostMultiplier: 1.9
  },
  bonus_lab: {
    cardId: 'bonus_lab',
    name: 'Лабораторія бонусів',
    description: 'Додає сильний % бонус до всього пасиву.',
    type: 'bonus',
    rarity: 'epic',
    baseIncomePerHour: 0,
    incomePerLevel: 0,
    baseEnergyPerDay: 0,
    energyPerLevel: 0,
    baseBonusPercent: 3,
    bonusPercentPerLevel: 1.2,
    maxLevel: 12,
    baseUpgradeCostSoft: 7000,
    upgradeCostMultiplier: 2.0
  },
  world_server: {
    cardId: 'world_server',
    name: 'Всесвітній сервер',
    description: 'Глобальний хаб для пасивного доходу.',
    type: 'soft_income',
    rarity: 'epic',
    baseIncomePerHour: 500,
    incomePerLevel: 90,
    baseEnergyPerDay: 0,
    energyPerLevel: 0,
    baseBonusPercent: 0,
    bonusPercentPerLevel: 0,
    maxLevel: 15,
    baseUpgradeCostSoft: 8000,
    upgradeCostMultiplier: 2.0
  },
  neon_tower: {
    cardId: 'neon_tower',
    name: 'Неоновий хмарочос',
    description: 'Великий hybrid: soft + енергія.',
    type: 'hybrid',
    rarity: 'epic',
    baseIncomePerHour: 250,
    incomePerLevel: 60,
    baseEnergyPerDay: 20,
    energyPerLevel: 5,
    baseBonusPercent: 0,
    bonusPercentPerLevel: 0,
    maxLevel: 15,
    baseUpgradeCostSoft: 8500,
    upgradeCostMultiplier: 2.0
  },

  // LEGENDARY
  future_bank: {
    cardId: 'future_bank',
    name: 'Банк майбутнього',
    description: 'Легендарний генератор soft-монет.',
    type: 'soft_income',
    rarity: 'legendary',
    baseIncomePerHour: 1000,
    incomePerLevel: 200,
    baseEnergyPerDay: 0,
    energyPerLevel: 0,
    baseBonusPercent: 0,
    bonusPercentPerLevel: 0,
    maxLevel: 20,
    baseUpgradeCostSoft: 15000,
    upgradeCostMultiplier: 2.2
  },
  neon_sun: {
    cardId: 'neon_sun',
    name: 'Неон-сонце',
    description: 'Нереально багато енергії щодня.',
    type: 'energy_income',
    rarity: 'legendary',
    baseIncomePerHour: 0,
    incomePerLevel: 0,
    baseEnergyPerDay: 150,
    energyPerLevel: 20,
    baseBonusPercent: 0,
    bonusPercentPerLevel: 0,
    maxLevel: 20,
    baseUpgradeCostSoft: 16000,
    upgradeCostMultiplier: 2.2
  },
  multiverse_hub: {
    cardId: 'multiverse_hub',
    name: 'Мультиверс хаб',
    description: 'Дає дуже сильний бонус до пасиву.',
    type: 'bonus',
    rarity: 'legendary',
    baseIncomePerHour: 0,
    incomePerLevel: 0,
    baseEnergyPerDay: 0,
    energyPerLevel: 0,
    baseBonusPercent: 5,
    bonusPercentPerLevel: 2,
    maxLevel: 15,
    baseUpgradeCostSoft: 17000,
    upgradeCostMultiplier: 2.3
  },
  galaxy_server: {
    cardId: 'galaxy_server',
    name: 'Галактичний сервер',
    description: 'Легендарний soft-двигун.',
    type: 'soft_income',
    rarity: 'legendary',
    baseIncomePerHour: 1500,
    incomePerLevel: 250,
    baseEnergyPerDay: 0,
    energyPerLevel: 0,
    baseBonusPercent: 0,
    bonusPercentPerLevel: 0,
    maxLevel: 20,
    baseUpgradeCostSoft: 20000,
    upgradeCostMultiplier: 2.3
  },
  passive_portal: {
    cardId: 'passive_portal',
    name: 'Портал пасиву',
    description: 'Hybrid + трохи енергії.',
    type: 'hybrid',
    rarity: 'legendary',
    baseIncomePerHour: 800,
    incomePerLevel: 150,
    baseEnergyPerDay: 40,
    energyPerLevel: 8,
    baseBonusPercent: 0,
    bonusPercentPerLevel: 0,
    maxLevel: 20,
    baseUpgradeCostSoft: 22000,
    upgradeCostMultiplier: 2.3
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

// ініціалізація карток: дозаливаємо всі, яких ще немає
function initDefaultCardsIfNeeded() {
  userCards = loadUserCards() || [];

  const now = Date.now();
  const existingIds = new Set(userCards.map(c => c.cardId));
  let changed = false;

  for (const cardId of Object.keys(CARD_DEFS)) {
    if (!existingIds.has(cardId)) {
      userCards.push({
        cardId,
        level: 1,
        acquiredAt: now
      });
      changed = true;
    }
  }

  if (changed) {
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

  // активний буст пасиву (x2 / x5 / VIP)
  let activeBoost = 1;
  if (passiveBoostEndAt && now < passiveBoostEndAt && passiveBoostMultiplier > 1) {
    activeBoost = passiveBoostMultiplier;
  }

  let effectiveIncomePerHour = totalSoftIncomePerHour * activeBoost;
  const baseSoft = effectiveIncomePerHour * hours;

  const softWithBonus = baseSoft * (1 + totalBonusPercent / 100);

  return {
    totalSoftIncomePerHour: Math.floor(effectiveIncomePerHour),
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
  renderCity();
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

  // статус бусту
  if (passiveBoostStatusEl) {
    const now = Date.now();
    if (passiveBoostEndAt && now < passiveBoostEndAt && passiveBoostMultiplier > 1) {
      const end = new Date(passiveBoostEndAt);
      passiveBoostStatusEl.textContent = `Boost x${passiveBoostMultiplier} до ${end.toLocaleTimeString()}`;
    } else {
      passiveBoostStatusEl.textContent = "Boost не активний";
    }
  }

  // оновлюємо soft та зірки
  updateSoftUI();
  updateStarsUI();
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

    const cost = Math.floor(
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
          Покращити за ${cost} soft
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

// 🏙 рендер NEON CITY
function renderCity() {
  const cityGrid = document.getElementById("city-grid");
  if (!cityGrid) return;

  cityGrid.innerHTML = "";

  // Мапа для порядку раритетів
  const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };

  // Сортуємо картки: спочатку більш рідкісні та жирні
  const sorted = [...userCards].sort((a, b) => {
    const defA = CARD_DEFS[a.cardId];
    const defB = CARD_DEFS[b.cardId];
    if (!defA || !defB) return 0;

    const rA = rarityOrder[defA.rarity] ?? 99;
    const rB = rarityOrder[defB.rarity] ?? 99;

    if (rA !== rB) return rA - rB;

    // якщо однаковий раритет — сортуємо за теор. доходом
    const incA = calcCardIncome(defA, a.level).softIncomePerHour;
    const incB = calcCardIncome(defB, b.level).softIncomePerHour;
    return incB - incA;
  });

  sorted.forEach(uc => {
    const def = CARD_DEFS[uc.cardId];
    if (!def) return;

    const { softIncomePerHour } = calcCardIncome(def, uc.level);

    // визначаємо тип
    let typeLabel = "";
    let typeIcon = "";
    if (def.type === "soft_income") {
      typeLabel = "Soft";
      typeIcon = "🪙";
    } else if (def.type === "energy_income") {
      typeLabel = "Energy";
      typeIcon = "⚡";
    } else if (def.type === "bonus") {
      typeLabel = "Bonus";
      typeIcon = "%";
    } else if (def.type === "hybrid") {
      typeLabel = "Hybrid";
      typeIcon = "🌀";
    }

    const building = document.createElement("div");
    building.className = `city-building city-rarity-${def.rarity}`;

    // будуємо внутрішню структуру
    const header = document.createElement("div");
    header.className = "city-building-header";
    header.innerHTML = `
      <div class="city-building-name">${def.name}</div>
      <div class="city-building-type">
        <span>${typeIcon}</span>
        <span>${typeLabel}</span>
      </div>
    `;

    const body = document.createElement("div");
    body.className = "city-building-body";

    // робимо "вікна"
    const windowsCount = 9;
    for (let i = 0; i < windowsCount; i++) {
      const w = document.createElement("div");
      w.className = "city-window";
      body.appendChild(w);
    }

    const footer = document.createElement("div");
    footer.className = "city-building-footer";
    footer.innerHTML = `
      <div class="city-building-level">Lv.${uc.level}</div>
      <div class="city-building-income">
        ${softIncomePerHour > 0 ? `+${softIncomePerHour}/год` : ""}
      </div>
    `;

    building.appendChild(header);
    building.appendChild(body);
    building.appendChild(footer);

    cityGrid.appendChild(building);
  });
}

// ініціалізація пасивної системи
function initPassiveSystem() {
  initDefaultCardsIfNeeded();
  renderCardsList();
  renderCity();
  updatePassiveUI();

  const btnClaim = document.getElementById("btn-claim-passive");
  if (btnClaim) {
    btnClaim.addEventListener("click", () => {
      claimPassive();
    });
  }

  // періодично оновлюємо панель пасиву
  setInterval(updatePassiveUI, 5000);
}

// ------------------------------
// 🛒 BOOST SHOP
// ------------------------------
const SHOP_ITEMS = {
  energy_250: {
    cost: 10,
    type: "energy",
    amount: 250
  },
  passive_x2_1h: {
    cost: 20,
    type: "passiveBoost",
    multiplier: 2,
    durationMs: 60 * 60 * 1000
  },
  passive_x5_30m: {
    cost: 35,
    type: "passiveBoost",
    multiplier: 5,
    durationMs: 30 * 60 * 1000
  },
  vip_24h: {
    cost: 50,
    type: "passiveBoost",
    multiplier: 1.2,
    durationMs: 24 * 60 * 60 * 1000
  },
  box_random_card: {
    cost: 40,
    type: "box"
  }
};

function giveRandomCardFromBox() {
  const ids = Object.keys(CARD_DEFS);
  if (!ids.length) return;
  const randomId = ids[Math.floor(Math.random() * ids.length)];
  const def = CARD_DEFS[randomId];
  if (!def) return;

  let uc = userCards.find(c => c.cardId === randomId);
  if (!uc) {
    uc = { cardId: randomId, level: 1, acquiredAt: Date.now() };
    userCards.push(uc);
  } else if (uc.level < def.maxLevel) {
    uc.level += 1;
  } else {
    // якщо карта вже на максимумі — дамо трошки soft як компенсацію
    softCoins += 500;
  }
  saveUserCards();
  renderCardsList();
  renderCity();
}

function buyProduct(productId) {
  const item = SHOP_ITEMS[productId];
  if (!item) return;

  if (stars < item.cost) {
    console.log("Не вистачає зірок");
    return;
  }

  stars -= item.cost;

  if (item.type === "energy") {
    energy = Math.min(maxEnergy, energy + item.amount);
    updateEnergy(true);
  } else if (item.type === "passiveBoost") {
    passiveBoostMultiplier = item.multiplier;
    const now = Date.now();
    passiveBoostEndAt = now + item.durationMs;
  } else if (item.type === "box") {
    giveRandomCardFromBox();
  }

  saveGame();
  updateStarsUI();
  updatePassiveUI();
  renderCardsList();
  renderCity();
}

function initShop() {
  const shopButtons = document.querySelectorAll(".shop-buy-btn");
  shopButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const productId = btn.getAttribute("data-product-id");
      buyProduct(productId);
    });
  });

  // 👉 поповнення зірок
  const btnBuyStars = document.getElementById("btn-buy-stars");
  if (btnBuyStars) {
    btnBuyStars.addEventListener("click", () => {
      // якщо ми всередині Telegram
      if (tg) {
        tg.openTelegramLink("https://t.me/donet_app_bot?start=buy_stars");
      } else {
        // 🔧 DEV-режим у браузері: даємо тестові зірки
        stars += 10;
        saveGame();
        updateStarsUI();
        console.log("DEV: додано 10 зірок (браузерний режим)");
      }
    });
  }

  updateStarsUI();
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
updateStarsUI();
initPassiveSystem();
initShop();
renderCity();
