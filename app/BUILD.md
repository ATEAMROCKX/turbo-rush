# Turbo Rush – iPhone app: build, submit, update

The app is a small Expo shell that runs the web game (`../index.html`) fully offline.
Saves live in the app's own storage under the key `turboGarage` — never rename it.

## One-time setup (on your computer: Mac or Windows, Node 20+)
```bash
git clone https://github.com/ATEAMROCKX/turbo-rush.git
cd turbo-rush/app
npm install
npx eas-cli@latest login            # same Expo account as the family finance app
npx eas-cli@latest init             # creates the Expo project, writes its projectId into app.json
npx eas-cli@latest update:configure # turns on over-the-air updates (writes updates.url into app.json)
git add -A && git commit -m "Link Expo project" && git push
```

## First iPhone build and upload (needs your Apple Developer account approved)
```bash
npm run build:game                                   # bundles the latest game into the app
npx eas-cli@latest build -p ios --profile production # log in with your Apple ID when asked; let EAS create the certificates
npx eas-cli@latest submit -p ios --latest            # uploads to App Store Connect (creates the app record if needed)
```
Then in App Store Connect: TestFlight → install on your iPhone and test → fill in the listing from `store/listing.md`, upload `store/screenshots`, answer App Privacy = Data Not Collected → Submit for Review.

## Updating the game later
- Game-only changes (most changes):
  ```bash
  npm run build:game
  npx eas-cli@latest update --channel production -m "What changed"
  ```
  Players get it the next time they open the app. No review.
- App-level changes (name, icon, new native features, Expo SDK upgrade): bump `version` in app.json, then build + submit again (needs review).
