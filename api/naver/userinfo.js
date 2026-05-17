export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");

  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    response.status(405).json({ error: "method not allowed" });
    return;
  }

  const authorization = request.headers.authorization || "";
  if (!authorization.toLowerCase().startsWith("bearer ")) {
    response.status(401).json({ error: "missing bearer token" });
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const naverResponse = await fetch("https://openapi.naver.com/v1/nid/me", {
      headers: {
        accept: "application/json",
        authorization,
      },
      signal: controller.signal,
    });
    const payload = await naverResponse.json().catch(() => null);
    if (!naverResponse.ok || !payload?.response?.id) {
      response.status(naverResponse.ok ? 502 : naverResponse.status).json({
        error: "naver_userinfo_unavailable",
        status: payload?.resultcode || naverResponse.status,
      });
      return;
    }

    const profile = payload.response;
    response.status(200).json({
      sub: String(profile.id),
      email: profile.email || undefined,
      email_verified: Boolean(profile.email),
      name: profile.name || profile.nickname || "",
      nickname: profile.nickname || "",
      picture: profile.profile_image || "",
      avatar_url: profile.profile_image || "",
    });
  } catch (error) {
    response.status(error.name === "AbortError" ? 504 : 502).json({ error: "naver_userinfo_proxy_failed" });
  } finally {
    clearTimeout(timeout);
  }
}
