import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

function weatherApiPlugin() {
  return {
    name: 'weather-api-plugin',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.url && req.url.startsWith('/api/weather')) {
          try {
            const { handleWeatherApiRequest } = await import('./src/server/api/weather');
            const result = await handleWeatherApiRequest({ url: req.url });
            res.statusCode = result.status;
            for (const [key, value] of Object.entries(result.headers)) {
              res.setHeader(key, value);
            }
            res.end(JSON.stringify(result.body));
            return;
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'internal_server_error', message: err.message }));
            return;
          }
        }

        if (req.url && req.url.startsWith('/api/pois')) {
          try {
            const { handlePoiApiRequest } = await import('./src/server/api/pois');
            const result = await handlePoiApiRequest({ url: req.url });
            res.statusCode = result.status;
            for (const [key, value] of Object.entries(result.headers)) {
              res.setHeader(key, value);
            }
            res.end(JSON.stringify(result.body));
            return;
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'internal_server_error', message: err.message }));
            return;
          }
        }

        if (req.url && req.url.startsWith('/api/destinations')) {
          try {
            const { handleDestinationApiRequest } = await import('./src/server/api/destinations');
            const result = await handleDestinationApiRequest({ url: req.url });
            res.statusCode = result.status;
            for (const [key, value] of Object.entries(result.headers)) {
              res.setHeader(key, value);
            }
            res.end(JSON.stringify(result.body));
            return;
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'internal_server_error', message: err.message }));
            return;
          }
        }

        if (req.url && req.url.startsWith('/api/generate-itinerary')) {
          let bodyStr = '';
          req.on('data', (chunk: any) => {
            bodyStr += chunk;
          });
          req.on('end', async () => {
            try {
              const { handleGenerateItineraryApiRequest } = await import('./src/server/api/generateItinerary');
              let parsedBody = {};
              try {
                parsedBody = bodyStr ? JSON.parse(bodyStr) : {};
              } catch {
                parsedBody = {};
              }
              const result = await handleGenerateItineraryApiRequest({
                method: req.method,
                url: req.url,
                headers: req.headers,
                body: parsedBody,
              });
              res.statusCode = result.status;
              for (const [key, value] of Object.entries(result.headers)) {
                res.setHeader(key, value);
              }
              res.end(JSON.stringify(result.body));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'internal_server_error', message: err.message }));
            }
          });
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), weatherApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
