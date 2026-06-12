import { auth } from "./auth/index.js";
import { createApp } from "./app.js";

const app = await createApp(auth);

export default app;
