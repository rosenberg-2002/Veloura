"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { KeycloakTokenParsed } from "keycloak-js";
import {
  getKeycloakClient,
  initializeKeycloak,
} from "@/lib/auth/keycloak-client";

type AuthStatus = "initializing" | "authenticated" | "anonymous" | "error";

export type AuthUser = {
  id: string;
  displayName: string;
  email: string | null;
};

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function userFromToken(token: KeycloakTokenParsed | undefined): AuthUser | null {
  if (!token?.sub) return null;

  const email = typeof token.email === "string" ? token.email : null;
  const preferredUsername =
    typeof token.preferred_username === "string"
      ? token.preferred_username
      : null;
  const name = typeof token.name === "string" ? token.name : null;

  return {
    id: token.sub,
    displayName: name ?? preferredUsername ?? email ?? "Veloura member",
    email,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("initializing");
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let active = true;

    void initializeKeycloak()
      .then((keycloak) => {
        const syncSession = () => {
          if (!active) return;

          const nextUser = keycloak.authenticated
            ? userFromToken(keycloak.tokenParsed)
            : null;
          setUser(nextUser);
          setStatus(nextUser ? "authenticated" : "anonymous");
        };

        keycloak.onAuthSuccess = syncSession;
        keycloak.onAuthRefreshSuccess = syncSession;
        keycloak.onAuthLogout = syncSession;
        keycloak.onTokenExpired = () => {
          void keycloak
            .updateToken(30)
            .then(syncSession)
            .catch(() => {
              keycloak.clearToken();
              syncSession();
            });
        };

        syncSession();
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
        setStatus("error");
      });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async () => {
    const keycloak = getKeycloakClient();
    await keycloak.login({ redirectUri: window.location.href });
  }, []);

  const logout = useCallback(async () => {
    const keycloak = getKeycloakClient();
    await keycloak.logout({ redirectUri: window.location.origin });
  }, []);

  const getAccessToken = useCallback(async () => {
    const keycloak = getKeycloakClient();
    if (!keycloak.authenticated) return null;

    await keycloak.updateToken(30);
    return keycloak.token ?? null;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, login, logout, getAccessToken }),
    [getAccessToken, login, logout, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
}
