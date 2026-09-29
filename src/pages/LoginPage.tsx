import { useState } from "react";
import { ShieldCheck, Scale } from "lucide-react";
import { copy } from "../constants/copy";
import type { Role } from "../state/navigation";
import { Button, Field } from "../components/UI";

export function LoginPage({ onLogin }: { onLogin: (role: Role) => void }) {
  const [role, setRole] = useState<Role>("admin");
  const t = copy.access;
  return <main className="login-page">
    <section className="login-intro"><span className="login-brand">{copy.brand.mark}</span><p>{copy.meta.prototype}</p><h1>{t.title}</h1><p>{t.intro}</p><div className="login-flow">{t.flow}</div></section>
    <form className="login-card" onSubmit={event => { event.preventDefault(); onLogin(role); }}>
      <h2>{t.login}</h2><p>{t.chooseRole}</p>
      <div className="login-roles">{(["admin", "reviewer"] as const).map(value => <label key={value} className={role === value ? "is-active" : ""}>
        <input type="radio" name="role" checked={role === value} onChange={() => setRole(value)} />{value === "admin" ? <ShieldCheck size={22} /> : <Scale size={22} />}<span><strong>{t.roles[value]}</strong><small>{t.roleDescriptions[value]}</small></span>
      </label>)}</div>
      <Field label={t.account}><input aria-label={t.account} readOnly value={t.accounts[role].name} /></Field>
      <Button type="submit" variant="primary">{t.enter}</Button><p className="login-note">{t.demo}</p>
    </form>
  </main>;
}
