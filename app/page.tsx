'use client';

import React, { useState, useEffect } from 'react';

const LINA_CHARACTER_PROMPT = `
Character 1: Lina (5-year-old animated girl, round expressive face, big sparkling brown eyes, short wavy dark-brown hair, yellow hair clip, yellow top, turquoise overalls, colorful sneakers).
Character 2: Magic Train (Cute, colorful, toy-like train with a friendly expressive face, glowing magical details, cheerful carriages).
Visual Style: High-quality colorful 3D preschool animation, magical environments, cinematic lighting, smooth child-friendly movements. Aspect ratio: 16:9 landscape.
`;

export default function StudioDashboard() {
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<any>(null);
  const [savedProjects, setSavedProjects] = useState<any[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const savedKey = localStorage.getItem('LINA_GEMINI_API_KEY');
    if (savedKey) setApiKey(savedKey);

    const storedProjects = localStorage.getItem('LINA_SAVED_PROJECTS');
    if (storedProjects) {
      try {
        setSavedProjects(JSON.parse(storedProjects));
      } catch (e) {
        console.error('Error loading saved projects', e);
      }
    }
  }, []);

  const saveApiKey = (key: string) => {
    setApiKey(key.trim());
    localStorage.setItem('LINA_GEMINI_API_KEY', key.trim());
    setShowSettings(false);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const saveCurrentProject = (projectData: any) => {
    const newProject = {
      id: Date.now().toString(),
      createdAt: new Date().toLocaleDateString(),
      ...projectData
    };
    const updated = [newProject, ...savedProjects];
    setSavedProjects(updated);
    localStorage.setItem('LINA_SAVED_PROJECTS', JSON.stringify(updated));
  };

  const deleteProject = (id: string) => {
    const updated = savedProjects.filter((p) => p.id !== id);
    setSavedProjects(updated);
    localStorage.setItem('LINA_SAVED_PROJECTS', JSON.stringify(updated));
  };

  const generateProductionPlan = async () => {
    if (!topic.trim()) {
      setError('Please enter a video topic or lesson concept.');
      return;
    }

    setLoading(true);
    setError('');
    setGeneratedScript(null);

    const systemPrompt = `
You are the lead showrunner for "Lina's Magic Land", a 3D animated educational YouTube series for preschoolers.
${LINA_CHARACTER_PROMPT}

Create a complete production package based on topic: "${topic}".

Return ONLY valid JSON matching this exact structure:
{
  "title": "Episode Title",
  "learningGoal": "Core educational message",
  "thumbnailPrompt": "3D YouTube thumbnail prompt featuring Lina smiling next to Magic Train with high visual contrast",
  "seo": {
    "title": "Optimized YouTube Title",
    "description": "Engaging description with hashtags",
    "tags": ["Lina Magic Land", "Preschool Learning", "3D Animation", "Educational Video"]
  },
  "scenes": [
    {
      "sceneNumber": 1,
      "narration": "Voiceover narrative or Lina/Train dialogue",
      "imagePrompt": "Detailed 3D prompt for image generator including Lina and Magic Train visual consistency",
      "videoPrompt": "Motion description for AI video generator (Runway/Luma style)"
    }
  ]
}
`;

    try {
      if (!apiKey) {
        setTimeout(() => {
          const fallbackData = {
            title: `Lina & The Magic Train: ${topic}`,
            learningGoal: `Learning about ${topic} through magical play.`,
            thumbnailPrompt: `3D preschool animation thumbnail, Lina with dark wavy hair, yellow hair clip, turquoise overalls, hugging the cute smiling Magic Train, vibrant rainbow background, bright lighting, high detail, 16:9 aspect ratio.`,
            seo: {
              title: `Lina's Magic Land - ${topic} | 3D Preschool Learning`,
              description: `Join Lina and her cute Magic Train as they explore ${topic}! Fun 3D animated learning for preschoolers. #LinasMagicLand #Preschool`,
              tags: ['Lina Magic Land', 'Preschool Learning', topic, '3D Animation']
            },
            scenes: [
              {
                sceneNumber: 1,
                narration: "Hello friends! Welcome to Lina's Magic Land! Look, the Magic Train is here!",
                imagePrompt: `3D preschool animation shot of Lina, a 5-year-old girl with wavy dark-brown hair, yellow hair clip, turquoise overalls, waving excitedly next to a colorful friendly Magic Train with glowing wheels, wide angle, bright sunny magical garden, 16:9 aspect ratio.`,
                videoPrompt: "Lina waves cheerfully as the Magic Train rolls up slowly with puffing star-shaped steam, smooth 3D animation, 8 seconds."
              },
              {
                sceneNumber: 2,
                narration: `Today we are going on a journey to learn all about ${topic}! Choo choo!`,
                imagePrompt: `3D preschool animation, Lina riding inside the cheerful open carriage of the Magic Train, pointing happily towards a colorful landscape showing ${topic}, cinematic lighting, 16:9 aspect ratio.`,
                videoPrompt: "Camera pans alongside the Magic Train moving through a vibrant rainbow track, Lina giggling and clapping, 8 seconds."
              }
            ]
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
          <p className="studio-subtitle">Production Hub for Lina's Magic Land</p>
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

      {/* Settings Drawer */}
      {showSettings && (
        <div className="card">
          <h3 style={{ color: '#fbbf24', marginBottom: '8px' }}>Google Gemini API Setup</h3>
          <p style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '12px' }}>
            Get your free key from{' '}
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: '#fbbf24' }}>
              Google AI Studio
            </a>
            . Saved on your phone only.
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

      {/* Main Form */}
      <main>
        <section className="card">
          <h2 className="section-title">1. AI Episode & Script Generator</h2>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>
            Enter an educational topic (e.g., "Counting 1 to 5", "Colors of Rainbow", "Healthy Vegetables").
          </p>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Learning Numbers with Magic Train"
            className="input-field"
          />
          <button onClick={generateProductionPlan} disabled={loading} className="btn-primary">
            {loading ? 'Generating Episode...' : 'Generate Episode ✨'}
          </button>
          {error && <p style={{ fontSize: '12px', color: '#f87171', marginTop: '8px' }}>{error}</p>}
        </section>

        {/* Generated Episode Output */}
        {generatedScript && (
          <div>
            {/* Overview */}
            <div className="card">
              <span className="label" style={{ color: '#fbbf24' }}>
                Episode Workspace
              </span>
              <h2 className="section-title" style={{ fontSize: '20px', marginTop: '4px' }}>
                {generatedScript.title}
              </h2>
              <p style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px' }}>
                <strong>Educational Goal:</strong> {generatedScript.learningGoal}
              </p>

              {/* Thumbnail Prompt */}
              {generatedScript.thumbnailPrompt && (
                <div className="card-inner">
                  <div className="flex-between" style={{ marginBottom: '6px' }}>
                    <span className="label" style={{ color: '#fbbf24', margin: 0 }}>
                      🖼️ 3D Thumbnail Prompt
                    </span>
                    <button
                      onClick={() => copyToClipboard(generatedScript.thumbnailPrompt, 'thumb-btn')}
                      className="btn-copy"
                    >
                      {copiedId === 'thumb-btn' ? 'Copied! ✅' : 'Copy'}
                    </button>
                  </div>
                  <div className="prompt-box">{generatedScript.thumbnailPrompt}</div>
                </div>
              )}

              {/* YouTube Metadata */}
              <div className="card-inner">
                <span className="label" style={{ color: '#fbbf24' }}>
                  YouTube SEO Metadata
                </span>
                <p style={{ fontSize: '12px', color: '#e2e8f0', marginBottom: '4px' }}>
                  <strong>Title:</strong> {generatedScript.seo.title}
                </p>
                <p style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '8px' }}>
                  <strong>Description:</strong> {generatedScript.seo.description}
                </p>
                <div>
                  {generatedScript.seo.tags.map((tag: string, idx: number) => (
                    <span key={idx} className="tag">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Scenes */}
            <h3 style={{ fontSize: '15px', color: '#ffffff', marginBottom: '12px', paddingLeft: '4px' }}>
              🎬 Scene Breakdown & AI Generation Prompts
            </h3>

            {generatedScript.scenes.map((scene: any, idx: number) => (
              <div key={scene.sceneNumber || idx} className="card">
                <div className="flex-between" style={{ borderBottom: '1px solid #1f2937', paddingBottom: '8px', marginBottom: '12px' }}>
                  <span className="label" style={{ color: '#fbbf24', margin: 0 }}>
                    Scene {scene.sceneNumber || idx + 1}
                  </span>
                  <button
                    onClick={() => copyToClipboard(scene.imagePrompt, `img-${idx}`)}
                    className="btn-copy"
                  >
                    {copiedId === `img-${idx}` ? 'Copied! ✅' : 'Copy Image Prompt'}
                  </button>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <div className="flex-between" style={{ marginBottom: '4px' }}>
                    <span className="label" style={{ margin: 0 }}>
                      Dialogue / Voiceover
                    </span>
                    <button
                      onClick={() => copyToClipboard(scene.narration, `voice-${idx}`)}
                      className="btn-copy"
                      style={{ fontSize: '10px', padding: '2px 6px' }}
                    >
                      {copiedId === `voice-${idx}` ? 'Copied! ✅' : 'Copy Script'}
                    </button>
                  </div>
                  <div className="narration-box">"{scene.narration}"</div>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <span className="label">3D Image Generator Prompt</span>
                  <div className="prompt-box">{scene.imagePrompt}</div>
                </div>

                <div>
                  <span className="label">Video Motion Prompt (8-sec clip)</span>
                  <div className="narration-box" style={{ fontStyle: 'normal' }}>
                    {scene.videoPrompt}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
