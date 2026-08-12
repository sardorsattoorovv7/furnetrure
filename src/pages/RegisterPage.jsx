import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api/auth";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register(form);
      await login(form.username, form.password);
      navigate("/", { replace: true });
    } catch (err) {
      const data = err?.response?.data;
      const msg = data ? Object.values(data).flat().join(" ") : "Xatolik yuz berdi";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Ro'yxatdan o'tish</h1>

        <label>
          Login
          <input value={form.username} onChange={update("username")} required />
        </label>
        <label>
          Email
          <input type="email" value={form.email} onChange={update("email")} required />
        </label>
        <div className="form-row">
          <label>
            Ism
            <input value={form.first_name} onChange={update("first_name")} />
          </label>
          <label>
            Familiya
            <input value={form.last_name} onChange={update("last_name")} />
          </label>
        </div>
        <label>
          Telefon
          <input value={form.phone} onChange={update("phone")} placeholder="+998 90 123 45 67" />
        </label>
        <label>
          Parol
          <input type="password" value={form.password} onChange={update("password")} required />
        </label>

        {error && <div className="form-error">{error}</div>}

        <button className="btn-primary" type="submit" disabled={busy}>
          {busy ? "Yuborilmoqda..." : "Ro'yxatdan o'tish"}
        </button>

        <p className="muted center">
          Akkountingiz bormi? <Link to="/login">Kirish</Link>
        </p>
      </form>
    </div>
  );
}
