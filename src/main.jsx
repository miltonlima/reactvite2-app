import { StrictMode, useEffect } from 'react'
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
import App8 from './App8.jsx'
import App9 from './App9.jsx'
import App10 from './App10.jsx'
import App11 from './App11.jsx'
import App12 from './App12.jsx'

// Higher-order component para atribuir título personalizado por página.
const withTitle = (Component, title) => function Wrapped(props) {
  useEffect(() => {
    document.title = title
  }, [])
  return <Component {...props} />
}

const Home = withTitle(App, 'Currículo')
const Page2 = withTitle(App2, 'Página 2')
const Page3 = withTitle(App3, 'Página 3')
const Page4 = withTitle(App4, 'Página 4')
const Page5 = withTitle(App5, 'Página 5')
const Page6 = withTitle(App6, 'Página 6')
const Page7 = withTitle(App7, 'Página 7')
const Page8 = withTitle(App8, 'Página 8')
const Page9 = withTitle(App9, 'Página 9')
const Page10 = withTitle(App10, 'Página 10')
const Page11 = withTitle(App11, 'Página 11')
const Page12 = withTitle(App12, 'Página 12')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/page2" element={<Page2 />} />
        <Route path="/page3" element={<Page3 />} />
        <Route path="/page4" element={<Page4 />} />
        <Route path="/page5" element={<Page5 />} />
        <Route path="/page6" element={<Page6 />} />
        <Route path="/page7" element={<Page7 />} />
        <Route path="/page8" element={<Page8 />} />
        <Route path="/page9" element={<Page9 />} />
        <Route path="/page10" element={<Page10 />} />
        <Route path="/page11" element={<Page11 />} />
        <Route path="/page12" element={<Page12 />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
