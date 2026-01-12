"use client";
import { useState } from "react";
import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  const [url, setUrl] = useState("");

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
          <h1>Automatically Deploy Your App</h1>
        </div>
        <div className={styles.ctas}>
          <a className={styles.primary} onClick={deploy}>
            <Image
              className={styles.logo}
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </a>
          <input value={url} readOnly style={{ width: 400, marginTop: 10 }} />
        </div>
      </main>
    </div>
  );
}
