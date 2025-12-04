import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    // Security headers middleware for development server
    {
      name: 'security-headers',
      configureServer(server) {
        server.middlewares.use((_req, res, next) => {
          // Prevent clickjacking
          res.setHeader('X-Frame-Options', 'DENY');

          // Prevent MIME-type sniffing
          res.setHeader('X-Content-Type-Options', 'nosniff');

          // Control referrer information
          res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

          // Restrict feature permissions
          res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

          // Basic XSS protection (legacy browsers)
          res.setHeader('X-XSS-Protection', '1; mode=block');

          next();
        });
      }
    }
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
