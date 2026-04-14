const authService = require("../services/authService");

// Cookie name and options
const REMEMBER_COOKIE = "remember_me";

const cookieOptions = (days = 30) => ({
  httpOnly: true,                       // Not accessible via JS
  secure: process.env.NODE_ENV === "production", // HTTPS only in prod
  sameSite: "lax",                      // CSRF protection
  maxAge: days * 24 * 60 * 60 * 1000,  // ms
  path: "/"
});

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body, req.ip);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 * Body: { email, password, rememberMe? }
 * If rememberMe is true, sets an HttpOnly cookie with the raw remember token.
 */
const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);

    // If a remember token was generated, set it as a cookie
    if (result.rememberToken) {
      res.cookie(REMEMBER_COOKIE, result.rememberToken, cookieOptions(30));
    }

    // Never send the raw token to the client body — only via cookie
    const { rememberToken, ...safeResult } = result;
    res.json(safeResult);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/auto-login
 * Reads the remember_me cookie and returns a fresh JWT if valid.
 * Called automatically by the frontend on app mount.
 */
const autoLogin = async (req, res, next) => {
  try {
    const rawToken = req.cookies?.[REMEMBER_COOKIE];
    if (!rawToken) {
      return res.status(401).json({ message: "No remember-me cookie present" });
    }
    const result = await authService.loginFromRememberToken(rawToken);
    res.json(result);
  } catch (err) {
    // Clear a bad cookie so the frontend doesn't keep retrying
    res.clearCookie(REMEMBER_COOKIE, { path: "/" });
    next(err);
  }
};

/**
 * POST /api/auth/logout
 * Revokes the remember-me token stored in the cookie and clears it.
 */
const logout = async (req, res, next) => {
  try {
    const rawToken = req.cookies?.[REMEMBER_COOKIE];
    await authService.logout(rawToken);
    res.clearCookie(REMEMBER_COOKIE, { path: "/" });
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout-all
 * Revokes ALL remember-me tokens for the authenticated user.
 * Requires a valid JWT in the Authorization header.
 */
const logoutAll = async (req, res, next) => {
  try {
    const rawToken = req.cookies?.[REMEMBER_COOKIE];
    await authService.logout(rawToken); // revoke current cookie too
    await authService.logoutAll(req.user.userId);
    res.clearCookie(REMEMBER_COOKIE, { path: "/" });
    res.json({ message: "All sessions revoked" });
  } catch (err) {
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const result = await authService.forgotPassword(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const result = await authService.resetPassword(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const me = async (req, res, next) => {
  try {
    const result = await authService.me(req.user.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const result = await authService.updateProfile(req.user.userId, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const result = await authService.changePassword(req.user.userId, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  autoLogin,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword,
  me,
  updateProfile,
  changePassword
};
