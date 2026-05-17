import { buildDailyDigest } from "../../src/domain/notification-core.js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const SITE_URL = (process.env.VITE_PUBLIC_SITE_URL || "https://stocklio-web.vercel.app").replace(/\/$/, "");

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.status(405).json({ error: "method not allowed" });
    return;
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    response.status(503).json({ error: "missing_supabase_service_configuration" });
    return;
  }
  if (!TELEGRAM_BOT_TOKEN) {
    response.status(503).json({ error: "missing_telegram_bot_token" });
    return;
  }

  try {
    const user = await getRequestUser(request);
    const body = await readJson(request);
    const chatId = String(body.chatId || "").trim();
    if (!chatId) {
      response.status(400).json({ error: "telegram_chat_id_required" });
      return;
    }

    const portfolio = await getPortfolioState(user.id);
    const state = portfolio?.state || {};
    const snapshots = [...(state.portfolioSnapshots || [])].sort((a, b) => a.date.localeCompare(b.date));
    const snapshot = snapshots.at(-1) || {
      date: seoulDateKey(),
      totalValueKrw: 0,
      netInflowKrw: 0,
    };
    const digest = buildDailyDigest({
      state,
      snapshot,
      previousSnapshot: snapshots.at(-2),
      date: snapshot.date || seoulDateKey(),
      siteUrl: SITE_URL,
    });
    const text = `${digest.text}\n\n테스트 메시지입니다.`;

    await sendTelegramMessage(chatId, text);
    await recordDeliveryLog({
      user_id: user.id,
      provider: "telegram",
      status: "success",
      message_type: "test",
      message_preview: text.slice(0, 500),
      sent_at: new Date().toISOString(),
    });

    response.status(200).json({ ok: true });
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
}

async function getRequestUser(request) {
  const token = String(request.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) {
    throw new Error("missing_authorization");
  }
  const result = await fetch(new URL("/auth/v1/user", SUPABASE_URL), {
    headers: {
      apikey: SERVICE_ROLE_KEY,
      authorization: `Bearer ${token}`,
    },
  });
  if (!result.ok) {
    throw new Error(`auth_user_failed_${result.status}`);
  }
  return result.json();
}

async function getPortfolioState(userId) {
  const rows = await supabaseFetch("/rest/v1/portfolio_states", {
    searchParams: {
      select: "state",
      user_id: `eq.${userId}`,
      limit: "1",
    },
  });
  return Array.isArray(rows) ? rows[0] : null;
}

async function recordDeliveryLog(log) {
  await supabaseFetch("/rest/v1/notification_delivery_logs", {
    method: "POST",
    body: JSON.stringify(log),
    headers: {
      "content-type": "application/json",
      prefer: "return=minimal",
    },
  });
}

async function sendTelegramMessage(chatId, text) {
  const result = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  });
  if (!result.ok) {
    const errorText = await result.text();
    throw new Error(`telegram_send_failed_${result.status}: ${errorText.slice(0, 200)}`);
  }
}

async function supabaseFetch(path, options = {}) {
  const url = new URL(path, SUPABASE_URL);
  for (const [key, value] of Object.entries(options.searchParams || {})) {
    url.searchParams.set(key, value);
  }
  const result = await fetch(url, {
    method: options.method || "GET",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      ...(options.headers || {}),
    },
    body: options.body,
  });
  if (!result.ok) {
    const text = await result.text();
    throw new Error(`Supabase ${result.status}: ${text.slice(0, 300)}`);
  }
  const text = await result.text();
  return text ? JSON.parse(text) : null;
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : {};
}

function seoulDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
