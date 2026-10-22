import express from 'express';
import { resolve } from 'node:path';
import app from './app';
const root = resolve('dist/public');
app.use(express.static(root));
app.get('/{*path}', (_req, res) => {
  res.sendFile(resolve(root, 'index.html'));
});
app.listen(Number(process.env.PORT || 3000), () =>
  console.log(`Hushgrain → http://localhost:${process.env.PORT || 3000}`),
);
