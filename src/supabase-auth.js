import { createClient } from "@supabase/supabase-js";

const config = window.STOCKLIO_SUPABASE || {};
const url = config.url || "";
const anonKey = config.anonKey || "";
const siteUrl = getConfiguredUrl(config.siteUrl);

let client = null;
let session = null;

const hasSupabaseConfig =
  url &&
  anonKey &&
  !url.includes("YOUR_") &&
  !anonKey.includes("YOUR_") &&
  !url.includes("%") &&
  !anonKey.includes("%");

if (hasSupabaseConfig) {
  client = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  const { data } = await client.auth.getSession();
  session = data.session;
  client.auth.onAuthStateChange((_event, nextSession) => {
    session = nextSession;
    window.dispatchEvent(new CustomEvent("stocklio:auth", { detail: getAuthState() }));
  });
}

window.StocklioAuth = {
  isConfigured: () => Boolean(client),
  getState: getAuthState,
  signInWithNaver,
  signInWithGoogle,
  signInWithEmail,
  signOut,
  getAccessToken,
  loadPortfolioState,
  savePortfolioState,
  loadNotificationSettings,
  saveNotificationSettings,
  loadNotificationDeliveryLogs,
};

window.dispatchEvent(new CustomEvent("stocklio:auth", { detail: getAuthState() }));

function getAuthState() {
  return {
    configured: Boolean(client),
    signedIn: Boolean(session?.user),
    user: session?.user
      ? {
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email,
          avatarUrl: session.user.user_metadata?.avatar_url || "",
        }
      : null,
  };
}

async function signInWithGoogle() {
  return signInWithOAuthProvider("google");
}

async function signInWithNaver() {
  return signInWithOAuthProvider("custom:naver");
}

async function signInWithOAuthProvider(provider) {
  if (!client) {
    throw new Error("Supabase 설정이 없습니다");
  }
  const { error } = await client.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: siteUrl || window.location.origin,
    },
  });
  if (error) {
    throw error;
  }
}

async function signInWithEmail(email) {
  if (!client) {
    throw new Error("Supabase 설정이 없습니다");
  }
  const normalizedEmail = String(email || "").trim();
  if (!normalizedEmail) {
    throw new Error("이메일을 입력하세요");
  }
  const { error } = await client.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      emailRedirectTo: siteUrl || window.location.origin,
      shouldCreateUser: true,
    },
  });
  if (error) {
    throw error;
  }
}

function getConfiguredUrl(value) {
  const candidate = String(value || "").trim();
  if (!candidate || candidate.includes("%") || candidate.includes("YOUR_")) {
    return "";
  }
  return candidate.replace(/\/$/, "");
}

async function signOut() {
  if (!client) {
    return;
  }
  session = null;
  clearStoredSession();
  window.dispatchEvent(new CustomEvent("stocklio:auth", { detail: getAuthState() }));

  client.auth.signOut({ scope: "local" }).catch((error) => {
    console.warn("Stocklio sign-out cleanup failed", error);
  });
}

function getAccessToken() {
  return session?.access_token || "";
}

function clearStoredSession() {
  const storageKeys = [];
  for (const storage of [window.localStorage, window.sessionStorage]) {
    try {
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        if (key && (key.startsWith("sb-") || key.includes("supabase.auth.token"))) {
          storageKeys.push([storage, key]);
        }
      }
    } catch {
      // Some embedded browsers can deny storage access during auth redirects.
    }
  }
  for (const [storage, key] of storageKeys) {
    try {
      storage.removeItem(key);
    } catch {
      // Best-effort cleanup; the in-memory session has already been cleared.
    }
  }
}

async function loadPortfolioState() {
  if (!client || !session?.user) {
    return null;
  }
  const { data, error } = await client
    .from("portfolio_states")
    .select("state")
    .eq("user_id", session.user.id)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data?.state || null;
}

async function savePortfolioState(state) {
  if (!client || !session?.user) {
    return { skipped: true };
  }
  const { error } = await client.from("portfolio_states").upsert({
    user_id: session.user.id,
    state,
  });
  if (error) {
    throw error;
  }
  return { ok: true };
}

async function loadNotificationSettings() {
  if (!client || !session?.user) {
    return null;
  }
  const { data, error } = await client
    .from("notification_settings")
    .select("*")
    .eq("user_id", session.user.id)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data || null;
}

async function saveNotificationSettings(settings) {
  if (!client || !session?.user) {
    return { skipped: true };
  }
  const { error } = await client.from("notification_settings").upsert({
    user_id: session.user.id,
    provider: "telegram",
    telegram_chat_id: settings.telegram_chat_id || null,
    telegram_enabled: Boolean(settings.telegram_enabled),
    daily_digest_enabled: Boolean(settings.daily_digest_enabled),
    large_move_threshold_krw: Number(settings.large_move_threshold_krw || 0),
  });
  if (error) {
    throw error;
  }
  return { ok: true };
}

async function loadNotificationDeliveryLogs(limit = 10) {
  if (!client || !session?.user) {
    return [];
  }
  const { data, error } = await client
    .from("notification_delivery_logs")
    .select("id, provider, message_type, status, message_preview, error_message, sent_at, created_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    throw error;
  }
  return data || [];
}
