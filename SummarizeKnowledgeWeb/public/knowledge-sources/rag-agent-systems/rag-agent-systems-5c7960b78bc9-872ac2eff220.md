# CCAR-F Foundations Study Guide for Beginners

This guide was developed from all 162 questions in `quiz_questions_answers.md`. Its purpose is not to make you memorize answer positions. It teaches the recurring principles so that you can still choose correctly when a question changes its scenario or wording.

> Note: this guide follows the logic and expected answers of the provided quiz. Some commands and configuration names are specific to Claude Code and MCP as tested by the quiz.

## 1. The big picture: how does an agent work?

Think of an agent as a capable employee with three important limitations:

1. It knows only what is available in its current **context**.
2. It can perform only the actions enabled by its available **tools**.
3. Its reasoning can be wrong, so critical rules must be **enforced outside the model**, not merely stated in a prompt.

A basic agentic loop looks like this:

```text
User request
    ↓
Model reasons and selects a tool
    ↓
Application executes the tool
    ↓
Tool result is added to the conversation
    ↓
Model reads the result and chooses the next step
    ↓
Complete / retry / clarify / escalate to a human
```

The most important fact is that the API is **stateless**. If the application does not send prior messages again with the next request, the model does not remember them. This is the central idea behind questions 58, 77, and 99.

## 2. Exploring a codebase and choosing a working mode

### 2.1. Use the right search tool

- **Glob** finds files by names or path patterns, such as `**/*test*.py`.
- **Grep** searches inside files, such as for `SYNC_CONFLICT`, an import statement, or `eval(`.
- **Read** should be used after narrowing the scope, so you can understand the surrounding code.
- **Edit/Write** modifies files. In the quiz's logic, if Edit cannot find a unique anchor because the file contains repeated structures, read the complete file and write back the correctly modified content.

The rule to remember is: **search broadly through indexes and patterns, then read narrowly along the discovered path**. Do not read hundreds of files sequentially, and do not assume that searching one function name reveals the complete execution flow.

For example, before safely removing `calculateTax`:

1. Read the original module and its wrapper modules.
2. Record all aliases, such as `computeOrderTax`.
3. Grep for every exposed name across the repository.
4. Read each caller to verify how the function is actually used.

### 2.2. Investigate incrementally instead of following a rigid plan

When the architecture or root cause is unknown, the investigation plan must adapt to new findings:

```text
Find entry point → read router → discover middleware → follow service
→ discover repository → inspect query/tests/logs → revise hypothesis
```

A fixed sequence is often wrong because you do not yet know the actual path. In a large codebase, find an entry point, follow imports and calls, identify the interface or base class, and only then inspect the relevant implementations.

### 2.3. Direct execution or plan mode?

- For a small, clear, local change, execute directly. Examples include adding a future-date condition to one function (question 102) or fixing a production bug whose stack trace points to a specific area (question 68).
- For a large or breaking change affecting many modules, enter plan mode, map the impact, and then implement. An example is upgrading an authentication library from v2 to v3 across 45 files (question 87).
- For an open-ended request such as “add tests to a 200-file legacy system,” map the repository, locate highly coupled modules, prioritize high-risk areas, and revise the plan as dependencies are discovered (question 109).

Exam rule: **the greater the uncertainty and blast radius, the more exploration and planning you need; the more local and explicit the task, the more appropriate direct execution becomes**.

### 2.4. Iterate with verification

When defects interact, change one variable at a time and test after each step. For a complex algorithm, write tests first for normal behavior, edge cases, and performance. Then make the implementation pass those tests and use test failures as feedback for the next iteration.

A concrete input and expected output are usually more effective than a vague request such as “make this better.”

### 2.5. Put project guidance in the right place

- Project-wide conventions: `CLAUDE.md`.
- Rules that apply only to certain paths: `.claude/rules/` with path scoping.
- A shared team workflow invoked as a skill: `.claude/skills/<name>/SKILL.md`, committed to version control.
- Standards relevant to an individual package: use `@imports` in that package's `CLAUDE.md`.
- Example files needed for a one-off task: include them with `@references`.
- If rules appear to load inconsistently: run `/memory` and verify which memory files are active.
- For behavior that can be automated, such as formatting: use a Post ToolUse hook that runs Prettier after Edit/Write instead of merely making the word “MUST” stronger.

