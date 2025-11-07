import TelegramBot from "node-telegram-bot-api";

// 🔹 твій токен із BotFather
const TOKEN = "8531820317:AAGcDEkMeNqOqs8ivJtG92MNcO6_jmyFRrc";

const bot = new TelegramBot(TOKEN, { polling: true });

// 🔹 команда /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(
    chatId,
    "🎮 Вітаю у *Minecraft Tap Game!*\n\n⛏️ Натисни *Грати зараз*, щоб почати.\n📊 Переглянь рейтинг або дізнайся більше про гру!",
    {
      parse_mode: "Markdown",
      reply_markup: {
        keyboard: [
          [
            {
              text: "⛏️ Грати зараз",
              web_app: {
                url: "tapgame-8jxk.vercel.app" // 🔹 актуальне посилання на Vercel
              }
            }
          ],
          ["🏆 Рейтинг", "ℹ️ Про гру"],
        ],
        resize_keyboard: true,
        one_time_keyboard: false,
      },
    }
  );
});

// 🔹 кнопка “Про гру”
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text === "ℹ️ Про гру") {
    bot.sendMessage(
      chatId,
      "🪓 *Minecraft Tap Game* — це клік-гра в стилі Minecraft!\n\n" +
        "⛏️ Натискай якнайшвидше, щоб добувати ресурси.\n💎 Змагайся з іншими гравцями в рейтингу.\n🎁 Заробляй бонуси та відкривай нові рівні!",
      { parse_mode: "Markdown" }
    );
  }

  // 🔹 кнопка “Рейтинг”
  if (text === "🏆 Рейтинг") {
    bot.sendMessage(
      chatId,
      "🏅 *Топ гравців (демо)*:\n\n" +
        "1️⃣ Steve — 1580 тапів\n" +
        "2️⃣ Alex — 1320 тапів\n" +
        "3️⃣ Herobrine — 999 тапів",
      { parse_mode: "Markdown" }
    );
  }
});

// 🔹 повідомлення при запуску
console.log("✅ Tap Game Bot запущено і готово до гри!");
