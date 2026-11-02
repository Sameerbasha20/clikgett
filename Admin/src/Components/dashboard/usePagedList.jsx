import React, { useEffect, useState } from "react";

const SIZES = [10, 25, 50, 100];

// Pages through a list the page already holds. Returns the rows for the current page,
// the number of rows before it, and the pager to show under the table:
//   const paged = usePagedList(offers);
//   paged.rows.map(...)   {paged.pager}
function usePagedList(rows, defaultSize = 25) {
    const list = rows || [];
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(defaultSize);

    // A new filter or search starts from the first page.
    useEffect(() => setPage(1), [list.length]);

    const total = list.length;
    const pages = Math.max(1, Math.ceil(total / size));
    const current = Math.min(page, pages);
    const offset = (current - 1) * size;

    // First, last and the pages around the current one.
    const numbers = [];
    for (let n = 1; n <= pages; n++) {
        if (n === 1 || n === pages || Math.abs(n - current) <= 1) numbers.push(n);
        else if (numbers[numbers.length - 1] !== "...") numbers.push("...");
    }

    const pager = total <= SIZES[0] ? null : (
        <nav
            aria-label="Pages"
            style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 12 }}
        >
            <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                Showing {offset + 1}–{Math.min(offset + size, total)} of {total}
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 4 }}>
                <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    disabled={current === 1}
                    onClick={() => setPage(current - 1)}
                >
                    Previous
                </button>
                {numbers.map((n, i) => (n === "..." ? (
                    <span key={`gap-${i}`} style={{ padding: "0 4px", color: "#64748b" }}>…</span>
                ) : (
                    <button
                        key={n}
                        type="button"
                        className={`btn btn-sm ${n === current ? "btn-primary" : "btn-outline-secondary"}`}
                        aria-current={n === current ? "page" : undefined}
                        onClick={() => setPage(n)}
                    >
                        {n}
                    </button>
                )))}
                <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    disabled={current === pages}
                    onClick={() => setPage(current + 1)}
                >
                    Next
                </button>
                <select
                    aria-label="Rows per page"
                    className="form-select form-select-sm"
                    style={{ width: "auto", marginLeft: 8 }}
                    value={size}
                    onChange={(e) => { setSize(Number(e.target.value)); setPage(1); }}
                >
                    {SIZES.map((n) => <option key={n} value={n}>{n} per page</option>)}
                </select>
            </div>
        </nav>
    );

    return { rows: list.slice(offset, offset + size), offset, pager };
}

export default usePagedList;
