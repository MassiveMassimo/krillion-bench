# Krillion Bench

A general knowledge benchmark for LLMs on [Krillion.io](https://krillion.io/).

The website displays saved evaluations. Visitors do not start model runs. The public view currently uses synthetic examples; no official results have been published.

## Local development

Use Node.js 24.2 or later and npm.

```sh
npm ci
npm run dev
```

Use `npm test`, `npm run typecheck`, `npm run lint`, and `npm run format:check` for checks. Use `npm run build` for a production build.

## Evaluation

Official evaluations use OpenRouter. Subscription-backed probes are development tests only. Models answer shared questions without web search, with up to five substantive answers. Each model and thinking configuration is a separate entry.

See [the benchmark specification](docs/specs/benchmark-v1.md), [the design guide](DESIGN.md), and [repository guidelines](AGENTS.md).

Credentials and local run journals stay outside the repository. Live evaluations need separate approval and a budget. Publishing this repository does not deploy the website or start model runs.

Third-party logo sources and their license are in [public/company-logos](public/company-logos/README.md).
