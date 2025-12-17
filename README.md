# React + Vite

## English

### Overview
React + Vite single-page application with hot-module replacement, simple routing and sample API integration against an ASP.NET Core backend.

### Requirements
- Node.js 18+ (`node -v`)
- npm 9+ (bundled with Node)
- Backend available at https://aspnetcore2-api.onrender.com (or local https://localhost:7006)

### Local Development
```bash
npm install
npm run dev
```
Open http://localhost:5173 and keep the backend running (`dotnet run --launch-profile https`).

### Useful Scripts
- `npm run dev` start dev server with HMR.
- `npm run build` output production files to `dist/`.
- `npm run preview` serve the built app for final checks.

### Configuration
- Create `.env` or `.env.local` with `VITE_API_URL` to point to the desired backend.
- Update navigation/routes under `src/` as the app grows.

### Troubleshooting
- Delete `node_modules` and reinstall if dependencies break.
- Change the port via `npm run dev -- --port 3000` when 5173 is busy.
- Run `npm run build` before deployment to Pages/hosting providers.

### Deployment
- Backend Swagger: https://aspnetcore2-api.onrender.com/swagger/index.html (must be online first).
- Frontend build: https://reactvite2-app.pages.dev/

---

## Português

### Visão Geral
Aplicação React criada com Vite, roteamento simples e integração de exemplo com um backend ASP.NET Core.

### Requisitos
- Node.js 18+ (`node -v`)
- npm 9+ (vem com o Node)
- Backend disponível em https://aspnetcore2-api.onrender.com (ou local https://localhost:7006)

### Desenvolvimento Local
```bash
npm install
npm run dev
```
Abra http://localhost:5173 e mantenha a API executando (`dotnet run --launch-profile https`).

### Scripts Principais
- `npm run dev` inicia o servidor com HMR.
- `npm run build` gera o bundle final em `dist/`.
- `npm run preview` faz o teste do build em ambiente local.

### Configuração
- Crie `.env` ou `.env.local` definindo `VITE_API_URL` para apontar o backend desejado.
- Ajuste navegação/rotas em `src/` conforme novas páginas forem adicionadas.

### Solução de Problemas
- Remova `node_modules` e reinstale caso ocorram erros de dependência.
- Altere a porta com `npm run dev -- --port 3000` se 5173 estiver ocupada.
- Execute `npm run build` antes de publicar em Pages ou qualquer hosting.

### Implantação
- Swagger do backend: https://aspnetcore2-api.onrender.com/swagger/index.html (ligue primeiro).
- Build em produção: https://reactvite2-app.pages.dev/


