import TelegramBot from "node-telegram-bot-api";

// 🔹 встав сюди свій токен з BotFather
const TOKEN = "8421572582:AAE94DhUfhFsDoNRn0Vh7xxu5r79afD8Vzk";

const bot = new TelegramBot(TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "🎮 Вітаю у Minecraft Tap Game!", {
    reply_markup: {
      keyboard: [
        [
          {
            text: "⛏️ Грати зараз",
            web_app: { url: "https://tapgame-8jxk.vercel.app/" } // посилання на гру (Vercel)
          }
        ]
      ],
      resize_keyboard: true
    }
  });
});
