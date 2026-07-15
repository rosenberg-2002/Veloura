import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("ships the finished Veloura experience instead of the starter", async () => {
  const [home, layout, styles, packageJson] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/layout.tsx", root), "utf8"),
    readFile(new URL("app/globals.css", root), "utf8"),
    readFile(new URL("package.json", root), "utf8"),
  ]);

  assert.match(home, /Trending this week/);
  assert.match(home, /\/trending\/movie\/week/);
  assert.match(layout, /Veloura/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.match(packageJson, /"name": "veloura-movies"/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.doesNotMatch(home, /SkeletonPreview|codex-preview/);
  await assert.rejects(access(new URL("app/_sites-preview/SkeletonPreview.tsx", root)));
});

test("keeps the TMDB credential server-side and includes every requested route", async () => {
  const tmdb = await readFile(new URL("lib/tmdb.ts", root), "utf8");

  assert.match(tmdb, /process\.env\.TMDB_API_KEY/);
  assert.doesNotMatch(tmdb, /440cf9c5dfe2074cd715ed3d08b0aaf7/);

  await Promise.all([
    access(new URL("app/discover/page.tsx", root)),
    access(new URL("app/genres/page.tsx", root)),
    access(new URL("app/productions/page.tsx", root)),
    access(new URL("app/people/page.tsx", root)),
    access(new URL("app/search/page.tsx", root)),
    access(new URL("app/movie/[id]/page.tsx", root)),
  ]);
});

test("normalizes query input and avoids dead entity links", async () => {
  const [search, discover, moviePage, searchParams] = await Promise.all([
    readFile(new URL("app/search/page.tsx", root), "utf8"),
    readFile(new URL("app/discover/page.tsx", root), "utf8"),
    readFile(new URL("app/movie/[id]/page.tsx", root), "utf8"),
    readFile(new URL("lib/search-params.ts", root), "utf8"),
  ]);

  assert.match(search, /\/search\/movie/);
  assert.match(search, /\/search\/person/);
  assert.match(search, /themoviedb\.org\/person/);
  assert.match(search, /themoviedb\.org\/company/);
  assert.doesNotMatch(search, /\/people\?person=/);
  assert.doesNotMatch(search, /\/productions\?company=/);
  assert.match(discover, /parsePageParam/);
  assert.match(moviePage, /notFound\(\)/);
  assert.match(searchParams, /Number\.isSafeInteger/);
});

test("includes universal navigation, theming, and bounded movie artwork", async () => {
  const [header, layout, moviePage, encyclopedia] = await Promise.all([
    readFile(new URL("components/Header.tsx", root), "utf8"),
    readFile(new URL("app/layout.tsx", root), "utf8"),
    readFile(new URL("app/movie/[id]/page.tsx", root), "utf8"),
    readFile(new URL("components/movie/MovieEncyclopedia.tsx", root), "utf8"),
  ]);

  assert.match(header, /\/genres/);
  assert.match(header, /\/productions/);
  assert.match(header, /\/people/);
  assert.match(header, /ThemeToggle/);
  assert.match(layout, /favicon\.png/);
  assert.match(moviePage, /Watch on|providerAction/);
  assert.match(encyclopedia, /id="artwork"/);
  assert.match(encyclopedia, /Expand.*more videos/);
});
