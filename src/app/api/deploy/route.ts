const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function POST() {
  try {
    const HOOK = process.env.VERCEL_DEPLOY_HOOK_URL!;
    const TOKEN = process.env.VERCEL_TOKEN!;
    const PROJECT = process.env.VERCEL_PROJECT_ID!;
    const TEAM = process.env.VERCEL_TEAM_ID
      ? `&teamId=${process.env.VERCEL_TEAM_ID}`
      : "";

    const started = Date.now();

    // Trigger deployment
    await fetch(HOOK, { method: "POST" });

    await sleep(4000); // give vercel time to register deployment

    let deploymentId: string | null = null;

    // Find latest production deployment
    for (let i = 0; i < 30; i++) {
      const res = await fetch(
        `https://api.vercel.com/v6/deployments?projectId=${PROJECT}${TEAM}&target=production&since=${
          started - 10000
        }&limit=5`,
        { headers: { Authorization: `Bearer ${TOKEN}` } }
      );

      const data = await res.json();
      const latest = data.deployments?.[0];

      if (latest) {
        deploymentId = latest.uid;
        break;
      }

      await sleep(2000);
    }

    if (!deploymentId) {
      return Response.json({
        success: false,
        message: "No deployment detected",
      });
    }

    // Poll that deployment
    for (let i = 0; i < 300; i++) {
      const res = await fetch(
        `https://api.vercel.com/v6/deployments/${deploymentId}?projectId=${PROJECT}${TEAM}`,
        { headers: { Authorization: `Bearer ${TOKEN}` } }
      );

      const dep = await res.json();

      if (dep.readyState === "READY") {
        return Response.json({ success: true, url: `https://${dep.url}` });
      }

      if (["ERROR", "CANCELED"].includes(dep.readyState)) {
        return Response.json({ success: false, message: dep.readyState });
      }

      await sleep(2000);
    }

    return Response.json({ success: false, message: "Deployment timed out" });
  } catch (err) {
    return Response.json(
      { success: false, message: "Server Error" },
      { status: 500 }
    );
  }
}
