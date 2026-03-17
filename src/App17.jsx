

// ... (definições de StatCard e ChartPlaceholder permanecem as mesmas) ...

// Pequeno componente reutilizável de cartão de estatística exibido no cabeçalho do dashboard.
function StatCard({ title, value, diff }) {
  return (
    <div className="stat-card">
      <div className="title">{title}</div>
      <div className="value">{value}</div>
      {diff !== undefined && (
        <div className={`diff ${diff >= 0 ? 'positive' : 'negative'}`}>
          {diff >= 0 ? '▲' : '▼'} {Math.abs(diff)}%
        </div>
      )}
    </div>
  );
}

// Gráfico de barras simples em SVG para visualização rápida de dados.
function ChartPlaceholder({ width = '100%', height = 160 }) {
  const bars = [50, 60, 70, 80, 90, 100, 110, 120, 130, 140];
  const max = Math.max(...bars);
  return (
    <div className="chart-placeholder">
      <svg
        viewBox={`0 0 ${bars.length * 20} ${max}`}
        width={width}
        height={height}
        preserveAspectRatio="none"
      >
        {bars.map((b, i) => (
          <rect key={i} x={i * 20 + 6} y={max - b} width={5} height={b} fill="#4f46e5" rx={3} />
        ))}
      </svg>
    </div>
  );
}

function App17() {
  const recent = [
    { id: 1, user: 'Ana Silva', action: 'login', when: '10:12' },
    { id: 2, user: 'Carlos Souza', action: 'inscrição', when: '09:48' },
    { id: 3, user: 'Mariana', action: 'redefinição de senha', when: '08:30' }
  ];

  return (
    <>
      <div style={{ padding: '20px' }}>
        {/* ... (resto do conteúdo do dashboard permanece o mesmo) ... */}
        <div className="dashboard-stats">
            <div className="card primary">
              <div>Alunos</div>
              <div className="card-value">628</div>
            </div>
            <div className="card-metric">
              <div>Modalidades</div>
              <div className="card-value">2434</div>
            </div>
            <div className="card-metric">
              <div>Turmas</div>
              <div className="card-value">1259</div>
            </div>
            <div className="card-metric">
              <div>Avaliações</div>
              <div className="card-value">8,5</div>
            </div>
          </div>

          <div className="dashboard-graphs">
            <div className="graph">
              <h3>Faturamento Mensal</h3>
              <ChartPlaceholder />
            </div>
          </div>

          <div className="dashboard-activity-full">
            <h3>Atividade Recente</h3>
            <ul>
              {recent.map(r => (
                <li key={r.id}>
                  <div className="user-name">{r.user}</div>
                  <div className="user-action">{r.action} · {r.when}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
    </>
  );
}

export default App17;
