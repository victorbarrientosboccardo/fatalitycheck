/* ════════════════════════════════════════════════════════
   FatalityCheck · app.js
   UI components, charts, navigation
   Version S537 · Invictum SPA · 2026
   ════════════════════════════════════════════════════════ */

'use strict';

// ── NAVIGATION ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Mark active nav link
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav ul a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) a.classList.add('active');
  });

  // Hamburger menu
  const ham = document.querySelector('.hamburger');
  const ul  = document.querySelector('nav ul');
  if (ham && ul) {
    ham.addEventListener('click', () => ul.classList.toggle('open'));
    document.addEventListener('click', e => {
      if (!e.target.closest('nav')) ul.classList.remove('open');
    });
  }
});

// ── BAR CHART HELPER ─────────────────────────────────
function renderBars(containerId, entries, opts = {}) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const max = Math.max(...entries.map(([,v]) => v));
  const colors = opts.colors || {};
  const defaultColor = opts.defaultColor || '#1F3864';
  el.innerHTML = entries.slice(0, opts.limit || 999).map(([k, v]) => {
    const pct = Math.max(Math.round(v / max * 100), 2);
    const c   = colors[k] || defaultColor;
    return `<div class="bar-row">
      <div class="bar-label" title="${k}">${k}</div>
      <div class="bar-track">
        <div class="bar-fill" style="width:${pct}%;background:${c}">${pct > 10 ? v : ''}</div>
      </div>
      <div class="bar-val">${v}</div>
    </div>`;
  }).join('');
}

// ── CHART.JS YEAR TREND ──────────────────────────────
function renderYearChart(canvasId, yearData) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !window.Chart) return;
  const labels = yearData.map(([y]) => y);
  const values = yearData.map(([, v]) => v);
  // Destroy existing
  if (canvas._chart) canvas._chart.destroy();
  canvas._chart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Fatalidades',
        data: values,
        backgroundColor: labels.map(y =>
          y >= 2010 ? 'rgba(31,56,100,0.85)' : 'rgba(176,141,87,0.75)'
        ),
        borderWidth: 0,
        borderRadius: 3,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y} fatalidades` } }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#edf2f7' },
          ticks: { font: { size: 11 } }
        },
        x: {
          grid: { display: false },
          ticks: {
            font: { size: 10 },
            maxRotation: 45,
            callback: (_, i) => i % 5 === 0 ? labels[i] : ''
          }
        }
      }
    }
  });
}

function renderTypeChart(canvasId, typeData) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !window.Chart) return;
  const top12 = typeData.slice(0, 12);
  if (canvas._chart) canvas._chart.destroy();
  canvas._chart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: top12.map(([k]) => k.length > 22 ? k.slice(0,22)+'…' : k),
      datasets: [{
        data: top12.map(([,v]) => v),
        backgroundColor: [
          '#1F3864','#B08D57','#2b6cb0','#276749','#e53e3e',
          '#6b46c1','#dd6b20','#319795','#d69e2e','#9b2c2c','#4a5568','#718096'
        ],
        borderWidth: 2, borderColor: '#fff'
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { font: { size: 11 }, boxWidth: 14 } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed} (${(ctx.parsed/1662*100).toFixed(1)}%)` } }
      }
    }
  });
}

function renderBiasChart(canvasId, biasData) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !window.Chart) return;
  const top10 = biasData.slice(0, 10);
  if (canvas._chart) canvas._chart.destroy();
  canvas._chart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: top10.map(([k]) => k),
      datasets: [{
        label: 'Casos',
        data: top10.map(([,v]) => v),
        backgroundColor: top10.map(([k]) => FC.BIAS_COLORS[k] || '#1F3864'),
        borderWidth: 0, borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: {
          label: ctx => ` ${ctx.parsed.x} casos (${(ctx.parsed.x/1662*100).toFixed(1)}%)`,
          afterLabel: ctx => `   ${FC.BIAS_DESC[top10[ctx.dataIndex]?.[0]] || ''}`
        }}
      },
      scales: {
        x: { beginAtZero: true, grid: { color: '#edf2f7' } },
        y: { grid: { display: false }, ticks: { font: { size: 12, weight: '600' } } }
      }
    }
  });
}

