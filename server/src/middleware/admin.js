export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "You do not have permission to access the admin area." });
  }

  next();
}
