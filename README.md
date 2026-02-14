
# Resume (LaTeX)

This repository contains a LaTeX resume template and class file to generate a PDF resume.

## Contents

- `resume.tex` — Example resume source using the custom class.
- `resume.cls` — Document class providing layout and styling for the resume.

## Requirements

You need a working LaTeX toolchain. Recommended tools:

- TeX Live or MacTeX (macOS). Install via Homebrew or MacTeX package.
- `latexmk` (optional, recommended for automatic compilation).

## Build / Generate PDF

From the repository root, run one of the following commands:

Using `latexmk` (recommended):

```bash
latexmk -pdf resume.tex
```

Using `pdflatex` (two or three passes may be required):

```bash
pdflatex resume.tex
bibtex resume (if you use bibliography)
pdflatex resume.tex
pdflatex resume.tex
```

This will produce `resume.pdf` in the same directory.

## Customize

- Edit `resume.tex` to change your name, sections, content, and contact details.
- Edit `resume.cls` to modify layout, margins, fonts, or section styling.
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

Tell me which option you'd like next.
