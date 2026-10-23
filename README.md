# ClassMate

A mobile-first student planner with a green-accented interface, readable typography, and light/dark themes.

## Data source

ClassMate reads coursework from the public `data.js` in [neotahiro/assignment-hub](https://github.com/neotahiro/assignment-hub), using jsDelivr:

`https://cdn.jsdelivr.net/gh/neotahiro/assignment-hub@main/data.js`

The site consumes the existing `SUBJECTS`, `GENERAL`, and related data structures. New commits to the source repository can flow into ClassMate through the CDN, though CDN caching may delay updates briefly.

## Features in this starter

- Dashboard with total, completed, due-soon, and overdue counts
- Assignment list with search, status filters, and subject filters
- Subject cards and progress indicators
- Reading and lecture-note resource library
- Open assignment/resource links in a new tab
- Light and dark themes, remembered in the current browser
- Completion toggles, remembered locally in the current browser
- Responsive desktop sidebar and mobile bottom navigation

## Important data behavior

This is a static, read-only integration. ClassMate does **not** write changes back to Assignment Hub's `data.js`. Completion toggles are stored in the visitor's own browser `localStorage`, so they do not sync across devices or between classmates. The source data remains the shared list of coursework.

For shared completion states or edits that update the repository, a backend or authenticated GitHub API integration would be needed. Do not put a GitHub token in client-side JavaScript.

## Deploy on GitHub Pages

1. Create a new public repository named `classmate`.
2. Upload `index.html`, `styles.css`, `app.js`, and this `README.md` to the repository root.
3. In the repository, open **Settings → Pages**.
4. Choose **Deploy from a branch**, select `main` and `/ (root)`, then save.
5. Wait for the deployment and open the URL GitHub Pages provides.

No build step or package installation is required.

## Notes

- The site needs an internet connection to load the source data and Google Fonts.
- If the source file is renamed, moved, or its data structure changes, update `index.html` / `app.js`.
- Test the deployed URL on both a phone and desktop before sharing it with classmates.
