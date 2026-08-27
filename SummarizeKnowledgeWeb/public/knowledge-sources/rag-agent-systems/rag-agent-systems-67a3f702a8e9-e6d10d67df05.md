# CCAR-F Documentation — Complete Export

> Source: [https://www.nvnhan.wiki/#/ccarf/docs](https://www.nvnhan.wiki/#/ccarf/docs)
> This file combines every domain clicked and exported by `Tool2/scrape_docs.py`.

## Domains

- [D1 — Agentic Architecture & Orchestration](#d1-agentic-architecture-orchestration)
- [D2 — Tool Design & MCP Integration](#d2-tool-design-mcp-integration)
- [D3 — Claude Code Configuration & Workflows](#d3-claude-code-configuration-workflows)
- [D4 — Prompt Engineering & Structured Output](#d4-prompt-engineering-structured-output)
- [D5 — Context Management & Reliability](#d5-context-management-reliability)

---

<a id="d1-agentic-architecture-orchestration"></a>

# D1 — Agentic Architecture & Orchestration

> Source: [https://www.nvnhan.wiki/#/ccarf/docs](https://www.nvnhan.wiki/#/ccarf/docs)
> Exported from the rendered documentation by `Tool2/scrape_docs.py`.

## Table of contents

1. [A. Foundations of Agentic Architecture](#a-foundations-of-agentic-architecture)
2. [B. Agentic Loop Lifecycle](#b-agentic-loop-lifecycle)
3. [C. Coordinator-Subagent Orchestration](#c-coordinator-subagent-orchestration)
4. [D. Subagent Invocation & Context Passing](#d-subagent-invocation-context-passing)
5. [E. Multi-Step Workflow Enforcement & Handoff](#e-multi-step-workflow-enforcement-handoff)
6. [F. Agent SDK Hooks for Tool Interception & Data Normalization](#f-agent-sdk-hooks-for-tool-interception-data-normalization)
7. [G. Task Decomposition Strategies](#g-task-decomposition-strategies)
8. [H. Session State, Resumption & Forking](#h-session-state-resumption-forking)
9. [Domain 1: Agentic Architecture & Orchestration Sample Questions](#domain-1-agentic-architecture-orchestration-sample-questions)
10. [Nguồn tham khảo](#ngu-n-tham-kh-o)

---

<a id="a-foundations-of-agentic-architecture"></a>

## A. Foundations of Agentic Architecture

### What is Agentic Architecture?

Agentic architecture refers to a system design where Claude is given a goal, a set of instructions, access to tools, and enough context to determine what action should be taken next. Instead of only generating a single response, Claude can reason about the task, select an appropriate tool, inspect the tool results, update its understanding, and continue working until the task is complete.

In a traditional application, the developer usually defines every step in advance. For example, a support workflow might always run the same sequence: identify the customer, look up the order, check the refund policy, and then process a refund. This approach works well when requirements are stable and decisions are deterministic. However, it becomes less effective when the request is ambiguous or when the correct next step depends on new information discovered during the workflow.

In an agentic workflow, Claude can adapt to the situation. If the customer provides an order number but no account information, the agent may first verify the customer. If the lookup tool returns multiple matching accounts, the agent may ask a clarifying question. If the order is not eligible for an automatic refund, the agent may escalate to a human. This ability to reason over intermediate results is what makes the architecture agentic.

Anthropic describes the Agent SDK loop as a process where Claude receives the prompt, tool definitions, system prompt, and conversation history, evaluates the current state, requests tools when needed, receives tool results, and repeats until it produces a response with no tool calls.

### Core Components of an Agentic System

A production-ready agentic system usually consists of several cooperating parts. Each part plays a specific role in helping Claude understand the task, take appropriate action, and maintain reliability.

#### User Request or Task Objective

The user request defines the goal that the agent must complete. It may be simple, such as "summarize this file", or complex, such as "investigate this billing dispute and determine whether the customer is eligible for a refund."

In an agentic architecture, the task objective should be clear enough for Claude to reason about success. Ambiguous requests may require clarification, tool use, or decomposition into smaller subtasks.

Example:

Customer request: "I was charged twice, my order arrived damaged, and I want this resolved today."

This is not a single-action request. A well-designed agent should recognize that it contains multiple concerns: billing, order condition, refund or replacement eligibility, urgency, and possible escalation.

#### System Prompt and Behavioral Instructions

The system prompt defines the agent's role, responsibilities, boundaries, and behavior. It tells Claude what kind of assistant it is, what tools it may use, how to handle uncertainty, and when to escalate.

For a customer support agent, the system prompt may specify that the agent should verify identity before accessing sensitive records, use backend tools for ordering details, follow company policy, and escalate when policy is ambiguous. For a developer productivity agent, the system prompt may define how Claude should explore files, run tests, and avoid destructive actions, and summarize changes.

System Prompt: Developer Agent

System prompts are important, but they should not be used as the only enforcement mechanism for high-risk operations. If a rule must always be followed, such as blocking refunds above a certain amount, use programmatic enforcement through hooks, prerequisite gates, or permission controls.

#### Claude Model Response

Claude's response can include natural language, tool-use requests, or both. In agentic systems, Claude does not simply answer immediately. It may first determine that it needs more information and then request a tool call.

For example, if a user asks, "Why did my order not arrive?", Claude should not guess. It should use an order lookup tool or shipment tracking tool if available. After receiving the result, Claude can reason about the next step and provide a grounded answer.

#### Tool Definitions

Tools define the actions Claude can request. A tool may loop up a customer, search files, read documents, run tests, process refunds, fetch policy data, query a database, or call an MCP server.

Anthropic's Agent SDK documentation lists built-in tools used by Claude Code and the Agent SDK, including file tools such as Read, Edit, and Write; search tools such as Glob and Grep; execution tools such as Bash; web tools such as WebSearch and WebFetch; and orchestration tools such as Agent, Skill, and task-tracking tools.

Clear tool definitions are essential because Claude uses tool names, descriptions, and schemas to decide which tool is appropriate. Poorly described tools can lead to incorrect tool selection, duplicate work, or unsafe actions.

#### Built-in tools

The SDK includes the same tools that power Claude Code:

| Category | Tools | What they do |
| --- | --- | --- |
| File operations | Read, Write, Edit | Read, modify, and create files |
| Search | Glob, Grep | Find files by pattern, search content with regex |
| Execution | Bash | Run shell commands, scripts, git operations |
| Web | WebSearch, WebFetch | Search the web, fetch and parse pages |
| Discovery | ToolSearch | Dynamically find and load tools on-demand instead of preloading all of them |
| Orchestration | Agent, Skill, AskUserQuestion, TaskCreate, TaskUpdate | Spawn subagents, invoke skills, ask the user, track tasks |

Beyond built-in tools, you can:

- Connect external services with MCP servers (databases, browsers, APIs)
- Define custom tools with custom tool handlers
- Load project skills via setting sources for reusable workflows

#### Tool Execution Layer

The tool execution layer is the part of the application that actually runs the tool Claude requested. Claude decides which tool it wants to use, but the application controls whether the tool call is allowed and how the result is returned.

This separation is important. Claude may request a tool, but the system should still apply permission checks, policy rules, validation, and logging before executing it. Anthropic's documentation states that Claude determines which tools to call based on the task, but developers control whether those calls are allowed to execute through settings such as allowed tools, disallowed tools, and permission modes.

#### Tool Results

Tool results provide Claude with new information. These results must be returned to the conversation context so Claude can reason about the next action. A tool result may include customer data, order status, file contents, test output, policy information, or an error message.

Tool results should be concise, structured, and relevant. Verbose results can consume unnecessary context, while incomplete results may cause Claude to make unsupported assumptions.

Example: Useful tool results (JSON)

```
{
"customer_id": "C-1049",
"verification_status": "verified",
"order_id": "O-88421",
"order_status": "delivered",
"issue": "damaged item",
"photo_evidence": true,
"refund_limit_check": "requires_human_approval"
}
```

This result is easier for Claude to reason over than a large raw database response containing dozens of irrelevant fields.

#### Conversation History

Conversation history contains the prior user messages, Claude responses, tool calls, and tool results. It gives Claude continuity across turns.

In an agentic workflow, conversation history is especially important because Claude may need to remember what it already checked, which tools have already returned results, what assumptions are valid, and what still needs to be done.

However, conversation history also grows over time. Long-running agents can accumulate too much context, especially when they read large fuels, run verbose commands, or use tools repeatedly. Anthropic's Agent SDK documentation explains that the context window includes the system prompt, tool definitions, conversation history, tool inputs, and tool outputs, and that large tool outputs can consume significant context within Claude's native token limit. handles the context window by automatically managing session histories, tool inputs, and tool outputs within Claude's native token limit.

While standard Claude models operate within a baseline 200,00000-token context window, advanced setups like Claude Code or specific model tiers (e.g., Claude Opus variants) can scale up to a 1 million-token context window. Because long-running agent tasks can quickly overflow this window with verbose tool results, the Agent SDK provides active strategies to maintain context

#### Control Loop

The control loop is the mechanism that repeatedly sends the updated context back to Claude until the task is complete. In Claude API terms, this involves checking whether Claude wants to use a tool or whether Claude wants to use a tool or whether it has finished its turn.

For the CCA-F exam, this concept becomes more important in the next section, Agentic Loop Lifecycle, where you will encounter `stop_reason`, `tool_use`, and `end_turn` handling in more detail. The key point here is that an agentic system is not a single request-response interaction. It is a repeated reasoning and action cycle.

#### Stop Condition

The stop condition determines when the agent should end the loop and return a final response. The official exam guide emphasizes that agentic loop control should continue when `stop_reason` is "tool_use" and terminate when `stop_reason` is "end_turn"; it also warns against using unreliable anti-patterns such as parsing natural language completion signals or checking for assistant text as the completion indicator. A good architecture uses explicit control signals and avoids guessing whether Claude is done.

#### Session State

Session state allows the system to preserve continuity across longer workflows. This is important when an agent needs to continue an investigation, resume a prior session, or fork an earlier analysis into multiple possible solution paths.

In Domain 1, candidates are expected to understand session resumption and forking. These concepts are especially useful for codebase exploration, research workflows, and alternative implementation planning.

#### Error Handling and Escalation Logic

Error handling defines what happens when a tool fails, returns incomplete data, or produces an ambiguous result. Escalation logic defines when the agent should stop autonomous work and hand the case to a human.

In a production system, the agent should not treat every tool failure the same way. A timeout may be retryable, a permission error may require escalation, and a policy exception may require human review. For customer support scenarios, escalation should include a structured handoff summary so the human agent can act without re-reading the entire conversation.

### Agentic System vs Traditional Workflow

| Aspect | Agentic System | Traditional Workflow |
| --- | --- | --- |
| Decision-making | Model-driven, Claude reasons about next action | Predefined logic, application follows preconfigured steps |
| Tool selection | Model selects tools based on context | Application invokes tools by rule |
| Adaptability | High | Limited |
| Flexibility | High | Low to moderate |
| Best for | Ambiguous, multi-step, exploratory tasks | Predictable and deterministic tasks |
| Risk | Requires guardrails and monitoring | Easier to validate upfront |
| Human review | Often integrated | Usually separate |

★

**EXAM TIP:** If the scenario describes ambiguity, multi-step investigation, or changing decisions based on tool results, agentic architecture is usually appropriate. If the scenario describes mandatory compliance ordering, programmatic enforcement is usually required.

For example, a traditional workflow might always execute:

1. Look up customers.
2. Look up the order.
3. Check refund policy.
4. Process refund.

An agentic workflow can adapt:

1. Ask for missing customer information if multiple matches are found.
2. Look up the order only after verification.
3. Investigate billing, shipping, and refund issues separately if the customer raises multiple concerns.
4. Escalate to a human if policy is ambiguous.
5. Process the refund only if all prerequisites are satisfied.

A traditional workflow is best when the process is stable, deterministic, and easy to define in advance. Examples include sending a password reset email, formatting a known data field, or running a scheduled report.

An agentic workflow is better when the task requires investigation, context-sensitive judgement, multiple tools, or adaptive next steps. Examples include researching a broad topic, debugging a failing test suite, triaging a customer complaint, or exploring an unfamiliar codebase.

The Agent SDK documentation describes the loop as Claude evaluating a prompt, calling tools, receiving tool results, and repeating until the task is complete: [https://code.claude.com/docs/en/agent-sdk/agent-loop](https://code.claude.com/docs/en/agent-sdk/agent-loop)

### When Not to Use Agentic Architecture

Do not use agentic architecture when the task is simple, deterministic, and better handled by fixed application logic.

Examples include:

- A static form validation rule
- A schedule data export
- A simple notification workflow
- A direct database lookup with no ambiguity
- A required compliance check that must always run
- A fixed approval process with no adaptive reasoning

For these cases, traditional application logic may be safer, cheaper, easier to test, and easier to audit.

Common CCA-F use cases include:

- Customer support resolution agents
- Multi-agent research systems
- Developer productivity agents
- Codebase exploration agents
- Automated test-generation workflows
- Structured data extraction pipelines
- CI/CD review assistants

### Key Design Considerations

- **Guardrails:** because agentic systems can take actions, they need guardrails. Guardrails may include tool permissions, hooks, structured validation, human approval, and escalation rules.
- **Tool Scope:** an agent should not have every possible tool by default. Too many tools can increase decision complexity and create safety risks.
- **Observability:** a production agent should be observable. The system should record which tools were called, what results were returned, when an escalation occurred, and why the final decision was made.
- **Escalation:** an agent should know when not to continue. Escalation is appropriate when user intent is unclear, policy is ambiguous, required information is missing, tool failures prevent meaningful progress, or the user explicitly asks for a human.
- **Context Management:** long-running agents must manage context carefully. Verbose tool results, repeated file reads, and unstructured summaries can make the session harder to reason over. Use concise tool results, structured facts, and subagents where appropriate.

### Common Anti-Patterns

Avoid these design mistakes:

- Treating every Claude application as an agentic system
- Giving the agent too many tools without restrictions
- Relying only on prompts for mandatory compliance rules
- Allowing state-changing tools without approval or validation
- Returning large raw tool outputs to Claude without filtering
- Designing agents that cannot escalate
- Assuming subagents automatically inherit all parent context
- Using agentic workflows for simple deterministic processes
- Failing to log tool use and decisions
- Letting an agent continue indefinitely without limits or budget controls

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="b-agentic-loop-lifecycle"></a>

## B. Agentic Loop Lifecycle

### Agent Loop Definition

An agentic loop is the repeated cycle in which Claude receives a task, reasons about the current state, decides whether to call a tool, receives the tool result, and continues until the task is complete. In a simple one-turn interaction, Claude may answer directly. In an agentic workflow, Claude may need several reasoning and tool-use turns before producing a final answer.

Antropic's Agent SDK documentation describes the agentic loop as the same autonomous execution cycle that powers Claude Code. In that cycle, Claude receives the prompt together with the system prompt, tool definitions, and conversation history; evaluates the current state; requests tools when needed; receives the results; and repeats until the task is complete. The SDK documentation presents the loop in five stages: receive a prompt, evaluate and respond, execute tools, repeat, and return a result.

Example pattern:

```
User Request:
Fix the failing authentication tests.

Claude:
Runs the test suite.

Tool Result:
Three authentication tests failed.

Claude:
Read the relevant source and test files.

Tool Result:
auth.ts and auth.test.ts are returned.

Claude:
Edits the source file.

Tool Result:
File updated.

Claude:
Run the tests again.

Tool Result:
All tests passed.

Claude:
Returns the final summary.
```

This pattern is important for CCA-F because many exam scenarios involve workflows where Claude must decide the next action based on intermediate tool results, not merely follow a fixed script.

The most important conceptual point is that an agentic loop is iterative. A Claude-powered agent is not a one-shot request-responses system if tools are involved. A single task may require several turns, and each turn changes what Claude knows. Anthropic defines a turn as one round trip in which Claude produces output that include tool calls, the SDK runs those tools, and the results feed back into Claude automatically. The loop ends only when Claude produces output with no tool calls.

This distinction is central to the CCA-F exam's idea of "autonomous task execution". In a traditional fixed workflow, the application already knows the sequence of operations. In an agentic loop, the application provides Claude with tools and context, and Claude decides what to do next after seeing intermediate results. That is why the loop is treated as an architectural pattern rather than a mere programming convenience.

### Stop Reasons as Control Signals

The `stop_reason` is the control signal that tells your application why Claude stopped generating a given response. Anthropic's Messages API documentation states that `stop_reason` is part of every successful response and indicates why Claude completed generation, as distinct from an API failure.

When `stop_reason` is "tool_use", Claude is not finished. It is explicitly asking the application to execute one or more client-side tools. Anthropic's documentation says that in this case Claude is "calling a tool and expects you to execute it." In practical terms, "tool_use" means "continue the loop." You must examine the "tool_use" blocks, run the requested operation, and then return the result to Claude so it can decide what to do next.

When `stop_reason` is "end_turn", Claude has finished its response naturally. Anthropic labels this as the most common stop reason and shows it as the signal for processing a complete response. In practical terms, "end_turn" means "stop the loop and return the final answer," unless another documented stop reason such as `max_tokens`, `pause_turn`, or `model_context_window_exceeded` applies. For Domain 1, however, the official exam guide explicitly singles out the "tool_use" versus "end_turn" distinction as required knowledge and skill.

Example (Python):

```
if response.stop_reason == "tool_use":
    # execute tool(s), append results, continue loop
elif response.stop_reason == "end_turn":
    # final response, terminate loop
else:
    # handle other documented stop reasons appropriately
```

That logic is consistent with both Anthropic's stop-reason guidance and the official exam blueprint. One nuance worth knowing is that Anthropic documents an implementation hazard around "end_turn" after tool results. If tool results are formatted incorrectly, especially if extra text is inserted in the wrong place, Claude can return an empty response with `stop_reason: "end_turn"` because it interprets the assistant turn as already complete. That is not a signal that the model "failed to think"; it is often a message-formatting bug.

### Returning Tool Results and Updating Conversation History

The CCA-F exam guide states that tool results must be appended to conversation history so the model can reason about the next action. Anthropic's SDK documentation says the same thing in operational terms: each set of tool results feeds back to Claude for the next decision. Without that update, there is no real loop.

Anthropic distinguishes between client tools and server tools. For client tools, Claude returns `stop_reason: "tool_use"` together with one or more `tool_use` blocks; your application executes the tool and sends back a `tool_result`. For server tools such as `web_search`, `web_fetch`, `code_execution`, and `tool_search`, Anthropic executes the tool on its own infrastructure and integrates the results directly into the response. This distinction matters because only the client-tool path requires your application to manually continue the conversation with a `tool_result`.

In a manual Messages API implementation, the documented sequence is precise. After receiving a client tool request, you extract the tool's name, id, and input; execute the tool in your own code; then continue the conversation with a new user message containing a `tool_result` block that references the original `tool_use_id`. Anthropic further specifies two formatting requirements: the tool result must immediately follow the assistant's tool-use message in the message history, and within the user message the `tool_result` blocks must come first in the content array, with any text appearing only after all tool results. If you violate that ordering, Anthropic warns that the API can return a 400 error.

That requirement explains why the official exam guide emphasizes "conversation history updates" rather than merely "tool execution." The architectural unit is not "Claude called a tool." The architectural unit is "Claude called a tool, the tool executed, and the result was reintroduced into the structured conversation so Claude could reason from it." A loop that executes tools but does not return their results is incomplete and unreliable by design.

Anthropic also documents a particularly relevant mistake: adding free text immediately after `tool_result` can lead to empty "end_turn" responses because Claude learns that the user will provide explanatory text instead of expecting the model to continue reasoning. The safer pattern is to send tool results directly, with no unnecessary narrative inserted between the tool use and the tool result.

Example of documented manual loop pattern (Python):

```
messages = [{"role": "user", "content": user_query}]
while True:
    response = client.messages.create(
        model="claude-opus-4-8",
        max_tokens=1024,
        messages=messages,
        tools=tools
    )
    if response.stop_reason == "tool_use":
        tool_results = execute_tools(response.content)
        messages.append({"role": "assistant", "content": response.content})
        messages.append({"role": "user", "content": tool_results})
    elif response.stop_reason == "end_turn":
        return response
    else:
        return handle_other_stop_reason(response)
```

This structure closely follows Anthropic's own manual examples for tool workflows and stop-reason handling.

### Model-Driven Orchestration Versus Preconfigured Flows

A major conceptual distinction in Task Statement 1.1 is the difference between model-driven tool selection and pre-configured flows. The exam guide states this directly: Claude should reason about which tool to call next based on context, rather than simply following a pre-wired decision tree or hard-coded tool sequence.

Anthropic's tool-use documentation explains this behavior through `tool_choice`. With the default setting of `{"type": "auto"}`, Claude decides on each turn whether to call a tool or respond directly. Anthropic says Claude calls a tool when the request maps to that tool's described capability and the answer is not already in context; it answers directly for stable knowledge, creative tasks, and ordinary conversational turns. In other words, tool invocation under auto is contextual and model-driven, not mechanically predetermined.

This is what makes an agentic loop different from a scripted pipeline. In a hard-coded flow, the application might always call `get_customer`, then `lookup_order`, then `process_refund`, regardless of what the intermediate results show. In a model-driven loop, Claude can inspect the first result and decide that a clarifying question is needed, that a different tool is relevant, or that escalation is more appropriate than another backend operation. That adaptive reasoning is exactly what the exam is testing when it contrasts agentic loops with preconfigured sequences.

At the same time, model-driven does not mean uncontrolled. Anthropic documents that you can nudge or constrain behavior with prompt wording and `tool_choice`, and other exam task statements make clear that deterministic rules should be enforced programmatically when compliance or safety requires it. For this subsection, the key architectural lesson is simpler: use the loop to let Claude choose the next best action from context, but do not confuse that flexibility with a license to skip required controls elsewhere in the system.

### Anti-Patterns and Implementation Guidance

The exam guide is unusually explicit about what not to do. It warns against parsing natural-language signals to determine loop termination, using arbitrary iteration caps as the primary stopping mechanism, and checking assistant text content as a completion indicator. These are anti-patterns because they try to infer control state from surface output rather than from the documented contract of `stop_reason`. If Claude writes "I'm done," that is not the canonical signal. The canonical signal is `stop_reason`.

Anthropic's stop-reason guidance reinforces that best practice by explicitly recommending that developers always check `stop_reason` in response-handling logic. The docs even provide example branching logic that handles "tool_use" separately from "end_turn" and other stop reasons. This is the correct mental model for CCA-F: loop control should be driven by structured protocol fields, not by heuristics over assistant prose.

Another subtle anti-pattern is to treat `max_turns` as the primary definition of task completion. Anthropic's Agent SDK provides `max_turns` and budget controls for production safety, and the SDK documentation explains that `max_turns` counts tool-use turns only. Those controls are useful guardrails for cost and runaway behavior, but they are not the semantic signal that the task is complete. The loop's true completion condition is still Claude producing a response with no further tool calls, typically reflected as "end_turn" in a manual API loop or a final text-only assistant response in the SDK.

Formatting mistakes are another class of anti-pattern because they masquerade as reasoning failures. Anthropic states that tool results must immediately follow the corresponding tool-use message and must appear first in the user content array; otherwise the API may reject the request. The same documentation warns that adding text after tool results can provoke empty "end_turn" responses. From a system-design point of view, these are not cosmetic issues. Message ordering is part of the execution protocol.

A sound exam-ready rule of thumb is therefore this: use `stop_reason` to decide whether to continue or terminate; use `max_turns` and budget as safety rails, not completion detectors; preserve assistant `tool_use` and user `tool_result` messages in the correct order; and never rely on natural-language phrasing or vague assistant text as your loop-control mechanism.

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="c-coordinator-subagent-orchestration"></a>

## C. Coordinator-Subagent Orchestration

### Coordinator as hub and subagents as spokes

The official exam guide describes the recommended architecture as hub-and-spoke: a coordinator agent sits at the center and manages inter-subagent communication, error handling, and information routing. It is the authority that determines what work exists, what work has been completed, and how partial findings should be merged into a final answer.

Anthropic's subagents documentation supports this model technically. It explains that subagents are distinct agent instances designed for focused subtasks, and it highlights three benefits that matter directly to orchestration design: context isolation, parallelization, and specialized instructions. A subagent can therefore be treated as a role-bounded worker rather than as a second copy of the parent agent. This is what allows a coordinator to assign one agent to current web sources, another to document analysis, and another to synthesis without crowding the main conversation with all intermediate reasoning.

A further implementation detail strengthens the hub-and-spoke reading: in the current SDK, subagents cannot spawn their own subagents. Anthropic explicitly instructs developers not to include the Agent tool in a subagent's tool list. In practice, that means the coordinator remains the single orchestrator, which simplifies observability, permissions, and failure handling. Architecturally, this is useful because it prevents uncontrolled nested delegation trees and keeps ownership of workflow state at the center.

This design should be understood as a deliberate contrast with a peer-to-peer multi-agent mesh. A mesh may appear flexible, but it obscures provenance, complicates retries, and makes it difficult to determine which agent had authority over which decision. The exam guide's emphasis on routing all subagent communication through the coordinator reflects the opposite priority: controlled information flow, consistent recovery logic, and auditability.

### Context isolation and explicit handoff design

One of the most important exam facts in this area is that subagents do not automatically inherit the coordinator's conversation history. Anthropic's documentation states that each subagent starts in its own fresh conversation, and that the only direct channel from parent to subagent is the Agent tool's prompt string. The subagent does not receive the parent's conversation history or tool results unless those are explicitly included in that prompt.

This has major architectural consequences. A coordinator cannot delegate by saying, in effect, "analyze the issue from earlier." It must hand off the relevant facts directly: the problem statement, the scope of work, the specific files or sources to inspect, the constraints, and any findings already produced by other agents. If the coordinator omits those elements, the system does not fail gracefully; it fails by giving the subagent an underspecified problem and inviting hallucinated assumptions. The exam guide turns this into a tested skill by requiring candidates to understand that context must be passed explicitly and that subagents operate with isolated state.

Anthropic's docs add another important nuance: the parent does not receive the subagent's full internal transcript. Intermediate tool calls and tool results stay inside the subagent, and only the subagent's final message returns to the coordinator as the Agent tool result. This is excellent for keeping the main context window smaller, but it also means that if the coordinator needs provenance, citations, timestamps, or structured metadata for later synthesis, the subagent's final output must include those explicitly. Otherwise, the coordinator receives a clean summary but loses the traceability needed for downstream reasoning.

For exam purposes, the correct design implication is straightforward: when subagents contribute evidence that will later be merged, their outputs should be structured, bounded, and attribution-preserving. The coordinator should treat every subagent return as a formal handoff artifact, not as a casual chat reply. That principle also anticipates adjacent exam topics on context passing and provenance preservation.

### Dynamic delegation, partitioning, and synthesis

The exam guide is explicit that a coordinator should dynamically select which subagents to invoke, rather than always routing every request through a fixed pipeline. This matters because not all tasks justify the same orchestration cost. A simple request may need only one specialized worker; a broad investigative request may need several. The core design judgment is therefore selective delegation, guided by the shape of the question and the type of evidence required to answer it.

Current Anthropic documentation provides the mechanism for that behavior. Claude decides whether to invoke a subagent based primarily on the subagent's description field, and developers can also force a specific subagent by naming it explicitly in the prompt. The same docs also show that agent definitions can be created dynamically at runtime, which means a coordinator can vary prompt strictness, model choice, or tool scope depending on the job. These details are architecturally important because they show that "dynamic delegation" is not only an exam concept; it is directly supported in the SDK.

Partitioning strategy is the second half of delegation quality. The exam guide warns that overly narrow decomposition by the coordinator produces incomplete coverage of broad topics. The guide's own sample scenario makes this concrete: when asked to research the impact of AI on creative industries, a flawed coordinator decomposed the topic into "digital art creation," "graphic design," and "photography," causing the final report to miss music, writing, and film. The problem was not that the subagents performed poorly; it was that the coordinator created the wrong decomposition boundary.

A sound coordinator therefore partitions work in ways that are both distinct and collectively sufficient. In practice, that often means splitting by source type (web sources versus documents), by domain slice (music, writing, film, visual arts), or by analytic function (search, analysis, synthesis, report generation). Anthropic's subagent docs support these designs by emphasizing specialized prompts, parallel subagent execution, and restricted tool sets matched to each role. A document reviewer may need Read, Grep, and Glob; a test-runner may need Bash; a synthesis agent may need no wide-open search tools at all.

The coordinator's aggregation role is just as important as its delegation role. After receiving subagent outputs, it must reconcile overlaps, identify contradictions, remove duplication, and determine whether the combined answer satisfies the user's scope. In a research system, that means verifying that the final synthesis covers the requested landscape rather than merely assembling four independent summaries into one longer document. The exam guide describes this as result aggregation plus a decision about whether additional subagent work is needed.

### Iterative refinement, observability, and scale boundaries

The strongest version of this architecture is not one-pass delegation. It is an iterative refinement loop. The exam guide specifically calls for a coordinator that evaluates synthesis output for gaps, re-delegates targeted follow-up queries to search or analysis agents, and then re-invokes synthesis until coverage is sufficient. This is one of the clearest exam signals that orchestration is about supervision, not one-time fan-out.

In practical terms, the loop is straightforward. The coordinator decomposes the task, launches the relevant subagents, gathers their results, performs a coverage review, and asks whether any required dimension remains thin, missing, or weakly supported. If the answer is yes, it sends targeted follow-up tasks rather than rerunning the entire workflow blindly. That pattern improves both quality and cost control because it narrows the second pass to the actual gap instead of repeating already-sufficient work. The exam guide treats this targeted redelegation pattern as a tested skill.

Routing all communication through the coordinator is also the cleanest way to maintain observability. Since only the coordinator sees the full task graph, it is the only agent that can reliably answer questions such as which subagents ran, which ones failed, whether there are unresolved gaps, and which findings reached the final synthesis. Anthropic's docs reinforce this by showing that subagents return only final messages to the parent and by exposing subagent invocation through `tool_use` blocks for the Agent tool. In other words, the coordinator is both the logical and the inspectable control point.

There is also an important production boundary. Anthropic notes that ordinary subagent delegation works well for a few delegated tasks per turn, but for workflows coordinating dozens to hundreds of agents, the recommended pattern is the Workflow tool, which moves orchestration outside the main conversation context. That recommendation is useful because it clarifies the scale at which coordinator–subagent interaction remains the right abstraction. For CCA-F, the tested pattern is still the conversational coordinator, but in production architecture discussions it is worth knowing where that pattern begins to strain.

### Common pitfalls and authoritative sources

The most common failure mode in this domain is treating decomposition as a purely mechanical split rather than as a coverage design problem. The exam guide's "creative industries" example shows that if the coordinator frames the task too narrowly, every downstream component can succeed locally while the system fails globally. The second common mistake is assuming subagents share the parent's state implicitly; Anthropic's current docs explicitly say they do not. The third is letting every request traverse the entire pipeline regardless of complexity, even though the exam guide says the coordinator should invoke subagents dynamically based on need.

A fourth pitfall is over-permissive tool design. Anthropic's permissions documentation explains that `allowedTools` can be used to lock subagents down and that permissive modes such as `bypassPermissions` are inherited by subagents and cannot be relaxed per subagent. That matters in orchestration because a coordinator with broad autonomy can accidentally create a fleet of equally broad workers unless permissions and tool scopes are deliberately constrained. In a formal architecture review, that is a governance issue as much as a technical one.

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="d-subagent-invocation-context-passing"></a>

## D. Subagent Invocation & Context Passing

### How subagents are spawned

In the current Claude Agent SDK, subagents are invoked through the Agent tool. Anthropic's official SDK examples say to include Agent in `allowedTools` so Claude can auto-approve subagent invocation without a permission prompt. The same page shows the standard programmatic pattern: define subagents in the `agents` parameter, then give the parent agent permission to invoke them by allowing Agent. The docs also note that even if you do not define a custom subagent, Claude can still invoke the built-in general-purpose subagent through the Agent tool.

That is the modern SDK behavior, but the official docs also preserve the historical naming bridge. Anthropic states that the tool name was renamed from Task to Agent in v2.1.63, and that existing `Task(...)` references in settings and agent definitions still work as aliases. In other words, if a question or study note says a coordinator must include "Task" in `allowedTools`, the implementation idea is still the same: the parent agent must be permitted to spawn subagents. In current SDK examples, that permission is expressed as Agent; in older exam phrasing, it may still appear as Task.

There is a second important spawning nuance: current Anthropic guidance increasingly favors descriptive delegation over rigid hard-coding. The SDK docs say Claude decides when to invoke a subagent based on the task and the subagent's description, while explicit prompt mentions such as "Use the code-reviewer agent" force a specific delegation. That means a coordinator can either let Claude choose dynamically based on descriptions or explicitly name a specialized worker when correctness requires it.

### What context a subagent does and does not receive

The single most important fact in this topic is that a subagent does not automatically inherit the coordinator's conversation history. Anthropic's SDK docs are explicit: a subagent starts with a fresh context window, and the only direct parent-to-subagent channel is the Agent tool's prompt string. The docs say the parent must include any file paths, error messages, decisions, or other information the subagent needs directly in that prompt. They also state that the subagent does not receive the parent's conversation history or tool results.

That does not mean the subagent starts from absolute zero. The current docs describe a more precise model: the subagent receives its own system prompt, the delegation message, and tool definitions; in Claude Code it can also receive project CLAUDE.md, memory, and some session environment information depending on the subagent type. Anthropic also documents an important exception: built-in Explore and Plan agents skip CLAUDE.md and git status, so if a project rule absolutely must reach those agents, you should restate it in the delegation prompt.

This has a very practical implication for CCA-F-style architectures. If the coordinator already has twelve findings from prior tools or prior agents, a prompt like "continue the earlier analysis" is weak, because the subagent cannot see what "earlier" means unless that content is passed explicitly. Anthropic's prompting guidance reinforces this: for complex tasks, the model performs better when instructions, context, examples, and variable inputs are clearly separated, ideally with structured tags. Combined with the subagent docs, the correct architectural conclusion is that context passing is an explicit handoff design problem, not an automatic memory feature.

The return path is also constrained. The parent conversation does not get the subagent's full internal transcript by default; it gets the subagent's final message as the agent tool result. Anthropic notes that the parent may then summarize that result further in its own response. If you need the exact wording preserved, the docs recommend telling the parent to preserve the subagent output verbatim. For orchestration design, this means the subagent's final report is the safest artifact to capture and pass forward to later workers.

### How to define subagents well

Anthropic's current SDK documentation makes the AgentDefinition shape very clear. At minimum, a subagent should have a `description` and a `prompt`. The description tells Claude when to use the agent; the prompt defines the subagent's role, behavior, and expertise. Anthropic's examples then layer in restricted `tools`, optional `disallowedTools`, optional model overrides, skills, memory, MCP servers, `maxTurns`, `permissionMode`, and other controls. The key exam-aligned idea is simple: a subagent should be defined as a focused specialist with a clear job description and an appropriately narrow capability envelope.

The official docs also make tool restriction behavior explicit. If you omit the `tools` field, the subagent inherits all available tools by default. If you specify `tools`, the subagent is restricted to that allowlist. If you specify `disallowedTools`, those are removed from the inherited or explicit set. Anthropic further documents that if both are present, `disallowedTools` is applied first and then `tools` are resolved against what remains. This matters because exam questions often hide the real issue inside capability scope: a reviewer agent should not quietly inherit file write or shell execution if it only needs Read, Grep, and Glob.

A strong current-era design also uses descriptions strategically. Anthropic says Claude uses the description field to decide when to delegate and recommends writing clear, specific descriptions so tasks match the right subagent. That is why "expert code reviewer" is weaker than "expert code review specialist; use for quality, security, and maintainability reviews," and why "research agent" is weaker than "finds and summarizes policy evidence with citation metadata." The better the description, the less the coordinator has to micromanage.

There is one subtle but important version caveat here. The current subagent SDK docs still say "Subagents cannot spawn their own subagents" and advise not to include Agent in a subagent's tools array. But the official Claude Code changelog for June 10, 2026 says the opposite: "Sub-agents can now spawn their own sub-agents (up to 5 levels deep)." The most reasonable interpretation is that the changelog reflects a newly shipped capability and the conceptual docs have not fully caught up yet. For live systems, you should trust your installed version and recent changelog; for certification study, you should expect questions to follow the more stable principles in the guide you are studying unless the exam explicitly mentions the new behavior.

### Forks, resumes, and parallel work

There are really two different "fork" ideas you need to distinguish. At the session level, the Agent SDK's session guide says "fork" creates a new session that starts with a copy of the original session's history while leaving the original unchanged. Anthropic recommends this when you want to try an alternative approach without losing the original path. That maps cleanly to the exam idea of exploring divergent approaches from a shared analysis baseline.

At the subagent level, Claude Code documents a special kind of forked subagent that inherits the entire conversation so far instead of starting from a fresh context window. Anthropic explains that this drops the normal input isolation, which is precisely why forks are useful when a named subagent would need too much background to be effective. The same docs say a fork sees the same system prompt, tools, model, and message history as the main session, while its own tool calls still stay out of the parent conversation and only its final result is returned. Anthropic also notes that a fork can use isolation: "worktree," so edits happen in a separate git worktree rather than the parent checkout.

Resumption is related but different. Anthropic's subagent SDK docs say resumed subagents retain their full conversation history, including prior tool calls and reasoning, and continue where they left off rather than starting fresh. The official pattern is to capture the parent `session_id`, extract the subagent's `agentId` from the Agent tool result, and then resume the same session with a prompt that names the agent to continue. Anthropic also documents that the built-in Explore and Plan agents are one-shot and do not return an `agentId`, so if you know you will need resumability, you should use a custom subagent or general-purpose instead.

Parallelism is the other major practical skill in this topic. Anthropic's SDK docs say multiple subagents can run concurrently so independent subtasks finish in the time of the slowest one rather than the sum of all of them. The Claude Code docs give the exact kind of example that maps well to exam scenarios: researching the authentication, database, and API modules in parallel using separate subagents. Anthropic's broader prompting guidance also explicitly recommends parallel tool calls when there are no dependencies between them. So when a study guide says a coordinator should emit multiple Task calls in one response to fan out independent work, the current public docs frame the same core idea as concurrent subagents and parallel tool execution.

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="e-multi-step-workflow-enforcement-handoff"></a>

## E. Multi-Step Workflow Enforcement & Handoff

### Programmatic Enforcement vs. Prompt Guidance

Prompt guidance tells Claude what it should do. Programmatic enforcement controls what the system allows Claude to do.

Prompt instructions are useful for tone, style, preferences, and general behavior. For example, a system prompt can instruct Claude to be concise, explain decisions clearly, or ask clarifying questions when information is missing. However, prompt instructions should not be the only control for operations that must never happen out of order.

Programmatic enforcement is required when a rule must be guaranteed. Examples include identity verification before financial actions, blocking refunds above a threshold, preventing unauthorized account changes, or requiring human approval before sensitive operations. The exam guide specifically identifies prerequisite gates and hooks as enforcement mechanisms for workflow ordering.

| Requirement | Recommended Control |
| --- | --- |
| Use a friendly support tone | Prompt guidance |
| Ask clarifying questions when needed | Prompt guidance |
| Verify customer identify before refund | Programmatic prerequisite gate |
| Block process_refund before get_customer succeeds | Programmatic enforcement |
| Escalate refunds above a threshold | Hook or prerequisite gate |
| Summarize case details for a human agent | Structured handoff protocol |

★

**EXAM TIP:** A common exam trap is choosing to "improve the prompt" when the workflow requires deterministic compliance. If the consequence of failure is financial, legal, security-related, or customer-impacting, a prompt alone is usually not sufficient.

### Deterministic Compliance

Deterministic compliance means the system enforces a rule every time, regardless of how Claude interprets the prompt. In agentic workflows, Claude may decide which tool to call next based on context, but the application should still prevent invalid or unsafe tool calls.

For example, a support agent may have access to the following tools:

- `get_customer`
- `lookup_order`
- `process_refund`
- `escalate_to_human`

A prompt might say:

```
get_customer
lookup_order
process_refund
escalate_to_human
```

This is helpful, but it does not guarantee compliance. A stronger architecture adds a prerequisite gate:

**Rule:** Block `process_refund` unless `get_customer` has returned a verified customer ID.

If Claude attempts to call `process_refund` before customer verification, the system blocks the tool call and returns a controlled response, such as the following:

Example (JSON):

```
{
"allowed": false,
"reason": "Customer verification is required before processing a refund.",
"next_action": "Call get_customer or escalate_to_human."
}
```

### Prerequisite Gate Pattern

A prerequisite gate is a programmatic rule that prevents a downstream action until one or more required upstream steps have completed successfully.

Example (Refund Workflow):

```
Step 1: get_customer
Required result: verified_customer_id

Step 2: lookup_order
Required result: valid order associated with verified customer

Step 3: check refund policy
Required result: eligible refund or escalation condition

Step 4: process_refund
Allowed only if all prerequisites are satisfied
```

In this pattern, Claude can still reason about the customer's issue, choose tools, and explain the resolution. However, it cannot bypass required verification steps.

Example (Gate Logic):

```
If process_refund is requested:
    Check whether verified_customer_id exists.
    Check whether order_id belongs to verified_customer_id.
    Check whether the refund amount is within policy.

    If checks pass:
        Allow process_refund.
    If checks fail:
        Block process_refund and return the required next action.
```

This makes the workflow reliable because the system enforces the rule rather than relying only on Claude to remember it.

### Hooks for Enforcement

Hooks can also be used to intercept tool calls and enforce business rules. While prerequisite gates are often used to enforce step ordering, hooks are useful when the system must inspect or modify a tool call before it executes.

Examples include:

- Blocking refunds above $500
- Preventing changes to restricted account fields
- Requiring human approval for sensitive operations
- Blocking destructive file or database actions
- Normalizing or validating tool input before execution

The exam guide connects this concept to later Domain 1 topics by describing hooks as a way to enforce compliance rules, such as blocking refunds above a threshold, and choosing hooks over prompt-based enforcement when business rules require guaranteed compliance.

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="f-agent-sdk-hooks-for-tool-interception-data-normalization"></a>

## F. Agent SDK Hooks for Tool Interception & Data Normalization

Hooks are the primary mechanism for deterministic enforcement in Claude Code and the Agent SDK. They allow developers to insert application-layer logic at specific points in the tool execution lifecycle without relying on model compliance. Understanding hooks is essential for the CCA-F exam because many scenarios test the ability to distinguish between what prompts can guarantee and what only hooks can guarantee.

Anthropic's documentation defines hooks as user-defined shell commands that execute at specific points in Claude's processing. They are not suggestions to the model, they run regardless of what the model decides. This makes them the correct enforcement mechanism whenever a rule must apply on every tool call, not most of them.

### PreToolUse Hooks

PreToolUse hooks execute before a tool call runs. They receive the tool name and input parameters and can allow, block, or modify the call before it reaches the tool execution layer. A PreToolUse hook is the correct choice when the goal is to prevent a tool call from running unless certain conditions are met, for example, blocking a file deletion unless a backup confirmation exists or preventing a database write unless an authorization check has passed.

When a PreToolUse hook returns exit code 2, the tool is blocked even in `bypassPermissions` mode or with `--dangerously-skip-permissions`. This makes PreToolUse hooks the strongest enforcement mechanism available in Claude Code.

### PostToolUse Hooks

PostToolUse hooks execute after a tool call completes. They receive the tool name, the input that was used, and the output the tool produced. They can inspect the output, transform it, log it, or trigger follow-up actions. A PostToolUse hook is the correct choice when the goal is to ensure something happens after every tool invocation, for example, running a linter after every file edit, validating a tool output schema before returning it to Claude, or appending an audit log entry after every write operation.

A common PostToolUse configuration runs ESLint after every file modification using a matcher that targets Edit and Write tool calls. The hook fires unconditionally every time either tool completes, regardless of what Claude decided to do with the file.

### Hook Matchers

A hook matcher specifies which tool calls the hook applies to. Matchers allow developers to write focused hooks that target specific tools rather than intercepting every tool call in the session.

- A matcher targeting a single tool name, for example, `Edit` applies only to Edit tool calls.
- A pipe-separated list, for example, `Edit|Write` applies to both Edit and Write calls.
- An empty matcher applies to all tool calls in the session.

Correct matcher design is tested on the CCA-F exam. Overly broad matchers can introduce performance overhead and unintended side effects. Overly narrow matchers may miss the tool calls they were intended to intercept. The correct design matches the enforcement scope: if a linting rule must apply to every file modification operation, the matcher should cover all file-writing tools.

### Using Hooks for Data Normalization

PostToolUse hooks are especially useful for data normalization, the process of transforming raw tool output into a consistent format before Claude processes it. This has two benefits: it reduces the cognitive load on the model by removing irrelevant fields, and it ensures that downstream processing logic receives consistently formatted inputs regardless of which version of a tool or external service produced the output.

A normalization hook might strip unnecessary fields from a large API response, convert timestamps to a standard timezone, normalize status codes to a defined vocabulary, or extract the relevant portion of a large document chunk before returning it to Claude's context. The goal is to reduce noise, improve consistency, and prevent context bloat from verbose raw outputs.

### Hooks vs. CLAUDE.md — The Enforcement Spectrum

The CCA-F exam frequently presents scenarios in which a team has written a CLAUDE.md rule requiring certain behavior and has found that the rule is followed most of the time but not always. The correct diagnostic is CLAUDE.md. Instructions are advisory. Claude processes them as context and generally follows them, but they are not binding at the system level. Strengthening the wording, adding "IMPORTANT" or "ALWAYS," may reduce violations but cannot eliminate them.

Hooks occupy the other end of the enforcement spectrum. They execute unconditionally at the application layer and cannot be bypassed by prompt context, model reasoning, or session-level instructions. When a rule must be applied on every tool call without exception, it belongs in a hook.

Path-scoped rules and skills also exist between these two extremes, but they are still advisory. They load context conditionally and improve relevance, but they share the same compliance properties as CLAUDE.md: they guide the model rather than enforce behavior programmatically.

★

**EXAM TIP:** The advisory-versus-deterministic distinction is one of the highest-frequency patterns in Domain 1 and Domain 3 questions. Any scenario that describes intermittent rule violations despite clear CLAUDE.md instructions is signaling that a hook is needed. Any scenario that asks which mechanism guarantees consistent enforcement is testing this distinction directly.

Resources

[Hooks Guidehttps://docs.anthropic.com/en/docs/claude-code/hooks-guide](https://docs.anthropic.com/en/docs/claude-code/hooks-guide)[Memoryhttps://docs.anthropic.com/en/docs/claude-code/memory](https://docs.anthropic.com/en/docs/claude-code/memory)[Agent Sdkhttps://docs.anthropic.com/en/docs/agents-and-tools/agent-sdk](https://docs.anthropic.com/en/docs/agents-and-tools/agent-sdk)

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="g-task-decomposition-strategies"></a>

## G. Task Decomposition Strategies

Task decomposition is the process of breaking a complex goal into smaller units of work that can be assigned to subagents or handled in separate passes. It is one of the most important design skills in multi-agent architecture because the quality of decomposition directly determines the quality of the final output. A coordinator that decomposes well produces complete, non-overlapping subtasks that collectively cover the goal. A coordinator that decomposes poorly produces gaps, overlaps, or subtasks that cannot be independently verified.

The CCA-F exam tests decomposition as a judgment skill, not a mechanical one. Candidates are expected to evaluate a given decomposition and identify whether it covers the problem adequately, whether its partitions are genuinely independent, and whether the coordinator has the information it needs to verify completion.

### Decomposition Dimensions

Tasks can be decomposed along several dimensions. The correct dimension depends on the nature of the task, not on convenience.

**Domain decomposition** splits a broad topic into subject-matter slices. For a research task on the impact of AI on industries, domain decomposition produces partitions such as music, writing, film, visual arts, and commerce, not vague partitions such as "online" and "offline" that do not correspond to the structure of the subject matter. The exam guide uses the creative industries example to illustrate the failure of domain-shallow decomposition: if the coordinator decomposes into graphic design, digital art, and photography, the final synthesis omits music, writing, and film entirely. The decomposition appeared complete at design time but was not collectively sufficient.

**Source-type decomposition** splits a task by the type of evidence required. A research coordinator might send one subagent to gather current web sources, another to analyze internal documents, and another to query a structured database. Each subagent specializes in accessing and interpreting one type of source, and the coordinator synthesizes across all three. This avoids context window saturation by keeping raw gathering work isolated from synthesis reasoning.

**Functional decomposition** splits a task by stage of processing. A document extraction pipeline might decompose into a retrieval stage, a parsing stage, a validation stage, and a formatting stage. Each stage performs one function and passes a structured handoff to the next. Functional decomposition is most appropriate for sequential pipelines where each stage's output is a prerequisite for the next.

### Parallelism vs. Sequentiality

Not all decompositions are parallel. Some subtasks must wait for the results of others before they can begin. The coordinator is responsible for understanding these dependencies and scheduling subtasks accordingly.

Parallel decomposition is appropriate when subtasks are independent: each can proceed with only the information in its own context handoff, and its output does not depend on any other subagent's result. Parallel execution reduces total wall-clock time and is the preferred pattern for investigative or research workflows where multiple evidence streams can be gathered simultaneously.

Sequential decomposition is appropriate when one stage's output is required as input for the next. A verification stage must complete before an access stage begins. A data gathering stage must be complete before a synthesis stage can run. Forcing sequential stages to run in parallel will cause the downstream stage to hallucinate inputs it has not yet received.

Mixed workflows combine both: independent subtasks run in parallel within each phase, and phases are sequenced by dependency. The coordinator manages the phase boundaries and ensures that handoffs between phases are complete before the next phase begins.

### Verifying Decomposition Completeness

A correctly decomposed task has two properties: distinctness and collective sufficiency. Distinctness means each subtask covers a portion of the problem that no other subtask covers. Collective sufficiency means the subtasks together cover the entire problem. A gap in coverage means a dimension of the problem is never investigated, and the final synthesis will silently omit it.

The most practical way for a coordinator to verify collective sufficiency is to evaluate the synthesis output against the original task statement before returning it to the user. If a requested dimension is missing or thinly supported, the coordinator should identify which subagent was responsible for that area and either re-delegate a targeted follow-up or acknowledge the gap.

### When Not to Decompose

Decomposition introduces coordination overhead. Each subagent requires a context handoff, produces a result that must be parsed and integrated, and adds latency to the overall workflow. For simple tasks where a single agent has sufficient context and tools, decomposition provides no benefit and increases complexity.

The correct threshold for decomposition is when the task requires either context isolation, where the inputs and reasoning for one subtask would pollute or exhaust the context window if handled by the main agent, or specialization, where different subtasks require different tools, models, or instructional contexts that cannot be combined in a single agent configuration.

★

**EXAM TIP:** If a scenario describes a coordinator that produced an incomplete or imbalanced final synthesis, the root cause is almost always decomposition design. The fix is to redesign the decomposition so that partitions are genuinely distinct and collectively sufficient, not to instruct the coordinator more firmly.

Resources

[Sub Agentshttps://docs.anthropic.com/en/docs/claude-code/sub-agents](https://docs.anthropic.com/en/docs/claude-code/sub-agents)[Agent Sdkhttps://docs.anthropic.com/en/docs/agents-and-tools/agent-sdk](https://docs.anthropic.com/en/docs/agents-and-tools/agent-sdk)[Overviewhttps://docs.anthropic.com/en/docs/claude-code/overview](https://docs.anthropic.com/en/docs/claude-code/overview)

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="h-session-state-resumption-forking"></a>

## H. Session State, Resumption & Forking

In simple single-turn interactions, session state is not a concern. Claude receives a prompt, produces a response, and the interaction is complete. In agentic workflows, especially long-running ones involving codebase exploration, multi-phase research, or iterative development, session state is an architectural concern. The agent must maintain continuity across turns, recover from interruptions, and sometimes explore multiple approaches without losing the work invested in prior steps.

The CCA-F exam tests session state management as both a conceptual and a practical skill. Candidates are expected to understand the mechanisms available for preserving, resuming, and forking sessions, as well as when each mechanism is appropriate.

### Session Resumption

A session can be resumed by name when a prior session was named explicitly using the `--resume` flag or a session naming convention. Resumption allows the agent to continue from the last saved state without reprocessing the conversation history from scratch. This is particularly useful for codebase exploration tasks that have already completed an initial survey phase, research workflows that have gathered evidence in a prior session, and iterative development workflows where prior context reduces redundant tool calls.

The important distinction is between resuming a session and starting a new session with context manually re-injected. Session resumption uses the stored conversation history and tool results directly. Context re-injection requires the developer to summarize and pass the relevant state in the new session's initial prompt, which is less efficient and more prone to omission. When a task is too large to complete in a single session and continuity of prior tool results is important, session resumption is the correct pattern.

### Session Forking

Session forking creates a copy of the current session at a specific point in time and continues two separate explorations from that point. Forking is appropriate when two or more implementation approaches need to be evaluated in parallel, when the next step in a workflow is uncertain and both branches need to be explored before a decision is made, or when a risky operation needs to be tested in an isolated copy before being applied to the main session.

Forking preserves the shared history and tool results up to the fork point, which eliminates the need to re-gather context that both branches require. After the fork, each branch accumulates its own additional tool calls and results independently. The coordinator or developer can then compare the outcomes of both branches and select the better result.

A common exam pattern is a scenario where an engineer needs to try two different refactoring approaches to a codebase without committing to either. The correct answer is "session forking," not creating two separate sessions from scratch. Creating separate sessions requires re-establishing shared context from the beginning, while forking preserves the already-gathered state and begins the divergence at the decision point.

### Scratchpad Files for Long Sessions

The context window is finite. In a long-running agentic session, tool results, file contents, and conversation history accumulate and eventually approach or exceed the available context. When context fills, earlier information is displaced, and the agent may lose track of findings or decisions made earlier in the session.

Scratchpad files are a practical pattern for preserving session state across context limits. The agent writes its intermediate findings, decisions, and working notes to a file as it progresses. When context becomes constrained, the agent can use the `/clear` command to reset the conversation context and then re-read the scratchpad file to restore its working state. This allows indefinitely long workflows to proceed without losing the substance of prior work.

For exam purposes, the scratchpad pattern is the correct answer for scenarios involving long-running tasks that must survive context resets. Relying on session resumption alone does not address context window exhaustion within a session. Scratchpad files solve the within-session context saturation problem.

### Sub-Agent Spawning for Context Management

An alternative to scratchpad files is spawning a subagent for context-intensive sub-tasks. Instead of accumulating all tool results in the main session, the coordinator spawns a subagent to perform a bounded investigation, receives only the subagent's final output, and keeps the main session's context focused on coordination-level reasoning rather than raw evidence.

This is preferable to scratchpad files when the subtask involves reading many large files, running verbose commands, or performing multi-step searches that would saturate the main context. The subagent's internal processing, including all its intermediate tool calls and results, remains isolated in its own session, and only the structured summary returns to the coordinator.

### The /clear Command

The `/clear` command resets the current session's conversation context without terminating the session. It is appropriate when the accumulated context from prior turns is no longer needed and would only consume context window space. After `/clear`, the agent starts fresh from the system prompt, with no memory of prior tool calls unless they were preserved in a scratchpad file or a structured external artifact.

The important point: `/clear` solves context saturation but destroys continuity unless the agent has proactively written its working state to a persistent artifact. `/clear` without a scratchpad results in the agent restarting from scratch. `/clear` with a scratchpad allows the agent to restore its working state and continue making meaningful progress.

★

**EXAM TIP:** When a scenario involves a long-running task that is degrading in quality or becoming incoherent, the root cause is usually context saturation. The correct response depends on the type of task: if the task can be broken into bounded sub-tasks, spawn subagents. If the task must continue in a single session, combine `/clear` with a scratchpad file pattern.

Resources

[Overviewhttps://docs.anthropic.com/en/docs/claude-code/overview](https://docs.anthropic.com/en/docs/claude-code/overview)[Agent Sdkhttps://docs.anthropic.com/en/docs/agents-and-tools/agent-sdk](https://docs.anthropic.com/en/docs/agents-and-tools/agent-sdk)[Sub Agentshttps://docs.anthropic.com/en/docs/claude-code/sub-agents](https://docs.anthropic.com/en/docs/claude-code/sub-agents)

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="domain-1-agentic-architecture-orchestration-sample-questions"></a>

## Domain 1: Agentic Architecture & Orchestration Sample Questions

Question 1

Agents must interface with external data sources securely. The correct integration principle is:

1. Expose API keys in prompts.
2. Use secure connectors with scoped access.
3. Avoid external data entirely.
4. Only rely on user uploads.

**Correct Answer:** 2

Explanation:

Connectors allow Claude to access your apps and services, retrieve your data, and perform actions within those connected services. Claude inherits the permissions of each individual from the connected service. If someone is unable to access a specific file, channel, or record in the source system, then the connector will also be unable to access it through Claude.

Connector directory with trusted integrations

Nguồn tham khảo: Claude-Certified-Architect-Foundations-CCAR-F.pdf

Custom connector with scoped credentials

Nguồn tham khảo: Claude-Certified-Architect-Foundations-CCAR-F.pdf

Security is maintained by using scoped, authenticated connectors rather than including sensitive credentials inside the prompt text.

Using secure connectors with scoped access is the ideal integration principle for securely interfacing with external data sources. Secure connectors ensure that only authorized agents can access the data, and scoped access limits the data that can be retrieved, reducing the risk of data breaches.

Hence, the correct answer is: **Use secure connectors with scoped access.**

The option that says: *Expose API keys in prompts* is incorrect because exposing API keys in prompts is a security risk, as it can typically lead to unauthorized access to external data sources. It is not a recommended integration principle for securely interfacing with external data sources.

The option that says: *Avoid external data entirely* is incorrect because avoiding external data entirely may not always be feasible or practical, especially in scenarios where external data sources are essential for the functionality of the system. It is not a recommended integration principle as it may limit the capabilities of the system.

The option that says: *Only rely on user uploads* is incorrect because relying only on user uploads for data integration is not a secure or reliable method. User uploads can introduce security vulnerabilities and may not provide real-time access to external data sources. It is not a recommended integration principle for securely interfacing with external data sources.

References:

[12684923 Microsoft 365 Connector Security Guidehttps://support.claude.com/en/articles/12684923-microsoft-365-connector-security-guide](https://support.claude.com/en/articles/12684923-microsoft-365-connector-security-guide)[11176164 Use Connectors To Extend Claude S Capabilitieshttps://support.claude.com/en/articles/11176164-use-connectors-to-extend-claude-s-capabilities](https://support.claude.com/en/articles/11176164-use-connectors-to-extend-claude-s-capabilities)

Question 2

A team wants Claude to remember prior outputs within a session. The correct architectural component is:

1. Stateless prompts
2. Persistent context storage and retrieval
3. One‑shot summarization prompt
4. Manual transcript copy

**Correct Answer:** 2

Explanation:

Remembering prior outputs requires state management through persistent storage (like a scratchpad or database) to retrieve context in subsequent turns.

Persistent context across an active session

Nguồn tham khảo: Claude-Certified-Architect-Foundations-CCAR-F.pdf

Persistent context storage and retrieval allows Claude to store and recall information from previous interactions within a session. This architectural component enables Claude to remember prior outputs, making it the correct choice for the team's requirement.

Hence, the correct answer is: **Persistent context storage and retrieval.**

*Stateless prompts* is incorrect because stateless prompts do not retain any information or context from previous interactions within a session. They are primarily designed to generate responses based solely on the current input without any memory of past outputs. This choice does not align with the requirement of remembering prior outputs within a session.

*One‑shot summarization prompt* is incorrect because one‑shot summarization prompts are designed to provide a concise summary or response based on a single input without the need to remember or retain context from previous interactions. This choice does not support the team's goal of having Claude remember prior outputs within a session.

*Manual transcript copy* is incorrect because manual transcript copy typically involves manually copying and storing transcripts or outputs from each session, which is not an efficient or scalable solution for remembering prior outputs within a session. This choice does not provide an automated mechanism for Claude to retain and recall information from previous interactions.

References:

[Memoryhttps://platform.claude.com/docs/en/managed-agents/memory](https://platform.claude.com/docs/en/managed-agents/memory)[Memory Toolhttps://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool)

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="ngu-n-tham-kh-o"></a>

## Nguồn tham khảo

Foundations of Agentic Architecture

[Agent Sdkhttps://docs.anthropic.com/en/docs/agents-and-tools/agent-sdk](https://docs.anthropic.com/en/docs/agents-and-tools/agent-sdk)[Overviewhttps://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview)[Sub Agentshttps://docs.anthropic.com/en/docs/claude-code/sub-agents](https://docs.anthropic.com/en/docs/claude-code/sub-agents)

Agentic Loop Lifecycle

[Agent Sdkhttps://docs.anthropic.com/en/docs/agents-and-tools/agent-sdk](https://docs.anthropic.com/en/docs/agents-and-tools/agent-sdk)[Messageshttps://docs.anthropic.com/en/api/messages](https://docs.anthropic.com/en/api/messages)[Overviewhttps://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview)

Coordinator-Subagent Orchestration

[Sub Agentshttps://docs.anthropic.com/en/docs/claude-code/sub-agents](https://docs.anthropic.com/en/docs/claude-code/sub-agents)[Agent Sdkhttps://docs.anthropic.com/en/docs/agents-and-tools/agent-sdk](https://docs.anthropic.com/en/docs/agents-and-tools/agent-sdk)[Overviewhttps://docs.anthropic.com/en/docs/claude-code/overview](https://docs.anthropic.com/en/docs/claude-code/overview)

Subagent Invocation & Context Passing

[Sub Agentshttps://docs.anthropic.com/en/docs/claude-code/sub-agents](https://docs.anthropic.com/en/docs/claude-code/sub-agents)[Tool Usehttps://docs.anthropic.com/en/docs/agents-and-tools/tool-use](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use)[Agent Sdkhttps://docs.anthropic.com/en/docs/agents-and-tools/agent-sdk](https://docs.anthropic.com/en/docs/agents-and-tools/agent-sdk)

Multi-Step Workflow Enforcement & Handoff

[Hooks Guidehttps://docs.anthropic.com/en/docs/claude-code/hooks-guide](https://docs.anthropic.com/en/docs/claude-code/hooks-guide)[Agent Sdkhttps://docs.anthropic.com/en/docs/agents-and-tools/agent-sdk](https://docs.anthropic.com/en/docs/agents-and-tools/agent-sdk)[Memoryhttps://docs.anthropic.com/en/docs/claude-code/memory](https://docs.anthropic.com/en/docs/claude-code/memory)

Agent SDK Hooks for Tool Interception & Data Normalization

[Hooks Guidehttps://docs.anthropic.com/en/docs/claude-code/hooks-guide](https://docs.anthropic.com/en/docs/claude-code/hooks-guide)[Memoryhttps://docs.anthropic.com/en/docs/claude-code/memory](https://docs.anthropic.com/en/docs/claude-code/memory)[Agent Sdkhttps://docs.anthropic.com/en/docs/agents-and-tools/agent-sdk](https://docs.anthropic.com/en/docs/agents-and-tools/agent-sdk)

Task Decomposition Strategies

[Sub Agentshttps://docs.anthropic.com/en/docs/claude-code/sub-agents](https://docs.anthropic.com/en/docs/claude-code/sub-agents)[Agent Sdkhttps://docs.anthropic.com/en/docs/agents-and-tools/agent-sdk](https://docs.anthropic.com/en/docs/agents-and-tools/agent-sdk)[Overviewhttps://docs.anthropic.com/en/docs/claude-code/overview](https://docs.anthropic.com/en/docs/claude-code/overview)

Session State, Resumption & Forking

[Overviewhttps://docs.anthropic.com/en/docs/claude-code/overview](https://docs.anthropic.com/en/docs/claude-code/overview)[Agent Sdkhttps://docs.anthropic.com/en/docs/agents-and-tools/agent-sdk](https://docs.anthropic.com/en/docs/agents-and-tools/agent-sdk)[Sub Agentshttps://docs.anthropic.com/en/docs/claude-code/sub-agents](https://docs.anthropic.com/en/docs/claude-code/sub-agents)

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="d2-tool-design-mcp-integration"></a>

# D2 — Tool Design & MCP Integration

> Source: [https://www.nvnhan.wiki/#/ccarf/docs](https://www.nvnhan.wiki/#/ccarf/docs)
> Exported from the rendered documentation by `Tool2/scrape_docs.py`.

## Table of contents

1. [A. Foundations of Tool Design for Claude](#a-foundations-of-tool-design-for-claude)
2. [B. Designing Effective Tool Descriptions and Boundaries](#b-designing-effective-tool-descriptions-and-boundaries)
3. [C. Structured Error Responses for Tools](#c-structured-error-responses-for-tools)
4. [D. Tool Distribution Across Agents](#d-tool-distribution-across-agents)
5. [E. The tool_choice Setting](#e-the-tool-choice-setting)
6. [F. MCP Server Architecture and Integration](#f-mcp-server-architecture-and-integration)
7. [G. MCP Error Patterns and Tool Result Design](#g-mcp-error-patterns-and-tool-result-design)
8. [H. Built-in Tool Selection and Usage Patterns](#h-built-in-tool-selection-and-usage-patterns)
9. [Worked Examples Across Domain 2](#worked-examples-across-domain-2)
10. [Domain 2 Services Appendix](#domain-2-services-appendix)
11. [Domain 2: Tool Design & MCP Integration Sample Questions](#domain-2-tool-design-mcp-integration-sample-questions)
12. [Additional Exam Guidance for Domain 2](#additional-exam-guidance-for-domain-2)
13. [Nguồn tham khảo](#ngu-n-tham-kh-o)

---

<a id="a-foundations-of-tool-design-for-claude"></a>

## A. Foundations of Tool Design for Claude

A tool call is an action Claude can request during a conversation. Claude does not execute tools directly, it sends a structured request containing the tool name and input parameters, and your code decides whether to execute, reject, or modify the request. This separation between tool selection and tool execution is fundamental to understanding how tool design affects agent reliability.

Claude uses tool names, descriptions, and input schemas to decide which tool is appropriate for the current step. When a user says "look up this order," Claude does not search your codebase for a function named `lookupOrder`. It reads the descriptions of all available tools and selects the one whose description best matches the intent. This means that a tool's description is not documentation for humans but rather a decision signal for Claude.

### How Claude Selects Tools

How Claude Selects Tools

Nguồn tham khảo: Claude-Certified-Architect-Foundations-CCAR-F.pdf

Claude's tool selection works in three phases: first, on each turn, Claude reads all available tool descriptions, evaluates which one (if any) matches the current task, and either calls a tool or responds directly. The selection is driven by the match between the task context and the tool description, not by the tool name alone.

This demonstrates the following:

- A clear, specific description makes the right tool obvious to Claude.
- An ambiguous description makes Claude guess, producing inconsistent tool selection.
- Two tools with similar descriptions create confusion, as Claude may alternate between them randomly.
- A tool with a misleading name but a good description will still be selected correctly, because Claude weighs the description more heavily than the name.

### Three Components of a Tool Definition

A tool definition has three parts, and each serves a distinct purpose.

| Component | Purpose | Impact on Reliability |
| --- | --- | --- |
| Name | A short identifier for the tool | Minor: Claude uses descriptions more than names for selection |
| Description | Tells Claude when and why to use this tool | Major: the primary signal for tool selection |
| Input schema | Defines what parameters the tool accepts | Major: determines whether Claude can construct a valid call |

### Why Tool Design Is an Architectural Concern

Tool design is about more than labeling, as the choices you make here drive how reliably the whole agent system works.

- A well-designed tool set makes Claude's choices predictable and testable.
- A badly designed one can introduce misrouting, duplicate calls, and cascading errors that no prompt engineering can fix.
- Tool descriptions also interact with the system prompt, so one stray keyword can push Claude towards a wrong tool.

★

**EXAM TIP:** The exam tests tool design as an architectural concern. When a question describes Claude calling the wrong tool, the first thing to check is the tool descriptions, not the prompt, not the model, and not the conversation history. Tool descriptions are the primary signal for tool selection.

Common Mistakes

- Writing tool descriptions for a human reader when Claude is the one acting on them.
- Trusting the tool name to carry the meaning while Claude reads the description.
- Creating tools with overlapping scopes and near-identical descriptions Claude can't tell apart.
- Forgetting that a keyword in your system prompt can quietly tip tool selection.

Resources

[Overviewhttps://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview)[Best Practiceshttps://docs.anthropic.com/en/docs/agents-and-tools/tool-use/best-practices](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/best-practices)

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="b-designing-effective-tool-descriptions-and-boundaries"></a>

## B. Designing Effective Tool Descriptions and Boundaries

The tool description is the most important part of a tool definition because it is the text Claude uses to determine whether a tool is appropriate for the current step. When the description is vague, Claude is forced to guess. Similarly, when the description overlaps with another tool's scope, it can lead to misrouting. By contrast, a clear and specific description explains what the tool does, when to use it, and how it differs from related tools, helping Claude consistently select the best option.

Anthropic's best practices on tool-use states that tool descriptions should clearly explain what the tool does, when it should be used, what each parameter means, and any important limitations. The documentation also states that tool descriptions are like good docstrings; the more context you provide, the better Claude can use them.

### What Makes a Good Tool Description

Anatomy of a Good Tool Description

Nguồn tham khảo: Claude-Certified-Architect-Foundations-CCAR-F.pdf

A good tool description includes:

1. **Purpose:** A one-sentence explanation of what the tool does.
2. **Use case:** The specific conditions under which the tool should be used.
3. **Parameters:** A clear, plain-language explanation of every input field.
4. **Boundaries:** Explicit exclusions that prevent Claude from using the tool in the wrong situations.

WORKED EXAMPLE — Weak vs. Strong Tool Description

Weak: `name: "search"` `description: "Search for things"`

Strong: `name: "search_orders"` `description: "Look up customer orders by order ID, customer email, or date range. Use this when the customer asks about a specific order, order status, or order history. Returns order details including status, items, and shipping information. Do NOT use this for product searches, use search_products instead."`

What this shows: the strong description names the use cases (order lookup, status, history), specifies the input types (order ID, email, date range), describes the return value, and explicitly excludes product searches preventing misrouting to a similarly-named tool.

### Preventing Misrouting Between Similar Tools

Misrouting happens when Claude picks the wrong tool, and the usual culprit is a pair of tools whose descriptions overlap or blur together. The fix is a disambiguation pattern, when two tools serve similar but distinct purposes, each description should spell out what the other one is for, so Claude can tell them apart.

| Scenario | Without Disambiguation | With Disambiguation |
| --- | --- | --- |
| Search orders vs. search products | "Search for orders" / "Search for products" | "Search for orders by ID, email, or date. Do NOT use for product catalog searches — use search_products." / "Search product catalog by name, category, or SKU. Do NOT use order lookups, use search_orders." |
| Get customer info vs. get customer orders | "Get customer information" / "Get customer orders" | "Get customer profile data: name, email, plan, account status. Does NOT return order history — use get_customer_orders." / "Get a customer's order history. Requires customer_id. Does NOT return profile data — use get_customer_info." |

### Tool Names vs. Tool Descriptions

A tool name is less important than the description, but a misleading one can still cause problems.

- Claude prefers description as its primary signal, so the name is always secondary.
- A name like `process_data` sitting next to a description about order lookups creates a dissonance that chips away at selection reliability.
- Keep names consistent with descriptions, so an order-search tool becomes `search_orders` rather than `query` or `lookup`.
- Steer clear of generic names like `helper`, `process`, `handle`, or `execute`, since they give Claude no signal about what the tool is for.

### Parameter Descriptions

Each parameter in the input schema should have a description that tells Claude what to pass. Without parameter descriptions, Claude must infer the expected format from the parameter name alone, which can produce inconsistent inputs.

| Parameter | Without Description | With Description |
| --- | --- | --- |
| customer_id | (none) | "The unique customer identifier, e.g., 'C-1049'. Required for all customer-specific lookups." |
| date_range | (none) | "ISO 8601 date range as {start, end}. Both dates are inclusive. Maximum range: 90 days." |
| status_filter | (none) | "Filter by order status. Valid values: 'pending', 'shipped', 'delivered', 'cancelled'. Omit to return all statuses." |

### Tool Description Anti-Patterns

| Anti-Pattern | Why it does not work | Fix |
| --- | --- | --- |
| "Search for things" | Too vague, Claude cannot distinguish from other search tools | Name what is searched, what inputs are accepted, what is returned |
| No boundary statement | Claude may use this tool for tasks that belong to another tool | Add "Do NOT use for X, use tool_Y instead" |
| Technical jargon without context | Claude may misinterpret domain-specific terms | Use plain language or define terms in the description |
| Description contradicts the name | Creates confusion in tool selection | Align name and description |
| No parameter descriptions | Claude guesses at parameter formats | Add a description for every parameter |

★

**EXAM TIP:** When a question describes Claude consistently calling the wrong tool, the answer is almost always to improve the tool descriptions. Add boundary statements ("Do NOT use for X"), add specificity about when to use the tool, and ensure there is no overlap with other tools' descriptions. Few-shot examples in the prompt do not fix tool misrouting, they fix output format and judgment, not tool selection.

Common Mistakes

- Writing descriptions for humans ("This tool searches orders") instead of for Claude ("Use this tool when the customer asks about order status, order history, or a specific order by ID").
- Creating two tools with overlapping scope and no disambiguation.
- Relying on the tool name to do the work of the description.
- Using few-shot examples to fix tool misrouting when the real cause is ambiguous descriptions.

Resources

[Best Practiceshttps://docs.anthropic.com/en/docs/agents-and-tools/tool-use/best-practices](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/best-practices)[Overviewhttps://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview)

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="c-structured-error-responses-for-tools"></a>

## C. Structured Error Responses for Tools

When a tool fails, the error message it returns determines whether the calling agent can recover. A generic error like "tool failed" or "error occurred" gives the agent no information to work with and it cannot decide whether to retry, try a different tool, or escalate. A structured error with a category, description, and retryability flag lets the agent make an informed recovery decision.

This section overlaps with Domain 5 (Error Propagation) but focuses specifically on how to design the error responses that tools return, rather than how agents propagate errors through multi-agent pipelines.

### Problems with Generic Errors

When a tool returns a generic error, the calling agent has no basis for deciding what to do next.

- Should it retry? The error does not say whether the failure is transient.
- Should it try a different tool? The error does not say what went wrong.
- Should it escalate? The error does not say whether the situation is recoverable.
- Should it tell the user? The error does not contain enough detail for a meaningful message.

The result is that the agent either retries blindly (wasting tokens on a non-retryable error), gives up prematurely (missing a retry opportunity), or reports vague information to the user ("I encountered an error" which is unhelpful).

### The Structured Error Pattern

A well-designed error response carries three fields that the agent can branch on.

| Field | Purpose | Example Values |
| --- | --- | --- |
| category | What type of failure occurred | "timeout", "permission_denied", "validation_error", "not_found", "rate_limited", "service_unavailable" |
| description | Human-readable detail of what went wrong | "Database connection timed out after 30s", "API key lacks read permission for billing records" |
| retryable | Whether the same call might succeed on retry | true / false |

WORKED EXAMPLE

```
// Good: structured error
{
  "is_error": true,
  "category": "timeout",
  "description": "Payment API did not respond within 30 seconds",
  "retryable": true
}

// Bad: generic error
{
  "is_error": true,
  "message": "An error occurred"
}
```

### Error Categories and Recovery Strategies

Different error categories require different recovery strategies. The agent's recovery logic should branch on the category, not on parsing the description text.

| Category | Typical Cause | Retryable? | Recovery Strategy |
| --- | --- | --- | --- |
| timeout | Network latency, slow backend | Yes | Retry with exponential backoff |
| rate_limited | Too many requests | Yes | Wait, then retry after delay |
| permission_denied | Missing credentials or scope | No | Escalating as this cannot be fixed by retrying |
| not_found | Resource does not exist | No | This is information, and not an error, handled as valid empty |
| validation_error | Malformed request parameters | No | Fix the request parameters, then retry |
| service_unavailable | Backend is down | Yes | Try alternative source or annotate gap |

Validation errors are retryable only if the agent can fix the input. If the input came from the user and is genuinely invalid, it is not retryable without user correction.

### Access Failure vs. Valid Empty Result

- An **access failure** means the tool could not reach its data source. No query was executed. The absence of data is not meaningful.
- A **valid empty result** means the tool successfully queried its source and found nothing. The absence of data IS the answer.

If the system treats both the same way, downstream agents may report "no data exists" when the reality is "we could not check." Which is a silent data integrity failure.

| Situation | What It Is | Correct Response |
| --- | --- | --- |
| API returned HTTP 500 | Access failure | Return error with category: "service_unavailable", retryable: true |
| API returned HTTP 200 with empty array | Valid empty result | Return success with empty data |
| API connection timed out | Access failure | Return error with category: "timeout", retryable: true |
| API returned HTTP 404 | Depends on context | If the resource should exist: error. If checking existence: valid empty. |

WORKED EXAMPLE — MCP Tool Error Response

A customer lookup tool queries a database. The database connection times out.

Wrong pattern: Return an empty result. The coordinator concludes the customer does not exist. The agent tells the user "We could not find your account" — but the account exists, and the lookup just failed.

Correct pattern: Return: `{ "is_error": true, "category": "timeout", "description": "Customer database connection timed out after 10s", "retryable": true }` The coordinator sees a retryable timeout, waits, and retries. On the second attempt, the database responds, and the customer is found.

### Returning Errors in MCP Tool Implementations

In MCP, tools return errors by setting `is_error: true` on the tool result. The content field carries the error details as text that Claude reads and reasons about.

Anthropic's MCP documentation explains that when `is_error` is true, Claude understands the tool call failed and can adapt its approach, such as retrying, trying a different tool, or reporting the issue to the user. Without the `is_error` flag, Claude may interpret error text as a normal tool result and try to reason over it as if it were valid data.

### Error Response Design Principles

- **Always include a category.** This is what the agent branches on. Without it, the agent has to parse the description text, which is fragile and unreliable.
- **Always include retryability.** This prevents wasted retries on non-retryable errors and missed retry opportunities on transient failures.
- **Keep descriptions specific.** "Database connection timed out after 30s" is actionable. "An error occurred" is not.
- **Never return an empty result for an access failure.** This is the most dangerous anti-pattern because it looks like success.
- **Use categories consistently.** If every tool in your system uses the same category names, the coordinator can have a single recovery strategy for each category.

★

**EXAM TIP:** When a question describes a coordinator that "cannot determine what went wrong because the tool only returns a generic error message", the answer is structured error responses with category, description, and retryability. When a question describes a downstream agent that "incorrectly reports no data when the source was unreachable", the answer is distinguishing access failures from valid empty results.

Common Mistakes

- Returning empty results for tool failures, which silently corrupts downstream reasoning.
- Using generic error messages that give the agent no recovery information.
- Omitting the retryability flag, so the agent either retries everything or retries nothing.
- Treating HTTP 404 as always an error when it might be a valid "does not exist" answer.
- Using inconsistent error categories across tools, forcing the coordinator to handle each tool's errors differently.

References

[Best Practiceshttps://docs.anthropic.com/en/docs/agents-and-tools/tool-use/best-practices](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/best-practices)[Mcphttps://docs.anthropic.com/en/docs/agents-and-tools/mcp](https://docs.anthropic.com/en/docs/agents-and-tools/mcp)[Implement Tool Usehttps://docs.anthropic.com/en/docs/agents-and-tools/tool-use/implement-tool-use](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/implement-tool-use)

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="d-tool-distribution-across-agents"></a>

## D. Tool Distribution Across Agents

Role-Bounded Tool Distribution

Nguồn tham khảo: Claude-Certified-Architect-Foundations-CCAR-F.pdf

In a multi-agent system, not every agent should have every tool. A search agent needs web search tools but does not need file write tools. A synthesis agent needs no search tools at all as it works from the outputs of other agents. Giving every agent every tool creates unnecessary decision complexity, increases the risk of inappropriate actions, and makes the system harder to audit.

Anthropic's Agent SDK documentation supports this through the `allowedTools` parameter, which restricts which tools a subagent can access. This is not just a security measure, as it improves tool selection reliability because Claude has fewer tools to choose from, making each decision simpler and more predictable.

### The Principle of Least Privilege for Tools

Each agent should have access to only the tools necessary for its specific role. This principle mirrors security's principle of least privilege but is applied to tool access.

**Reliability:** When Claude has 15 tools available, it must evaluate all 15 descriptions on every turn to decide which one to use. With 3 tools, the decision space is much smaller, and selection is more reliable. Over-permissive tool sets do not just create security risk but also reliability risk.

**Security:** A subagent with write access to the database but whose job is only to read data can accidentally make destructive changes. Restricting its tools to read-only operations prevents this class of error entirely.

### Designing Role-Bounded Tool Sets

| Agent Role | Appropriate Tools | Tools to Exclude |
| --- | --- | --- |
| Search agent | WebSearch, WebFetch | Write, Edit, Bash, database write tools |
| Document analyst | Read, Grep, Glob | Write, Edit, Bash, web tools |
| Code reviewer | Read, Grep, Glob | Write, Edit, Bash (read-only review) |
| Test runner | Bash, Read | Write, Edit, WebSearch |
| Synthesis agent | None (works from subagent outputs) | All external tools |
| Customer support agent | Customer lookup, order lookup, refund tool | Database admin, file system tools |

### allowedTools in the Agent SDK

The `allowedTools` parameter restricts which tools a subagent can access. When you create an agent definition, you specify the list of tools it can use:

```
agent = Agent(
    name="search_agent",
    description="Searches the web for current information",
    allowedTools=["WebSearch", "WebFetch"],
    prompt="Search the web for the given query and return relevant findings."
)
```

This means the search agent can only use WebSearch and WebFetch. Even if the parent coordinator has access to Write, Edit, and Bash, the search agent cannot use them.

### Permission Inheritance in Multi-Agent Systems

Anthropic's documentation states that permissive modes like `bypassPermissions` are inherited by subagents and cannot be relaxed per subagent. This has an important implication: if the coordinator runs with broad permissions, every subagent also runs with broad permissions unless you explicitly restrict them with `allowedTools`.

This means `allowedTools` is the primary mechanism for controlling subagent tool scope. You cannot rely on the system's permission mode to restrict subagents, as you must restrict their tools explicitly.

★

**EXAM TIP:** When a question describes a subagent that performed an action outside its intended scope the answer is to restrict its tools with `allowedTools`. When the question notes that the coordinator uses permissive mode the answer emphasizes that permissive modes are inherited, making `allowedTools` the only way to constrain subagents.

WORKED EXAMPLE — Tool Distribution in a Research System

A multi-agent research system has four agents:

1. Coordinator: delegates, synthesizes, evaluates coverage
2. Web Search Agent: finds current web sources
3. Document Analyst: reads and summarizes uploaded documents
4. Synthesis Agent: merges findings into a final report

Correct tool distribution:

- Coordinator: Agent tool (to spawn subagents). No direct data tools.
- Web Search Agent: `allowedTools = ["WebSearch", "WebFetch"]`. Cannot read local files or write anything.
- Document Analyst: `allowedTools = ["Read", "Grep", "Glob"]`. Cannot access the web or modify files.
- Synthesis Agent: `allowedTools = []`. Works entirely from the outputs passed by the coordinator. No tools needed.

Why this works: each agent can only do what its role requires. The search agent cannot accidentally modify files. The document analyst cannot make web requests. The synthesis agent has no tool access at all because it operates on pre-gathered data.

### When to Use Tool Restriction vs. When Not To

- **Always restrict subagents:** The coordinator delegates specific tasks, while the subagent should have only the tools for that task.
- The coordinator may need broad access if it directly interacts with tools between delegations.
- **Interactive Claude Code sessions:** may need broad access because the developer is making decisions about what tools to use.
- **CI/CD pipeline invocations:** should restrict tool access to match the pipeline step's purpose.

Common Mistakes

- Giving every subagent every tool "for flexibility" increases decision complexity and risk.
- Relying on prompt instructions to prevent tool misuse instead of restricting tools with `allowedTools`.
- Assuming subagents inherit the coordinator's tool restrictions, they inherit permissions, not restrictions, unless you set `allowedTools`.
- Forgetting that the Agent tool itself should not be given to subagents (subagents cannot spawn their own subagents).

References

[Toolshttps://code.claude.com/docs/en/agent-sdk/tools](https://code.claude.com/docs/en/agent-sdk/tools)[Agent Loophttps://code.claude.com/docs/en/agent-sdk/agent-loop](https://code.claude.com/docs/en/agent-sdk/agent-loop)[Overviewhttps://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview)

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="e-the-tool-choice-setting"></a>

## E. The tool_choice Setting

The `tool_choice` parameter controls whether Claude calls a tool and which one. It is the mechanism for moving from "Claude might call a tool" to "Claude definitely calls this specific tool." Getting this right is what separates a system that sometimes uses tools from one that always behaves predictably.

This section overlaps with Domain 4's structured output coverage but focuses specifically on `tool_choice` as a control mechanism for tool behavior, rather than on schema design for extraction quality.

### The Four Modes

| Mode | Behavior | Use When |
| --- | --- | --- |
| auto | Claude decides what to call a tool | General-purpose agents where tool use is sometimes needed |
| any | Claude must call a tool, but picks which | Multiple extraction schemas for different input types |
| tool | Claude must call a specific named tool | A specific step that must always run (e.g., metadata extraction) |
| none | Claude cannot call any tool | Testing text-only behavior, or disabling tools for a specific turn |

### Choosing the Right Mode

**Use auto:** when the task may or may not need a tool. A conversational agent that sometimes looks up orders and sometimes answers general questions should use auto mode. In this mode, Claude decides based on the request whether a tool call is appropriate.

**Use any:** when you need structured output but the input type varies. If you have multiple extraction schemas, such as one for invoices, one for receipts, and one for contracts, setting `tool_choice` to any forces Claude to call one of them, and Claude picks the right schema based on the document type.

**Use tool:** when a specific step must always execute. If every request must start with metadata extraction before anything else, setting `tool_choice` to the tool with the metadata extraction tool guarantees it runs first.

**Use none:** when you want text-only behavior for a specific turn, such as generating a summary from data already in context without calling any additional tools.

### tool_choice and Structured Output

For extraction tasks, `tool_choice` is what guarantees Claude returns structured data instead of free-form text.

- **auto** allows Claude to respond with text instead of calling the extraction tool, which means sometimes you get prose instead of JSON.
- **any or tool** guarantees Claude calls the extraction tool, producing structured output every time.
- **Combining tool with strict: true** guarantees both that the tool is called AND that the inputs match the schema exactly.

WORKED EXAMPLE — Guaranteeing Structured Output

A pipeline extracts invoice data. The extraction tool has a defined JSON schema.

With `tool_choice: auto` → Claude sometimes responds with text: "I found the invoice number is INV-1234." This breaks the downstream parser.

With `tool_choice: {type: "tool", name: "extract_invoice"}` → Claude always calls the extraction tool with structured input. The parser always receives valid JSON.

With `strict: true` added → Claude's inputs to the tool are guaranteed to match the schema. No missing required fields, no wrong types.

### Syntax Errors vs. Semantic Errors

The combination of `tool_choice` + strict tool use eliminates syntax errors (malformed JSON, missing fields, wrong types) but does NOT eliminate semantic errors (wrong values, inconsistent data, values in the wrong field). This distinction is heavily tested across Domains 2 and 4.

| Error Type | Example | Caught by Schema? |
| --- | --- | --- |
| Syntax: missing field | Required field invoice_number absent | Yes (with strict) |
| Syntax: wrong type | total_amount is a string instead of a number | Yes (with strict) |
| Semantic: wrong value | total_amount is 150.00 but line items sum to 180.00 | No |
| Semantic: value in wrong field | Customer name appears in the email field | No |
| Semantic: contradicting fields | Status is "completed" but completion_date is null | No |

Semantic errors require a validation layer (Pydantic, custom checks), as they cannot be caught by schema enforcement alone; this is covered in depth in Domain 4.

★

**EXAM TIP:** When a question asks how to guarantee both that a tool is always called AND that its inputs match the schema, the answer is `tool_choice: tool` (or any) combined with `strict: true`. When the question then asks about ensuring the VALUES are correct, that requires a separate validation layer. Schema enforcement handles structure; validation handles meaning.

Common Mistakes

- Using auto when you need guaranteed structured output, Claude may respond with text instead of calling the tool.
- Confusing any (model picks which tool) with tool (model must call a specific named tool).
- Assuming strict tool use guarantees correct values, it only guarantees correct structure.
- Setting `tool_choice` to none and wondering why tools are not called.

References

[Overviewhttps://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview)[Implement Tool Usehttps://docs.anthropic.com/en/docs/agents-and-tools/tool-use/implement-tool-use](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/implement-tool-use)[Structured Outputshttps://docs.anthropic.com/en/docs/build-with-claude/structured-outputs](https://docs.anthropic.com/en/docs/build-with-claude/structured-outputs)

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="f-mcp-server-architecture-and-integration"></a>

## F. MCP Server Architecture and Integration

The Model Context Protocol (MCP) is an open-source standard that allows Claude to connect with external tools, data sources, databases, APIs, and other systems. MCP servers extend Claude's built-in capabilities by exposing tools, resources, and prompts that Claude can use during a conversation. Understanding MCP is essential for Domain 2 because it is the primary mechanism for giving Claude access to the outside world beyond its built-in tools.

MCP servers can be configured at two scopes: project-level (shared with the team) and user-level (personal). The configuration determines which servers are available, how they authenticate, and whether they are committed to version control.

### MCP Architecture

An MCP server is a separate process that Claude communicates with through the MCP protocol. The server exposes capabilities in three categories:

| Capability | What It Is | How Claude Uses It |
| --- | --- | --- |
| Tools | Callable functions (query database, create ticket, etc.) | Claude calls them like any other tool |
| Resources | Read-only content catalogs (schema descriptions, doc hierarchies) | Claude reads them to decide which tool to call |
| Prompts | Pre-defined prompt templates (deploy checklist, incident response) | Developers invoke them as slash commands |

The key distinction: tools perform actions, resources provide information, and prompts are templates for common workflows. Tools are operational. Resources are informational. Prompts are workflow shortcuts.

### Project-Level Configuration (.mcp.json)

The `.mcp.json` file sits at the project root and is committed to version control. Every team member who works on the project gets the same MCP servers. This is the correct scope for shared tools that the entire team needs.

```
{
  "mcpServers": {
    "venue-lookup": {
      "command": "node",
      "args": ["./mcp-servers/venue-lookup/index.js"],
      "env": {
        "API_KEY": "${VENUE_API_KEY}"
      }
    }
  }
}
```

The `${VENUE_API_KEY}` is expanded from each developer's environment at runtime. The actual API key never appears in version control.

### User-Level Configuration (~/.claude.json)

The `~/.claude.json` file is personal to each developer and not shared with the team. Use this for experimental or personal MCP servers.

| Configuration | Location | Shared? | Use For |
| --- | --- | --- | --- |
| .mcp.json | Project root | Yes (version controlled) | Team-shared tools (databases, APIs, services) |
| ~/.claude.json | User home directory | No (personal) | Experimental or personal tools |

### Environment Variable Expansion for Secrets

MCP configuration supports environment variable expansion using the `${VAR_NAME}` syntax. This is the correct way to handle API keys, database credentials, and other secrets in MCP configuration. Hardcoding secrets in `.mcp.json` would commit them to version control, exposing them to everyone with repository access. Environment variable expansion lets each developer store their credentials locally while sharing the server configuration.

### MCP Resources for Cross-Server Efficiency

When Claude connects to multiple MCP servers (an issue tracker, a documentation wiki, and a database), it needs to know which server to query for each piece of information. Without this knowledge, Claude makes excessive exploratory calls, querying each server in turn until it finds the right one.

MCP resources solve this by giving Claude a catalog of what each server contains. Each server exposes a description of its data (issue categories, document hierarchy, database schema), and Claude reads these catalogs to make informed decisions about which server to query.

| Without Resources | With Resources |
| --- | --- |
| Claude queries Server A → no results. Queries Server B → no results. Queries Server C → found it. 3 calls, 2 wasted. | Claude reads catalogs → knows Server C has billing data → queries Server C directly. 1 call, 0 wasted. |

### MCP Prompts as Slash Commands

MCP Prompts as Slash Commands

Nguồn tham khảo: Claude-Certified-Architect-Foundations-CCAR-F.pdf

When an MCP server exposes prompts, Claude Code surfaces them as slash commands with the naming convention `/mcp_<servername>_<promptname>`. They are invoked explicitly by developers, and they do not auto-load into context, are not added to the tool registry, and are not surfaced as resources.

★

**EXAM TIP:** When a question asks how MCP prompts are accessed in Claude Code, the answer is /slash commands. When a question describes Claude making too many exploratory calls across multiple MCP servers, the answer is MCP resources (content catalogs). When a question asks about shared vs. personal MCP configuration, shared goes in `.mcp.json`, personal goes in `~/.claude.json`.

Common Mistakes

- Hardcoding API keys in `.mcp.json` instead of using environment variable expansion.
- Putting personal MCP servers in `.mcp.json` where they will be committed to version control.
- Confusing MCP resources (read-only catalogs) with MCP tools (callable functions).
- Expecting MCP prompts to auto-load into context when they are strictly slash commands.
- Not exposing MCP resources when connecting Claude to multiple servers, leading to excessive exploratory calls.

References

[Mcphttps://docs.anthropic.com/en/docs/agents-and-tools/mcp](https://docs.anthropic.com/en/docs/agents-and-tools/mcp)[Settingshttps://docs.anthropic.com/en/docs/claude-code/settings](https://docs.anthropic.com/en/docs/claude-code/settings)[Mcphttps://code.claude.com/docs/en/agent-sdk/mcp](https://code.claude.com/docs/en/agent-sdk/mcp)

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="g-mcp-error-patterns-and-tool-result-design"></a>

## G. MCP Error Patterns and Tool Result Design

How you design the results that tools return to Claude is as important as how you design the tools themselves. A tool result that is too verbose consumes unnecessary context. A tool result that is too sparse gives Claude nothing to reason over. A tool result that returns an error without the `is_error` flag may be misinterpreted as valid data. Thus, getting the result design right is a reliability concern.

### The is_error Flag

In MCP, tool results can be marked as errors using the `is_error` flag. When this flag is set to true, Claude understands that the tool call failed and adapts its behavior, it may retry, try a different approach, or report the issue.

Without the `is_error` flag, Claude may interpret error text as if it were valid data. If a database query times out and the tool returns `{"message": "connection timed out"}` without `is_error: true`, Claude may try to extract data from the error message, producing nonsensical output.

### Designing Effective Tool Results

Tool results should be concise, structured, and relevant. The principle is to return only what Claude needs for its next reasoning step, not everything the backend produces.

| Principle | Why | Example |
| --- | --- | --- |
| Return only relevant fields | Reduces context consumption | Return 5 relevant order fields, not 40 raw database columns |
| Use structured format | Easier for Claude to extract specific values | JSON with named fields, not a prose paragraph |
| Include status information | Lets Claude know if the result is complete | "status": "complete" vs. "status": "partial, 3 of 5 records returned" |
| Filter before returning | Prevents context bloat from verbose backends | Filter the raw API response to include only the fields the agent needs |

### Verbose vs. Concise Tool Results

| Concept | Best Used For | Key Benefit | Common Exam Trap |
| --- | --- | --- | --- |
| Verbose result | Debugging, one-off exploration | Contains all available data | Fills context window quickly, crowding out task context |
| Concise result | Production agents, long sessions | Preserves context budget | May miss data that turns out to be relevant later |

The correct default is concise results for production agents. If Claude needs additional detail, it can make a follow-up tool call with a more specific query.

WORKED EXAMPLE — Tool Result Filtering

A customer lookup tool queries a database that returns 40 fields per record: internal IDs, audit timestamps, legacy migration flags, system metadata, etc.

Verbose (bad for production): Return all 40 fields. Each lookup consumes ~800 tokens. After 5 lookups, 4,000 tokens of the context window are filled with data Claude does not need.

Concise (good for production): Filter to 6 relevant fields: `customer_id`, `name`, `email`, `plan_type`, `account_status`, `created_date`. Each lookup consumes ~120 tokens. After 5 lookups, only 600 tokens consumed. The concise version preserves context for reasoning while providing everything the agent needs for the current task.

### When to Transform Tool Results

Sometimes the raw tool output is structured but not in a form that Claude can reason about easily. Transformation reshapes the data for better reasoning.

- **Flatten nested structures** when Claude only needs one level of detail.
- **Aggregate multiple records into a summary** when the agent needs counts or trends, not individual records.
- **Convert codes to labels** when the raw data uses internal codes that Claude would need to look up.
- **Add computed fields** when the agent needs a derived value (like "days_since_last_order") that the raw data does not include.

Common Mistakes

- Returning raw database responses with dozens of irrelevant fields.
- Not setting `is_error: true` on failed tool calls, causing Claude to interpret error messages as data.
- Returning a verbose tool results in long-running sessions, accelerating context rot.
- Transforming results so aggressively that Claude cannot verify the original data if needed.

References

[Best Practiceshttps://docs.anthropic.com/en/docs/agents-and-tools/tool-use/best-practices](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/best-practices)[Mcphttps://docs.anthropic.com/en/docs/agents-and-tools/mcp](https://docs.anthropic.com/en/docs/agents-and-tools/mcp)

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="h-built-in-tool-selection-and-usage-patterns"></a>

## H. Built-in Tool Selection and Usage Patterns

Claude Code Built-in Tools

Nguồn tham khảo: Claude-Certified-Architect-Foundations-CCAR-F.pdf

Claude Code provides a set of built-in tools for interacting with codebases and file systems. Choosing the right tool for each task is a practical skill the exam tests directly. The built-in tools cover file operations (Read, Write, Edit), search (Grep, Glob), and execution (Bash). Understanding when to use each and how they interact is essential for both efficient exploration and correct exam answers.

### Built-in Tool Reference

| Tool | What It Does | Use When | Does NOT |
| --- | --- | --- | --- |
| Read | Loads file contents into context | Need to understand a file's logic, structure, or content | Modify files |
| Write | Creates or overwrites a file entirely | Creating new files, or fallback when Edit fails | Make targeted changes (use Edit) |
| Edit | Targeted old_string → new_string replacement | Making specific changes to existing files | Work when old_string is not unique |
| Grep | Searches file contents for patterns | Looking for specific text: imports, error messages, function calls | Search by file name (use Glob) |
| Glob | Searches for files by name/path | Finding files by naming convention or location | Search file contents (use Grep) |
| Bash | Executes shell commands | Running tests, git ops, installs, system info | N/A: can do almost anything |

### Grep vs. Glob: Content Search vs. Name Search

This is a simple but frequently tested distinction.

- **Grep** searches inside files, the content. Use when you know what text to find.
- "Find all files that import `@company/auth`" → Grep
- "Find where the error message SYNC_CONFLICT is defined" → Grep
- "Find all callers of the `processRefund` function" → Grep
- **Glob** searches for files by name, the path. Use when you know the naming convention.
- "Find all files named `cache*.py`" → Glob
- "Find all test files matching `*.test.ts`" → Glob
- "List all files in the `errors/` directory" → Glob

★

**EXAM TIP:** When a question asks to "find all files that import a specific package," Grep (content search). When a question asks to "find files named cache-something," Glob (name search). When a question asks to find an error message across services, Grep for the distinctive error text.

### The Read → Write Fallback Pattern

The Edit tool requires its `old_string` parameter to be unique in the file. When a file has highly repetitive content (duplicate docstrings, repeated patterns, or identical structural blocks), Edit may fail because it cannot find a unique match.

The reliable fallback is the following:

1. Read the file to load its contents.
2. Modify the content in your reasoning (add the new function, change the target section).
3. Write the updated file.

This is less elegant than Edit but always works regardless of content repetition.

WORKED EXAMPLE — Edit Fails on Repetitive Content

A 150-line configuration file has many identical structural blocks. A developer asks Claude to insert a new block between two existing blocks. Claude tries Edit, but the `old_string` matches multiple locations.

Wrong approach: Use a very long `old_string` hoping to make it unique. This is fragile and may still fail.

Wrong approach: Append to the end of the file with Bash heredoc. This puts the block in the wrong location.

Correct approach: Read → modify → Write. Read the file, identify the correct insertion point, construct the complete updated content, and Write the new version.

### Tool Selection for Common Tasks

| Task | Primary Tool | Strategy |
| --- | --- | --- |
| Understand a file's logic | Read | Load and analyze contents |
| Create a new file | Write | Write entire content |
| Change one specific line | Edit | old_string → new_string |
| Change a section in a repetitive file | Read → Write | Read, modify, write back |
| Find files importing a package | Grep | Search contents for import statement |
| Find files by naming pattern | Glob | Search by name/path |
| Find an error message's source | Grep | Search for distinctive error text |
| Run tests | Bash | Execute test command |
| Check git history | Bash | Execute git log/diff |
| Map codebase structure | Glob + Read | Glob to find files, Read key files |

### Tool Selection in Codebase Exploration

When exploring an unfamiliar codebase, the right tool depends on what you are trying to learn:

**Understanding architecture:** Start with Glob to map the directory structure, then read key files (interfaces, base classes, entry points) to understand the design.

**Finding all callers of a function:** Read the function's module and any wrapper modules to identify all exported names, then Grep for each name across the codebase.

**Tracing an error message:** Grep for the distinctive text of the error message across the codebase, then Read the matching files to understand context.

**Decomposing a large task:** Glob to map the codebase structure, Grep to find patterns and dependencies, then create a prioritized plan for the most impactful areas.

### Agent SDK Built-in Tools Beyond File Operations

The Agent SDK includes additional built-in tools beyond file operations:

| Category | Tools | Purpose |
| --- | --- | --- |
| File operations | Read, Write, Edit | Interact with files |
| Search | Grep, Glob | Find content and files |
| Execution | Bash | Run shell commands |
| Web | WebSearch, WebFetch | Search the web, fetch pages |
| Discovery | ToolSearch | Find and load tools on demand |
| Orchestration | Agent, Skill | Spawn subagents, invoke skills |
| User interaction | AskUserQuestion | Ask the user for input |
| Task tracking | TaskCreate, TaskUpdate | Create and manage tasks |

ToolSearch is particularly important for Domain 2. Instead of loading every possible tool at session start (which consumes context with tool definitions), ToolSearch lets Claude discover and load tools on demand. This keeps the initial context lean and only loads tool definitions when they are actually needed.

★

**EXAM TIP:** When a question describes an agent with many tools where the tool definitions consume too much context, ToolSearch is the mechanism for on-demand tool loading. When a question asks about spawning subagents, the Agent tool is the mechanism. These are built-in tools, not custom tools or MCP tools.

Common Mistakes

- Using Grep when you should use Glob (searching for file names, not file contents).
- Using Edit on repetitive files where the old_string cannot be unique, use Read → Write instead.
- Loading all available tools at session start instead of using ToolSearch for on-demand loading.
- Running destructive Bash commands without validation, prefer Read and Edit for file modifications.

References

[Claude Codehttps://docs.anthropic.com/en/docs/claude-code](https://docs.anthropic.com/en/docs/claude-code)[Toolshttps://code.claude.com/docs/en/agent-sdk/tools](https://code.claude.com/docs/en/agent-sdk/tools)[Best Practiceshttps://docs.anthropic.com/en/docs/claude-code/best-practices](https://docs.anthropic.com/en/docs/claude-code/best-practices)

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="worked-examples-across-domain-2"></a>

## Worked Examples Across Domain 2

### Worked Example: Tool Description Rewrite for a Support System

A customer support system has three tools. The current descriptions cause frequent misrouting.

Tool Rewrite for a Support System

Nguồn tham khảo: Claude-Certified-Architect-Foundations-CCAR-F.pdf

Before (poor descriptions):

| Tool | Description |
| --- | --- |
| get_customer | "Get customer data" |
| get_orders | "Get order data" |
| process_refund | "Process a refund" |

Problems: "Get customer data" and "Get order data" are too similar. Claude cannot reliably distinguish between them when a user says "I need help with my account." The descriptions do not specify what each tool returns, what parameters it needs, or what it explicitly does NOT do.

After (clear descriptions with boundaries):

| Tool | Description |
| --- | --- |
| get_customer | "Retrieve customer profile by customer_id or email. Returns: name, email, phone, plan_type, account_status, created_date. Use when the user asks about their account, profile, or personal information. It DOES NOT return order history, use get_orders for that." |
| get_orders | "Retrieve order history for a customer by customer_id. Returns: order_id, date, items, quantities, status, total. Use when the user asks about orders, deliveries, purchases, or shipping. It does NOT return profile data, use get_customer for that." |
| process_refund | "Process a refund for a specific order. Requires: order_id, refund_amount, reason. Only use AFTER verifying the order exists with get_orders and confirming refund eligibility. Refunds above $100 require human approval, do NOT process these automatically." |

Each description specifies what the tool returns, what parameters it needs, when to use it, and what it does NOT do. The disambiguation statements prevent overlap. The process_refund description includes a prerequisite (verify order first) and a policy constraint (amount limit).

### Worked Example: Structured Error Flow in a Pipeline

A data enrichment pipeline has three stages: lookup → enrich → store. Each stage can fail in different ways.

**Stage 1 — Lookup:** Queries an external API for company data.

Possible failures:

| Failure | Category | Retryable | Correct Response |
| --- | --- | --- | --- |
| API returned 503 | service_unavailable | true | Retry with backoff |
| API returned 401 | permission_denied | false | Escalate — credentials need update |
| API returned 200 with empty results | N/A (not an error) | N/A | Return valid empty result |
| API connection timed out | timeout | true | Retry once, then annotate gap |

**Stage 2 — Enrich:** Takes lookup data and adds computed fields.

If Stage 1 returned a structured error, Stage 2 should NOT process it as data. It should propagate the error forward with context: "Enrichment skipped because lookup failed: [original error]." If Stage 1 returned a valid empty result, Stage 2 should handle the empty case gracefully rather than crashing on missing fields.

**Stage 3 — Store:** Writes the enriched data to a database.

If Stage 2 propagated an error from Stage 1, Stage 3 should NOT attempt to store partial or error data. It should log the propagated error and either retry the full pipeline or annotate the coverage gap.

The cascade without structured errors: Stage 1 times out → returns empty → Stage 2 processes empty as "no data" → Stage 3 stores a record with null fields → downstream reports show the company has no data. The truth is the lookup never succeeded.

The cascade with structured errors: Stage 1 times out → returns `{is_error: true, category: "timeout", retryable: true}` → Stage 2 sees the error and propagates it → Stage 3 sees the propagated error and logs it → the system retries → lookup succeeds → pipeline completes correctly.

### Worked Example: Tool Distribution for a CI/CD Review System

A CI/CD pipeline uses Claude Code for automated code review. The review has two phases:

**Phase 1 — Per-file review:** Each changed file is reviewed individually for local bugs, security issues, and error handling.

**Phase 2 — Cross-file integration review:** The changed files are reviewed together for interaction bugs, data flow issues, and contract mismatches.

Tool distribution:

| Agent | allowedTools | Reason |
| --- | --- | --- |
| Per-file reviewer | Read, Grep | Can read files and search for patterns, but cannot modify code or run commands |
| Integration reviewer | Read, Grep, Glob | Same as per-file, plus Glob for finding related files by naming pattern |
| Neither agent | Write, Edit, Bash, Agent | Review agents should not modify code, run commands, or spawn subagents |

Why read-only tools: The review agents need to understand the code but should never modify it. Restricting to read-only tools prevents a class of errors where the review agent accidentally "fixes" something, which would bypass the PR review process.

### Worked Example: MCP Resource Catalogs for Multi-Server Routing

A development team connects Claude to three MCP servers:

MCP Resource Catalogs for Multi-Server Routing

Nguồn tham khảo: Claude-Certified-Architect-Foundations-CCAR-F.pdf

1. **Jira MCP Server:** exposes tools for querying and creating issues
2. **Confluence MCP Server:** exposes tools for reading and searching documentation
3. **Database MCP Server:** exposes tools for querying production data

Without MCP resources: When a developer asks, "What is the status of the authentication refactor?", Claude has no way to know which server has the answer. It queries Jira (finds a ticket), then Confluence (finds a design doc), then the database (finds no relevant data). Three calls, one wasted.

With MCP resources, each server exposes a resource describing its content:

- **Jira resource:** Contains issue tracking data: project tickets, sprints, epics, bug reports, and feature requests. Query by project key, assignee, status, or text search.
- **Confluence resource:** Contains team documentation: design docs, architecture decisions, runbooks, and meeting notes. Search by title, space, or content.
- **Database resource:** Contains production data: user records, transactions, and system metrics. Query by table name and SQL.

Claude reads the resources and determines: "Authentication refactor" is likely a project ticket (Jira) and a design doc (Confluence). It queries both relevant servers and skips the database. Two calls, zero wasted.

### Worked Example: Parameter Description Impact on Input Quality

A date range parameter is defined without a description. Claude passes dates in inconsistent formats across calls.

Without parameter description:

```
// Call 1: "2026-01-15"
// Call 2: "January 15, 2026"
// Call 3: "01/15/2026"
// Call 4: "15-01-2026"
```

All four are valid date strings. None are consistent. The backend must handle four formats.

With parameter description:

```
"date_range": {
  "type": "object",
  "properties": {
    "start": {
      "type": "string",
      "description": "Start date in ISO 8601 format (YYYY-MM-DD). Inclusive."
    },
    "end": {
      "type": "string",
      "description": "End date in ISO 8601 format (YYYY-MM-DD). Inclusive. Maximum range: 90 days."
    }
  }
}
```

Now Claude consistently passes ISO 8601 dates because the parameter description specifies the format. Parsing ambiguity is eliminated.

### Worked Example: ToolSearch for On-Demand Tool Loading

A development agent has access to 30 MCP tools across multiple servers. Loading all 30 tool definitions at session start consumes approximately 6,000 tokens of context, leaving less room for code, conversation, and reasoning.

Without ToolSearch: All 30 definitions load at session start. The system prompt + tool definitions consume 10,000+ tokens before the first user message. Claude must evaluate all 30 descriptions on every turn. Performance degrades as the session grows.

With ToolSearch: Only the core built-in tools (Read, Write, Edit, Grep, Glob, Bash) load at session start. When Claude needs a specific MCP tool (like querying the database or creating a Jira ticket), it uses ToolSearch to discover and load that tool on demand. The session starts lean, and tool definitions are loaded only when needed.

What this shows: ToolSearch is the mechanism for managing tool definition overhead. In sessions with many available tools, on-demand loading preserves context for the actual work.

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="domain-2-services-appendix"></a>

## Domain 2 Services Appendix

### Tool Design Reference

| Component | Purpose | Impact on Reliability |
| --- | --- | --- |
| Tool name | Short identifier | Minor: Claude uses descriptions more than names |
| Tool description | Tells Claude when and why to use this tool | Major: primary signal for tool selection |
| Input schema | Defines accepted parameters | Major: determines if Claude can construct valid call |
| Parameter description | Tells Claude what to pass for each parameter | Moderate: reduces inconsistent inputs |
| Boundary statement | Defines what the tool does NOT do | Major: prevents misrouting to similar tools |

### tool_choice Reference

| Mode | Behavior | Use For |
| --- | --- | --- |
| auto | Claude decides whether to call a tool | General-purpose agents |
| any | Claude must call a tool, picks which | Multiple extraction schemas |
| tool | Claude must call a specific named tool | Mandatory extraction step |
| none | Claude cannot call any tool | Text-only response for one turn |

### Structured Error Response Reference

| Field | Purpose | Example Values |
| --- | --- | --- |
| is_error | Marks the result as an error | true / false |
| category | Type of failure | "timeout", "permission_denied", "validation_error", "not_found", "rate_limited", "service_unavailable" |
| description | What specifically happened | "Database connection timed out after 30s" |
| retryable | Whether the same call might succeed on retry | true / false |

### Error Category Recovery Reference

| Category | Retryable? | Recovery Strategy |
| --- | --- | --- |
| timeout | Yes | Retry with backoff |
| rate_limited | Yes | Wait, then retry |
| permission_denied | No | Escalate |
| not_found | No | Treat as valid empty if appropriate |
| validation_error | Sometimes | Fix input, then retry |
| service_unavailable | Yes | Try alternative source or annotate gap |

### MCP Configuration Reference

| Element | Description |
| --- | --- |
| MCP tools | Callable functions exposed by MCP servers |
| MCP resources | Read-only content catalogs describing server data |
| MCP prompts | Server-defined prompts surfaced as /mcp__ slash commands |
| .mcp.json | Project-level configuration (shared, version controlled) |
| ~/.claude.json | User-level configuration (personal, not shared) |
| ${VAR_NAME} | Environment variable expansion for secrets |

### Built-in Tool Reference

| Tool | Searches | Use For |
| --- | --- | --- |
| Read | N/A (loads file) | Understanding file contents |
| Write | N/A (creates/overwrites) | Creating files, fallback when Edit fails |
| Edit | N/A (modifies file) | Targeted changes using unique string match |
| Grep | File contents | Finding text patterns, imports, error messages |
| Glob | File names/paths | Finding files by naming pattern |
| Bash | N/A (executes commands) | Running tests, git operations, system commands |
| WebSearch | Web content | Searching the web for current information |
| WebFetch | Web pages | Fetching and parsing web page content |
| ToolSearch | Tool registry | Discovering and loading tools on demand |
| Agent | N/A (spawns subagent) | Delegating tasks to focused subagents |

### Agent SDK Tool Categories

| Category | Tools | Purpose |
| --- | --- | --- |
| File operations | Read, Write, Edit | Interact with files |
| Search | Grep, Glob | Find content and files |
| Execution | Bash | Run shell commands |
| Web | WebSearch, WebFetch | Search and fetch web content |
| Discovery | ToolSearch | On-demand tool loading |
| Orchestration | Agent, Skill | Spawn subagents, invoke skills |
| User interaction | AskUserQuestion | Ask the user for input |
| Task tracking | TaskCreate, TaskUpdate | Create and manage tasks |

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="domain-2-tool-design-mcp-integration-sample-questions"></a>

## Domain 2: Tool Design & MCP Integration Sample Questions

Question 1

Your developer productivity agent answers questions about customer transactions by querying a PostgreSQL database. During design review, a team member proposes letting Claude generate and execute raw SQL directly against the database based on user questions. What should the integration design include instead?

1. Expose the database connection directly so Claude can write and execute raw SQL against it based on user input.
2. Skip input validation to reduce latency and trust the model to generate safe queries in all cases.
3. Route all database access through a secure query interface that validates inputs and returns structured responses to the agent.
4. Ignore transaction boundaries and allow the agent to run queries without tracking or rolling back incomplete operations.

**Correct Answer:** 3

Explanation:

When an agent interacts with a database, it translates natural language questions into queries at runtime. Without a controlled interface between the agent and the database, the model's query output reaches the database driver unsanitized. Datadog Security Labs documented this exact failure in Anthropic's reference PostgreSQL MCP server implementation: the server directly concatenated unsanitized user input into SQL statements executed by the database driver without filtering or validation, creating a SQL injection path that allowed malicious queries to be embedded through ordinary user input.

Secure Query Interface vs. Direct Database Access

Nguồn tham khảo: Claude-Certified-Architect-Foundations-CCAR-F.pdf

The correct design routes all database access through a query interface that parameterizes inputs before execution, enforces the principle of least privilege by restricting the agent to read-only or scoped operations where possible, validates query structure against an allowed schema, and returns results as structured data that the agent can reason over safely. Anthropic's own reference implementation used a read-only constraint as a core safety guardrail, recognizing that granting agents write access without validation controls creates unacceptable data integrity risk.

Hence, the correct answer is: **Route all database access through a secure query interface that validates inputs and returns structured responses to the agent.**

The option that says: *Expose the database connection directly so Claude can write and execute raw SQL against it based on user input* is incorrect because arbitrary SQL execution on unsanitized input is a SQL injection vulnerability. A single malformed input reaching the database driver can exfiltrate records or modify data without restriction.

The option that says: *Skip input validation to reduce latency and trust the model to generate safe queries in all cases* is incorrect because model-generated SQL is not guaranteed safe on every invocation. Validation is primarily a structural control that operates independently of model behavior and cannot be substituted by trusting the model.

The option that says: *Ignore transaction boundaries and allow the agent to run queries without tracking or rolling back incomplete operations* is incorrect because multi-step write operations that fail mid-execution leave the database in a partially updated state with no recovery path. Transaction management is simply required to maintain data consistency.

References:

[Effective Context Engineering For Ai Agentshttps://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)[Claude Code Confighttps://claudecertifications.com/claude-certified-architect/domains/claude-code-config](https://claudecertifications.com/claude-certified-architect/domains/claude-code-config)

Question 2

Your extraction pipeline has a generic `analyze_document` tool that handles text extraction, data point identification, summarization, and claim verification. Users report inconsistent behavior, sometimes it extracts data, sometimes it summarizes, and the output format varies. Which of the following is the best approach to fix this?

1. Split `analyze_document` into separate, purpose-specific tools, each with a defined input/output contract for a single task.
2. Add a mode parameter to `analyze_document` like `mode='extract'` or `mode='summarize'` so the model can specify the desired behavior.
3. Improve the system prompt to specify when each behavior of `analyze_document` should be used.
4. Keep the single tool but add a few comprehensive, one-shot examples covering each use case.

**Correct Answer:** 1

Explanation:

In structured data extraction pipelines built with Claude, tool design is a primary driver of output consistency. When a single tool handles multiple overlapping responsibilities, text extraction, data point identification, summarization, and claim verification, the model has no reliable signal for which behavior to invoke for a given request. The result is exactly what the scenario describes: inconsistent behavior and variable output formats.

Generic Tool vs. Purpose-Specific Tools

Nguồn tham khảo: Claude-Certified-Architect-Foundations-CCAR-F.pdf

Accordingly, the Structured Data Extraction scenario identifies generic multi-purpose tools as a core anti-pattern. The correct fix is to decompose `analyze_document` into purpose-specific tools, each with a single clear responsibility and a defined input/output contract. For example:

- `extract_data_points` - accepts a document and a schema, returns structured field values
- `summarize_content` - accepts a document, returns a concise summary
- `verify_claim_against_source` - accepts a claim and a source document, returns a verification result

Each tool now has a description that unambiguously maps to one type of task. The model selects between them based on the user's intent rather than guessing which internal mode of a generic tool to invoke. Output format consistency follows naturally because each tool has a fixed, defined output contract, not a variable one that changes depending on how the model interprets the request.

This is the single responsibility principle applied to tool design: one tool, one job, one output shape.

Hence, the correct answer is: **Split `analyze_document` into separate, purpose-specific tools, each with a defined input/output contract for a single task.**

The option that says: *Add a mode parameter to analyze_document like mode='extract' or mode='summarize' so the model can specify the desired behavior* is incorrect because it preserves the fundamental problem, a single tool doing multiple things, while adding a layer of complexity. The model must now both select the tool and infer the correct mode value from the user's request. This only increases ambiguity rather than reducing it, and the output schema remains inconsistent across modes. A mode parameter is a surface-level fix that does not address the root cause.

The option that says: *Improve the system prompt to specify when each behavior of analyze_document should be used* is incorrect because prompt-based guidance is probabilistic. The model may follow the instructions most of the time, but the underlying tool remains ambiguous. In edge cases or ambiguous requests, the inconsistent behavior will persist. System prompt instructions guide behavior. They do not enforce output contracts or guarantee consistent tool selection.

The option that says: *Keep the single tool but add a few comprehensive, one-shot examples covering each use case* is incorrect because few-shot examples just add token overhead without fixing the structural ambiguity in the tool definition. The model can still misinterpret an overloaded tool regardless of how many examples are provided, especially on novel or ambiguous inputs. Examples are most effective when the tool itself is already well-defined; they cannot compensate for a poorly scoped tool design.

References:

[Define Toolshttps://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools](https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools)[Scenarioshttps://claudecertifications.com/claude-certified-architect/scenarios](https://claudecertifications.com/claude-certified-architect/scenarios)

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="additional-exam-guidance-for-domain-2"></a>

## Additional Exam Guidance for Domain 2

### How Domain 2 Connects to Other Domains

Domain 2 concepts appear throughout the exam because tools are the mechanism through which Claude interacts with the outside world. Understanding these connections helps you recognize Domain 2 patterns in questions that appear to belong to other domains.

**Connection to Domain 1 (Agentic Architecture):** The agentic loop relies on tools to take action. Tool design determines whether the loop produces reliable results. Tool distribution (`allowedTools`) is how you control what each subagent in a coordinator-subagent architecture can do. Structured error responses are what enable the coordinator to make recovery decisions.

**Connection to Domain 3 (Claude Code Configuration):** Built-in tools (Read, Write, Edit, Grep, Glob, Bash) are Claude Code's primary mechanisms for interacting with codebases. MCP server configuration (`.mcp.json`, `~/.claude.json`) determines which external tools are available. The `–system-prompt` vs. `–append-system-prompt` distinction in CI/CD affects whether Claude retains access to its built-in tools.

**Connection to Domain 4 (Prompt Engineering & Structured Output):** `tool_choice` controls whether Claude produces structured output or text. Strict tool use (`strict: true`) guarantees schema-valid tool inputs. Few-shot examples improve output format but do NOT fix tool misrouting, that requires better tool descriptions (a Domain 2 fix, not a Domain 4 fix).

**Connection to Domain 5 (Context Management & Reliability):** Verbose tool results fill the context window and accelerate context rot. Filtering tool results before returning them is both a Domain 2 design decision and a Domain 5 reliability measure. Structured error responses that distinguish access failures from valid empty results prevent downstream agents from producing confident but wrong output.

### Common Exam Patterns in Domain 2

The exam uses several recurring patterns for Domain 2 questions:

**The "wrong tool selected" pattern:** Claude consistently calls the wrong tool. The answer is almost always to improve tool descriptions, add specificity, boundary statements, and disambiguation. Never few-shot examples, never temperature, and never renaming alone.

**The "generic error" pattern:** A coordinator cannot recover because the tool returned a generic error. The answer is structured error responses with category, description, and retryability.

**The "false empty" pattern:** A downstream agent reports "no data" when the source was actually unreachable. The answer is distinguishing access failures from valid empty results using the `is_error` flag.

**The "over-permissive agent" pattern:** A subagent performs actions outside its role. The answer is restricting its tools with `allowedTools`.

**The "text instead of JSON" pattern:** An extraction pipeline sometimes gets text instead of structured output. The answer is changing `tool_choice` from auto to tool or any.

**The "Grep vs. Glob" pattern:** A question asks which tool to use for a search task. Content search → Grep. File name search → Glob.

### Decision Framework for Domain 2 Questions

When you encounter a Domain 2 question, use this framework:

1. Is the problem about Claude selecting the wrong tool? → Improve tool descriptions (specificity, boundaries, disambiguation).
2. Is the problem about error handling in tools? → Structured errors with category, description, retryability, and is_error flag.
3. Is the problem about an agent doing something outside its role? → Restrict tools with `allowedTools`.
4. Is the problem about inconsistent structured output? → Check `tool_choice` setting; use tool or any instead of auto.
5. Is the problem about MCP server configuration? → Shared in `.mcp.json`, personal in `~/.claude.json`, secrets via `${VAR_NAME}`.
6. Is the problem about choosing which built-in tool to use? → Content → Grep, names → Glob, modify → Edit (or Read → Write for repetitive files).

### Key Distinctions the Exam Tests

| Concept A | Concept B | The Distinction |
| --- | --- | --- |
| Tool name | Tool description | Description is the primary signal for tool selection, not the name |
| MCP tools | MCP resources | Tools are callable functions; resources are read-only content catalogs |
| MCP prompts | MCP tools | Prompts are slash command templates; tools are callable functions |
| access failure | valid empty result | Failure means query did not execute; empty means query returned nothing |
| tool_choice: auto | tool_choice: tool | Auto allows text response; tool guarantees tool call |
| tool_choice: any | tool_choice: tool | Any lets Claude pick which tool; tool forces a specific tool |
| strict tool use | semantic validation | Strict guarantees structure; validation checks meaning |
| Grep | Glob | Grep searches contents; Glob searches file names |
| Edit | Read → Write | Edit needs unique match; Read → Write works on repetitive files |
| .mcp.json | ~/.claude.json | Project-level (shared); user-level (personal) |
| allowedTools | permissions.deny | allowedTools restricts which tools; deny blocks specific actions |
| Few-shot examples | Tool descriptions | Examples fix output format; descriptions fix tool selection |
| Verbose results | Concise results | Verbose fills context quickly; concise preserves context budget |

### Worked Example: Full Domain 2 Scenario

**Scenario:** A customer support system has three tools: `lookup_customer` (retrieves customer profile), `lookup_orders` (retrieves order history), and `process_refund` (processes a refund). The system is experiencing three problems:

1. Claude sometimes calls `lookup_customer` when the user asks about orders.
2. When the order database times out, the agent tells the customer "you have no orders."
3. A subagent spawned for order investigation accidentally processes a refund.

Domain 2 analysis:

**Problem 1 — Tool misrouting:** The `lookup_customer` description is "Look up customer information." The `lookup_orders` description is "Look up orders." These descriptions overlap because "customer information" could include order history. Fix: Rewrite `lookup_customer` to "Retrieve customer profile data: name, email, plan, account status. Does NOT return order history, for that use lookup_orders." Rewrite `lookup_orders` to "Retrieve a customer's order history by customer_id. Returns order IDs, dates, items, and status. Does NOT return profile data, for that you can use lookup_customer."

**Problem 2 — False empty result:** The `lookup_orders` tool returns an empty array when the database times out. The agent interprets this as "no orders exist." Fix: Return a structured error when the database is unreachable: `{ "is_error": true, "category": "timeout", "description": "Order database connection timed out after 10s", "retryable": true }`. The agent can now distinguish "no orders" from "could not check."

**Problem 3 — Over-permissive subagent:** The order investigation subagent has access to all tools including `process_refund`. Fix: Set `allowedTools` for the investigation subagent to `["lookup_customer", "lookup_orders"]`. It can investigate but cannot take action.

**Correct architecture after fixes:** Clear tool descriptions with boundary statements → structured error responses with is_error, category, retryability → role-bounded tool sets with allowedTools.

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="ngu-n-tham-kh-o"></a>

## Nguồn tham khảo

*All links reference official Anthropic documentation.*

Tool Use Overview

[Overviewhttps://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview)

Tool Use Implementation

[Implement Tool Usehttps://docs.anthropic.com/en/docs/agents-and-tools/tool-use/implement-tool-use](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/implement-tool-use)

Tool Use Best Practices

[Best Practiceshttps://docs.anthropic.com/en/docs/agents-and-tools/tool-use/best-practices](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/best-practices)

Model Context Protocol

[Mcphttps://docs.anthropic.com/en/docs/agents-and-tools/mcp](https://docs.anthropic.com/en/docs/agents-and-tools/mcp)

Structured Outputs

[Structured Outputshttps://docs.anthropic.com/en/docs/build-with-claude/structured-outputs](https://docs.anthropic.com/en/docs/build-with-claude/structured-outputs)

Claude Code Overview

[Claude Codehttps://docs.anthropic.com/en/docs/claude-code](https://docs.anthropic.com/en/docs/claude-code)

Claude Code Settings

[Settingshttps://docs.anthropic.com/en/docs/claude-code/settings](https://docs.anthropic.com/en/docs/claude-code/settings)

Claude Code Best Practices

[Best Practiceshttps://docs.anthropic.com/en/docs/claude-code/best-practices](https://docs.anthropic.com/en/docs/claude-code/best-practices)

Agent SDK Tools

[Toolshttps://code.claude.com/docs/en/agent-sdk/tools](https://code.claude.com/docs/en/agent-sdk/tools)

Agent SDK MCP

[Mcphttps://code.claude.com/docs/en/agent-sdk/mcp](https://code.claude.com/docs/en/agent-sdk/mcp)

Agent SDK Agent Loop

[Agent Loophttps://code.claude.com/docs/en/agent-sdk/agent-loop](https://code.claude.com/docs/en/agent-sdk/agent-loop)

Agent SDK Custom Tools

[Custom Toolshttps://code.claude.com/docs/en/agent-sdk/custom-tools](https://code.claude.com/docs/en/agent-sdk/custom-tools)

Prompt Engineering Overview

[Overviewhttps://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)

Reduce Hallucinations

[Reduce Hallucinationshttps://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/reduce-hallucinations](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/reduce-hallucinations)

CCA-F Official Exam Page

[CCAFhttps://clau.de/CCAF](https://clau.de/CCAF)

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="d3-claude-code-configuration-workflows"></a>

# D3 — Claude Code Configuration & Workflows

> Source: [https://www.nvnhan.wiki/#/ccarf/docs](https://www.nvnhan.wiki/#/ccarf/docs)
> Exported from the rendered documentation by `Tool2/scrape_docs.py`.

## Table of contents

1. [A. The CLAUDE.md Configuration Hierarchy](#a-the-claude-md-configuration-hierarchy)
2. [B. Path-Scoped Rules with .claude/rules/](#b-path-scoped-rules-with-claude-rules)
3. [C. Custom Slash Commands and Skills](#c-custom-slash-commands-and-skills)
4. [D. Hooks for Deterministic Enforcement](#d-hooks-for-deterministic-enforcement)
5. [E. Permissions and Access Controls](#e-permissions-and-access-controls)
6. [F. MCP Server Configuration in Claude Code](#f-mcp-server-configuration-in-claude-code)
7. [G. Plan Mode vs. Direct Execution](#g-plan-mode-vs-direct-execution)
8. [H. Iterative Development Workflows](#h-iterative-development-workflows)
9. [I. Session Management](#i-session-management)
10. [J. Running Claude Code in CI/CD Pipelines](#j-running-claude-code-in-ci-cd-pipelines)
11. [K. Automated Code Review Patterns](#k-automated-code-review-patterns)
12. [L. Cost Optimization with the Message Batches API](#l-cost-optimization-with-the-message-batches-api)
13. [M. Claude Code's Built-in Tools](#m-claude-code-s-built-in-tools)
14. [N. Codebase Exploration Strategies](#n-codebase-exploration-strategies)
15. [O. The Self-Review Limitation](#o-the-self-review-limitation)
16. [Domain 3 Services Appendix](#domain-3-services-appendix)
17. [Domain 3: Claude Code Configuration & Workflows Output Sample Questions](#domain-3-claude-code-configuration-workflows-output-sample-questions)
18. [Nguồn tham khảo](#ngu-n-tham-kh-o)

---

<a id="a-the-claude-md-configuration-hierarchy"></a>

## A. The CLAUDE.md Configuration Hierarchy

CLAUDE.md is the primary way to give Claude Code persistent, project-level instructions. It is a Markdown file that Claude reads at the start of every session to understand your project's conventions, coding standards, architecture decisions, and preferences. Think of it as a README written specifically for Claude rather than for human developers. Anthropic's documentation describes CLAUDE.md as the place for "important project information, conventions, and frequently used commands."

Claude Code supports a hierarchy of CLAUDE.md files at three levels: project root, subdirectory, and user home, plus a modular `@imports` mechanism for sharing standards across packages. Understanding which level to use and recognizing that all CLAUDE.md content is advisory (not guaranteed) are two of the most frequently tested concepts in Domain 3.

Every Claude Code session begins by reading applicable CLAUDE.md files and injecting their contents into the system prompt. The memory system merges all applicable files at session start, global user preferences combine with project-specific context. This means the root CLAUDE.md, any applicable subdirectory CLAUDE.md files, and the user-level CLAUDE.md are all loaded together, giving Claude a composite view of the project and the developer's preferences.

### Root CLAUDE.md

The root CLAUDE.md sits at the top of your project directory. It contains project-wide instructions — coding standards, architectural patterns, and general conventions that apply everywhere in the codebase. Every session in the project loads this file.

Common contents include: the programming language and framework being used, preferred design patterns, naming conventions, testing requirements, build commands, and descriptions of intentional patterns that might otherwise look like anti-patterns (like force-unwrapping optionals in test files or using large coordinator classes that follow an established architecture).

A well-structured root CLAUDE.md helps Claude answer questions like: What language and framework is this project using? What are the naming conventions? Which patterns are intentional and should not be flagged? What commands should Claude run for testing? What modules or files should Claude avoid modifying?

It should contain information that materially changes Claude's decisions, not information Claude can easily infer from reading the code. Brief, explicit, and high-signal content performs better than long, verbose instructions. Anthropic's own guidance recommends keeping this section concise, if you have more than 15 rules, you likely haven't identified which rules are genuinely load-bearing.

### Subdirectory CLAUDE.md Files

CLAUDE.md files can be placed inside any folder in your project. When Claude is working on files within that directory, it loads that directory's CLAUDE.md in addition to the root file. This lets you scope instructions to specific areas of your codebase.

For example, you might place a CLAUDE.md inside `/terraform/` with Terraform-specific conventions, while `/kubernetes/` has its own CLAUDE.md with Kubernetes-specific guidance. This avoids mixing unrelated conventions in the root file and ensures Claude only receives context relevant to the area it's working on.

The directory-specific file supplements, rather than replaces, the root CLAUDE.md. Both are loaded together when Claude works in that directory. If there is a conflict between the root and subdirectory instructions, Claude may not resolve it consistently, which is one reason contradictory instructions should be avoided.

### User-Level CLAUDE.md

The user-level CLAUDE.md at `~/.claude/CLAUDE.md` applies across all projects for a specific developer. This is where personal preferences go, things such as your preferred coding style quirks, communication preferences, or cross-project tooling knowledge that you want Claude to follow regardless of which project you are working on.

This file is local to your machine and is never committed to version control. It merges with the project-level files at session start without conflicts, personal preferences layer on top of project conventions.

★

**EXAM TIP:** The exam frequently tests whether you can identify which CLAUDE.md file is appropriate for a given scenario. If the instruction applies to the entire team and should be version-controlled, it goes in the project's root CLAUDE.md. If it's a personal preference, it belongs in `~/.claude/CLAUDE.md`. If it applies only to a specific part of the codebase, consider a subdirectory CLAUDE.md or path-scoped rules.

### @imports for Shared Standards

CLAUDE.md supports `@imports` a syntax that lets you reference external Markdown files from within your CLAUDE.md. Instead of duplicating content across multiple files, you can import shared standards from a central location. This is particularly valuable in monorepo architectures where multiple packages need overlapping but not identical sets of standards.

For example, if your monorepo has shared coding standards stored in `/docs/standards/`, each package's CLAUDE.md can selectively import only the relevant standards:

```
# /packages/auth/CLAUDE.md
@docs/standards/security-rules.md
@docs/standards/testing-patterns.md

# /packages/notifications/CLAUDE.md
@docs/standards/testing-patterns.md
```

The auth package imports security rules because it handles user data, while the notifications package only needs the general testing patterns. Each package maintainer decides which standards are relevant based on their domain knowledge.

The key advantage of `@imports` over duplicating standards across packages is maintainability. When the security rules change, you update one file and every package that imports it gets the update. Without `@imports`, you would need to manually update every package's CLAUDE.md individually.

★

**EXAM TIP:** When a question describes a monorepo where package maintainers understand their own domain requirements and the question asks how to avoid duplicating irrelevant standards across packages, `@imports` in each package's CLAUDE.md is typically the right answer. This relies on each maintainer knowing which standards apply to their package. Compare this with `.claude/rules/` which uses path patterns to auto-load rules. That approach doesn't require maintainer knowledge but requires someone to explicitly list every package directory in the YAML frontmatter.

### Advisory Nature of CLAUDE.md

One critical characteristic of CLAUDE.md that the exam tests repeatedly is that it is advisory, not deterministic. Claude processes the instructions as context, but it does not guarantee 100% compliance. Anthropic's documentation states that Claude treats CLAUDE.md content as context that "may or may not be relevant" to the current task. The memory system influences behavior, but it is not a hard policy engine.

In practice, this means Claude usually follows CLAUDE.md instructions but not always. Adding emphasis markers such as "IMPORTANT" or "YOU MUST" can improve adherence. Anthropic's own documentation confirms that marking a rule as IMPORTANT increases the probability that Claude treats it as a priority constraint rather than a preference. However, even with emphasis, compliance is probabilistic, not guaranteed.

For rules you need Claude to follow every single time without exception, you need a deterministic enforcement mechanism like hooks or permission settings. This distinction between advisory and deterministic is the most frequently tested concept across all of Domain 3.

### The /memory Diagnostic Command

The `/memory` command shows which memory files (including CLAUDE.md) are currently loaded in Claude's context. This is the most efficient first diagnostic step when Claude inconsistently follows conventions defined in CLAUDE.md.

If your CLAUDE.md specifies that endpoint handlers should use a custom ApiError class but Claude sometimes uses generic try/catch blocks, the first step is to run `/memory` and verify that your CLAUDE.md is actually being loaded. If it's not loaded, that explains the inconsistency, perhaps the file is in the wrong location, has a filename typo, or the directory scope is incorrect. If it is loaded, the issue is the advisory nature of CLAUDE.md, and you may need stronger enforcement through hooks.

★

**EXAM TIP:** When a question describes inconsistent convention-following "across different coding sessions" and asks for the "most efficient first diagnostic step", the answer is `/memory`. Don't jump to adding more examples, creating path-specific rules, or searching for conflicting instructions until you've first confirmed the file is loading.

Common Mistakes

- Treating CLAUDE.md as a hard enforcement mechanism rather than advisory guidance.
- Placing personal preferences in the project root CLAUDE.md instead of `~/.claude/CLAUDE.md`.
- Making the root CLAUDE.md too long (300+ lines) with information Claude can infer from reading the code.
- Contradicting instructions between root and subdirectory files, which creates inconsistent behavior.
- Not verifying with `/memory` that CLAUDE.md is actually loading before adding stronger enforcement.

References

[Memoryhttps://docs.anthropic.com/en/docs/claude-code/memory](https://docs.anthropic.com/en/docs/claude-code/memory)[Settingshttps://docs.anthropic.com/en/docs/claude-code/settings](https://docs.anthropic.com/en/docs/claude-code/settings)

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="b-path-scoped-rules-with-claude-rules"></a>

## B. Path-Scoped Rules with .claude/rules/

The `.claude/rules/` directory provides a more targeted alternative to subdirectory CLAUDE.md files. Files placed here use YAML frontmatter to specify exactly which file paths they apply to. When Claude works on a file matching the specified path pattern, the corresponding rule file loads automatically into context. When Claude is working on unrelated files, the rule stays out of context entirely, saving tokens and avoiding irrelevant instructions.

Rules files are version-controlled alongside the project and follow the same advisory nature as CLAUDE.md, they influence Claude's behavior but do not deterministically enforce it. The primary advantage over root CLAUDE.md is token efficiency: only relevant rules load for each file type, rather than every instruction loading for every task.

### YAML Frontmatter Path Patterns

A rules file looks like this:

```
---
paths:
  - "terraform/**/*"
---
Use Terraform 1.5+ syntax. Always include a description for each variable.
Pin provider versions in required_providers blocks.
```

This rule loads only when Claude edits files under the `terraform/` directory. When Claude is working on Kubernetes manifests or CI/CD scripts, this rule stays out of context entirely.

You can create multiple rules files, each targeting different path patterns. For example:

```
.claude/rules/terraform.md  → paths: ["terraform/**/*"]
.claude/rules/kubernetes.md → paths: ["kubernetes/**/*"]
.claude/rules/typescript.md → paths: ["**/*.ts", "**/*.tsx"]
.claude/rules/pipelines.md  → paths: ["pipelines/**/*", ".github/**/*"]
```

Each file carries its own domain-specific conventions, and Claude only loads the ones relevant to the files it's currently working on.

### When to Use Rules vs. CLAUDE.md

| Mechanism | Best For | Token Behavior | Version Controlled |
| --- | --- | --- | --- |
| Root CLAUDE.md | Project-wide instructions that apply everywhere | Always loaded | Yes |
| Subdirectory CLAUDE.md | Simple, directory-scoped conventions | Loaded when working in that directory | Yes |
| .claude/rules/ | Domain-specific conventions for distinct file types | Loaded only when matching files are touched | Yes |

Use `.claude/rules/` files when your project has distinct areas with different conventions and you want to minimize token consumption. A 500-line root CLAUDE.md that mixes Terraform, Kubernetes, and CI/CD conventions wastes tokens every time Claude works on just one of those areas. Path-scoped rules solve this by loading only what's relevant.

Use subdirectory CLAUDE.md files when the conventions are simpler and the directory structure already provides natural scoping. Use root CLAUDE.md for project-wide instructions that apply everywhere.

★

**EXAM TIP:** The exam tests path-scoped rules in scenarios involving infrastructure-as-code repositories or monorepos with distinct file types. If a question mentions that a root CLAUDE.md has grown too large (e.g., 500+ lines) and irrelevant rules are consuming tokens when working on specific file types, the answer is `.claude/rules/` files with YAML frontmatter path scoping.

Common Mistakes

- Using `.claude/rules/` for instructions that should apply everywhere, those belong in root CLAUDE.md.
- Assuming rules files provide deterministic enforcement, they are advisory, like CLAUDE.md.
- Creating overlapping path patterns across multiple rule files, which can cause conflicting instructions.

Reference

[Settingshttps://docs.anthropic.com/en/docs/claude-code/settings](https://docs.anthropic.com/en/docs/claude-code/settings)

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="c-custom-slash-commands-and-skills"></a>

## C. Custom Slash Commands and Skills

Claude Code skills are reusable workflow definitions that developers can invoke on demand via /slash commands. They solve the problem of repetitive workflows that need to run the same way every time without cluttering the always-loaded CLAUDE.md with instructions for tasks that only happen occasionally.

A key insight is that skills are on-demand and they only load when explicitly invoked by a developer typing the slash command. This contrasts with CLAUDE.md (always loaded) and rules (conditionally loaded based on file paths). Skills are the right choice when instructions are needed occasionally for specific workflows, not as persistent context.

### Skill File Structure

A skill is defined in a SKILL.md file placed inside `.claude/skills/<skill-name>/`. The directory name determines the slash command. For example:

```
.claude/skills/migrate-component/SKILL.md
```

This creates a `/migrate-component` slash command. The SKILL.md file contains the step-by-step instructions for Claude to follow during the workflow. The content is plain Markdown — it can include checklists, code examples, decision trees, and any other instructions that define the workflow.

A typical skill file might look like:

```
Component Migration Workflow
1. Read the source component and identify all props and state
2. Create the new component file following our naming convention
3. Migrate props to TypeScript interfaces
4. Convert class lifecycle methods to hooks
5. Update all import statements in consuming files
6. Run the test suite and fix any failures
7. Update the component's Storybook story
```

### Project-Level vs. User-Level Skills

Project-Level vs. User-Level Skills

Nguồn tham khảo: Claude-Certified-Architect-Foundations-CCAR-F.pdf

Project-level skills are placed in `.claude/skills/` at the project root and committed to version control. Every team member gets the same skill, and updates propagate through Git. This is the correct choice when the skill is a team workflow that should stay in sync as the team iterates on it.

User-level skills are placed in `~/.claude/skills/` on each developer's machine. These are personal workflows that only one developer uses. They are not committed to version control and are not shared with the team.

★

**EXAM TIP:** The exam tests skill placement in scenarios where a team needs a shared, version-controlled workflow invoked by a slash command (like `/migrate-component` or `/review`). The correct answer is the project-level path: `.claude/skills/<name>/SKILL.md` at the project root, committed to version control. Watch for distractors like `~/.claude/skills/` (user-level, not shared), `settings.json` (not how skills work), or root CLAUDE.md (loads every session, not on demand).

### Skills vs. CLAUDE.md vs. Rules

The distinction is about when instructions load:

| Mechanism | When It Loads | Use For | Token Impact |
| --- | --- | --- | --- |
| CLAUDE.md | Every session, always in context | Conventions that should always apply | Always consumed |
| Rules | Conditionally, when Claude works on matching file paths | Path-specific conventions | Consumed only when files match |
| Skills | On demand, when a developer invokes the slash command | Complex workflows that run occasionally | Consumed only when invoked |

WORKED EXAMPLE:

A team has an 8-item code review checklist that they use when reviewing PRs. They don't use this checklist during feature development, debugging, or documentation work. If the checklist were in CLAUDE.md, it would load during every session, consuming tokens during tasks where it provides no value. If it were in `.claude/rules/`, it would need a path pattern, but code reviews apply to all file types, so the pattern would be `**/*`, which loads it everywhere, no better than CLAUDE.md. The correct placement is a skill: `.claude/skills/review/SKILL.md`. Developers invoke `/review` only when they need the checklist, keeping it out of context during all other work.

Common Mistakes

- Putting detailed workflow instructions in CLAUDE.md when they're only used occasionally, use a skill instead.
- Using `~/.claude/skills/` for team workflows that should be shared and version-controlled.
- Confusing skills (on-demand) with rules (auto-loaded based on file paths).

Reference

[Skillshttps://docs.anthropic.com/en/docs/claude-code/skills](https://docs.anthropic.com/en/docs/claude-code/skills)

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="d-hooks-for-deterministic-enforcement"></a>

## D. Hooks for Deterministic Enforcement

Hooks are the mechanism for deterministic enforcement in Claude Code. Unlike CLAUDE.md instructions, which are advisory, hooks are user-defined shell commands that run automatically at specific points in Claude's execution life cycle. They always execute, Claude cannot skip or ignore them. This makes hooks the correct choice when a rule must be followed every single time without exception.

Anthropic's documentation describes hooks as "user-defined event handlers that run shell commands or scripts at specific points in Claude Code's lifecycle." The critical distinction is that hooks do not depend on the model remembering to format code or run tests, they execute every single time their conditions are met, regardless of what the AI decides to do.

Hooks live in JSON configuration files: `.claude/settings.json` (committed to git, shared with the team) or `.claude/settings.local.json` (gitignored, personal). Both files are picked up automatically by the Claude Code CLI.

### PreToolUse Hooks

PreToolUse hooks run before Claude executes a tool (like Edit, Write, Bash, or any MCP tool). They can inspect the planned action and either allow it, block it, or modify it. When a PreToolUse hook returns exit code 2, the tool is blocked, even in `bypassPermissions` mode or with `--dangerously-skip-permissions`. This makes PreToolUse hooks the strongest enforcement mechanism available.

Use PreToolUse hooks when you need to prevent Claude from doing something, like blocking destructive shell commands (`rm -rf`, `DROP TABLE`), validating inputs before they execute, or enforcing that certain files are never modified.

### PostToolUse Hooks

PostToolUse hooks run after Claude has completed a tool execution successfully. They receive both the tool input (arguments sent to the tool) and the tool response (result it returned). They can inspect the result and run follow-up actions.

Use PostToolUse hooks when you need to automatically process Claude's output, like running a code formatter on every file Claude modifies, executing lint checks after code changes, or logging tool invocations for audit purposes.

A common PostToolUse configuration runs Black (Python) or Prettier (JavaScript/TypeScript) after every file edit:

```
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "npx prettier --write \"$CLAUDE_TOOL_INPUT_FILE_PATH\""
          }
        ]
      }
    ]
  }
}
```

### Hook Matchers

Each hook specifies a matcher that determines which tool triggers the hook. The matcher is an optional regex filter. Common matchers include:

- `Edit` or `Write`: triggers on file modifications
- `Edit|Write`: triggers on either edit or write operations
- `Bash`: triggers on shell command execution
- `Write(*.py)`: triggers only on Python file writes
- Specific MCP tool names using the pattern `mcp__server__tool`: triggers on calls to external tools

The matcher is what makes hooks targeted rather than blanket. You can have a PostToolUse hook that runs Prettier only on file edits, without triggering on Bash commands or MCP calls. If no matcher is specified, the hook fires for every tool call.

### Hooks vs. CLAUDE.md — Advisory vs. Deterministic

This is the most frequently tested distinction in Domain 3.

| Concept | Best Used For | Key Benefit | Common Exam Trap |
| --- | --- | --- | --- |
| CLAUDE.md (advisory) | Coding preferences, architectural guidelines, style conventions | Easy to write, always in context | Trusted to guarantee compliance when it cannot |
| Hooks (deterministic) | Formatting enforcement, validation, security checks, logging | Always runs, no exceptions | Overlooked when a CLAUDE.md instruction is inconsistently followed |

WORKED EXAMPLE:

A CLAUDE.md file includes the rule: "IMPORTANT: Always run Prettier after editing TypeScript files." Despite the emphasis, approximately 15% of files Claude generates still have inconsistent formatting. Adding stronger language does not eliminate the remaining violations. The solution is a PostToolUse hook with an `Edit|Write` matcher that automatically runs Prettier on every modified file. The hook runs outside of Claude's decision-making process — Claude does not decide whether to format; the hook handles it deterministically after every file modification. Result: 100% formatting compliance, regardless of what Claude generates.

★

**EXAM TIP:** When a question describes Claude inconsistently following a CLAUDE.md formatting rule, and emphasis doesn't eliminate the problem, the answer is a PostToolUse hook. The exam specifically tests whether you understand that CLAUDE.md is advisory while hooks are deterministic. The most common scenario is code formatting: Prettier, Black, or similar tools should run on every file modification.

Common Mistakes

- Expecting CLAUDE.md emphasis ("IMPORTANT," "YOU MUST") to guarantee compliance improves probability but cannot eliminate violations.
- Using a PreToolUse hook for post-processing (like formatting) — that's the job of PostToolUse.
- Forgetting that hooks fire for subagent actions too, if Claude spawns a subagent, your hooks execute for every tool the subagent uses.
- Not specifying a matcher, which causes the hook to fire on every tool call, adding latency to operations that don't need it.

Reference

[Hookshttps://docs.anthropic.com/en/docs/claude-code/hooks](https://docs.anthropic.com/en/docs/claude-code/hooks)

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="e-permissions-and-access-controls"></a>

## E. Permissions and Access Controls

Permissions provide hard guardrails that prevent Claude from performing specific actions entirely. Unlike CLAUDE.md (advisory) and hooks (run scripts around actions), permissions block actions before they can even begin. Permissions are the most restrictive enforcement mechanism; they are a hard block that Claude physically cannot circumvent.

Together, permissions, CLAUDE.md, and hooks form a spectrum of enforcement strength. The exam frequently tests whether you can match each requirement to the appropriate mechanism based on how strictly it needs to be enforced.

### permissions.deny for Hard Restrictions

The `permissions.deny` setting in project or user settings completely blocks Claude from performing specific tool actions on matching paths. For example:

```
{
  "permissions": {
    "deny": ["Edit(./db/migrations/**)"]
  }
}
```

This prevents Claude from editing any file in the `db/migrations/` directory. Unlike a CLAUDE.md instruction saying "don't edit migrations," this is a hard block, so Claude physically cannot modify those files. Unlike a PreToolUse hook, this doesn't require writing a script, it's a declarative configuration.

### Combining Permissions, CLAUDE.md, and Hooks

Different requirements call for different enforcement mechanisms. A common exam scenario presents three requirements that each need a different mechanism:

| Requirement | Enforcement Level | Mechanism |
| --- | --- | --- |
| "Claude must never modify files in db/migrations/" | Hard block | permissions.deny |
| "Claude should prefer a custom logging module over console.log" | Advisory preference | CLAUDE.md |
| "All TypeScript files must be auto-formatted with Prettier after every edit" | Deterministic automation | PostToolUse hook |

The key insight: the word "never" signals `permissions.deny`. The words "prefer" or "should" signal CLAUDE.md. The word "automatically" or "always" with an automation task signals hooks.

★

**EXAM TIP:** When a question presents multiple requirements and asks you to "restructure" them across Claude Code's configuration mechanisms, match each requirement's enforcement level: permissions for absolute blocks, CLAUDE.md for preferences and conventions, and hooks for automatic actions.

WORKED EXAMPLE:

A team currently has all three requirements in their CLAUDE.md:

1. "Never modify database migration files"
2. "Use our custom ErrorHandler class instead of generic try/catch"
3. "Run ESLint after every TypeScript file modification"

All three are in CLAUDE.md, but only requirement 2 belongs there. Requirement 1 needs `permissions.deny` because "never" means absolute block. Requirement 3 needs a PostToolUse hook because "run after every modification" means deterministic automation. After restructuring: `permissions.deny: ["Edit(./db/migrations/**)"]`, CLAUDE.md retains only the ErrorHandler preference, and a PostToolUse hook with `Edit|Write` matcher runs ESLint on `.ts` files.

Reference

[Settingshttps://docs.anthropic.com/en/docs/claude-code/settings](https://docs.anthropic.com/en/docs/claude-code/settings)

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="f-mcp-server-configuration-in-claude-code"></a>

## F. MCP Server Configuration in Claude Code

The Model Context Protocol (MCP) allows Claude Code to connect to external tools, data sources, and services. MCP servers extend Claude's capabilities beyond its built-in tools. Configuration scoping determines which servers are shared with the team and which are personal.

MCP servers are added via the CLI command `claude mcp add <server-name>` or by editing the configuration files directly. By default, MCP servers are added at project scope. Environment variables can be used for secrets (like API keys) through expansion syntax, so credentials are never committed to version control.

### .mcp.json — Project-Level Configuration

The `.mcp.json` file lives at the project root and is committed to version control. All team members who work on the project get the same MCP servers. Use this for shared tools that the entire team needs — like a venue lookup service, a database explorer, or an internal API.

Environment variables are expanded in the configuration, allowing you to reference secrets without committing them:

```
{
  "mcpServers": {
    "venue-lookup": {
      "command": "node",
      "args": ["./mcp-servers/venue-lookup/index.js"],
      "env": {
        "API_KEY": "${VENUE_API_KEY}"
      }
    }
  }
}
```

The `${VENUE_API_KEY}` is expanded from each developer's environment at runtime. The API key never appears in version control.

### ~/.claude.json — User-Level Configuration

The `~/.claude.json` file lives in the user's home directory and is not shared with the team. Use this for personal or experimental MCP servers that only you are testing.

★

**EXAM TIP:** The exam tests MCP scoping with scenarios like "Add a shared venue lookup server for the team AND a personal experimental playlist server for yourself." Shared → `.mcp.json`. Personal → `~/.claude.json`. Watch for distractors that reverse the order.

### MCP Prompts as Slash Commands

When an MCP server exposes prompts (like `deploy_checklist` or `incident_response`), Claude Code surfaces these as slash commands with the naming convention `/mcp_<servername>_<promptname>`. Arguments are passed after the command name.

These prompts are not automatically prepended to conversations, not added to the tool registry for automatic invocation, and not surfaced as @-mentionable resources. They are strictly slash commands that developers invoke explicitly.

★

**EXAM TIP:** If the exam asks how MCP prompts become accessible within Claude Code the answer is slash commands. Every other option is a distractor.

### MCP Resources for Content Catalogs

MCP servers can also expose resources structured content catalogs that give Claude visibility into what data each server contains. This is valuable when Claude connects to multiple servers (like an issue tracker, a documentation wiki, and a database explorer) and needs to efficiently query across them.

Without resources, Claude has no visibility into what content each server contains, leading to excessive exploratory tool calls and wasted context. When each server exposes its content catalog as MCP resources (issue summaries, documentation hierarchy, database schemas), Claude can make informed decisions about which server to query for each part of a cross-system question.

The difference between resources and tools is important: tools are callable functions that perform actions (query a database, create a ticket). Resources are read-only content catalogs that describe what data each server contains. Resources help Claude decide which tool to call, they are informational, not operational.

★

**EXAM TIP:** When a question describes Claude making too many sequential exploratory calls across multiple MCP servers because it "lacks visibility into what content each server contains," the answer is to expose each server's content catalog as MCP resources.

Common Mistakes

- Putting personal MCP servers in `.mcp.json` (project-level). They'll be committed to version control and shared with the team.
- Hardcoding API keys in `.mcp.json` instead of using environment variable expansion.
- Confusing MCP resources (read-only content catalogs) with MCP tools (callable functions).
- Expecting MCP prompts to auto-load into context, they only appear as slash commands.

References

[Settingshttps://docs.anthropic.com/en/docs/claude-code/settings](https://docs.anthropic.com/en/docs/claude-code/settings)[Mcphttps://docs.anthropic.com/en/docs/agents-and-tools/mcp](https://docs.anthropic.com/en/docs/agents-and-tools/mcp)

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="g-plan-mode-vs-direct-execution"></a>

## G. Plan Mode vs. Direct Execution

Plan Mode vs. Direct Execution

Nguồn tham khảo: Claude-Certified-Architect-Foundations-CCAR-F.pdf

Claude Code operates in two primary modes that serve different purposes. Plan mode is Claude's "think before acting" mode where Claude analyzes the codebase, evaluates tradeoffs, and presents a plan without making changes. Direct execution is Claude's "just do it" mode, where Claude reads code, makes changes, runs tests, and delivers the result. Knowing when to use each is a significant portion of the Domain 3 exam.

The decision between modes is not about preference or difficulty; it is about whether the task benefits from explicit analysis before action. Some tasks have a single obvious path; others require investigation, enumeration, and comparison before committing. The exam tests your judgment in distinguishing these two cases.

### When to Use Plan Mode

Use plan mode when:

- You are unfamiliar with the module or codebase area you need to work in.
- A critical production bug needs investigation before attempting a fix, you need to understand the module's architecture, enumerate potential root causes, and prioritize fixes systematically.
- The task has multiple possible approaches, and you need to evaluate tradeoffs before committing (like choosing between WebSockets, Server-Sent Events, or polling).
- A security audit or large migration requires mapping affected code paths across many files before implementing.

WORKED EXAMPLE:

A developer is assigned a critical production bug in the inventory service. They have never worked on this module before. The bug causes inventory counts to drift from the database under high concurrency. Without plan mode, the developer might ask Claude to "fix the concurrency bug" — but Claude would be guessing at the architecture, the locking strategy, and the root cause. With plan mode, Claude first reads the module's structure, identifies the database access patterns, maps the locking mechanisms, enumerates potential race conditions, and presents a prioritized list of likely root causes. The developer reviews the analysis before asking Claude to implement a fix.

### When to Use Direct Execution

Use direct execution when:

- The task is simple, well-scoped, and low-risk, like adding a date validation check to one function in one file.
- The requirements are clear, and you know exactly what needs to happen.
- The scope is limited, one file, one function, one change.

| Scenario | Right Mode | Reason |
| --- | --- | --- |
| Add a date validation check to one function | Direct execution | Simple, one file, one change |
| Critical bug in unfamiliar module | Plan mode | Need to understand architecture first |
| Choose between WebSockets vs SSE vs polling | Plan mode | Multiple approaches, need tradeoff analysis |
| Rename getUserData to fetchUserProfile everywhere | Direct execution | Mechanical, clear outcome |
| Library migration across 45 files | Plan mode | Large scope, multiple decisions |
| Add a null check to one conditional | Direct execution | Simple, well-scoped |
| Improve error handling across a module | Plan mode | Ambiguous, many decisions, interacting concerns |

### When Multi-Phase Workflows Improve Outcomes

Not every task benefits from a multi-phase approach (analyze → propose → implement with review).

**Benefits from multi-phase:** Tasks that are ambiguous, complex, or have multiple valid approaches. For example, "Improve unambiguous error handling throughout the data processing module, add try/catch blocks, provide meaningful error messages, and ensure failures don't silently corrupt data." This has many decisions to make, interacting concerns, and no single obvious path.

**Does NOT benefit from multi-phase:** mechanical, well-defined tasks with a clear, correct outcome. For example, "rename the `getUserData` function to `fetchUserProfile` everywhere it's used." This is an unambiguous find-and-replace, multi-phase planning adds overhead without improving the result.

★

**EXAM TIP:** When a question asks which of two requests benefits more from an explicit multi-phase workflow, it's always the ambiguous, judgment-heavy task, not the mechanical transformation.

Reference

[Best Practiceshttps://docs.anthropic.com/en/docs/claude-code/best-practices](https://docs.anthropic.com/en/docs/claude-code/best-practices)

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="h-iterative-development-workflows"></a>

## H. Iterative Development Workflows

The exam tests your ability to choose the right iterative workflow pattern for each situation. The key insight is that different types of problems require different iteration strategies, test-driven for complex algorithms, incremental for interacting issues, concrete examples for edge cases, and requirements discovery for undefined problems.

Iterative development with Claude Code relies on the quality of your feedback. What moves it forward is a clear, unambiguous signal about what needs to change, so vague nudges like "try again" or "do better" tend to leave Claude guessing. The feedback that lands is concrete: test results, error messages, specific input/output pairs. Subjective coaching like "handle edge cases better" or "be more careful" gives Claude nothing solid to act on.

### Test-Driven Iteration

Test-Driven Iteration

Nguồn tham khảo: Claude-Certified-Architect-Foundations-CCAR-F.pdf

The most effective pattern for iterative refinement with Claude Code is to write tests first, then ask Claude to write code that passes them. When tests fail, share the failure output with Claude and ask it to fix the code. This creates a tight feedback loop where test results serve as objective, unambiguous signals about what needs to change.

This approach works particularly well for complex algorithms with specific edge cases and performance requirements (like graph traversal with cycles, disconnected nodes, and weighted edges). Instead of describing desired behavior in natural language (which can be ambiguous), the tests define it precisely.

WORKED EXAMPLE:

A developer needs to implement a graph traversal algorithm that handles cycles, disconnected nodes, and weighted edges with specific performance constraints. Instead of describing these requirements in natural language:

1. Write a test suite with specific inputs and expected outputs for each edge case.
2. Ask Claude to implement the algorithm.
3. Run the tests and share the failure output: "Test 3 failed: expected [A, B, D] but got [A, B, C, D] for graph with cycle at node C."
4. Claude adjusts the implementation to handle the cycle detection.
5. Repeat until all tests pass.

Each iteration provides Claude with an objective, specific signal and not "handle cycles better" but "this specific input produced this wrong output."

★

**EXAM TIP:** When a question describes implementing a complex feature with specific requirements and asks how to structure the workflow for "efficient iterative refinement," the answer is test-driven iteration: write the test suite first, then iterate by sharing test failures.

### Incremental Problem Solving

Incremental Problem Solving

Nguồn tham khảo: Claude-Certified-Architect-Foundations-CCAR-F.pdf

When multiple issues interact, like table column widths, date formatting, and page breaks in a PDF report, the correct approach is to fix them one at a time, testing after each change. Start with the most foundational issue (column widths), verify it works, then fix the next dependent issue (date formatting within the corrected columns), then the next (page breaks that depend on content height).

This is more reliable than batching all fixes into one prompt, because interacting problems create cascading side effects that are difficult to diagnose when everything changes simultaneously.

★

**EXAM TIP:** If a question describes interacting issues and asks for the "most effective approach for iterating toward a working solution," the answer is incremental fixes with testing after each step.

### Providing Concrete Test Cases

When Claude's output doesn't handle edge cases correctly, the most effective iteration technique is providing a concrete test case with specific input and expected output. For example, if a data migration script doesn't handle null values correctly, provide a specific input record with null values and show exactly what the output should be.

This is more effective than describing the problem in natural language ("handle edge cases better"), adding emphasis ("IMPORTANT: think harder"), asking Claude to regenerate entirely, or manually editing the code yourself.

The reason concrete examples work better than descriptions is the same reason few-shot prompting works better than zero-shot: showing Claude the exact expected behavior removes ambiguity that descriptions leave open to interpretation.

### Requirements Discovery Interview and TBD Patterns

When you have a rough idea but aren't sure about all the requirements for a robust implementation, two effective patterns exist:

**Interview pattern:** Ask Claude to interview you about the requirements before implementing, surfacing considerations you may not have thought of (like invalidation strategies, cache layers, consistency guarantees, and failure modes for a caching implementation).

**TBD marker pattern:** Write a specification with your known requirements and "TBD" markers for uncertain areas, then have Claude propose solutions for each TBD as it implements.

Both patterns help surface unknown unknowns before you commit to an implementation direction.

★

**EXAM TIP:** When a question describes someone with a rough idea ("Redis with 5-minute TTL") who is "new to production caching and isn't sure what other considerations a robust implementation requires," the answer involves either the interview or TBD approach, not jumping straight into a minimal implementation.

### @References for One-Off Context

When you need Claude to follow patterns from existing code for a one-off task, use `@references` to include specific files directly in your prompt. For example, if you're implementing a payment processing module that should follow the same patterns as your existing `db_utils.py`, `error_handlers.py`, and `audit_logger.py`, reference all three with @ syntax.

This is preferable to describing the patterns in natural language (less precise), adding them to CLAUDE.md (unnecessary for a one-off task, they'd load every session), or asking Claude to explore the codebase to find the patterns itself (slower and less targeted).

★

**EXAM TIP:** When a question describes a one-off task where Claude should follow existing patterns in specific files, and the patterns are "well-documented in the team wiki and don't need additional project-level documentation," @references is the answer.

Common Mistakes

- Using vague feedback ("handle edge cases better") instead of concrete test cases with specific input and expected output.
- Batching multiple interacting fixes into one prompt instead of fixing them incrementally.
- Jumping straight to implementation when requirements are uncertain — the interview pattern surfaces critical considerations first.
- Adding patterns to CLAUDE.md for a one-off task when @references would keep the context temporary.

Reference

[Best Practiceshttps://docs.anthropic.com/en/docs/claude-code/best-practices](https://docs.anthropic.com/en/docs/claude-code/best-practices)

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="i-session-management"></a>

## I. Session Management

Claude Code provides several mechanisms for managing sessions across work periods and parallel exploration paths. The exam tests your ability to choose the right session management strategy for each situation, from resuming named sessions to forking for parallel exploration to spawning sub-agents when context degrades.

Each mechanism addresses a different problem: resumption preserves accumulated context across time. Forking preserves context across parallel exploration paths. Sub-agent spawning addresses context degradation during long sessions. Scratchpad files address the gradual loss of specificity as conversation history grows. Understanding which problem each mechanism solves is the key to selecting the right one.

### Resuming Named Sessions

The `--resume <session-name>` flag lets you continue a previous session by name. This preserves all accumulated context from the prior session. For example, if yesterday you named a session `auth-deep-dive` during a 2-hour investigation of authentication flows, you can resume it with `--resume auth-deep-dive`.

★

**EXAM TIP:** The exam may present a developer who worked on a specific investigation yesterday, has worked on other codebases since, and knows the session name. The answer is `--resume <name>`. Not `--continue` (picks up the most recent session, which might be from a different codebase). Not `--session-id` with a UUID (works but requires finding the transcript file). Not starting fresh (wastes all prior context).

### Forking Sessions for Parallel Exploration

The `fork_session` feature creates branches from an existing session, preserving all accumulated context. This is essential when you need to explore two or more approaches independently after an initial analysis phase.

For example, after spending an hour analyzing a legacy authentication module and identifying two refactoring approaches (extracting a microservice vs. refactoring in-place), you can fork the session to explore each approach in its own branch. Each fork starts with the full analysis context but evolves independently. Neither approach contaminates the other's context.

★

**EXAM TIP:** When a developer needs to "independently explore two approaches in depth" after building a significant analysis context, `fork_session` is the answer. Starting fresh sessions (loses context) and exploring sequentially in the same session (approaches contaminate each other's context) are common distractors.

### Resuming After Codebase Changes

When resuming a session after the underlying codebase changed (e.g., a teammate merged a PR overnight), the best approach is to do the following:

1. Resume the session to preserve accumulated context.
2. Inform Claude about which specific files changed.
3. Let Claude do targeted re-analysis of only the changed files.

This balances efficiency (don't re-read everything) with accuracy (don't work with a stale understanding of changed files).

★

**EXAM TIP:** Watch for the nuance in "3 of 12 files changed" scenarios. Don't start fresh (wastes context for the 9 unchanged files). Don't resume without mentioning changes (stale assumptions about the 3 changed files). Don't re-read all 12 files (wasteful). Resume and inform about the specific changes.

### Scratchpad Files for Long Sessions

During extended exploration sessions (30+ minutes), Claude may start losing track of earlier findings. The agent might reference "typical rendering patterns" instead of the specific `VulkanPipeline` and `FrameGraph` classes it discovered earlier. This happens because older conversations gradually fade from active attention as the context window fills with newer content.

The most effective solution is having Claude maintain a scratchpad file, a persistent file on disk where Claude records key findings, architectural decisions, and important discoveries as it works. Unlike conversation history, which fades, a file on disk persists and can be re-read at any time.

★

**EXAM TIP:** When a question describes inconsistent answers about earlier findings in long sessions, scratchpad files are the answer. Not switching to a larger model (doesn't address the fundamental attention dilution issue). Not clearing context periodically (destroys accumulated knowledge). Not pre-generating file summaries (doesn't capture discoveries made during exploration).

### Sub-Agent Spawning for Context Management

When an exploration session needs to pivot to a related but distinct area (e.g., from a rendering subsystem to physics integration), and you notice Claude losing specificity about earlier findings, you can:

1. Summarize key findings from the current exploration.
2. Spawn a sub-agent with that summary as initial context.

The sub-agent gets a fresh context window with the important findings preserved in compact form, plus full capacity to explore the new area. The main session retains its accumulated knowledge.

This pattern addresses context degradation without losing important findings. The summary acts as a compressed knowledge transfer between the parent session and the sub-agent.

### The /clear Command

The `/clear` command resets Claude's conversation context entirely, starting a fresh session. Use this when accumulated context is actively harmful for example, when Claude has built up incorrect assumptions that you can't correct through conversation.

★

**EXAM TIP:** `/clear` is a last resort, not a first step. The exam typically presents `/clear` as a distractor there's almost always a better option that preserves useful context.

| Session Situation | Right Approach | Wrong Approaches |
| --- | --- | --- |
| Continue yesterday's named session | --resume <name> | Start fresh, --continue (picks most recent, may be wrong project) |
| Explore two approaches independently | fork_session | Sequential in same session, start two fresh sessions |
| Long session losing specificity | Scratchpad file | Larger model, periodic /clear , pre-generate summaries |
| Pivoting to related area with degrading context | Sub-agent with summary | /clear and start over, ignore the degradation |
| Resume after 3 of 12 files changed | Resume + inform about changes | Start fresh, resume without mentioning changes |
| Accumulated incorrect assumptions | /clear | Continue with corrections (may not override assumptions) |

References

[Sessionshttps://docs.anthropic.com/en/docs/claude-code/sessions](https://docs.anthropic.com/en/docs/claude-code/sessions)[Sub Agentshttps://docs.anthropic.com/en/docs/claude-code/sub-agents](https://docs.anthropic.com/en/docs/claude-code/sub-agents)

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="j-running-claude-code-in-ci-cd-pipelines"></a>

## J. Running Claude Code in CI/CD Pipelines

Claude Code can be invoked non-interactively in CI/CD pipelines for automated tasks like code reviews, test generation, release notes, and documentation updates. The `claude -p` flag (also `--print`) puts Claude in piped/programmatic mode, where it reads input from stdin or a prompt string and produces output without interactive prompts.

Understanding the flags that control behavior in CI environments is critical. Two flags in particular, `--system-prompt` vs. `--append-system-prompt`, are frequently tested because misusing them produces a specific, diagnosable failure pattern: Claude only comments on the piped diff and never reads surrounding files.

### Non-Interactive Mode with claude -p

The `claude -p` flag puts Claude Code in piped/programmatic mode, it reads input from stdin or a prompt string and produces output without interactive prompts. This is the standard invocation for CI/CD pipelines, GitHub Actions, and other automated workflows.

In a GitHub Actions workflow, a typical invocation might look like:

```
echo "$PR_DIFF" | claude -p \
  --append-system-prompt "Review for security issues and bugs. Report findings as JSON." \
  --max-turns 10 \
  --max-budget-usd 2.00 \
  --output-format json
```

### --max-turns and --max-budget-usd Flags

`--max-turns N` limits the number of agentic iterations Claude can perform in a single invocation. This prevents runaway loops where Claude keeps reading files, running tools, and iterating without converging.

`--max-budget-usd X` sets a hard dollar cap on how much a single invocation can spend on API tokens. This prevents expensive API calls from accumulating during large PR reviews.

Both flags are enforced by Claude Code itself (not the surrounding job runner), making them the correct mechanism when a question asks about enforcing per-invocation caps "within Claude Code" or "by Claude Code itself."

★

**EXAM TIP:** When a question describes expensive, long-running agentic loops on large PRs and asks how to enforce iteration and cost caps — the answer is `--max-turns N --max-budget-usd X` on the `claude -p` invocation. Distractors include `timeout-minutes` on the GitHub Actions step (job runner, not Claude Code), switching to a smaller model (doesn't cap totals), and `--permission-mode dontAsk` (controls permission prompts, not iterations or cost).

### --system-prompt vs. --append-system-prompt

This distinction is critical and frequently tested.

`--system-prompt` completely replaces Claude Code's built-in system prompt with your custom instructions. Claude loses its default guidance for using file-reading tools, code navigation, and other built-in capabilities. Result: Claude only operates on what's piped to it — it won't read surrounding files, search the codebase, or use any of its built-in exploration tools.

`--append-system-prompt` adds your custom instructions to Claude Code's existing default prompt. Claude retains its full set of built-in tools and capabilities, plus your custom instructions on top.

| Flag | Effect | Claude's Built-in Tools | Use When |
| --- | --- | --- | --- |
| --system-prompt | Replaces default prompt entirely | Lost: Claude won't use Read, Grep, Glob, etc. | You want full control and don't need built-in tools |
| --append-system-prompt | Adds to default prompt | Preserved: Claude retains all capabilities | You want Claude's built-in tools plus your custom instructions |

★

**EXAM TIP:** When a question says Claude "only comments on the piped diff" but "never reads surrounding files" and the invocation uses `--system-prompt` the fix is to switch to `--append-system-prompt`. This preserves Claude's built-in tool-use guidance while adding your review instructions.

### Permission Modes for CI

The `--permission-mode` flag controls how Claude handles permission prompts in non-interactive mode. The `dontAsk` mode auto-denies permission requests not explicitly allowed, which is appropriate for CI environments where there's no human to approve prompts.

Common Mistakes

- Using `--system-prompt` when you want Claude to read surrounding files this strips Claude's built-in tool guidance.
- Setting `timeout-minutes` on the GitHub Actions step instead of `--max-turns`/`--max-budget-usd` on the Claude invocation the job runner timeout kills the process without letting Claude finish cleanly.
- Confusing `--permission-mode dontAsk` (controls permissions) with `--max-turns` (controls iterations).

Reference

[Github Actionshttps://docs.anthropic.com/en/docs/claude-code/github-actions](https://docs.anthropic.com/en/docs/claude-code/github-actions)

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="k-automated-code-review-patterns"></a>

## K. Automated Code Review Patterns

The CCA-F exam contains questions about building and optimizing automated code review pipelines. These questions test prompt design, output structure, noise reduction, and coverage improvement. This is one of the most heavily tested areas within Domain 3, with questions appearing in every exam scenario set.

The core challenge of automated code review is balancing precision (avoiding false positives) with recall (catching real bugs). Every prompt design decision shifts this balance. The exam tests whether you can identify the correct intervention for each type of imbalance.

### Reducing False Positives with CLAUDE.md

When an automated review consistently flags patterns your team uses intentionally (force-unwrapping optionals in test files, large coordinator classes following your architecture, or importing internally-maintained modules marked deprecated in the public SDK), the solution is to document these accepted patterns in the project's CLAUDE.md.

This gives Claude persistent context about your project's conventions during every review, preventing it from generating findings on intentional patterns. The key insight is that these are not bugs, they are deliberate architectural decisions. Without project context, Claude reasonably flags them because they look like anti-patterns to a reviewer without domain knowledge.

### Improving Recall with Few-Shot Examples

Few-Shot Examples Improve Review Recall

Nguồn tham khảo: Claude-Certified-Architect-Foundations-CCAR-F.pdf

When reviews miss real bugs (low recall), adding few-shot examples that demonstrate the specific bug categories Claude should flag, race conditions, null dereferences, and error handling gaps, is the most effective approach. Few-shot examples teach Claude to recognize patterns by showing concrete instances of what to look for.

This is more effective than vague instructions to "be more thorough" (doesn't tell Claude what to look for), adding chain-of-thought prompts (helps reasoning but not pattern recognition), or expanding context with unrelated files (adds noise without signal).

★

**EXAM TIP:** When a question describes missed bugs and asks how to improve recall while maintaining precision, few-shot examples of the specific bug categories is the answer. Note the precision constraint: improving recall by making Claude flag everything would destroy precision. Few-shot examples improve recall on specific categories without the broad overcounting that general instructions produce.

### Explicit Reporting Criteria

When too many findings are technically accurate but "not worth addressing" (minor style preferences, patterns acceptable in your codebase), the most effective prompt change before adding infrastructure complexity is to add explicit criteria defining which issues to report (bugs, security vulnerabilities) versus skip (minor style, local patterns).

This is the prompt-level equivalent of a bug filter. Instead of filtering after the fact, you prevent unwanted findings from being generated in the first place by defining the boundary between reportable and not-reportable.

### Structured Output with Confidence and Severity Metadata

When a review prompt tells Claude to "only report high-confidence issues" and real bugs slip through undetected, the solution is to remove the suppressive filtering and instead instruct Claude to report all findings with a confidence level and severity tag, deferring filtering to a downstream processing step.

The problem with "only report high-confidence" is that Claude is often already confident in the very cases it gets wrong. Asking for more confidence does not filter out the wrong cases, it suppresses correct but uncertain findings while preserving confident but wrong ones.

### Output Structure Design — The detected_pattern Field

When developers dismiss 35% of findings and you want to analyze what the system is getting wrong, the most useful addition to the output structure is a `detected_pattern` field recording the specific code construct that triggered each finding (e.g., "single-letter loop variable," "unused import," "missing null check").

This lets you analyze dismiss rates per detected pattern, identify which patterns systematically produce unhelpful findings, and adjust your prompts accordingly. This is more actionable than category-level analysis (too broad), confidence scores (poorly calibrated), or expanded descriptions (doesn't surface patterns).

### Inline Reasoning with Findings

When the bottleneck is investigation time developers must click into each finding to read Claude's reasoning before deciding whether to address or dismiss. The solution is to require Claude to include its reasoning and confidence assessment inline with each finding.

This lets developers triage findings at a glance without clicking through to each one. It reduces investigation time without filtering findings before developer review.

### Prior Review Context to Avoid Duplicates

When a review runs again after a developer pushes new commits addressing earlier findings, it may duplicate comments on already-fixed code. The solution is to include the prior review findings in context and instruct Claude to only report new or still-unaddressed issues.

This is more accurate than: post-processing filters (which use crude path/description matching), restricting scope to only newly modified files (misses regressions), or running reviews only at PR creation and pre-merge (skips intermediate feedback).

### Severity Criteria with Concrete Examples

When severity ratings are inconsistent, the same pattern gets "critical" in one PR and "medium" in another. The solution is to include explicit severity criteria in your prompt with concrete code examples for each severity level.

Concrete examples calibrate Claude's judgment more effectively than: severity lookup tables in CLAUDE.md (advisory, still varies), relative severity within a PR (inconsistent across PRs), or asking Claude to include severity reasoning for manual calibration (doesn't solve the root inconsistency).

WORKED EXAMPLE:

Severity criteria with anchoring examples: Critical: SQL injection or unsanitized user input concatenated into a query string. Major: Logic bug that changes the output — e.g., off-by-one in loop boundary. Minor: Missing null check on optional data where the default behavior is safe. Skip: Naming style, import order, formatting, patterns documented as accepted in CLAUDE.md. Each tier has a concrete code example, not just a description. Claude can compare its findings against these examples to classify consistently.

### Splitting Reviews into Focused Prompts

When a single review prompt covers multiple concern types (security, API design, business logic) and adding examples for one category hurts recall in another, the solution is to split the review into separate focused prompts, each with dedicated examples, then consolidate findings before posting.

This also applies when evaluation shows a recall tradeoff: improving business logic detection from 34% to 41% drops API design detection from 82% to 68%. Splitting into focused prompts eliminates this tradeoff because each prompt has its own examples and criteria.

### Agentic Reviews for Cross-File Analysis

When reviews consistently miss bugs involving cross-file interactions (a PR renames function parameters but callers in unchanged files still use old argument names), the issue is that the review only sees the diff and changed files. The solution is to redesign the review as a turn-limited agentic task where Claude can read files and search the codebase via tools, following references to verify cross-file findings.

This is where `--append-system-prompt` becomes essential; you need Claude's built-in file-reading tools to be available, not just the piped diff.

### Handling Truncated JSON Output

When a review using `tool_use` with a `report_findings` tool hits the `max_tokens` limit on a large PR, the JSON output gets truncated mid-structure, breaking the parser. The solution is to split the review into multiple API calls that each analyze a subset of the changed files, then merge the resulting findings arrays.

This is more robust than: increasing `max_tokens` (still might not be enough for very large PRs), retrying with "only critical findings" (loses coverage), or switching to markdown output (loses structured parsing).

Common Mistakes

- Using "be conservative" as a precision fix, it doesn't define the boundary and doesn't improve precision.
- Expecting confidence-based filtering to remove false positives, Claude is often confident on wrong findings.
- Running a single all-in-one review on 14+ files attention spreads thin, findings become inconsistent.
- Ignoring the `--system-prompt` vs `--append-system-prompt` distinction in CI review configuration.

References

[Best Practiceshttps://docs.anthropic.com/en/docs/claude-code/best-practices](https://docs.anthropic.com/en/docs/claude-code/best-practices)[Increase Consistencyhttps://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/increase-consistency](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/increase-consistency)

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="l-cost-optimization-with-the-message-batches-api"></a>

## L. Cost Optimization with the Message Batches API

The Message Batches API offers a 50% cost reduction compared to real-time API calls. However, results may take up to 24 hours to process. The key decision factor is always latency tolerance, whether anything is blocked waiting on the result. This section is closely related to Domain 4's batch processing coverage but focuses on the Claude Code-specific applications and exam patterns.

### Batch vs. Real-Time Decision

The deciding question is always: does anything stop working while waiting for this result? If yes, use synchronous. If not, use a batch.

| Workload | Right Choice | Reason |
| --- | --- | --- |
| Overnight technical debt reports | Batch | Latency-tolerant, high volume, cost matters |
| End-of-week release notes (200 commits, ~12hr acceptable) | Batch | No urgency, significant cost saving |
| Pre-merge checks blocking developer workflow | Synchronous | Developer is waiting for the result |
| Real-time code review comments | Synchronous | Developer is waiting on screen |
| Monthly billing report consumed next morning | Batch | Overnight run, latency irrelevant |
| Pipeline step where next step is blocked | Synchronous | Downstream step cannot proceed |

Each batch request gets a unique `custom_id` for tracking. Results arrive in a results file where you match responses to requests by their `custom_id`. Results do not come back in the same order as the input requests. Matching is always by `custom_id`, never by position.

★

**EXAM TIP:** When a question describes non-blocking work with acceptable latency (12+ hours, "needed by tomorrow morning," "generated overnight") and asks how to reduce per-token cost while keeping the same model, the answer is the Message Batches API. Distractors include: parallel real-time requests (concurrency doesn't reduce per-token cost), switching to a smaller model (changes model tier), or combining requests (different cost model).

### The 50% Cost Savings Tradeoff

The Message Batches API charges 50% of standard synchronous API prices. The tradeoff is that there is no latency guarantee beyond the 24-hour processing window. Most batches complete in under an hour, but your system must be designed to handle the full window. Any SLA built on batch processing must absorb this uncertainty.

Batch processing does not support multi-turn tool loops within a single request. Agentic workflows that require Claude to call tools, receive results, and continue must use the synchronous API.

### Prompt Caching with Pre-Warming

When running batch reviews with a shared system prompt (e.g., 8,000-token migration review guidelines), prompt caching can reduce costs further. However, batch requests may not execute in temporal proximity, causing cache entries to expire before later requests execute.

The solution is to add cache pre-warming requests with `max_tokens: 0` at the beginning of each batch. These requests cost nearly nothing but seed the cache, ensuring it's populated when the actual review requests start processing.

★

**EXAM TIP:** If a question describes low cache hit rates in batch processing concentrated on requests "processed later in the batch window", the answer is cache pre-warming. Not extending the cache TTL (different mechanism). Not splitting into sequential batches (adds latency). Not moving cache breakpoints to different content (wrong target).

References

[Batch Processinghttps://docs.anthropic.com/en/docs/build-with-claude/batch-processing](https://docs.anthropic.com/en/docs/build-with-claude/batch-processing)[Prompt Cachinghttps://docs.anthropic.com/en/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="m-claude-code-s-built-in-tools"></a>

## M. Claude Code's Built-in Tools

Claude Code provides several built-in tools for interacting with the codebase. Understanding when to use each tool is important for both efficient exploration and correct exam answers. These tools are part of Claude Code's default system prompt which is why `--append-system-prompt` preserves them and `--system-prompt` strips them.

Anthropic's documentation categorizes the built-in tools as follows:

| Category | Tools | What They Do |
| --- | --- | --- |
| File operations | Read, Write, Edit | Read, modify, and create files |
| Search | Grep, Glob | Find content within files, find files by name pattern |
| Execution | Bash | Run shell commands, scripts, git operations |

### Read Tool

Loads file contents into Claude's context. Use when you need to understand what a file contains — its structure, logic, dependencies, and patterns. Read is non-destructive — it only adds information to context, never modifies files.

### Write Tool

Creates a new file or overwrites an existing file entirely with new content. Use when creating new files or when the Edit tool can't find a unique match point. Write replaces the entire file content, so it should be used carefully on existing files.

### Edit Tool

Modifies part of an existing file using an `old_string` → `new_string` replacement. The `old_string` must be unique in the file. Edit fails if the string appears multiple times or not at all. This is Claude's primary tool for making targeted changes to existing files.

### Read → Write Fallback When Edit Fails

When a file has highly repetitive content (duplicate docstrings, repeated variable names, identical structural patterns), the Edit tool's `old_string` parameter may fail to find a unique match. The reliable fallback is to:

1. Read the file to load its contents.
2. Modify the content (add the new function, change the target section).
3. Write the updated file.

This fallback pattern is frequently tested because it represents a real limitation of the Edit tool's unique-string-matching approach. The Read → modify → Write pattern is less elegant than Edit but always works, regardless of content repetition.

★

**EXAM TIP:** When a question describes the Edit tool failing due to repetitive content in a 150-line file, and the developer needs to insert a function between two existing functions — the answer is Read → modify → Write. Not using an extremely long `old_string` (fragile). Not appending to the end with Bash heredoc (wrong placement). Not using `replace_all` (changes all instances, not targeted).

### Grep Tool

Searches file contents for text patterns across the codebase. Use when you know what text to look for, an error message string, an import statement, a function name, or a variable reference.

Examples: finding all files that import `@company/auth`, locating where an error message "SYNC_CONFLICT: entity version mismatch" is defined, finding all callers of a specific function.

### Glob Tool

Searches for files by name or path pattern. Use when you know the file naming convention but not the location finding all `cache*.py` files, locating `errors/` directories, or listing files matching `*.test.ts`.

★

**EXAM TIP:** Grep searches file contents; Glob searches file names. When a question asks to "find all files that import a specific package" use Grep (content search). When a question asks to "find files named cache something", use Glob (name search). This is a simple but frequently tested distinction.

### Bash Tool

Executes arbitrary shell commands. Use for running tests, installing dependencies, checking git history, viewing file system information, or any operation available in the terminal.

Reference

[Claude Codehttps://docs.anthropic.com/en/docs/claude-code](https://docs.anthropic.com/en/docs/claude-code)

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="n-codebase-exploration-strategies"></a>

## N. Codebase Exploration Strategies

The exam tests your ability to choose efficient exploration strategies when Claude needs to understand unfamiliar code. The right strategy depends on what you're trying to learn: system architecture, specific function usage, error origins, or test coverage priorities.

Each strategy pairs specific tools with a specific exploration goal. Top-down exploration uses Read to understand architecture. Finding callers uses Grep after mapping all names. Error message tracing uses Grep for distinctive text. Task decomposition uses Glob and Grep to map structure before planning.

### Top-Down Exploration

When investigating a large subsystem (like a caching layer spanning 15 files and ~8,000 lines), the most efficient approach is:

1. Analyze imports and class hierarchies to identify the base cache class.
2. Read that file to understand the interface and core abstractions.
3. Trace specific implementations (like invalidation) from the base class outward.

This builds understanding from architecture down to details, managing context constraints by not loading all 15 files simultaneously. Loading all files would consume most of the context window, leaving little room for Claude to reason about the code.

★

**EXAM TIP:** When a question describes a large subsystem and asks for the "most effective next step for building understanding while managing context constraints" the answer is analyzing the architectural entry point first (base class, interface, or main module), not reading all files sequentially or grepping for keywords without structural context.

### Finding All Callers Including Renamed Wrappers

When removing or renaming a function that's exposed through wrapper modules under different names (e.g., `calculateTax` in the library becomes `computeOrderTax` in the orders module), simply grepping for the original function name misses renamed exports.

The reliable strategy is:

1. Read the library and wrapper modules to identify all exposed names for the function.
2. Grep for each name across the codebase.

This two-step approach ensures no callers are missed, even when the function is re-exported under a different name.

### Searching for Error Messages Across Services

When an unfamiliar error message appears in production logs and you don't know which of 12 services generates it, the most efficient approach is to Grep for the distinctive text from the error message (like "SYNC_CONFLICT" or "entity version mismatch"), then Read the matching files to understand context.

This is faster than: reading README files and exploring directories systematically (too slow), grepping for error handling imports (too broad), or searching for files in `errors/` directories (relies on naming conventions that may not exist).

### Decomposing Open-Ended Tasks

When Claude receives an open-ended task like "add comprehensive tests to a legacy codebase with 200 files," the effective decomposition is:

1. Use Glob and Grep to map codebase structure.
2. Identify heavily-coupled modules and high-impact areas.
3. Create a prioritized plan for high-impact areas first.
4. Revise the plan as dependencies are discovered during implementation.

This is more effective than: starting alphabetically (no prioritization), reading all 200 files before writing any tests (wastes context), or creating a fixed schedule based on directory structure (ignores code complexity and business importance).

| Exploration Goal | Primary Tool | Strategy |
| --- | --- | --- |
| Understand a large subsystem's architecture | Read | Start from base class/interface, trace outward |
| Find all callers of a renamed function | Read + Grep | Read wrappers to get all names, Grep each name |
| Trace an error message to its source | Grep | Search for distinctive text across the codebase |
| Decompose a large open-ended task | Glob + Grep | Map structure, prioritize high-impact areas |
| Find files matching a naming pattern | Glob | Search by file name/path pattern |
| Find files importing a specific package | Grep | Search file contents for the import statement |

Reference

[Best Practiceshttps://docs.anthropic.com/en/docs/claude-code/best-practices](https://docs.anthropic.com/en/docs/claude-code/best-practices)

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="o-the-self-review-limitation"></a>

## O. The Self-Review Limitation

When Claude Code generates code during a development session and then reviews its own code in the same session, it retains context about its prior reasoning. This makes it less likely to question its own decisions — even when those decisions contain subtle issues. Understanding this limitation and knowing the correct architectural solution is a core Domain 3 exam topic.

This is not a prompt engineering problem that can be solved with better instructions. It is an architectural limitation rooted in how conversation context works. The same reasoning that produced the code is still present in the context when the review happens, creating a systematic bias toward confirming earlier decisions.

### Context Retention Bias

Claude has already "convinced itself" that its approach is correct during generation. When asked to self-review, it re-evaluates through the same lens, confirming its earlier conclusions rather than questioning them. This is analogous to why human developers benefit from external code review. A fresh perspective catches things the original author's mental model filters out.

The exam tests this with scenarios where Claude's reasoning during generation shows it "considered these cases but concluded its approach was correct," yet a different team member or a separate CI review catches the issues. The fact that Claude considered and dismissed the issues during generation is what makes the self-review limitation severe; it's not that Claude didn't think about the edge cases, it's that it already decided they weren't problems.

### Independent Claude Instance for Review

The solution is to have a second, independent Claude Code instance review the changes without seeing the generator's reasoning. This independent review has no prior context about why the code was written the way it was, so it evaluates the code purely on its merits.

The independent instance brings fresh attention to every line, every assumption, and every edge case. It has no prior conviction that the approach is correct, so it is equally likely to question each decision.

| Concept | Best Used For | Key Benefit | Common Exam Trap |
| --- | --- | --- | --- |
| Self-review (same session) | Quick sanity checks | Low overhead | Trusted to catch subtle defects it generated |
| Independent review (separate instance) | Catching subtle defects in generated output | Fresh context, no generation bias | Overlooked in favor of "review your own work" |

★

**EXAM TIP:** When a question describes subtle bugs that Claude considered but dismissed during generation, and the question asks which approach "directly addresses the root cause of this self-review limitation," the answer is an independent Claude instance. Distractors include extended thinking (same context, same biases), comprehensive test files (doesn't address the reasoning retention issue), and explicit self-review instructions (Claude already evaluated and concluded its approach was correct, asking it to self-review again doesn't add a fresh perspective).

Common Mistakes

- Asking Claude to "review more carefully" in the same session, the reasoning bias remains.
- Using extended thinking as a substitute for independent review, it operates in the same context with the same biases.
- Treating self-review as equivalent to external review, they are fundamentally different in what they can catch.

Reference

[Best Practiceshttps://docs.anthropic.com/en/docs/claude-code/best-practices](https://docs.anthropic.com/en/docs/claude-code/best-practices)

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="domain-3-services-appendix"></a>

## Domain 3 Services Appendix

### Claude Code Configuration Reference

| Mechanism | Location | Scope | Loads When | Enforcement |
| --- | --- | --- | --- | --- |
| Root CLAUDE.md | Project root | All team members | Every session | Advisory |
| Subdirectory CLAUDE.md | Any project folder | All team members | When working in that directory | Advisory |
| User CLAUDE.md | ~/.claude/CLAUDE.md | One developer | Every session across all projects | Advisory |
| @imports | Inside CLAUDE.md | Depends on containing file | When containing file loads | Advisory |
| .claude/rules/ | .claude/rules/*.md | All team members | When working on matching file paths | Advisory |
| .claude/skills/ | .claude/skills/<name>/SKILL.md | All team members | On demand via slash command | Advisory |
| ~/.claude/skills/ | User home directory | One developer | On demand via slash command | Advisory |
| Hooks (settings.json) | .claude/settings.json | All team members | Automatically at lifecycle events | Deterministic |
| Hooks (local) | .claude/settings.local.json | One developer | Automatically at lifecycle events | Deterministic |
| permissions.deny | Settings | Configurable | Always enforced | Hard block |
| .mcp.json | Project root | All team members | Every session | N/A (server config) |
| ~/.claude.json | User home directory | One developer | Every session | N/A (server config) |

### CI/CD Flags Reference

| Flag | Purpose | Enforced By |
| --- | --- | --- |
| claude -p | Non-interactive piped/programmatic mode | Claude Code CLI |
| --max-turns N | Limit agentic iterations per invocation | Claude Code itself |
| --max-budget-usd X | Hard dollar cap per invocation | Claude Code itself |
| --system-prompt | Replace default system prompt entirely | Claude Code CLI |
| --append-system-prompt | Add to default system prompt | Claude Code CLI |
| --permission-mode dontAsk | Auto-deny unallowed permission requests | Claude Code CLI |
| --output-format json | Enforce JSON output | Claude Code CLI |

### Hook Events Reference

| Event | Fires When | Common Use |
| --- | --- | --- |
| SessionStart | Session begins or is restored | Inject context, check environment |
| PreToolUse | Before any tool executes | Block dangerous actions, validate inputs |
| PostToolUse | After a tool completes successfully | Auto-format, lint, log |
| Stop | Claude finishes responding | Cleanup, telemetry |
| Notification | Claude sends a notification | Alert routing |
| SubagentStop | A subagent completes its task | Cleanup, validation |

### Built-in Tools Reference

| Tool | Searches | Use For |
| --- | --- | --- |
| Read | N/A (loads file) | Understanding file contents |
| Write | N/A (creates/overwrites file) | Creating new files, fallback when Edit fails |
| Edit | N/A (modifies file) | Targeted changes using unique string match |
| Grep | File contents | Finding text patterns, import statements, error messages |
| Glob | File names/paths | Finding files by naming pattern |
| Bash | N/A (executes commands) | Running tests, git operations, system commands |

### Message Batches API Reference

| Property | Value |
| --- | --- |
| Cost savings | 50% of standard synchronous API prices |
| Processing window | Up to 24 hours (most complete in under 1 hour) |
| Result matching | By custom_id, not by position (order is not preserved) |
| Multi-turn support | Not supported — single request/response only |
| Result availability | 29 days after batch creation |
| Batch size limits | 100,000 requests or 256 MB per batch |
| Use for | Latency-tolerant work: overnight reports, bulk analysis, audits |
| Not for | Blocking workflows, multi-turn tool loops, latency-sensitive work |

### MCP Configuration Reference

| Element | Description |
| --- | --- |
| MCP tools | Callable functions exposed by MCP servers |
| MCP resources | Read-only content catalogs describing server data |
| MCP prompts | Server-defined prompts surfaced as /mcp_<server>_<prompt> slash commands |
| .mcp.json | Project-level configuration (shared, version-controlled) |
| ~/.claude.json | User-level configuration (personal, not shared) |

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="domain-3-claude-code-configuration-workflows-output-sample-questions"></a>

## Domain 3: Claude Code Configuration & Workflows Output Sample Questions

Question 1

You are using Claude Code to refactor a legacy application with interconnected modules. The workflow must ensure that updates do not break dependent components. For refactoring tasks, Claude Code workflows should follow which practice?

1. Rely on no context
2. Process files simultaneously in parallel
3. Refactor files with manual verification
4. Process files in sequence with tests

**Correct Answer:** 4

Explanation:

Claude Code workflows support sequential task execution, iterative file updates, and integrated testing practices that help maintain consistency during refactoring operations. Anthropic documentation explains that Claude performs more effectively when tasks are broken into structured and manageable steps, allowing the model to reason through dependencies and apply changes in a controlled manner. Running tests after modifications also helps validate whether updates preserve the expected behavior of the application and its related components.

Claude Refactoring Workflow

Nguồn tham khảo: Claude-Certified-Architect-Foundations-CCAR-F.pdf

Processing files in sequence is an important practice when working with interconnected codebases because changes in one module can affect the behavior of another. By handling updates incrementally and validating results through testing, engineering teams can identify compatibility issues earlier in the workflow and reduce the likelihood of introducing regressions. This structured approach improves reliability by ensuring that dependencies, configurations, and shared logic remain functional throughout the refactoring process.

Sequential workflows combined with testing also create a more maintainable AI-assisted development pipeline. Instead of applying broad modifications across multiple files simultaneously, teams can isolate changes, verify outcomes, and refine updates before proceeding to the next stage. This improves traceability, strengthens quality assurance practices, and supports more dependable automation for large-scale software maintenance and modernization efforts.

Hence, the correct answer is: **Process files in sequence with tests.**

The option that says: *Rely on no context* is incorrect because Claude Code workflows typically perform better when sufficient project context, file relationships, and task instructions are provided. Anthropic documentation explains that structured context improves reasoning quality, consistency, and the model's ability to generate reliable outputs across connected tasks and dependent code components.

The option that says: *Refactor files with manual verification* is incorrect because Claude Code workflows are primarily designed to support automated and repeatable development processes that integrate validation steps, such as testing and iterative checks. Manual verification alone may not consistently detect dependency issues, regressions, or integration problems across interconnected modules in larger codebases.

The option that says: *Process files simultaneously in parallel* is incorrect because sequential task execution helps Claude maintain clearer reasoning across dependent updates and simply reduces the risk of conflicting modifications between interconnected files. Anthropic guidance emphasizes breaking complex tasks into manageable steps to improve reliability, traceability, and output quality during multi-stage workflows.

References:

[Best Practiceshttps://code.claude.com/docs/en/best-practices](https://code.claude.com/docs/en/best-practices)[Common Workflowshttps://code.claude.com/docs/en/common-workflows](https://code.claude.com/docs/en/common-workflows)

Question 2

Your CI pipeline needs Claude Code to produce structured JSON output that can be parsed and posted as inline PR comments. Which CLI flags should you use?

1. `--output-format json` and `--json-schema` to enforce a specific output structure.
2. `--format json` and `--strict` to enforce JSON compliance.
3. `-p --json` to enable JSON mode alongside non-interactive mode.
4. `--structured-output` with a Pydantic schema file passed as an argument.

**Correct Answer:** 1

Explanation:

Claude Code offers several features that help automate workflows, especially in CI/CD pipelines. Among these features, the `--output-format json` and `--json-schema` flags are critical for ensuring that output is structured and adheres to a specific format. The `--output-format json` flag ensures that the output is in JSON, a widely used and machine-readable format. This makes it easy for automated systems to parse and process the data further, such as posting inline PR comments or updating issue trackers.

Claude CLI Flags for Structured JSON

Nguồn tham khảo: Claude-Certified-Architect-Foundations-CCAR-F.pdf

The `--json-schema` flag complements this by enforcing a specific structure for the output. This guarantees that the JSON data is not only in the correct format but also follows a predefined schema, ensuring consistency and avoiding errors in downstream processes. Using this flag is particularly useful in automated environments where data needs to meet exact specifications to work properly with other tools or systems.

In the context of a CI/CD pipeline, using both `--output-format json` and `--json-schema` ensures that Claude Code generates reliable, structured, and predictable output. This is vital for tasks like automated code reviews, where the output must be consistent to be parsed correctly and integrated into the pipeline. These flags make the process smoother by eliminating the need for manual intervention and ensuring that the output meets the necessary requirements for automated systems to handle seamlessly.

Hence, the correct answer is: **--output-format json and --json-schema to enforce a specific output structure.**

The option that says: *--format json and --strict to enforce JSON compliance* is incorrect because it simply enforces JSON formatting but does not guarantee the output structure. While it ensures that the output is in JSON format, it does not define or enforce any specific structure, which is critical when parsing and posting inline PR comments in a predictable way.

The option that says: *-p --json to enable JSON mode alongside non-interactive mode* is incorrect because it primarily enables non-interactive mode and JSON output but does not provide any enforcement of a specific output structure. This flag is useful for non-interactive scenarios, but does not address the need for structured and schema-compliant JSON output, which is necessary for the scenario.

The option that says: *--structured-output with a Pydantic schema file passed as an argument* is incorrect because it refers to a non-existent flag in the Claude Code CLI. The correct flag for structuring output using a schema is `--json-schema`, not `--structured-output`. This means the suggested option is just not valid based on the official documentation.

References:

[Cli Referencehttps://code.claude.com/docs/en/cli-reference](https://code.claude.com/docs/en/cli-reference)[Headlesshttps://code.claude.com/docs/en/headless](https://code.claude.com/docs/en/headless)

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="ngu-n-tham-kh-o"></a>

## Nguồn tham khảo

*All links reference official Anthropic documentation.*

Claude Code Overview

[Claude Codehttps://docs.anthropic.com/en/docs/claude-code](https://docs.anthropic.com/en/docs/claude-code)

Claude Code Best Practices

[Best Practiceshttps://docs.anthropic.com/en/docs/claude-code/best-practices](https://docs.anthropic.com/en/docs/claude-code/best-practices)

Claude Code Settings and Configuration

[Settingshttps://docs.anthropic.com/en/docs/claude-code/settings](https://docs.anthropic.com/en/docs/claude-code/settings)

Claude Code Hooks

[Hookshttps://docs.anthropic.com/en/docs/claude-code/hooks](https://docs.anthropic.com/en/docs/claude-code/hooks)

Claude Code Memory and CLAUDE.md

[Memoryhttps://docs.anthropic.com/en/docs/claude-code/memory](https://docs.anthropic.com/en/docs/claude-code/memory)

Claude Code Skills

[Skillshttps://docs.anthropic.com/en/docs/claude-code/skills](https://docs.anthropic.com/en/docs/claude-code/skills)

Claude Code Sub-Agents

[Sub Agentshttps://docs.anthropic.com/en/docs/claude-code/sub-agents](https://docs.anthropic.com/en/docs/claude-code/sub-agents)

Claude Code Sessions

[Sessionshttps://docs.anthropic.com/en/docs/claude-code/sessions](https://docs.anthropic.com/en/docs/claude-code/sessions)

Claude Code CI/CD Integration

[Github Actionshttps://docs.anthropic.com/en/docs/claude-code/github-actions](https://docs.anthropic.com/en/docs/claude-code/github-actions)

Message Batches API

[Batch Processinghttps://docs.anthropic.com/en/docs/build-with-claude/batch-processing](https://docs.anthropic.com/en/docs/build-with-claude/batch-processing)

Model Context Protocol

[Mcphttps://docs.anthropic.com/en/docs/agents-and-tools/mcp](https://docs.anthropic.com/en/docs/agents-and-tools/mcp)

Prompt Caching

[Prompt Cachinghttps://docs.anthropic.com/en/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)

Prompt Engineering

[Overviewhttps://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)

CCA-F Official Exam Page

[CCAFhttps://clau.de/CCAF](https://clau.de/CCAF)

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="d4-prompt-engineering-structured-output"></a>

# D4 — Prompt Engineering & Structured Output

> Source: [https://www.nvnhan.wiki/#/ccarf/docs](https://www.nvnhan.wiki/#/ccarf/docs)
> Exported from the rendered documentation by `Tool2/scrape_docs.py`.

## Table of contents

1. [A. Foundations of Prompt Engineering for Production](#a-foundations-of-prompt-engineering-for-production)
2. [B. Designing Prompts with Explicit Criteria](#b-designing-prompts-with-explicit-criteria)
3. [C. Few-Shot Prompting](#c-few-shot-prompting)
4. [D. Structured Output with Tool Use and JSON Schemas](#d-structured-output-with-tool-use-and-json-schemas)
5. [E. Schema Design for Reliable Extraction](#e-schema-design-for-reliable-extraction)
6. [F. Validation, Retry, and Feedback Loops](#f-validation-retry-and-feedback-loops)
7. [G. Batch Processing Strategies](#g-batch-processing-strategies)
8. [H. Multi-Instance and Multi-Pass Review](#h-multi-instance-and-multi-pass-review)
9. [Domain 4 Services Appendix](#domain-4-services-appendix)
10. [Domain 4: Prompt Engineering & Structured Output Sample Questions](#domain-4-prompt-engineering-structured-output-sample-questions)
11. [Nguồn tham khảo](#ngu-n-tham-kh-o)

---

<a id="a-foundations-of-prompt-engineering-for-production"></a>

## A. Foundations of Prompt Engineering for Production

Prompt engineering is the work of writing the input to Claude so the output reliably does what you need. A casual user is satisfied with one good answer. A production system has a higher bar: the same prompt may run thousands of times against very different inputs, and it has to behave the same way each time.

Claude does excellent work when the instructions are clear, and it fills in gaps with its own assumptions when the instructions are vague. So the more precisely you say what you want, the less the model has to guess, and the more consistent the output becomes. Prompt engineering is also the fastest and cheapest lever available. It changes only the input you send, not the model itself. The instructions stay readable, and they keep working as the model improves. That is why it is usually the first tool to reach for, and why knowing its limits matters as much as knowing its techniques.

### Key Terms

- **Prompt engineering** is designing the input so the model reliably produces what you want.
- **System prompt** is the top-level instruction block that sets the model's role, rules, and output expectations.
- **Probabilistic** means the behavior is about likelihood. A good prompt makes the right answer far more likely, but never certain.
- **Deterministic mechanism** is a control that always holds, such as a code gate, a hook, or strict schema enforcement.

### What is Prompt Engineering?

It is writing instructions, context, and examples that point the model at the result you want. Unlike traditional software where you write code that executes exactly as written, prompt engineering works by shaping the model's understanding of what a good response looks like. The model brings its own reasoning to every request, so your job is to direct that reasoning, not replace it.

### How It Works

How Prompt Engineering Works

Nguồn tham khảo: Claude-Certified-Architect-Foundations-CCAR-F.pdf

Prompt engineering works on the input you send, not on the model's internal weights, so changes take effect immediately. There is no retraining, no deployment pipeline, and no waiting. You write a new prompt, test it, and adjust. This makes it the fastest and cheapest intervention available. Before reaching for fine-tuning, retrieval, or additional tooling, a better prompt often solves the problem at a fraction of the cost and effort.

It is also iterative by nature. A prompt that works on one input may fail on another, so testing across varied examples is part of the process, not an afterthought. The goal is not a prompt that works once but one that holds across the range of inputs the system will actually see.

- Write the prompt with a clear goal in mind.
- Test it against real or representative inputs, not just the easy cases.
- Identify where it fails and why.
- Refine the instruction, example, or constraint that caused the failure.
- Repeat until the output is consistent across the full range of expected inputs.

### Zero-Shot and Few-Shot Prompting

| Type | Instruction | Example Provided |
| --- | --- | --- |
| Zero-shot | "Flag the important issues" | The model decides what important means. That decision changes from run to run. |
| Few-shot | "Review this code" | The model picks a scope. A re-run picks a different one. |

- **Zero-shot** works well for simple, well-defined tasks where the expected output is obvious.
- **Few-shot** works better for complex formats, judgment calls, or cases where the correct output is hard to describe in words.

The key difference is not the answer but the reliability. Both return the correct label in this case. The advantage of few-shot learning shows when the task is more ambiguous or the output format is more specific. Without examples, the model decides what "positive" and "negative" look like on its own. With examples, you have already shown it.

### How Claude Interprets Instructions

Claude does not read only the sentence you care about. It reads the whole prompt at once, including the system prompt, the descriptions of any tools, and any examples, and it forms a single overall sense of what you want from all of it together.

- It responds to what the prompt actually says, not to the intention in your head.
- Because every part counts, a stray phrase can push behavior in a direction you did not plan.
- Contradictory instructions pull the model two ways and lower reliability.
- A single keyword in a system prompt can even bias which tool the model chooses, so word system prompts carefully.

### The Context Window

The context window is the boundary of what Claude can see at one time. Everything outside it does not exist for that request. For long documents, long conversation histories, or large tool definitions, relevant instructions can get crowded out by other content.

- In very long prompts, attention can spread thin. Key instructions that would be obvious in a short prompt can lose influence when surrounded by many other tokens.
- What fits in the window and where it sits both affect how reliably instructions are followed.
- For critical instructions in long prompts, repetition is a valid strategy. Stating the same rule at the start and again near the end costs tokens but improves reliability.

References

[Overviewhttps://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview)[Be Clear And Directhttps://docs.claude.com/en/docs/build-with-claude/prompt-engineering/be-clear-and-direct](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/be-clear-and-direct)[Use Xml Tagshttps://docs.claude.com/en/docs/build-with-claude/prompt-engineering/use-xml-tags](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/use-xml-tags)

### Intent versus Interpretation

Whenever your prompt leaves something unsaid, the model makes a reasonable guess to fill the gap. Its guess may not match yours. That space between what you meant and how the model read it is where most inconsistency comes from.

Why the Gap Exists

You have full context for your request: the audience, the constraints, the definition of success. The model has none of that unless you provide it. When details are missing, the model constructs a plausible version of your situation and responds to that version. Nothing in the response signals that any assumption was made.

Common Forms of Mismatch

| Type | Example | What Goes Wrong |
| --- | --- | --- |
| Undefined criteria | "Flag the important issues" | The model decides what important means. That decision changes from run to run. |
| Ambiguous scope | "Review this code" | The model picks a scope. A re-run picks a different one. |
| Unstated audience | "Write an explanation" | Model defaults to a general audience that may not fit your actual reader. |
| Vague length | "Keep it concise" | The model chooses a length. Concise means different things to different people. |

Each of these mismatches shares the same root cause: the prompt used a word that felt precise to the writer but left the model room to decide. "Important," "review," "explanation," and "concise" are all judgment calls, not instructions. The model fills that judgment with a reasonable default, and that default is not stable across runs.

The fix is the same in every case: replace the evaluative word with a concrete rule. Define what counts as important. Specify which kind of review you want. Name the audience. Give a word or sentence count. Once the judgment call is removed from the model's side and placed in the prompt, the output stops varying.

Closing the Gap

Read your own prompt and ask: if someone read only these words with no access to my context, what assumptions would they have to make? Each assumption is a gap worth closing.

| Vague | Precise |
| --- | --- |
| "Flag the important issues" | "Flag issues that would cause data loss or service unavailability" |
| "Review this code" | "Review for SQL injection and input validation only" |
| "Write an explanation" | "Write two paragraphs for a non-technical project manager" |
| "Keep it brief" | "Respond in no more than three sentences" |

The Role of Specificity

- Specific: Flag a code comment only when the behavior it claims contradicts what the code actually does.
- Vague: Check that comments are accurate.

The specific version gives the model a clear test it can apply the same way every time. Words like "carefully" or "thoroughly" sound reassuring but change nothing, because they do not change the test the model is applying.

References

[Be Clear And Directhttps://docs.claude.com/en/docs/build-with-claude/prompt-engineering/be-clear-and-direct](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/be-clear-and-direct)[Overviewhttps://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview)[Increase Consistencyhttps://docs.claude.com/en/docs/build-with-claude/prompt-engineering/increase-consistency](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/increase-consistency)

### Prompt-Level Problems vs. Architectural Problems

| Concept | Best Used For | Key Benefit | Common Exam Trap |
| --- | --- | --- | --- |
| Prompt-level fix | Clarity, consistency, formatting, ambiguous cases | Fast, cheap, no new infrastructure | Used where a hard guarantee is actually required |
| Architectural fix | Guaranteed ordering, required compliance, schema enforcement | Always holds, and you can verify it | Reached for when a clearer prompt would have done |

A prompt-level fix works by reducing ambiguity. When output is inconsistent because the model is guessing at scope, format, or criteria, a clearer prompt removes that guesswork. This is the right tool for most problems and should always be the first thing you try.

An architectural fix works by removing the model's discretion entirely. A code gate, a schema validator, or a required pipeline step does not ask the model to comply. It enforces the rule regardless of what the model produces. This is the right tool when a rule must hold every single time without exception.

The exam trap in both cases is reaching for the wrong one. Using a prompt where a guarantee is required leaves a gap that will eventually fail. Adding infrastructure where a clearer instruction would have worked adds cost and complexity for no gain. The deciding question is simple: can this ever be allowed to fail? If yes, fix the prompt. If not, enforce it structurally.

### The Limits of Prompting

A prompt instruction changes the odds, but it never reaches certainty. It can make a mistake rare, but not impossible.

- When a rule must always hold (for example: verify identity before issuing a refund), you need a deterministic mechanism, not a firmer instruction.
- Saying "always do this" more forcefully does not turn a probability into a guarantee.

WORKED EXAMPLE:

Vague: `Review this code and flag anything important.`

Explicit: `Flag only (1) bugs that change behavior and (2) security issues. Do not flag style or formatting. For each finding, give: location, issue, severity (critical / major / minor), and a suggested fix.`

What this shows: the explicit version names what to report, what to skip, and the exact shape of each finding. That removes the guesswork that makes the vague version inconsistent.

Common Mistakes

- Treating a prompt as a guarantee for a rule that must always hold.
- Adding infrastructure when the real problem was just an unclear instruction.
- Piling on vague qualifiers like "be careful" and expecting precision to improve.
- Writing system prompt instructions that quietly contradict the tool descriptions.

References

[Overviewhttps://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview)[Be Clear And Directhttps://docs.claude.com/en/docs/build-with-claude/prompt-engineering/be-clear-and-direct](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/be-clear-and-direct)[Reduce Hallucinationshttps://docs.claude.com/en/docs/build-with-claude/prompt-engineering/reduce-hallucinations](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/reduce-hallucinations)

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="b-designing-prompts-with-explicit-criteria"></a>

## B. Designing Prompts with Explicit Criteria

Explicit criteria are concrete rules that state exactly what counts as a result worth reporting and what does not. Instead of leaving the model to decide what matters, you decide and write it down. This turns a fuzzy instruction into a clear, testable boundary.

### Explicit Criteria vs. General Guidance

The core problem with vague instructions is not that the model ignores them. It is that the model follows them using its own judgment, and that judgment is not stable. Explicit criteria replace judgment with rules. General guidance leaves the judgment in place and just adds a modifier to it.

| Concept | Best Used For | Key Benefit | Common Exam Trap |
| --- | --- | --- | --- |
| Explicit categorical criteria | Deciding what is and is not reportable | Consistent, predictable output | Mistaken for needing extra infrastructure |
| General guidance (be conservative) | A quick, low-effort instruction | Easy to write | Believed to improve precision when it does not |

### Why "Be Conservative" Does Not Work

Telling the model to be conservative or to only report high-confidence findings sounds like it should reduce noise, but it usually does not.

- The model is often already confident in the very cases it gets wrong, so asking for more confidence does not filter those out.
- The instruction never says where the line actually is, so the model still has to guess.
- Filtering by a confidence score is unreliable because the model's confidence is poorly calibrated on hard cases.
- Naming categories of what to report and what to ignore gives a concrete line the model can apply the same way every time.

### Severity Classification

What is a severity level? It is a named tier, such as critical, major, or minor, with a stated condition for each. It replaces a vague label with a rule.

Anchoring severity with concrete examples: Attach a short example to each tier. Without examples, the same issue can land in major on one run and minor on the next.

### False Positives and User Trust

- **The cost of false positives:** A category that often fires on non-issues poisons trust in the whole tool. Once people learn to ignore the noisy category, they start ignoring the accurate ones too.
- **Category suppression:** The practical recovery is to temporarily switch off the noisy category to restore trust, improve its criteria, and only then turn it back on.

WORKED EXAMPLE

```
Report:
- SQL injection or unsanitized input -> severity: critical
- A logic bug that changes the output -> severity: major
- A missing null check on optional data -> severity: minor

Skip:
- Naming style, import order, formatting

Example (critical): user input concatenated directly into a query string.
Example (minor): optional field read without a guard where default is safe.
```

What this shows: the report list, the skip list, and one example per severity together leave almost nothing for the model to guess, so classification stays consistent.

Common Mistakes

- Relying on being conservative instead of defining the actual boundary.
- Filtering by a confidence score the model is not calibrated to give.
- Defining severity tiers but giving no examples, so the line stays subjective.
- Leaving a noisy category running, which erodes trust in the accurate findings too.

References

[Increase Consistencyhttps://docs.claude.com/en/docs/build-with-claude/prompt-engineering/increase-consistency](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/increase-consistency)[Overviewhttps://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview)

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="c-few-shot-prompting"></a>

## C. Few-Shot Prompting

Few-shot prompting means including a few completed examples of the task in your prompt before asking the model to handle a new case. A written rule describes what you want, but an example shows it. When the model can see two or three finished cases, it picks up the format, the level of detail, and the judgment calls all at once.

### Few-Shot vs. Instruction-Only Prompting

| Concept | Best Used For | Key Benefit | Common Exam Trap |
| --- | --- | --- | --- |
| Few-shot prompting | Consistent format, ambiguous cases, structured output | Strong consistency from concrete demonstration | Used to fix tool misrouting from weak tool descriptions |
| Zero-shot prompting | Simple, well-defined tasks | Low token cost | Expected to give consistent format on complex tasks |

The deciding question is whether the correct output is easy to describe in words. If it is, zero-shot may be sufficient. If the correct output involves a specific format, a judgment call, or a distinction that is hard to articulate, few-shot will outperform any amount of additional instruction.

### Why Examples Outperform Longer Instructions

Zero-shot prompting tells the model what to do. Few-shot prompting shows the model what "done" looks like. That difference matters more than it seems.

- Examples make the exact format concrete, so the model copies the structure instead of inventing one.
- Examples demonstrate judgment on borderline cases, which is hard to describe in rules but easy to show.
- Examples reduce made-up or empty fields in extraction because the model sees how a real, complete answer is built.
- Examples carry implicit information that would take many words to describe explicitly, such as tone, level of detail, and how to handle missing data.

| Approach | What the Model Has to Do | Risk |
| --- | --- | --- |
| Zero-shot | Imagine what a correct answer looks like. | Format varies, judgment calls are inconsistent |
| Few-shot | Copy the demonstrated pattern | Low, as long as examples are diverse and representative |

### Anatomy of an Effective Example

Anthropic's guidance is that good examples are relevant, diverse, and clear.

| Quality | What It Means |
| --- | --- |
| Relevant | Each example looks like the real cases you will see, not a toy case. |
| Diverse | Examples cover different situations and edge cases, and differ enough that the model does not lock onto a pattern you did not intend. |
| Clear | Each example sits inside <example> tags; several examples grouped inside <examples> tags. |

### Key Principles for Example Design

- **Include reasoning:** Show the reason a choice was made, not just the final answer.
- **Demonstrate format:** Show the exact output shape you expect. The model will reproduce that shape.
- **Cover ambiguous cases:** Two to four examples that resolve genuinely tricky cases are worth more than many examples of the obvious case.
- **Show varied input formats:** In extraction work, show the same fact appearing in different document layouts.

### How Many Examples Is Enough

- **0 (zero-shot):** the model invents the format and judgment from instructions alone with no reference point.
- **1 example:** better than zero but a single example risks creating an unintended pattern since there is only one case to generalize from.
- **3 to 5 examples:** Anthropic's documented sweet spot. Enough diversity to generalize correctly without adding excessive token cost.
- **More than 5:** diminishing returns on most tasks. Only worth the added cost when the goal is specifically to cover a wide range of edge cases.

Common Mistakes

- Using few-shot examples to fix tool misrouting when the real cause is a weak tool description.
- Making the examples too similar, so the model latches onto a pattern you did not intend.
- Showing only easy examples, leaving the ambiguous cases unguided.
- Leaving examples unwrapped, which makes them harder for the model to separate from instructions.

References

[Multishot Promptinghttps://docs.claude.com/en/docs/build-with-claude/prompt-engineering/multishot-prompting](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/multishot-prompting)[Increase Consistencyhttps://docs.claude.com/en/docs/build-with-claude/prompt-engineering/increase-consistency](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/increase-consistency)[Overviewhttps://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview)

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="d-structured-output-with-tool-use-and-json-schemas"></a>

## D. Structured Output with Tool Use and JSON Schemas

Structured output means forcing the model's answer into a defined shape so the next system in line can read it without guessing. If a downstream service expects a field called `total_amount` holding a number, it needs that field, with that type, every single time. Free-form text cannot be relied on that way.

### Tool Use

Tool use is the primary mechanism for getting structured output from Claude. You define a tool with a name, a description, and an input schema. Claude decides when to call it based on the request and the tool's description, and your code runs it.

How the Tool Use Loop Works

How the Tool Use Loop Works

Nguồn tham khảo: Claude-Certified-Architect-Foundations-CCAR-F.pdf

When a tool is available, Claude does not respond with plain text. It responds with a structured block indicating which tool to call and what inputs to pass. Your code takes that, runs the actual operation, and sends the result back. The loop continues until Claude has everything it needs to finish.

- Claude responds with `stop_reason` `tool_use` and one or more `tool_use` blocks containing the tool name and input arguments.
- Your code executes the operation and returns a `tool_result` to Claude.
- Claude continues generating based on the result, or returns `stop_reason` `end_turn` when finished.
- For extraction tasks, the tool acts as the output contract: its input schema defines the exact shape of the data you want returned.

Why Tool Descriptions Matter

The model decides whether to call a tool based on how the tool is described, not just on the instruction in the message. A vague or poorly written tool description leads to missed calls or wrong tool selection. Write tool descriptions with the same care as prompt instructions.

References

[Overviewhttps://docs.claude.com/en/docs/agents-and-tools/tool-use/overview](https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview)[Implement Tool Usehttps://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use](https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use)

### JSON Schema

JSON Schema as an Output Contract

Nguồn tham khảo: Claude-Certified-Architect-Foundations-CCAR-F.pdf

A JSON schema is what turns a tool into an output contract. It declares exactly what fields the model must return, what type each field holds, and which fields are required. Without a schema, the model decides the shape of the output on its own. With a schema, the shape is fixed.

Key Terms

- **JSON schema** is a formal description of fields, their types, which are required, and what values are allowed.
- **Structured output** is output forced into a defined, parseable shape.
- **Strict tool use** is `strict: true`, which guarantees the tool name and inputs match your schema.
- **Structured Outputs** is the native feature with two modes: JSON outputs and strict tool use.

### JSON Schema Field Types

| Field Type | Behavior | Use When |
| --- | --- | --- |
| required | Must always be present; forces a value even if absent | Data the source always contains |
| optional | May be omitted when not in the source | Data that may be absent |
| nullable | May return null when value is absent | Data that may be absent but must appear in output |
| enum | Restricted to a fixed set of allowed values | Category fields with known values |

Choosing the right field type is one of the most important decisions in schema design. The wrong choice does not break the schema, it silently produces bad data. A required field on something that is sometimes absent forces the model to invent a value. A missing nullable means the model fills a gap with a guess instead of returning null honestly.

- **required** is for data that will always exist in the source. If the field is required but the source does not contain it, the model has no honest answer to give, so it fabricates one. Only mark a field required when you are certain the source will always provide it.
- **optional** is for data that genuinely may not exist and where its absence is acceptable to the downstream system. The field simply does not appear in the output when the source has nothing to provide. Use this when a missing field is a valid state and the consumer can handle it.
- **nullable** is for data that may not exist but where the downstream system needs to see an explicit signal that it is missing, not just a silent omission. Returning null is an honest answer. It tells the consumer the field was looked for and not found, rather than leaving the consumer to wonder whether the field was skipped or never checked. This is the safer default for most optional data.
- **enum** is for fields where only a fixed set of values is valid. It prevents the model from inventing category labels or returning slight variations of the same value across runs. When using enum, always consider adding another option for values you have not anticipated, paired with a free-text detail field to capture what other means in that specific case.

References

[Structured Outputshttps://docs.claude.com/en/docs/build-with-claude/structured-outputs](https://docs.claude.com/en/docs/build-with-claude/structured-outputs)[Implement Tool Usehttps://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use](https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use)[Reduce Hallucinationshttps://docs.claude.com/en/docs/build-with-claude/prompt-engineering/reduce-hallucinations](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/reduce-hallucinations)

### The tool_choice Setting

This setting controls whether the model calls a tool and which one. Getting this right is what separates a system that sometimes uses tools from one that always behaves predictably.

Key Term

- **tool_choice** is the setting that controls whether and which tool the model calls.

The Four Modes

| Mode | Behavior |
| --- | --- |
| auto | The model decides whether to call a tool. This is the default. |
| any | The model must call one of your tools, but it picks which. |
| tool | The model must call one specific tool that you name. |
| none | The model may not call any tool, even if tools are provided. |

Choosing the Right Mode

- Use auto when the model should decide whether a tool is needed at all.
- Use any when you need structured output but the input type is unknown and multiple schemas are possible.
- Use tool when one specific step must always run first, such as extracting metadata before enrichment.
- Use none to test text-only behavior or to disable tools for a specific turn.

### Syntax Errors vs. Semantic Errors

This distinction is heavily tested. A schema guarantees the shape of the output, but not the meaning of the values inside it. These are two separate problems requiring two separate solutions, and confusing them is one of the most common mistakes in production Claude integrations.

| Concept | Best Used For | Key Benefit | Common Exam Trap |
| --- | --- | --- | --- |
| Syntax-error prevention (schema) | Guaranteeing valid, parseable structure | Removes malformed output | Assumed to also guarantee correct values |
| Semantic-error detection (validation) | Catching wrong or inconsistent values | Verifies meaning, not just shape | Expected to be handled by the schema alone |

A schema stops broken JSON, but it will happily return line items that do not add up to the stated total, or a value placed in the wrong field.

Examples of Each Error Type

| Error Type | Example | Caught by Schema? |
| --- | --- | --- |
| Syntax error | Missing closing brace, wrong data type | Yes |
| Semantic error | Line items do not sum to stated total | No |
| Semantic error | Value placed in the wrong field | No |
| Semantic error | Two fields that contradict each other | No |

The table shows the boundary between what a schema can catch and what it cannot. Syntax errors are structural. The output is broken before you even look at the values, so the schema catches them immediately. Semantic errors are different. The output is structurally valid and the schema raises no complaint, but the values are wrong, misplaced, or contradictory. The problem only appears when you actually read and compare the values, which the schema never does.

### Native Structured Outputs Feature

Beyond tool use, Claude offers a native Structured Outputs feature with two modes that can be used alone or together.

| Mode | When to Use |
| --- | --- |
| JSON outputs (output_config.format) | When the final answer itself is the data, such as turning one document into one record. |
| Strict tool use (strict: true) | When the model is taking actions in an agentic flow and each action call needs to be schema-valid. |

The key difference between the two modes is what you are trying to control. JSON outputs controls the shape of the final response, making it useful when the response itself is the deliverable. Strict tool use controls the inputs to each tool call, making it useful when the reliability of each action in a workflow matters. If the wrong data flows into a tool mid-pipeline, every step after it is built on a bad foundation. Strict tool use prevents that by rejecting any tool call whose inputs do not match the schema before it runs.

Common Mistakes

- Treating a schema as proof the values are correct. It only guarantees the shape.
- Marking data required when the source might not contain it, which forces the model to invent a value.
- Mixing up any (some tool, model chooses) with a tool (one specific named tool).
- Forgetting structure, which lets the inputs drift away from your schema.
- Ignoring truncation, where a low max_tokens cuts off an incomplete tool call.

References

[Overviewhttps://docs.claude.com/en/docs/agents-and-tools/tool-use/overview](https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview)[Implement Tool Usehttps://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use](https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use)[Structured Outputshttps://docs.claude.com/en/docs/build-with-claude/structured-outputs](https://docs.claude.com/en/docs/build-with-claude/structured-outputs)

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="e-schema-design-for-reliable-extraction"></a>

## E. Schema Design for Reliable Extraction

How you design the fields in a schema has a direct effect on extraction accuracy. The same model, given a slightly different schema, will either invent a value or honestly report that something is missing. This section is about making the honest outcome the default.

Schema design is not just about structure. It is about giving the model a way to be accurate. A schema that marks everything required forces the model to produce values even when the source does not contain them. A schema that uses nullable fields gives the model an honest path: return null when the data is not there. The difference between these two approaches is the difference between fabricated data and reliable extraction.

### Required vs. Optional vs. Nullable Fields

Choosing between these three is the most consequential decision in schema design. The wrong choice does not throw an error. It silently produces bad data.

| Concept | Best Used For | Key Benefit | Common Exam Trap |
| --- | --- | --- | --- |
| Required field | Data the source always contains | Guarantees the field is present | Forces fabrication when the data is absent |
| Optional field | Data that may be absent | Lets the model omit it | Confused with nullable when you need an explicit null |
| Nullable field | Data that may be absent but must still appear as null | Prevents invented values | Left out, so the model fabricates instead |

When to Use Each

- Use required only when you are certain the source will always provide the data. If there is any chance it will not, required is the wrong choice.
- Use optional when the downstream system can handle a missing field and treats absence and null the same way.
- Use nullable when the downstream system needs an explicit signal that the field was checked and nothing was found. A null value is an honest answer. A missing field is ambiguous.

### Nullable vs. Optional

- Optional means the field can disappear from the output entirely.
- Nullable means the field must appear but can carry a null value.
- Nullable is the safer default for most absent data. It prevents fabrication while still giving the consumer a reliable signal that the field was looked for and not found.

References

[Structured Outputshttps://docs.claude.com/en/docs/build-with-claude/structured-outputs](https://docs.claude.com/en/docs/build-with-claude/structured-outputs)[Reduce Hallucinationshttps://docs.claude.com/en/docs/build-with-claude/prompt-engineering/reduce-hallucinations](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/reduce-hallucinations)

### Enum Fields

An enum field restricts the model to a fixed set of allowed values. This eliminates invented category labels and prevents slight variations of the same value appearing across runs. Without an enum, a category field might return `software` on one run and `Software Development` on the next, and `SaaS Tool` on another. With an enum, the output is always one of the values you defined, making downstream processing predictable and reliable.

Enum fields are most valuable in classification and categorization tasks where consistency matters more than flexibility. They are one of the simplest and most effective tools for reducing output variability.

### The Closed Enum Problem

A closed enum is an enum with no fallback option. It works well when your defined values cover every case you will ever see. In practice, that is rarely true.

- A closed enum breaks when the source contains a value you did not anticipate. The model is forced to pick the closest match from the defined list, which may be wrong.
- The output looks valid because it passes schema validation, but the classification is incorrect.
- The failure is silent. There is no error, no warning, and no way to tell from the output that the model was forced into a bad choice.
- Over time, as new categories appear in your data, a closed enum produces more and more misclassifications without any visible signal that something is wrong.

### The "Other" Plus Detail Pattern

The solution is to keep the enum open by adding another option paired with a free-text detail field. This is the recommended pattern when the category space is likely to grow or when the source data comes from outside your control.

- The enum keeps the output structured and consistent for known values.
- The other option gives the model an honest exit when a value does not fit any defined category.
- The detail field captures what other means in that specific case, preserving the information without breaking the structure.
- Downstream systems can process known categories automatically and route other values to a human review queue for reclassification.
- Over time, the detailed field values in other cases reveal which new categories are appearing frequently.

### Representing Ambiguity

Add a value like `unclear` to give the model a way to flag genuinely uncertain cases. Without it, the model is forced to pick a category even when the source is ambiguous, which produces confident but wrong classifications.

- `unclear` is different from `other`. Other means a value exists but does not fit the list. Unclear means the source does not contain enough information to classify at all.
- Using unclear surfaces the uncertainty instead of hiding it behind a forced choice.
- Unclear cases can be routed to human review or flagged for follow-up, rather than silently entering the pipeline with a wrong classification.
- Tracking the volume of unclear results over time is also useful. A high rate of unclear often signals that the source data quality is low or that the enum categories need to be redefined.

References

[Structured Outputshttps://docs.claude.com/en/docs/build-with-claude/structured-outputs](https://docs.claude.com/en/docs/build-with-claude/structured-outputs)[Reduce Hallucinationshttps://docs.claude.com/en/docs/build-with-claude/prompt-engineering/reduce-hallucinations](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/reduce-hallucinations)

### Format Normalization Rules

A normalization rule is prompt guidance that tells the model how to standardize a value before returning it. The schema fixes the shape of the output. Normalization rules fix the values inside that shape. Both are needed for clean extraction.

Why They Are Needed

Sometimes the schema shape is correct but the values inside it are inconsistent. Dates written in different formats, phone numbers with and without country codes, names in different cases. A schema cannot fix these because they are all valid strings that pass type validation. Normalization rules in the prompt fix them by telling the model exactly how to standardize values.

Without normalization rules, the same piece of information can appear in many different forms across documents:

- A date field might return `January 5, 2024` in one record, `01/05/24` in another, and `2024-01-05` in a third. All three pass schema validation. None of them are consistent enough for reliable downstream processing.
- A name field might return `john smith`, `John Smith`, and `JOHN SMITH` from three different source documents. The schema accepts all of them. The downstream system has to handle three versions of the same value.
- A currency field might return `$1,200.00`, `USD 1200`, and `1200.00 USD`. Parsing these reliably requires extra logic that normalization rules eliminate at the source.

Types of Normalization Rules

Normalization rules fall into a few common categories depending on what kind of value needs standardizing.

*Date and Time Rules*

- Convert all dates to ISO 8601 format (YYYY-MM-DD). If a date is missing, return null. Do not infer a date.
- Convert all timestamps to UTC in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ).
- Do not infer or estimate a date from context. If the source does not contain it, return null.

*Contact and Identity Rules*

- Standardize phone numbers to E.164 format (+[country code][number]). If a number is missing, return null.
- Return names in title case. Do not abbreviate first or last names.
- Return email addresses in lowercase. Do not correct or guess email addresses.

*Currency and Numeric Rules*

- Convert all currency values to the base unit as a number with two decimal places. Do not include currency symbols or thousands separators.
- Return percentages as decimal numbers (0.15 for 15%). Do not include the percent sign.
- Do not round values unless the source explicitly states a rounded figure.

*Text and Category Rules*

- Return all country names using ISO 3166-1 alpha-2 codes (US, GB, PH). Do not use full country names or abbreviations.
- Trim leading and trailing whitespace from all string fields.
- Return boolean fields as true or false only. Do not return yes, no, or other variations.

When Normalization Rules Are Not Enough

Normalization rules handle predictable inconsistencies. They do not handle all cases.

- If the source data is genuinely ambiguous, a normalization rule cannot resolve it. Use a nullable field and return null rather than guessing.
- If the same field appears in multiple formats within a single document, note this in the rule explicitly so the model applies the same standard to all instances.
- If the normalization rule is complex, consider adding a worked example to the prompt showing the before and after. Rules with examples are followed more reliably than rules stated as instructions alone.

| Situation | Normalization Rule Handles It? | What to Do Instead |
| --- | --- | --- |
| Date in multiple formats across documents | Yes | Add an ISO 8601 rule |
| Date that is genuinely absent | No | Use nullable, return null |
| Currency with different symbols | Yes | Add a base unit rule |
| Ambiguous value that could mean two things | No | Use unclear enum value or nullable |
| Whitespace and casing inconsistencies | Yes | Add trim and case rules |

Where to Put Them

Put normalization rules in the prompt alongside the schema, not inside the schema itself. The schema declares the type. The prompt explains how to handle the value. Keep them close together so the model sees both at the same time.

Placing rules far from the schema increases the chance the model misses them in a long prompt. If you have many rules, group them by field type and place the group immediately after the schema definition.

Common Mistakes

- Marking data required when the source often will not contain it.
- Leaving out nullability, so the model fills the gap with a guess.
- Using a closed enum with no other for a category that keeps growing.
- Skipping normalization rules, which leaves messy values inside a valid shape.
- Treating optional and nullable as interchangeable when the downstream system needs an explicit null.
- Writing normalization rules without examples, which leads to inconsistent application on edge cases.
- Placing normalization rules far from the schema in a long prompt, where the model is less likely to apply them consistently.

References

[Structured Outputshttps://docs.claude.com/en/docs/build-with-claude/structured-outputs](https://docs.claude.com/en/docs/build-with-claude/structured-outputs)[Reduce Hallucinationshttps://docs.claude.com/en/docs/build-with-claude/prompt-engineering/reduce-hallucinations](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/reduce-hallucinations)[Overviewhttps://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview)

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="f-validation-retry-and-feedback-loops"></a>

## F. Validation, Retry, and Feedback Loops

A validation loop checks the model's output against your rules and, when it fails, sends the failure back so the model can try again. The most important judgment in this section is knowing whether a retry can actually succeed, because retrying the wrong kind of error wastes money and can produce a fabricated answer.

Validation is the layer between Claude's output and your downstream system. Without it, bad data passes through silently. With it, you catch failures early, correct what can be corrected, and flag what cannot. A well-designed validation loop does not just reject bad output. It tells the model exactly what went wrong and gives it a realistic chance to fix it.

### What is a Validation Loop?

What Is a Validation Loop?

Nguồn tham khảo: Claude-Certified-Architect-Foundations-CCAR-F.pdf

A validation loop is a process that checks the model's output against your defined rules and, when the output fails, sends the failure back to the model for correction. It is the layer between Claude's output and your downstream system. Without it, bad data passes through silently.

Why It Follows a Fixed Sequence

Each step in the loop depends on the one before it. Skipping a step does not just miss a check. It either lets bad data through to the next system or wastes a retry on an error that cannot be fixed.

| Step | Action | What Happens If Skipped |
| --- | --- | --- |
| 1. Extract | Send the source document to Claude with the schema | No output to validate |
| 2. Validate structure | Check output against the JSON schema | Malformed output reaches the downstream system |
| 3. Validate semantics | Check values for consistency and correctness | Structurally valid but wrong data passes through |
| 4. Classify the error | Determine if the error is resolvable or unresolvable | Unresolvable errors get retried, risking fabrication |
| 5. Retry or escalate | Send a feedback prompt for resolvable errors and escalate the rest | Fixable errors never get fixed, unfixable errors loop indefinitely |
| 6. Log the result | Record what failed, what was retried, and what the outcome was | Patterns in failures stay invisible |

References

[Structured Outputshttps://docs.claude.com/en/docs/build-with-claude/structured-outputs](https://docs.claude.com/en/docs/build-with-claude/structured-outputs)[Overviewhttps://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview)

### Resolvable vs. Unresolvable Errors

This is the most important judgment in the section. Getting it wrong in either direction causes problems. Retrying a resolvable error without feedback just asks the model to guess again. Retrying an unresolvable error pushes the model toward fabrication.

What is a Resolvable Error?

A resolvable error is a format or structure problem where the information exists in the source document but came back in the wrong shape. The model found the data but returned it incorrectly, such as putting a value in the wrong field, returning a date in the wrong format, or producing malformed JSON. Because the data exists, a retry with specific feedback gives the model a realistic chance to fix it.

What is an Unresolvable Error?

An unresolvable error is a missing fact that no retry can produce. The information is simply not in the source document. If a field was marked required but the source never contained that data, the model has nothing to extract. Retrying does not create information that was never there.

| Error Type | Cause | Correct Response |
| --- | --- | --- |
| Resolvable | Information exists in the source but came back in the wrong shape | Retry with specific error feedback |
| Unresolvable | Information is not in the source at all | Do not retry. Adjust the input or schema instead. |

The Fabrication Risk

When an unresolvable error is retried, the model knows it failed and is being asked to try again. Without the information it needs, it may produce a plausible-looking value to satisfy the requirement. That value is fabricated. It passes schema validation and looks correct. The only way to prevent this is to recognize unresolvable errors before retrying.

- **Fabricated value** is a value the model invented to satisfy a schema requirement when the actual data did not exist in the source. It looks valid, passes schema validation, and is wrong.
- **Plausible-looking** describes a fabricated value that resembles a real answer closely enough to pass automated checks. It is the reason fabrication is dangerous: it fails silently.
- **Silent failure** is when bad data passes through every validation layer and enters the downstream system without triggering any error or alert. Fabricated values are the most common cause of silent failures in extraction pipelines.

References

[Reduce Hallucinationshttps://docs.claude.com/en/docs/build-with-claude/prompt-engineering/reduce-hallucinations](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/reduce-hallucinations)[Structured Outputshttps://docs.claude.com/en/docs/build-with-claude/structured-outputs](https://docs.claude.com/en/docs/build-with-claude/structured-outputs)

### Retry with Error Feedback

A retry without feedback is just a second guess. The model does not know what went wrong, so it produces roughly the same output with minor variations. A retry with feedback is a targeted correction. The model knows exactly what failed and where to focus.

What to Include in a Feedback Prompt

On a retry, send back three things:

- The original input (the source document) so the model can re-read the source with fresh attention.
- The failed output (what the model returned) so the model can see exactly where it went wrong.
- The specific validation error (exactly what failed and why) so the model does not have to guess what needs to be fixed.

How to Write a Good Feedback Prompt

- Be specific about what failed. "invoice_number is missing" is more useful than "the output was invalid."
- Reference the exact field and the exact rule it violated. "total_amount must be a number but returned as a string" gives the model a precise target.
- Do not include errors the model cannot fix. If an unresolvable error is mixed in with resolvable ones, the model may fabricate a value for the unfixable field while correctly fixing the others.

| Feedback Quality | Example | Result |
| --- | --- | --- |
| No feedback | "Please try again" | Model guesses with no new information |
| Vague feedback | "The output was invalid" | Model makes minor random adjustments |
| Specific feedback | "invoice_number is missing. It appears in the header as INV-XXXX." | Model targets the exact field and location |

References

[Structured Outputshttps://docs.claude.com/en/docs/build-with-claude/structured-outputs](https://docs.claude.com/en/docs/build-with-claude/structured-outputs)[Reduce Hallucinationshttps://docs.claude.com/en/docs/build-with-claude/prompt-engineering/reduce-hallucinations](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/reduce-hallucinations)

### Validation Layers

Validation is not a single check. It is a stack of checks, each catching a different class of error. Skipping a layer means that class of error passes through undetected.

What is a Validation Layer?

A validation layer is one level of checking in the validation stack. Each layer has a specific job and catches a specific class of error. No single layer catches everything. A schema catches structure problems. A semantic layer catches meaning problems. A business rule layer catches domain-specific logic problems. All three are needed in a production extraction pipeline.

| Validation Layer | What It Catches | Tool |
| --- | --- | --- |
| Schema validation | Structure, types, required fields, enum values | JSON schema, strict tool use |
| Semantic validation | Arithmetic consistency, field placement, contradictions | Pydantic, custom checks |
| Business rule validation | Domain-specific constraints | Custom logic |

Schema Validation

Schema validation checks structure. It confirms that required fields are present, that values match their declared types, and that enum values are within the allowed set. This is the first layer and the cheapest to run.

- Catches missing required fields.
- Catches wrong data types.
- Catches values outside an enum.
- Does not catch wrong values, inconsistent values, or business rule violations.

Semantic Validation

Semantic validation checks meaning. It confirms that values are logically consistent with each other and with the rules of the domain. These are errors a schema cannot catch because the structure is valid.

- Line items that do not sum to the stated total.
- A value placed in the wrong field where the type still matches.
- Two fields that contradict each other.
- A date that is logically impossible given another date in the same record.

Business Rule Validation

Business rule validation checks domain-specific constraints that go beyond structure and arithmetic.

- A ship date must be after the order date.
- A discount cannot exceed the item price.
- A status of completed requires a non-null completion date.

References

[Structured Outputshttps://docs.claude.com/en/docs/build-with-claude/structured-outputs](https://docs.claude.com/en/docs/build-with-claude/structured-outputs)[Reduce Hallucinationshttps://docs.claude.com/en/docs/build-with-claude/prompt-engineering/reduce-hallucinations](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/reduce-hallucinations)

### Semantic Validation Errors

These are logical errors a schema cannot catch. The output is structurally valid and passes schema validation, but the values are wrong or inconsistent. The schema confirmed the shape. It said nothing about whether the values make sense.

Why a Schema Cannot Catch These

A schema checks that a field exists, holds the right type, and falls within an allowed set. It does not compare values against each other. It does not recompute arithmetic. It does not know that a ship date before an order date is impossible. All of that logic has to live in a separate validation layer.

Common Semantic Errors

- **Line items that do not sum to the total.** Each line item field and the total field are individually valid numbers. The schema passes them both. Only a recomputation reveals the mismatch.
- **A value placed in the wrong field where the type still matches.** A name in an email field is still a string. A price in a quantity field is still a number. The schema accepts both. The error is only visible when you read the content, not the type.
- **Two fields that contradict each other.** A status of completed and a null completion date are individually valid. Together they are contradictory. The schema evaluates each field alone and never compares them.
- **A calculated field that does not match the stated value.** A subtotal that does not match the sum of its components, or a tax amount that does not match the declared rate applied to the base. Both fields are valid numbers. The inconsistency only appears when you do the math.

What Causes Semantic Errors

Semantic errors have two main causes. The first is extraction error, where the model correctly found the values but placed them incorrectly or copied the wrong number. This is often resolvable by retry with targeted feedback. The second is source inconsistency, where the source document itself contains contradictory or incorrect data. This is usually unresolvable by retry and should be escalated for human review.

| Semantic Error | Likely Cause | Resolvable by Retry? |
| --- | --- | --- |
| Line items do not sum to total | Model copied wrong number | Sometimes |
| Value in wrong field | Model placed value incorrectly | Yes, with specific feedback |
| Two contradicting fields | Source document inconsistency | Usually no |
| Calculated field mismatch | Model arithmetic error or wrong source value | Sometimes |

Adding Semantic Checks to Pydantic

*What Pydantic Does Here*

Pydantic validates data against a defined model. Beyond type checking, it can run custom logic that catches the semantic errors a schema misses. When a check fails, Pydantic raises a `ValidationError` with a specific message. That message feeds directly into the retry prompt, giving the model a precise description of what went wrong.

*Field Validators*

A field validator runs custom logic on a single field after type validation passes. It can recompute a value and raise an error if the result does not match the stated value. For example, a field validator on a subtotal field can sum the line items and compare the result to the extracted subtotal.

*Model Validators*

A model validator runs after all individual field validators have passed. It has access to every field in the model at once, which makes it the right place for cross-field logic. A model validator can compare a ship date to an order date, check that a status and a completion date are consistent, or verify that a discount does not exceed the item price.

*Why This Matters for the Retry Loop*

Pydantic checks run automatically as part of the validation loop. When a check fails, the `ValidationError` it raises contains a specific message about which field failed and why. That message is what you include in the feedback prompt on a retry. A generic error message produces a generic retry. A Pydantic error message that says `line_item_total 150.00 does not match stated_total 180.00` points the model directly at the discrepancy.

References

[Structured Outputshttps://docs.claude.com/en/docs/build-with-claude/structured-outputs](https://docs.claude.com/en/docs/build-with-claude/structured-outputs)[Reduce Hallucinationshttps://docs.claude.com/en/docs/build-with-claude/prompt-engineering/reduce-hallucinations](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/reduce-hallucinations)

### In-Schema Self-Checks

In-schema self-checks are fields you add to the schema specifically to surface inconsistencies. Rather than running all validation logic externally, you ask the model to do part of the checking itself and report the results as structured fields. This reduces the amount of external validation logic you need to write and makes certain classes of problems visible immediately in the output.

Why Add Self-Checks to the Schema?

External validation catches errors after the fact. Self-checks ask the model to flag potential issues as part of extraction. When the model detects a contradiction or expresses uncertainty during generation, capturing that signal in a structured field gives your validation layer something concrete to act on. Without self-checks, those signals are either lost or buried in free-form text that is harder to process reliably.

The Four Self-Check Fields

- `calculated_total` is a field where the model computes the total independently from the line items and returns it alongside the stated total from the source. A mismatch between the two surfaces is an arithmetic inconsistency without requiring the validation layer to reparse and recompute the line items externally.
- `conflict_detected` is a boolean field the model sets to true when it finds contradictory information in the source document that it cannot resolve on its own. For example, a document that states a quantity of ten in one section and five in another. The model cannot know which is correct, so it flags the conflict and lets a human decide.
- `detected_pattern` is a field that records which construct, condition, or rule triggered a finding. Over time, tracking this field across many documents reveals which criteria produce the most false positives, which categories fire most often, and where the schema or prompt criteria need tightening.
- `confidence` is a field where the model signals how certain it is about a particular extraction. A low confidence score on a field means the model found something but is uncertain whether it is correct. Routing low-confidence records to human review before they enter the downstream system prevents uncertain extractions from propagating silently.

| Self-Check Field | What It Surfaces | How to Use It |
| --- | --- | --- |
| calculated_total | Arithmetic mismatches | Compare against stated_total in validation layer |
| conflict_detected | Source-level contradictions | Route to human review queue |
| detected_pattern | Which rule triggered a finding | Track over time to identify noisy criteria |
| confidence | Model uncertainty | Route low-confidence records to review |

Important Terms

- **Self-check field** is a schema field whose purpose is not to capture extracted data but to capture the model's own assessment of the extraction, such as a computed total, a conflict flag, or a confidence score.
- **stated_total** is the total as it appears in the source document, extracted directly. It is compared against `calculated_total` to detect arithmetic mismatches.
- **Boolean field** is a field that holds only true or false. `conflict_detected` is a boolean because the model either detected a conflict or it did not. There is no middle value.
- **Human review queue** is a holding area where records are sent when automated validation cannot resolve an issue. Records with `conflict_detected` set to true or with a low confidence score are routed here rather than being retried or dropped.
- **Noisy criteria** are rules or conditions that trigger findings too frequently on cases that are not actual problems. The `detected_pattern` field is what makes them visible over time so they can be tightened or removed.
- **False positive rate** is the proportion of findings raised by a criterion that turn out not to be real problems. A high false positive rate on a specific pattern is the signal that `detected_pattern` is designed to surface.
- **Confidence score** is a value the model returns alongside an extraction to indicate how certain it is that the extracted value is correct. Low confidence does not mean the value is wrong, but it means a human should verify it before the record enters production.
- **Propagation** is when an incorrect value enters the downstream system and flows through subsequent processing steps unchecked. Self-checks exist to catch propagation at the source before it compounds.

References

[Structured Outputshttps://docs.claude.com/en/docs/build-with-claude/structured-outputs](https://docs.claude.com/en/docs/build-with-claude/structured-outputs)[Overviewhttps://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview)

### Max Retry Limits

What is a Max Retry Limit?

A max retry limit is the maximum number of times the validation loop will attempt to correct a failed output before stopping and escalating the record. Without a limit, the loop runs indefinitely on unresolvable errors, consuming tokens and time without any chance of succeeding. Setting a limit is not optional in production systems. It is a safety boundary that prevents runaway costs and infinite loops.

Why Limits Are Necessary

A retry loop that has no exit condition assumes every error is eventually fixable. That assumption is wrong. Unresolvable errors cannot be fixed by any number of retries because the information simply does not exist in the source. Without a limit, the loop keeps sending the same unresolvable error back to the model, which responds by fabricating increasingly plausible-looking values just to satisfy the requirement. The output looks correct, passes validation on a later attempt by chance, and enters the downstream system as fabricated data.

Setting the Right Limit

- Set a max retry limit of two to three attempts for most extraction tasks.
- A single retry handles most resolvable errors, such as a formatting mistake or a misplaced value. A second retry catches cases where the first retry introduced a new minor error.
- Going beyond three retries rarely improves accuracy and significantly increases cost. If an error persists after three attempts, it is almost always unresolvable.
- Set different limits for different task types. Simple field extraction may need only one retry. Complex multi-document extraction may justify three.

What Happens When the Limit Is Reached

- Log the failure with the source document, the last output, and all validation errors. This creates a record that can be reviewed later to understand what went wrong.
- Route limit-exceeded records to a human review queue rather than dropping them silently. Dropping records creates invisible data loss. A human review queue makes the failure visible and actionable.
- Do not let limit-exceeded records enter the downstream system, even if the last output looks structurally valid. A record that required three retries and still failed is not reliable.

Using the Retry Limit as a Diagnostic Signal

- Track which fields and which document types hit the retry limit most often. A field that consistently hits the limit is a signal that the schema, the prompt, or the source data for that field has a systemic problem.
- A document type that regularly exhausts retries suggests that the prompt examples do not cover that format or that the schema is too strict for the variation in that document class.
- The retry limit count per field over time is one of the most useful metrics in an extraction pipeline. It shows exactly where the system is failing and where schema or prompt improvements will have the most impact.

| Situation | What It Signals | What to Do |
| --- | --- | --- |
| One field hits the limit repeatedly | Schema or prompt problem for that field | Review the field definition and prompt criteria |
| One document type hits the limit repeatedly | Format not covered by examples | Add examples for that document type |
| All fields hit the limit on the same document | Source document is unusable | Escalate for human review, flag the source |
| Limit is hit on the first retry attempt | Error is likely unresolvable from the start | Classify the error before retrying |

Important Terms

- **Retry limit** is the maximum number of correction attempts allowed before the loop stops. It is a hard boundary, not a suggestion.
- **Runaway loop** is a retry loop with no exit condition that keeps running indefinitely on an unresolvable error, consuming tokens and producing fabricated values with each attempt.
- **Limit-exceeded record** is a record that has reached the max retry limit without passing validation. It must be logged and routed to human review, never dropped silently.
- **Systemic problem** is a recurring failure that appears across many documents rather than on a single edge case. A field that repeatedly hits the retry limit is a signal of a systemic problem in the schema or prompt, not a one-off extraction error.
- **Silent data loss** is when a record is dropped without logging after hitting the retry limit. It is one of the most dangerous failure modes in an extraction pipeline because nothing signals that the record is missing.
- **Token cost** is the number of tokens consumed by each API call. Every retry consumes tokens for the full prompt plus the output. Without a retry limit, unresolvable errors can consume many times the expected token budget before failing.

WORKED EXAMPLE

```
from pydantic import BaseModel, ValidationError, model_validator

class Invoice(BaseModel):
    invoice_number: str
    line_item_total: float
    stated_total: float

    @model_validator(mode='after')
    def check_totals_match(self):
        if round(self.line_item_total, 2) != round(self.stated_total, 2):
            raise ValueError(
                f"line_item_total {self.line_item_total} does not match "
                f"stated_total {self.stated_total}"
            )
        return self

MAX_RETRIES = 3

def validate_and_retry(raw_output, document, call_model, attempt=1):
    try:
        return Invoice.model_validate_json(raw_output)
    except ValidationError as e:
        if attempt >= MAX_RETRIES:
            raise RuntimeError(f"Max retries reached. Last error: {e}")
        return validate_and_retry(
            call_model(document=document, failed=raw_output, error=str(e)),
            document, call_model, attempt + 1
        )
```

What this shows: the model validator catches the semantic error that schema validation misses, the feedback prompt sends the exact mismatch back to the model, and the max retry limit prevents indefinite looping on unresolvable cases.

Common Mistakes

- Retrying when the data does not exist, which pushes the model toward fabrication.
- Expecting the schema to catch sums or field placement. Those are semantic checks.
- Retrying without the specific error, so the model just guesses again.
- Skipping the tracking field, which leaves failure patterns invisible.
- Setting no retry limit, which causes indefinite looping on unresolvable errors.
- Mixing resolvable and unresolvable errors in the same feedback prompt, which can trigger fabrication for the unfixable fields.
- Not logging retry outcomes, which makes it impossible to identify systemic schema or prompt problems.

References

[Structured Outputshttps://docs.claude.com/en/docs/build-with-claude/structured-outputs](https://docs.claude.com/en/docs/build-with-claude/structured-outputs)[Reduce Hallucinationshttps://docs.claude.com/en/docs/build-with-claude/prompt-engineering/reduce-hallucinations](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/reduce-hallucinations)[Overviewhttps://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview)

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="g-batch-processing-strategies"></a>

## G. Batch Processing Strategies

Batch processing is for when you can accept a delay in exchange for paying half the price. That makes it a good fit for large volumes of work that can wait, and a poor one for anything where someone is sitting there waiting on the result.

The Message Batches API is built for exactly that kind of workload, where cost and volume matter but latency doesn't. This section covers when to reach for it, how the results come back, and how to handle failures along the way.

### How the Message Batches API Works

Submission

You submit a batch as a single API call containing an array of requests. Each request carries its own `custom_id`, model, `max_tokens`, and messages. The API accepts the batch and begins processing asynchronously. Your system does not wait for results.

Processing Window

The Message Batches API guarantees processing within 24 hours. Most batches complete in under an hour, but your system must be designed to handle the full window. Any SLA built on batch processing must absorb this uncertainty.

Polling for Results

Because results are not returned at submission time, your system must poll the API to detect when the batch is complete. Poll on a reasonable interval, such as every few minutes, rather than continuously. When the batch status changes to completed, retrieve the results.

Result Retrieval

Results do not come back in the same order as the input requests. Each result carries the `custom_id` of the request it belongs to. Matching results back to their source documents is done by `custom_id`, not by position.

| Phase | What Happens | What Your System Does |
| --- | --- | --- |
| Submission | Batch accepted, processing begins | Record the batch ID and submission time |
| Processing | API processes requests asynchronously | Poll periodically for status |
| Completion | Results available for retrieval | Fetch results, match on custom_id |
| Failure handling | Some items failed or expired | Identify failed items by custom_id, resubmit |

References

[Batch Processinghttps://docs.claude.com/en/docs/build-with-claude/batch-processing](https://docs.claude.com/en/docs/build-with-claude/batch-processing)[Message Batches Apihttps://www.anthropic.com/news/message-batches-api](https://www.anthropic.com/news/message-batches-api)

### Batch vs. Synchronous Processing

Batch vs. Synchronous Processing

Nguồn tham khảo: Claude-Certified-Architect-Foundations-CCAR-F.pdf

The choice between batch and synchronous is not about preference. It is about what the work actually needs. Choosing the wrong processing mode either blocks a workflow that cannot afford to wait or wastes money on real-time infrastructure for work that has no urgency.

What is Batch Processing?

Batch processing is a mode where you submit many requests at once and retrieve results later. The API processes them asynchronously in the background. You do not wait for each result before moving on. Because you are accepting a delay, Anthropic charges 50% of the standard synchronous price. The trade is explicit: time for money.

What is Synchronous Processing?

Synchronous processing is the standard API mode where each request waits for a response before proceeding. The result comes back in the same call. It is required whenever something is blocked waiting on the answer, whether that is a person on screen, a pipeline step, or an automated check that must complete before the next action.

| Concept | Best Used For | Key Benefit | Common Exam Trap |
| --- | --- | --- | --- |
| Batch processing | Overnight reports, weekly audits, bulk evaluation, document processing | 50% cost reduction at scale | Applied to a blocking workflow that needs a fast result |
| Synchronous processing | Pre-merge checks, interactive flows, agentic tool loops | Immediate response | Used for huge non-urgent volumes where cost matters |

The Deciding Question

Ask: does anything stop working while waiting for this result? If yes, use synchronous. If no, use batch. The cost saving is irrelevant if the workflow is blocked.

What Batch Processing Cannot Do

- It cannot guarantee when results will arrive. There is no latency SLA beyond the 24-hour window.
- It cannot support multi-turn tool loops within a single request. Agentic workflows must use the synchronous API.
- It cannot be used when downstream steps depend on the result immediately.
- It cannot replace synchronous processing when an SLA requires results faster than 24 hours.

Choosing the Right Mode

| Workload | Right Choice | Reason |
| --- | --- | --- |
| Overnight document extraction | Batch | Latency-tolerant, high volume, cost matters |
| Pre-merge code review | Synchronous | Developer is waiting for the result |
| Weekly audit of 10,000 records | Batch | No urgency, significant cost saving |
| Interactive chatbot response | Synchronous | User is waiting on screen |
| Agentic tool loop | Synchronous | Multi-turn exchange required |
| Monthly billing report | Batch | Overnight run, latency irrelevant |
| Pipeline step where next step is blocked | Synchronous | The downstream step cannot proceed without the result |
| End-of-day summary generation | Batch | Consumed the next morning, no urgency |

The table shows one principle applied across different workloads: the right choice is always determined by who or what is waiting, not by volume. Every synchronous case has something blocked waiting on the result. Every batch case has nothing waiting. Volume does not drive the decision. Whether something is blocked does.

References

[Batch Processinghttps://docs.claude.com/en/docs/build-with-claude/batch-processing](https://docs.claude.com/en/docs/build-with-claude/batch-processing)[Message Batches Apihttps://www.anthropic.com/news/message-batches-api](https://www.anthropic.com/news/message-batches-api)

### Failure Handling

Failures in batch processing are expected at scale. The key is identifying which items failed, why they failed, and how to resubmit them correctly. A batch that partially fails is not a failed batch. It is a normal outcome that your system should be designed to handle.

Custom Identifiers

A custom identifier, or `custom_id`, is a unique label you assign to each request before submitting it to the batch. Its purpose is to let you match every result back to the document or record it came from after processing is complete. Without it, results are anonymous. You receive a set of outputs with no reliable way to know which output belongs to which input.

The `custom_id` is necessary because batch results do not come back in the same order as the input requests. The API processes items asynchronously, and the order of completion depends on processing time, not submission order. Position-based matching breaks entirely in this situation. custom_id-based matching works regardless of order.

- Assign a `custom_id` that ties directly to the source record, such as a document ID or a database primary key. This makes matching unambiguous and removes the need for a separate lookup table.
- Store the mapping between `custom_id` and source record before submitting. If the batch system fails entirely, you need this mapping to reconstruct what was submitted and what still needs processing.
- `custom_id` values must be unique within a batch. Duplicate IDs produce unpredictable matching behavior because two results will carry the same identifier with no way to tell them apart.

Resubmission

Resubmission is the process of sending failed items back to the API for a second attempt. When some items in a batch fail, only those items need to go back. Resubmitting the whole batch means processing items that already succeeded a second time, which doubles the cost for those items with no benefit.

Selective resubmission by `custom_id` keeps the cost of failure handling proportional to the number of failures, not the size of the original batch. If 100 items out of 10,000 fail, only those 100 are resubmitted. The other 9,900 are already done.

Chunking

Chunking is splitting a request that is too large into smaller pieces so it can be processed within the API's size limits. An item fails with a size error when the content of that single request exceeds what the API will accept. Retrying the item as-is will fail again for the same reason. The item must be broken into smaller chunks first.

Each chunk is submitted as its own independent request with its own `custom_id`. Because each chunk returns its own result, your system needs to reassemble the chunk results into the complete output after resubmission. A chunk that is still too large after the first split must be split again until every piece falls within the size limit.

Batch Expiration During Busy Periods

Batch expiration is when the API does not finish processing a batch or individual items within it before the processing window closes, typically because of high system load. An expired item has not been processed at all. It must be resubmitted from scratch.

Expiration is more likely when a single very large batch is submitted during a high-load period because the API has a greater volume of work to process before reaching your requests. Splitting one large batch into several smaller batches reduces this risk. Smaller batches are lighter loads for the API to absorb and are more likely to complete within the processing window than one very large submission.

| Failure Type | Cause | Correct Response |
| --- | --- | --- |
| Item returned an error | Processing error on that request | Resubmit the item with the same custom_id |
| Item expired | API load prevented processing in time | Resubmit the item, consider splitting the batch |
| Item too large | Request exceeded size limits | Chunk the item and resubmit the chunks |
| Entire batch expired | Extreme API load | Resubmit the batch, split into smaller batches |

Reference

[Batch Processinghttps://docs.claude.com/en/docs/build-with-claude/batch-processing](https://docs.claude.com/en/docs/build-with-claude/batch-processing)

### Submission Frequency and SLA Constraints

An SLA, or Service-Level Agreement, is a promise about when results will be delivered. Honoring an SLA in batch processing requires planning around the full 24-hour processing window, not just the typical completion time. A batch submitted at 11pm with a 9am delivery deadline has only ten hours of headroom. If the batch takes the full 24 hours, the deadline is missed.

Processing Window

The processing window is the period the API takes to complete a batch. Most batches finish in under an hour. However, the guaranteed maximum is 24 hours. Batches expire if processing does not complete within that window. Your submission timing must absorb the worst case, not the typical case.

Batch results are available for retrieval for 29 days after the batch is created. After 29 days, results can no longer be downloaded even if the batch itself is still visible.

Buffer Time

Buffer time is the additional time built into a submission schedule to absorb the full 24-hour processing window and leave room for at least one resubmission before the deadline. A schedule with no buffer has no recovery path when items fail or when processing takes longer than expected.

First-Pass Success Rate

The first-pass success rate is the proportion of items that return a valid result without resubmission. A higher rate means fewer resubmissions and more time to meet the deadline. The Anthropic documentation recommends testing a single request shape with the Messages API before submitting a full batch to avoid validation errors that would cause widespread failures. A 10% failure rate on 100,000 documents is 10,000 resubmissions. The same rate on 100 documents costs almost nothing to fix.

Planning Your Schedule

- Submit early enough that a full 24-hour processing time still meets the deadline.
- Build in a resubmission window. A schedule with no recovery path for failures will breach the SLA when items fail.
- Test a single request with the Messages API before large submissions to catch validation errors early.
- Break very large datasets into multiple batches. A single batch is limited to 100,000 requests or 256 MB, whichever comes first.

| Submission Timing | Risk | Mitigation |
| --- | --- | --- |
| Submitted too close to the deadline | Full 24-hour window breaches SLA | Submit earlier, build in buffer time |
| Large volume with untested prompt | Widespread validation errors, expensive resubmission | Test one request with the Messages API first |
| Single large batch during busy periods | Higher expiration risk | Split into smaller batches |
| No resubmission window in the schedule | Failed items breach the SLA | Always plan for resubmission before submitting |

The table covers the four most common submission mistakes and their fixes. In each case the risk is not just a failed batch but a missed deadline or a resubmission cost that could have been avoided. Submitting early, testing before scaling, splitting large batches, and building in a resubmission window are not optional best practices. They are the minimum requirements for a batch workflow that reliably meets its SLA.

Common Mistakes

- Batching a blocking workflow. There is no latency guarantee.
- Assuming results come back in order instead of matching on custom_id.
- Expecting a tool loop inside a single batch request. This is not supported.
- Resubmitting the whole batch instead of only the failed items.
- Submitting a large volume without testing the prompt on a sample first.
- Not accounting for the full 24-hour window when planning against an SLA.
- Using duplicate custom_id values within a batch.

References

[Batch Processinghttps://docs.claude.com/en/docs/build-with-claude/batch-processing](https://docs.claude.com/en/docs/build-with-claude/batch-processing)[Message Batches Apihttps://www.anthropic.com/news/message-batches-api](https://www.anthropic.com/news/message-batches-api)[Overviewhttps://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview)

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="h-multi-instance-and-multi-pass-review"></a>

## H. Multi-Instance and Multi-Pass Review

Multi-instance and multi-pass review are two complementary patterns that address the predictable weaknesses of a single all-in-one review. Multi-instance review uses separate, independent Claude instances so that generation and review are never done by the same session. Multi-pass review splits a large review into focused passes so that each pass has a narrow, well-defined job. Used together, they produce reviews that are more consistent, more thorough, and harder to fool than any single-instance, single-pass approach.

### Self-Review vs. Independent Review Instance

| Concept | Best Used For | Key Benefit | Common Exam Trap |
| --- | --- | --- | --- |
| Self-review (same session) | Quick sanity checks | Low overhead | Trusted to catch subtle issues it generated |
| Independent review instance | Catching subtle defects in generated output | Fresh context, no generation bias | Overlooked in favor of "review your own work" |

The self-review limitation: A model that just generated an output still holds the reasoning it used to produce it, so it is less likely to question its own decisions in the same session.

### Multi-Pass Review

| Pass Type | Best Used For | Key Benefit | Common Exam Trap |
| --- | --- | --- | --- |
| Per-file local pass | Local bugs and within-file issues | Consistent depth per file | Expected to catch cross-file issues |
| Cross-file integration pass | Data flow and interaction across files | Detects integration defects | Skipped, leaving integration bugs unfound |

Together, the two passes fix the common failure where a single pass gives deep feedback on some files, shallow feedback on others, and even contradicts itself on identical code.

### Confidence-Based Review Routing

- Have the model report a confidence level with each finding.
- Send low-confidence findings to closer review.
- This focuses on limited reviewer time where it is most needed.

WORKED EXAMPLE

```
Phase 1 (per file): For each changed file, review it in isolation for local bugs,
security issues, and error handling.
Output: location, issue, severity, confidence.

Phase 2 (integration): Using a fresh instance, review how the changed files
interact: shared state, data flow, and contract mismatches across files.

Routing: send any finding with confidence below the threshold to human review.
```

What this shows: Phase 1 keeps depth consistent across files, Phase 2 catches the cross-file defects, and confidence routing puts human attention on the least certain findings.

Common Pitfalls

- Trusting same-session self-review to catch subtle defects.
- Running a single pass over many files, which spreads attention too thin.
- Skipping the integration pass, which misses cross-file bugs.
- Requiring agreement across repeated full runs, which can hide real bugs caught only some of the time.

QUICK REFERENCE

- Subtle defects: use an independent instance.
- Many files with inconsistent feedback: use per-file passes plus an integration pass.
- Limited reviewer time: route by confidence.
- Do not rely on a larger context window or on full-run agreement.

EXAM TIPS:

- Remember that an independent instance beats same-session self-review for subtle defects.
- The exam may test scenarios where a single pass over many files gives inconsistent feedback.
- Choose the solution that splits review into per-file passes plus a cross-file integration pass.
- Avoid options relying on a larger context window or agreement across repeated full runs.

References

[Overviewhttps://docs.claude.com/en/docs/agents-and-tools/tool-use/overview](https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview)[Overviewhttps://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview)[Increase Consistencyhttps://docs.claude.com/en/docs/build-with-claude/prompt-engineering/increase-consistency](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/increase-consistency)

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="domain-4-services-appendix"></a>

## Domain 4 Services Appendix

### Claude API

| API Element | What It Is | Why It Matters | EXAM TIP |
| --- | --- | --- | --- |
| tool_use | A content block where the model requests a defined function call, returned with stop_reason tool_use. | The mechanism for actions and structured data extraction. Your code executes client tool calls and returns a tool_result for the next turn. | — |
| tool_choice | The parameter controlling whether and which tool is called. Modes: auto, any, tool, none. | Deterministic control over tool calling. | auto is the default. Do not confuse any with tool. |
| stop_reason | The field indicating why the model stopped (tool_use or end_turn). | Drives the control flow of an agentic loop. | Terminate loops on stop_reason, not on parsing the text. |
| max_tokens | The maximum tokens the model may generate. | Too low a value can truncate output, including a tool call. | A truncated tool call usually means: raise max_tokens and retry. |
| system prompts | Top-level instructions setting role, rules, and output expectations. | Wording here can influence tool selection and behavior. | Keyword-sensitive wording can override good tool descriptions. |

### JSON Schema Field Reference

| Field Type | Behavior |
| --- | --- |
| required | Always present. Forces a value even when absent from the source. |
| optional | May be omitted when not in the source. |
| nullable | May be returned as null. Prevents fabrication. |
| enum | Restricts a value to a defined set. |
| "other" + detail pattern | Another enum option paired with a free-text detail field for extensible categories. |

### Pydantic

- Validates Claude's output against expected types and constraints.
- Surfaces semantic errors that schema-shape enforcement misses.
- On failure, drives a validation-retry loop using the original input, the failed output, and the specific error, when the data exists in the source.

### Message Batches API

| Property | Value |
| --- | --- |
| What it is | Asynchronous processing of many requests together. |
| When to use | Latency-tolerant work: overnight reports, audits, and bulk evaluation. |
| Cost savings | 50% of standard API prices. |
| Processing window | Within 24 hours. Most batches finish in under an hour. |
| custom_id usage | A unique identifier per request. |
| Result correlation | Results are not in input order. Match on custom_id. |
| Failure handling | Resubmit failed items only. Chunk oversized documents. |
| Not for | Latency-sensitive work (no latency guarantee) or multi-turn tool loops. |

### Few-Shot Prompting

- Provide 3 to 5 diverse, relevant, clear examples in `<example>` tags.
- Improves consistency for structured and format-sensitive tasks.
- Demonstrates format and reasoning and handles ambiguous, varied inputs.

### Prompt Chaining

- Break a complex task into a sequence of focused steps, where each step's output feeds the next.
- Improves reliability by giving each step a narrower job, reducing attention dilution.
- Example: review each file individually, then run a separate cross-file integration step.

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="domain-4-prompt-engineering-structured-output-sample-questions"></a>

## Domain 4: Prompt Engineering & Structured Output Sample Questions

Question 1

A company uses an AI review tool to provide feedback on submitted work. Users report that the tool incorrectly flags items as unused or invalid because it does not recognize an indirect usage pattern. The feedback also uses inconsistent formats. Some findings follow a clear structure, while others are written as unstructured paragraphs. The company needs to improve both the accuracy of the review and the consistency of the output format. Which combination of techniques is most effective?

1. Add detailed instructions that explain the indirect usage pattern and specify the exact output format for each finding.
2. Add few-shot examples that show how to correctly handle the indirect usage pattern and demonstrate the exact finding format, including location, issue, severity, and suggested fix.
3. Add a post-processing linter to validate the output format and a separate analysis step to resolve indirect usage before review.
4. Create explicit rules for every possible indirect usage pattern and require all findings to follow a strict JSON output schema.

**Correct Answer:** 2

Explanation:

Few-shot prompting is useful when an AI review tool must learn both what to identify and how to present the result. In this scenario, the tool is making accuracy errors because it does not understand an indirect usage pattern, and it is also producing inconsistent feedback formats. A few-shot prompt can show the model realistic examples of acceptable indirect usage, incorrect findings that should be skipped, and valid findings that should be reported. Anthropic's prompting guidance recommends using examples to improve performance, especially when the task requires consistent judgment or a specific response pattern.

Improving an AI Review Tool: Accuracy and Consistency

Nguồn tham khảo: Claude-Certified-Architect-Foundations-CCAR-F.pdf

The best solution is to provide examples that demonstrate both the review logic and the required output format. For example, one sample can show an item that looks unused but is actually referenced indirectly, so it should not be flagged. Another sample can show a real issue with a properly formatted response that includes location, issue, severity, and suggested fix. This approach gives the model concrete patterns to follow rather than relying only on abstract instructions.

This also improves output consistency because the examples act as a template for the final response. A strict schema or post-processing step can help enforce formatting, but examples help the model understand the intended review behavior before output generation. For review workflows, few-shot examples are often more practical than trying to write exhaustive rules for every possible edge case, especially when the tool must handle varied indirect patterns and still produce predictable findings.

Hence, the correct answer is: **Add few-shot examples that show how to correctly handle the indirect usage pattern and demonstrate the exact finding format, including location, issue, severity, and suggested fix.**

The option that says: *Add detailed instructions that explain the indirect usage pattern and specify the exact output format for each finding* is incorrect because it simply describes the desired behavior without showing concrete examples. Instructions are helpful, but examples are typically stronger when the model must apply a nuanced review pattern and follow a consistent format.

The option that says: *Add a post-processing linter to validate the output format and a separate analysis step to resolve indirect usage before review* is incorrect because it primarily adds external controls after or around the model output. This can help catch formatting problems and improve static analysis, but it does not directly teach the review tool how to reason about the indirect usage pattern and produce the expected response.

The option that says: *Create explicit rules for every possible indirect usage pattern and require all findings to follow a strict JSON output schema* is incorrect because it typically becomes difficult to maintain and may still miss new or unusual patterns. A strict schema can enforce structure, but it does not by itself teach the model when a finding is valid or when an apparent issue should be skipped.

References:

[Claude Prompting Best Practiceshttps://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices#use-examples-effectively](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices#use-examples-effectively)[Increase Consistencyhttps://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/increase-consistency](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/increase-consistency)[Define Toolshttps://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools](https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools)

Question 2

Your classifier labels contract clauses as termination, payment, or liability. It frequently mislabels force majeure clauses as termination because both describe conditions that end obligations. Positive examples alone have not resolved the confusion. What prompt technique most directly tightens the classification boundary?

1. Removing all examples from the prompt to force the model to rely on label definitions rather than pattern-matching prior examples.
2. Adding counter-examples that explicitly show force majeure clauses labeled as incorrect classifications with a brief explanation of why.
3. Increasing the number of positive examples for the termination label to reinforce the correct pattern more strongly.
4. Switching to a longer prompt that describes each label in prose paragraphs rather than using structured examples and definitions.

**Correct Answer:** 2

Explanation:

When a classifier confuses two labels that share surface features, both force majeure and termination clauses describe conditions that end obligations, positive examples cannot resolve the confusion on their own. Positive examples demonstrate what a label looks like; they don't show where it stops. The model fills that gap with inference, and in boundary cases the inference is wrong.

Tightening Classification Boundaries with Counter-Examples

Nguồn tham khảo: Claude-Certified-Architect-Foundations-CCAR-F.pdf

Counter-examples address the boundary directly. They show inputs that resemble the target class but belong elsewhere, paired with a short rationale that names the distinguishing feature. Anthropic's prompting best practices recommend that examples be relevant, diverse, and structured, and explicitly call out diversity as covering edge cases so the model doesn't pick up unintended patterns — which is precisely the failure mode here. Wrapping each case in `<example>` tags (and the full set in `<examples>`) is the recommended structure.

Hence, the correct answer is: **Adding counter-examples that explicitly show force majeure clauses labeled as incorrect classifications with a brief explanation of why.**

The option that says: *Removing all examples from the prompt to force the model to rely on label definitions rather than pattern-matching prior examples* is incorrect. Removing examples typically degrades classification accuracy across all inputs, not just boundary cases. Examples are the most effective mechanism for demonstrating classification behavior. Prose definitions alone are less precise, and removing examples eliminates the annotated demonstrations the model needs to distinguish overlapping labels.

The option that says: *Increasing the number of positive examples for the termination label to reinforce the correct pattern more strongly* is incorrect because the model already handles clear termination clauses correctly. The failure simply occurs at the boundary between termination and other labels, a boundary that more positive examples of the correct class cannot define. Only counter-examples showing what termination is not can tighten that boundary.

The option that says: *Switching to a longer prompt that describes each label in prose paragraphs rather than using structured examples and definitions* is incorrect because prose descriptions add length without adding the annotated demonstrations that make boundaries concrete. A longer definition of termination does not show the model where termination ends and force majeure begins. Counter-examples with rationales achieve that precision; prose paragraphs do not.

References:

[Claude Prompting Best Practiceshttps://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)[Prompt Engineeringhttps://claudecertifications.com/claude-certified-architect/domains/prompt-engineering](https://claudecertifications.com/claude-certified-architect/domains/prompt-engineering)

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="ngu-n-tham-kh-o"></a>

## Nguồn tham khảo

*All links reference official Anthropic documentation.*

Prompt Engineering Overview

[Overviewhttps://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview)[Be Clear And Directhttps://docs.claude.com/en/docs/build-with-claude/prompt-engineering/be-clear-and-direct](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/be-clear-and-direct)[Multishot Promptinghttps://docs.claude.com/en/docs/build-with-claude/prompt-engineering/multishot-prompting](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/multishot-prompting)

Tool Use with Claude

[Overviewhttps://docs.claude.com/en/docs/agents-and-tools/tool-use/overview](https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview)[Implement Tool Usehttps://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use](https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use)

Structured Output

[Structured Outputshttps://docs.claude.com/en/docs/build-with-claude/structured-outputs](https://docs.claude.com/en/docs/build-with-claude/structured-outputs)

Batch Processing

[Batch Processinghttps://docs.claude.com/en/docs/build-with-claude/batch-processing](https://docs.claude.com/en/docs/build-with-claude/batch-processing)

Introducing the Message Batches API

[Message Batches Apihttps://www.anthropic.com/news/message-batches-api](https://www.anthropic.com/news/message-batches-api)

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="d5-context-management-reliability"></a>

# D5 — Context Management & Reliability

> Source: [https://www.nvnhan.wiki/#/ccarf/docs](https://www.nvnhan.wiki/#/ccarf/docs)
> Exported from the rendered documentation by `Tool2/scrape_docs.py`.

## Table of contents

1. [A. Foundations of Context Management and Reliability](#a-foundations-of-context-management-and-reliability)
2. [B. Preserving Critical Information Across Long Interactions](#b-preserving-critical-information-across-long-interactions)
3. [C. Escalation and Ambiguity Resolution Patterns](#c-escalation-and-ambiguity-resolution-patterns)
4. [D. Error Propagation Across Multi-Agent Systems](#d-error-propagation-across-multi-agent-systems)
5. [E. Context Management in Large Codebase Exploration](#e-context-management-in-large-codebase-exploration)
6. [F. Human Review Workflows and Confidence Calibration](#f-human-review-workflows-and-confidence-calibration)
7. [G. Information Provenance in Multi-Source Synthesis](#g-information-provenance-in-multi-source-synthesis)
8. [Worked Examples Across Domain 5](#worked-examples-across-domain-5)
9. [Domain 5 Services Appendix](#domain-5-services-appendix)
10. [Domain 5: Context Management & Reliability Sample Questions](#domain-5-context-management-reliability-sample-questions)
11. [Additional Exam Guidance for Domain 5](#additional-exam-guidance-for-domain-5)
12. [Nguồn tham khảo](#ngu-n-tham-kh-o)

---

<a id="a-foundations-of-context-management-and-reliability"></a>

## A. Foundations of Context Management and Reliability

Every Claude application works inside a context window, which is the model's working memory for a single request. It holds the system prompt, the conversation so far, every tool call and its output, and every file that has been read. The window is large but finite, so what goes into it has to be managed.

As a session runs, content piles up, and a fuller window does not stay as reliable as an empty one. Understanding why is the foundation for every technique in this domain, because most reliability problems in long-running agents trace back to how context was managed.

### What is the Context Window?

It is everything the model can see at once when it generates its next response.

- It includes the system prompt, the conversation history, every tool call and result, and every file read.
- It has a fixed size, so adding more of one thing leaves less room for another.
- Current Claude models offer very large windows, with up to one million tokens available, but the window is still finite.

The context window is not a simple list where every item gets equal attention. As the window grows, the model must distribute its attention across more content. Items at the start and end of the window tend to receive stronger attention than items in the middle, a pattern known as the "lost in the middle" effect, which is covered in detail in section B.

### Context Accumulation across a Session

Context grows with every turn, and tool-heavy work grows it fastest.

- Each user message, model reply, tool call, and tool result is added to the window.
- Tool results accumulate disproportionately: a few file reads or searches can fill a large share of the window with content you no longer need.
- Left unmanaged, old material crowds out the information the model needs right now.

Consider an agent investigating a customer billing issue. It might verify the customer identity (tool call + result), look up the order (tool call + result), check the refund policy (tool call + result), query the payment processor (tool call + result), and check the shipping status (tool call + result). After five tool calls, the window may contain thousands of tokens of tool output, much of which is no longer needed for the current reasoning step.

### Token Budgets

Treat the window as a budget you spend, not as free space.

- Every token of the system prompt, history, tool output, and file content spends part of the budget.
- When the budget runs low, you must clear, summarize, or offload content, or the session fails.
- System prompts and tool definitions are fixed costs that consume budget on every turn. The more tools you define, the less room remains for conversation and results.

### Reliability and Context Growth

A fuller window is a less reliable window. This is the single most important idea in the section.

- **Context rot:** as the window fills, attention spreads thin, and the model is more likely to miss or confuse details.
- Important facts placed in the middle of a long context are the easiest to lose, a pattern covered in section B.
- Good context management is therefore a reliability technique, not just a cost technique.

The practical implication is that a session that worked perfectly with five tool calls may start making mistakes at fifteen, not because the model changed but because the context grew. Errors in long sessions should always be investigated as potential context management problems before concluding the prompt or the model is at fault.

### When Context Rot Begins

Context rot does not start at a specific token count. It is a gradual degradation that becomes more noticeable as the window fills. The practical signs are:

- **At 20-30% utilization:** Performance is generally stable. The system prompt, tool definitions, and conversation history all fit comfortably.
- **At 50-70% utilization:** The model may start missing details from the middle of the context. Position-dependent recall issues appear.
- **At 80%+ utilization:** Performance degrades noticeably. The model may contradict earlier statements, miss instructions, or produce less coherent responses.
- **At 95%+ utilization:** The system is about to fail. Compaction or clearing is urgent.

These are approximate ranges, not hard thresholds. The key insight is that context management should happen proactively, before the window is full, not reactively after problems appear.

### The Tools for Managing Context

The Tools for Managing Context

Nguồn tham khảo: Claude-Certified-Architect-Foundations-CCAR-F.pdf

Three current capabilities work together to keep the window healthy.

| Tool | What it does | When to reach for it | Common Exam Trap |
| --- | --- | --- | --- |
| Context editing | Automatically clears stale tool results from the window | Tool-heavy work where old results are no longer needed | Assumed to also remember what it cleared |
| Compaction | Summarizes the conversation and continues on the summary | Long single sessions approaching the limit | Expected to keep every detail; summaries lose some |
| Memory tool | Stores information in files outside the window | Facts that must survive clearing or span sessions | Skipped, so cleared information is lost for good |

Context editing and compaction free up space, while the memory tool preserves what matters before space is freed, so the three are usually combined.

How they work together in practice: Before compacting a session, save durable facts (customer ID, open issue, constraints) to the memory tool. Then compact the conversation to free space. The compacted summary gives Claude the gist, and the memory tool supplies the exact values that the summary might have rounded off or dropped.

### Multi-Turn Context Growth Rates

Different types of work consume context at different rates. Understanding the growth rate helps you plan when to clear or compact.

| Work Type | Context Growth Rate | When to Manage |
| --- | --- | --- |
| Text-only conversation | Low (hundreds of tokens per turn) | After many turns or when the session feels long |
| Tool-light tasks | Moderate (1-2K tokens per tool call) | After 10-15 tool calls |
| File-heavy exploration | High (1-5K tokens per file read) | After every few file reads |
| Search-heavy research | Very high (2-10K tokens per search) | After every search cluster |

### Signs That Context Needs Management

A few symptoms tell you the window is overloaded before it fails outright.

- The model repeats itself or forgets an instruction it was following earlier.
- Answers get slower, vaguer, or less accurate as the session goes on.
- Tool output dominates the window, and the actual task description is buried.
- You are near the token limit, which forces a clarification or a summary.
- The model starts contradicting earlier statements or "forgetting" decisions it already made.

### Prompt Caching and Stable Context

Prompt caching lowers the cost and latency of reusing stable context, though it does not shrink the window itself.

- Cache stable prefixes, such as the system prompt and reference documents, so they are not reprocessed every turn.
- Put stable content first and changing content last, so the cached prefix stays valid across turns.
- Caching reduces cost and latency, but it is not a substitute for clearing or summarizing once the window fills.

### The Stateless API and What It Means for Reliability

The Claude API is stateless. Each request is independent. The model does not remember the previous request unless you include the conversation history in the current request.

This has three important implications for reliability:

1. **You control what the model remembers.** If you omit conversation history, the model starts fresh. If you include it, the model has continuity. This is a feature, not a limitation, it means you can curate what the model sees.
2. **Clearing is your decision, not the model's.** The model cannot decide to forget old content. You must explicitly manage what stays in the conversation and what gets cleared, compacted, or moved to external storage.
3. **Re-grounding is your responsibility.** After compaction, the model's understanding of the conversation is based on the summary you provided. If the summary dropped a critical detail, the model does not know it was ever there. Re-injecting case facts after compaction is therefore a reliability requirement, not a convenience.

### The Token Budget Analogy

One of the most useful mental models for the exam is to think of the context window as a financial budget. Every token of content you add is a dollar you spend.

- The system prompt is your fixed monthly rent, it is spent on every request.
- Tool definitions are your utility bills, they scale with the number of tools you connect.
- Conversation history is your discretionary spending, it grows with each turn.
- Tool results are your biggest variable expense, a single file read or search result can cost thousands of tokens.
- The memory tool is your savings account, information stored outside the window that you can access when needed.

When the budget runs low, you have three choices: clear stale spending (context editing), compress your spending history into a summary (compaction), or move funds to savings (memory tool). You cannot simply get a bigger budget and ignore the management problem, because context rot still applies, a fuller window is a less reliable window, regardless of how large it is.

Common Mistakes

- Treating the context window as free space instead of a finite budget.
- Letting tool results pile up until they crowd out the task.
- Assuming a bigger window removes the need to manage context when context rot still applies.
- Clearing content without first saving anything important to memory.
- Ignoring the accumulation of tool definitions across many connected MCP servers.

★

**EXAM TIP:** The exam may test scenarios where reliability drops in a long session, which points to context growth, not the prompt. Choose solutions that clear stale content and preserve critical facts in memory. Avoid assuming a larger context window removes the need to manage context.

Resources

[Context Managementhttps://www.anthropic.com/news/context-management](https://www.anthropic.com/news/context-management)[Context Editinghttps://docs.claude.com/en/docs/build-with-claude/context-editing](https://docs.claude.com/en/docs/build-with-claude/context-editing)[Memory Toolhttps://docs.claude.com/en/docs/agents-and-tools/tool-use/memory-tool](https://docs.claude.com/en/docs/agents-and-tools/tool-use/memory-tool)[Prompt Cachinghttps://docs.claude.com/en/docs/build-with-claude/prompt-caching](https://docs.claude.com/en/docs/build-with-claude/prompt-caching)

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="b-preserving-critical-information-across-long-interactions"></a>

## B. Preserving Critical Information Across Long Interactions

In a long interaction, the goal is to keep the facts that matter available to the model while letting go of the chatter that does not. This section covers the failure modes that lose important information and the patterns that protect it.

### Progressive Summarization and Its Risks

Summarizing is useful, but summarizing the same conversation again and again is lossy.

- Each summary pass can drop a detail that later turns out to matter, and once dropped, it is gone.
- A specific value, such as a date or an identifier, is easy to lose in a summary that keeps only the gist.
- Protect specific values by storing them as durable facts rather than trusting them to survive each summary.
- The risk compounds with each pass: the first summary loses 5% of details, the second loses 5% of what remains, and so on. After several passes, critical specifics have been replaced with generalities.

★

**EXAM TIP:** When a question describes a specific value (date, ID, constraint) that was present early in a conversation but is missing after several summarization passes, the answer points to a durable facts block, not to better summarization instructions.

### The "Lost in the Middle" Effect

Models attend most reliably to the start and end of a long context and least reliably to the middle.

- **Position matters:** a key instruction buried in the middle of a long input is the most likely to be missed.
- Place the most important facts and instructions near the beginning or the end, not in the middle of a long block.
- This effect is well-documented in research on long-context language models and is confirmed by Anthropic's own long-context guidance.
- The effect gets stronger as the total context length increases. In a short prompt, position barely matters. In a 100,000-token prompt, position matters a great deal.

### Durable Facts versus Passing History

| Concept | Best Used For | Key Benefit | Common Exam Trap |
| --- | --- | --- | --- |
| Durable facts | Stable details needed for the whole task | Always available, never summarized away | Left in ordinary history and lost in a summary |
| Passing history | Turn-by-turn chatter and resolved steps | Can be trimmed or cleared safely | Kept in full, crowding out durable facts |

**The Case Facts Block:** keep durable facts in one labeled block that you carry forward intact so they are never at the mercy of a summary. This is the most reliable way to anchor the details a task depends on.

**Context Layers for Multiple Issues:** when one conversation covers several separate issues, keep a separate context layer for each so facts from one issue do not bleed into another.

WORKED EXAMPLE

```
[CASE FACTS] (carry forward verbatim, do not summarize)
customer_id: 4471
plan: Business (annual)
open_issue: refund for duplicate charge on 2026-05-02
constraint: refunds over 100 require manager approval
[END CASE FACTS]
```

What this shows: the durable facts live in one clearly marked block that is carried forward unchanged. Even after the rest of the history is summarized or cleared, these values stay exact.

### Tool Output Accumulation

Tool results are the fastest way to fill a window, so keep them lean.

- Trim verbose tool output before it accumulates, keeping only the fields you actually need.
- Use context editing to clear old tool results once they are no longer needed.
- When a tool returns a large JSON response with dozens of fields, extract the relevant fields and discard the rest before the result enters the conversation history.
- A single file read can consume thousands of tokens. If you only need one function from a 500-line file, extract that function rather than loading the entire file.

### Position-Aware Input Ordering

Order input so the model reads the important parts where it attends best.

- Put key findings and instructions up front with clear section headers, or at the very end.
- Long reference material goes in the middle, where exact recall matters least.
- The case facts block belongs at the top of each new turn, where attention is strongest.

### Structured Data versus Verbose Content between Agents

When one agent feeds another, send compact structured data, not raw reasoning.

- Have an upstream agent return structured data with key facts and citations instead of long prose, so a downstream agent with a small budget is not flooded.
- Structured handoffs preserve the facts that matter while spending far fewer tokens.
- A research agent that returns a 2,000-word prose analysis consumes far more downstream context than one that returns a 200-token structured summary with key findings, citations, and confidence scores.

### Retention versus Retrieval

Retention versus Retrieval

Nguồn tham khảo: Claude-Certified-Architect-Foundations-CCAR-F.pdf

You do not have to keep everything in the window. Keep a little, and store the rest where it can be fetched on demand.

| Concept | What it is | Key Benefit | Common Exam Trap |
| --- | --- | --- | --- |
| Retention | Keeping information in the window | Instant access, no lookup | Fills the window and triggers context rot |
| Retrieval | Storing information externally and fetching when needed | Keeps the active window small | Adds a lookup step and depends on good recall |

### Re-grounding after Compaction

A summary or a clear, exact detail can fade, so re-establish them before continuing.

- Re-inject the case facts block after compaction so durable values stay exact.
- Treat a summary as a starting point, not the full record, and restore anything the task depends on.

Common Mistakes

- Trusting specific values to survive repeated summarization instead of pinning them as durable facts.
- Burying a key instruction in the middle of a long input.
- Passing verbose agent-to-agent reasoning when structured data would do.
- Letting raw tool output accumulate unchecked.
- Forgetting to re-inject case facts after compaction.

Resources

[Long Context Tipshttps://docs.claude.com/en/docs/build-with-claude/prompt-engineering/long-context-tips](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/long-context-tips)[Context Editinghttps://docs.claude.com/en/docs/build-with-claude/context-editing](https://docs.claude.com/en/docs/build-with-claude/context-editing)[Context Managementhttps://www.anthropic.com/news/context-management](https://www.anthropic.com/news/context-management)

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="c-escalation-and-ambiguity-resolution-patterns"></a>

## C. Escalation and Ambiguity Resolution Patterns

Escalation is handing a task to a human, and doing it at the right moment is a reliability skill. Escalate too late and you frustrate the user, escalate on the wrong signal and you waste human time. This section covers what should trigger an escalation and how to handle requests that are unclear.

### What Triggers an Escalation?

Escalate on the substance of the situation, not on how the message feels.

**Customer Requests for a Human:** a direct request for a human is an immediate trigger. Honor it rather than trying to resolve the issue first.

**Policy Gaps and Stalled Progress:** escalate when the request falls outside policy, requires an authority the system does not have, or progress has genuinely stalled.

**Authority Limits:** escalate when the action requires an approval level the agent does not have, such as a refund above a threshold or a system change that requires human authorization.

### Immediate Escalation versus Offered Resolution

| Concept | Best Used For | Key Benefit | Common Exam Trap |
| --- | --- | --- | --- |
| Immediate escalation | A direct request for a human, or a hard policy limit | Respects the user and avoids friction | Delayed by trying to resolve first |
| Offered resolution | A frustrated user who has not asked for a human | May solve the issue faster than a handoff | Used to override an explicit request for a human |

When a user explicitly asks for a human, escalate right away. When a user is upset but has not asked, you can acknowledge the frustration and offer to help, then escalate if they still want a human.

### The Unreliability of Sentiment and Self-Rated Confidence

Two tempting signals are poor triggers, and the exam tests this directly.

- **Sentiment is unreliable:** a calm message can hide a hard problem, and a frustrated one can have an easy fix. Tone alone should not decide escalation.
- **Self-rated confidence is unreliable:** the model can be confidently wrong, so a high self-reported score is not proof the answer is right. Conversely, a low confidence score does not mean the answer is wrong, it may just indicate ambiguity in the source.
- Trigger on concrete conditions, such as an explicit request, a policy limit, or repeated failure, instead.

★

**EXAM TIP:** When a question offers sentiment analysis or self-rated confidence as the escalation trigger, these are distractors. The exam consistently tests that escalation should be driven by concrete conditions: explicit human requests, policy gaps, authority limits, or repeated failure.

### Ambiguity and Clarification

When a request has more than one reasonable reading, ask rather than guess.

- If a query matches multiple records or interpretations, ask a short clarifying question instead of picking one.
- Guessing on ambiguity produces confident but possibly wrong action, which is worse than a brief question.
- The clarifying question should be specific: "I found two accounts matching that description, one under john@work.com and one under john@home.com. Which one?" is better than "Could you clarify?"

### Multi-Step Escalation Paths

Not all escalations are binary. In production systems, there are often multiple levels of escalation, each appropriate for different situations.

| Level | Trigger | Destination | Example |
| --- | --- | --- | --- |
| Level 0 | Agent handles autonomously | No escalation | Standard refund within policy limits |
| Level 1 | Agent needs human approval | Frontline support agent | Refund above auto-approval threshold |
| Level 2 | Frontline cannot resolve | Specialist or team lead | Complex billing dispute spanning multiple months |
| Level 3 | Specialist cannot resolve | Manager or policy exception | Request requires a policy exception not covered by any existing rule |

The agent should route to the correct level directly when possible, rather than always starting at Level 1 and letting humans re-route.

WORKED EXAMPLE

```
Escalation Logic
if user explicitly asks for a human:
    escalate now  # honor the request immediately
elif request is outside policy OR needs an authority we lack:
    escalate  # policy gap
elif same step has failed repeatedly with no progress:
    escalate  # stalled progress
elif request matches more than one record:
    ask one clarifying question  # resolve ambiguity, do not guess
else:
    continue resolving
```

What this shows: escalation is driven by concrete conditions, an explicit request, a policy gap, or stalled progress, and ambiguity is handled by asking, not by sentiment or a confidence score.

### Escalation with Context Handoff

When you do escalate, hand the human a warm start, not a blank slate. A well-structured escalation handoff includes five components:

1. **Reason for escalation:** Why the agent cannot continue (explicit human request, policy gap, authority limit, repeated failure).
2. **Case facts:** The durable facts from the case facts block (customer ID, account type, specific dates, amounts, constraints).
3. **Steps already taken:** A list of what the agent already tried and the results.
4. **Current state:** Where the issue stands right now — what is resolved, what is pending, what is blocked.
5. **Recommended next action:** The agent's assessment of what the human should do next.

### Repeated Failure and Loop Detection

An agent that retries the same failing step forever is a reliability failure of its own.

- Track attempts per step, and after a set number of failures on the same step, stop and escalate.
- Detecting a loop early avoids burning tokens and time on an action that cannot succeed.

Common Mistakes

- Trying to resolve the issue after a user has explicitly asked for a human.
- Escalating on tone alone or refusing to escalate because the tone seems calm.
- Treating a high self-rated confidence as proof of correctness.
- Guessing an interpretation when a one-line question would remove the ambiguity.
- Escalating without context, forcing the human to start from scratch.

References

[Be Clear And Directhttps://docs.claude.com/en/docs/build-with-claude/prompt-engineering/be-clear-and-direct](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/be-clear-and-direct)[Overviewhttps://docs.claude.com/en/docs/agents-and-tools/tool-use/overview](https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview)

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="d-error-propagation-across-multi-agent-systems"></a>

## D. Error Propagation Across Multi-Agent Systems

In a multi-agent pipeline, errors in one agent affect every agent downstream. If a data-gathering agent fails silently, the synthesis agent produces a confident report with a hole in it, and nobody knows. This section is about making errors visible, categorized, and recoverable, so the system either fixes the problem locally or reports the gap honestly.

### What a Useful Error Carries

A generic error like "something went wrong" tells the coordinator nothing. A useful error tells the coordinator what happened, why, and whether it is worth retrying.

| Field | Purpose | Example |
| --- | --- | --- |
| category | What type of failure | "access_failure", "timeout", "validation_error" |
| description | What specifically happened | "Database connection timed out after 30s" |
| retryable | Whether the same call might succeed on retry | true / false |
| source | Which agent or tool produced the error | "data_agent.query_billing" |

★

**EXAM TIP:** When a question describes a coordinator that cannot determine what went wrong because the error message is too vague, the answer is structured errors with category, description, and retryability. Generic error messages like "tool failed" are always the wrong pattern.

### Access Failure versus Valid Empty Result

This distinction is critical, and the exam tests it directly.

- An **access failure** means the tool could not reach its source, a timeout, a permission error, or a network failure. The absence of data is not meaningful because no query was successfully executed.
- A **valid empty result** means the tool successfully queried its source and found nothing. The absence of data is itself information, there genuinely is no matching record.
- If the system treats both the same way, a downstream agent might report "no data exists" when the truth is "we could not check."

| Situation | What Happened | Correct Response | Wrong Response |
| --- | --- | --- | --- |
| API returned 500 | Access failure | Return structured error with retryable: true | Return empty result |
| API returned 200 with zero records | Valid empty result | Return empty result with success status | Return error |
| API timed out | Access failure | Return structured error with retryable: true | Return empty result |
| API returned 200 with data | Successful result | Return the data | N/A |

### Error Categorization for Recovery Decisions

Different error categories require different recovery strategies. The coordinator's recovery logic should branch on the category, not on parsing the description text.

| Error Category | Typical Cause | Recovery Strategy |
| --- | --- | --- |
| timeout | Network latency, slow backend | Retry with backoff |
| rate_limited | Too many requests | Wait and retry after delay |
| permission_denied | Missing credentials or scope | Escalate — cannot retry |
| not_found | Resource does not exist | Valid result — not an error |
| validation_error | Malformed request | Fix the request and retry |
| service_unavailable | Backend is down | Try alternative source or annotate gap |

### Anti-Patterns in Error Handling

Two anti-patterns dominate the exam scenarios.

**Silent suppression:** An agent hits an error, catches it, and continues as if everything succeeded. The final report looks complete, but an entire data source is missing. This is the most dangerous anti-pattern because the output is confident and wrong, with no signal that anything failed.

**Over-reaction:** An agent hits one recoverable error and terminates the entire workflow. This wastes the progress of all other agents that succeeded. A timeout on one API call should not destroy a report that is 90% complete.

### Local Recovery before Escalation

The correct pattern is to try to recover locally first and only escalate what cannot be fixed.

- If a tool call times out, retry it once or twice before reporting failure.
- If one source is unavailable, check whether an alternative source can provide the same information.
- If recovery fails, annotate the specific gap in the output rather than hiding it or killing the workflow.

### Coverage Gap Annotation

When part of a report cannot be completed, say so explicitly in the output.

WORKED EXAMPLE

```
{
  "billing_analysis": {
    "status": "complete",
    "findings": [...]
  },
  "shipping_analysis": {
    "status": "incomplete",
    "reason": "Shipping API timed out after 3 retries",
    "recommendation": "Retry manually or check shipping status directly"
  }
}
```

What this shows: the report is honest about what it could and could not complete. A consumer of this report knows exactly which sections are reliable and which need follow-up.

### Propagation Chains and Cascading Failures

In a multi-agent pipeline, errors do not stay local. A failure in one agent changes what the next agent receives, which changes what the agent after that receives, and so on. This is an error propagation chain.

**The cascade pattern:** Agent A fails → Agent B receives bad input → Agent B produces wrong output → Agent C synthesizes the wrong output into a confident final report. At no point in this chain did the system flag an issue, because each agent handled its input as if it were correct.

**Breaking the chain:** The structured error pattern breaks the chain by making failures visible at each handoff. When Agent A fails and returns a structured error instead of an empty result, Agent B can decide to skip that input, try an alternative, or annotate a coverage gap.

### Partial Success and Coverage Honesty

Most real-world tasks can partially succeed. A report that covers 4 out of 5 data sources is more useful than no report at all, as long as the reader knows which source is missing.

**The coverage honesty principle:** When a task cannot be fully completed, report what was completed, what was not, and why. A partial result with honest annotations is more valuable than either a complete-looking result with hidden gaps or a total failure.

Common Mistakes

- Returning an empty result when the tool actually failed to reach its source.
- Suppressing errors silently and producing confident but incomplete output.
- Terminating the entire workflow over a single recoverable error.
- Using generic error messages that give the coordinator no basis for recovery decisions.
- Not including retryability information, so the coordinator does not know whether to retry or skip.

References

[Implement Tool Usehttps://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use](https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use)[Overviewhttps://docs.claude.com/en/docs/agents-and-tools/tool-use/overview](https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview)

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="e-context-management-in-large-codebase-exploration"></a>

## E. Context Management in Large Codebase Exploration

Exploring a large codebase with Claude Code is one of the most context-intensive tasks in production use. Each file read adds hundreds or thousands of tokens. A 15-file subsystem at 500 tokens per file consumes 7,500 tokens of raw code alone, and the model's reasoning about each file adds more. Without deliberate context management, the session degrades long before the exploration is complete.

### Key Terms

- **Scratchpad file** is a persistent file on disk where Claude records key findings during long exploration sessions.
- **Subagent delegation** is spawning a focused subagent to read and analyze specific files, returning only a summary to the main session.
- **Exploration state** is the current understanding of the codebase: what has been read, what was found, what remains to investigate.
- **Progressive discovery** is the pattern of exploring a codebase in stages, where each stage's findings guide the next stage's focus.

### The Problem: File Reads Fill the Window

In codebase exploration, the primary context consumers are file contents loaded by the Read tool.

- A single file read of a 200-line file might consume 800-1,200 tokens.
- An exploration that reads 20 files can consume 16,000-24,000 tokens of raw code.
- Add the model's reasoning about each file, and the total doubles.
- Once the window is full of old file contents, the model starts losing track of earlier findings.

### Subagent Delegation for Verbose Reads

The most effective pattern for large codebase exploration is delegating verbose file reads to subagents.

- The main session holds the exploration strategy, the scratchpad, and the high-level understanding.
- Subagents are spawned to read specific files or file groups and return structured summaries.
- Only the summaries enter the main session's context, not the raw file contents.
- This keeps the main session's context clean and focused on reasoning, not on raw code.

| Pattern | Main Session Context | Subagent Context | What Returns |
| --- | --- | --- | --- |
| Direct read | Full file contents (expensive) | N/A | N/A |
| Delegated read | Summary only (cheap) | Full file contents | Structured findings |

### When to Read Directly vs. Delegate

Not every file read needs a subagent. The decision depends on file size, how many files you need, and where you are in the session.

| Situation | Best Approach | Reason |
| --- | --- | --- |
| Small file (<100 lines), early in session | Read directly | Low cost, plenty of room |
| Large file (500+ lines) | Delegate to subagent | Returns summary, saves context |
| Multiple related files | Delegate one subagent for the group | Subagent can cross-reference within its own context |
| Targeted lookup (one function, one class) | Grep first, then read the specific section | No need to load the entire file |
| Late in a long session (window >60% full) | Always delegate | Context is too precious to spend on raw code |

### The Scratchpad Pattern

For long exploration sessions (30+ minutes), persist findings to an external file.

- Have Claude create and maintain a scratchpad file (e.g., `exploration-notes.md`) on disk.
- Record key findings, architectural decisions, class names, and important patterns as they are discovered.
- Re-read the scratchpad when starting a new phase of exploration to restore context.
- The scratchpad survives compaction, clearing, and even session boundaries.

### The Exploration Journal Pattern

For complex, multi-session codebase explorations, the scratchpad evolves into an exploration journal — a structured document that tracks not just findings but also questions, hypotheses, and decisions.

**Findings:** Verified facts about the codebase (class names, design patterns, data flows). These are facts the exploration has confirmed.

**Questions:** Open questions that need investigation. Each question should note which files or areas might hold the answer.

**Hypotheses:** Educated guesses about how the system works that have not yet been verified. Marking something as a hypothesis prevents it from being treated as a confirmed finding.

**Decisions:** Architectural conclusions reached during exploration, with the reasoning that supports them. These are the outputs the exploration was started to produce.

WORKED EXAMPLE

```
Context Budget for a 15-File Subsystem

Direct reads (all 15 files): ~23,000 tokens of raw code + reasoning. Window fills quickly.

With subagent delegation: ~9,250 tokens of summaries + reasoning. Window stays clean.

Savings: Subagent delegation reduced main session context consumption by approximately 60%, leaving ample room for continued reasoning and additional investigation.
```

### Progressive Discovery vs. Exhaustive Reading

Progressive discovery is the exploration pattern where each stage's findings guide the next stage's focus. It is the opposite of exhaustive reading, which tries to load and understand everything at once.

Progressive discovery works because:

- The first stage (entry points, base classes) tells you where to look next.
- Each subsequent stage is more targeted, reading only what the previous stage identified as relevant.
- Irrelevant files are never loaded, saving context for what matters.

Exhaustive reading fails because:

- Loading 15 files consumes most of the context window before any reasoning begins.
- The model has no room to think about what it read.
- Files loaded early fade from attention by the time later files are read.

Common Mistakes

- Reading every file into the main session, filling the window with raw code.
- Not persisting findings, so they are lost when the context is compacted.
- Exploring without a clear goal, reading files that turn out to be irrelevant.
- Not using Grep and Glob for targeted lookups when full file reads are unnecessary.

★

**EXAM TIP:** When a question describes an agent exploring a large codebase that starts losing earlier findings as the session progresses, the answer is persisting findings to a scratchpad or memory file and delegating verbose reads to subagents. Not switching to a larger model, not clearing context periodically, and not pre-generating file summaries.

References

[Sub Agentshttps://code.claude.com/docs/en/sub-agents](https://code.claude.com/docs/en/sub-agents)[How Claude Code Workshttps://code.claude.com/docs/en/how-claude-code-works](https://code.claude.com/docs/en/how-claude-code-works)[Best Practiceshttps://docs.anthropic.com/en/docs/claude-code/best-practices](https://docs.anthropic.com/en/docs/claude-code/best-practices)

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="f-human-review-workflows-and-confidence-calibration"></a>

## F. Human Review Workflows and Confidence Calibration

### Key Terms

- **Confidence threshold** is the score below which output is routed to human review instead of being accepted automatically.
- **Stratified sampling** is measuring accuracy within each segment (document type, category, source) rather than across the whole dataset.
- **Aggregate accuracy** is the single overall accuracy number, which can hide a segment that is failing badly.
- **Human-in-the-loop** is a workflow where a human reviews and approves output before it enters the downstream system.

### When to Route to Human Review

Route to human review when the system's output is uncertain, novel, or high-stakes.

- **Low confidence:** When the model signals uncertainty about an extraction or a decision, route it for human verification.
- **Novel input:** When the input type has not been seen before (a new document format, a new customer segment), the system has no basis for calibration.
- **High stakes:** When the cost of an error is high (financial transactions, medical records, legal documents), human review is a safety net regardless of confidence.
- **Conflicting sources:** When the system detects contradictory information from multiple sources, a human can resolve what the model cannot.

### Setting Confidence Thresholds

A confidence threshold defines the boundary between automatic acceptance and human review.

- Set the threshold based on the cost of errors in your domain. Financial applications need higher thresholds than internal summaries.
- The threshold is not permanent. Start conservative (routing more to humans), measure the accuracy of what passes automatically, and adjust.
- Track the volume of records routed to review. If the review queue is overwhelmed, the threshold may be too strict, or the model may genuinely be struggling with that input type.

WORKED EXAMPLE

Confidence Threshold Calibration: An invoice extraction system starts with a confidence threshold of 0.85. After one month of production data: Records above 0.85: 92% accuracy (acceptable). Records below 0.85: 64% accuracy (confirming the threshold catches weak extractions). Review queue volume: 15% of total records (manageable). The threshold is working: it routes uncertain records to humans while keeping the queue manageable. If accuracy above the threshold dropped, the threshold would need to rise.

### The Hidden Weakness Problem

A single accuracy number can hide a failing segment.

- An extraction system reports 96% overall accuracy. The team is satisfied. But accuracy by document type tells a different story:
- Standard invoices: 99%
- Scanned paper invoices: 79%
- Handwritten receipts: 68%
- The 96% aggregate is dominated by the high-volume standard invoices. The rare types are failing badly, but the overall number masks it.

### Stratified Sampling

The solution is to measure accuracy within each segment, not just across the whole dataset.

- Segment by document type, source, category, or any dimension where performance might vary.
- Measure each segment separately. A 72% on handwritten receipts is actionable, you can add examples, adjust the schema, or route all handwritten receipts to review.
- Random sampling alone does not solve this because rare types are underrepresented. Stratified sampling ensures each type is measured on its own.

| Sampling Method | What It Measures | What It Misses |
| --- | --- | --- |
| Random sampling | Overall accuracy across the dataset | Weak segments hidden by strong segments |
| Stratified sampling | Accuracy within each segment | Nothing, if segments are defined well |

WORKED EXAMPLE

Stratified Accuracy Reveals Hidden Weakness: Standard PDF invoices (80% of volume): 98% accuracy. Scanned paper invoices (12% of volume): 79% accuracy. Handwritten receipts (8% of volume): 68% accuracy. Aggregate: 94% — looks acceptable.

What the aggregate hides: customers who submit handwritten receipts experience extraction errors on one-third of their documents. Stratified sampling surfaces the exact problem areas.

### Review Queue Management

Routing low-confidence output to human review creates a queue that must be managed to stay useful.

- **Queue volume monitoring:** If more than 25% of output goes to review, the threshold is too strict or the model is struggling with the input type.
- **Review turnaround time:** If the review queue grows faster than reviewers can process it, either adjust the threshold or add reviewers.
- **Feedback loop:** Use review outcomes to improve the system. If reviewers consistently approve a specific pattern that scores low, the pattern might be safe to auto-accept.
- **Reviewer agreement:** Measure whether reviewers agree with each other. Low inter-rater agreement means the task is inherently ambiguous, and the review process itself may need better guidelines.

Common Mistakes

- Trusting a single aggregate accuracy number without looking at segments.
- Setting a confidence threshold once and never adjusting it.
- Routing everything to human review, which defeats the purpose of automation.
- Using random sampling for a dataset with rare but important edge cases.

★

**EXAM TIP:** When a question describes high overall accuracy but a specific document type or category that is failing, the answer is stratified sampling by segment, not increasing the overall sample size or trusting the aggregate number.

References

[Reduce Hallucinationshttps://docs.claude.com/en/docs/build-with-claude/prompt-engineering/reduce-hallucinations](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/reduce-hallucinations)[Structured Outputshttps://docs.claude.com/en/docs/build-with-claude/structured-outputs](https://docs.claude.com/en/docs/build-with-claude/structured-outputs)

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="g-information-provenance-in-multi-source-synthesis"></a>

## G. Information Provenance in Multi-Source Synthesis

When a system gathers information from multiple sources and synthesizes it into one output, the question becomes, "Where did each fact come from?" Provenance is the answer. Without it, the synthesis is unverifiable, conflicts are invisible, and errors are untraceable.

### Key Terms

- **Provenance** is the record of where each piece of information came from.
- **Claim-source mapping** is the link between a specific claim in the output and the source(s) that support it.
- **Source conflict** is when two or more sources provide different values for the same fact.
- **Publication date** is the date a source was published, which can resolve conflicts when one source simply updates another.
- **Attribution** is marking each claim with its source so a reader can verify it.
- **Invented consensus** is when the model silently resolves a conflict by picking one value or averaging, presenting the result as if all sources agree.

### Why Provenance Matters

Without provenance, a synthesis cannot be verified, updated, or trusted.

- A report that says "revenue grew 12% last quarter" is useful. A report that says "revenue grew 12% last quarter (Q3 2026 earnings report, p. 4)" is verifiable.
- When a source turns out to be wrong, provenance tells you which claims in the synthesis are affected.
- When a downstream consumer needs to update a figure, provenance tells them where the original came from.

### Claim-Source Mappings

Every factual claim in a synthesis should link back to the source that supports it.

- Use structured output with a claims array where each entry carries the claim text, the source identifier, and optionally a page number or section reference.
- If a claim is supported by multiple sources, list all of them.
- If a claim is not supported by any source, it should not appear in the synthesis — or it should be flagged as the model's own inference.

WORKED EXAMPLE

```
{
  "claims": [
    {
      "text": "The global AI market is projected to reach $500B by 2028",
      "sources": [
        {
          "id": "gartner_2026",
          "title": "AI Market Forecast 2026",
          "date": "2026-03-15",
          "page": 12
        }
      ]
    },
    {
      "text": "Enterprise AI adoption reached 72% in 2025",
      "sources": [
        { "id": "mckinsey_survey", "date": "2025-11-20" },
        { "id": "idc_report", "date": "2026-01-10" }
      ],
      "note": "IDC reports 74% — slight difference likely due to sample timing"
    }
  ]
}
```

What this shows: each claim carries its sources, and a conflict between two sources is annotated rather than silently resolved.

### Handling Source Conflicts

When two sources disagree, the system should not silently pick one.

**Using Publication Dates:** A 2026 source that updates a 2024 figure is not a conflict but rather a correction. Check dates first.

**Annotating Genuine Conflicts:** When two contemporaneous sources disagree, present both values with their sources and let the consumer decide.

**Never Average:** Averaging two conflicting figures produces a number that no source reported. It looks precise and is entirely fabricated.

| Conflict Pattern | Resolution | Anti-Pattern |
| --- | --- | --- |
| Newer source updates older | Use the newer value, note the update | Use the older value |
| Two contemporaneous sources disagree | Annotate both values with sources | Pick one silently |
| One source has higher authority | Note the authority difference | Average the values |
| Sources use different definitions | Note the definitional difference | Treat them as the same metric |

### The Source Authority Hierarchy

When evaluating conflicting sources, not all sources carry equal weight.

**Primary sources** are the original producers of information: official reports, direct measurements, and first-party data. These carry the most weight.

**Secondary sources** interpret or aggregate primary sources: news articles, analyst reports, and review papers. They are useful but can introduce errors through interpretation.

**Tertiary sources** compile information from secondary sources: encyclopedias, directories, and aggregator sites. They are convenient but furthest from the original data.

| Source Type | Authority | Examples | Use When |
| --- | --- | --- | --- |
| Primary | Highest | SEC filings, official reports, first-party data | Available and current |
| Secondary | Medium | News articles, analyst reports | Primary not available or for context |
| Tertiary | Lowest | Aggregator sites, encyclopedias | Quick reference only |

### Multi-Agent Provenance Preservation

Multi-Agent Lost Provenance

Nguồn tham khảo: Claude-Certified-Architect-Foundations-CCAR-F.pdf

In a coordinator-subagent architecture, provenance must survive the handoff between agents.

**The source laundering problem:** Agent A extracts a claim from Source X with full attribution. Agent A passes the claim to the coordinator. The Coordinator passes it to Agent B for synthesis. By the time Agent B includes it in the final report, the attribution to Source X has been dropped. The report presents the claim as a general fact with no source.

**The fix:** Every inter-agent handoff must preserve the claim-source mapping. Subagent outputs should use a structured format with source attribution fields. The coordinator should merge subagent outputs while preserving attributions, not summarizing them into prose. The final synthesis should trace each claim back to the original source, not just to "the search agent."

### Anti-Patterns in Provenance

**Dropping attribution entirely:** A synthesis that presents facts without sources is unverifiable.

**Invented consensus:** When the model encounters a conflict, it silently picks the "most reasonable" value and presents it as the agreed-upon figure. The output reads as if all sources agree, when they do not.

**Source laundering:** When one agent passes a fact to another without attribution, and the downstream agent presents it as its own finding.

Common Mistakes

- Dropping source attribution in agent-to-agent handoffs.
- Silently resolving conflicts by picking one value or averaging.
- Presenting model inferences as if they were sourced claims.
- Not checking publication dates before treating a disagreement as a conflict.

★

**EXAM TIP:** When a question describes a report where two sources give different figures for the same metric and the report shows only one number with no attribution — the answer is to preserve claim-source mappings, annotate the conflict, and use dates to interpret it. Never average, never silently pick one, never drop the metric entirely.

References

[Structured Outputshttps://docs.claude.com/en/docs/build-with-claude/structured-outputs](https://docs.claude.com/en/docs/build-with-claude/structured-outputs)[Reduce Hallucinationshttps://docs.claude.com/en/docs/build-with-claude/prompt-engineering/reduce-hallucinations](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/reduce-hallucinations)

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="worked-examples-across-domain-5"></a>

## Worked Examples Across Domain 5

### Worked Example: Error Propagation in a Research Pipeline

A multi-agent research system has a search agent, an analysis agent, and a synthesis agent. The search agent queries three sources. Source A returns data, Source B returns a valid empty result, and Source C times out.

**Wrong pattern:** Search agent returns combined results from A and B only, with no mention of C. Synthesis agent produces a report that appears to cover all sources. The report is missing Source C's data with no indication.

**Correct pattern:** Search agent returns results from A, notes that B had no matching data (valid empty), and reports that C failed with a structured error (timeout, retryable). Synthesis agent includes A's data, notes B had no data, and annotates that Source C could not be reached. The final report is honest about coverage.

### Worked Example: Escalation with Warm Handoff

A customer contacts support about a billing dispute. The agent verifies the customer, looks up the order, and checks the refund policy. The refund amount exceeds the auto-approval limit, requiring human authorization.

**Wrong pattern:** The agent says "I'm transferring you to a human agent" with no context. The human agent asks the customer to repeat everything.

**Correct pattern:** The agent escalates with a structured handoff:

```
{
  "reason": "refund_exceeds_auto_approval_limit",
  "case_facts": {
    "customer_id": "C-4471",
    "order_id": "O-88421",
    "charge_date": "2026-05-02",
    "refund_amount": 247.50,
    "auto_approval_limit": 100.00
  },
  "steps_taken": [
    "Customer identity verified via email match",
    "Order O-88421 confirmed as duplicate charge",
    "Refund policy checked: amount exceeds $100 auto-approval"
  ],
  "recommended_action": "Approve refund of $247.50 for duplicate charge"
}
```

The human agent receives the durable facts, the investigation history, and a recommendation — the conversation continues instead of restarting.

### Worked Example: Stratified Accuracy Audit

An invoice extraction system processes three document types. The team measures overall accuracy at 94% and considers the system production-ready.

| Document Type | Volume | Accuracy | Contribution to Aggregate |
| --- | --- | --- | --- |
| Standard PDF invoices | 80% | 98% | Dominates the aggregate |
| Scanned paper invoices | 12% | 79% | Hidden by low volume |
| Handwritten receipts | 8% | 68% | Completely hidden |
| Aggregate | 100% | 94% | Looks acceptable |

What the aggregate hides: Customers who submit handwritten receipts experience extraction errors on one-third of their documents. The 94% looks healthy, but two segments are failing badly.

What stratified sampling reveals: Each type measured separately surfaces the exact problem areas. The team can now add few-shot examples for scanned invoices, create a dedicated extraction prompt for handwritten receipts, or route both types to human review until the model improves.

### Worked Example: Context Budget Planning

A developer needs to understand a caching subsystem with 15 files totaling approximately 8,000 lines of code.

Direct reads (all 15 files loaded into main session):

| Component | Estimated Tokens | Notes |
| --- | --- | --- |
| System prompt + tool definitions | ~3,000 | Fixed cost, every turn |
| 15 files at ~800 tokens each | ~12,000 | All loaded directly |
| Model reasoning per file | ~6,000 | ~400 tokens of reasoning per file |
| Conversation history | ~2,000 | Growing with each turn |
| Total | ~23,000 | Exceeds comfortable range |

With subagent delegation:

| Component | Estimated Tokens | Notes |
| --- | --- | --- |
| System prompt + tool definitions | ~3,000 | Fixed cost |
| 15 subagent summaries at ~150 tokens each | ~2,250 | Only summaries enter main context |
| Model reasoning on summaries | ~2,000 | Reasoning on compact data |
| Conversation history + scratchpad reads | ~2,000 | Includes re-reading scratchpad |
| Total | ~9,250 | Well within comfortable range |

Savings: Subagent delegation reduced main session context consumption by approximately 60%.

### Worked Example: Temporal Conflict Resolution

A research agent finds two sources reporting different values for the same metric:

- Source A (published March 2024): "Global cloud spending reached $480 billion in 2023."
- Source B (published January 2026): "Global cloud spending reached $520 billion in 2023, revised upward from earlier estimates."

**Wrong pattern:** Average the two figures to get $500 billion. This number appears in neither source and is fabricated.

**Wrong pattern:** Pick Source A because it was published closer to 2023. Source B explicitly states it is a revision.

**Correct pattern:** Use Source B's revised figure ($520 billion) and annotate: "Revised upward from $480B (Source A, March 2024) to $520B (Source B, January 2026). Source B explicitly notes the revision." This preserves provenance, explains the discrepancy, and gives the reader full context.

### Worked Example: Exploration Journal

A developer is exploring a caching subsystem. After two hours of investigation, the exploration journal on disk contains:

Findings:

- CacheManager is the base class for all cache implementations (src/cache/manager.py)
- Redis is the primary cache backend; PostgreSQL is used as fallback
- Invalidation uses a write-through pattern with TTL-based expiry
- Cache keys follow the pattern: {entity_type}:{entity_id}:{field}

Questions:

- How does cache stampede prevention work? (check src/cache/locks.py)
- What happens when Redis is unavailable? (check fallback logic in manager.py)
- Are cache keys namespaced per tenant? (check multi-tenant config)

What this shows: The journal separates confirmed findings from hypotheses, tracks open questions with pointers to where answers might be, and records architectural decisions with their evidence. This survives compaction and session boundaries.

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="domain-5-services-appendix"></a>

## Domain 5 Services Appendix

### Context Management Reference

| Tool | What It Does | When to Use |
| --- | --- | --- |
| Context editing | Clears stale tool results from the window | Tool-heavy sessions with accumulating results |
| Compaction | Summarizes conversation and continues on summary | Long sessions approaching the token limit |
| Memory tool | Stores facts in files outside the window | Facts that must survive clearing or span sessions |
| Prompt caching | Caches stable prefixes for cost/latency savings | Repeated requests with the same system prompt |

### Escalation Trigger Reference

| Trigger | Action | Reliability |
| --- | --- | --- |
| Explicit human request | Escalate immediately | High: Always honor |
| Policy gap or authority limit | Escalate | High: Concrete condition |
| Repeated failure on same step | Escalate | High: Loop detection |
| Ambiguous request | Ask clarifying question | High: Resolves ambiguity |
| Sentiment (frustration) | Do not escalate on this alone | Low: Unreliable signal |
| Self-rated confidence | Do not use as trigger | Low: Poorly calibrated |

### Error Response Structure

| Field | Purpose | Example Values |
| --- | --- | --- |
| category | Type of failure | "access_failure", "timeout", "validation_error", "permission_denied" |
| description | What happened | "Database connection timed out after 30s" |
| retryable | Whether retry might succeed | true / false |
| source | Which component failed | "data_agent.query_billing" |

### Provenance Output Structure

| Field | Purpose |
| --- | --- |
| claims[].text | The factual claim |
| claims[].sources[] | Source(s) supporting the claim |
| claims[].sources[].id | Unique source identifier |
| claims[].sources[].date | Publication date |
| claims[].note | Conflict annotation, if applicable |

### Codebase Exploration Reference

| Pattern | Main Context Cost | When to Use |
| --- | --- | --- |
| Direct file read | High (full file contents) | Small files, quick lookups |
| Subagent delegation | Low (summary only) | Large files, multi-file exploration |
| Grep search | Minimal (matching lines only) | Finding specific patterns |
| Glob search | Minimal (file paths only) | Mapping directory structure |
| Scratchpad file | None (on disk) | Persisting findings across compaction |

### Source Authority Hierarchy

| Source Type | Authority | Examples |
| --- | --- | --- |
| Primary | Highest | SEC filings, official reports, first-party data |
| Secondary | Medium | News articles, analyst reports |
| Tertiary | Lowest | Aggregator sites, encyclopedias |

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="domain-5-context-management-reliability-sample-questions"></a>

## Domain 5: Context Management & Reliability Sample Questions

Question 1

An AI Engineer is responsible for managing a production Claude system that needs to maintain high availability. The system comprises multiple microservices that interact with one another, and it's crucial to track every request, process, and error for debugging, monitoring, and auditing. As part of your workflow, the engineer must ensure that logging is configured properly to capture all necessary events without overwhelming the system with excessive log data. Which of the following is the most effective approach to implement comprehensive logging in your production Claude system?

1. Log every request, response, and error in great detail, including sensitive data such as user passwords, for full transparency.
2. Implement logging at key points within each microservice, ensure that only relevant information is logged, and sensitive data is omitted.
3. Rely on basic error logs and only log the highest-level system failures to reduce log volume.
4. Implement logging at the microservice level, but store logs locally on each instance to avoid central aggregation for performance reasons.

**Correct Answer:** 2

Explanation:

Production AI systems that use multiple microservices require structured and efficient logging to support monitoring, debugging, auditing, and incident response. Since requests and processes often span multiple services, logging must provide sufficient visibility to trace system activity while preserving performance and security. Effective logging strategies, therefore, focus on capturing meaningful operational events without exposing sensitive information or generating unnecessary log volume.

Implementing logging at key points in each microservice, while ensuring only relevant information is recorded, is considered the most effective approach. This method allows engineers to track requests, monitor workflows, and diagnose failures efficiently while maintaining system performance. Omitting sensitive data, such as passwords, authentication tokens, or personal information, is also essential, as secure logging practices help reduce privacy and security risks. By focusing only on meaningful operational details, organizations can maintain useful observability without overwhelming storage and monitoring systems.

Centralized Structured Logging Across Microservices

Nguồn tham khảo: Claude-Certified-Architect-Foundations-CCAR-F.pdf

Modern distributed systems typically rely on centralized and structured logging practices to improve reliability and operational awareness. Logging relevant events across microservices supports troubleshooting, auditing, and performance analysis while still maintaining compliance with security and privacy standards. A balanced logging strategy helps organizations achieve visibility into system behavior while avoiding excessive or unsafe data collection.

Hence, the correct answer is: **Implement logging at key points within each microservice, ensure that only relevant information is logged, and sensitive data is omitted.**

The option that says: *Log every request, response, and error in great detail, including sensitive data such as user passwords, for full transparency* is incorrect because logging highly sensitive information such as passwords can create serious security and compliance risks. Comprehensive logging should primarily focus on operational visibility while protecting confidential data.

The option that says: *Rely on basic error logs and only log the highest-level system failures to reduce log volume* is incorrect because relying only on basic high-level error logs may simply provide insufficient detail for debugging distributed microservice interactions. Effective monitoring typically requires visibility into important service-level events and workflows.

The option that says: *Implement logging at the microservice level, but store logs locally on each instance to avoid central aggregation for performance reasons* is incorrect because storing logs only locally can reduce centralized visibility and make troubleshooting across multiple services more difficult. Modern production systems usually benefit from centralized or aggregated logging for easier analysis and monitoring.

References:

[Overviewhttps://platform.claude.com/docs/en/build-with-claude/overview](https://platform.claude.com/docs/en/build-with-claude/overview)[Audit Logging Protocolhttps://mcpmarket.com/tools/skills/audit-logging-protocol](https://mcpmarket.com/tools/skills/audit-logging-protocol)[Securityhttps://code.claude.com/docs/en/security](https://code.claude.com/docs/en/security)

Question 2

A financial services company is deploying a Claude-based platform for processing sensitive customer requests and internal workflows. To meet strict auditing and regulatory requirements, the organization needs to trace all user interactions, workflow executions, tool invocations, and administrative actions. A recent compliance review revealed missing critical records, making it difficult to reconstruct several workflow activities. The architecture team must implement a solution to enhance traceability, accountability, and audit readiness. Which is the most effective approach for compliance logging in this Claude-based system?

1. Log all actions with timestamps to create a complete audit trail of system activity and workflow execution.
2. Store only error-related events to reduce storage costs and minimize operational overhead.
3. Retain logs temporarily in local application memory and export only during incidents.
4. Log workflow summaries at the end of each session instead of recording individual operations and events.

**Correct Answer:** 1

Explanation:

Compliance-focused systems require detailed audit trails that accurately record system activity over time. Logging all actions with timestamps provides a chronological record of user operations, tool executions, workflow events, configuration changes, and administrative activities. These records enable organizations to reconstruct events during investigations, validate compliance controls, and demonstrate accountability during audits.

Timestamped logs are especially important in distributed Claude architectures where workflows may span multiple services, agents, and external tools. Precise timestamps help correlate events across systems, identify the sequence of operations, and support forensic analysis when investigating failures or suspicious behavior. Comprehensive logging also improves operational visibility and incident response capabilities.

Timestamped Compliance Audit Trail

Nguồn tham khảo: Claude-Certified-Architect-Foundations-CCAR-F.pdf

In regulated environments, incomplete logging creates gaps in traceability that can lead to failed audits, operational risk, and compliance violations. Centralized, timestamped audit records help organizations maintain security governance, support regulatory reporting, and preserve historical evidence of system activity. Effective compliance logging, therefore, requires both completeness and accurate event timing.

Hence, the correct answer is: **Log all actions with timestamps to create a complete audit trail of system activity and workflow execution.**

The option that says: *Store only error-related events to reduce storage costs and minimize operational overhead* is incorrect because compliance audits typically require complete operational traceability rather than only failure-related events.

The option that says: *Retain logs temporarily in local application memory and export only during incidents* is incorrect because temporary in-memory storage simply increases the risk of losing important audit records during crashes or system failures.

The option that says: *Log workflow summaries at the end of each session instead of recording individual operations and events* is incorrect because summary-level logging primarily lacks the detailed event granularity needed for compliance investigations and forensic analysis.

References:

[Best Practiceshttps://code.claude.com/docs/en/best-practices](https://code.claude.com/docs/en/best-practices)[Overviewhttps://platform.claude.com/docs/en/agents-and-tools/tool-use/overview](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview)

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="additional-exam-guidance-for-domain-5"></a>

## Additional Exam Guidance for Domain 5

### How Domain 5 Connects to Other Domains

Domain 5 concepts appear throughout the exam, not just in questions labeled "Context Management." Understanding these connections helps you recognize Domain 5 patterns in scenarios that seem to belong to other domains.

**Connection to Domain 1 (Agentic Architecture):** Long-running agentic loops accumulate context with every tool call. The `max_turns` and `max_budget_usd` flags from Domain 3 are cost controls, but context management is the reliability control. An agent that runs for 20 turns without clearing stale tool results will start making mistakes, that is a Domain 5 problem even though the agent was designed in Domain 1.

**Connection to Domain 2 (Tool Design):** Tool results that return verbose, unfiltered data are a Domain 5 problem. A well-designed tool that returns only the fields the agent needs is both a Domain 2 design choice and a Domain 5 reliability measure.

**Connection to Domain 3 (Claude Code):** Scratchpad files and sub-agent delegation for codebase exploration are Claude Code features (Domain 3) that solve context management problems (Domain 5). Session management, resume, fork, and clear, are Domain 3 mechanisms that address Domain 5 concerns.

**Connection to Domain 4 (Prompt Engineering):** The lost-in-the-middle effect is both a prompt engineering concern (where to place instructions) and a context management concern (how position affects reliability). Few-shot examples consume context budget, creating a tension between prompt quality and available context.

### Common Exam Patterns in Domain 5

The exam uses several recurring patterns for Domain 5 questions:

**The "session gets worse over time" pattern:** A session starts accurate and becomes unreliable as it runs longer. The answer almost always involves context management things such as clearing stale content, persisting important facts, or delegating to subagents.

**The "missing data looks like absent data" pattern:** A downstream agent treats an access failure as a valid empty result. The answer is always structured error responses that distinguish failure from absence.

**The "aggregate hides the weak spot" pattern:** Overall accuracy looks good, but a specific segment is failing. The answer is stratified sampling by segment.

**The "explicit request overridden" pattern:** A user asks for a human, and the system tries to resolve the issue first. The answer is always immediate escalation.

**The "sentiment as trigger" pattern:** The system escalates based on frustration or de-escalates based on a calm tone. The answer is always that sentiment is an unreliable trigger, use concrete conditions instead.

**The "conflicting sources" pattern:** Two sources disagree, and the report shows one number without attribution. The answer is always to preserve claim-source mappings, annotate the conflict, and use dates to interpret.

### Decision Framework for Domain 5 Questions

When you encounter a Domain 5 question, use this framework:

1. Is the problem about context growing too large? → Context management: clear, compact, or delegate.
2. Is the problem about losing specific facts? → Durable facts block, memory tool, or scratchpad.
3. Is the problem about when to involve a human? → Check for concrete triggers: explicit request, policy gap, repeated failure.
4. Is the problem about an error in a pipeline? → Structured errors with category, description, and retryability.
5. Is the problem about accuracy measurement? → Stratified sampling by segment.
6. Is the problem about conflicting information? → Provenance: claim-source mappings with dates.

### Key Distinctions the Exam Tests

| Concept A | Concept B | The Distinction |
| --- | --- | --- |
| Context editing | Compaction | Editing clears specific content; compaction summarizes everything |
| Durable facts | Passing history | Durable facts are pinned and never summarized; history can be trimmed |
| Access failure | Valid empty result | Failure means the query did not execute; empty means it executed and found nothing |
| Immediate escalation | Offered resolution | Explicit human request triggers immediate; frustrated but no request allows offering help first |
| Sentiment | Concrete trigger | Sentiment is unreliable; concrete conditions (policy gap, repeated failure) are reliable |
| Aggregate accuracy | Stratified accuracy | Aggregate can hide a failing segment; stratified reveals it |
| Retention | Retrieval | Retention keeps data in the window; retrieval stores it externally and fetches on demand |
| Silent suppression | Coverage annotation | Suppression hides the gap; annotation honestly reports it |
| Invented consensus | Annotated conflict | Consensus fabricates agreement; annotation preserves the disagreement |

### Worked Example: Full Domain 5 Scenario

**Scenario:** A customer support agent has been running for 30 minutes, handling a complex billing dispute. The session includes 12 tool calls (account lookup, order history, payment records, refund policy, etc.). The customer mentions a specific charge date (May 2, 2026) early in the conversation. After the agent compacts the conversation to free space, it refers to "the disputed charge" but cannot recall the specific date. The customer then says: "I've explained this three times already, just let me talk to someone."

Domain 5 analysis:

1. **Context management:** The charge date was a durable fact that should have been pinned in a case facts block before compaction. The compaction summary dropped the specific date.
2. **Escalation:** The customer's message "just let me talk to someone" is an explicit request for a human. This triggers immediate escalation, not another attempt to resolve.
3. **Warm handoff:** The escalation should include the case facts (customer ID, disputed charge date, amount), what tools were already used, and what was found.

**Correct architecture:** Before compaction, save `{customer_id, charge_date: "2026-05-02", amount, policy_result}` to the memory tool. After compaction, re-inject these facts. When the customer requests a human, escalate immediately with the case facts, attempted steps, and a one-line summary.

**Wrong patterns:** Asking the customer to repeat the date (frustrating). Trying to resolve after the explicit human request (overrides the request). Compacting without saving the case facts (loses the date). Escalating without context (forces the human to start cold).

---

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_

---

<a id="ngu-n-tham-kh-o"></a>

## Nguồn tham khảo

*All links verified against the current Anthropic documentation.*

Context Management

[Context Managementhttps://www.anthropic.com/news/context-management](https://www.anthropic.com/news/context-management)

Context Editing

[Context Editinghttps://docs.claude.com/en/docs/build-with-claude/context-editing](https://docs.claude.com/en/docs/build-with-claude/context-editing)

Memory Tool

[Memory Toolhttps://docs.claude.com/en/docs/agents-and-tools/tool-use/memory-tool](https://docs.claude.com/en/docs/agents-and-tools/tool-use/memory-tool)

Long-Context Tips

[Long Context Tipshttps://docs.claude.com/en/docs/build-with-claude/prompt-engineering/long-context-tips](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/long-context-tips)

Reduce Hallucinations

[Reduce Hallucinationshttps://docs.claude.com/en/docs/build-with-claude/prompt-engineering/reduce-hallucinations](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/reduce-hallucinations)

Tool Use Overview

[Overviewhttps://docs.claude.com/en/docs/agents-and-tools/tool-use/overview](https://docs.claude.com/en/docs/agents-and-tools/tool-use/overview)

Implement Tool Use

[Implement Tool Usehttps://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use](https://docs.claude.com/en/docs/agents-and-tools/tool-use/implement-tool-use)

Structured Outputs

[Structured Outputshttps://docs.claude.com/en/docs/build-with-claude/structured-outputs](https://docs.claude.com/en/docs/build-with-claude/structured-outputs)

Prompt Caching

[Prompt Cachinghttps://docs.claude.com/en/docs/build-with-claude/prompt-caching](https://docs.claude.com/en/docs/build-with-claude/prompt-caching)

Be Clear and Direct

[Be Clear And Directhttps://docs.claude.com/en/docs/build-with-claude/prompt-engineering/be-clear-and-direct](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/be-clear-and-direct)

How Claude Code Works

[How Claude Code Workshttps://code.claude.com/docs/en/how-claude-code-works](https://code.claude.com/docs/en/how-claude-code-works)

Sub-Agents

[Sub Agentshttps://code.claude.com/docs/en/sub-agents](https://code.claude.com/docs/en/sub-agents)

Claude Code Best Practices

[Best Practiceshttps://docs.anthropic.com/en/docs/claude-code/best-practices](https://docs.anthropic.com/en/docs/claude-code/best-practices)

CCA-F Official Exam Page

[CCAFhttps://clau.de/CCAF](https://clau.de/CCAF)

_Section URL: https://www.nvnhan.wiki/#/ccarf/docs_