## 3. Sessions, context, and memory

### 3.1. Continue, resume, and fork

- `--continue`: continue the most recent conversation.
- `--resume <name>`: return to a specific named session.
- `fork_session`: create independent branches from the same accumulated knowledge.

If code changed after a session was saved, you can still resume to preserve prior work, but you must tell the agent which files or functions changed and have it re-read those areas. There is no need to discard all context, but you must not pretend that the code is unchanged.

Forking is appropriate when comparing two independent strategies from the same starting point. Developing both sequentially in one thread can anchor the second approach to decisions made for the first.

### 3.2. A long context window is not durable memory

The context window is limited and shared by:

- the system prompt;
- tool definitions;
- user and assistant message history;
- large tool results;
- accumulated RAG content.

Therefore, a 190K-token document plus a 2.5K-token tool schema and other prompt content can approach a 200K context limit and reduce accuracy near the document's end (question 73).

Even when only 35% of the context is used, the model can apply outdated preferences because the problem is conflicting state, not a lack of space (question 157).

### 3.3. Use a hybrid context strategy

Different kinds of information need different retention strategies:

| Information type | How to retain it |
|---|---|
| Facts that must remain exact | Structured state, database, or “story bible” |
| Old conclusions and decisions | Progressive summaries |
| The currently active exchange | Keep recent turns verbatim |

For a dinner-planning conversation, a severe shellfish allergy, serving count, and the user's definition of 68°F must become structured facts. General discussion can be summarized, while the most recent turns remain verbatim.

For academic papers, exact p-values and sample sizes should be stored in a structured fact store rather than only in a prose summary.

Important patterns include:

- Maintain a scratchpad for findings during long code explorations.
- If an old session is too large, create a new session, inject a structured summary, and make fresh tool calls for current state.
- If accumulated RAG results crowd out the conversation, retain only RAG results from the last two or three queries.
- Maintain a “current preferences” object and update it whenever a user changes preferences.
- For a long story, retain a story bible and summarize only ephemeral brainstorming.

### 3.4. Keep behavior consistent

Global persona and behavioral requirements belong in the system prompt. In a long conversation, however, accumulated responses can dilute those instructions. Useful approaches include:

- replace long instructions with short, general principles;
- use few-shot examples to demonstrate the desired behavior;
- reinforce critical guidance with user-role messages at natural breakpoints;
- insert new external state, such as “the package has shipped,” into the system prompt before the next request;
- version system prompts per conversation so a continuing conversation does not unexpectedly change style.

`--system-prompt` can replace Claude Code's default prompt. If you need to preserve its built-in file-reading and code-navigation guidance, use `--append-system-prompt` to add your review instructions instead (question 159).

## 4. Structured extraction: valid JSON does not guarantee correct data

### 4.1. Three levels of correctness

1. **Syntax:** Can the JSON be parsed?
2. **Schema:** Are fields, types, enums, and required properties correct?
3. **Semantics:** Is each value meaningful, accurate, and supported by the source?

Tool use with an input schema is excellent for levels 1 and 2, but it does not automatically guarantee level 3. For example, `"30 minutes"` can be a valid string while still being placed incorrectly in an ingredient quantity field.

To require schema-conformant output, define a tool whose input schema matches the target structure and read the `tool_use` response. If one specific extraction tool must run first, set `tool_choice` to that named tool. If multiple document-specific extraction tools are available and any one is acceptable, use `tool_choice: "any"` to guarantee that the model calls one of them.

### 4.2. The schema must represent reality

A robust schema does not force an open world into overly narrow choices:

- If information is absent, allow `null` and explicitly forbid guessing.
- If there is no evidence for list entries, use an empty array rather than fabricating items.
- If sentiment is ambiguous, include `unclear`.
- For an enum with a long tail, include `other` plus a detail field.
- For amended contracts, preserve multiple values together with their source locations and effective dates rather than silently selecting one and losing history.

