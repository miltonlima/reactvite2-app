import { useState } from 'react'
import { Link } from 'react-router-dom'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Menu from './components/Menu.jsx'

function App9() {
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
      <div className="card">
        <h1>MILTON LIMA</h1>
        <h2>Desenvolvedor .NET / Full Stack</h2>
        <p>Rio de Janeiro – RJ | Brasil<br />
        (21) 98108-8865<br />
        milton.mlima@gmail.com<br />
        LinkedIn: <a href="https://linkedin.com/in/milton-lima-227739148" target="_blank">linkedin.com/in/milton-lima-227739148</a><br />
        GitHub: <a href="https://github.com/miltonlima" target="_blank">github.com/miltonlima</a></p>

        <h3>RESUMO PROFISSIONAL</h3>
        <p>Desenvolvedor .NET com experiência em C#, ASP.NET Core e APIs REST, atuando no desenvolvimento, integração e sustentação de sistemas corporativos. Vivência com arquitetura BFF, integração de sistemas acadêmicos e desenvolvimento de interfaces web utilizando HTML, CSS e JavaScript. Experiência em ambientes de maior criticidade, com atenção à qualidade, manutenção evolutiva e adoção de boas práticas de desenvolvimento.</p>

        <h3>COMPETÊNCIAS TÉCNICAS</h3>
        <h4>Back-end (.NET)</h4>
        <ul>
          <li>C#</li>
          <li>ASP.NET Core</li>
          <li>APIs REST</li>
          <li>Arquitetura BFF (Backend for Frontend)</li>
          <li>Integração entre sistemas</li>
          <li>Manutenção e refatoração de sistemas legados</li>
        </ul>
        <h4>Front-end</h4>
        <ul>
          <li>HTML5</li>
          <li>CSS3</li>
          <li>JavaScript (ES6+)</li>
          <li>React.js (Vite) – conhecimento aplicado em projetos</li>
        </ul>
        <h4>Banco de Dados</h4>
        <ul>
          <li>SQL Server</li>
          <li>Oracle</li>
          <li>MySQL</li>
        </ul>
        <h4>Ferramentas e Ambiente</h4>
        <ul>
          <li>Git / GitHub</li>
          <li>Docker</li>
          <li>Metodologias Ágeis (Scrum)</li>
        </ul>

        <h3>EXPERIÊNCIA PROFISSIONAL</h3>
        <h4>SESC RJ – Serviço Social do Comércio</h4>
        <p><strong>Analista de Sistemas Sênior (.NET) | 2021 – 2025</strong></p>
        <ul>
          <li>Desenvolvimento e manutenção de sistemas web corporativos em ASP.NET Core</li>
          <li>Criação e evolução de APIs REST para integração com sistemas internos e externos</li>
          <li>Implementação de BFF para consumo por aplicações front-end</li>
          <li>Sustentação e melhoria contínua de sistemas críticos</li>
          <li>Atuação em times ágeis utilizando Scrum</li>
          <li>Integração com bases de dados relacionais (SQL Server e Oracle)</li>
        </ul>

        <h4>SENAC RJ – Serviço Nacional de Aprendizagem Comercial</h4>
        <p><strong>Analista de Sistemas Sênior – EAD | 2012 – 2018</strong></p>
        <ul>
          <li>Desenvolvimento de sistemas web educacionais</li>
          <li>Integração de plataformas acadêmicas e sistemas corporativos</li>
          <li>Criação de relatórios e rotinas automatizadas</li>
          <li>Administração e customização de LMS Moodle</li>
          <li>Atuação em projetos de médio e grande porte</li>
        </ul>

        <h4>Universidade Estácio de Sá</h4>
        <p><strong>Analista de Sistemas Pleno – EAD | 2008 – 2012</strong></p>
        <ul>
          <li>Desenvolvimento e manutenção de sistemas acadêmicos web</li>
          <li>Integração de dados de alunos, cursos e turmas</li>
          <li>Suporte técnico e manutenção evolutiva de plataformas educacionais</li>
        </ul>

        <h3>FORMAÇÃO ACADÊMICA</h3>
        <p><strong>Bacharelado e Licenciatura em Análise de Sistemas</strong><br />
        Universidade Estácio de Sá — Conclusão: 2008</p>

        <h3>PROJETOS E PORTFÓLIO</h3>
        <ul>
          <li>GitHub: <a href="https://github.com/miltonlima" target="_blank">https://github.com/miltonlima</a></li>
          <li>GitHub: <a href="https://github.com/miltonlima/curriculo" target="_blank">https://github.com/miltonlima/curriculo</a></li>
          <li>GitHub: <a href="https://github.com/miltonlima/aspnetcore2-api" target="_blank">https://github.com/miltonlima/aspnetcore2-api</a></li>
          <li>GitHub: <a href="https://github.com/miltonlima/reactvite2-app" target="_blank">https://github.com/miltonlima/reactvite2-app</a></li>
          <li><a href="https://zinloja.com.br" target="_blank">https://zinloja.com.br</a></li>
          <li><a href="https://armazemdaval.com" target="_blank">https://armazemdaval.com</a></li>
          <li><a href="http://escadaartedesign.com.br" target="_blank">http://escadaartedesign.com.br</a></li>
          <li><a href="https://jowburger.com.br" target="_blank">https://jowburger.com.br</a></li>
        </ul>
      </div>
    </>
  )
}

export default App9
