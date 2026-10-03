# Option Formulas Cheatsheet

A one-page, offline-capable reference for the core option formulas, with a small live calculator.

**Live:** https://hfgong.github.io/options/

Part of the same app family as Mobile LaTeX, AirCopy, 农历, 漢字, Bark and Big Text (shared look and icon style).

## What's inside

Five tabs (each can be linked directly with `#parity`, `#black-scholes`, `#greeks`, `#vix`, `#pcr`):

| Tab | Contents |
|---|---|
| **Put–Call Parity** | C + Ke⁻ʳᵀ = P + S, the dividend version, synthetic positions, conversion/reversal arbitrage, bounds for American options |
| **Black–Scholes** | Call and put prices, d₁ and d₂, meaning of N(d₂), dividend adjustment, assumptions; calculator for prices with a live put–call parity check |
| **Greeks** | Δ, Γ, Vega, Θ, ρ for calls and puts, with values computed from the calculator's inputs (Vega per vol point, Θ per day, ρ per 1%) |
| **VIX** | Cboe per-expiry variance formula, 30-day interpolation, forward level, variable definitions and calculation steps; VIX → expected S&P 500 move rule of thumb |
| **P/C Ratio** | Volume, open-interest and premium-weighted put/call ratios, put share, how equity/index/total ratios differ; calculator with a rough sentiment reading |

Formulas are rendered with native MathML (no math library). The page works offline after the first visit and can be added to a phone's home screen.

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Deploy

GitHub Pages → Settings → Pages → *Deploy from a branch* → `main`, `/ (root)`.

## Disclaimer

- **Education and reference only.** Nothing here is investment, financial, tax or legal advice, or a recommendation to buy or sell any security or derivative.
- **Models are simplifications.** Black–Scholes assumes European exercise, constant volatility and interest rates, lognormal prices, continuous trading and no transaction costs. Real markets violate these assumptions (volatility smiles, jumps, early exercise, discrete dividends, liquidity), so model values can differ materially from traded prices.
- **Put/call ratio levels are rules of thumb.** Typical ranges and sentiment readings vary by market, product and period, and the ratio cannot tell hedges from directional bets; it is not a trading signal on its own.
- **The calculator is illustrative.** It uses a numerical approximation of the normal distribution (accurate to about 1e-7) and the inputs you type; it is not a pricing or risk system and must not be relied on for trading decisions.
- **VIX** is a registered trademark of Cboe Exchange, Inc. The VIX card summarises the publicly documented methodology for learning purposes; it is not affiliated with or endorsed by Cboe, and the official index is calculated and published only by Cboe. S&P 500 is a trademark of S&P Dow Jones Indices LLC.
- **No warranty.** The formulas and code are provided "as is", without warranty of any kind (see [LICENSE](LICENSE)). Options involve substantial risk and are not suitable for all investors; consult a qualified professional before trading.

## License

MIT — see [LICENSE](LICENSE). The icon is original to this project.
