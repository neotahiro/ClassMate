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

## Personal planner features

- **Done folder:** marking an assignment complete asks for confirmation. Completed items remain available under Done and can be unticked to restore them.
- **Subject initials:** subject marks use initials across the subject name, omitting common connector words such as “and” and “of”.
- **Personal items:** use **+ Add** for an assignment, reading, or reminder. Items are marked **Mine** and can be edited or deleted. Personal data is stored in this browser's local storage.
- **Backups:** use **Copy backup** to copy personal items and completion states as JSON, and **Restore backup** to import that JSON on another device. Restore replaces the current local personal data after confirmation.
- **Offline hub fallback:** after Assignment Hub data loads successfully once, ClassMate saves a browser-local copy. If the live hub data is unavailable on a later visit, it uses that copy and displays a notice.

Privacy note: ClassMate does not upload personal items or completion states to a ClassMate server. They remain in this browser unless the student explicitly copies/exports a backup. Clearing browser site data can remove them, so keep a backup if they matter. Public hosting providers may still process ordinary web request logs. The live Assignment Hub data remains public source data.
