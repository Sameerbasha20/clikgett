import React, { useEffect, useState } from "react";
import TopNav from "../../Navbar/topNav";
import SideNav from "../../Navbar/sideNav";
import dashboardclasses from "../dashboard.module.css";
import { Services } from "../../../Services";
import { toast } from "react-toastify";
import { FaArrowUp, FaArrowDown, FaPlus, FaTrash } from "react-icons/fa";

/**
 * FAQs shown in the app under Help & support. They live in the "FAQs" setting as
 * [{ category, questions: [{ q, a }] }]; this page edits that list without raw JSON.
 */
function Faqs() {
    const token = sessionStorage.getItem("token");
    const [setting, setSetting] = useState(null);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);

    const load = () => {
        setLoading(true);
        Services.getsettings("GET", null, token)
            .then((res) => {
                setLoading(false);
                const s = ((res && res.Settings) || []).find((x) => x.SettingKey === "FAQs");
                if (!s) {
                    toast.error("The FAQs setting is missing");
                    return;
                }
                setSetting(s);
                try {
                    const list = JSON.parse(s.SettingValue || "[]");
                    setGroups(Array.isArray(list) ? list.map((g) => ({
                        category: String(g.category || ""),
                        questions: (Array.isArray(g.questions) ? g.questions : []).map((q) => ({ q: String(q.q || ""), a: String(q.a || "") })),
                    })) : []);
                } catch (e) {
                    setGroups([]);
                    toast.error("The saved FAQs could not be read; starting from an empty list");
                }
                setDirty(false);
            })
            .catch(() => { setLoading(false); toast.error("Could not load FAQs"); });
    };
    useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

    const change = (fn) => { setGroups((g) => fn(JSON.parse(JSON.stringify(g)))); setDirty(true); };
    const moveIn = (list, i, dir) => {
        const j = i + dir;
        if (j < 0 || j >= list.length) return list;
        [list[i], list[j]] = [list[j], list[i]];
        return list;
    };

    const save = () => {
        const cleaned = groups
            .map((g) => ({ category: g.category.trim(), questions: g.questions.map((q) => ({ q: q.q.trim(), a: q.a.trim() })).filter((q) => q.q && q.a) }))
            .filter((g) => g.category && g.questions.length);
        setSaving(true);
        Services.updatesettings("PUT", JSON.stringify({ SettingValue: JSON.stringify(cleaned) }), token, setting.ID)
            .then((res) => {
                setSaving(false);
                if (res && (res.Status === 1 || res.status === 1)) { toast.success("FAQs saved"); load(); }
                else toast.error((res && res.Message) || "Could not save");
            })
            .catch(() => { setSaving(false); toast.error("Could not save"); });
    };

    const card = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, marginBottom: 14 };
    const count = groups.reduce((n, g) => n + g.questions.length, 0);

    return (
        <div className={dashboardclasses["dashboard-wrapper"]}>
            <div className={dashboardclasses["dashboard-leftside"]}>
                <SideNav isactive="faqs" />
            </div>
            <div className={dashboardclasses["dashboard-rightside"]}>
                <TopNav />
                <div className={dashboardclasses.CategoryWrapper} style={{ padding: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
                        <h3 style={{ margin: 0 }}>FAQs</h3>
                        <span style={{ color: "#64748b" }}>{count} questions in {groups.length} groups · shown in the app under Help &amp; support</span>
                        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                            <button type="button" className="btn btn-outline-success btn-sm"
                                onClick={() => change((g) => [...g, { category: "New group", questions: [{ q: "", a: "" }] }])}>
                                <FaPlus size={10} /> Add group
                            </button>
                            <button type="button" className="btn btn-primary btn-sm" disabled={!dirty || saving} onClick={save}>
                                {saving ? "Saving..." : dirty ? "Save changes" : "Saved"}
                            </button>
                        </div>
                    </div>

                    {loading ? <p>Loading...</p> : groups.map((g, gi) => (
                        <div key={gi} style={card}>
                            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                                <button type="button" className="btn btn-sm btn-light" disabled={gi === 0} title="Move group up"
                                    onClick={() => change((all) => moveIn(all, gi, -1))}><FaArrowUp size={10} /></button>
                                <button type="button" className="btn btn-sm btn-light" disabled={gi === groups.length - 1} title="Move group down"
                                    onClick={() => change((all) => moveIn(all, gi, 1))}><FaArrowDown size={10} /></button>
                                <input className="form-control" style={{ fontWeight: 700 }} value={g.category} placeholder="Group name"
                                    onChange={(e) => change((all) => { all[gi].category = e.target.value; return all; })} />
                                <button type="button" className="btn btn-sm btn-outline-danger" title="Remove group"
                                    onClick={() => window.confirm(`Remove the group "${g.category}" and its questions?`) && change((all) => all.filter((_, i) => i !== gi))}>
                                    <FaTrash size={11} />
                                </button>
                            </div>
                            {g.questions.map((q, qi) => (
                                <div key={qi} style={{ display: "flex", gap: 8, marginBottom: 10, paddingLeft: 12, borderLeft: "3px solid #e2e8f0" }}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                        <button type="button" className="btn btn-sm btn-light" disabled={qi === 0}
                                            onClick={() => change((all) => { moveIn(all[gi].questions, qi, -1); return all; })}><FaArrowUp size={9} /></button>
                                        <button type="button" className="btn btn-sm btn-light" disabled={qi === g.questions.length - 1}
                                            onClick={() => change((all) => { moveIn(all[gi].questions, qi, 1); return all; })}><FaArrowDown size={9} /></button>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <input className="form-control mb-1" value={q.q} placeholder="Question"
                                            onChange={(e) => change((all) => { all[gi].questions[qi].q = e.target.value; return all; })} />
                                        <textarea className="form-control" rows={2} value={q.a} placeholder="Answer"
                                            onChange={(e) => change((all) => { all[gi].questions[qi].a = e.target.value; return all; })} />
                                    </div>
                                    <button type="button" className="btn btn-sm btn-outline-danger" style={{ alignSelf: "flex-start" }} title="Remove question"
                                        onClick={() => change((all) => { all[gi].questions.splice(qi, 1); return all; })}><FaTrash size={10} /></button>
                                </div>
                            ))}
                            <button type="button" className="btn btn-sm btn-outline-secondary"
                                onClick={() => change((all) => { all[gi].questions.push({ q: "", a: "" }); return all; })}>
                                <FaPlus size={9} /> Add question
                            </button>
                        </div>
                    ))}
                    {dirty && <p style={{ color: "#b45309" }}>Unsaved changes. Empty questions or answers are dropped on save.</p>}
                </div>
            </div>
        </div>
    );
}

export default Faqs;
