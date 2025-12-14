import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import App2 from './App2.jsx'
import App3 from './App3.jsx'
import App4 from './App4.jsx'
import App5 from './App5.jsx'
import App6 from './App6.jsx'
import App7 from './App7.jsx'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/page2" element={<App2 />} />
        <Route path="/page3" element={<App3 />} />
        <Route path="/page4" element={<App4 />} />
        <Route path="/page5" element={<App5 />} />
        <Route path="/page6" element={<App6 />} />
        <Route path="/page7" element={<App7 />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
