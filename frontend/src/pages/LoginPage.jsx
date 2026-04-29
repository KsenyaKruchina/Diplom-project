// frontend/src/pages/LoginPage.jsx
// ─── Страница входа ───────────────────────────────────────────────────────────

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

const LoginPage = ({ onSuccess }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(username, password);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || "Ошибка входа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="10" fill="#01e676" fillOpacity="0.15"/>
            <circle cx="20" cy="20" r="8" stroke="#01e676" strokeWidth="2"/>
            <circle cx="20" cy="20" r="3" fill="#01e676"/>
            <line x1="20" y1="6" x2="20" y2="10" stroke="#01e676" strokeWidth="2" strokeLinecap="round"/>
            <line x1="20" y1="30" x2="20" y2="34" stroke="#01e676" strokeWidth="2" strokeLinecap="round"/>
            <line x1="6" y1="20" x2="10" y2="20" stroke="#01e676" strokeWidth="2" strokeLinecap="round"/>
            <line x1="30" y1="20" x2="34" y2="20" stroke="#01e676" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>

        <h1 style={styles.title}>Система мониторинга</h1>
        <p style={styles.subtitle}>Введите данные для входа</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Логин</label>
            <input
              style={styles.input}
              type="text"
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Пароль</label>
            <input
              style={styles.input}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button
            type="submit"
            style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
            disabled={loading}
          >
            {loading ? "Вход..." : "Войти"}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0a0a0a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    fontFamily: '"Inter", Helvetica, sans-serif',
  },
  card: {
    background: "rgba(49,49,49,0.30)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "16px",
    padding: "40px",
    width: "100%",
    maxWidth: "380px",
    boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
    backdropFilter: "blur(12px)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
  },
  logo: { marginBottom: "8px" },
  title: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#ffffff",
    margin: 0,
    textAlign: "center",
  },
  subtitle: {
    fontSize: "13px",
    color: "#929292",
    margin: "4px 0 20px",
    textAlign: "center",
  },
  form: { width: "100%", display: "flex", flexDirection: "column", gap: "14px" },
  field: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "12px", color: "#929292" },
  input: {
    padding: "11px 14px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.15)",
    background: "#111",
    color: "#fff",
    fontSize: "14px",
    fontFamily: "inherit",
    outline: "none",
    transition: "border-color 0.15s",
  },
  error: {
    fontSize: "13px",
    color: "#ff5b5b",
    background: "rgba(255,91,91,0.08)",
    border: "1px solid rgba(255,91,91,0.2)",
    borderRadius: "8px",
    padding: "10px 14px",
  },
  btn: {
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    background: "#01e676",
    color: "#000",
    fontSize: "14px",
    fontWeight: "600",
    fontFamily: "inherit",
    cursor: "pointer",
    transition: "opacity 0.15s",
    marginTop: "4px",
  },
};

export default LoginPage;