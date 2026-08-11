"use client";

import { useEffect, useState } from "react";
import styles from "@/app/catalog.module.css";

type PeopleSearchFieldProps = {
  defaultValue: string;
};

export function PeopleSearchField({ defaultValue }: PeopleSearchFieldProps) {
  const [isReady, setIsReady] = useState(false);
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    const normalizedValue = value.trim();
    if (normalizedValue === defaultValue) return;

    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (normalizedValue) params.set("q", normalizedValue);
      else params.delete("q");

      const query = params.toString();
      window.history.replaceState(null, "", query ? `/people?${query}` : "/people");
      window.location.reload();
    }, 500);

    return () => window.clearTimeout(timer);
  }, [defaultValue, value]);

  return (
    <label className={styles.peopleSearchField}>
      <span>Search performers</span>
      <input
        aria-describedby="people-search-hint"
        autoComplete="off"
        data-ready={isReady}
        name="q"
        onInput={(event) => setValue(event.currentTarget.value)}
        placeholder="Tom Hanks, Saoirse Ronan…"
        type="search"
        value={value}
      />
      <small id="people-search-hint">Results update automatically as you type.</small>
    </label>
  );
}
