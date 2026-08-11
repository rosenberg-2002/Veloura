"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import styles from "@/components/Header.module.css";

export function AuthControls() {
  const { status, user, login, logout } = useAuth();

  if (status === "initializing") {
    return (
      <span className={styles.authStatus} aria-live="polite">
        <span className={styles.authStatusFull}>Checking session…</span>
        <span className={styles.authStatusShort}>SSO…</span>
      </span>
    );
  }

  if (status === "error") {
    return (
      <span
        className={styles.authStatus}
        title="Keycloak is unavailable. Public movie browsing still works."
      >
        <span className={styles.authStatusFull}>SSO unavailable</span>
        <span className={styles.authStatusShort}>SSO</span>
      </span>
    );
  }

  if (status === "anonymous") {
    return (
      <button className={styles.authButton} type="button" onClick={() => void login()}>
        Sign in
      </button>
    );
  }

  return (
    <div className={styles.authControls}>
      <span className={styles.authIdentity} title={user?.email ?? undefined}>
        {user?.displayName}
      </span>
      <button className={styles.authButton} type="button" onClick={() => void logout()}>
        Sign out
      </button>
    </div>
  );
}
