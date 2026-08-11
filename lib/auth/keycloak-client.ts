import Keycloak, { type KeycloakConfig } from "keycloak-js";

const keycloakConfig: KeycloakConfig = {
  url: process.env.NEXT_PUBLIC_KEYCLOAK_URL ?? "http://localhost:8080",
  realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM ?? "veloura",
  clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ?? "veloura-web",
};

let client: Keycloak | null = null;
let initialization: Promise<boolean> | null = null;

export function getKeycloakClient(): Keycloak {
  if (typeof window === "undefined") {
    throw new Error("The Keycloak client is only available in the browser.");
  }

  client ??= new Keycloak(keycloakConfig);
  return client;
}

export async function initializeKeycloak(): Promise<Keycloak> {
  const keycloak = getKeycloakClient();

  initialization ??= keycloak
    .init({
      onLoad: "check-sso",
      pkceMethod: "S256",
      checkLoginIframe: false,
      silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
      silentCheckSsoFallback: false,
    })
    .catch((error: unknown) => {
      initialization = null;
      throw error;
    });

  await initialization;
  return keycloak;
}
