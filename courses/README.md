# PFLX Core Pathways — Courses Folder

Every course lives in its own subfolder here, keyed by slug. Four files per course:

```
courses/
  graphic-design-concepts/
    course.json       # the course manifest (built with pflx-course-builder skill)
    viewer.html       # player-facing CourseViewer
    host.html         # host dashboard
    background.png    # course hero/background (or .jpg, or referenced via URL in course.json)
```

## Attaching a course to a node on the pathway map

1. Open **Edit Mode** on the pathway.
2. Click the node to open the **Edit Node** panel.
3. In the **Course Package** field, paste the folder slug (e.g. `graphic-design-concepts`).
4. Click **Save Node**.

Now:

- When HOST VIEW is **off** and a player clicks the node → opens `courses/{slug}/viewer.html`
- When HOST VIEW is **on** and a host clicks the node → opens `courses/{slug}/host.html`

The legacy **HTML Content File** field is still supported for nodes that haven't been converted to the new PFLX course format. If both fields are set, **Course Package wins**.

## Building a new course

Use the `pflx-course-builder` skill. It produces a valid `course.json` conforming to the 15-slide outline. Drop the output folder here, then reference the slug from any node(s) that should surface it. A single course can be referenced from multiple nodes across multiple pathways — courses are pathway-agnostic.

## Full URLs

The Course Package field also accepts a full URL (e.g. `https://cdn.pflx.app/courses/graphic-design-concepts`). That's how we'll reference courses hosted on a CDN or external domain in production. For local dev, just use the slug.
