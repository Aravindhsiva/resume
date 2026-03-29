"use client";

import { useMemo, useState } from "react";
import { COUNTRIES, type CountryCode } from "@/lib/countries";

type ApiOk = {
  provider: string;
  country: CountryCode;
  baseTemplate: string;
  draft: {
    professionalSummary: string;
    technicalSkills: string[];
    keywords?: string[];
  };
  latex: string;
};

type ApiErr = { error: string; details?: unknown };

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text);
}

export default function HomePage() {
  const [jobDescription, setJobDescription] = useState("");
  const [country, setCountry] = useState<CountryCode>("unitedstates");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiOk | null>(null);
  const [tab, setTab] = useState<"latex" | "json">("latex");

  const countryLabel = useMemo(
    () => COUNTRIES.find((c) => c.code === country)?.label ?? country,
    [country]
  );

  async function onGenerate() {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jobDescription, country })
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as ApiErr | null;
        throw new Error(data?.error ?? `Request failed (${res.status})`);
      }
      const data = (await res.json()) as ApiOk;
      setResult(data);
      setTab("latex");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="container">
      <div className="header">
        <div>
          <h1 className="title">Dynamic Resume Generator</h1>
          <p className="subtitle">
            Paste a job description, select the target country template, and generate a tailored
            LaTeX draft. Uses OpenRouter by default; you can switch to offline mock or a local LLM.
          </p>
        </div>
        <div className="pill">
          <span>Template:</span>
          <span className="mono">{countryLabel}</span>
        </div>
      </div>

      <div className="grid">
        <section className="card">
          <p className="cardTitle">Input</p>

          <div className="row">
            <div>
              <label htmlFor="country">Country template</label>
              <select
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value as CountryCode)}
                disabled={isLoading}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="hint">Tip</label>
              <input
                id="hint"
                value="Include responsibilities, tech stack, must-haves, nice-to-haves."
                readOnly
              />
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <label htmlFor="jd">Job description</label>
            <textarea
              id="jd"
              placeholder="Paste the full job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="actions">
            <button
              className="primary"
              onClick={onGenerate}
              disabled={isLoading || jobDescription.trim().length < 50}
            >
              {isLoading ? "Generating…" : "Generate draft"}
            </button>
            <button
              onClick={() => {
                setJobDescription("");
                setResult(null);
                setError(null);
              }}
              disabled={isLoading}
            >
              Clear
            </button>
          </div>

          {error ? <div className="error" style={{ marginTop: 12 }}>{error}</div> : null}
        </section>

        <section className="card">
          <p className="cardTitle">Output</p>

          {!result ? (
            <div className="pill" style={{ justifyContent: "space-between", width: "100%" }}>
              <span>Waiting for a generation…</span>
              <span className="mono">POST /api/generate</span>
            </div>
          ) : (
            <>
              <div className="tabs">
                <button
                  className={`tab ${tab === "latex" ? "tabActive" : ""}`}
                  onClick={() => setTab("latex")}
                  type="button"
                >
                  LaTeX
                </button>
                <button
                  className={`tab ${tab === "json" ? "tabActive" : ""}`}
                  onClick={() => setTab("json")}
                  type="button"
                >
                  JSON
                </button>
                <span className="pill mono" style={{ marginLeft: "auto" }}>
                  provider={result.provider}
                </span>
              </div>

              <div className="actions" style={{ marginTop: 0, marginBottom: 10 }}>
                {tab === "latex" ? (
                  <>
                    <button onClick={() => copyToClipboard(result.latex)} type="button">
                      Copy LaTeX
                    </button>
                    <button
                      onClick={() => downloadText(`resume.${result.country}.generated.tex`, result.latex)}
                      type="button"
                    >
                      Download .tex
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(result.draft, null, 2))}
                    type="button"
                  >
                    Copy JSON
                  </button>
                )}
              </div>

              <pre className="mono">
                {tab === "latex" ? result.latex : JSON.stringify(result.draft, null, 2)}
              </pre>

              <p className="subtitle" style={{ marginTop: 10 }}>
                Base template used: <span className="mono">{result.baseTemplate}</span>
              </p>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
