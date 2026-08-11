import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("configures Keycloak as a public PKCE client without browser secrets", async () => {
  const [client, provider, environment, packageJson] = await Promise.all([
    readFile(new URL("lib/auth/keycloak-client.ts", root), "utf8"),
    readFile(new URL("components/auth/AuthProvider.tsx", root), "utf8"),
    readFile(new URL(".env.example", root), "utf8"),
    readFile(new URL("package.json", root), "utf8"),
  ]);

  assert.match(packageJson, /"keycloak-js": "26\.2\.4"/);
  assert.match(client, /pkceMethod: "S256"/);
  assert.match(client, /onLoad: "check-sso"/);
  assert.match(client, /silentCheckSsoRedirectUri/);
  assert.match(client, /silentCheckSsoFallback: false/);
  assert.match(provider, /keycloak\.updateToken\(30\)/);
  assert.match(environment, /NEXT_PUBLIC_KEYCLOAK_URL=http:\/\/localhost:8080/);
  assert.doesNotMatch(environment, /KEYCLOAK_CLIENT_SECRET/);
  assert.doesNotMatch(provider, /localStorage|sessionStorage/);
});

test("keeps browsing public while exposing optional sign-in in the header", async () => {
  const [header, controls, layout] = await Promise.all([
    readFile(new URL("components/Header.tsx", root), "utf8"),
    readFile(new URL("components/auth/AuthControls.tsx", root), "utf8"),
    readFile(new URL("app/layout.tsx", root), "utf8"),
  ]);

  assert.match(header, /AuthControls/);
  assert.match(controls, /Sign in/);
  assert.match(controls, /Sign out/);
  assert.match(layout, /AuthProvider/);
});
