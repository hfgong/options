(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);

  // Standard normal CDF via erf (Abramowitz & Stegun 7.1.26, |error| < 1.5e-7).
  function erf(x) {
    const s = Math.sign(x);
    const a = Math.abs(x);
    const t = 1 / (1 + 0.3275911 * a);
    const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a);
    return s * y;
  }
  const N = (x) => 0.5 * (1 + erf(x / Math.SQRT2));
  const phi = (x) => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);

  // Black–Scholes–Merton with continuous dividend yield q.
  function bsm(S, K, T, r, v, q) {
    const sT = Math.sqrt(T);
    const d1 = (Math.log(S / K) + (r - q + v * v / 2) * T) / (v * sT);
    const d2 = d1 - v * sT;
    const dq = Math.exp(-q * T);
    const dr = Math.exp(-r * T);
    const call = S * dq * N(d1) - K * dr * N(d2);
    const put = K * dr * N(-d2) - S * dq * N(-d1);
    const gamma = dq * phi(d1) / (S * v * sT);
    const vega = S * dq * phi(d1) * sT;
    const thetaCommon = -S * dq * phi(d1) * v / (2 * sT);
    return {
      d1, d2, call, put,
      delta: [dq * N(d1), dq * (N(d1) - 1)],
      gamma: [gamma, gamma],
      vega: [vega / 100, vega / 100],
      theta: [
        (thetaCommon - r * K * dr * N(d2) + q * S * dq * N(d1)) / 365,
        (thetaCommon + r * K * dr * N(-d2) - q * S * dq * N(-d1)) / 365
      ],
      rho: [K * T * dr * N(d2) / 100, -K * T * dr * N(-d2) / 100],
      parity: [call - put, S * dq - K * dr]
    };
  }

  const fmt = (x, d = 4) => (Number.isFinite(x) ? x.toFixed(d) : '–');
  const num = (id) => parseFloat($(id).value);

  function updateBS() {
    const S = num('inS'), K = num('inK'), days = num('inT');
    const r = num('inR') / 100, v = num('inV') / 100, q = (num('inQ') || 0) / 100;
    const ids = ['outC', 'outP', 'outD1', 'outD2', 'gDc', 'gDp', 'gGc', 'gGp', 'gVc', 'gVp', 'gTc', 'gTp', 'gRc', 'gRp'];
    if (!(S > 0 && K > 0 && days > 0 && v > 0) || !Number.isFinite(r)) {
      ids.forEach((id) => { $(id).textContent = '–'; });
      $('outParity').textContent = 'Enter positive spot, strike, days and volatility.';
      $('greeksUsing').textContent = 'Enter valid inputs in the Black–Scholes tab to see the numbers.';
      return;
    }
    const g = bsm(S, K, days / 365, r, v, q);
    $('outC').textContent = fmt(g.call);
    $('outP').textContent = fmt(g.put);
    $('outD1').textContent = fmt(g.d1);
    $('outD2').textContent = fmt(g.d2);
    [['gD', g.delta, 4], ['gG', g.gamma, 5], ['gV', g.vega, 4], ['gT', g.theta, 4], ['gR', g.rho, 4]].forEach(([p, [c, pv], d]) => {
      $(p + 'c').textContent = fmt(c, d);
      $(p + 'p').textContent = fmt(pv, d);
    });
    $('greeksUsing').innerHTML = `Using <i>S</i> = ${S}, <i>K</i> = ${K}, ${days} days, <i>r</i> = ${num('inR')}%, <i>σ</i> = ${num('inV')}%, <i>q</i> = ${num('inQ') || 0}% · <button type="button" data-goto="black-scholes">change in Black–Scholes</button>`;
    const [lhs, rhs] = g.parity;
    const ok = Math.abs(lhs - rhs) < 1e-6;
    $('outParity').innerHTML = `Parity check: C − P = <b>${fmt(lhs)}</b>, S·e<sup>−qT</sup> − K·e<sup>−rT</sup> = <b>${fmt(rhs)}</b>${ok ? ' ✓' : ''}`;
  }

  function updateVix() {
    const vix = num('inVix'), spx = num('inSpx');
    const out = (pct) => {
      if (!(pct > 0)) return '–';
      const pts = spx > 0 ? ` (±${Math.round(spx * pct / 100).toLocaleString()})` : '';
      return `±${pct.toFixed(2)}%${pts}`;
    };
    $('outDay').textContent = out(vix / Math.sqrt(252));
    $('outMonth').textContent = out(vix / Math.sqrt(12));
    $('outYear').textContent = out(vix);
  }

  // Put/call ratio, with a rough equity-only sentiment reading.
  function updatePcr() {
    const pv = num('inPutVol'), cv = num('inCallVol'), po = num('inPutOI'), co = num('inCallOI');
    const vol = pv >= 0 && cv > 0 ? pv / cv : NaN;
    const oi = po >= 0 && co > 0 ? po / co : NaN;
    $('outPcrVol').textContent = fmt(vol, 2);
    $('outPutShare').textContent = Number.isFinite(vol) ? `${(100 * vol / (1 + vol)).toFixed(1)}%` : '–';
    $('outPcrOI').textContent = fmt(oi, 2);
    let read = 'Enter put and call volume (call volume above zero).';
    if (Number.isFinite(vol)) {
      if (vol < 0.5) read = 'Volume P/C below 0.5: traders lean heavily to calls, a sign of <b>complacency</b> (contrarian caution).';
      else if (vol < 0.8) read = 'Volume P/C in the usual 0.5–0.8 band for equities: <b>no extreme</b>.';
      else if (vol < 1) read = 'Volume P/C 0.8–1.0: <b>more defensive</b> than usual.';
      else read = 'Volume P/C at or above 1.0: puts outnumber calls, a sign of <b>fear</b> (contrarian support).';
    }
    $('outPcrRead').innerHTML = read;
  }

  // ---- Tabs: one topic at a time; the URL hash (#parity, #black-scholes, #greeks, #vix, #pcr) selects one ----
  const tabs = [...document.querySelectorAll('.tab')];
  const TAB_KEY = 'options-cheatsheet:tab';

  function selectTab(id, { focus = false, updateHash = true } = {}) {
    const tab = tabs.find((t) => t.dataset.panel === id) || tabs[0];
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      $(t.dataset.panel).hidden = !on;
    });
    if (focus) tab.focus();
    if (updateHash && location.hash !== '#' + tab.dataset.panel) history.replaceState(null, '', '#' + tab.dataset.panel);
    try { localStorage.setItem(TAB_KEY, tab.dataset.panel); } catch (e) {}
  }

  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(t.dataset.panel));
    t.addEventListener('keydown', (e) => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (step) {
        e.preventDefault();
        selectTab(tabs[(i + step + tabs.length) % tabs.length].dataset.panel, { focus: true });
      } else if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault();
        selectTab(tabs[e.key === 'Home' ? 0 : tabs.length - 1].dataset.panel, { focus: true });
      }
    });
  });
  document.addEventListener('click', (e) => {
    const go = e.target.closest('[data-goto]');
    if (go) selectTab(go.dataset.goto);
  });
  window.addEventListener('hashchange', () => selectTab(location.hash.slice(1), { updateHash: false }));

  let initial = location.hash.slice(1);
  if (!tabs.some((t) => t.dataset.panel === initial)) {
    try { initial = localStorage.getItem(TAB_KEY) || 'parity'; } catch (e) { initial = 'parity'; }
  }
  selectTab(initial, { updateHash: !!location.hash });

  ['inS', 'inK', 'inT', 'inR', 'inV', 'inQ'].forEach((id) => $(id).addEventListener('input', updateBS));
  ['inVix', 'inSpx'].forEach((id) => $(id).addEventListener('input', updateVix));
  ['inPutVol', 'inCallVol', 'inPutOI', 'inCallOI'].forEach((id) => $(id).addEventListener('input', updatePcr));
  updateBS();
  updateVix();
  updatePcr();
})();

if ('serviceWorker' in navigator) {
  // Reload once when an updated service worker takes over (not on first install).
  if (navigator.serviceWorker.controller) {
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!reloaded) {
        reloaded = true;
        location.reload();
      }
    });
  }
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
