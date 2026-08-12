import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // ✅ username o'rniga email
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const from = location.state?.from?.pathname || "/";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    
    // ✅ Debug
    console.log('📧 Login with:', { email, password: '***' });
    
    try {
      // ✅ email yuborish
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      console.error('❌ Login error:', err);
      setError("Login yoki parol noto'g'ri");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Kirish</h1>
        <p className="muted">Mebel zavodi AR tizimiga xush kelibsiz</p>

        <label>
          Email
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="Email manzilingiz"
            required 
            autoFocus 
          />
        </label>
        
        <label>
          Parol
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="Parolingiz"
            required 
          />
        </label>

        {error && <div className="form-error">{error}</div>}

        <button className="btn-primary" type="submit" disabled={busy}>
          {busy ? "Kirilmoqda..." : "Kirish"}
        </button>

        <p className="muted center">
          Akkountingiz yo'qmi? <Link to="/register">Ro'yxatdan o'tish</Link>
        </p>
      </form>
    </div>
  );
}