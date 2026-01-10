import { useState } from 'react'
import { Link } from 'react-router-dom'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Menu from './components/Menu.jsx'

function App4() {
  const [resultado, setResultado] = useState(null)
  const [erro, setErro] = useState(null)
  const [carregando, setCarregando] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const primeiroValor = formData.get('primeiro') ?? ''
    const segundoValor = formData.get('segundo') ?? ''

    try {
      setCarregando(true)
      setErro(null)
      setResultado(null)

      const apiBase = import.meta.env.PROD
        ? 'https://aspnetcore2-api.onrender.com'
        : 'https://localhost:7006'

      const url = new URL('/comparar', apiBase)
      url.searchParams.set('primeiro', Number(primeiroValor))
      url.searchParams.set('segundo', Number(segundoValor))

      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error(`Erro ${response.status}`)
      }

      const data = await response.json()
      setResultado(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao comparar'
      setErro(message)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <>
      <Menu />
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Currículo</h1>
      <form className="card form-grid" onSubmit={handleSubmit}>
        <label>
          Primeiro
          <input type="number" name="primeiro" placeholder="Número 1" required />
        </label>
        <label>
          Segundo
          <input type="number" name="segundo" placeholder="Número 2" required />
        </label>
        
        <button type="submit" disabled={carregando}>
          {carregando ? 'Comparando...' : 'Comparar'}
        </button>

        {erro && <p className="error">Falha ao comparar: {erro}</p>}
        {resultado && (
          <div className="compare-result">
            <p>{resultado.mensagem}</p>
            {typeof resultado.maior !== 'undefined' && <p>Maior: {resultado.maior}</p>}
            {typeof resultado.menor !== 'undefined' && <p>Menor: {resultado.menor}</p>}
            {Array.isArray(resultado.valores) && (
              <p>Valores enviados: {resultado.valores.join(', ')}</p>
            )}
          </div>
        )}
      </form>
    </>
  )
}

export default App4
