'use client';

import React, { useState, useEffect } from 'react';

const LINA_CHARACTER_PROMPT = `
Character 1: Lina (5-year-old animated girl, round expressive face, big sparkling brown eyes, short wavy dark-brown hair, yellow hair clip, yellow top, turquoise overalls, colorful sneakers).
Character 2: Magic Train (Cute, colorful, toy-like train with a friendly expressive face, glowing magical details, cheerful carriages).
Visual Style: High-quality colorful 3D preschool animation, magical environments, cinematic lighting, smooth child-friendly movements. Aspect ratio: 16:9 landscape.
`;

export default function StudioDashboard() {
  const [apiKey, setApiKey] = useState<string>('');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [topic, setTopic] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [generatedScript, setGeneratedScript] = useState<any>(null);
  const [savedProjects, setSavedProjects] = useState<any[]>([]);
  const [showSaved, setShowSaved] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Audio preview state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // Image Rendering & Cooldown States
  const [renderedImages, setRenderedImages] = useState<{ [key: string]: string }>({});
  const [renderingIndex, setRenderingIndex] = useState<string | null>(null);
  const [cooldowns, setCooldowns] = useState<{ [key: string]: number }>({});

  // Mobile Production Checklist (70-Second Omni Flash Workflow)
  const [checklist, setChecklist] = useState({
    script: true,
    omniFlashClips: false,
    flowUpscaled: false,
    subtitlesExported: false,
    logoAdded: false,
    youtubeUploaded: false
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('LINA_GEMINI_API_KEY');
      if (savedKey) setApiKey(savedKey);

      const storedProjects = localStorage.getItem('LINA_SAVED_PROJECTS');
      if (storedProjects) {
        try {
          setSavedProjects(JSON.parse(storedProjects));
        } catch (e: any) {
          console.error('Error loading saved projects', e);
        }
      }
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCooldowns((prev) => {
        const next = { ...prev };
        let updated = false;
        Object.keys(next).forEach((key) => {
          if (next[key] > 0) {
            next[key] -= 1;
            updated = true;
          }
        });
        return updated ? next : prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const saveApiKey = (key: string) => {
    const trimmed = key.trim();
    setApiKey(trimmed);
    if (typeof window !== 'undefined') {
      localStorage.setItem('LINA_GEMINI_API_KEY', trimmed);
    }
    setShowSettings(false);
  };

  const copyToClipboard = (text: string, id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const saveCurrentProject = (projectData: any) => {
    const newProject = {
      id: Date.now().toString(),
      createdAt: new Date().toLocaleDateString(),
      ...projectData
    };
    const updated = [newProject, ...savedProjects];
    setSavedProjects(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('LINA_SAVED_PROJECTS', JSON.stringify(updated));
    }
  };

  const deleteProject = (id: string) => {
    const updated = savedProjects.filter((p) => p.id !== id);
    setSavedProjects(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('LINA_SAVED_PROJECTS', JSON.stringify(updated));
    }
  };

  const toggleChecklistItem = (key: keyof typeof checklist) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Generate SRT Subtitle File
  const downloadSRT = () => {
    if (!generatedScript || !generatedScript.scenes || typeof window === 'undefined') return;

    let srtContent = '';
    generatedScript.scenes.forEach((scene: any, idx: number) => {
      const startSec = idx * 10;
      const endSec = (idx + 1) * 10;
      const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60).toString().padStart(2, '0');
        const s = (sec % 60).toString().padStart(2, '0');
        return `00:${m}:${s},000`;
      };

      srtContent += `${idx + 1}\n${formatTime(startSec)} --> ${formatTime(endSec)}\n${scene.narration}\n\n`;
    });

    const blob = new Blob([srtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedScript.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_subtitles.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Web SpeechSynthesizer Audio Preview
  const speakDialogue = (text: string, id: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported on this browser version.');
      return;
    }

    if (playingAudioId === id) {
      window.speechSynthesis.cancel();
      setPlayingAudioId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 1.3;
    utterance.rate = 0.95;

    utterance.onstart = () => setPlayingAudioId(id);
    utterance.onend = () => setPlayingAudioId(null);
    utterance.onerror = () => setPlayingAudioId(null);

    window.speechSynthesis.speak(utterance);
  };

  const renderFreeImage = (promptText: string, id: string) => {
    if (cooldowns[id] && cooldowns[id] > 0) return;

    setRenderingIndex(id);
    const encodedPrompt = encodeURIComponent(
      `${promptText}, (consistent:1.3) based on character: 5-year-old wavy dark-brown hair yellow top turquoise overalls lina (@Lina) and magical colorful trains (@Train), 3d preschool animation, Pixar 8k render, cinematic lighting`
    );
    const seed = Math.floor(Math.random() * 99999);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=turbo&width=1280&height=720&nologo=true&seed=${seed}`;

    if (typeof window !== 'undefined') {
      const img = new Image();
      img.src = imageUrl;
      img.onload = () => {
        setRenderedImages((prev) => ({ ...prev, [id]: imageUrl }));
        setRenderingIndex(null);
        setCooldowns((prev) => ({ ...prev, [id]: 45 }));
      };
      img.onerror = () => {
        setRenderingIndex(null);
        setCooldowns((prev) => ({ ...prev, [id]: 45 }));
      };
    }
  };

  // Build Google Flow Omni Flash Prompt (10s duration)
  const buildGoogleFlowOmniPrompt = (promptText: string, narration: string, sfx?: string, sceneNum?: number) => {
    return `[Google Flow Omni Flash - Scene ${sceneNum} / 7 (10 Seconds)] Action: ${promptText}. Style Reference: @Lina and @Train must match uploaded visual references. Native Audio & Voiceover: Lina speaks in a sweet, cheerful 5-year-old girl voice saying: "${narration}". ${sfx ? `Sound effects: ${sfx}.` : ''} Format: 16:9 widescreen, 10s duration, 360p fast generation.`;
  };

  const generateProductionPlan = async () => {
    if (!topic.trim()) {
      setError('Please enter a video topic or lesson concept.');
      return;
    }

    setLoading(true);
    setError('');
    setGeneratedScript(null);
    setRenderedImages({});
    setChecklist({
      script: true,
      omniFlashClips: false,
      flowUpscaled: false,
      subtitlesExported: false,
      logoAdded: false,
      youtubeUploaded: false
    });

    const systemPrompt = `
You are the lead showrunner for "Lina's Magic Land", a 3D animated educational YouTube series for preschoolers.
${LINA_CHARACTER_PROMPT}

Create a 70-SECOND episode (EXACTLY 7 SCENES of 10 SECONDS EACH) based on topic: "${topic}".
Each scene must be engineered for Google Flow Omni Flash (360p fast generation, then upscaled) with native voiceover.

Return ONLY valid JSON matching this exact structure:
{
  "title": "Episode Title",
  "learningGoal": "Core educational message",
  "thumbnailPrompt": "3D YouTube thumbnail prompt featuring @Lina and @Train with high visual contrast",
  "seo": {
    "title": "Optimized YouTube Title",
    "description": "Engaging description with hashtags",
    "tags": ["Lina Magic Land", "Preschool Learning", "3D Animation", "Educational Video"]
  },
  "audioPlan": {
    "bgMusic": "Upbeat cheerful orchestral preschool melody with xylophone and bells",
    "overallSFX": "Train whistle, magic sparkle chimes, happy giggles"
  },
  "scenes": [
    {
      "sceneNumber": 1,
      "narration": "Short clear voiceover sentence for 10-second clip",
      "sfx": "Train steam whistle choo-choo and magical chime",
      "imagePrompt": "Detailed 3D visual description including Lina (@Lina) and Magic Train (@Train)",
      "videoPrompt": "10-second camera motion prompt for Omni Flash"
    },
    { "sceneNumber": 2, "narration": "Sentence 2", "sfx": "SFX 2", "imagePrompt": "Prompt 2", "videoPrompt": "Motion 2" },
    { "sceneNumber": 3, "narration": "Sentence 3", "sfx": "SFX 3", "imagePrompt": "Prompt 3", "videoPrompt": "Motion 3" },
    { "sceneNumber": 4, "narration": "Sentence 4", "sfx": "SFX 4", "imagePrompt": "Prompt 4", "videoPrompt": "Motion 4" },
    { "sceneNumber": 5, "narration": "Sentence 5", "sfx": "SFX 5", "imagePrompt": "Prompt 5", "videoPrompt": "Motion 5" },
    { "sceneNumber": 6, "narration": "Sentence 6", "sfx": "SFX 6", "imagePrompt": "Prompt 6", "videoPrompt": "Motion 6" },
    { "sceneNumber": 7, "narration": "Sentence 7", "sfx": "SFX 7", "imagePrompt": "Prompt 7", "videoPrompt": "Motion 7" }
  ]
}
`;

    try {
      if (!apiKey) {
        setTimeout(() => {
          const fallbackScenes = Array.from({ length: 7 }, (_, i) => ({
            sceneNumber: i + 1,
            narration: `Step ${i + 1}: Let us explore ${topic} together with Lina and the Magic Train!`,
            sfx: "Train steam whistle choo-choo and cheerful chime",
            imagePrompt: `3D preschool animation shot ${i + 1} showing Lina (@Lina) and Magic Train (@Train) learning ${topic}, colorful landscape, 16:9 aspect ratio.`,
            videoPrompt: `10-second Omni Flash shot ${i + 1}: Lina giggling and waving as the Magic Train moves along the rainbow track.`
          }));

          const fallbackData = {
            title: `Lina & The Magic Train: ${topic} (70s Episode)`,
            learningGoal: `Learning about ${topic} in 7 magical 10-second steps.`,
            thumbnailPrompt: `3D preschool animation thumbnail, Lina with dark wavy hair, yellow top, turquoise overalls, hugging cute smiling Magic Train, vibrant rainbow background, bright lighting, 16:9 aspect ratio.`,
            seo: {
              title: `Lina's Magic Land - ${topic} | 70s Preschool Learning`,
              description: `Join Lina (@Lina) and her cute Magic Train (@Train) in this 70-second adventure exploring ${topic}! #LinasMagicLand #Preschool`,
              tags: ['Lina Magic Land', 'Preschool Learning', topic, '3D Animation']
            },
            audioPlan: {
              bgMusic: "Upbeat bouncy playful acoustic guitar & xylophone preschool track",
              overallSFX: "Steam whistle choo-choo, sparkling magic wand sound, popping bubbles"
            },
            scenes: fallbackScenes
          };
          setGeneratedScript(fallbackData);
          saveCurrentProject(fallbackData);
          setLoading(false);
        }, 1000);
        return;
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }]
          })
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Failed to connect to Gemini API');

      let rawText = data.candidates[0].content.parts[0].text;
      rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

      const parsed = JSON.parse(rawText);
      setGeneratedScript(parsed);
      saveCurrentProject(parsed);
    } catch (err: any) {
      setError(err.message || 'Error generating script. Check your API key or connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="studio-container">
      {/* Header Bar */}
      <header className="studio-header">
        <div>
          <h1 className="studio-title">Lina AI Studio 🚂✨</h1>
          <p className="studio-subtitle">70s (7x10s) Google Flow Production Hub</p>
        </div>
        <div className="btn-group">
          <button onClick={() => setShowSaved(!showSaved)} className="btn-secondary">
            📁 Projects ({savedProjects.length})
          </button>
          <button onClick={() => setShowSettings(!showSettings)} className="btn-secondary" style={{ color: '#fbbf24' }}>
            {apiKey ? '⚙️ Gemini Saved' : '🔑 Add Free Key'}
          </button>
        </div>
      </header>

      {/* Visual & Channel Branding References */}
      <section className="card" style={{ border: '2px dashed #fbbf24', background: '#090d16' }}>
        <h3 style={{ color: '#fbbf24', fontSize: '13px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          ⭐ OFFICIAL CHANNEL BRANDING & CHARACTER SPECS
        </h3>
        <p style={{ fontSize: '11px', color: '#cbd5e1', marginBottom: '12px' }}>
          Download character references and your top-right watermark logo for CapCut video assembly.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {/* Card: Lina */}
          <div className="card-inner" style={{ border: '1px solid #334155', padding: '8px' }}>
            <span className="label" style={{ color: '#60a5fa' }}>LINA (@LINA)</span>
            <div style={{ margin: '6px 0', height: '70px', overflow: 'hidden', borderRadius: '6px', background: '#ffffff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <img src="/lina-ref.png" alt="Lina Specs" style={{ height: '100%', objectFit: 'contain' }} />
            </div>
            <a href="/lina-ref.png" download className="btn-copy" style={{ textAlign: 'center', display: 'block', backgroundColor: '#2563eb', color: '#ffffff' }}>
              Get Ref
            </a>
          </div>

          {/* Card: Train */}
          <div className="card-inner" style={{ border: '1px solid #334155', padding: '8px' }}>
            <span className="label" style={{ color: '#a78bfa' }}>MAGIC TRAIN (@TRAIN)</span>
            <div style={{ margin: '6px 0', height: '70px', overflow: 'hidden', borderRadius: '6px', background: '#ffffff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <img src="/train-ref.png" alt="Magic Train Specs" style={{ height: '100%', objectFit: 'contain' }} />
            </div>
            <a href="/train-ref.png" download className="btn-copy" style={{ textAlign: 'center', display: 'block', backgroundColor: '#2c5282', color: '#ffffff' }}>
              Get Ref
            </a>
          </div>
        </div>
      </section>

      {/* Settings Drawer */}
      {showSettings && (
        <div className="card">
          <h3 style={{ color: '#fbbf24', marginBottom: '8px' }}>Google Gemini API Setup</h3>
          <p style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '12px' }}>
            Get your free key from{' '}
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: '#fbbf24' }}>
              Google AI Studio
            </a>
            . Saved on your phone browser only.
          </p>
          <input
            type="password"
            placeholder="Paste Gemini Key here..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="input-field"
          />
          <button onClick={() => saveApiKey(apiKey)} className="btn-primary">
            Save Key
          </button>
        </div>
      )}

      {/* Saved Projects Drawer */}
      {showSaved && (
        <div className="card">
          <h3 style={{ color: '#fbbf24', marginBottom: '12px' }}>📁 Saved Episodes on Phone</h3>
          {savedProjects.length === 0 ? (
            <p style={{ fontSize: '12px', color: '#94a3b8' }}>No saved projects yet. Generate an episode below!</p>
          ) : (
            savedProjects.map((p) => (
              <div key={p.id} className="card-inner flex-between" style={{ marginBottom: '8px' }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>{p.title}</p>
                  <p style={{ fontSize: '10px', color: '#94a3b8' }}>Saved on {p.createdAt}</p>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => setGeneratedScript(p)} className="btn-copy">
                    Load
                  </button>
                  <button onClick={() => deleteProject(p.id)} className="btn-copy" style={{ color: '#f87171' }}>
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Main Workstation */}
      <main>
        <section className="card">
          <h2 className="section-title">👈 1. Generate 70s Episode (7x10s Omni Flash Clips)</h2>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>
            Enter an educational topic (e.g., &quot;Counting 1 to 5&quot;, &quot;Colors of Rainbow&quot;, &quot;Healthy Vegetables&quot;).
          </p>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Learning Numbers with Magic Train"
            className="input-field"
          />
          <button onClick={generateProductionPlan} disabled={loading} className="btn-primary">
            {loading ? 'Generating 7-Scene Package...' : 'Generate 70s Episode (7 Clips) ✨'}
          </button>
          {error && <p style={{ fontSize: '12px', color: '#f87171', marginTop: '8px' }}>{error}</p>}
        </section>

        {/* Generated Episode Workspace */}
        {generatedScript && (
          <div>
            <div className="card">
              <span className="label" style={{ color: '#fbbf24' }}>
                70-Second Episode Workspace (7x10s Clips)
              </span>
              <h2 className="section-title" style={{ fontSize: '20px', marginTop: '4px' }}>
                {generatedScript.title}
              </h2>
              <p style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px' }}>
                <strong>Educational Goal:</strong> {generatedScript.learningGoal}
              </p>

              {/* Subtitle Exporter & Video Assembly Bar */}
              <div className="card-inner" style={{ backgroundColor: '#0f172a', borderColor: '#3b82f6', marginTop: '12px' }}>
                <span className="label" style={{ color: '#60a5fa' }}>
                  🎬 Subtitle &amp; Assembly Toolbar
                </span>
                <p style={{ fontSize: '11px', color: '#cbd5e1', marginBottom: '8px' }}>
                  Style preview: <span style={{ color: '#facc15', fontWeight: 'bold', textShadow: '1px 1px 2px #000' }}>Yellow / Red / Green Bubble Subtitles</span>
                </p>
                <button
                  onClick={downloadSRT}
                  className="btn-primary"
                  style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: '#ffffff', padding: '10px' }}
                >
                  📥 Download CapCut Subtitles (.SRT file)
                </button>
              </div>

              {/* Interactive Production Checklist */}
              <div className="card-inner" style={{ borderColor: '#334155', marginTop: '12px' }}>
                <span className="label" style={{ color: '#fbbf24', marginBottom: '8px' }}>
                  ⚡ Production Checklist
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <label style={{ fontSize: '12px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input type="checkbox" checked={checklist.script} onChange={() => toggleChecklistItem('script')} />
                    7-Scene Script
                  </label>
                  <label style={{ fontSize: '12px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input type="checkbox" checked={checklist.omniFlashClips} onChange={() => toggleChecklistItem('omniFlashClips')} />
                    7x 10s 360p Clips
                  </label>
                  <label style={{ fontSize: '12px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input type="checkbox" checked={checklist.flowUpscaled} onChange={() => toggleChecklistItem('flowUpscaled')} />
                    Upscaled in Flow
                  </label>
                  <label style={{ fontSize: '12px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input type="checkbox" checked={checklist.subtitlesExported} onChange={() => toggleChecklistItem('subtitlesExported')} />
                    Subtitles Imported
                  </label>
                  <label style={{ fontSize: '12px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input type="checkbox" checked={checklist.logoAdded} onChange={() => toggleChecklistItem('logoAdded')} />
                    Channel Logo Overlay
                  </label>
                  <label style={{ fontSize: '12px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input type="checkbox" checked={checklist.youtubeUploaded} onChange={() => toggleChecklistItem('youtubeUploaded')} />
                    Uploaded to YouTube
                  </label>
                </div>
              </div>

              {/* YouTube Metadata Box */}
              <div className="card-inner" style={{ marginTop: '12px' }}>
                <span className="label" style={{ color: '#fbbf24' }}>
                  🚀 YouTube Upload Metadata
                </span>
                
                <div style={{ marginBottom: '8px' }}>
                  <div className="flex-between" style={{ marginBottom: '2px' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Video Title</span>
                    <button onClick={() => copyToClipboard(generatedScript.seo.title, 'yt-title')} className="btn-copy">
                      {copiedId === 'yt-title' ? 'Copied! ✅' : 'Copy Title'}
                    </button>
                  </div>
                  <p style={{ fontSize: '12px', color: '#ffffff', fontWeight: 'bold' }}>{generatedScript.seo.title}</p>
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <div className="flex-between" style={{ marginBottom: '2px' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Description</span>
                    <button onClick={() => copyToClipboard(generatedScript.seo.description, 'yt-desc')} className="btn-copy">
                      {copiedId === 'yt-desc' ? 'Copied! ✅' : 'Copy Description'}
                    </button>
                  </div>
                  <p style={{ fontSize: '12px', color: '#cbd5e1' }}>{generatedScript.seo.description}</p>
                </div>

                <div>
                  <div className="flex-between" style={{ marginBottom: '2px' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Tags</span>
                    <button onClick={() => copyToClipboard(generatedScript.seo.tags.join(', '), 'yt-tags')} className="btn-copy">
                      {copiedId === 'yt-tags' ? 'Copied! ✅' : 'Copy Tags'}
                    </button>
                  </div>
                  <div>
                    {generatedScript.seo.tags.map((tag: string, idx: number) => (
                      <span key={idx} className="tag">#{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Scene Breakdown (7 Scenes) */}
            <h3 style={{ fontSize: '15px', color: '#ffffff', marginBottom: '12px', paddingLeft: '4px' }}>
              🎬 7-Scene Omni Flash Prompts (10s Each = 70s Video)
            </h3>

            {generatedScript.scenes.map((scene: any, idx: number) => {
              const sceneId = `scene-${idx}`;
              const audioId = `audio-${idx}`;
              const activeCooldown = cooldowns[sceneId] || 0;
              const flowOmniPrompt = buildGoogleFlowOmniPrompt(scene.videoPrompt, scene.narration, scene.sfx, scene.sceneNumber || idx + 1);

              return (
                <div key={scene.sceneNumber || idx} className="card">
                  <div
                    className="flex-between"
                    style={{ borderBottom: '1px solid #1f2937', paddingBottom: '8px', marginBottom: '12px' }}
                  >
                    <span className="label" style={{ color: '#fbbf24', margin: 0 }}>
                      Scene {scene.sceneNumber || idx + 1} of 7 (10 Seconds)
                    </span>
                    <button
                      onClick={() => renderFreeImage(scene.imagePrompt, sceneId)}
                      className="btn-copy"
                      disabled={renderingIndex === sceneId || activeCooldown > 0}
                      style={{ backgroundColor: activeCooldown > 0 ? '#475569' : '#d97706', color: '#ffffff' }}
                    >
                      {renderingIndex === sceneId ? 'Rendering...' : activeCooldown > 0 ? `Wait ${activeCooldown}s` : '✨ Preview Image'}
                    </button>
                  </div>

                  {/* Rendered Image Preview */}
                  {renderedImages[sceneId] && (
                    <div style={{ marginBottom: '12px' }}>
                      <img src={renderedImages[sceneId]} alt={`Scene ${scene.sceneNumber}`} style={{ width: '100%', borderRadius: '10px', border: '1px solid #334155' }} />
                    </div>
                  )}

                  {/* Dialogue & Voiceover Text */}
                  <div style={{ marginBottom: '10px' }}>
                    <div className="flex-between" style={{ marginBottom: '4px' }}>
                      <span className="label" style={{ margin: 0 }}>Dialogue / Subtitle Text</span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => speakDialogue(scene.narration, audioId)}
                          className="btn-copy"
                          style={{ backgroundColor: playingAudioId === audioId ? '#ef4444' : '#10b981', color: '#ffffff', fontSize: '10px' }}
                        >
                          {playingAudioId === audioId ? '⏹️ Stop' : '🔊 Listen'}
                        </button>
                        <button onClick={() => copyToClipboard(scene.narration, `voice-${idx}`)} className="btn-copy" style={{ fontSize: '10px' }}>
                          {copiedId === `voice-${idx}` ? 'Copied! ✅' : 'Copy'}
                        </button>
                      </div>
                    </div>
                    <div
                      className="narration-box"
                      style={{
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        color: '#facc15',
                        textShadow: '1px 1px 3px #000000, -1px -1px 3px #000000',
                        backgroundColor: '#020617',
                        border: '1px dashed #eab308'
                      }}
                    >
                      &quot;{scene.narration}&quot;
                    </div>
                  </div>

                  {/* Google Flow Omni Flash Prompt Card */}
                  <div className="card-inner" style={{ borderColor: '#3b82f6', backgroundColor: '#090d16' }}>
                    <div className="flex-between" style={{ marginBottom: '4px' }}>
                      <span className="label" style={{ color: '#60a5fa', margin: 0 }}>
                        ⚡ Scene {idx + 1} Omni Flash Prompt (360p, 10s)
                      </span>
                      <button
                        onClick={() => copyToClipboard(flowOmniPrompt, `flow-omni-${idx}`)}
                        className="btn-copy"
                        style={{ fontSize: '10px', backgroundColor: '#1d4ed8', color: '#ffffff' }}
                      >
                        {copiedId === `flow-omni-${idx}` ? 'Copied! ✅' : 'Copy Scene Prompt'}
                      </button>
                    </div>
                    <div className="prompt-box" style={{ color: '#93c5fd', fontSize: '11px' }}>
                      {flowOmniPrompt}
                    </div>

                    <div style={{ marginTop: '10px' }}>
                      <a
                        href="https://labs.google/fx/tools/flow"
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'block',
                          textAlign: 'center',
                          backgroundColor: '#2563eb',
                          color: '#ffffff',
                          padding: '10px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 700,
                          textDecoration: 'none'
                        }}
                      >
                        🎬 Open Google Flow: Generate Clip {idx + 1}
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
