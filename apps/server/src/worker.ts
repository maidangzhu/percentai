type WorkerEnv = Record<string, string | undefined>;

function errorPayload(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  return {
    name: "NonError",
    message: String(error),
  };
}

export default {
  async fetch(request: Request, env: WorkerEnv) {
    Object.assign(process.env, env);
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return Response.json({ ok: true, runtime: "cloudflare", ts: new Date().toISOString() });
    }
    try {
      const { app } = await import("./app.js");
      return await app.fetch(request, env);
    } catch (error) {
      console.error("worker.unhandled_error", error);
      if (env["WORKER_DEBUG_ERRORS"] === "1") {
        return Response.json({ error: errorPayload(error) }, { status: 500 });
      }
      throw error;
    }
  },
};
