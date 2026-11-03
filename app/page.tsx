'use client';

import React, { useState, useEffect } from 'react';

// Character System Prompt Specifications
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
  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  useEffect(() => {
    const savedKey = localStorage.getItem('LINA_GEMINI_API_KEY');
    if (savedKey) setApiKey(savedKey);
  }, []);

  const saveApiKey = (key: string) => {
    setApiKey(key.trim());
    localStorage.setItem('LINA_GEMINI_API_KEY', key.trim());
    setShowSettings(false);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
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

Create a complete 3-minute episode script package based on the topic: "${topic}".

Return ONLY valid JSON matching this exact structure:
{
  "title": "Episode Title",
  "learningGoal": "Core educational message",
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
      "videoPrompt": "Motion description for AI video generator (Runway/Luma/SORA style)"
    }
  ]
}
`;

    try {
      if (!apiKey) {
        // Built-in offline demo output if key is not yet configured
        setTimeout(() => {
          setGeneratedScript({
            title: `Lina & The Magic Train: ${topic}`,
            learningGoal: `Learning about ${topic} through magical play.`,
            seo: {
              title: `Lina's Magic Land - ${topic} | 3D Preschool Learning`,
              description: `Join Lina and her cute Magic Train as they explore ${topic}! Fun 3D animated learning for toddlers & preschoolers. #LinasMagicLand #Preschool`,
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
          });
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
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl transition"
        >
          {apiKey ? '⚙️ Gemini API Saved' : '🔑 Add Free Gemini API Key'}
        </button>
      </header>

      {/* Settings Modal / Drawer */}
      {showSettings && (
        <div className="max-w-4xl mx-auto my-4 p-4 bg-slate-900 border border-amber-500/30 rounded-2xl shadow-xl">
          <h3 className="text-sm font-bold text-amber-400 mb-2">Google Gemini API Configuration</h3>
          <p className="text-xs text-slate-300 mb-3">
            Get your 100% free key from{' '}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-amber-400 underline font-semibold"
            >
              Google AI Studio
            </a>
            . Your key is saved locally in your phone's browser only.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="Paste Gemini API Key here..."
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

      {/* Main Studio Workstation */}
      <main className="max-w-4xl mx-auto mt-6 space-y-6">
        {/* Creator Input Section */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <h2 className="text-lg font-bold text-white mb-1">1. AI Episode & Script Generator</h2>
          <p className="text-xs text-slate-400 mb-4">
            Enter an educational topic (e.g., "Counting 1 to 5", "Colors of the Rainbow", "Healthy Fruits").
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
                  Episode Concept
                </span>
                <h3 className="text-xl font-extrabold text-white mt-2">{generatedScript.title}</h3>
                <p className="text-xs text-slate-300 mt-1">
                  <span className="font-semibold text-slate-400">Educational Goal:</span> {generatedScript.learningGoal}
                </p>
              </div>

              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800/80 space-y-2">
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">YouTube Metadata & SEO</h4>
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
                🎬 Scene-by-Scene Visual & Dialogue Breakdown
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
                      {copiedIndex === `img-${idx}` ? 'Copied! ✅' : 'Copy 3D Image Prompt'}
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase">Dialogue / Voiceover</label>
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
