# Thinking levels in the benchmark

## Confirmed scope

The benchmark measures reasoning settings as well as model identity. Keep each model and thinking configuration as a separate leaderboard entry. Never average low and high results into an unlabeled model score. Keep question sets, prompts, attempt policy, and scoring fixed when comparing settings.

## Controls and labels

OpenRouter provides `reasoning.effort`. Available levels depend on the model. Discover supported efforts and mandatory reasoning from current catalog metadata. A token budget is another control; record its mapping when used. Do not silently replace unsupported settings. See [reasoning controls](https://openrouter.ai/docs/guides/best-practices/reasoning-tokens) and the [model catalog](https://openrouter.ai/api/v1/models).

Show labels such as `GPT-6.1 Sol · high`. “High” is a provider control, not equal compute across model families. Record requested effort, effective setting when reported, support evidence, response model, provider route, output ceiling, usage, latency, and finish reason. Unknown effective settings remain unknown. Proxy development results must say “requested low/high; application unverified”.

For official requests, use `provider.require_parameters: true` and verify model-specific support. This reduces routing to providers that ignore unsupported parameters; it does not prove identical implementations. Freeze and record the selected route policy. See [provider selection](https://openrouter.ai/docs/guides/routing/provider-selection).

Reasoning tokens are included in billed output. Hiding reasoning does not disable it. On most providers, the output ceiling includes reasoning and the final answer. Treat truncation as incomplete, preserve usage, and report completion coverage. Do not silently remove capped failures from the mean or count them as knowledge misses. A shared small ceiling can disadvantage high effort; establish adequate declared ceilings during the pilot. See [reasoning budget behavior](https://openrouter.ai/docs/guides/best-practices/reasoning-tokens#reasoning-tokens-and-max_tokens).

## Pilot recommendation

Start with two supported levels, normally low and high, on a few matched questions. Add medium, off, or maximum effort only when supported and affordable. This is a recommendation; the complete public model-setting matrix is not selected yet. All settings share the existing US$10 total pilot cap, rather than receiving US$10 each.

Compare native mean points and acceptance alongside USD per question, reported reasoning tokens, latency, and incomplete coverage. More reasoning does not imply a higher score. Reserve each call's conservative maximum cost before dispatch and reconcile actual account charges. Unknown-cost calls need reconciliation before further spending. See [usage accounting](https://openrouter.ai/docs/cookbook/administration/usage-accounting).

The [development probe](protocol-cost-probe.md) tested requested low and high. All four models tied at 85 points on one question. Effective proxy settings are unverified. This supports the reporting format, not a public ranking or a conclusion about the value of thinking.