The principle is: **a schema should preserve evidence and uncertainty**.

### 4.3. When should you use few-shot examples?

A schema teaches the model the output's shape; few-shot examples teach it how to interpret the input. Use two or three complete input-output examples when the model:

- normalizes materials inconsistently;
- misses citations or methodology in varied layouts;
- splits compound skills at inconsistent levels of granularity;
- mishandles informal measures such as “a handful” or “a splash”;
- misses untested conditional branches;
- generates trivial tests;
- misunderstands team-specific conventions.

Few-shot examples are most useful when they reproduce observed failure patterns and clearly show the boundary between acceptable and unacceptable output.

### 4.4. Validation and self-correction

When the JSON conforms to the schema but violates domain logic:

1. Preserve both extracted and derived values, such as `stated_total` and `calculated_total`.
2. Compute a consistency flag.
3. On failure, send the document, prior extraction, and validation errors back to the model for correction.
4. If the necessary information does not exist in the input, retrying will not help; return `null` or route the case to review.

Retry works only when the model has enough information to correct itself. It cannot recover a complete list of co-authors that exists only in an external document it has not received.

### 4.5. Confidence and human review

Do not use raw model confidence based on intuition. Instead:

- calibrate thresholds on a labeled validation set;
- measure results by document type and field, not only through aggregate accuracy;
- return field-level confidence, `requires_review`, and `review_reasons`;
- continually audit a stratified random sample of high-confidence outputs to measure confidently wrong predictions and discover new failure patterns.

If reviewers can inspect only 20% of extractions, prioritize cases below calibrated thresholds while still reserving some capacity to audit high-confidence results.

### 4.6. Long documents and batch processing

- For long documents with scattered information: split into chunks, extract from each chunk, then merge and deduplicate.
- If batch items fail because of context length: resubmit only failed `custom_id` items after chunking them; do not rerun the entire batch.
- For large, non-urgent workloads: the Message Batches API saves 50% but may take up to 24 hours.
- For continuously arriving data with a 30-hour SLA: submit periodic batches, such as every four hours, leaving room for the 24-hour window and retries.
- For urgent reports requiring a response within 30 minutes: use the real-time Messages API; send routine reports through batch processing.
- For 50,000 documents: batch all documents, classify failures, improve the prompt by failure mode, and resubmit only failed records in later batches.

## 5. Designing tools and MCP interfaces the model can use correctly

### 5.1. A tool description is an interface for the model

A name and JSON type are not enough. Every tool and parameter should explain:

- when to use it;
- when not to use it;
- the required input format;
- what the output contains;
- how it differs from similar tools.

For example, `delete_file` should say not to use it for backups if policy requires archiving. A `user_id` parameter should say “UUID of the user to update (required).” If the agent ignores a specialized MCP tool and uses Grep or text manipulation instead, first improve its description, use case, inputs, and outputs instead of removing foundational tools.

### 5.2. Should you split or combine tools?

Two principles that appear contradictory are actually complementary:

- **Split** when one tool serves different intents or when operations require different parameters. Refund, cancel, and reship should be separate tools; cardio and strength workouts require separate schemas.
- **Combine** when tools overlap semantically or create a race condition. Compensation operations that are repeatedly confused may need one clear interface; checking an appointment slot and then booking it should become one atomic operation.

Use this test:

```text
Different intent or different required fields? → SPLIT
Same intent, semantic overlap, or atomicity requirement? → COMBINE
```

### 5.3. Prefer canonical IDs over ambiguous strings

Do not ask the model to combine `game_date + home_team + away_team` if this can select the wrong game. Create a `search_games` tool that returns `game_id`, then make the mutation accept only `game_id`.

Likewise, search tools should return structured IDs and metadata so later operations can use results deterministically.

### 5.4. Reduce the decision space

Choosing among 18 tools is less reliable than choosing among four or five relevant tools. Give each subagent only tools appropriate to its role.

For 50 connectors, use a discovery tool that finds and **dynamically adds** relevant connectors. A connector should not be directly callable before it is discovered.

