import { useEffect, useMemo, useRef, useState } from 'react';
import type { Copy } from './content';

const TOTAL = 225;
const SOLD = [0, 46, 104, 168];            // viviendas vendidas al aprobar cada fase (ilustrativo)
const PRICE = [0, 0.8, 2.4, 3.1];          // % sobre objetivo por fase
const PACE_PRICE = [1.6, 0, -2.8];         // prudente / plan / acelerado
const PACE_MONTHS = [15, 11, 7.5];
const LEADS = [38, 164, 291, 412];
const MAXM = 16;

const curve = (t: number, m: number) => {
  const k = 7.5 / m;
  const f = (x: number) => 1 / (1 + Math.exp(-(x - m / 2) * k));
  return TOTAL * (f(t) - f(0)) / (f(m) - f(0));
};

export default function LiveApp({ t }: { t: Copy['app'] }) {
  const [phase, setPhase] = useState(1);
  const [pace, setPace] = useState(1);
  const [sold, setSold] = useState(SOLD[1]);
  const [feed, setFeed] = useState<{ id: number; time: string; text: string }[]>([]);
  const tick = useRef(0);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const stamp = () => new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const push = (text: string) =>
    setFeed((f) => [{ id: ++tick.current, time: stamp(), text }, ...f].slice(0, 5));

  /* las ventas se acercan despacio a la meta de la fase */
  useEffect(() => {
    const id = setInterval(() => {
      setSold((s) => {
        const goal = SOLD[phaseRef.current];
        if (s === goal) return s;
        return s + Math.sign(goal - s);
      });
    }, 70);
    return () => clearInterval(id);
  }, []);

  /* actividad en directo */
  useEffect(() => {
    const unit = () => `${t.unitWord} ${'AB'[tick.current % 2]}-${1 + ((tick.current * 7) % 9)}${'ABCD'[(tick.current * 3) % 4]}`;
    const emit = () => {
      const list = t.feed[phaseRef.current];
      const line = list[tick.current % list.length];
      push(/(Reserva|Reservation|Visita|Visit|Oferta|Offer)/.test(line) || tick.current % 2 ? `${line} · ${unit()}` : line);
    };
    emit();
    const id = setInterval(emit, 3200);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  const select = (i: number) => {
    setPhase(i);
    push(`${t.phases[i].name} · ${t.phases[i].aud}`);
  };
  const approve = () => {
    if (phase >= 3) return;
    const n = phase + 1;
    setPhase(n);
    push(`${t.approved} ${t.phases[n].name}`);
  };

  const m = PACE_MONTHS[pace];
  const delta = PRICE[phase] + PACE_PRICE[pace] * (phase === 0 ? 0 : 1);
  const remaining = Math.max(1, Math.round(m * (1 - sold / TOTAL)));
  const pct = Math.round((sold / TOTAL) * 100);
  const fmt = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n).toFixed(1).replace('.', ',') + ' %';

  /* gráfica */
  const W = 420, H = 235, PX = 8, PY = 10;
  const X = (x: number) => PX + (x / MAXM) * (W - PX * 2);
  const Y = (v: number) => H - PY - (v / TOTAL) * (H - PY * 2);
  const path = (mm: number) => {
    let d = '';
    for (let x = 0; x <= mm; x += 0.5) d += `${x === 0 ? 'M' : 'L'}${X(x).toFixed(1)},${Y(curve(x, mm)).toFixed(1)}`;
    return d;
  };
  const here = useMemo(() => {
    let best = 0, bd = 1e9;
    for (let x = 0; x <= m; x += 0.05) { const d = Math.abs(curve(x, m) - sold); if (d < bd) { bd = d; best = x; } }
    return best;
  }, [sold, m]);

  return (
    <div className="lapp" role="group" aria-label="Cobega Live">
      <div className="lapp-bar">
        <span className="lapp-brand"><i />Cobega Live</span>
        <span className="lapp-live"><i />{t.open}</span>
        <span className="lapp-demo">{t.demo}</span>
      </div>

      <div className="lapp-phases" role="tablist" aria-label={t.phaseLabel}>
        {t.phases.map((p, i) => (
          <button key={p.name} type="button" role="tab" aria-selected={i === phase}
            className={i === phase ? 'on' : i < phase ? 'past' : ''} onClick={() => select(i)}>
            <span className="n">F{i}</span>
            <b>{p.name}</b>
            <small>{p.aud}</small>
          </button>
        ))}
      </div>

      <div className="lapp-kpis">
        <div><small>{t.kpi.sold}</small><b>{sold}<em>/{TOTAL}</em></b><span className="bar"><i style={{ transform: `scaleX(${sold / TOTAL})` }} /></span><u>{pct} %</u></div>
        <div><small>{t.kpi.price}</small><b>{fmt(delta)}</b><u>{t.paces[pace]}</u></div>
        <div><small>{t.kpi.months}</small><b>{remaining}</b><u>{t.mo}</u></div>
        <div><small>{t.kpi.leads}</small><b>{LEADS[phase]}</b><u>{t.phases[phase].name}</u></div>
      </div>

      <div className="lapp-grid">
        <div className="lapp-chart">
          <p>{t.curve}<span><i className="k-plan" />{t.plan}<i className="k-fc" />{t.forecast}</span></p>
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t.curve}>
            {[0.25, 0.5, 0.75].map((g) => <line key={g} x1={PX} x2={W - PX} y1={Y(TOTAL * g)} y2={Y(TOTAL * g)} className="grid" />)}
            <path d={path(PACE_MONTHS[1])} className="plan" />
            <path d={path(m)} className="fc" />
            <line x1={X(here)} x2={X(here)} y1={Y(sold)} y2={H - PY} className="drop" />
            <circle cx={X(here)} cy={Y(sold)} r="4.5" className="dot" />
            <text x={X(here)} y={Math.max(12, Y(sold) - 10)} textAnchor={here > m * 0.7 ? 'end' : 'middle'} className="lbl">{t.today}</text>
          </svg>
        </div>

        <div className="lapp-ctl">
          <p>{t.paceLabel}</p>
          <div className="seg" role="group" aria-label={t.paceLabel}>
            {t.paces.map((p, i) => (
              <button key={p} type="button" className={i === pace ? 'on' : ''} aria-pressed={i === pace} onClick={() => setPace(i)}>{p}</button>
            ))}
          </div>
          <p className="gate">{t.gate}</p>
          <button type="button" className="approve" disabled={phase >= 3} onClick={approve}>
            {phase >= 3 ? t.approveLast : `${t.approve} → ${t.phases[Math.min(3, phase + 1)].name}`}
          </button>
        </div>

        <div className="lapp-feed" aria-live="off">
          <p>{t.feedTitle}</p>
          <ul>
            {feed.map((f) => <li key={f.id}><time>{f.time}</time><span>{f.text}</span></li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}
