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
        console.error('Error loading projects', e);
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
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      {/* Header */}
      <header className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-amber-400">
            Lina AI Studio 🚂✨
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Production Hub for <span className="text-slate-200 font-semibold">Lina's Magic Land</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSaved(!showSaved)}
            className="px-3 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl transition text-slate-300"
          >
            📁 Projects ({savedProjects.length})
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-3 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl transition text-amber-400"
          >
            {apiKey ? '⚙️ Gemini Saved' : '🔑 Add Free Key'}
          </button>
        </div>
      </header>

      {/* Gemini Settings Drawer */}
      {showSettings && (
        <div className="max-w-4xl mx-auto my-4 p-4 bg-slate-900 border border-amber-500/30 rounded-2xl shadow-xl">
          <h3 className="text-sm font-bold text-amber-400 mb-2">Google Gemini API Setup</h3>
          <p className="text-xs text-slate-300 mb-3">
            Get your 100% free API key from{' '}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-amber-400 underline font-semibold"
            >
              Google AI Studio
            </a>
            . Stored locally in your phone browser.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="Paste Gemini Key here..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
            />
            <button
              onClick={() => saveApiKey(apiKey)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition"
            >
              Save Key
            </button>
          </div>
        </div>
      )}

      {/* Saved Projects Drawer */}
      {showSaved && (
        <div className="max-w-4xl mx-auto my-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-3">
          <h3 className="text-sm font-bold text-amber-400">📁 Saved Episodes on Phone</h3>
          {savedProjects.length === 0 ? (
            <p className="text-xs text-slate-400">No saved projects yet. Generate an episode below!</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {savedProjects.map((p) => (
                <div key={p.id} className="flex justify-between items-center p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                  <div>
                    <p className="text-xs font-bold text-white">{p.title}</p>
                    <p className="text-[10px] text-slate-400">Saved on {p.createdAt}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setGeneratedScript(p)}
                      className="px-2.5 py-1 text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg hover:bg-amber-500/30"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => deleteProject(p.id)}
                      className="px-2.5 py-1 text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Studio Workstation */}
      <main className="max-w-4xl mx-auto mt-6 space-y-6">
        {/* Creator Input Section */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <h2 className="text-lg font-bold text-white mb-1">1. AI Episode & Script Generator</h2>
          <p className="text-xs text-slate-400 mb-4">
            Enter an educational topic (e.g., "Counting 1 to 5", "Colors of Rainbow", "Healthy Vegetables").
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Learning Numbers with Magic Train"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-400"
            />
            <button
              onClick={generateProductionPlan}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm rounded-xl transition disabled:opacity-50"
            >
              {loading ? 'Generating Episode...' : 'Generate Episode ✨'}
            </button>
          </div>
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        </section>

        {/* Output Section */}
        {generatedScript && (
          <section className="space-y-6">
            {/* Overview & Metadata */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-amber-400 uppercase bg-amber-400/10 px-2 py-1 rounded border border-amber-500/20">
                  Episode Workspace
                </span>
                <h3 className="text-xl font-extrabold text-white mt-2">{generatedScript.title}</h3>
                <p className="text-xs text-slate-300 mt-1">
                  <span className="font-semibold text-slate-400">Educational Goal:</span> {generatedScript.learningGoal}
                </p>
              </div>

              {/* YouTube Thumbnail Prompt */}
              {generatedScript.thumbnailPrompt && (
                <div className="bg-slate-950 rounded-xl p-4 border border-slate-800/80 space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">🖼️ 3D Thumbnail Prompt</h4>
                    <button
                      onClick={() => copyToClipboard(generatedScript.thumbnailPrompt, 'thumb-btn')}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg text-slate-200 border border-slate-700"
                    >
                      {copiedId === 'thumb-btn' ? 'Copied! ✅' : 'Copy Prompt'}
                    </button>
                  </div>
                  <p className="text-xs font-mono text-amber-200 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 select-all">
                    {generatedScript.thumbnailPrompt}
                  </p>
                </div>
              )}

              {/* YouTube Metadata */}
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800/80 space-y-2">
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">YouTube SEO Metadata</h4>
                <p className="text-xs text-slate-200">
                  <span className="font-semibold text-slate-400">Title:</span> {generatedScript.seo.title}
                </p>
                <p className="text-xs text-slate-300">
                  <span className="font-semibold text-slate-400">Description:</span> {generatedScript.seo.description}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {generatedScript.seo.tags.map((tag: string, idx: number) => (
                    <span key={idx} className="text-[10px] bg-slate-900 text-amber-400 px-2.5 py-1 rounded-md border border-slate-800">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Scene Prompt Breakdown */}
            <div className="space-y-4">
              <h3 className="text-md font-bold text-white flex items-center gap-2">
                🎬 Scene Breakdown & AI Generation Prompts
              </h3>

              {generatedScript.scenes.map((scene: any, idx: number) => (
                <div key={scene.sceneNumber || idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Scene {scene.sceneNumber || idx + 1}
                    </span>
                    <button
                      onClick={() => copyToClipboard(scene.imagePrompt, `img-${idx}`)}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-lg text-slate-200 border border-slate-700 transition"
                    >
                      {copiedId === `img-${idx}` ? 'Copied! ✅' : 'Copy 3D Image Prompt'}
                    </button>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-semibold text-slate-400 uppercase">Dialogue / Voiceover</label>
                      <button
                        onClick={() => copyToClipboard(scene.narration, `voice-${idx}`)}
                        className="text-[9px] text-amber-400 hover:underline"
                      >
                        {copiedId === `voice-${idx}` ? 'Copied! ✅' : 'Copy Voiceover Text'}
                      </button>
                    </div>
                    <p className="text-xs text-slate-200 italic bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      "{scene.narration}"
                    </p>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase">3D Image Generator Prompt</label>
                    <p className="text-xs font-mono bg-slate-950 p-2.5 rounded-xl text-amber-200 border border-slate-800 select-all">
                      {scene.imagePrompt}
                    </p>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase">Video Motion Prompt (8-sec clip)</label>
                    <p className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      {scene.videoPrompt}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
