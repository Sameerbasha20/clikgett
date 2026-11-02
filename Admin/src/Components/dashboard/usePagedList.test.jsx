import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import usePagedList from "./usePagedList";

function List({ count }) {
    const [rows, setRows] = useState(Array.from({ length: count }, (_, i) => `row ${i + 1}`));
    const paged = usePagedList(rows, 10);
    return (
        <div>
            <button onClick={() => setRows(rows.slice(0, 15))}>filter</button>
            <ul>{paged.rows.map((r) => <li key={r}>{r}</li>)}</ul>
            {paged.pager}
        </div>
    );
}

test("a short list shows no pager", () => {
    render(<List count={8} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(8);
    expect(screen.queryByText("Next")).toBeNull();
});

test("moves through the pages and stops at the ends", () => {
    render(<List count={25} />);
    expect(screen.getByText("Showing 1–10 of 25")).toBeInTheDocument();
    expect(screen.getByText("Previous")).toBeDisabled();
    fireEvent.click(screen.getByText("Next"));
    expect(screen.getByText("row 11")).toBeInTheDocument();
    expect(screen.queryByText("row 1")).toBeNull();
    fireEvent.click(screen.getByText("3"));
    expect(screen.getByText("Showing 21–25 of 25")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(screen.getByText("Next")).toBeDisabled();
});

test("changing rows per page and filtering go back to the first page", () => {
    render(<List count={60} />);
    fireEvent.click(screen.getByText("Next"));
    fireEvent.change(screen.getByLabelText("Rows per page"), { target: { value: "25" } });
    expect(screen.getByText("Showing 1–25 of 60")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("filter"));
    expect(screen.getByText("Showing 1–15 of 15")).toBeInTheDocument();
});
