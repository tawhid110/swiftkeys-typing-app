import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import html2canvas from 'html2canvas';
import { useRef, useState } from 'react';

const Results = ({ history, errors, timeElapsed, testMode, currentLanguage, onRestart }) => {
  const certificateRef = useRef(null);
  
  const [userName, setUserName] = useState("");
  const [isPromptingName, setIsPromptingName] = useState(false);

  const finalWpm = history.length > 0 ? history[history.length - 1].wpm : 0;
  const accuracy = Math.max(0, 100 - (errors / (finalWpm * 5 || 1)) * 100).toFixed(1);

  const handleInitiateDownload = () => {
    setIsPromptingName(true);
  };

  const confirmAndDownload = async () => {
    if (!certificateRef.current) return;
    
    if (!userName.trim()) {
      setUserName("Typing Master"); 
    }

    setTimeout(async () => {
      const canvas = await html2canvas(certificateRef.current, { scale: 2 }); 
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `${userName.trim() || 'Typing'}_Certificate.png`;
      link.click();
      
      setIsPromptingName(false);
    }, 100);
  };

  return (
    <div className="w-full flex flex-col items-center space-y-12 animate-fade-in">
      
      {/* 1. The Analytics Graph */}
      <div className="w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Performance Analytics</h2>
          <div className="flex gap-4 text-lg font-mono">
            <span className="text-blue-600 font-bold">{finalWpm} WPM</span>
            <span className="text-slate-400">|</span>
            <span className="text-red-500 font-bold">{accuracy}% Acc</span>
          </div>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="second" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis yAxisId="left" stroke="#2563eb" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis yAxisId="right" orientation="right" stroke="#ef4444" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Legend iconType="circle" />
              
              <Line yAxisId="left" type="monotone" dataKey="wpm" name="Speed (WPM)" stroke="#2563eb" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
              <Line yAxisId="right" type="stepAfter" dataKey="errors" name="Errors" stroke="#ef4444" strokeWidth={2} dot={false} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4">
          {isPromptingName ? (
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 w-full max-w-md justify-between">
              <input 
                type="text" 
                placeholder="Enter your name..."
                value={userName} 
                onChange={(e) => setUserName(e.target.value)} 
                className="bg-transparent text-slate-800 font-medium outline-none px-2 flex-1"
                autoFocus
              />
              <button onClick={confirmAndDownload} className="px-4 py-1.5 bg-green-600 text-white text-sm font-bold rounded-md hover:bg-green-700 transition">
                Save & Download
              </button>
            </div>
          ) : (
            <div className="flex gap-4">
              <button onClick={onRestart} className="px-6 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition">
                Test Again
              </button>
              <button onClick={handleInitiateDownload} className="px-6 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition shadow-md">
                Get Certificate
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. The Pure Digital CSS Certificate */}
      {/* NEW: We wrapped it in an overflow container so it scrolls instead of squeezing! */}
      <div className="w-full overflow-x-auto pb-6 custom-scrollbar">
        {/* NEW: We force this specific div to be exactly 800px wide (w-[800px]) instead of max-w */}
        <div 
          ref={certificateRef}
          className="w-[800px] mx-auto bg-[#fdfbf7] p-12 shadow-xl border-2 border-[#37585a]"
        >
          <div className="border-[6px] border-double border-[#37585a] h-full p-12 flex flex-col items-center justify-between text-center relative" style={{ minHeight: '500px' }}>
            
            {/* Top Header */}
            <div className="space-y-4 w-full">
              <h1 className="text-5xl font-serif text-[#37585a] tracking-widest uppercase">
                Certificate
              </h1>
              <p className="text-[#37585a] tracking-[0.3em] uppercase">
                of Appreciation
              </p>
              <div className="w-24 h-px bg-[#37585a] mx-auto mt-6"></div>
            </div>

            {/* User Name */}
            <div className="w-full my-12">
              <h2 className="text-6xl font-serif text-slate-800 capitalize mb-4">
                {userName || "[Your Name]"}
              </h2>
              <p className="text-[#37585a] tracking-widest uppercase px-4 max-w-lg mx-auto leading-relaxed">
                In recognition of your dedication and hard work during your typing evaluation.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="w-full border-t border-[#37585a] pt-6 flex justify-between items-center text-[#37585a] font-serif">
              
              <div className="w-1/4 flex flex-col">
                <span className="text-sm tracking-widest uppercase mb-1">WPM</span>
                <span className="text-3xl font-bold text-slate-800">{finalWpm}</span>
              </div>
              
              <div className="w-px h-12 bg-[#37585a]/30"></div>
              
              <div className="w-1/4 flex flex-col">
                <span className="text-sm tracking-widest uppercase mb-1">Accuracy</span>
                <span className="text-3xl font-bold text-slate-800">{accuracy}%</span>
              </div>
              
              <div className="w-px h-12 bg-[#37585a]/30"></div>

              <div className="w-1/4 flex flex-col">
                <span className="text-sm tracking-widest uppercase mb-1">Mode</span>
                <span className="text-xl font-bold text-slate-800 capitalize">{testMode}</span>
              </div>

              <div className="w-px h-12 bg-[#37585a]/30"></div>

              <div className="w-1/4 flex flex-col">
                <span className="text-sm tracking-widest uppercase mb-1">Lang</span>
                <span className="text-xl font-bold text-slate-800">{currentLanguage}</span>
              </div>

            </div>

            {/* Corner Decorations */}
            <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-[#37585a]"></div>
            <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-[#37585a]"></div>
            <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-[#37585a]"></div>
            <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-[#37585a]"></div>

          </div>
        </div>
      </div>

    </div>
  );
};

export default Results;