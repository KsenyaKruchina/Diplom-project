// frontend/src/pages/LoginPage.jsx
// Страница входа 

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

const LoginPage = ({ onSuccess }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");


  //e.preventDefault() — отменяем перезагрузку страницы при отправке формы
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
          <span style={styles.logoText}>TEMPERATURA.KZ</span>
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
  logoText: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#e6ad00",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
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
    background: "#e6ad00",
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