MCP resources are appropriate for exposing readable catalogs such as issue summaries, documentation hierarchies, and database schemas. They let the agent understand what a server contains before making many exploratory tool calls.

Tools from all configured MCP servers are discovered at connection time and are simultaneously available. Configuration scope works as follows:

- Shared team/project server: `.mcp.json`.
- Personal experimental server: `~/.claude.json`.

## 6. Tool output and error handling

### 6.1. Structured output makes later operations reliable

Instead of returning prose such as “The portfolio is worth…,” return an object with explicit fields. The main benefit is not automatically lower token usage or automatic verification of the underlying API. It is that the agent and orchestrator can retrieve exact values without parsing free-form text.

Tool results should contain only relevant information. If `lookup_order` returns 40 fields but a return workflow needs only items, purchase date, return window, and status, compact the existing results before loading more orders into context.

For paginated search results, return the first page, total match count, and a cursor rather than automatically fetching all 200 matches.

### 6.2. Report errors at the correct layer

- A malformed MCP request or protocol-level issue, such as a structurally missing required parameter, is a JSON-RPC protocol error.
- If the tool was invoked correctly but the underlying business service returns 404 or 503, return a tool result with `isError: true`.

Never return only “Operation failed.” A useful error looks like this:

```json
{
  "error_category": "transient | validation | permission | business",
  "is_retryable": false,
  "reason": "Order exceeds return window",
  "user_message": "The order is outside the refund period"
}
```

### 6.3. Who should retry?

- For timeouts, 503 responses, and temporary network failures, the tool implementation should automatically retry with exponential backoff.
- For syntax, validation, permission, and business-rule errors, immediately return a precise explanation so the agent can correct the input, call another tool, explain the result, or escalate.

This division saves turns and prevents useless repeated calls.

## 7. Safety: turn rules into architecture

A prompt is not a security boundary. If reimbursements above $500 require approval, enforce the threshold **inside the tool or backend**. Regardless of how the model is prompted, the tool must create a pending approval instead of disbursing funds.

Three important patterns are:

1. **Preview → confirm → execute:** preview returns impact information and a one-time confirmation token; execute requires that token. This is stronger than a `dry_run` flag the model can bypass.
2. **Confirm the exact target:** display similar records with differentiating fields and require one confirmation before deletion.
3. **Intercept with a hook:** if a tool call exceeds a policy limit, a hook blocks it and invokes human escalation.

If the requirement says every loop must end in either resolution or escalation, orchestration code must inspect the outcome after **every kind of termination**, including `max_turns`, and automatically escalate when no terminal state exists. Instructions to the model alone cannot provide this guarantee.

## 8. Multi-agent orchestration

### 8.1. Coordinators do not share memory magically

A subagent knows prior results only if the coordinator includes them in its prompt or grants access to a shared store.

```text
Search agents ──┐
                ├─> Coordinator combines outputs + sources ─> Synthesis ─> Report
Document agents ┘
```

If a synthesis agent says it received no findings, the coordinator probably failed to pass the earlier outputs. To preserve citations, every agent should produce claim-source mappings or separate content from source metadata, and synthesis must preserve those mappings.

When context is large, do not pass 120K raw tokens. Pass the synthesis draft together with a source index mapping claims to URLs and relevant excerpts. Agents may also store structured reports in a shared location and pass reference IDs with read access.

### 8.2. Parallel, sequential, or dynamic delegation?

- Use **parallel execution** for independent work, such as web search and analysis of an already available document set. Emit both Task calls in one response.
- Use **sequential execution or prompt chaining** when a later step depends on earlier output or the workflow always follows fixed phases.
- Use **dynamic delegation** when query types vary; let the coordinator select subagents based on complexity.
- Add a **fast path** for simple factual queries, letting the coordinator answer directly.
- Use **fan-out/fan-in** to divide 12 legal precedents or 45 source files among parallel agents and aggregate their results.

A coordinator must have `Task` in `allowedTools` to spawn subagents. Agent definitions alone are insufficient.

### 8.3. Delegate goals, not brittle procedures

A subagent prompt should state the objective, quality criteria, scope, and output format. Avoid prescribing a rigid sequence of search queries because unexpected information may require adaptation.

