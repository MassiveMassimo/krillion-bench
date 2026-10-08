# Benchmark comparison design

8 October 2026. The owner asked for a landing page that supports fast scanning, with inspiration from playful LLM benchmarks. Six Luna agents researched niche knowledge, games, behavior, creative tasks, directories, and comparison patterns. The findings support common interface conventions. They do not establish a formal industry standard or a measured usability winner.

## Applied to the landing page

- Lead with saved model results. Keep the approved ocean hero and Fluid components.
- Show model, requested thinking setting, mean points, acceptance, and scored coverage in compact rows. Numeric columns align at the end. Scores use tabular figures.
- Order by mean points by default. A Model button groups configurations for thinking comparisons. Keep equal scores equal; do not add official rank numbers to subscription tests.
- Show all eight configurations by default. Use the owner's requested model search beside Fluid Subtle Tabs for ordering. Search changes visible rows only. Keep the recorded scores and coverage intact. Pagination and charts are unnecessary at this size.
- State the saved date, shared question count, development provenance, and unverified settings beside the comparison. Define the mean as native points out of 100. Higher is better.
- Link each question to recorded answers and attempt history. Keep methodology one click away.
- Use labeled stacked rows on phones. Keep the same records, order, and metrics as the desktop table.
- With local results disabled, show public runs as pending and keep invented answer examples in a separate, labeled section. Missing local evidence must not produce substituted model scores.

