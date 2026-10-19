# GILEO frontend redesign notes

## Included in this pass
- Added a custom GILEO wordmark asset at `assets/gileo-logo.png`, because the uploaded source referenced this file but it was missing from the ZIP.
- Added three coordinated original onboarding illustrations at `assets/onboarding-care.png`, `assets/onboarding-growth.png`, and `assets/onboarding-privacy.png`.
- Updated onboarding copy to distinguish healthcare/marketplace access from community and professional learning.
- Added a gentle continuous floating motion to the onboarding illustration, retaining the existing slide entrance transitions, progress indicators, skip, back, and finish flow.
- Redesigned the home screen around the four GILEO pillars and retained links to the existing health records, women's health, and profile screens.
- Replaced the Expo starter `Explore` page with a GILEO discovery/support page. Features that do not yet have implemented frontend flows direct users to GILEO support rather than pretending those flows are live.
- Updated app icon artwork and splash background to align with the GILEO burgundy/gold/cream brand.
- Preserved existing auth/service logic and package dependencies.

## Validation
- Checked 41 TypeScript/TSX files using TypeScript transpilation: no syntax diagnostics.
- Checked JSON syntax for `app.json` and `package.json`.
- Checked local image `require(...)` references: no missing image assets found.
- A full Expo typecheck/build could not be completed in this environment because dependencies could not be installed completely. Please run `npm ci` followed by `npx expo start` or `npm run lint` locally before merging with backend changes.

## Important integration note
The marketplace, nursing community, and learning/Elevate destinations are currently discovery/support entry points, not completed production workflows. The next pass should connect these cards to the backend endpoints and real frontend screens once those flows are ready.
