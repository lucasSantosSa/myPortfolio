# Lucas Santos · Portfolio

My portfolio site, with a career timeline, projects (screenshots, recordings and demo links), a contact form that reaches my email and WhatsApp, and a small built-in CMS.

**Stack:** React 19, TypeScript, Vite, Tailwind CSS 4, React Router, zod. The contact form runs as a Vercel serverless function. Tests use Vitest.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173, CMS at /admin
npm test
npm run build
```

## Content

Everything on the site comes from JSON files, validated against `src/content/schema.ts`:

| Path | What |
|---|---|
| `content/site.json` | Name, tagline, about text, highlights, contact details, socials, CV link, CMS repo/branch |
| `content/timeline/*.json` | Career timeline and activities (work, freelance, education, teaching, design, activity) |
| `content/projects/*.json` | Projects: summary, Markdown description, stack, status, repo, demo URL, media |
| `public/media/<slug>/` | Screenshots and recordings |
| `public/cv/` | Downloadable CV |

`npm test` checks every file against the schema, that links between projects and timeline entries resolve, and that local media files exist.

## CMS (`/admin`)

- **Local mode** (while `npm run dev` runs): saves straight into this checkout. Commit the changes with git afterwards.
- **GitHub mode** (on the live site): paste a fine-grained personal access token limited to this repo with *Contents: read and write*. Each save is a commit, and the host redeploys. The token stays in that browser tab only.

For each project you can:
- **Read a GitHub repo.** This fills in the title, summary, description (from the README), stack (languages and topics), repo link, homepage as demo URL and start date. It also lists screenshots found in the repo so you can copy them in. A repo can control this with a `portfolio.json` at its root:
  ```json
  { "title": "Business CRM", "summary": "One line", "stack": ["React", "NestJS"], "demoUrl": "https://…", "screenshots": ["docs/list.png"] }
  ```
- **Upload** screenshots and video, or **link** YouTube, Loom, asciinema, image or video URLs.
- **Set** the demo link, status, category, featured flag and order.

Timeline entries and site settings are edited the same way.

## Contact form

`POST /api/contact` (`api/contact.ts` → `server/contact.ts`) validates the message and drops bots (a honeypot field and a minimum fill time). It rate-limits by IP, then delivers to both channels at once:

- **Email** through [Resend](https://resend.com): `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, optional `CONTACT_FROM_EMAIL`
- **WhatsApp** through [CallMeBot](https://www.callmebot.com/blog/free-api-whatsapp-messages/): `CALLMEBOT_PHONE`, `CALLMEBOT_APIKEY`

Set these in the host's environment variables (see `.env.example`); never commit them. If neither channel is configured or delivery fails, the form shows pre-filled WhatsApp and email links so the visitor can still reach me. The dev server runs the same endpoint using `.env.local`.

## Deploy

Built for **Vercel**: import the repo, framework preset *Vite*, and add the environment variables above. `vercel.json` sends every page route to the SPA, and `api/` becomes the serverless function. Any static host works for the site itself, but the contact endpoint needs serverless functions.
