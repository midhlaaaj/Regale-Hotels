import { createRootApp } from "./app";
import { settings } from "./config";

const app = createRootApp();

app.listen(settings.port, () => {
  console.log(`Regale Hotels API listening on http://127.0.0.1:${settings.port}`);
});
