'use client';
import { useState } from "react";

const steps = [
  ["01", "Find a fresh idea", "Check trends and avoid repeating published adventures."],
  ["02", "Write the story", "Create a 3–5 minute preschool script and scene plan."],
  ["03", "Generate scenes", "Create consistent Lina and Magic Train visuals and clips."],
  ["04", "Add sound", "Narration, dialogue, music and sound effects."],
  ["05", "Edit the video", "Assemble scenes into a 16:9 landscape video."],
  ["06", "Thumbnail & SEO", "Prepare thumbnail, title, description and tags."],
  ["07", "Publish to YouTube", "Upload, schedule and record the published video."]
];

export default function Home() {
  const [frequency, setFrequency] = useState("Daily");
  const [mode, setMode] = useState("Automatic publishing");
  const [status, setStatus] = useState("Not connected");
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("Connect services before running a real production.");
  async function start() {
    setRunning(true);
    setMessage("Demo workflow started. No video has been generated or uploaded.");
    await new Promise(resolve => setTimeout(resolve, 700));
    setMessage("Demo complete. This dashboard is online, but AI generation and YouTube uploads are not connected yet.");
    setRunning(false);
  }
  return <main className="shell">
    <header className="topbar">
      <div className="brandmark">🚂</div>
      <div><div className="brand">Lina AI Studio</div><div className="sub">Lina's Magic Land production hub</div></div>
      <span className="pill">MVP • Demo mode</span>
    </header>
    <section className="hero">
      <div>
        <p className="eyebrow">YOUR AI YOUTUBE WORKSHOP</p>
        <h1>From a magical idea<br/><span>to a YouTube video.</span></h1>
        <p className="intro">A single dashboard for researching ideas, creating stories, producing animation, editing, thumbnails, SEO and publishing.</p>
        <button className="primary" onClick={start} disabled={running}>{running ? "Starting…" : "▶  Test the workflow"}</button>
        <p className="notice">{message}</p>
      </div>
      <div className="hero-art"><div className="sun">✦</div><div className="cloud">☁</div><div className="train">🚂</div><div className="rainbow">🌈</div><div className="stars">✧　✦　✧</div></div>
    </section>
    <section className="stats">
      <div><small>CHANNEL</small><strong>Lina's Magic Land</strong></div>
      <div><small>VIDEO FORMAT</small><strong>3–5 min • 16:9</strong></div>
      <div><small>PUBLISH PLAN</small><strong>{frequency}</strong></div>
      <div><small>UPLOAD STATUS</small><strong>{status}</strong></div>
    </section>
    <section className="section">
      <div className="section-head"><div><p className="eyebrow">AUTOMATION PIPELINE</p><h2>Seven steps. One workflow.</h2></div><span className="tag">Designed for preschool content</span></div>
      <div className="steps">{steps.map(([n,t,d]) => <article className="step" key={n}><span className="num">{n}</span><div><h3>{t}</h3><p>{d}</p></div><span className="arrow">↗</span></article>)}</div>
    </section>
    <section className="section settings">
      <div><p className="eyebrow">AUTOMATION SETTINGS</p><h2>Set your publishing routine</h2><p className="muted">These are saved in this prototype's screen state only. Persistent scheduling will be added with the backend.</p></div>
      <label>Publishing frequency<select value={frequency} onChange={e=>setFrequency(e.target.value)}><option>Daily</option><option>3 times per week</option><option>Weekly</option></select></label>
      <label>Publishing mode<select value={mode} onChange={e=>setMode(e.target.value)}><option>Automatic publishing</option><option>Prepare drafts only</option></select></label>
      <div className="callout"><strong>Important before turning on autopublish</strong><p>We will add a quality gate for character consistency, audio, rendering, child safety, copyright and YouTube metadata. Fully automatic publishing should only activate after those checks pass.</p></div>
    </section>
    <section className="section connect">
      <p className="eyebrow">CONNECTIONS</p><h2>Services to connect</h2>
      <div className="connect-grid">
        <div><b>🧠 Story & planning AI</b><small>Ideas, scripts, scene prompts and SEO</small><em>Not connected</em></div>
        <div><b>🎬 Video generation</b><small>Generate animated scene clips</small><em>Not connected</em></div>
        <div><b>🎙️ Voice & audio</b><small>Narration, dialogue, music and effects</small><em>Not connected</em></div>
        <div><b>▶ YouTube</b><small>OAuth permission to upload and schedule</small><em>Not connected</em></div>
      </div>
    </section>
    <footer>Made for Lina's Magic Land ✨ <span>Prototype only — no account access or uploads yet.</span></footer>
  </main>;
}
