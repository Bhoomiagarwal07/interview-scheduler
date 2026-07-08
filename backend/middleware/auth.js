// Simple session-based auth guard for the server-rendered admin panel.
// (EJS pages use cookies/sessions rather than JWT since there's no SPA
// state to hydrate — the browser just needs to remember "this admin is
// logged in" across page loads.)

function requireAuth(req, res, next) {
  if (req.session && req.session.adminId) {
    return next();
  }
  return res.redirect('/admin/login');
}

// API guard for the JSON endpoints the admin pages call via fetch
function requireAuthApi(req, res, next) {
  if (req.session && req.session.adminId) {
    return next();
  }
  return res.status(401).json({ message: 'Not authenticated' });
}

module.exports = { requireAuth, requireAuthApi };
