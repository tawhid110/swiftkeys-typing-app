import { useAppContext } from './context/AppContext';
import { useEngine } from './hooks/useEngine';
import { useDictation } from './hooks/useDictation';
import Navbar from './components/Navbar';
import Results from './components/Results'; 
import { useEffect, useRef, memo, forwardRef } from 'react';

const CharacterSpan = memo(forwardRef(({ char, isTyped, isCurrent, isCorrect, isRevealed }, ref) => {
  let bgColor = "bg-transparent";
  let textColor = "text-slate-400"; 
  if (isRevealed && isTyped) {
    bgColor = isCorrect ? "bg-green-100" : "bg-red-200";
    textColor = isCorrect ? "text-green-800" : "text-red-900";
  }
  if (!isRevealed && !isCurrent) {
      return <span className="opacity-0">{char}</span>;
  }
  return (
    <span className="relative inline-block">
      {isCurrent && <span ref={ref} className="absolute -left-[1px] top-0 h-full w-[2px] bg-slate-800 animate-pulse z-10" />}
      <span className={`${bgColor} ${textColor} rounded-sm px-[1px]`}>{char}</span>
    </span>
  );
}));
CharacterSpan.displayName = "CharacterSpan";

function App() {
  const { testMode, timeLimit, wordLimit, includePunctuation, includeNumbers, wordListType, isDictationEnabled, selectedVoiceURI, currentLanguage } = useAppContext();
  
  const { 
    textArray, isLoading, typedText, errors, 
    status, timeLeft, timeElapsed, history,
    handleKeyDown, forceFinish, resetTest 
  } = useEngine(testMode, includePunctuation, includeNumbers, wordListType, timeLimit, isDictationEnabled, wordLimit);
  
  const fullTextString = textArray.join(" ");
  const cursorRef = useRef(null);
  
  // Ref targeting our hidden mobile input layer
  const hiddenInputRef = useRef(null);

  const { isDictating, speechProgress, startDictation, stopDictation } = useDictation(() => forceFinish(), selectedVoiceURI);

  useEffect(() => {
    if (isDictationEnabled && status === 'running' && !isDictating && typedText.length === 1) startDictation(fullTextString);
  }, [status, isDictationEnabled, typedText.length, startDictation, fullTextString, isDictating]);

  useEffect(() => {
    if (!isDictationEnabled && isDictating) { stopDictation(); forceFinish(); }
  }, [isDictationEnabled, isDictating, stopDictation, forceFinish]);

  useEffect(() => {
    if (cursorRef.current && status === 'running') {
      cursorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [typedText, status]);

  // Keep desktop global listener working cleanly while ignoring keys when interacting with input elements
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (document.activeElement.tagName !== 'BUTTON' && document.activeElement.tagName !== 'SELECT' && document.activeElement.tagName !== 'INPUT') {
        handleKeyDown(e);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleKeyDown]);

  const handleRestart = () => { 
    stopDictation(); 
    resetTest(); 
    // Auto-focus the input again upon clicking restart
    setTimeout(() => hiddenInputRef.current?.focus(), 50);
  };

  const renderTextDisplay = () => {
    if (isLoading) return <span className="text-slate-300">Loading engine...</span>;
    const expectedChars = fullTextString.split('');
    const currentTypedSpaceCount = (typedText.match(/ /g) || []).length;
    
    const wordBlocks = [];
    let currentWordChars = [];
    let spaceCount = 0;

    expectedChars.forEach((char, index) => {
      const isTyped = index < typedText.length;
      const isCurrent = index === typedText.length;
      const isCorrect = isTyped && typedText[index] === char;
      const isRevealed = !isDictationEnabled || spaceCount < currentTypedSpaceCount;

      // Add the letter to our current word bucket
      currentWordChars.push(
        <CharacterSpan 
          key={index} char={char} isTyped={isTyped} isCurrent={isCurrent}
          isCorrect={isCorrect} isRevealed={isRevealed} ref={isCurrent ? cursorRef : null}
        />
      );

      // If the character is a space, or it's the very last letter, wrap up the Word Block
      if (char === ' ' || index === expectedChars.length - 1) {
        wordBlocks.push(
          <span key={`word-${spaceCount}`} className="inline-flex gap-x-[1px] mr-3 md:mr-4 mb-2">
            {currentWordChars}
          </span>
        );
        currentWordChars = []; // Empty the bucket for the next word
        if (char === ' ') spaceCount++;
      }
    });

    return wordBlocks;
  };

  // Focuses the invisible input field to force the mobile keyboard layout open
  const handleContainerClick = () => {
    if (status !== 'finished') {
      hiddenInputRef.current?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col items-center p-6">
      <div className="w-full max-w-5xl flex-1 flex flex-col">
        <Navbar /> 

        <main className="w-full flex-1 flex flex-col items-center justify-center mt-8 pb-12">
          
          {status === 'finished' ? (
            <Results 
              history={history} errors={errors} timeElapsed={timeElapsed} 
              testMode={testMode} currentLanguage={currentLanguage} onRestart={handleRestart}
            />
          ) : (
            <div className="w-full max-w-4xl bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-slate-200 space-y-8 relative">
              <div className="flex justify-between items-center text-sm font-semibold text-slate-500 uppercase tracking-wider">
                <div className="flex gap-6">
                  <span>Errors: <span className="text-red-500">{errors}</span></span>
                  <span>Time: <span className="text-slate-800">{testMode === 'time' ? timeLeft : timeElapsed}s</span></span>
                </div>
              </div>

              <div className="space-y-3 relative">
                <div className="flex justify-between items-center px-1">
                  <span className={`text-sm font-bold ${status === 'finished' ? 'text-green-600' : 'text-slate-400'}`}>
                    {status === 'idle' && (isDictationEnabled ? "Dictation Armed. Waiting for first keystroke..." : "Waiting for first keystroke...")}
                    {status === 'running' && "Typing in progress..."}
                  </span>
                  <button onClick={handleRestart} className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg">
                    Restart Test ↻
                  </button>
                </div>

                {isDictating && (
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1">
                    <div className="h-full bg-blue-500 transition-all duration-200 ease-linear" style={{ width: `${speechProgress}%` }} />
                  </div>
                )}

                {/* Mobile input elements to map virtual keystrokes smoothly */}
                <input
                  ref={hiddenInputRef}
                  type="text"
                  value={typedText}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    // Intercept and route deletions vs insertions cleanly into useEngine logic
                    if (newValue.length < typedText.length) {
                      handleKeyDown({ key: 'Backspace', ctrlKey: false });
                    } else if (newValue.length > typedText.length) {
                      const addedChar = newValue[newValue.length - 1];
                      handleKeyDown({ key: addedChar, preventDefault: () => {} });
                    }
                  }}
                  className="absolute opacity-0 pointer-events-none w-0 h-0"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />

                {/* Text Container with Word Wrap fix */}
                <div 
                  onClick={handleContainerClick}
                  className="bg-slate-50 border border-slate-100 p-8 rounded-xl text-[24px] md:text-[28px] leading-[1.6] tracking-wide font-mono break-words shadow-inner h-[250px] overflow-y-auto relative cursor-text select-none focus:outline-none flex flex-wrap content-start items-center"
                >
                  {renderTextDisplay()}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

export default App;