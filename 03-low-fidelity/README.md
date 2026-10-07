# Low-fidelity wireframes

One wireframe per screen, and one per state where a screen changes, such as a scholar's
dashboard before and after the deadline. Each one serves steps of a swimlane.

## Rules

- **One file per screen state:** `role-screen--state.html`, for example
  `scholar-dashboard--outstanding.html`, with its PNG beside it (`npm run render`). Leave
  out `--state` when a screen has only one.
- **Grey boxes and real words.** No colour, images or branding: only the layout, the
  labels, and what each part holds. Every wireframe uses the shared `_wireframe.css`.
- **Real content, invented people.** The SRS's labels and states, with invented names and
  `@example.test` addresses.
- **Width:** set it with `<meta name="render-width" content="390" />`. Scholar screens are
  drawn for a phone (390); everyone else's for a laptop (1440), unless the course asks
  otherwise.
- **Only what the swimlane and the SRS say.** A gap you had to fill is labelled "assumed".

## Index

| Screen | Serves | Owner | Status |
| ------ | ------ | ----- | ------ |

Empty until the first pull request lists every screen the swimlanes need.
