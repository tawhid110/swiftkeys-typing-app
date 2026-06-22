import { useState, useEffect, useCallback, useRef } from 'react';

// Formats the text to include punctuation and numbers
const formatTextArray = (rawArray, fullData, includePunctuation, includeNumbers) => {
  return rawArray.map((word) => {
    let newWord = word;
    if (includeNumbers && Math.random() < 0.2) {
      const randomNumIndex = Math.floor(Math.random() * fullData.numbers.length);
      newWord = fullData.numbers[randomNumIndex];
    }
    if (includePunctuation) {
      if (Math.random() < 0.2) {
        newWord = newWord.charAt(0).toUpperCase() + newWord.slice(1);
      }
      if (Math.random() < 0.3) {
        const puncIndex = Math.floor(Math.random() * fullData.punctuation.length);
        const punc = fullData.punctuation[puncIndex];
        if (punc === "()") newWord = `(${newWord})`;
        else if (punc === '"') newWord = `"${newWord}"`;
        else newWord = newWord + punc;
      }
    }
    return newWord;
  });
};

export const useEngine = (testMode, includePunctuation, includeNumbers, wordListType, timeLimit, isDictationEnabled, wordLimit) => {
  const [textArray, setTextArray] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typedText, setTypedText] = useState(""); 
  const [cursorIndex, setCursorIndex] = useState(0);
  const [errors, setErrors] = useState(0);

  const [status, setStatus] = useState('idle'); 
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [history, setHistory] = useState([]);

  // NEW REFS: These fix the timer resetting and handle the endless scrolling text
  const typedTextRef = useRef(typedText);
  const errorsRef = useRef(errors);
  const fullDataRef = useRef(null);
  const lastAppendTargetRef = useRef(0);

  // We update refs quietly so the timer doesn't restart on every keystroke
  useEffect(() => { typedTextRef.current = typedText; }, [typedText]);
  useEffect(() => { errorsRef.current = errors; }, [errors]);

  const initializeEngine = useCallback(async () => {
    setIsLoading(true);
    setStatus('idle');
    setTypedText("");
    setCursorIndex(0);
    setErrors(0);
    setTimeLeft(timeLimit);
    setTimeElapsed(0);
    setHistory([]);
    lastAppendTargetRef.current = 0; // Reset our endless scroll tracker

    try {
      const data = await import('../data/en-us.json');
      const fullData = data.default;
      fullDataRef.current = fullData; // Save data to ref for appending later
      let selectedData = [];
      
      if (isDictationEnabled) {
          const randomSentence = fullData.dictation_practice[Math.floor(Math.random() * fullData.dictation_practice.length)];
          selectedData = randomSentence.split(" ");
      } else if (wordListType === 'paragraphs') {
          // FIX 2: Prevent Lag by only loading 2 paragraphs initially!
          const count = testMode === 'time' ? 2 : 1;
          for(let i = 0; i < count; i++) {
              const rp = fullData.paragraphs[Math.floor(Math.random() * fullData.paragraphs.length)];
              selectedData.push(...rp.split(" "));
          }
      } else {
          const sourceList = wordListType === '1000' ? fullData.words_1000 : fullData.words_200;
          // FIX 2: Prevent Lag by only loading 50 words initially in Time Mode
          const count = testMode === 'time' ? 50 : (wordLimit || 50);
          
          let temp = [];
          for(let i = 0; i < count; i++) {
              temp.push(sourceList[Math.floor(Math.random() * sourceList.length)]);
          }
          selectedData = formatTextArray(temp, fullData, includePunctuation, includeNumbers);
      }
      
      setTextArray(selectedData);
    } catch (error) {
      console.error("Failed to load text data:", error);
      setTextArray(["hello", "world"]);
    } finally {
      setIsLoading(false);
    }
  }, [testMode, includePunctuation, includeNumbers, wordListType, timeLimit, isDictationEnabled, wordLimit]);

  useEffect(() => {
    initializeEngine();
  }, [initializeEngine]);

  // FIX 1: Timer Effect completely fixed so fast typing doesn't break the clock
  useEffect(() => {
    let interval;
    if (status === 'running') {
      interval = setInterval(() => {
        setTimeElapsed((prevElapsed) => {
          const newElapsed = prevElapsed + 1;
          const currentMinutes = newElapsed / 60;
          
          // Using our quiet refs so the math is accurate!
          const currentWpm = Math.round((typedTextRef.current.length / 5) / currentMinutes) || 0;

          setHistory((prevHistory) => [
            ...prevHistory,
            { second: newElapsed, wpm: currentWpm, errors: errorsRef.current }
          ]);

          return newElapsed;
        });

        if (testMode === 'time') {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              setStatus('finished');
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status, testMode]); // Notice how typedText and errors are missing from this array now!

  const handleKeyDown = useCallback((e) => {
    if (status === 'finished') return;
    if (e.key === ' ') { e.preventDefault(); }

    if (e.key === 'Backspace') {
      if (e.ctrlKey || e.altKey || e.metaKey) {
        const lastSpaceIndex = typedText.trimEnd().lastIndexOf(' ');
        const newLength = lastSpaceIndex === -1 ? 0 : lastSpaceIndex + 1;
        setTypedText(typedText.slice(0, newLength));
        setCursorIndex(newLength);
        return;
      }
      setTypedText((prev) => prev.slice(0, -1));
      setCursorIndex((prev) => Math.max(0, prev - 1));
      return;
    }

    if (e.key.length === 1) {
      if (status === 'idle') setStatus('running');
      
      const newTypedText = typedText + e.key;
      setTypedText(newTypedText);
      
      const expectedText = textArray.join(" ");
      const expectedChar = expectedText[cursorIndex];
      
      if (e.key !== expectedChar) {
        setErrors((prev) => prev + 1);
      }
      
      setCursorIndex((prev) => prev + 1);

      // FIX 2 (Continued): The "Endless Scroll" mechanism for Time Mode
      // If we get within 50 characters of the end, seamlessly append more text!
      if (testMode === 'time' && newTypedText.length >= expectedText.length - 50 && expectedText.length > lastAppendTargetRef.current) {
          lastAppendTargetRef.current = expectedText.length; // Lock it so it only triggers once per chunk
          const fullData = fullDataRef.current;
          
          if (fullData) {
              let extraData = [];
              if (wordListType === 'paragraphs') {
                  const rp = fullData.paragraphs[Math.floor(Math.random() * fullData.paragraphs.length)];
                  extraData = rp.split(" ");
              } else {
                  const sourceList = wordListType === '1000' ? fullData.words_1000 : fullData.words_200;
                  let temp = [];
                  for(let i = 0; i < 30; i++) temp.push(sourceList[Math.floor(Math.random() * sourceList.length)]);
                  extraData = formatTextArray(temp, fullData, includePunctuation, includeNumbers);
              }
              setTextArray((prev) => [...prev, ...extraData]);
          }
      }

      // Universal End Condition
      // (This will normally only trigger in Word mode, as Time mode keeps expanding!)
      if (newTypedText.length >= expectedText.length && testMode !== 'time') {
        setStatus('finished');
      }
    }
  }, [cursorIndex, textArray, status, typedText, testMode, wordListType, includePunctuation, includeNumbers]);

  const forceFinish = useCallback(() => setStatus('finished'), []);
  const resetTest = useCallback(() => initializeEngine(), [initializeEngine]);

  return { 
    textArray, isLoading, typedText, cursorIndex, errors, 
    status, timeLeft, timeElapsed, history,
    handleKeyDown, forceFinish, resetTest 
  };
};