process.on("uncaughtException", (err) => {
  console.error("[uncaughtException] Unhandled exception — server will continue running:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection] Unhandled promise rejection — server will continue running:", reason);
});

import("./app").then(({ default: app }) => {
  const rawPort = process.env["PORT"];

  if (!rawPort) {
    throw new Error(
      "PORT environment variable is required but was not provided.",
    );
  }

  const port = Number(rawPort);

  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
});
