export function isAuthorizedCron(req) {
  const auth = req.headers.authorization || ''
  return auth === `Bearer ${process.env.CRON_SECRET}`
}
