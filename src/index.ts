import { bootstrap } from "./app/bootstrap.js";

bootstrap().catch((error) => {
  console.error("[boot] fatal error", error);
  process.exit(1);
});
