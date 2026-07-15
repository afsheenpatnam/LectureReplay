import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import SplashPage from './pages/SplashPage';
import UploadPage from './pages/UploadPage';
import LecturePage from './pages/LecturePage';

const SPLASH_DURATION = 2200;

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), SPLASH_DURATION);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) return <SplashPage duration={SPLASH_DURATION} />;

  return (
    <Routes>
      <Route path="/" element={<UploadPage />} />
      <Route path="/upload" element={<UploadPage />} />
      <Route path="/lecture/:id" element={<LecturePage />} />
    </Routes>
  );
}

export default App;