Outputs still need structure. Include publication or collection dates so two statistics from different years are understood as a trend rather than a contradiction. Separate confirmed findings from contested analysis. Render financial information as tables and news as prose.

A robust research pipeline has a feedback loop:

```text
Search → Analyze → Synthesize → identify gaps
   ↑                              │
   └──── targeted re-search ──────┘
```

### 8.4. Do not overuse subagents

Subagents add latency and context cost. If a follow-up merely asks for a summary of information already in the coordinator's context, the coordinator should answer directly. Use subagents when specialization, parallelism, or context isolation provides a real benefit.

## 9. Customer support and escalation

The goal is to maximize resolution while preserving the customer's ability to reach a human.

- If an upset customer requests a person but the issue is unknown, acknowledge the frustration, ask **one targeted question**, and then escalate with useful information.
- If the problem is already understood and immediately resolvable, explain that it can be completed now while still offering escalation.
- Escalate when the customer requests it, when an exception or approval is outside the agent's authority, or when the agent cannot make meaningful progress.
- Before escalation, create a structured handoff containing customer ID, order information, root cause, amount, completed steps, current status, and recommended action.
- If a refund tool times out after eligibility has been confirmed, explain what is known, state that the system prevented completion, and offer a retry or escalation. Never imply that the refund succeeded.

If the human agent cannot see the transcript, do not dump the entire conversation. Provide a concise, actionable handoff.

## 10. Prompting and conversational experience

### 10.1. Ask fewer, better questions

For reversible ambiguity, use context to make a reasonable assumption, state it explicitly, and invite correction. Ask a clarifying question when the choice significantly changes the action or before an irreversible operation.

- “Set up my focus music” is ambiguous between playing now and configuring future preferences, so ask one question about the action type.
- For “help me with the report,” if context supports a likely interpretation, state the assumption and begin instead of asking three questions at once.
- For venue booking, recommendations can proceed with stated assumptions, but the required date, guest count, and budget must be confirmed before the actual booking.

### 10.2. Prefer examples over long conditional rule sets

If a tutor must adapt difficulty or a reviewer must distinguish real issues from false positives, concrete contrasting examples are often stronger than pages of conditions.

A general rule such as “adapt explanation depth to the user's terminology and signals of expertise” works better than a list of `if` clauses that misses implicit expertise. Keep hard conditionals for safety-critical behavior, such as advising medical consultation for injuries.

### 10.3. Control the opening when necessary

If responses repeatedly start with “Certainly!”, prefill a partial assistant message with a direct opening for the model to continue. This controls response form; it does not replace a system prompt for long-term behavior.

## 11. Quality evaluation and code review

### 11.1. Precision and recall

- High **precision** means that a large proportion of reported issues are real.
- High **recall** means that a large proportion of all real issues are found.

A prompt saying “only report issues when certain” increases precision but misses real bugs. To improve recall while managing noise:

1. Use a discovery stage optimized for coverage, with confidence and severity metadata.
2. Apply thresholds or filtering in a separate stage.

If one prompt has competing objectives, split it into focused prompts, such as security/API review and business-logic review, then merge the findings. A fixed style → security → documentation workflow is prompt chaining.

### 11.2. Reviews must look beyond the diff

A single API request containing only the diff and changed files cannot find outdated callers in unchanged files. Redesign the review as a turn-limited agentic task with Read, Grep, and Glob access so the reviewer can follow references across the repository.

If a large PR causes a findings array to exceed `max_tokens`, split changed files across multiple API calls and merge the resulting arrays.

A session reviewing code that it just wrote may remain anchored to its earlier reasoning. An independent CI review starts with a fresh perspective and is more likely to challenge those decisions (question 151).

### 11.3. Generating valuable tests

To improve tests at generation time, document the following in `CLAUDE.md`:

- the definition of a valuable behavioral test;
- important edge cases;
- available fixtures and their intended uses;
- examples contrasting meaningful tests with trivial assertions;
- the requirement to avoid duplicating existing coverage.

A few-shot example pairing an uncovered branch with a precise review comment helps the model identify branch-level coverage gaps.

