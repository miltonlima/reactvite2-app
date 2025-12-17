import { useState } from 'react'
import { Link } from 'react-router-dom'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App3() {
  const [count, setCount] = useState(0)

  return (
    <>
      <nav className="menu">
        <Link to="/">Page 1</Link>
        <Link to="/page2">Page 2</Link>
        <Link to="/page3">Page 3</Link>
        <Link to="/page4">Page 4</Link>
      </nav>
      <nav className="menu">       
        <Link to="/page5">Page 5</Link>
        <Link to="/page6">Page 6</Link>
        <Link to="/page7">Page 7</Link>
        <Link to="/page8">Page 8</Link>
      </nav>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Comparar</h1>
      <form className="card form-grid">
        <label>
          Primeiro
          <input type="text" name="primeiro" placeholder="Número 1" required />
        </label>
        <label>
          Segundo
          <input type="text" name="segundo" placeholder="Número 2" required />
        </label>
        
        <button type="submit">Enviar</button>
      </form>
    </>
  )
}

export default App3
