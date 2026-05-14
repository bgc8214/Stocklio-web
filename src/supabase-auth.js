import { createClient } from "@supabase/supabase-js";

const config = window.STOCKLIO_SUPABASE || {};
const url = config.url || "";
const anonKey = config.anonKey || "";

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
  signInWithGoogle,
  signOut,
  loadPortfolioState,
  savePortfolioState,
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
  if (!client) {
    throw new Error("Supabase 설정이 없습니다");
  }
  const { error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin,
    },
  });
  if (error) {
    throw error;
  }
}

async function signOut() {
  if (!client) {
    return;
  }
  const { error } = await client.auth.signOut();
  if (error) {
    throw error;
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