## 12. Cost, latency, and execution limits

- Batch processing is suitable only if feedback arriving up to 24 hours later remains useful. This is primarily an SLA and workflow question, not merely a 50% cost-saving decision.
- Give simple requests a fast path rather than sending them through every agent.
- Run independent work in parallel.
- Filter or paginate long tool outputs.
- In non-interactive CLI usage, `--max-turns 10 --max-budget-usd 2.00` directly limits iterations and spending per invocation.
- Turn and budget limits only stop the loop. To guarantee a business outcome, orchestration must still inspect the terminal state and fall back to escalation.

## 13. A quick answer-selection framework

When two options seem plausible, ask these questions in order:

1. **Is information missing, or is structure missing?** If the source lacks the information, use `null` or review; if structure is missing, use schema/tool use.
2. **Is the error transient or permanent?** Retry transient failures inside the tool; return clear metadata for permanent errors.
3. **Is the rule guidance, or must it be guaranteed?** Put guidance in prompts; enforce guarantees in tools, hooks, backends, or orchestration.
4. **Are tasks independent or dependent?** Run independent tasks in parallel; chain dependent ones.
5. **Do tools represent distinct intents or overlapping meanings?** Split distinct intents/parameter sets; combine overlap and atomic operations.
6. **Is remembered information a fact or conversational discussion?** Put facts in structured state, summarize old discussion, and retain recent turns verbatim.
7. **Is the task small and clear or broad and uncertain?** Execute small tasks directly; map and plan broad tasks.
8. **Are you optimizing syntax or semantics?** A JSON schema does not fix semantically wrong values; use examples, validation, confidence, and review.
9. **Will a human need to act next?** Pass a structured handoff, not a transcript dump.
10. **Does an option promise an absolute guarantee using only a prompt?** It is usually a distractor when the requirement says “guarantee,” “tamper-proof,” or “cannot bypass.”

## 14. Common distractors in the quiz

- “Read every file” sounds comprehensive but wastes context and ignores code relationships.
- “Remove competing tools” avoids improving descriptions and interfaces.
- “Use a larger model” does not replace state and context management.
- “Retry every error” wastes resources on permanent errors or unavailable information.
- “Randomly review 20%” measures aggregate performance but does not prioritize risk; use calibrated confidence and also audit high-confidence samples.
- “Strengthen the system prompt” does not enforce a security policy.
- “Summarize everything” may lose exact facts; separate critical facts first.
- “Spawn a subagent for everything” adds latency without necessarily adding value.
- “JSON automatically verifies the API's data” is false; JSON schema controls structure, not truth.
- “There is plenty of context left, so forgetting is impossible” is false; instruction dilution and conflicting state can still occur.

## 15. Complete study map for all 162 questions

Use this table to identify the principle tested by each question range and return to the relevant chapter after a mistake.

| Questions | Main ideas to remember |
|---|---|
| 001–006 | Adaptive exploration; Read/Write when Edit lacks a unique anchor; resume/fork; alias-aware search |
| 007–015 | Scratchpads, context handoffs, subagents, entry-point tracing, MCP tool descriptions |
| 016–024 | Amendment-aware schemas; confidence; calculated totals; tool choice; limits of retries |
| 025–030 | Schema plus normalization; `other` enum; segment validation; batch/SLA; few-shot examples |
| 031–040 | Purpose-specific tools; Task permission; agent state; data dates; claim-source mapping |
| 041–045 | Fast paths, compact context transfer, parallelism, citation preservation |
| 046–056 | MCP errors, structured handoffs, escalation, retryability, hook enforcement |
| 057–061 | Support conversation context; stateless API; new session plus summary; calculated totals |
| 062–070 | Targeted subagents; dynamic delegation; error metadata; feedback loops; safety tokens |
| 071–075 | Semantic repair; tool schemas; context budget; `tool_choice:any`; validation feedback |
| 076–086 | Progressive summaries; message history; prompt dilution; structured state and fact stores |
| 087–096 | Plan/direct execution; iterative testing; references/imports; schema extraction; agentic review |
| 097–105 | Backoff; domain-specific tool splitting; stateless API; ambiguity; formatting hooks; concrete tests |
| 106–116 | Parallel Task calls; chunked review; Grep; MCP resources; dynamic connectors; atomic tools; error ownership |
| 117–126 | Confidence output; canonical IDs; reduced tool sets; `/memory`; batch suitability; pagination; MCP error layers |
| 127–136 | Forking; focused prompts; chaining; shared stores; descriptions; confirmation; batches; prompt versioning |
| 137–145 | Test-first development; path rules; combining/splitting tools; general prompt principles; Grep; backend policy |
| 146–154 | Structured output; RAG windows; team skills; uncertainty schemas; terminal guarantees; budget caps |
| 155–162 | Parameter descriptions; story bibles; current-state objects; few-shot examples; appended prompts; MCP scopes |

