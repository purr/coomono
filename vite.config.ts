import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';
import * as https from 'https';

// GitHub Pages deployment - use repo name as base path in production
const isGitHubPages = process.env.GITHUB_PAGES === 'true';
const repoName = 'coomono';

// Custom plugin for dynamic API proxying without hardcoded domains
function createDynamicProxyPlugin(): Plugin {
  // Plugin code remains the same
  return {
    name: 'vite-plugin-dynamic-proxy',
    configureServer(server) {
      server.middlewares.use('/api', (req: IncomingMessage, res: ServerResponse, next) => {
        const url = req.url;
        if (!url) return next();

        // Extract domain from URL pattern: /domain.com/rest/of/path
        const match = url.match(/^\/([^/]+)(\/.*)?$/);
        if (!match) return next();

        const domain = match[1];
        const path = match[2] || '/';

        // Log the proxy request for debugging
        console.log(`Proxying ${req.method} ${url} -> https://${domain}${path}`);

        // Handle the proxying manually with https module
        req.url = path;

        // Prepare headers
        const headers = { ...req.headers, host: domain };

        // Create HTTPS request to the target
        const proxyReq = https.request({
          hostname: domain,
          port: 443,
          path: path,
          method: req.method,
          headers: headers
        }, (proxyRes) => {
          res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
          proxyRes.pipe(res);
        });

        // Handle errors
        proxyReq.on('error', (error: Error) => {
          console.error(`Proxy error for ${domain}: ${error.message}`);

          // Send error response
          res.writeHead(500, {
            'Content-Type': 'application/json'
          });

          res.end(JSON.stringify({
            error: `Failed to proxy request to ${domain}`,
            message: error.message
          }));
        });

        // Pipe the request body to the proxy request
        if (req.readable) {
          req.pipe(proxyReq);
        } else {
          proxyReq.end();
        }
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    createDynamicProxyPlugin()
  ],
  base: isGitHubPages ? `/${repoName}/` : '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false
  },
  server: {
    port: 3000,
    host: true
  }
});
