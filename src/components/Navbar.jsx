import { useAppContext } from '../context/AppContext';
import { useState, useEffect } from 'react';

const Navbar = () => {
  const { 
    testMode, setTestMode, 
    timeLimit, setTimeLimit, 
    wordLimit, setWordLimit,
    wordListType, setWordListType,
    includePunctuation, setIncludePunctuation,
    includeNumbers, setIncludeNumbers,
    isDictationEnabled, setIsDictationEnabled,
    selectedVoiceURI, setSelectedVoiceURI
  } = useAppContext();

  const [voices, setVoices] = useState([]);

  // Fetch available voices from the browser API
  useEffect(() => {
    const fetchVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices().filter(v => v.lang.includes('en'));
      setVoices(availableVoices);
      if (availableVoices.length > 0 && !selectedVoiceURI) {
        setSelectedVoiceURI(availableVoices[0].voiceURI);
      }
    };

    fetchVoices();
    // Some browsers load voices asynchronously, so we attach an event listener
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = fetchVoices;
    }
  }, [selectedVoiceURI, setSelectedVoiceURI]);

  return (
    <header className="w-full flex flex-col md:flex-row justify-between items-center py-6 mb-8 border-b border-slate-200 gap-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-bold tracking-tighter">
          SK
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">
          SwiftKey
        </h1>
      </div>

      <nav className="flex flex-wrap items-center gap-3 text-sm font-medium">
        <select 
          value={wordListType} 
          onChange={(e) => setWordListType(e.target.value)}
          className="bg-slate-100 border border-slate-200 text-slate-700 py-1.5 px-3 rounded-lg outline-none focus:ring-2 ring-slate-400"
        >
          <option value="200">Top 200 Words</option>
          <option value="1000">Top 1000 Words</option>
          <option value="paragraphs">Paragraphs</option>
        </select>

        <div className="w-px h-6 bg-slate-300 mx-1 hidden md:block"></div>

        <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
          <button 
            onClick={() => setTestMode('time')}
            className={`px-3 py-1 rounded-md transition-colors ${testMode === 'time' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Time
          </button>
          <button 
            onClick={() => setTestMode('words')}
            className={`px-3 py-1 rounded-md transition-colors ${testMode === 'words' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Words
          </button>
        </div>

        {testMode === 'time' ? (
          <select value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))} className="bg-slate-100 border border-slate-200 text-slate-700 py-1.5 px-3 rounded-lg outline-none">
            <option value={60}>1 Minute</option>
            <option value={300}>5 Minutes</option>
            <option value={600}>10 Minutes</option>
          </select>
        ) : (
          <select value={wordLimit} onChange={(e) => setWordLimit(Number(e.target.value))} className="bg-slate-100 border border-slate-200 text-slate-700 py-1.5 px-3 rounded-lg outline-none">
            <option value={50}>50 Words</option>
            <option value={100}>100 Words</option>
            <option value={500}>500 Words</option>
          </select>
        )}

        <div className="w-px h-6 bg-slate-300 mx-1 hidden md:block"></div>

        <button onClick={() => setIncludePunctuation(!includePunctuation)} className={`px-3 py-1.5 rounded-lg transition-colors border ${includePunctuation ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}>
          @ Punctuation
        </button>
        <button onClick={() => setIncludeNumbers(!includeNumbers)} className={`px-3 py-1.5 rounded-lg transition-colors border ${includeNumbers ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}>
          # Numbers
        </button>

        {/* Dictation Toggle */}
        <button onClick={() => setIsDictationEnabled(!isDictationEnabled)} className={`px-3 py-1.5 rounded-lg transition-colors border flex items-center gap-1 ${isDictationEnabled ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}>
          🎙️ Dictation
        </button>

        {/* Dynamic Voice Selector (Only visible when armed) */}
        {isDictationEnabled && (
          <select 
            value={selectedVoiceURI} 
            onChange={(e) => setSelectedVoiceURI(e.target.value)}
            className="bg-blue-50 border border-blue-200 text-blue-800 py-1.5 px-3 rounded-lg outline-none focus:ring-2 ring-blue-400 max-w-[150px] truncate"
          >
            {voices.map((voice) => (
              <option key={voice.voiceURI} value={voice.voiceURI}>
                {voice.name}
              </option>
            ))}
          </select>
        )}

      </nav>
    </header>
  );
};

export default Navbar;
