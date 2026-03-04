import {StrictMode, useState} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import BirthdaySplash from './BirthdaySplash.tsx';
import './index.css';

function Root() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <BirthdaySplash onStartCreating={() => setShowSplash(false)} />;
  }

  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
