import * as crypto from "crypto";

export function generateBearerToken(nonce: string): string {
  const AUTHZ_HMAC_KEY = "kas73jaslkks8291jjsiwn2au128aash98";
  const AUTHZ_HMAC_SECRET =
    "f01a676b59ff93ee7c15b749653f2e7cf3a78d8dd0d1bf7ecbd1e1c26097d45a";

  const message = AUTHZ_HMAC_SECRET + nonce;

  const hmacHash = crypto
    .createHmac("sha256", AUTHZ_HMAC_KEY)
    .update(message)
    .digest("hex");

  return `Bearer ${hmacHash}.${nonce}`;
}
