import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [{
        name: 'email-verification-page',
        configureServer(server) {
            // Existing emails point to the API URL. Route browser clicks through
            // the frontend; its JSON request still reaches the backend proxy.
            server.middlewares.use((req, res, next) => {
                const url = new URL(req.url, 'http://localhost');
                if (req.method === 'GET' && url.pathname === '/api/auth/verify-email'
                    && req.headers.accept?.includes('text/html')) {
                    res.writeHead(302, { Location: `/verify-email${url.search}`, 'Cache-Control': 'no-store' });
                    res.end();
                    return;
                }
                next();
            });
        },
    }],
    server: {
        proxy: {
            '/api': {
                target: process.env.BACKEND_URL || 'http://localhost:3000',
                changeOrigin: true,
            },
        },
    },
});
