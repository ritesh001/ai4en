## Hugo to Quartz Migration Plan (Phased, URL-Preserving)

### Summary
Yes, switching is possible, but this is a platform migration (Hugo -> Quartz), not a Hugo theme swap.  
We will do a phased cutover: validate Quartz in CI first, keep Hugo live during validation, then switch production deploy to Quartz with redirects/aliases to preserve existing links.

### Public Interface Changes
- Site generator changes from Hugo to Quartz.
- Deployment pipeline changes from Hugo CLI to Node 22 + `npx quartz build`.
- Canonical page URL style changes to Quartz defaults (no trailing slash on non-folder pages), with compatibility aliases for existing slash URLs.
- Content authoring source moves to Quartz convention (`quartz/content` as source of truth).

### Implementation Plan
1. Normalize repo structure for Quartz ownership.
- Update [/Users/riteshk/codes/ai4en/.gitignore](/Users/riteshk/codes/ai4en/.gitignore) to stop ignoring `quartz/`.
- Convert `quartz` from embedded repo to normal tracked folder by removing `quartz/.git` metadata.
- Keep current Hugo files untouched during phase 1 for rollback safety.

2. Configure Quartz for your GitHub Pages URL.
- Edit [/Users/riteshk/codes/ai4en/quartz/quartz.config.ts](/Users/riteshk/codes/ai4en/quartz/quartz.config.ts):
- Set `configuration.baseUrl = "ritesh001.github.io/ai4en"`.
- Set `pageTitle` and other branding to your site identity.
- Keep default plugins including `AliasRedirects()` and `ContentIndex()`.

3. Migrate content and static assets with compatibility mapping.
- Copy Hugo content from [/Users/riteshk/codes/ai4en/content](/Users/riteshk/codes/ai4en/content) into [/Users/riteshk/codes/ai4en/quartz/content](/Users/riteshk/codes/ai4en/quartz/content).
- Rename `quartz/content/_index.md` to `quartz/content/index.md`.
- Move static assets needed by pages from [/Users/riteshk/codes/ai4en/static](/Users/riteshk/codes/ai4en/static) into Quartz content/static-compatible locations:
- `Ritesh_Kumar_CV.pdf` at `quartz/content/Ritesh_Kumar_CV.pdf` to preserve `/ai4en/Ritesh_Kumar_CV.pdf`.
- Images under `quartz/content/images/...` if referenced by markdown.
- Add frontmatter `aliases` for key pages to preserve old trailing-slash URLs:
- `/about/`, `/research/`, `/publications/`.

4. Phase 1 CI: build Quartz without changing production deploy.
- Update [/Users/riteshk/codes/ai4en/.github/workflows/hugo.yml](/Users/riteshk/codes/ai4en/.github/workflows/hugo.yml) to add a Quartz validation job:
- `actions/setup-node@v4` with Node 22.
- `working-directory: quartz`.
- `npm ci` then `npx quartz build`.
- Keep Hugo build+deploy job as the production artifact in this phase.

5. Phase 2 cutover: switch GitHub Pages artifact to Quartz.
- In the same workflow, replace Hugo build/deploy path with Quartz output:
- Remove Hugo install step.
- Build with Quartz only (`quartz/public`).
- Upload `quartz/public` to Pages artifact.
- Keep permissions/env/deploy job structure unchanged.

6. Cleanup after successful cutover.
- Remove obsolete Hugo-only config/content paths only after stable production verification:
- [/Users/riteshk/codes/ai4en/hugo.toml](/Users/riteshk/codes/ai4en/hugo.toml)
- [/Users/riteshk/codes/ai4en/config.toml](/Users/riteshk/codes/ai4en/config.toml)
- [/Users/riteshk/codes/ai4en/themes](/Users/riteshk/codes/ai4en/themes)
- Keep this cleanup in a separate commit for easy rollback.

### Test Cases and Scenarios
1. Local Quartz build succeeds.
- `cd /Users/riteshk/codes/ai4en/quartz`
- `npm ci`
- `npx quartz build`
- Verify `quartz/public` is generated.

2. Key route compatibility.
- Confirm these resolve after cutover:
- `/ai4en/`
- `/ai4en/about/`
- `/ai4en/research/`
- `/ai4en/publications/`
- `/ai4en/Ritesh_Kumar_CV.pdf`

3. Content integrity.
- Confirm markdown renders correctly for all migrated pages.
- Confirm DOI/external links and headings are intact.

4. CI behavior by phase.
- Phase 1: Hugo deploy remains live; Quartz build must pass.
- Phase 2: Quartz deploy publishes successfully to GitHub Pages.

5. Rollback scenario.
- Revert only the cutover commit to restore Hugo deploy immediately.

### Assumptions and Defaults
- Chosen strategy: phased switch in the same repo.
- Chosen compatibility target: preserve existing URLs (especially shared page/CV links).
- GitHub Pages continues from `main` via GitHub Actions.
- No custom domain changes in this migration.
- Node 22 is acceptable in CI and local environment.
