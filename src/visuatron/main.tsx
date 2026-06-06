import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import { VisuatronApp } from './VisuatronApp';

document.documentElement.style.setProperty(
  '--bg-image',
  `url('${import.meta.env.BASE_URL}dammi70euro.png')`,
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <VisuatronApp />
  </StrictMode>,
);
