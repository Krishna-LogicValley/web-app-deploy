const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function POST() {
  try {
    const deployHook = process.env.VERCEL_DEPLOY_HOOK_URL!;
    const token = process.env.VERCEL_TOKEN!;
    const projectId = process.env.VERCEL_PROJECT_ID!;
    const teamId = process.env.VERCEL_TEAM_ID;

    // 1️⃣ Record current time (so we know which deployment is ours)
    const startedAt = Date.now();

    // 2️⃣ Trigger deployment
    await fetch(deployHook, { method: "POST" });

    let deploymentUrl = null;

    // 3️⃣ Poll for up to 5 minutes
    for (let i = 0; i < 150; i++) {
      // 150 × 2s ≈ 5 minutes
      const res = await fetch(
        `https://api.vercel.com/v13/deployments?projectId=${projectId}${
          teamId ? `&teamId=${teamId}` : ""
        }`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      const latest = data.deployments?.find(
        (d: any) => d.createdAt > startedAt // only deployments after button click
      );

      if (!latest) {
        await sleep(2000);
        continue;
      }

      if (latest.readyState === "READY") {
        deploymentUrl = `https://${latest.url}`;
        break;
      }

      if (["ERROR", "CANCELED"].includes(latest.readyState)) {
        return Response.json({ success: false, message: latest.readyState });
      }

      await sleep(2000);
    }

    if (!deploymentUrl)
      return Response.json({ success: false, message: "Deployment timed out" });

    return Response.json({ success: true, url: deploymentUrl });
  } catch (err) {
    return Response.json(
      { success: false, message: "Server Error" },
      { status: 500 }
    );
  }
}
