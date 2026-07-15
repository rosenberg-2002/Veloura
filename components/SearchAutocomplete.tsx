"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FocusEvent, type KeyboardEvent } from "react";
import styles from "./SearchAutocomplete.module.css";

const MINIMUM_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 250;

type SuggestionKind = "movie" | "person" | "production";

type SearchSuggestion = {
  id: number;
  kind: SuggestionKind;
  title: string;
  subtitle: string;
  imagePath: string | null;
  href: string;
};

type SuggestionGroup = {
  label: string;
  items: SearchSuggestion[];
};

type SuggestionResponse = {
  groups: SuggestionGroup[];
};

function posterUrl(path: string | null): string | null {
  return path ? `https://image.tmdb.org/t/p/w92${path}` : null;
}

export function SearchAutocomplete() {
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<SuggestionGroup[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const normalizedQuery = query.trim();

    if (normalizedQuery.length < MINIMUM_QUERY_LENGTH) {
      setGroups([]);
      setIsLoading(false);
      setHasError(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsLoading(true);
      setHasError(false);

      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(normalizedQuery)}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Suggestions request failed");

        const data = await response.json() as SuggestionResponse;
        if (!controller.signal.aborted) setGroups(data.groups || []);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (!controller.signal.aborted) {
          setGroups([]);
          setHasError(true);
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  const canShowPanel = isOpen && query.trim().length >= MINIMUM_QUERY_LENGTH;

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  }

  return (
    <div className={`${styles.autocomplete} header-autocomplete`} onBlur={handleBlur}>
      <form className={styles.search} action="/search" role="search">
        <label className={styles.searchBox}>
          <span className={styles.searchGlyph} aria-hidden="true" />
          <span className={styles.srOnly}>Search Veloura</span>
          <input
            ref={inputRef}
            name="q"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setIsOpen(event.target.value.trim().length >= MINIMUM_QUERY_LENGTH);
            }}
            onFocus={() => setIsOpen(query.trim().length >= MINIMUM_QUERY_LENGTH)}
            onKeyDown={handleKeyDown}
            aria-autocomplete="list"
            aria-controls="header-search-suggestions"
            aria-expanded={canShowPanel}
            placeholder="Search anything"
          />
        </label>
        <label className={styles.categoryLabel}>
          <span className={styles.srOnly}>Search category</span>
          <select name="type" aria-label="Search category" defaultValue="all">
            <option value="all">All</option>
            <option value="movies">Movies</option>
            <option value="people">People</option>
            <option value="productions">Productions</option>
          </select>
        </label>
        <button className={styles.submit} type="submit" aria-label="Search">→</button>
      </form>

      {canShowPanel && (
        <div className={styles.panel} id="header-search-suggestions" aria-live="polite">
          {isLoading && <p className={styles.status}>Searching the archive…</p>}
          {!isLoading && hasError && <p className={styles.status}>Suggestions are unavailable right now.</p>}
          {!isLoading && !hasError && groups.length === 0 && <p className={styles.status}>No quick matches. Press Enter for the full search.</p>}
          {!isLoading && groups.map((group) => (
            <section className={styles.group} key={group.label} aria-label={group.label}>
              <p>{group.label}</p>
              {group.items.map((item) => {
                const image = posterUrl(item.imagePath);
                return (
                  <Link className={styles.result} href={item.href} key={`${item.kind}-${item.id}`}>
                    {image ? <img src={image} alt="" /> : <span className={styles.fallback} aria-hidden="true">{item.title.slice(0, 1)}</span>}
                    <span className={styles.resultCopy}>
                      <strong>{item.title}</strong>
                      <small>{item.subtitle}</small>
                    </span>
                    <span className={styles.kind}>{item.kind === "production" ? "Studio" : item.kind}</span>
                  </Link>
                );
              })}
            </section>
          ))}
          {!isLoading && !hasError && groups.length > 0 && (
            <Link className={styles.allResults} href={`/search?q=${encodeURIComponent(query.trim())}&type=all`}>
              View all results for “{query.trim()}” <span aria-hidden="true">→</span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
