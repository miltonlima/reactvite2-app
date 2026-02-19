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
import App13 from './App13.jsx'

// Higher-order component para atribuir título personalizado por página.
const withTitle = (Component, title) => function Wrapped(props) {
  useEffect(() => {
    document.title = title
  }, [])
  return <Component {...props} />
}

const Home = withTitle(App, 'Currículo')
const Page2 = withTitle(App2, 'Página 2')
const Page3 = withTitle(App3, 'Vim da Api')
const Page4 = withTitle(App4, 'Comparar')
const Page5 = withTitle(App5, 'Soma')
const Page6 = withTitle(App6, 'Previsão do Tempo')
const Page7 = withTitle(App7, 'Loteria')
const Page8 = withTitle(App8, 'Formulário')
const Page9 = withTitle(App9, 'Página 9')
const Page10 = withTitle(App10, 'Novo Formulário')
const Page11 = withTitle(App11, 'Loteria')
const Page12 = withTitle(App12, 'Soma')
const Page13 = withTitle(App13, 'Página 13')


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
        <Route path="/page13" element={<Page13 />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
