# YHWH

An endlessly expanding, static archive of Jewish religious prohibitions, sacred names, restrictions and historical controversies. The site is named YHWH and its first profile (ID 1) is YHWH.

## Files
- `index.html`, `style.css`: shell and dark interface (no footer, no end state).
- `data.js`: curated source data (17 categories, 58 curated subjects with sources). Edit here to improve content.
- `engine.js`: deterministic profile engine (no DOM). IDs are decimal strings / BigInt, never Number.
- `script.js`: hash routing, observer-based infinite feed, search UI.
- `test.js`: engine tests (`node test.js`).

## How profiles work
- IDs 1..58 are curated profiles with factual content and source citations.
- Every larger ID decodes (mixed radix, BigInt) to: curated subject x research angle x period x series number. The mapping is bijective, so an ID always gives the same profile and the series never ends.
- Generated profiles are labelled **Exploratory research angle**. They restate the curated record and pose a question; they add no rulings, quotations or citations. Unlimited generation is not unlimited verified information.
- Search covers the whole universe independently of the feed (names, Hebrew, transliterations, categories, periods, tags). A string of digits of any length resolves directly to its profile with every digit preserved.

## Infinite feed
IntersectionObserver on a sentinel (1800px lookahead) appends chunks of 12 cards; the observer is re-armed after every batch, plus a throttled scroll check, visibility/pageshow hooks and a 2s watchdog for recovery. Failed batches retry with back-off. Far-off chunks are emptied (height preserved) and re-rendered when they return, so the DOM stays small. Feed order permutes IDs so categories interleave.

## Deploy on GitHub Pages
1. Create a repository and upload all files to the root.
2. Settings > Pages > Deploy from branch > `main` / root.
3. Open `https://<user>.github.io/<repo>/`. Routes use `#/...`, so refresh and direct links work without server rewrites.

Locally: open `index.html`, or `python3 -m http.server`.

## Testing status (honest)
`node test.js` runs engine tests: first item is YHWH, 2000 consecutive batches with no duplicates, feed-order bijection, BigInt round-trips (up to 10^400), 30- and 5000-digit IDs, name uniqueness over 30,000 IDs, search for English/Hebrew/variant terms.
**Not yet performed:** browser tests of the observer feed, scroll stability, Android devices, Hebrew rendering and missing-image behaviour. Run these before relying on the UI claims above.

## Content caveats
Citations give standard locations (e.g., Mishnah Shabbat 7:2) and were written from general knowledge, not checked against editions. Have a qualified reviewer verify them. Practices differ among communities; nothing here is a universal ruling. Visuals are generated abstract art, not artifacts; no external images are used.
