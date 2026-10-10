import { createServer } from './server.js';

const PORT = parseInt(process.env.PORT || '4000', 10);
const HOST = '0.0.0.0';

async function main() {
  const server = await createServer();
  try {
    await server.listen({ port: PORT, host: HOST });
    console.log(`🚀 MSOT Quest API Server running at http://${HOST}:${PORT}`);
  } catch (err) {
    console.error('Fatal server boot error:', err);
    process.exit(1);
  }
}

main();
