# Korean Daily News: sports and entertainment

The Korean 생활정보 page ends with a simple 스포츠/연예 headline list. Korean articles stay on the Korean page. English Daily News is unchanged.

- Sources: 미주중앙일보, 미주한국일보, 라디오코리아, 코리아타운프레스. Google News RSS is restricted to each publisher's domain and verified publisher name.
- A recognizable Korean or Korean American person (or Korean entertainment group) must appear in the headline. Broad athlete/entertainer watchlists are in `src/data/sportsEntertainment.ts`; they span sports, veteran and current singers, actors, comedians, and Korean American performers. They can be revised editorially and do not infer identity from a surname or outlet. Foreign-only celebrity stories are excluded.
- This section covers those people worldwide, including Korea, per the editor's clarification. The main 생활정보 list keeps its U.S./local focus. Politics, endorsements and organization announcements are excluded.
- Use dated stories from the previous seven days. Preserve publication timestamps; omit future and undated articles.
- Prefer three sports and three entertainment links. If one category has fewer than three, the other fills available places, up to six total. Never pad the list with unrelated people. Hide the section when no qualifying story is available.
- Deduplicate before selecting. Earliest publication wins; suppress repeats from the main list. Narrow event keys also consolidate recognizable syndicated events with different titles.
- The candidate pool travels with `dailyEdition.json` and `dailyPending.json`. It follows the existing 6 a.m. full package, daytime updates until 5 p.m., and overnight hold. Ordinary builds use the saved edition only and do not fetch a separate live section after hours.
- `sportsEntertainmentSeed.json` supplies verified launch stories only for its exact `editionGeneratedAt`. The first automatic edition containing the section supersedes it. Launch data does not alter the main news package.

Validation: `node --import tsx scripts/test-sports-entertainment.ts`.
