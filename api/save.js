export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  try {
    const body = req.body && typeof req.body === "object" ? req.body : JSON.parse(req.body || "{}");
    const { user_id, init_data, coins, xp, level, energy } = body;
    if (!user_id) return res.status(400).json({ ok: false, error: "Missing user_id" });

    // (необов'язково) перевірка initData
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
    const payload = JSON.stringify({
      coins: Number(coins) || 0,
      xp: Number(xp) || 0,
      level: Number(level) || 1,
      energy: Number(energy) || 0,
      updated_at: Date.now()
    });

    // SET key value
    const r = await fetch(`${url}/set/${encodeURIComponent(key)}/${encodeURIComponent(payload)}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await r.json();

    return res.status(200).json({ ok: true, result: data.result || "OK" });
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

    const user = JSON.parse(urlParams.get("user") || "{}");
    return { id: user.id };
  } catch {
    return null;
  }
}
