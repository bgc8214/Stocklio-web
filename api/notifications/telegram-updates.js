const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");

  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
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
    await getRequestUser(request);
    const updates = await getTelegramUpdates();
    response.status(200).json({
      ok: true,
      chats: extractChats(updates).slice(0, 5),
    });
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

async function getTelegramUpdates() {
  const url = new URL(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`);
  url.searchParams.set("limit", "20");
  const result = await fetch(url);
  if (!result.ok) {
    const errorText = await result.text();
    throw new Error(`telegram_updates_failed_${result.status}: ${errorText.slice(0, 200)}`);
  }
  const payload = await result.json();
  if (!payload.ok) {
    throw new Error(payload.description || "telegram_updates_failed");
  }
  return Array.isArray(payload.result) ? payload.result : [];
}

function extractChats(updates) {
  const map = new Map();
  for (const update of updates) {
    const chat = update.message?.chat || update.edited_message?.chat || update.channel_post?.chat;
    if (!chat?.id || map.has(String(chat.id))) {
      continue;
    }
    map.set(String(chat.id), {
      id: String(chat.id),
      type: chat.type || "",
      name: [chat.title, chat.first_name, chat.last_name].filter(Boolean).join(" ").trim() || chat.username || String(chat.id),
      username: chat.username || "",
    });
  }
  return [...map.values()].reverse();
}
