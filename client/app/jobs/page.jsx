"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { searchSemantic, suggestSkills } from "../../lib/api";

function classNames(...s) {
    return s.filter(Boolean).join(" ");
}

function Pill({ children, onClick, active }) {
    return (
        <button
            onClick={onClick}
            className={classNames(
                "px-3 py-1 rounded-full border text-sm transition",
                active
                    ? "bg-indigo-600 text-white border-indigo-600 shadow"
                    : "bg-transparent text-indigo-300 border-indigo-700 hover:bg-indigo-700/30"
            )}
        >
            {children}
        </button>
    );
}

function JobCard({ job, score }) {
    const tags = job?.tags || [];
    return (
        <div className="group rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm hover:shadow-md hover:bg-white/10 transition">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-lg font-semibold text-white/95">
                        {job.title}
                    </h3>
                    <p className="text-sm text-white/60">
                        {job.company} • {job.location || "Remote"}
                    </p>
                </div>
                {typeof score === "number" && (
                    <span
                        title="Semantic relevance score"
                        className="text-xs px-2 py-1 rounded bg-indigo-600/20 text-indigo-200 border border-indigo-500/30"
                    >
            {score.toFixed(3)}
          </span>
                )}
            </div>

            {job.summary && (
                <p className="mt-3 text-sm text-white/70 line-clamp-3">{job.summary}</p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
                {tags.slice(0, 8).map((t, i) => (
                    <span
                        key={i}
                        className="text-xs px-2 py-1 rounded bg-black/20 border border-white/10 text-white/70"
                    >
            {t}
          </span>
                ))}
            </div>

            <div className="mt-5 flex items-center gap-3">
                {job.url && (
                    <a
                        href={job.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm hover:bg-indigo-500 transition"
                    >
                        View / Apply
                    </a>
                )}
                <span className="text-xs text-white/50">
          Posted: {job.postedAt ? new Date(job.postedAt).toLocaleDateString() : "—"}
        </span>
            </div>
        </div>
    );
}

export default function JobsPage() {
    const [query, setQuery] = useState("");
    const [selectedSkills, setSelectedSkills] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [loadingSuggest, setLoadingSuggest] = useState(false);

    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const debouncer = useRef(null);
    const debouncerSug = useRef(null);

    // Compose the semantic query: free text + any selected skills
    const composedQuery = useMemo(() => {
        if (!selectedSkills.length) return query.trim();
        const skillHint = selectedSkills.map((s) => `skill:${s}`).join(" ");
        return [query.trim(), skillHint].filter(Boolean).join(" ");
    }, [query, selectedSkills]);

    // Fetch semantic results (debounced)
    useEffect(() => {
        if (!composedQuery) {
            setResults([]);
            setErr("");
            return;
        }
        if (debouncer.current) clearTimeout(debouncer.current);
        debouncer.current = setTimeout(async () => {
            setLoading(true);
            setErr("");
            try {
                const data = await searchSemantic(composedQuery, 20);
                setResults(data?.hits || data?.results || []);
            } catch (e) {
                setErr(e.message || "Search failed");
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 300);
        return () => clearTimeout(debouncer.current);
    }, [composedQuery]);

    // Live skill suggestions (debounced)
    useEffect(() => {
        const q = query.trim();
        if (!q) {
            setSuggestions([]);
            return;
        }
        if (debouncerSug.current) clearTimeout(debouncerSug.current);
        debouncerSug.current = setTimeout(async () => {
            try {
                setLoadingSuggest(true);
                const data = await suggestSkills(q, 6);
                setSuggestions(data?.suggestions || []);
            } catch {
                setSuggestions([]);
            } finally {
                setLoadingSuggest(false);
            }
        }, 250);
        return () => clearTimeout(debouncerSug.current);
    }, [query]);

    const toggleSkill = (skill) => {
        setSelectedSkills((prev) =>
            prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
        );
    };

    return (
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-10">
            <header className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                    Semantic Job Search
                </h1>
                <p className="mt-1 text-white/60 text-sm">
                    Search by role, stack, domain, or plain English. Results are ranked with
                    vector similarity (FAISS). Add skills to refine.
                </p>
            </header>

            {/* Search Bar */}
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 mb-4">
                <div className="flex items-center gap-3">
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="e.g. react developer fintech remote"
                        className="flex-1 rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                    <button
                        onClick={() => setQuery("")}
                        className="px-3 py-2 rounded-xl border border-white/10 text-white/70 hover:bg-white/10 transition"
                    >
                        Clear
                    </button>
                </div>

                {/* Skill suggestions */}
                {!!suggestions.length && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {suggestions.map((s, i) => (
                            <Pill
                                key={i}
                                onClick={() => toggleSkill(s.skill)}
                                active={selectedSkills.includes(s.skill)}
                            >
                                {s.skill}
                            </Pill>
                        ))}
                        {loadingSuggest && (
                            <span className="text-xs text-white/50">…</span>
                        )}
                    </div>
                )}

                {/* Selected skills */}
                {!!selectedSkills.length && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {selectedSkills.map((s) => (
                            <Pill key={s} onClick={() => toggleSkill(s)} active>
                                {s}
                            </Pill>
                        ))}
                        <button
                            className="text-xs text-white/60 underline ml-2"
                            onClick={() => setSelectedSkills([])}
                        >
                            reset skills
                        </button>
                    </div>
                )}
            </div>

            {/* Status row */}
            <div className="mb-4 flex items-center justify-between">
                <div className="text-xs text-white/50">
                    {composedQuery ? (
                        <>
                            Showing results for:{" "}
                            <span className="text-white/80">{composedQuery}</span>
                        </>
                    ) : (
                        <>Type to start a semantic search…</>
                    )}
                </div>
                {loading && (
                    <div className="text-xs text-indigo-200">Searching…</div>
                )}
            </div>

            {/* Error */}
            {err && (
                <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-900/30 text-rose-100 px-4 py-3">
                    {err}
                </div>
            )}

            {/* Results */}
            {!loading && !err && composedQuery && results.length === 0 && (
                <div className="rounded-xl border border-white/10 bg-black/30 px-5 py-8 text-center text-white/70">
                    No results. Try different keywords or add/remove skills.
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map((h, i) => (
                    <JobCard key={h.job._id || i} job={h.job} score={h.score} />
                ))}
            </div>

            {/* Empty state (no query) */}
            {!composedQuery && (
                <div className="mt-10 rounded-2xl border border-white/10 bg-black/20 p-6 text-white/70">
                    <p className="mb-2 font-medium text-white">Tips</p>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Describe the role, e.g. “react developer fintech remote”.</li>
                        <li>Add skills using the suggested chips to refine.</li>
                        <li>
                            Vector search uses your FAISS indices (jobs + skills) for high-recall
                            retrieval.
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
}
