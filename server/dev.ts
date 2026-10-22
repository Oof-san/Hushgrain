import { createServer } from 'node:http';
import { createServer as createViteServer } from 'vite';
import app from './app';
const server = createServer(app);
const vite = await createViteServer({
  server: { middlewareMode: true, ws: { server } },
  appType: 'spa',
});
app.use(vite.middlewares);
const port = Number(process.env.PORT || 3000);
server.listen(port, '127.0.0.1', () => console.log(`Hushgrain → http://localhost:${port}`));