// ── TABLE RENDERER ────────────────────────────────────
function renderTable(tbody, records, onRowClick) {
  if (!tbody) return;
  if (records.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;color:#718096">No se encontraron registros.</td></tr>';
    return;
  }
  tbody.innerHTML = records.map(r => {
    const sClass = FC.SECTOR_BADGE[r.sector] || 'badge-mnm';
    const bKey = r.bias_primary?.split('-')[0]?.toLowerCase();
    const bClass = `badge-bias ${bKey}`;
    return `<tr onclick="openDetail('${r.id}')" style="cursor:pointer">
      <td><code style="font-size:.78rem">${r.id}</code></td>
      <td>${r.year}</td>
      <td>${r.date?.slice(0,10)||'—'}</td>
      <td><span class="badge-sector ${sClass}">${r.sector||'—'}</span></td>
      <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${r.type}">${r.type||'—'}</td>
      <td><strong>${r.state||'—'}</strong></td>
      <td>${r.age||'—'}</td>
      <td>${r.bias_primary ? `<span class="${bClass}">${r.bias_primary}</span>` : '—'}</td>
    </tr>`;
  }).join('');
}

// ── DETAIL MODAL ──────────────────────────────────────
function openDetail(id) {
  const r = FC.getRecord(id);
  if (!r) return;
  const modal = document.getElementById('modal');
  if (!modal) return;
  const bKey = r.bias_primary?.split('-')[0]?.toLowerCase();
  document.getElementById('modal-body').innerHTML = `
    <h2>⛏ ${r.id}</h2>
    <div class="detail-grid">
      <div class="detail-row"><div class="key">Fecha</div><div class="val">${r.date||'—'}</div></div>
      <div class="detail-row"><div class="key">Año</div><div class="val">${r.year||'—'}</div></div>
      <div class="detail-row"><div class="key">Sector</div><div class="val">${r.sector||'—'}</div></div>
      <div class="detail-row"><div class="key">Tipo de accidente</div><div class="val">${r.type||'—'}</div></div>
      <div class="detail-row full"><div class="key">Mina / Empresa</div><div class="val">${r.mine||'—'}</div></div>
      <div class="detail-row"><div class="key">Estado</div><div class="val">${r.state||'—'}</div></div>
      <div class="detail-row"><div class="key">Ocupación víctima</div><div class="val">${r.occupation||'—'}</div></div>
      <div class="detail-row"><div class="key">Edad</div><div class="val">${r.age ? r.age + ' años' : '—'}</div></div>
      <div class="detail-row"><div class="key">Turno</div><div class="val">${r.shift||'—'}</div></div>
      <div class="detail-row"><div class="key">Hora</div><div class="val">${r.hour||'N/D'}</div></div>
      <div class="detail-row full"><div class="key">Equipo involucrado</div><div class="val">${r.equipment||'—'}</div></div>
      <div class="detail-row"><div class="key">Mine ID (MSHA)</div><div class="val"><code>${r.mine_id||'N/D'}</code></div></div>
      <div class="detail-row">
        <div class="key">Sesgo cognitivo primario (MAP-v1)</div>
        <div class="val">${r.bias_primary ? `<span class="badge-bias ${bKey}" style="font-size:.82rem">${r.bias_primary}</span> ${FC.BIAS_DESC[r.bias_primary]||''}` : '—'}</div>
      </div>
      ${r.best_practice ? `<div class="detail-row full"><div class="key">Mejores prácticas MSHA</div><div class="val" style="font-size:.82rem;color:#4a5568">${r.best_practice}</div></div>` : ''}
    </div>
  `;
  modal.classList.add('open');
}

function closeModal() {
  const modal = document.getElementById('modal');
  if (modal) modal.classList.remove('open');
}

// Allow clicking overlay to close
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) closeModal();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ── PAGINATION RENDERER ───────────────────────────────
function renderPagination(containerId, currentPage, totalPages, onPage) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (totalPages <= 1) { el.innerHTML = ''; return; }
  const pages = [];
  if (currentPage > 1) pages.push(['«', currentPage - 1]);
  const start = Math.max(1, currentPage - 2);
  const end   = Math.min(totalPages, currentPage + 2);
  for (let i = start; i <= end; i++) pages.push([String(i), i]);
  if (currentPage < totalPages) pages.push(['»', currentPage + 1]);
  el.innerHTML = pages.map(([label, page]) =>
    `<button class="${page === currentPage ? 'active' : ''}" onclick="(${onPage.toString()})(${page})">${label}</button>`
  ).join('');
}

// ── STATS CARDS FILLER ────────────────────────────────
async function fillKPIs() {
  const { records, summary } = await FC.loadData().catch(() => ({ records: [], summary: {} }));
  const stats = FC.getStats();
  const byYear = FC.byYear();
  const latestYear = byYear[byYear.length - 1]?.[0];
  const latestCount = byYear[byYear.length - 1]?.[1];
  [
    ['kpi-total', FC.records?.length?.toLocaleString() || '1,654'],
    ['kpi-coverage', '99.7%'],
    ['kpi-pearson', 'r = 0.970'],
    ['kpi-age', stats.meanAge],
    ['kpi-year', latestYear || '2026'],
    ['kpi-latest', latestCount || '21'],
  ].forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  });
}
