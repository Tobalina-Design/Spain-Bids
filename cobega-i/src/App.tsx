import { useEffect, useRef, useState, useCallback } from 'react';
import { createEngine, type Engine } from './engine';
import LiveApp from './LiveApp';
import { SECTIONS, COPY, initialLang, saveLang, type Lang, type SectionId } from './content';

function useMadridTime(locale: string) {
  const [t, setT] = useState('');
  useEffect(() => {
    const fmt = () => {
      try {
        return new Intl.DateTimeFormat(locale, { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit' }).format(new Date());
      } catch {
        return '';
      }
    };
    setT(fmt());
    const id = setInterval(() => setT(fmt()), 15000);
    return () => clearInterval(id);
  }, [locale]);
  return t;
}

function makeNoise() {
  const c = document.createElement('canvas');
  c.width = c.height = 160;
  const g = c.getContext('2d');
  if (!g) return '';
  const img = g.createImageData(160, 160);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 20;
  }
  g.putImageData(img, 0, 0);
  return c.toDataURL('image/png');
}

const pad = (n: number) => String(n).padStart(2, '0');

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heroWordRef = useRef<HTMLDivElement>(null);
  const engine = useRef<Engine | null>(null);
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(0);
  const [section, setSection] = useState<SectionId>('inicio');
  const [exploded, setExploded] = useState(false);
  const [menu, setMenu] = useState(false);
  const [glError, setGlError] = useState(false);
  const [lang, setLangState] = useState<Lang>(initialLang);
  const C = COPY[lang];
  const { hero: HERO, activo: ACTIVO, propuesta: PROPUESTA, escenarios: ESCENARIOS, app: APP, ficha: FICHA, cierre: CIERRE, ui } = C;
  const time = useMadridTime(C.timeLocale);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    saveLang(l);
    try {
      const u = new URL(window.location.href);
      u.searchParams.set('lang', l);
      window.history.replaceState(null, '', u);
    } catch { /* sin historial */ }
  }, []);

  /* idioma del documento: lectores de pantalla, traducción automática y pestaña */
  useEffect(() => {
    document.documentElement.lang = C.htmlLang;
    document.title = C.docTitle;
  }, [C]);

  useEffect(() => {
    const n = makeNoise();
    if (n) document.documentElement.style.setProperty('--noise', `url(${n})`);
    const canvas = canvasRef.current;
    if (!canvas) return;
    let eng: Engine | null = null;
    const minShow = performance.now() + 1300;
    try {
      eng = createEngine(canvas, {
        onStep: setStep,
        onSection: setSection,
        onReady: () => {
          const wait = Math.max(0, minShow - performance.now());
          setTimeout(() => setReady(true), wait);
        },
      });
      engine.current = eng;
    } catch {
      setGlError(true);
      setReady(true);
    }
    /* el título grande del inicio se desvanece al bajar */
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const el = heroWordRef.current;
      if (!el) return;
      const p = Math.min(1, window.scrollY / (window.innerHeight * 0.75));
      el.style.opacity = String(1 - p);
      el.style.transform = `translate3d(0, ${(-p * 8).toFixed(2)}vh, 0)`;
    };
    raf = requestAnimationFrame(tick);
    const fallback = setTimeout(() => setReady(true), 3500);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(fallback);
      eng?.destroy();
      engine.current = null;
    };
  }, []);

  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('[data-reveal]');
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) e.target.classList.add('in'); }),
      { rootMargin: '0px 0px -12% 0px' },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    engine.current?.setExploded(exploded);
  }, [exploded]);

  useEffect(() => {
    if (menu) engine.current?.stop(); else engine.current?.resume();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menu]);

  const go = useCallback((id: string) => {
    setMenu(false);
    requestAnimationFrame(() => engine.current?.scrollTo(id));
  }, []);

  const secIndex = SECTIONS.findIndex((s) => s.id === section);
  const cur = PROPUESTA.steps[step];

  return (
    <>
      <div className={'loader' + (ready ? ' done' : '')} aria-hidden="true">
        <svg viewBox="0 0 700 700" className="loader-ring">
          <circle cx="350" cy="350" r="345" className="ring-bg" />
          <circle cx="350" cy="350" r="345" className="ring-fg" />
        </svg>
        <p className="loader-text"><span>{ui.loading}</span> Cobega I</p>
      </div>

      <div className="stage" aria-hidden="true">
        <div className="hero-word" ref={heroWordRef}>{HERO.title}</div>
        <canvas ref={canvasRef} className="gl" />
        {glError && <div className="gl-fallback">{ui.glFallback}</div>}
      </div>

      <div className="topfade" aria-hidden="true" />
      <div className="botfade" aria-hidden="true" />
      <header className="nav">
        <button type="button" className="brand" onClick={() => go('inicio')} aria-label={ui.backTop}>
          <b>Cobega I</b><span>{ui.brandSub}</span>
        </button>
        <nav className="nav-links" aria-label={ui.sectionsAria}>
          {SECTIONS.slice(1).map((s) => (
            <button key={s.id} type="button" className={section === s.id ? 'on' : ''} onClick={() => go(s.id)}>{C.sections[s.id]}</button>
          ))}
        </nav>
        <div className="nav-actions">
          <button type="button" className={'pill' + (exploded ? ' on' : '')} aria-pressed={exploded} onClick={() => setExploded((v) => !v)}>
            <span className="pill-dot" />{exploded ? ui.assemble : ui.explode}
          </button>
          <button type="button" className="menu-btn" aria-expanded={menu} aria-controls="menu" onClick={() => setMenu(true)}>{ui.index}</button>
          <div className="lang" role="group" aria-label={ui.langAria}>
            {(['es', 'en'] as Lang[]).map((l) => (
              <button key={l} type="button" lang={l} className={l === lang ? 'on' : ''} aria-pressed={l === lang} onClick={() => setLang(l)}>{l.toUpperCase()}</button>
            ))}
          </div>
        </div>
      </header>

      <div id="menu" className={'menu' + (menu ? ' open' : '')} role="dialog" aria-modal="true" aria-label={ui.index} hidden={!menu}>
        <button type="button" className="menu-close" onClick={() => setMenu(false)}>{ui.close}</button>
        <ol>
          {SECTIONS.map((s, i) => (
            <li key={s.id}>
              <button type="button" onClick={() => go(s.id)}><span>{pad(i)}</span>{C.sections[s.id]}</button>
            </li>
          ))}
        </ol>
      </div>

      <div className="hud" aria-hidden="true">
        <span className="hud-n">{pad(secIndex)} / {pad(SECTIONS.length - 1)}</span>
        <span className="hud-bar"><i style={{ transform: `scaleX(${secIndex / (SECTIONS.length - 1)})` }} /></span>
        <span>{SECTIONS[secIndex] ? C.sections[SECTIONS[secIndex].id] : ''}</span>
      </div>
      <div className="clock" aria-hidden="true">{ui.clockCity} <b>{time}</b></div>

      <main>
        <section id="inicio" className="sec hero">
          <div className="hero-inner">
            <p className="eyebrow">{HERO.eyebrow}</p>
            <h1 className="sr-only">{HERO.title}</h1>
            <p className="hero-lead">{HERO.lead}</p>
            <button type="button" className="scroll-cue" onClick={() => go('activo')}>
              <span>{ui.cue}</span><i />
            </button>
          </div>
        </section>

        <section id="activo" className="sec side-r">
          <div className="panel" data-reveal>
            <p className="eyebrow">{ACTIVO.eyebrow}</p>
            <h2>{ACTIVO.title}</h2>
            {ACTIVO.body.map((p, i) => <p key={i} className="body">{p}</p>)}
            <dl className="facts">
              {ACTIVO.facts.map((f) => (
                <div key={f.k}><dt>{f.k}</dt><dd>{f.v}</dd></div>
              ))}
            </dl>
          </div>
        </section>

        <section id="propuesta" className="sec-sticky">
          <div className="sticky">
            <div className="prop">
              <p className="eyebrow">{PROPUESTA.eyebrow}</p>
              <h2 className="prop-title">{PROPUESTA.title}</h2>
              <ol className="steps">
                {PROPUESTA.steps.map((s, i) => (
                  <li key={s.name} className={i === step ? 'on' : i < step ? 'past' : ''}>
                    <button type="button" onClick={() => engine.current?.scrollToStep(i)} aria-current={i === step ? 'step' : undefined}>
                      <span className="n">{pad(i + 1)}</span>
                      <span className="nm">{s.name}</span>
                    </button>
                    <div className="step-body">
                      <div>
                        <h3>{s.title}</h3>
                        <p>{s.body}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="prop-mobile" aria-live="polite">
                <p className="pm-count"><b>{pad(step + 1)}</b> / 06 · {cur.name}</p>
                <h3 key={'t' + step}>{cur.title}</h3>
                <p key={'b' + step} className="pm-body">{cur.body}</p>
                <div className="pm-dots">
                  {PROPUESTA.steps.map((s, i) => (
                    <button key={s.name} type="button" className={i === step ? 'on' : ''} aria-label={`${ui.goTo} ${s.name}`} onClick={() => engine.current?.scrollToStep(i)} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="escenarios" className="sec side-r">
          <div className="panel" data-reveal>
            <p className="eyebrow">{ESCENARIOS.eyebrow}</p>
            <h2>{ESCENARIOS.title}</h2>
            <p className="body">{ESCENARIOS.body}</p>
            <ul className="scen">
              {ESCENARIOS.items.map((it, i) => (
                <li key={it.k}><span className="n">{pad(i + 1)}</span><div><b>{it.k}</b><p>{it.v}</p></div></li>
              ))}
            </ul>
            <p className="note">{ESCENARIOS.note}</p>
          </div>
        </section>

        <section id="app" className="sec app-sec">
          <div className="app-wrap" data-reveal>
            <div className="app-head">
              <p className="eyebrow">{APP.eyebrow}</p>
              <h2>{APP.title}</h2>
              <p className="body">{APP.lead}</p>
            </div>
            <LiveApp t={APP} />
          </div>
        </section>

        <section id="ficha" className="sec side-l">
          <div className="panel wide" data-reveal>
            <p className="eyebrow">{FICHA.eyebrow}</p>
            <h2>{FICHA.title}</h2>
            <dl className="ledger">
              {FICHA.rows.map((r) => (
                <div key={r.k}><dt>{r.k}</dt><dd>{r.v}</dd></div>
              ))}
            </dl>
          </div>
        </section>

        <section id="cierre" className="sec side-l closing">
          <div className="panel" data-reveal>
            <p className="eyebrow">{CIERRE.eyebrow}</p>
            <h2 className="big">{CIERRE.title}</h2>
            <p className="line">{CIERRE.line}</p>
            <div className="end">
              <button type="button" className="pill solid" onClick={() => go('inicio')}>{ui.start}</button>
              <p className="foot">{CIERRE.foot}</p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
