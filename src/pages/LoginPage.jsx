import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // ✅ username ishlatamiz
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const from = location.state?.from?.pathname || "/";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    
    console.log('📝 Login with:', { username, password: '***' });
    
    try {
      // ✅ username yuborish
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      console.error('❌ Login error:', err);
      setError("Username yoki parol noto'g'ri");
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
          Username
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            placeholder="Username"
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