const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST() {
  try {
    const OWNER = process.env.GITHUB_OWNER!;
    const REPO = process.env.GITHUB_REPO!;
    const WORKFLOW = process.env.GITHUB_WORKFLOW!;
    const TOKEN = process.env.GITHUB_TOKEN!;
    const PROD_URL = process.env.AZURE_SWA_URL!;
    const BRANCH = "static-web-app-deploy";

    const headers = {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    };

    // 1️⃣ Trigger workflow
    const triggerRes = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW}/dispatches`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ ref: BRANCH }),
      }
    );

    const triggerText = await triggerRes.text();
    console.log("Trigger:", triggerRes.status, triggerText);

    if (!triggerRes.ok) {
      return Response.json({
        success: false,
        message: `GitHub trigger failed: ${triggerRes.status}`,
      });
    }

    await sleep(5000);

    let runId: number | null = null;

    // 2️⃣ Find latest run for this workflow
    for (let i = 0; i < 25; i++) {
      const runsRes = await fetch(
        `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW}/runs`,
        { headers }
      );

      const runs = await runsRes.json();
      const latest = runs.workflow_runs?.[0];

      if (latest) {
        runId = latest.id;
        break;
      }

      await sleep(2000);
    }

    if (!runId)
      return Response.json({
        success: false,
        message: "No workflow run found",
      });

    // 3️⃣ Poll run status
    for (let i = 0; i < 180; i++) {
      const runRes = await fetch(
        `https://api.github.com/repos/${OWNER}/${REPO}/actions/runs/${runId}`,
        { headers }
      );

      const run = await runRes.json();

      if (run.status === "completed") {
        if (run.conclusion === "success") {
          return Response.json({ success: true, url: PROD_URL });
        }

        return Response.json({
          success: false,
          message: "Deployment failed ❌",
        });
      }

      await sleep(4000);
    }

    return Response.json({ success: false, message: "Timeout ⏳" });
  } catch (err) {
    console.error(err);
    return Response.json(
      { success: false, message: "Server Error" },
      { status: 500 }
    );
  }
}
