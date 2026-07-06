export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const dns = await import('dns');
    // This dev machine's default DNS resolver intermittently fails (EAI_AGAIN) on
    // external lookups (Cloudinary, MongoDB SRV, etc). Pin to public resolvers.
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  }
}
