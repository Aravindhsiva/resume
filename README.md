# Resume (LaTeX)

This repository contains a LaTeX resume template and class file to generate a PDF resume.

## Web UI (Next.js)

There is a simple Next.js app at the repository root that:

- accepts a job description (large textarea) + target country template
- calls a local API route (`/api/generate`)
- returns a tailored **LaTeX draft** by updating the *Professional Summary* and *Technical Skills* sections while keeping your existing *Experience* and *Education* sections

Templates live under `templates/<country>/resume.tex`.

### Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

### LLM options (cost-friendly)

By default, the API uses OpenRouter (requires an API key).

OpenRouter (default):

```bash
cp .env.example .env.local
# set OPENROUTER_API_KEY in .env.local
# set APP_BASIC_AUTH in .env.local (recommended before exposing publicly)
OPENROUTER_API_KEY=... npm run dev
```

Use the free model you requested (default):

`OPENROUTER_MODEL=nvidia/nemotron-3-super-120b-a12b:free`

Offline (no external calls):

```bash
LLM_PROVIDER=mock npm run dev
```

Local open-source LLM via Ollama:

```bash
LLM_PROVIDER=ollama OLLAMA_MODEL=llama3.1 npm run dev
```

## Contents

- `templates/<country>/resume.tex` — Country-specific LaTeX resume source.
- `templates/<country>/resume.cls` — LaTeX class providing layout and styling.
- `app/` + `lib/` — Next.js UI + API.

## Requirements

You need a working LaTeX toolchain. Recommended tools:

- TeX Live or MacTeX (macOS). Install via Homebrew or MacTeX package.
- `latexmk` (optional, recommended for automatic compilation).

## Build / Generate PDF

From the repository root, run one of the following commands:

Using `latexmk` (recommended):

```bash
latexmk -pdf templates/unitedstates/resume.tex
```

Using `pdflatex` (two or three passes may be required):

```bash
pdflatex templates/unitedstates/resume.tex
bibtex resume (if you use bibliography)
pdflatex templates/unitedstates/resume.tex
pdflatex templates/unitedstates/resume.tex
```

This will produce `resume.pdf` in the same directory as the selected country template.

## Customize

- Edit `templates/<country>/resume.tex` to change your name, sections, content, and contact details.
- Edit `templates/<country>/resume.cls` to modify layout, margins, fonts, or section styling.
- If you prefer a different engine (XeLaTeX or LuaLaTeX) for system fonts, replace the compile command:

```bash
xelatex resume.tex
```

## Tips

- Use a TeX-aware editor (TeXShop, TeXStudio, VS Code with LaTeX Workshop) for live preview and easier compilation.
- Keep a backup before making large changes to `resume.cls`.
- If fonts or packages are missing, install them via your TeX distribution package manager.

## Contributing

Small improvements are welcome. Open an issue or submit a pull request with suggested changes to the template or documentation.

## License & Attribution

Include your preferred license here or note if the template is for personal use only.

---

If you want, I can also:

- add a Makefile or `build.sh` to simplify compilation,
- create a minimal CI workflow to build the PDF on push,
- or convert the template for Overleaf compatibility.

## CI / GitHub Actions

This repository includes a GitHub Actions workflow at `.github/workflows/build.yml` that compiles the LaTeX source and uploads the generated PDF as a release asset (raw `.pdf`) instead of a zipped artifact.

- What the workflow does: builds `resume.pdf`, creates and publishes a GitHub Release for each run, then uploads the PDF as an asset named `ARAVINDH_SIVALINGAM_<COUNTRY>.pdf`.
- Where to find the PDF: open the repository on GitHub → Releases → find the release for the workflow run (tag contains the run id) → download the PDF from the Assets list.

If you prefer a different behavior, here are alternatives I can implement:

- Upload the PDF as an unzipped artifact (using `actions/upload-artifact`) instead of a release asset.
- Only create releases on demand (for example on `workflow_dispatch` or when pushing a specific tag), leaving PR and branch builds as artifacts.
- Publish the PDF to GitHub Pages or an external storage (S3) for direct public URLs.

Tell me which option you'd like next.
Tell me which option you'd like next.
