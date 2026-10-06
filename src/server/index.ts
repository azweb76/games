import express from "express";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT ?? 4173);

const clientDir = join(__dirname, "../client");
const indexFile = join(clientDir, "index.html");

if (!existsSync(indexFile)) {
  console.error(`Client build missing at ${indexFile}. Run pnpm build first.`);
  process.exit(1);
}

app.use(express.static(clientDir));
app.get("*", (_req, res) => {
  res.sendFile(indexFile);
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Arena Games listening on http://0.0.0.0:${port}`);
});
