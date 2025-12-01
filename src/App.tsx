import React, { useState } from 'react';
import WelcomeModal from './components/WelcomeModal';
import FreeMode from './components/FreeMode';
import SimulationMode from './components/SimulationMode';
import './App.css';

type AppMode = 'welcome' | 'free' | 'simulation';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('welcome');

  const handleSelectMode = (selectedMode: 'free' | 'simulation') => {
    setMode(selectedMode);
  };

  return (
    <>
      {mode === 'welcome' && <WelcomeModal onSelectMode={handleSelectMode} />}
      {mode === 'free' && <FreeMode />}
      {mode === 'simulation' && <SimulationMode />}
    </>
  );
};

export default App;
