export default async function HomePage() {
  // Middleware handles authentication and role-based redirects
  // This page is only reached when middleware allows through
  // Unauthenticated users are redirected to /auth/login by middleware
  // Authenticated users are redirected to their dashboard by middleware
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Welcome to MAKER</h1>
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  )
}
