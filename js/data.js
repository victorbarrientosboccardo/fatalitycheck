/* ════════════════════════════════════════════════════════
   FatalityCheck · data.js
   Data loading, caching, and query engine
   Version S537 · Invictum SPA · 2026
   ════════════════════════════════════════════════════════ */

const FC = (() => {
  let _records = null;
  let _summary = null;

  // ── LOAD ──────────────────────────────────────────────
  async function loadData() {
    if (_records) return { records: _records, summary: _summary };
    try {
      const [rRes, sRes] = await Promise.all([
        fetch('./data/corpus_v537.json'),
        fetch('./data/summary_v537.json')
      ]);
      const corpus = await rRes.json();
      _summary = await sRes.json();
      _records = corpus.records || corpus;
      console.log(`[FC] Corpus loaded: ${_records.length} records`);
      return { records: _records, summary: _summary };
    } catch (e) {
      console.error('[FC] Load error:', e);
      throw e;
    }
  }

  // ── QUERY ENGINE ────────────────────────────────────────
  function query(opts = {}) {
    let rs = _records || [];
    const { q, year, yearFrom, yearTo, sector, type, state, bias, shift, page = 1, pageSize = 50 } = opts;

    if (q && q.trim()) {
      const lq = q.toLowerCase();
      rs = rs.filter(r =>
        r.id?.toLowerCase().includes(lq) ||
        r.mine?.toLowerCase().includes(lq) ||
        r.occupation?.toLowerCase().includes(lq) ||
        r.type?.toLowerCase().includes(lq) ||
        r.state?.toLowerCase().includes(lq) ||
        r.equipment?.toLowerCase().includes(lq) ||
        r.bias_primary?.toLowerCase().includes(lq)
      );
    }
    if (year)    rs = rs.filter(r => r.year === +year);
    if (yearFrom) rs = rs.filter(r => r.year >= +yearFrom);
    if (yearTo)  rs = rs.filter(r => r.year <= +yearTo);
    if (sector && sector !== 'all') rs = rs.filter(r => r.sector?.includes(sector) || (sector === 'Coal' && r.sector === 'Coal') || (sector === 'MNM' && (r.sector === 'Metal/NonMetal' || r.sector === 'No Metal' || r.sector === 'Metal')));
    if (type && type !== 'all') rs = rs.filter(r => r.type?.toLowerCase().includes(type.toLowerCase()));
    if (state && state !== 'all') rs = rs.filter(r => r.state === state);
    if (bias && bias !== 'all') rs = rs.filter(r => r.bias_primary?.startsWith(bias));
    if (shift && shift !== 'all') rs = rs.filter(r => r.shift?.toLowerCase().includes(shift));

    const total = rs.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const data = rs.slice(start, start + pageSize);
    return { data, total, totalPages, page, pageSize };
  }

  // ── AGGREGATIONS ────────────────────────────────────────
  function count(field, records) {
    const rs = records || _records || [];
    const counts = {};
    rs.forEach(r => {
      const v = r[field] || 'N/D';
      counts[v] = (counts[v] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }

  function byYear(records) {
    const rs = records || _records || [];
    const counts = {};
    rs.forEach(r => { if (r.year >= 1995) counts[r.year] = (counts[r.year] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => +a[0] - +b[0]);
  }

  function getRecord(id) {
    return (_records || []).find(r => r.id === id);
  }

  function getStats() {
    const rs = _records || [];
    const ages = rs.map(r => r.age).filter(a => a && a >= 14 && a <= 90);
    return {
      total: rs.length,
      withAge: ages.length,
      meanAge: ages.length ? (ages.reduce((a,b) => a+b, 0) / ages.length).toFixed(1) : 'N/D',
      topState: count('state')[0]?.[0] || 'WV',
      topType: count('type')[0]?.[0] || 'Acarreo motorizado',
      topBias: count('bias_primary')[0]?.[0] || 'PERI-1',
      coalCount: rs.filter(r => r.sector === 'Coal').length,
      mnmCount: rs.filter(r => r.sector !== 'Coal').length,
    };
  }

  // ── EXPORT ─────────────────────────────────────────────
  function toCSV(records) {
    const fields = ['id','year','date','day','sector','type','state','occupation','age','shift','hour','equipment','bias_primary','bias_families'];
    const header = fields.join(',');
    const rows = records.map(r => fields.map(f => {
      const v = r[f] != null ? String(r[f]) : '';
      return v.includes(',') ? `"${v.replace(/"/g,'""')}"` : v;
    }).join(','));
    return [header, ...rows].join('\n');
  }

  function downloadCSV(records, filename = 'fatalitycheck_export.csv') {
    const blob = new Blob(['\uFEFF' + toCSV(records)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  // ── CONSTANTS ───────────────────────────────────────────
  const BIAS_COLORS = {
    'PERI-1':'#e53e3e','PERI-2':'#fc8181',
    'META-1':'#dd6b20','META-2':'#f6ad55',
    'NORM-1':'#d69e2e','NORM-2':'#f6e05e','NORM-3':'#b7791f',
    'CONF-1':'#276749','CONF-2':'#48bb78',
    'COMP-2':'#6b46c1','COMP-3':'#9f7aea',
    'DISP-1':'#9b2c2c','ATAJ-1':'#c05621',
  };
  const BIAS_DESC = {
    'PERI-1':'Proximidad normalizada al peligro',
    'META-1':'Falta de conciencia situacional',
    'NORM-1':'Condición conocida no corregida',
    'NORM-2':'Normalización de desviaciones',
    'NORM-3':'LOTO / bloqueo omitido',
    'CONF-1':'Sobreconfianza por experiencia',
    'CONF-2':'Sobreconfianza organizacional',
    'COMP-2':'Presión de tarea / tiempo',
    'COMP-3':'Prisa sistémica organizacional',
    'DISP-1':'Distracción contextual',
    'ATAJ-1':'Atajo cognitivo deliberado',
  };
  const SECTOR_BADGE = {
    'Coal': 'badge-coal',
    'Metal/NonMetal': 'badge-mnm',
    'No Metal': 'badge-mnm',
    'Metal': 'badge-metal',
    'Other': 'badge-mnm',
  };
  const COLORS = { NAVY:'#1F3864', GOLD:'#B08D57', GREEN:'#276749', RED:'#e53e3e', BLUE:'#2b6cb0' };

  return { loadData, query, count, byYear, getRecord, getStats, toCSV, downloadCSV, BIAS_COLORS, BIAS_DESC, SECTOR_BADGE, COLORS, get records() { return _records; }, get summary() { return _summary; } };
})();
