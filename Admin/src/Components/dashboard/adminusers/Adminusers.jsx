import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import TopNav from "../../Navbar/topNav";
import SideNav from "../../Navbar/sideNav";
import dashboardclasses from "../dashboard.module.css";
import classes from "../Dashboard/Dashboard.module.css";
import { Services } from "../../../Services";

const empty = { id: null, firstName: "", lastName: "", emailId: "", password: "" };
const notify = (res, okMsg) => {
    if (res && res.Status === 1) toast.success(okMsg || res.Message, { position: "top-center", autoClose: 1500 });
    else toast.error((res && res.Message) || "Something went wrong", { position: "top-center" });
};

/**
 * People who can log in to this admin panel (email + password + 2FA).
 * Riders are managed on the Riders page.
 */
function AdminUsers() {
    const [admins, setAdmins] = useState([]);
    const [form, setForm] = useState(null);
    const [saving, setSaving] = useState(false);
    let me = null;
    try {
        me = JSON.parse(sessionStorage.getItem("admindata") || "null");
    } catch (e) {
        me = null;
    }
    const myId = me && (me.AdminID || me.adminId);

    const load = async () => {
        const res = await Services.getAdminusers("GET", null);
        if (res && res.Status === 1) setAdmins(res.adminUsers || []);
    };

    useEffect(() => {
        load();
    }, []);

    const save = async (e) => {
        e.preventDefault();
        if (!form.id && form.password.length < 8) {
            toast.error("Password must be at least 8 characters", { position: "top-center" });
            return;
        }
        setSaving(true);
        const body = { firstName: form.firstName, lastName: form.lastName, emailId: form.emailId };
        if (form.password) body.password = form.password;
        const res = form.id
            ? await Services.updateAdmindata("PUT", body, null, form.id)
            : await Services.addAdminUser("POST", body);
        setSaving(false);
        notify(res, form.id ? "Admin updated" : "Admin added");
        if (res && res.Status === 1) {
            setForm(null);
            load();
        }
    };

    const remove = async (a) => {
        if (!window.confirm(`Remove ${a.firstName} (${a.emailId})? They will no longer be able to log in.`)) return;
        const res = await Services.deleteAdmindata("DELETE", null, null, a.AdminID);
        notify(res, "Admin removed");
        load();
    };

    const reset2fa = async (a) => {
        if (!window.confirm(`Reset two-factor login for ${a.firstName}? They will set up their authenticator again on next login.`)) return;
        const res = await Services.reset2FA("POST", {}, null, a.AdminID);
        notify(res, "Two-factor login reset");
    };

    const field = (key, value) => setForm((f) => ({ ...f, [key]: value }));

    return (
        <div className={dashboardclasses["dashboard-wrapper"]}>
            <div className={dashboardclasses["dashboard-leftside"]}>
                <SideNav isactive="user" />
            </div>
            <div className={dashboardclasses["dashboard-rightside"]}>
                <TopNav />
                <div className={classes.page}>
                    <div className={classes.pageHead}>
                        <div>
                            <h2>Admin users</h2>
                            <span className={classes.muted}>People who can log in to this panel. Riders are on the Riders page.</span>
                        </div>
                        <button type="button" className={classes.refresh} onClick={() => setForm({ ...empty })}>+ Add admin</button>
                    </div>

                    {form && (
                        <form className={classes.card} onSubmit={save}>
                            <div className={classes.cardHead}><h3>{form.id ? "Edit admin" : "New admin"}</h3></div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                                <label>First name
                                    <input className="form-control" value={form.firstName} onChange={(e) => field("firstName", e.target.value)} required />
                                </label>
                                <label>Last name
                                    <input className="form-control" value={form.lastName} onChange={(e) => field("lastName", e.target.value)} />
                                </label>
                                <label>Email
                                    <input className="form-control" type="email" value={form.emailId} onChange={(e) => field("emailId", e.target.value)} required />
                                </label>
                                <label>{form.id ? "New password (leave empty to keep)" : "Password (8+ characters)"}
                                    <input className="form-control" type="password" autoComplete="new-password" value={form.password} onChange={(e) => field("password", e.target.value)} required={!form.id} minLength={form.id ? undefined : 8} />
                                </label>
                            </div>
                            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                                <button type="submit" className="btn btn-success" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
                                <button type="button" className="btn btn-outline-secondary" onClick={() => setForm(null)}>Cancel</button>
                            </div>
                        </form>
                    )}

                    <div className={classes.card}>
                        <table className={classes.table}>
                            <thead><tr><th>Name</th><th>Email</th><th>Status</th><th className={classes.actions}>Actions</th></tr></thead>
                            <tbody>
                                {admins.map((a) => (
                                    <tr key={a.AdminID}>
                                        <td><b>{`${a.firstName || ""} ${a.lastName && a.lastName !== "NA" ? a.lastName : ""}`.trim()}</b>{String(a.AdminID) === String(myId) && <span className={classes.count}>you</span>}</td>
                                        <td>{a.emailId}</td>
                                        <td>{Number(a.status) === 1 ? "Active" : "Inactive"}</td>
                                        <td className={classes.actions}>
                                            <div className={classes.actionGroup}>
                                            <button type="button" className={classes.linkBtn} onClick={() => setForm({ id: a.AdminID, firstName: a.firstName || "", lastName: a.lastName && a.lastName !== "NA" ? a.lastName : "", emailId: a.emailId || "", password: "" })}>Edit</button>
                                            <button type="button" className={classes.linkBtn} onClick={() => reset2fa(a)}>Reset 2FA</button>
                                            {String(a.AdminID) !== String(myId) && (
                                                <button type="button" className={classes.linkBtn} style={{ color: "#b91c1c" }} onClick={() => remove(a)}>Remove</button>
                                            )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminUsers;
