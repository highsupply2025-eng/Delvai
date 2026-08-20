export type PaddleEnv = "sandbox" | "live";

const GATEWAY = "https://gateway.lovable.dev/paddle";

export async function gatewayFetch(env: PaddleEnv, path: string, init?: RequestInit) {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const connectionKey =
    env === "live" ? process.env["PADDLE_LIVE_API_KEY"] : process.env["PADDLE_SANDBOX_API_KEY"];

  if (!lovableKey || !connectionKey) {
    throw new Error("Paddle gateway credentials are not configured");
  }

  const headers = new Headers(init?.headers);
  headers.set("Lovable-API-Key", lovableKey);
  headers.set("X-Connection-Api-Key", connectionKey);
  headers.set("Paddle-Environment", env);
  if (init?.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const response = await fetch(`${GATEWAY}${path}`, { ...init, headers });
  if (!response.ok) {
    throw new Error(`Paddle request failed (${response.status}): ${await response.text()}`);
  }
  return response;
}
