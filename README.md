# Chromatic Daily

Build a high-fidelity, minimalist web app memory game called "Chromatic Daily."

Aesthetic & UI:

Style: Management Consultant meets Apple. Minimalist, high white space, crisp borders.

Layout: A central white card with rounded corners and a subtle soft shadow. Inside the card is a 3x3 grid of 9 circles.

Color Palette:

Neutral State: Light gray circles (#D1D5DB).

Active Palette: Red (#EF4444), Yellow (#FDE047), Teal (#6EE7B7), Orange (#F97316), Purple (#8B5CF6), Lime (#BEF264), Green (#3F6212), Pink (#EC4899), Blue (#2563EB).

Typography: Elegant Serif for headings, clean Sans-serif for instructions.

Game Logic & Mechanics:

Daily Progression: The game detects the current day of the week.

Monday: 3 random circles are colored.

Progressive Difficulty: Add 1 color each day (Tuesday=4, Wednesday=5...), culminating in all 9 circles being colored by Sunday.

Phase 1 (Observation): * On "Start," the grid shows the daily color pattern for 5 seconds.

A minimalist countdown timer (linear bar at the top) shows the remaining time.

Phase 2 (Neutral): * After 5 seconds, all circles turn to the Neutral Gray state.

A "Color Picker" (a row of the active colors used in that round) appears at the bottom.

Phase 3 (Input): * The player clicks a color from the picker, then clicks a circle in the grid to "paint" it.

Once the grid is filled, the player hits a "Verify" button.

Phase 4 (Results): * Compare the player's grid to the original.

Show a "Success" screen with a Wordle-style shareable grid (using emojis: 🟩 for correct, ⬛ for wrong).

Limit play to one attempt per day.

Additional Features:

Add a "How to Play" modal.

Save the user's "Streak" (number of consecutive correct days) to local storage.

Ensure the layout is responsive for both mobile and desktop.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://chromatic-daily.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a15626f9-32bd-4e21-8459-466989aad284).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
