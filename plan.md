Step 1 — Standardize Naming (Important)

Right now your main file is:

ARAVINDH_SIVALINGAM_UK.tex


For automation clarity, rename it to:

resume.tex


Why?

CI workflows become cleaner

No hardcoding personal names

Easier to reuse for variants later (resume_us.tex, resume_backend.tex)

If you want regional variants later, we’ll structure that cleanly.

📂 Step 2 — Final Recommended Structure
resume/
├── resume.tex
├── resume.cls
├── .github/
│   └── workflows/
│       └── build.yml
├── README.md


You don’t need more folders unless you modularize sections.

Keep it minimal until complexity demands structure.

⚙️ Step 3 — Local Build First (Always)

From repo root:

latexmk -pdf resume.tex


If it compiles successfully and generates:

resume.pdf


Then we move to automation.

If it fails locally, CI will fail too. Determinism first.

🚀 Step 4 — Your GitHub Action (Tailored To Your Setup)

Since you are using a custom resume.cls, that’s fine — it just needs to be in the same directory as resume.tex.

Create:

.github/workflows/build.yml


Paste this:

name: Build Resume PDF

on:
  push:
    branches: [ "main" ]
    paths:
      - "**.tex"
      - "**.cls"
  pull_request:
    branches: [ "main" ]

jobs:
  build_resume:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Compile LaTeX
        uses: xu-cheng/latex-action@v3
        with:
          root_file: resume.tex

      - name: Upload PDF artifact
        uses: actions/upload-artifact@v4
        with:
          name: resume-pdf
          path: resume.pdf


This will:

Trigger only when .tex or .cls changes

Compile automatically

Upload your PDF

🧠 Step 5 — Optional but Smart: Multiple Resume Variants

Since your file name includes _UK, I can already see where this is going.

You will eventually want:

resume_uk.tex
resume_us.tex
resume_leadership.tex


If you want that architecture now, use this workflow instead:

with:
  root_file: |
    resume_uk.tex
    resume_us.tex


It will build multiple PDFs in one run.

Now you’re thinking like a build engineer, not just a document writer.

🧪 Step 6 — Test Cycle

Rename file

Push

Go to GitHub → Actions

Wait for green check

Download artifact

Verify PDF

If it fails:

Usually missing package

Or class file path issue

Or font issue

CI logs will show exactly where.