# limiar-lp

Landing page do [Limiar](https://github.com/Jonorusc/limiar), limitador de carga para MacBooks com Apple Silicon.

HTML, CSS e JS puros, sem build. Deploy na Vercel.

- `api/github.js`: function que busca estrelas e a última release (cache de 1h). Aceita um `GITHUB_TOKEN` opcional.
- `scripts/make-og.swift`: gera a `og-image.png` a partir do ícone.

Localmente, é só abrir com o Live Server. A contagem de estrelas só aparece na Vercel (ou com `vercel dev`).

MIT
