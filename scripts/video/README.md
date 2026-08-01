# Korean video builder

This builder turns the Korean copy in `src/data/scams.ts` into original
CRC-branded scam-awareness videos. Each output has Korean neural narration,
fully localized visuals, a poster, Korean captions, and JSON review metadata.

Install the narration helper once:

```bash
pipx install edge-tts
```

Build one guide or the complete set:

```bash
npm run videos:ko:one -- phishing
npm run videos:ko
npm run videos:ko:validate
```

Outputs go to `public/videos/ko/`; temporary files go to `.video-build/`.
To change voices, set `CRC_KO_VOICE=ko-KR-InJoonNeural` before the command.
The site data remains authoritative: edit the guide copy, then rerun the build.
