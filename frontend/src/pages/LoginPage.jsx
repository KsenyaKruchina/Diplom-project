// frontend/src/pages/LoginPage.jsx
// Страница входа 

import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { confirmPasswordReset, requestPasswordRecovery } from "../services/authService";

const LoginPage = ({ onSuccess }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [loginTheme, setLoginTheme] = useState("dark");
  const [mode, setMode] = useState("login");
  const [identifier, setIdentifier] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [success, setSuccess] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const theme = loginTheme === "light" ? loginLightTheme : loginDarkTheme;
  const s = makeStyles(theme);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError("");
    setSuccess("");
  };

  const formatResetError = (err) => {
    if (err?.status === 400) return err.message || "Неверный или просроченный код";
    if (err?.status === 422) return "Проверьте, что все поля заполнены корректно";
    if (err?.status === 500) return "Ошибка сервера. Попробуйте позже";
    return err?.message || "Не удалось выполнить запрос";
  };

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

  const handleRequestCode = async (e) => {
    e.preventDefault();
    const value = identifier.trim();
    setError("");
    setSuccess("");

    if (!value) {
      setError("Введите email или логин");
      return;
    }

    setLoading(true);
    try {
      await requestPasswordRecovery(value);
      setCooldown(60);
      setSuccess("Если пользователь найден, код отправлен на email из профиля.");
      setMode("reset");
    } catch (err) {
      setError(formatResetError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e) => {
    e.preventDefault();
    const code = resetCode.trim();
    setError("");
    setSuccess("");

    if (!/^\d{6}$/.test(code)) {
      setError("Код должен состоять из 6 цифр");
      return;
    }

    if (newPassword.length < 8) {
      setError("Новый пароль должен быть не короче 8 символов");
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset({ token: code, new_password: newPassword });
      setSuccess("Пароль изменен. Теперь можно войти с новым паролем.");
      setPassword("");
      setResetCode("");
      setNewPassword("");
      setMode("login");
    } catch (err) {
      setError(formatResetError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.themeToggle} role="group" aria-label="Тема страницы входа">
        <button
          type="button"
          style={{
            ...s.themeButton,
            ...(loginTheme === "dark" ? s.themeButtonActive : {}),
          }}
          onClick={() => setLoginTheme("dark")}
        >
          Темная
        </button>
        <button
          type="button"
          style={{
            ...s.themeButton,
            ...(loginTheme === "light" ? s.themeButtonActive : {}),
          }}
          onClick={() => setLoginTheme("light")}
        >
          Светлая
        </button>
      </div>

      <div style={s.card}>
        <div style={s.logo}>
          <span style={s.logoText}>TEMPERATURA.KZ</span>
        </div>

        <h1 style={s.title}>Система мониторинга</h1>
        <p style={s.subtitle}>
          {mode === "login" && "Введите данные для входа"}
          {mode === "forgot" && "Введите email или логин, чтобы получить код"}
          {mode === "reset" && "Введите 6-значный код из письма и новый пароль"}
        </p>

        {mode === "login" && (
          <form onSubmit={handleSubmit} style={s.form}>
            <div style={s.field}>
              <label style={s.label}>Логин</label>
              <input
                style={s.input}
                type="text"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div style={s.field}>
              <label style={s.label}>Пароль</label>
              <input
                style={s.input}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {error && <div style={s.error}>{error}</div>}
            {success && <div style={s.success}>{success}</div>}

            <button
              type="submit"
              style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}
              disabled={loading}
            >
              {loading ? "Вход..." : "Войти"}
            </button>

            <button type="button" style={s.linkButton} onClick={() => switchMode("forgot")}>
              Забыли пароль?
            </button>
          </form>
        )}

        {mode === "forgot" && (
          <form onSubmit={handleRequestCode} style={s.form}>
            <div style={s.field}>
              <label style={s.label}>Email или логин</label>
              <input
                style={s.input}
                type="text"
                placeholder="user@example.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            {error && <div style={s.error}>{error}</div>}
            {success && <div style={s.success}>{success}</div>}

            <button
              type="submit"
              style={{ ...s.btn, opacity: loading || cooldown > 0 ? 0.7 : 1 }}
              disabled={loading || cooldown > 0}
            >
              {loading ? "Отправка..." : cooldown > 0 ? `Повторить через ${cooldown} сек` : "Получить код"}
            </button>

            <button type="button" style={s.linkButton} onClick={() => switchMode("login")}>
              Вернуться ко входу
            </button>
          </form>
        )}

        {mode === "reset" && (
          <form onSubmit={handleConfirmReset} style={s.form}>
            <div style={s.field}>
              <label style={s.label}>Код из письма</label>
              <input
                style={{ ...s.input, ...s.codeInput }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="123456"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                autoComplete="one-time-code"
                required
              />
            </div>

            <div style={s.field}>
              <label style={s.label}>Новый пароль</label>
              <input
                style={s.input}
                type="password"
                placeholder="Минимум 8 символов"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            {error && <div style={s.error}>{error}</div>}
            {success && <div style={s.success}>{success}</div>}

            <button
              type="submit"
              style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}
              disabled={loading}
            >
              {loading ? "Сохранение..." : "Изменить пароль"}
            </button>

            <button
              type="button"
              style={s.secondaryButton}
              onClick={handleRequestCode}
              disabled={loading || cooldown > 0}
            >
              {cooldown > 0 ? `Отправить код повторно через ${cooldown} сек` : "Отправить код повторно"}
            </button>

            <button type="button" style={s.linkButton} onClick={() => switchMode("login")}>
              Вернуться ко входу
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

const loginDarkTheme = {
  bg: "#0a0a0a",
  panel: "rgba(49,49,49,0.30)",
  border: "rgba(255,255,255,0.1)",
  inputBg: "#111",
  text: "#ffffff",
  muted: "#929292",
  shadow: "0 24px 60px rgba(0,0,0,0.6)",
  toggleBg: "rgba(49,49,49,0.50)",
};

const loginLightTheme = {
  bg: "#f4f6f8",
  panel: "#ffffff",
  border: "rgba(16,24,40,0.12)",
  inputBg: "#f8fafc",
  text: "#172033",
  muted: "#667085",
  shadow: "0 18px 44px rgba(16,24,40,0.12)",
  toggleBg: "#ffffff",
};

const makeStyles = (theme) => ({
  page: {
    minHeight: "100vh",
    background: theme.bg,
    color: theme.text,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    fontFamily: '"Inter", Helvetica, sans-serif',
    position: "relative",
  },
  card: {
    background: theme.panel,
    border: `1px solid ${theme.border}`,
    borderRadius: "16px",
    padding: "40px",
    width: "100%",
    maxWidth: "380px",
    boxShadow: theme.shadow,
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
    color: theme.text,
    margin: 0,
    textAlign: "center",
  },
  subtitle: {
    fontSize: "13px",
    color: theme.muted,
    margin: "4px 0 20px",
    textAlign: "center",
  },
  form: { width: "100%", display: "flex", flexDirection: "column", gap: "14px" },
  field: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "12px", color: theme.muted },
  input: {
    padding: "11px 14px",
    borderRadius: "8px",
    border: `1px solid ${theme.border}`,
    background: theme.inputBg,
    color: theme.text,
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
  success: {
    fontSize: "13px",
    color: "#01a85a",
    background: "rgba(1,230,118,0.08)",
    border: "1px solid rgba(1,230,118,0.22)",
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
  secondaryButton: {
    padding: "11px",
    borderRadius: "8px",
    border: `1px solid ${theme.border}`,
    background: "transparent",
    color: theme.text,
    fontSize: "13px",
    fontWeight: "600",
    fontFamily: "inherit",
    cursor: "pointer",
  },
  linkButton: {
    border: "none",
    background: "transparent",
    color: "#e6ad00",
    fontSize: "13px",
    fontWeight: "600",
    fontFamily: "inherit",
    cursor: "pointer",
    padding: "4px 0 0",
    textAlign: "center",
  },
  codeInput: {
    letterSpacing: "0.32em",
    fontWeight: "700",
    textAlign: "center",
  },
  themeToggle: {
    position: "absolute",
    top: 18,
    right: 18,
    display: "flex",
    gap: 4,
    padding: 4,
    borderRadius: 12,
    background: theme.toggleBg,
    border: `1px solid ${theme.border}`,
    boxShadow: theme.shadow,
  },
  themeButton: {
    border: "none",
    borderRadius: 8,
    background: "transparent",
    color: theme.muted,
    padding: "8px 12px",
    fontSize: 12,
    fontWeight: 600,
    fontFamily: "inherit",
    cursor: "pointer",
  },
  themeButtonActive: {
    background: "#ffc207",
    color: "#000",
  },
});

export default LoginPage;
