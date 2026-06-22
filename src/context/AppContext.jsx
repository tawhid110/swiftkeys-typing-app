import { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en-US'); 
  const [testMode, setTestMode] = useState('time'); 
  const [timeLimit, setTimeLimit] = useState(60); 
  const [wordLimit, setWordLimit] = useState(50); 
  const [includePunctuation, setIncludePunctuation] = useState(false);
  const [includeNumbers, setIncludeNumbers] = useState(false);
  const [wordListType, setWordListType] = useState('200'); 
  
  // NEW: Dictation state variables
  const [isDictationEnabled, setIsDictationEnabled] = useState(false);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState("");

  const value = {
    currentLanguage, setCurrentLanguage,
    testMode, setTestMode,
    timeLimit, setTimeLimit,
    wordLimit, setWordLimit,
    includePunctuation, setIncludePunctuation,
    includeNumbers, setIncludeNumbers,
    wordListType, setWordListType,
    isDictationEnabled, setIsDictationEnabled,
    selectedVoiceURI, setSelectedVoiceURI
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};