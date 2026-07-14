/* =========================================================
   Национальная система восстановления — API-клиент.
   Стратегия: сначала реальный backend, при недоступности —
   fallback на мок-данные из constants.js (USE_MOCK_FALLBACK).
   Токен JWT хранится в localStorage (позже можно перенести в cookie).
   ========================================================= */
window.NSV_API = (function () {
  "use strict";

  const cfg = window.NSV_CONFIG || {};
  const data = window.NSV_DATA || {};
  const BASE = cfg.API_BASE_URL || "";
  const FALLBACK = cfg.USE_MOCK_FALLBACK !== false;
  const DEMO = cfg.DEMO_MODE === true; // демо-прототип: работаем на mock без сервера
  const PREFIX = cfg.STORAGE_PREFIX || "nsv:";
  const TIMEOUT = cfg.REQUEST_TIMEOUT_MS || 6000;

  /* ── Токен ── */
  const tokenKey = PREFIX + "token";
  function getToken() {
    try { return localStorage.getItem(tokenKey); } catch { return null; }
  }
  function setToken(t) {
    try { t ? localStorage.setItem(tokenKey, t) : localStorage.removeItem(tokenKey); } catch {}
  }
  function clearToken() { setToken(null); }

  /* ── Низкоуровневый HTTP ── */
  async function http(path, { method = "GET", body, auth = false } = {}) {
    if (!BASE) throw new Error("no-base-url");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);
    const headers = { "Content-Type": "application/json" };
    if (auth) {
      const t = getToken();
      if (t) headers.Authorization = "Bearer " + t;
    }
    let res;
    try {
      res = await fetch(BASE + path, {
        method,
        headers,
        body: body != null ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
    let json = null;
    try { json = await res.json(); } catch { json = null; }
    if (!res.ok || (json && json.ok === false)) {
      const message = (json && json.error && json.error.message) || `HTTP ${res.status}`;
      const err = new Error(message);
      err.status = res.status;
      err.details = json && json.error && json.error.details;
      throw err;
    }
    return json ? (json.data !== undefined ? json.data : json) : null;
  }

  // Вариант, возвращающий и data, и meta (для списков с пагинацией)
  async function httpFull(path, opts) {
    if (!BASE) throw new Error("no-base-url");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);
    const headers = { "Content-Type": "application/json" };
    if (opts && opts.auth) {
      const t = getToken();
      if (t) headers.Authorization = "Bearer " + t;
    }
    let res;
    try {
      res = await fetch(BASE + path, { method: (opts && opts.method) || "GET", headers, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
    const json = await res.json().catch(() => null);
    if (!res.ok || (json && json.ok === false)) throw new Error("request-failed");
    return { data: json ? json.data : [], meta: json ? json.meta : null };
  }

  /* ── Предохранитель (circuit breaker) ──
     Если бэкенд не отвечает (нет соединения/таймаут), помечаем его
     недоступным на текущую сессию и дальше сразу отдаём мок-данные,
     не тратя таймаут на каждый запрос и каждую страницу. */
  let backendDown = false;
  const DOWN_KEY = PREFIX + "backendDown";
  try { backendDown = sessionStorage.getItem(DOWN_KEY) === "1"; } catch {}
  function markBackendDown() {
    backendDown = true;
    try { sessionStorage.setItem(DOWN_KEY, "1"); } catch {}
  }
  function isNetworkError(e) {
    // Сетевые ошибки/таймаут — это не HTTP-статус (у тех есть e.status)
    return !e || e.name === "AbortError" || e.message === "Failed to fetch" ||
      e instanceof TypeError || e.message === "no-base-url";
  }

  /* ── Fallback-обёртка ── */
  async function tryApi(fn, mock) {
    const useMock = () => (typeof mock === "function" ? mock() : mock);
    if (DEMO || !BASE || backendDown) return useMock();
    try {
      return await fn();
    } catch (e) {
      if (isNetworkError(e)) markBackendDown();
      if (FALLBACK) return useMock();
      throw e;
    }
  }

  function qs(params) {
    const p = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v != null && v !== "" && v !== "all") p.append(k, v);
    });
    const s = p.toString();
    return s ? "?" + s : "";
  }

  /* ── Мок-хелперы ── */
  const mockCenters = () => data.centers || [];
  const mockCenter = (id) => (data.centers || []).find((c) => String(c.id) === String(id)) || null;
  const mockMaterials = () => data.materials || [];
  const mockMaterial = (id) => (data.materials || []).find((m) => String(m.id) === String(id)) || null;
  const mockRequests = () => data.requests || [];
  const mockRequest = (id) => (data.requests || []).find((r) => String(r.id) === String(id)) || null;

  /* =======================================================
     Аутентификация
     ======================================================= */
  async function login(email, password) {
    const res = await http("/auth/login", { method: "POST", body: { email, password } });
    if (res && res.token) setToken(res.token);
    return res;
  }
  async function me() {
    return http("/auth/me", { auth: true });
  }
  async function logout() {
    try { await http("/auth/logout", { method: "POST", auth: true }); } catch {}
    clearToken();
    return { ok: true };
  }
  async function registerCenterAdmin(payload) {
    const res = await http("/auth/register-center-admin", { method: "POST", body: payload });
    if (res && res.token) setToken(res.token);
    return res;
  }

  // Демо-вход в кабинет центра, если токена ещё нет
  async function ensureCenterSession() {
    if (DEMO) return false; // в демо-режиме кабинет работает на mock без входа
    if (getToken()) return true;
    const creds = cfg.CENTER_DEMO_LOGIN;
    if (!creds) return false;
    try {
      await login(creds.email, creds.password);
      return true;
    } catch {
      return false;
    }
  }

  /* =======================================================
     Публичные данные
     ======================================================= */
  const getCenters = (params) =>
    tryApi(() => http("/public/centers" + qs(params)), mockCenters);
  const getCenter = (id) =>
    tryApi(() => http("/public/centers/" + encodeURIComponent(id)), () => mockCenter(id));
  const getMaterials = (params) =>
    tryApi(() => http("/public/materials" + qs(params)), mockMaterials);
  const getMaterial = (id) =>
    tryApi(() => http("/public/materials/" + encodeURIComponent(id)), () => mockMaterial(id));

  const submitLead = (payload) =>
    tryApi(
      () => http("/public/help-requests", { method: "POST", body: payload }),
      () => ({ ok: true, id: "L-" + Date.now() })
    );

  const submitDiagnostic = (payload) =>
    tryApi(
      () => http("/public/diagnostics", { method: "POST", body: payload }),
      () => ({ ok: true, id: "D-" + Date.now(), risk_level: null })
    );

  // Совместимость со старым кодом онбординга (демо-заявка партнёра)
  const registerCenter = (payload) =>
    tryApi(
      () => http("/public/help-requests", { method: "POST", body: { name: payload.name || "Центр", phone: payload.phone || "—", source: "form", comment: "Заявка на подключение центра" } }),
      () => ({ ok: true, id: "C-" + Date.now() })
    );

  /* =======================================================
     Кабинет центра (требует токен; демо-вход через ensureCenterSession)
     ======================================================= */
  const getCenterDashboard = () =>
    tryApi(() => http("/center/dashboard", { auth: true }), () => null);
  const getCenterProfile = () =>
    tryApi(() => http("/center/profile", { auth: true }), () => null);
  const saveProfile = (payload) =>
    tryApi(() => http("/center/profile", { method: "PUT", body: payload, auth: true }), () => ({ ok: true }));

  const getCenterRequests = (params) =>
    tryApi(() => http("/center/requests" + qs(params), { auth: true }), mockRequests);
  const getCenterRequest = (id) =>
    tryApi(() => http("/center/requests/" + id, { auth: true }), () => ({ request: mockRequest(id), events: [] }));
  const setCenterRequestStatus = (id, status) =>
    tryApi(() => http("/center/requests/" + id + "/status", { method: "PUT", body: { status }, auth: true }), () => ({ id, status }));
  const commentCenterRequest = (id, text) =>
    tryApi(() => http("/center/requests/" + id + "/comment", { method: "POST", body: { text }, auth: true }), () => ({ ok: true }));

  const getAssociation = () =>
    tryApi(() => http("/center/association-application", { auth: true }), () => ({ association_status: "draft", application: null }));
  const submitAssociation = (payload) =>
    tryApi(() => http("/center/association-application", { method: "POST", body: payload, auth: true }), () => ({ association_status: "submitted", application: payload }));

  /* =======================================================
     Админ-платформа (fallback отключён — админке нужен backend)
     ======================================================= */
  const adminDashboard = () => http("/admin/dashboard", { auth: true });
  const adminCenters = (params) => httpFull("/admin/centers" + qs(params), { auth: true });
  const adminCenter = (id) => http("/admin/centers/" + id, { auth: true });
  const adminUsers = (params) => httpFull("/admin/users" + qs(params), { auth: true });
  const adminUpdateUserRole = (id, body) => http("/admin/users/" + id + "/role", { method: "PUT", body, auth: true });

  const adminRequests = (params) => httpFull("/admin/requests" + qs(params), { auth: true });
  const adminRequest = (id) => http("/admin/requests/" + id, { auth: true });
  const adminRequestStatus = (id, status) => http("/admin/requests/" + id + "/status", { method: "PUT", body: { status }, auth: true });
  const adminAssignRequest = (id, center_id) => http("/admin/requests/" + id + "/assign", { method: "PUT", body: { center_id }, auth: true });
  const adminRequestComment = (id, text) => http("/admin/requests/" + id + "/comment", { method: "POST", body: { text }, auth: true });

  const adminAssociation = (params) => http("/admin/association" + qs(params), { auth: true });
  const adminReviewAssociation = (centerId, action, comment) =>
    http("/admin/association/" + centerId + "/review", { method: "POST", body: { action, comment }, auth: true });

  const adminMaterials = (params) => httpFull("/admin/materials" + qs(params), { auth: true });
  const adminCreateMaterial = (body) => http("/admin/materials", { method: "POST", body, auth: true });
  const adminUpdateMaterial = (id, body) => http("/admin/materials/" + id, { method: "PUT", body, auth: true });
  const adminSetMaterialStatus = (id, status) => http("/admin/materials/" + id + "/status", { method: "PUT", body: { status }, auth: true });

  const adminDiagnostics = (params) => httpFull("/admin/diagnostics" + qs(params), { auth: true });

  return {
    // token
    getToken, setToken, clearToken,
    // auth
    login, me, logout, registerCenterAdmin, ensureCenterSession,
    // public
    getCenters, getCenter, getMaterials, getMaterial,
    submitLead, submitDiagnostic, registerCenter,
    // center cabinet
    getCenterDashboard, getCenterProfile, saveProfile,
    getCenterRequests, getCenterRequest, setCenterRequestStatus, commentCenterRequest,
    getAssociation, submitAssociation,
    // admin
    adminDashboard, adminCenters, adminCenter, adminUsers, adminUpdateUserRole,
    adminRequests, adminRequest, adminRequestStatus, adminAssignRequest, adminRequestComment,
    adminAssociation, adminReviewAssociation,
    adminMaterials, adminCreateMaterial, adminUpdateMaterial, adminSetMaterialStatus,
    adminDiagnostics,
  };
})();
