import { buildDailyDigest } from "../../src/domain/notification-core.js";
import { getUsMarketContextForSeoulDate } from "../../src/domain/market-calendar.js";

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

    // 봇 명의 임의 발송(스팸·피싱) 방지: 본인 계정에 저장된 chat id 이거나,
    // 그 대화에서 요청자의 로그인 이메일을 봇에게 보낸(소유 증명) 경우에만 발송한다.
    const authorizedChat = await isChatAuthorized(user, chatId);
    if (!authorizedChat) {
      response.status(403).json({ error: "telegram_chat_not_verified" });
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
      marketContext: getUsMarketContextForSeoulDate(snapshot.date || seoulDateKey()),
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

async function isChatAuthorized(user, chatId) {
  const rows = await supabaseFetch("/rest/v1/notification_settings", {
    searchParams: {
      select: "telegram_chat_id",
      user_id: `eq.${user.id}`,
      limit: "1",
    },
  }).catch(() => null);
  const savedChatId = String(rows?.[0]?.telegram_chat_id || "").trim();
  if (savedChatId && savedChatId === chatId) {
    return true;
  }
  // 온보딩(저장 전 테스트) 경로: 봇 대화에서 로그인 이메일을 보낸 chat 만 허용.
  const email = String(user.email || "").trim().toLowerCase();
  if (!email) {
    return false;
  }
  const updates = await getTelegramUpdates().catch(() => []);
  return updates.some((update) => {
    const message = update.message || update.edited_message || update.channel_post;
    return String(message?.chat?.id || "") === chatId &&
      String(message?.text || "").toLowerCase().includes(email);
  });
}

async function getTelegramUpdates() {
  const url = new URL(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`);
  url.searchParams.set("limit", "20");
  const result = await fetch(url);
  if (!result.ok) {
    throw new Error(`telegram_updates_failed_${result.status}`);
  }
  const payload = await result.json();
  return payload.ok && Array.isArray(payload.result) ? payload.result : [];
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
