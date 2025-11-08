export default async function handler(req, res) {
  // CORS (на випадок, якщо відкриватимеш і з локалки)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "Method not allowed" });

  try {
    const { user_id, init_data } = req.query;
    if (!user_id) return res.status(400).json({ ok: false, error: "Missing user_id" });

    // (необов'язково) перевірка initData з Telegram — якщо додаси BOT_TOKEN як секрет:
    const needVerify = !!process.env.BOT_TOKEN && !!init_data;
    if (needVerify) {
      const verified = await verifyTelegramInitData(init_data, process.env.BOT_TOKEN);
      if (!verified || String(verified.id) !== String(user_id)) {
        return res.status(401).json({ ok: false, error: "initData verify failed" });
      }
    }

    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return res.status(500).json({ ok: false, error: "Upstash env missing" });

    const key = `tg:${user_id}`;
    const r = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await r.json();

    if (data.result == null) {
      // немає запису — повернемо порожній дефолт
      return res.status(200).json({
        ok: true,
        data: { coins: 0, xp: 0, level: 1, energy: 500, updated_at: Date.now() }
      });
    }

    const parsed = JSON.parse(data.result);
    return res.status(200).json({ ok: true, data: parsed });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || "Unknown error" });
  }
}

// ====== Перевірка Telegram initData (опційно) ======
import crypto from "crypto";
async function verifyTelegramInitData(initData, botToken) {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get("hash");
    urlParams.delete("hash");

    const dataCheckArr = [];
    for (const [key, value] of urlParams.entries()) {
      dataCheckArr.push(`${key}=${value}`);
    }
    dataCheckArr.sort();
    const dataCheckString = dataCheckArr.join("\n");

    const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
    const hmac = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

    if (hmac !== hash) return null;

    // витягнемо user.id з initData
    const user = JSON.parse(urlParams.get("user") || "{}");
    return { id: user.id };
  } catch {
    return null;
  }
}
