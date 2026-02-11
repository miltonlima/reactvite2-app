import { useState } from 'react'
import { Link } from 'react-router-dom'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Menu from './components/Menu.jsx'

function App2() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Menu />
      
      <div>
        <p>1. Currículo</p>
        <p>2. Lista</p>
        <p>3. Mensagem da API</p>
        <p>4. Comparar</p>
        <p>5. Soma</p>
        <p>6. Painel de Previsão do Tempo</p>
        <p>7. Loteria</p>
        <p>8. Formulário</p>
        <p>9. Novo Formulário</p>
        <p>10. Vite + React</p>
        <p>11. Banco de Dados</p>
        <p>12. Loteria</p>
      </div>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>


    </>
  )
}

export default App2
