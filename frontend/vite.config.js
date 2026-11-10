import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        proxy: {
            '/api': {
                target: process.env.BACKEND_URL || 'http://localhost:3000',
                changeOrigin: true,
            },
        },
    },
});
