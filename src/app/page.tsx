"use client";
import { useState } from "react";
import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  const [url, setUrl] = useState("");
  const isLocal = process.env.NODE_ENV === "development";

  const deploy = async () => {
    setUrl("Deployment started… ⏳");

    const res = await fetch("/api/deploy", { method: "POST" });
    const data = await res.json();

    if (data.success) {
      setUrl(data.url);
      navigator.clipboard.writeText(data.url);
      alert("Production deploy triggered & URL copied 🚀");
    } else {
      setUrl("Failed ❌");
    }
  };
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>Static Web App deployed on Azure Static Web Apps</h1>
        </div>
        {isLocal && (
          <>
            <div className={styles.ctas}>
              <a className={styles.primary} onClick={deploy}>
                Deploy Now
              </a>
            </div>
            <input
              value={url}
              readOnly
              style={{
                width: "100%",
                height: 40,
                paddingLeft: "1rem",
                borderRadius: 8,
                outline: "none",
                border: "1px solid #ccc",
                color: "#000",
                fontWeight: 600,
                letterSpacing: 0.5,
              }}
            />
          </>
        )}
      </main>
    </div>
  );
}
