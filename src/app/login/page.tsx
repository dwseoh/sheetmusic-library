import { login } from './actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const hasError = params.error === 'invalid'

  return (
    <main className="min-h-screen bg-[var(--bg-deep)] flex items-center justify-center px-4">
      {/* Grain overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }}
      />

      <div className="w-full max-w-sm relative">
        {/* Logo / wordmark */}
        <div className="mb-12 text-center">
          <h1 className="text-[var(--text-primary)] font-serif text-4xl tracking-tight">
            Archive
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-2 tracking-widest uppercase font-mono">
            Document Library
          </p>
        </div>

        <form action={login} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-[var(--text-secondary)] text-xs tracking-widest uppercase font-mono mb-2"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] rounded-none px-4 py-3 text-sm font-mono focus:outline-none focus:border-[var(--accent)] transition-colors placeholder-[var(--text-dim)]"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-[var(--text-secondary)] text-xs tracking-widest uppercase font-mono mb-2"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] rounded-none px-4 py-3 text-sm font-mono focus:outline-none focus:border-[var(--accent)] transition-colors placeholder-[var(--text-dim)]"
              placeholder="••••••••"
            />
          </div>

          {hasError && (
            <p className="text-[var(--danger)] text-xs font-mono tracking-wide">
              Invalid email or password.
            </p>
          )}

          <button
            type="submit"
            className="w-full mt-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-fg)] font-mono text-sm tracking-widest uppercase py-3 transition-colors duration-200"
          >
            Sign In
          </button>
        </form>

        {/* Decorative line */}
        <div className="mt-12 flex items-center gap-4">
          <div className="flex-1 h-px bg-[var(--border-strong)]" />
          <span className="text-[var(--text-dim)] text-xs font-mono">restricted access</span>
          <div className="flex-1 h-px bg-[var(--border-strong)]" />
        </div>
      </div>
    </main>
  )
}