The home and development pages share one validated server loader. The home page checks its opt-in at request time with Next.js `connection()`. It does not prerender local result data. Private journals remain excluded from deployment traces. See [Next.js documentation](https://nextjs.org/docs/app/api-reference/functions/connection).

## Strongest references

| Reference                                                                                                                        | Useful pattern                                                                    | Limit                                                                              |
| -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [SkateBench](https://skatebench.t3.gg/)                                                                                          | One main metric, explicit question count, thinking variants in model labels       | Its larger model pool justifies filters; eight current Krillion entries do not     |
| [WordleBench](https://www.wordlebench.com/)                                                                                      | Compact model table with clearly named measures                                   | Its visible table lacks a per-model sample denominator                             |
| [ChessBench](https://chessbenchllm.onrender.com/)                                                                                | Score, games played, uncertainty, and game/methodology navigation                 | Chess ratings and Krillion points measure different tasks                          |
| [SnitchBench](https://www.snitchbench.com/)                                                                                      | Short comparison table with dashboard, methodology, and data links                | Borrow the information hierarchy, not its sensational wording                      |
| [FunnyBench](https://funnybench.lol/)                                                                                            | Score with vote count; omit secondary token and cost columns to reduce noise      | The captured page had no populated votes; the table schema and method were visible |
| [ScreenshotBench](https://screenshotbench.com/) and [repository](https://github.com/Dan-Cleary/screenshotbench)                  | Small comparison matrix with per-result inspection                                | Its visual judge score is not a Krillion metric                                    |
| [BullshitBench](https://petergpt.github.io/bullshit-benchmark/) and [repository](https://github.com/petergpt/bullshit-benchmark) | Answer comparison, reasoning labels, optional secondary columns, frozen manifests | Judge outcomes and refusal exclusions require clear denominator notes              |
| [Chess puzzle browser](https://www.chess-bench.com/)                                                                             | Accepted/total score and task-level answer evidence                               | This is a separate project from the chess-playing leaderboard above                |

## Wider discovery

The team also checked these official references. Several are research projects rather than polished public result sites. LLM Jukebox is an exploratory music project. These references expand the pattern search; they are not all equally suitable templates.

| Reference                                                                                       | Pattern or caution                                                                                  |
| ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| [LOL Bench](https://www.lolbench.lol/)                                                          | Separate humor skills, sample size, and uncertainty; some inspection relied on indexed site content |
| [DogLM](https://mikeushakov.github.io/doglm/) and [code](https://github.com/mikeushakov/doglm)  | Per-game outputs and score evidence                                                                 |
| [Phunny](https://github.com/disi-unibo-nlp/Phunny)                                              | Task-specific result tables; no verified interactive leaderboard                                    |
| [TCG-Bench](https://tcg-bench.com/)                                                             | Game count and comparison baseline beside the score                                                 |
| [LLM Jukebox](https://oddbit.ai/llm-jukebox/)                                                   | Explore niche examples through linked model, song, and artist pages                                 |
| [Caliper Bench](https://caliperbench.com/)                                                      | Readable reasoning labels and optional comparison depth; avoid copying its dense controls           |
| [LMArcade](https://www.lmarcade.com/leaderboard)                                                | Distinguish model, harness, and their combined identity                                             |
| [LLM Benchmarks.org](https://llmbenchmarks.org/leaderboard/)                                    | Visible outcome definitions; result table remained loading during inspection                        |
| [Laugh Labs](https://laugh.so/research/joke-generation/)                                        | Main score with uncertainty and downloadable prompt/output evidence                                 |
| [EQ-Bench creative writing](https://eqbench.com/creative_writing.html)                          | Compact summary with detailed sample analyses                                                       |
| [JOKER](https://www.joker-project.com/2026/leaderboards/)                                       | Run counts, track separation, confidence intervals, and export links                                |
| [Vending-Bench](https://andonlabs.com/evals/vending-bench-2)                                    | Aggregate spread and progress over time; its long agent runs are a different benchmark class        |
| [Engine-writing ChessBench](https://www.chessbench.live/)                                       | Summary results linked to replay evidence; another distinct ChessBench project                      |
| [WeirdBench](https://weirdbench.com/)                                                           | Task definition, constraints, and score direction near the result preview                           |
| [WeirdML](https://htihle.github.io/weirdml.html)                                                | Task grid, version boundaries, and downloadable data                                                |
| [ClemBench](https://clembench.github.io/leaderboard.html)                                       | Separate task quality from task completion; controls are excessive for a tiny sample                |
| [Game Arena](https://www.kaggle.com/benchmarks/kaggle/game-arena)                               | Score, uncertainty, matches, and game coverage                                                      |
| [Heads Up Poker](https://www.kaggle.com/benchmarks/kaggle/poker-heads-up)                       | Replay link beside summary measures                                                                 |
| [Word Association](https://www.kaggle.com/benchmarks/kaggle/word-association/versions/1)        | Replay links and visible matched-game coverage                                                      |
| [Word Art](https://www.kaggle.com/benchmarks/kaggle/word-art)                                   | Explain an unfamiliar game briefly before the results                                               |
| [TextArena](https://www.textarena.ai/leaderboard)                                               | Explicit inclusion rules and configuration filters; populated rows were not verified                |
| [GTO Wizard](https://gtowizard.com/benchmark)                                                   | Hands and uncertainty beside the score; captured results were loading                               |
| [Humanity's Sixth Sense](https://labs.scale.com/leaderboard/hss)                                | Dataset provenance and task coverage; a large serious benchmark used only as a coverage reference   |
| [SlopBench](https://slop-bench.vercel.app/) and [code](https://github.com/Dan-Cleary/slopbench) | Discovery only; a usable populated result view was not verified                                     |

Agent Reach and [BenchDirectory](https://bench.directory/) provided discovery. Native web checks and official repositories provided verification. The directory's [repository](https://github.com/Dan-Cleary/benchdirectory) warns that mirrored results can be stale. One agent reached Exa's free search limit and continued with native search. Some dynamic pages returned empty or loading views. Website text inspection does not prove mobile usability, sorting behavior, or statistical validity.

The research found no material conflict in the chosen UI patterns. It did find several unrelated projects named ChessBench. Their protocols and results must remain separate. Krillion's own browser checks and saved records provide the acceptance evidence for this implementation.
