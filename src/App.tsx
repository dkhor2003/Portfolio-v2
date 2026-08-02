import { Routes, Route } from 'react-router-dom';
import Nav from './components/Nav';
import CustomCursor from './components/CustomCursor';
import Home from './pages/Home';
import LatteArt from './pages/LatteArt';

export default function App() {
  return (
    <div className="bg-ink text-white font-body min-h-screen relative overflow-x-hidden">
      <CustomCursor />
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/latte-art" element={<LatteArt />} />
      </Routes>
    </div>
  );
}