## 16. Answer key for self-checking

Use this section only after attempting the questions yourself. Each entry has the form `question number: correct option number`.

```text
001:3 · 002:1 · 003:1 · 004:1 · 005:3 · 006:3 · 007:1 · 008:3 · 009:4 · 010:2 · 011:2 · 012:1 · 013:1 · 014:2 · 015:2 · 016:2 · 017:2 · 018:2
019:2 · 020:3 · 021:3 · 022:1 · 023:1 · 024:1 · 025:2 · 026:2 · 027:1 · 028:1 · 029:1 · 030:4 · 031:2 · 032:4 · 033:1 · 034:1 · 035:4 · 036:4
037:2 · 038:1 · 039:2 · 040:2 · 041:4 · 042:4 · 043:2 · 044:1 · 045:1 · 046:4 · 047:1 · 048:2 · 049:2 · 050:2 · 051:4 · 052:4 · 053:3 · 054:1
055:1 · 056:3 · 057:3 · 058:1 · 059:2 · 060:3 · 061:4 · 062:1 · 063:1 · 064:4 · 065:2 · 066:2 · 067:4 · 068:1 · 069:2 · 070:1 · 071:4 · 072:1
073:3 · 074:2 · 075:1 · 076:4 · 077:3 · 078:2 · 079:2 · 080:1 · 081:4 · 082:1 · 083:1 · 084:3 · 085:2 · 086:3 · 087:2 · 088:4 · 089:4 · 090:4
091:2 · 092:1 · 093:4 · 094:4 · 095:1 · 096:4 · 097:1 · 098:2 · 099:4 · 100:1 · 101:2 · 102:1 · 103:2 · 104:2 · 105:3 · 106:2 · 107:4 · 108:2
109:2 · 110:3 · 111:3 · 112:2 · 113:3 · 114:1 · 115:3 · 116:1 · 117:3 · 118:4 · 119:2 · 120:3 · 121:1 · 122:1 · 123:2 · 124:4 · 125:2 · 126:1
127:1 · 128:3 · 129:2 · 130:1 · 131:4 · 132:2 · 133:2 · 134:1 · 135:2 · 136:4 · 137:2 · 138:1 · 139:1 · 140:1 · 141:4 · 142:3 · 143:3 · 144:2
145:3 · 146:2 · 147:3 · 148:3 · 149:2 · 150:3 · 151:1 · 152:1 · 153:3 · 154:4 · 155:3 · 156:3 · 157:2 · 158:1 · 159:1 · 160:1 · 161:2 · 162:4
```

## 17. A three-pass study method

**Pass 1 — Understand:** Read chapters 1–12 and explain each principle using your own example.

**Pass 2 — Recognize:** Attempt all 162 questions. Before looking at the options, identify the underlying contrast: plan/direct, retry/permanent, prompt/enforcement, split/combine, summary/state, or parallel/sequential.

**Pass 3 — Correct:** Revisit only the questions you missed, using the map in chapter 15. For each mistake, write one sentence answering: “What signal did the question provide?” and “Why did my chosen option fail to address the root cause?”

If you remember only one idea from the entire guide, remember this:

> Give the model enough context and clear interfaces for reasoning; use schemas to shape data; use code, hooks, and backends to guarantee anything that must never fail.
