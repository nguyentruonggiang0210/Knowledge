# CCAR-F Practice — Questions and answer choices

Tổng số câu: **162**.

> Nội dung được đối chiếu theo bộ ảnh `images/001.png`–`images/162.png`. Option có trạng thái màu xanh là đáp án đúng.

## Câu 001

### Câu hỏi

A developer asks the agent to investigate why a specific API endpoint intermittently returns 500 responses. The codebase has 200+ files and the developer doesn't know which components are involved. The agent must trace the error through routing, middleware, business logic, and database layers.

What task decomposition approach would be most effective?

### Các lựa chọn trả lời

1. Run parallel worker agents on the file system of four layers, then combine their findings to reconstruct the complete error path.
2. Have the agent first create a comprehensive plan mapping all code paths through documented components before beginning any exploration or code reading.
3. Have the agent dynamically generate investigation subtasks based on what it discovers at each step, adapting its exploration plan as new information about the error path emerges.
4. Define a fixed sequence of investigation steps upfront—grep for error handlers, then examine middleware, then check database queries, then examine middleware-woven code.

### Đáp án đúng

**3. Have the agent dynamically generate investigation subtasks based on what it discovers at each step, adapting its exploration plan as new information about the error path emerges.**

## Câu 002

### Câu hỏi

Your agent needs to insert a new helper function into the middle of a 150-line utility module, between two existing functions. The Edit tool fails because its old_string parameter cannot find unique text to match – the file has repetitive docstrings, variable names, and structural patterns.

What's the most reliable way to complete this insertion?

### Các lựa chọn trả lời

1. Use Read to load the file, add the function at the appropriate location, then Write the updated file
2. Use Bash to append the function definition to the end of the file using heredoc syntax
3. Use Edit's replace_all parameter to target a common pattern and embed the new function in the replacement text
4. Use Edit with an extremely long old_string capturing 30+ lines of context to guarantee uniqueness

### Đáp án đúng

**1. Use Read to load the file, add the function at the appropriate location, then Write the updated file**

## Câu 003

### Câu hỏi

An engineer used Claude Code yesterday to investigate authentication flows in a legacy monolith, building up significant context over a 2-hour session. Today she wants to continue that specific investigation. She's worked on three other codebases since then and knows the session was named "auth-deep-dive".

How should she resume?

### Các lựa chọn trả lời

1. Use --resume auth-deep-dive to load that specific session by name
2. Use --session-id with the UUID from yesterday's session transcript file
3. Use --continue to pick up where the most recent conversation left off
4. Start fresh and re-read the same files

### Đáp án đúng

**1. Use --resume auth-deep-dive to load that specific session by name**

## Câu 004

### Câu hỏi

An engineer's exploration subagent spent 30 minutes analyzing a legacy payment system, reading 47 files and documenting data flows. The session was interrupted when the engineer's connection dropped. While away, a teammate merged a PR that renamed two utility functions. The engineer wants to continue the same exploration.

What's the most effective approach?

### Các lựa chọn trả lời

1. Resume the subagent from its previous transcript and inform it about the renamed functions.
2. Launch a fresh subagent with a summary of prior findings.
3. Resume the subagent from its previous transcript without mentioning the changes–the architecture understanding remains valid.
4. Launch a fresh subagent and include the prior transcript in the initial prompt for context.

### Đáp án đúng

**1. Resume the subagent from its previous transcript and inform it about the renamed functions.**

## Câu 005

### Câu hỏi

Your agent has spent 25 minutes exploring a game engine's rendering subsystem–reading shader code, buffer management, and frame synchronization logic. An engineer now asks it to understand how the physics engine integrates with rendering for collision debug overlays. You notice recent responses reference "typical rendering patterns" rather than the specific VulkanPipeline and FrameGraph classes it discovered earlier.

What's the most effective approach?

### Các lựa chọn trả lời

1. Continue in the current context with more targeted prompts referencing the specific classes by name.
2. Spawn a sub-agent to explore physics independently, then manually synthesize its findings with the rendering knowledge accumulated in the main conversation.
3. Summarize key rendering findings, then spawn a sub-agent for physics exploration with that summary in its initial context.
4. Use /clear to reset context completely, then start fresh with physics exploration using file paths from the project's CLAUDE.md.

### Đáp án đúng

**3. Summarize key rendering findings, then spawn a sub-agent for physics exploration with that summary in its initial context.**

## Câu 006

### Câu hỏi

An engineer asks the agent to find all callers of a function before removing it. The function is defined in a core library but is also exposed through wrapper modules that rename the function for domain-specific use (e.g., calculateTax in the library becomes computeOrderTax in the orders module).

What exploration strategy will most reliably identify all callers?

### Các lựa chọn trả lời

1. Use Grep to find all files that import from the library or wrapper modules, then read each file to check whether it uses the function.
2. Search for the function name in project documentation to understand intended usage patterns and navigate to documented integration points.
3. Read the library and wrapper modules to identify all exposed names for the function, then Grep for each name across the codebase.
4. Use Grep to search for the function's original name across the codebase.

### Đáp án đúng

**3. Read the library and wrapper modules to identify all exposed names for the function, then Grep for each name across the codebase.**

## Câu 007

### Câu hỏi

During testing, you observe that in extended exploration sessions (30+ minutes), the agent starts giving inconsistent answers about code structure it discussed earlier. Engineers report having to repeat context about modules they've already explored.

What's the most effective approach to address this?

### Các lựa chọn trả lời

1. Have the agent maintain a scratchpad file that records key findings, referencing it for subsequent questions.
2. Implement automatic context clearing every 15 minutes to ensure the agent starts with fresh, uncontaminated context.
3. Switch to a higher-capacity model tier to provide more context window space for accumulated exploration data.
4. Create summaries of all source files before exploration begins, loading only these compressed representations into context.

### Đáp án đúng

**1. Have the agent maintain a scratchpad file that records key findings, referencing it for subsequent questions.**

## Câu 008

### Câu hỏi

After adding an MCP server with specialized code refactoring tools (extract_function, rename_variable, inline_function), you notice the agent still uses basic text manipulation via Write and Bash sed commands for refactoring tasks. The MCP server is connected and working. Examining the configuration, you find each MCP tool has a minimal description like "extract_function: extracts a function from code."

What's the most effective way to improve adoption of the MCP refactoring tools?

### Các lựa chọn trả lời

1. Remove the Write tool from the agent's configuration for refactoring sessions so it must use the MCP tools for code modifications.
2. Implement a request classifier that detects refactoring intent and automatically routes those requests to the MCP server before the agent processes them.
3. Enhance the MCP tool descriptions to explain when each tool is preferable to text manipulation and clarify expected inputs and outputs.
4. Accept this as expected behavior since simpler tools like sed are more predictable than specialized refactoring tools.

### Đáp án đúng

**3. Enhance the MCP tool descriptions to explain when each tool is preferable to text manipulation and clarify expected inputs and outputs.**

## Câu 009

### Câu hỏi

An engineer asks the agent to investigate error handling in a legacy payment processing module spanning 15 files. After reading the first 8 files, the agent's responses are becoming noticeably less accurate—it's forgetting previously discovered code patterns and hasn't yet located all test files or traced the complete data flow.

What's the most effective approach to complete this investigation?

### Các lựa chọn trả lời

1. Close the current context with /clear and start fresh, re-reading only the most critical files.
2. Use Grep to search for specific function names across remaining files, reducing the content loaded into context.
3. Document a summary of findings so far in a file, then start fresh with a new context using that summary as reference.
4. Spawn a subagent to explore the remaining files, providing a summary of discovered patterns as its initial context.

### Đáp án đúng

**4. Spawn a subagent to explore the remaining files, providing a summary of discovered patterns as its initial context.**

## Câu 010

### Câu hỏi

An engineer used the agent yesterday to analyze a legacy authentication module, identifying two distinct refactoring approaches: extracting a microservice versus refactoring in-place. Today, they want to explore both approaches in depth–having the agent propose specific code changes for each–before deciding which to implement.

What's the most effective way to structure this exploration?

### Các lựa chọn trả lời

1. Resume yesterday's session and explore both approaches sequentially within the same conversation thread.
2. Use fork_session to create two branches from yesterday's analysis, exploring one approach in each fork.
3. Start two fresh sessions, manually providing a summary of yesterday's analysis findings to establish context.
4. Resume yesterday's session to explore the first approach, then start a new session for the second, manually recreating the original context.

### Đáp án đúng

**2. Use fork_session to create two branches from yesterday's analysis, exploring one approach in each fork.**

## Câu 011

### Câu hỏi

Your agent has analyzed a complex service module–reading 23 source files, tracing request flows, and identifying error handling patterns. A developer wants to compare two testing strategies before committing to one: end-to-end tests with mocked external services vs. snapshot tests capturing expected outputs. They need to independently develop both approaches to evaluate trade-offs.

How should you manage the sessions?

### Các lựa chọn trả lời

1. Start two fresh sessions, having each re-read the relevant source files before beginning.
2. Resume the analysis session with fork_session enabled, creating a separate branch for each testing strategy.
3. Continue in the original session, developing end-to-end tests first, then snapshot tests sequentially.
4. Export the analysis session's key findings to a file, then create two new sessions that reference this file.

### Đáp án đúng

**2. Resume the analysis session with fork_session enabled, creating a separate branch for each testing strategy.**

## Câu 012

### Câu hỏi

Your codebase exploration tool stores session IDs to allow engineers to continue investigations across work sessions. An engineer spent an hour yesterday analyzing a legacy authentication module, building context about its architecture and dependencies. They want to continue today. The session ID is valid, but version control shows 3 of the 12 files the agent previously read were modified overnight by a teammate's merge.

What approach best balances efficiency and accuracy?

### Các lựa chọn trả lời

1. Resume the session and inform the agent which specific files changed for targeted re-analysis
2. Resume the session without informing the agent about the changed files
3. Start a fresh session to ensure the agent works with current codebase state without stale assumptions
4. Resume the session and immediately have the agent re-read all 12 previously analyzed files

### Đáp án đúng

**1. Resume the session and inform the agent which specific files changed for targeted re-analysis**

## Câu 013

### Câu hỏi

An engineer asks the agent to understand how the caching layer works before adding a new cache invalidation trigger. After initial Grep searches, the agent has identified that caching logic spans 15 files including decorators, middleware, and service classes (~8,000 lines total).

What's the most effective next step for building understanding while managing context constraints?

### Các lựa chọn trả lời

1. Analyze imports and class hierarchies to identify the base cache class, Read that file to understand the interface, then trace specific invalidation implementations.
2. Use the Read tool to sequentially load all 15 files, building complete understanding across the full caching implementation.
3. Use Grep to search for "invalidate" and "expire" patterns across all files, then Read only those specific line ranges with minimal surrounding context.
4. Use Glob to find files matching common caching patterns (cache.py, caching/), prioritize the largest files by reading them first, then check smaller files for gaps.

### Đáp án đúng

**1. Analyze imports and class hierarchies to identify the base cache class, Read that file to understand the interface, then trace specific invalidation implementations.**

## Câu 014

### Câu hỏi

An engineer who just joined the team asks the agent to help them understand the authentication and authorization architecture before making security improvements. The codebase has 800+ files across multiple services.

What exploration strategy will most effectively build understanding, given Claude built-in tools and context limits?

### Các lựa chọn trả lời

1. Launch parallel subagents to explore different services simultaneously, then synthesize their findings into an architectural overview.
2. Use Grep to find authentication entry points, read those files, then follow imports and function calls to map the auth flow incrementally.
3. Read any CLAUDE.md and README files first, then ask the engineer to specify which 10-15 files are most important for understanding the auth system.
4. Read all files containing "auth", "login", "permission", or "token" in their content or filename.

### Đáp án đúng

**2. Use Grep to find authentication entry points, read those files, then follow imports and function calls to map the auth flow incrementally.**

## Câu 015

### Câu hỏi

After integrating a local MCP server providing code analysis tools (analyze_dependencies, find_dead_code, calculate_complexity), you notice the agent continues to use Grep to inspect dependencies even when users explicitly ask about "code dependencies". Tool definitions reveal: analyze_dependencies returns a dependency graph by analyzing imports.

What's the most effective approach to improve the agent's selection of MCP tools?

### Các lựa chọn trả lời

1. Split analyze_dependencies into granular tools: list_imports, detect_transitive_deps, identify_circular_deps to avoid overlap with Grep.
2. Expand MCP tool descriptions and outputs–e.g., "Builds dependency graph with list_imports, direct_circular_deps"–to clearly distinguish dependencies and cycle analysis from Grep.
3. Add routing questions to the system prompt specifying that dependency-related questions should use MCP tools rather than Grep.
4. Remove Grep from the available tools to eliminate functional overlap.

### Đáp án đúng

**2. Expand MCP tool descriptions and outputs–e.g., "Builds dependency graph with list_imports, direct_circular_deps"–to clearly distinguish dependencies and cycle analysis from Grep.**

## Câu 016

### Câu hỏi

Your extraction pipeline processes contracts that frequently include amendments. When a contract contains both original terms and later amendments (e.g., original clause specifies "30-day payment terms" while Amendment 1 changes this to "45 days"), the model inconsistently extracts one value or the other with no indication of which applies.

What's the most effective approach to improve extraction accuracy for documents with amendments?

### Các lựa chọn trả lời

1. Implement post-extraction validation using pattern matching to detect amendments and flag those extractions for manual review.
2. Redesign the schema so amended fields capture multiple values, each with source location and effective date.
3. Add prompt instructions to always extract the most recent amendment value and ignore superseded original terms.
4. Preprocess documents with a classifier that identifies and removes superseded sections before the main extraction step.

### Đáp án đúng

**2. Redesign the schema so amended fields capture multiple values, each with source location and effective date.**

## Câu 017

### Câu hỏi

After deployment, you find that 12% of extractions contain semantic errors that pass JSON schema validation (e.g., a duration like "30 minutes" incorrectly placed in an ingredient quantity field). Human reviewers have capacity to check only 20% of extractions.

Which approach most effectively allocates reviewer attention?

### Các lựa chọn trả lời

1. Prioritize review of all extractions where required fields are empty or explicitly marked as not found.
2. Have the model output field-level confidence scores, then calibrate review thresholds using a labeled validation set.
3. Review all extractions from documents with formatting anomalies such as unusual layouts or mixed content types.
4. Randomly sample 20% of extractions for review, using corrections to track accuracy and identify error patterns.

### Đáp án đúng

**2. Have the model output field-level confidence scores, then calibrate review thresholds using a labeled validation set.**

## Câu 018

### Câu hỏi

Your extraction pipeline processes invoices and extracts line items, tax amounts, and grand totals. You discover that 8% of documents have extracted line item amounts that don't sum to the extracted grand total—the downstream accounting system has been detecting mismatches.

What's the most effective improvement?

### Các lựa chọn trả lời

1. Implement post-processing that automatically adjusts line item amounts when the extracted total doesn't match the sum.
2. Add a calculated_total field where the model extracts line items independently, then validate totals alongside a is_total_consistent boolean flag for human review when values differ.
3. Extract line items and totals independently, then use a separate validation model to reconcile discrepancies.
4. Add few-shot examples to the system prompt where extracted line items correctly sum to demonstrate the desired extraction behavior.

### Đáp án đúng

**2. Add a calculated_total field where the model extracts line items independently, then validate totals alongside a is_total_consistent boolean flag for human review when values differ.**

## Câu 019

### Câu hỏi

Your pipeline uses a tool called extract_metadata with a JSON schema for paper details. During testing, the agent sometimes fails to call extract_metadata because it wants to provide direct answers.

What's the most reliable way to ensure metadata extraction always happens first?

### Các lựa chọn trả lời

1. Set tool_choice to "auto" and reorder the tool definitions placing extract_metadata first since Claude prioritizes earlier-listed tools.
2. Set tool_choice to type "tool", name "extract_metadata" and process the enrichment requests in subsequent turns after receiving the extracted metadata.
3. Set tool_choice to type "any" so Claude must use a tool, combined with system prompt instructions to call extract_metadata first.
4. Set tool_choice to "auto" in the API call, combined with tools so that Claude always prioritizes metadata before any other tool calls.

### Đáp án đúng

**2. Set tool_choice to type "tool", name "extract_metadata" and process the enrichment requests in subsequent turns after receiving the extracted metadata.**

## Câu 020

### Câu hỏi

After your daily batch of 10,000 documents completes, 300 documents (3%) failed with "context_length_exceeded" errors. The results file identifies each failure by custom_id.

What's the most cost-effective approach to process these failures?

### Các lựa chọn trả lời

1. Reprocess the entire batch with prompt caching enabled to reduce the cost of retrying requests with identical system prompts
2. Increase the max_tokens parameter for the 300 failed documents and resubmit them in a new batch
3. Resubmit only the 300 failed documents after chunking them into smaller pieces, then combine the partial extractions
4. Resubmit the entire 10,000 document batch using a model tier with a larger context window

### Đáp án đúng

**3. Resubmit only the 300 failed documents after chunking them into smaller pieces, then combine the partial extractions**

## Câu 021

### Câu hỏi

Your extraction system parses e-commerce product descriptions to extract specifications like dimensions, weight, and materials into JSON. Despite having a well-defined schema, the model inconsistently extracts the "materials" field–sometimes returning "cotton blend", other times "Cotton/Polyester mix", and occasionally omitting the field when material information is clearly present in the source.

What's the most effective way to improve extraction consistency?

### Các lựa chọn trả lời

1. Set temperature to 0 to eliminate randomness and ensure deterministic outputs
2. Switch to a more capable model tier since inconsistent extraction indicates insufficient model capability
3. Add few-shot examples showing 2-3 complete input-output pairs with standardized material description formats
4. Make the "materials" field required instead of optional in the schema to force the model to always extract a value

### Đáp án đúng

**3. Add few-shot examples showing 2-3 complete input-output pairs with standardized material description formats**

## Câu 022

### Câu hỏi

Your system extracts event metadata (date, location, organizer, attendee_count) from news articles using a JSON schema with all nullable fields. During evaluation, you observe the model frequently generates plausible but incorrect values for fields not mentioned in the article–for example, outputting "500" for attendee_count when the source contains no attendance information.

What's the most effective way to reduce these false extractions?

### Các lựa chọn trả lời

1. Add prompt instructions to return null for any field where information is not directly stated in the source.
2. Add a post-processing step using a second LLM call to verify each extracted value exists in the source document.
3. Upgrade to a more capable model tier with improved instruction-following to reduce hallucination tendencies.
4. Make all schema fields required (non-nullable) with strict validation rules to ensure the model only outputs verifiable data.

### Đáp án đúng

**1. Add prompt instructions to return null for any field where information is not directly stated in the source.**

## Câu 023

### Câu hỏi

After implementing tool use with strict schema definitions, JSON syntax errors are eliminated, but 5% of extractions still have valid JSON with empty arrays or null values for required fields like citations and methodology. Spot-checking reveals that source documents contain this information, but in varied formats–inline citations vs. bibliographies, methodology sections vs. details embedded in introductions.

What's the most effective way to address these failures?

### Các lựa chọn trả lời

1. Add few-shot examples demonstrating extractions from documents with varied structures–showing how to identify citations in different formats and locate methodology details across section types.
2. Modify your schema to make citations and methodology optional, and flag incomplete records for manual review rather than failing validation.
3. Implement retry logic that re-sends requests when validation detects empty required fields.
4. Build a regex-based post-processing layer that scans source documents for citation patterns and methodology keywords, populating empty fields when the model fails to extract.

### Đáp án đúng

**1. Add few-shot examples demonstrating extractions from documents with varied structures–showing how to identify citations in different formats and locate methodology details across section types.**

## Câu 024

### Câu hỏi

Your extraction system implements automatic retries when validation fails. On each retry, the specific validation error is appended to the prompt. This retry-with-error-feedback approach resolves most failures within 2-3 attempts

For which failure pattern would additional retries be LEAST effective?

### Các lựa chọn trả lời

1. The model extracts "et al." for co-authors when the full list exists only in an external document not in the input
2. The model extracts citation counts as locale-formatted strings ("1,234") when the schema requires integers
3. The model extracts keywords as a nested object organized by category when the schema requires a flat array of strings
4. The model extracts dates as ISO 8601 datetime strings ("2023-03-15T00:00:00Z") when the schema requires only the date portion (YYYY-MM-DD)

### Đáp án đúng

**1. The model extracts "et al." for co-authors when the full list exists only in an external document not in the input**

## Câu 025

### Câu hỏi

Your extraction pipeline processes restaurant menus and must output structured JSON with fields for item names, descriptions, prices, and dietary tags. Some menus use inconsistent formatting–prices as "$12" vs "12.00", dietary info as icons vs text.

What's the most reliable approach?

### Các lựa chọn trả lời

1. Request multiple extraction attempts per document and select the most common format.
2. Define a strict output schema and include format normalization rules in your prompt.
3. Use separate extraction calls for each field to ensure consistent handling of each type.
4. Extract data as-is and normalize formats in post-processing code after Claude returns.

### Đáp án đúng

**2. Define a strict output schema and include format normalization rules in your prompt.**

## Câu 026

### Câu hỏi

Your extraction uses tool use with a JSON schema where property_type is defined as an enum: ['house', 'apartment', 'condo', 'townhouse']. After deployment, 8% of extractions fail schema validation. Investigation reveals listings mention many uncommon property types –"studio", "loft", "duplex", "mobile home", "tiny house", "converted warehouse"–and new types continue appearing regularly.

What's the most effective long-term solution?

### Các lựa chọn trả lời

1. Add few-shot examples to your prompt demonstrating how to map unexpected property types to the closest existing enum value.
2. Add an "other" value to your enum with a separate property_type_detail string field for specifics when "other" is selected.
3. Continuously expand the enum to include newly observed property types and add monitoring for additional edge cases.
4. Change property_type from an enum to a free-form string and implement a normalization step in post-processing.

### Đáp án đúng

**2. Add an "other" value to your enum with a separate property_type_detail string field for specifics when "other" is selected.**

## Câu 027

### Câu hỏi

Your system has been operating with 100% human review for 3 months. Analysis shows that extractions with model confidence >90% have 97% accuracy overall. To reduce reviewer workload, you plan to automate high-confidence extractions

Before deploying, what validation step is most critical?

### Các lựa chọn trả lời

1. Analyze accuracy by document type and field to verify high-confidence extractions perform consistently across all segments, not just in aggregate.
2. Run a two-week pilot routing 25% of high-confidence extractions directly to downstream systems and monitor error reports.
3. Compare accuracy at different confidence thresholds (85%, 90%, 95%) to find the optimal cutoff that maximizes automation while minimizing errors.
4. Verify that 97% accuracy meets requirements for all downstream systems that consume the extracted data.

### Đáp án đúng

**1. Analyze accuracy by document type and field to verify high-confidence extractions perform consistently across all segments, not just in aggregate.**

## Câu 028

### Câu hỏi

Documents arrive continuously throughout business hours and need structured data extracted. To reduce costs, you want to use the Message Batches API (50% discount, up-to-24-hour processing window). Your SLA specifies that extraction results must be available within 30 hours of document arrival with 99.9% reliability.

Which batching strategy is most appropriate?

### Các lựa chọn trả lời

1. Submit batches every 4 hours containing documents from that window
2. Submit a single batch at end of day containing all documents from that day
3. Submit batches every 6 hours containing documents from that window
4. Use the real-time API for all documents instead of batch processing

### Đáp án đúng

**1. Submit batches every 4 hours containing documents from that window**

## Câu 029

### Câu hỏi

Your schema includes a skills: string[] field. Production monitoring reveals three consistency issues: (1) compound phrases like "Python and SQL" are sometimes kept as one entry, sometimes split; (2) implied but unstated skills occasionally appear in extractions; (3) similar documents produce wildly different array lengths (5-10 vs 40+ entries). Your prompt currently says "Extract all skills mentioned."

What's the most effective improvement?

### Các lựa chọn trả lời

1. Add few-shot examples demonstrating compound phrase handling, explicit mention criteria, and appropriate entry granularity.
2. Add post-extraction normalization that maps skills to a canonical taxonomy and deduplicates similar entries.
3. Enrich the schema to {skill: string, confidence: float, source_quote: string[]} to capture extraction metadata.
4. Add constraints: "Extract 10-20 skills maximum, one skill per entry, only explicitly named skills."

### Đáp án đúng

**1. Add few-shot examples demonstrating compound phrase handling, explicit mention criteria, and appropriate entry granularity.**

## Câu 030

### Câu hỏi

Your extraction system processes two document types: standard monthly reports (archived after processing) and urgent exception reports (must trigger business alerts within 30 minutes of receipt). Both use the same JSON schema. You want to minimize API costs while meeting latency requirements.

How should you architect the processing pipeline?

### Các lựa chọn trả lời

1. Queue all documents and submit hourly batches, flagging urgent documents for expedited handling when batch results return.
2. Submit all documents to the real-time Messages API to ensure consistent processing latency across document types.
3. Submit all documents to the Batch API with custom_ids for tracking. When results arrive, immediately process urgent documents and trigger delayed alerts for exceptions.
4. Route standard reports to the Batch API for 50% cost savings, and route urgent exception reports to the real-time Messages API.

### Đáp án đúng

**4. Route standard reports to the Batch API for 50% cost savings, and route urgent exception reports to the real-time Messages API.**

## Câu 031

### Câu hỏi

The document analysis agent has a single analyze_document tool that takes a document and a free-text instruction parameter. During evaluation, requests like "extract the key financial metrics" often return narrative summaries, while "summarize the methodology" sometimes returns raw data tables. The synthesis agent reports that 35% of analysis results require re-requests with clarified instructions.

What's the most effective way to improve reliability?

### Các lựa chọn trả lời

1. Enhance the tool description with detailed examples showing how different instruction phrasings should map to different output formats.
2. Split the generic tool into purpose-specific tools– extract_data_points, summarize_content, verify_claim_against_source –each with defined input/output contracts.
3. Keep the single tool but add an analysis_type enum parameter requiring explicit selection between extraction, summarization, and verification modes.
4. Have the coordinator pre-classify each analysis request before passing instructions to the document analysis agent.

### Đáp án đúng

**2. Split the generic tool into purpose-specific tools– extract_data_points, summarize_content, verify_claim_against_source –each with defined input/output contracts.**

## Câu 032

### Câu hỏi

The coordinator agent has AgentFunctions configured for all four specialized subagents, each with appropriate descriptions and restrictions. During testing, you find the coordinator sometimes fails to delegate—it writes "I'll ask the web search agent to find sources" without actually invoking it.

What is the most likely cause?

### Các lựa chọn trả lời

1. The AgentFunctions are configured correctly, but the coordinator's system prompt includes a statement that prevents it from knowing the available subagent types.
2. The coordinator's max_tokens setting is too low, causing the Task tool invocation to be truncated before the subagent parameter can be specified.
3. Subagent context limit descriptions from the coordinator don't provide enough context; you need to configure explicit context content between coordinator and tool descriptions.
4. The coordinator's allowed Tools configuration doesn't include "Task", so while it can describe delegation, it cannot actually invoke the tool required to spawn subagents.

### Đáp án đúng

**4. The coordinator's allowed Tools configuration doesn't include "Task", so while it can describe delegation, it cannot actually invoke the tool required to spawn subagents.**

## Câu 033

### Câu hỏi

When researching "renewable energy adoption," the web search agent returns recent statistics (2024: 35% adoption) while the document analysis agent extracts data from internal reports (2022: 18% adoption). The synthesis agent incorrectly flags these as contradictory sources rather than recognizing the data shows growth over time.

What change would best enable the synthesis agent to correctly interpret such temporal differences?

### Các lựa chọn trả lời

1. Require subagents to include publication or data collection dates in their structured outputs.
2. Add a conflict resolution agent that automatically discards older data when newer data exists for the same metric.
3. Configure the web search agent to only return results from the past 6 months.
4. Instruct the synthesis agent to always treat the most recent data as authoritative and place older findings in a separate historical appendix.

### Đáp án đúng

**1. Require subagents to include publication or data collection dates in their structured outputs.**

## Câu 034

### Câu hỏi

Your multi-agent research pipeline crashed after processing 12 of 28 documents. The web search agent had identified relevant sources, the document analysis agent had partially completed extraction, and the synthesizer had begun pattern identification.
You need to resume processing without repeating work or losing fidelity of prior findings.

What state management approach best balances information fidelity with context efficiency when restoring agent state?

### Các lựa chọn trả lời

1. Have each agent persist a structured report to a known location. On resume, the coordinator loads the reports and injects relevant state into agent prompts.
2. Have each agent maintain its own persistent state file and reload it independently at the start of each session.
3. Persist the coordinator's conversation log containing all task delegations and responses, providing this to agents when resuming.
4. Index all agent outputs in a shared vector store. When resuming, each agent queries the store using semantic search to retrieve relevant prior findings.

### Đáp án đúng

**1. Have each agent persist a structured report to a known location. On resume, the coordinator loads the reports and injects relevant state into agent prompts.**

## Câu 035

### Câu hỏi

Production reviews reveal inconsistent handling of uncertainty in final reports. Sometimes confidence calibrations are synthesized into standardized uncertainty expressions, while other times results produce vague estimates without clear methodology.

Which system-level improvement best addresses this inconsistency?

### Các lựa chọn trả lời

1. Configure subagents to only report findings with sufficient coverage breadth, source diversity, and quality criteria before passing results to the synthesis agent.
2. Add a verification subagent that cross-references findings across sources, only accepting synthesis corroborated by at least two independent sources.
3. Implement a confidence calibration layer where synthesis agent normalizes uncertainty expressions into standardized probability representations (0.0-1.0), then weights their calibrated confidence.
4. Instruct the synthesis agent to use explicit sections separating confirmed findings from contested analysis, preserving original source characterizations.

### Đáp án đúng

**4. Instruct the synthesis agent to use explicit sections separating confirmed findings from contested analysis, preserving original source characterizations.**

## Câu 036

### Câu hỏi

The coordinator provides detailed step-by-step instructions to the web search subagent, specifying exact search queries, source quality criteria (coverage breadth, source diversity), and content type classifications. The coordinator sometimes encounters challenges where instructions fail when the subagent encounters unexpected situations.

What's the most effective way to improve subagent adaptability?

### Các lựa chọn trả lời

1. Add explicit fallback directives to the detailed instructions: "if specified searches fail, attempt alternative queries before reporting failure."
2. Remove procedural detail entirely, delegating with simple goals like "research it thoroughly" and relying on the subagent's general capabilities.
3. Implement a task classification step where the coordinator categorizes requests as "analytical" vs "exploratory" and uses different instruction sets for each category.
4. Specify research goals and quality criteria (coverage breadth, source diversity, content type) rather than procedural instructions, letting the subagent determine execution.

### Đáp án đúng

**4. Specify research goals and quality criteria (coverage breadth, source diversity, content type) rather than procedural instructions, letting the subagent determine execution.**

## Câu 037

### Câu hỏi

A user is expanding the research system beyond its single web search agent by adding specialized data sources. They add a financial API agent that returns structured JSON with revenue, margins, and growth rates; a news monitoring agent that returns prose summaries of recent developments; and a patent analysis agent that returns structured lists of technology areas. The synthesis agent combines these into executive briefings. Currently, it converts everything to bullet points, causing financial comparisons to lose tabular clarity and news summaries to lose narrative flow.

What change would most improve briefing quality?

### Các lựa chọn trả lời

1. Standardize all subagent outputs to prose summaries with inline citations.
2. Update the synthesis agent to render each content type appropriately–financial data as tables, news as prose.
3. Add a format conversion layer between subagents and synthesis that transforms all outputs to a common intermediate representation.
4. Standardize all subagent outputs to JSON with fields for claim, evidence, source, and confidence.

### Đáp án đúng

**2. Update the synthesis agent to render each content type appropriately–financial data as tables, news as prose.**

## Câu 038

### Câu hỏi

The web search agent has gathered several relevant sources for a research topic. The document analysis agent now needs to examine these sources.

How does information typically flow between these two specialized subagents?

### Các lựa chọn trả lời

1. The coordinator agent receives the web search agent's output and includes relevant findings in the prompt when invoking the document analysis agent.
2. The web search agent directly invokes the document analysis agent, passing the discovered sources as parameters.
3. Both agents access a shared memory store where the web search agent writes findings and the document analysis agent reads them.
4. The agents communicate through an event-driven message queue, with the document analysis agent subscribing to web search completion events.

### Đáp án đúng

**1. The coordinator agent receives the web search agent's output and includes relevant findings in the prompt when invoking the document analysis agent.**

## Câu 039

### Câu hỏi

After the web search agent and document analysis agent complete their tasks, the coordinator invokes the synthesis agent. However, the synthesis agent responds that it cannot complete the task because no research findings were provided.

What is the most likely cause of this issue?

### Các lựa chọn trả lời

1. The synthesis agent needs tools that can fetch results directly from the other agents' conversation histories.
2. The coordinator did not include the outputs from the previous agents in the synthesis agent's prompt.
3. The subagents need to share a single API connection to enable automatic context sharing between invocations.
4. The synthesis agent's context window is not large enough to hold the combined outputs from both previous agents.

### Đáp án đúng

**2. The coordinator did not include the outputs from the previous agents in the synthesis agent's prompt.**

## Câu 040

### Câu hỏi

In production, final reports frequently contain claims without proper source attribution. Investigation shows that while the web search and document analysis agents correctly attach citations to their outputs, the synthesis agent loses track of which sources support which conclusions when combining findings.

What's the most effective architectural change?

### Các lựa chọn trả lời

1. Have the coordinator inject source identifier prefixes into text before each handoff, then parse these prefixes at report generation to reconstruct citations.
2. Require all subagents to output structured claim-source mappings that the synthesis agent must preserve and merge when combining findings from multiple sources.
3. Add a verification step where the report generator uses semantic similarity matching against original sources to reconstruct which claims came from which documents.
4. Maintain complete transcripts of all subagent interactions and add a citation-resolution agent to analyze logs and determine attributions before report generation.

### Đáp án đúng

**2. Require all subagents to output structured claim-source mappings that the synthesis agent must preserve and merge when combining findings from multiple sources.**

## Câu 041

### Câu hỏi

Production monitoring shows that follow-up queries like "summarize what we learned about market trends" consistently take 40+ seconds. Investigation reveals the coordinator spawns the synthesis subagent for each summarization request, passing 80K+ tokens of accumulated findings. The coordinator already has these findings in its context from orchestrating the research.

What's the most effective way to improve response time for these follow-up summaries?

### Các lựa chọn trả lời

1. Spawn the synthesis subagent with reduced context and have it request specific findings from the coordinator on-demand.
2. Pre-generate and cache summaries at multiple granularities whenever new findings accumulate.
3. Enable prompt caching on the synthesis subagent to reduce the overhead of repeatedly transferring the same research findings.
4. Have the coordinator handle straightforward summarization requests directly using its existing context, reserving subagent spawning for complex analysis.

### Đáp án đúng

**4. Have the coordinator handle straightforward summarization requests directly using its existing context, reserving subagent spawning for complex analysis.**

## Câu 042

### Câu hỏi

After the web search agent finds 25 sources (120K tokens of raw content), the document analysis agent extracts key insights (15K tokens), and the synthesis agent produces a coherent narrative draft (3K tokens), the coordinator must pass context to the report generation agent for the final output with proper source citations.

What context-passing strategy provides the best balance of completeness and efficiency?

### Các lựa chọn trả lời

1. Pass the full accumulated context from all prior agents.
2. Pass only the synthesis draft and have a separate post-processing pipeline match claims to sources and insert citations after the report is generated.
3. Pass a condensed summary of all prior stages that preserves the main findings and attributes them to sources by name only.
4. Pass the synthesis draft along with a structured source index that maps key claims to their source URLs and relevant excerpts.

### Đáp án đúng

**4. Pass the synthesis draft along with a structured source index that maps key claims to their source URLs and relevant excerpts.**

## Câu 043

### Câu hỏi

When analyzing complex legal cases that cite multiple precedents, the document analysis subagent processes each sequentially. A landmark case citing 12 precedents takes over 3 minutes to analyze completely.

What's the most effective way to reduce this latency while preserving the coordinator's ability to monitor and debug the system?

### Các lựa chọn trả lời

1. Implement a message queue where precedent analysis tasks are processed asynchronously by a pool of worker agents.
2. Have the coordinator spawn parallel document analysis subagents, each handling a subset of precedents, then aggregate results before synthesis.
3. Create a recursive agent hierarchy where analysis agents subdivide work among child agents until reaching single-precedent granularity.
4. Enable the document analysis subagent to spawn its own specialized subagents dynamically when it encounters cases with many citations.

### Đáp án đúng

**2. Have the coordinator spawn parallel document analysis subagents, each handling a subset of precedents, then aggregate results before synthesis.**

## Câu 044

### Câu hỏi

In production, you're distributing complex queries to specialized subagents. The query distribution is uneven and evolving as users discover new applications.

What's the most effective approach to optimize for query complexity?

### Các lựa chọn trả lời

1. Create a fast-track path for factual questions that bypasses subagents entirely, routing only analytical queries through the complete pipeline.
2. Train a query complexity classifier based on labeled historical data to predict optimal subagent combination.
3. Implement pattern-based routing that categorizes queries based on factual vs analytical patterns and maps each to a predefined subagent combination.
4. Have the coordinator analyze each query dynamically and selectively route subagents based on the query's complexity and routing characteristics.

### Đáp án đúng

**1. Create a fast-track path for factual questions that bypasses subagents entirely, routing only analytical queries through the complete pipeline.**

## Câu 045

### Câu hỏi

The synthesis agent receives summarized findings from the web search and document analysis agents, then passes a consolidated summary to the report generator. During testing, you discover the generated reports make factual claims without proper citations–the report generator cannot attribute statements to their original sources because that metadata was lost during the summarization steps.

What's the most effective approach to ensure proper source attribution in the final reports?

### Các lựa chọn trả lời

1. Have each agent output structured data separating content summaries from source metadata (URLs, document names, page numbers).
2. Skip summarization and pass full raw outputs from web search and document analysis directly to the report generator.
3. Instruct the synthesis agent to embed source references inline within its summary text using a consistent citation format.
4. Have the report generator query the web search agent to re-locate sources for claims in the final report.

### Đáp án đúng

**1. Have each agent output structured data separating content summaries from source metadata (URLs, document names, page numbers).**

## Câu 046

### Câu hỏi

When implementing your lookup_order MCP tool, the backend sometimes returns errors (e.g., "Order not found" or temporary database failures).

What is the correct pattern for communicating these errors back to the agent?

### Các lựa chọn trả lời

1. Return a success response with a "status" field indicating the error type
2. Throw an exception from the tool handler so the agent framework can catch and log it
3. Log the error server-side and return an empty result to avoid confusing the model
4. Return the error message in the tool result content with the isError flag set to true

### Đáp án đúng

**4. Return the error message in the tool result content with the isError flag set to true**

## Câu 047

### Câu hỏi

After investigating a billing dispute over 25+ turns, you've identified that duplicate charges occurred due to a payment gateway timeout triggering retry logic. The required refund ($847) exceeds your $500 authorization limit. You need to call escalate_to_human, and the human agent won't have access to your conversation transcript.

What context should you pass to enable effective resolution?

### Các lựa chọn trả lời

1. A structured summary: customer ID, root cause, refund amount, and recommended action.
2. Your diagnosis and the refund amount only.
3. The complete conversation transcript with all tool results.
4. The customer's original complaint verbatim plus the tool result excerpts showing duplicate transactions.

### Đáp án đúng

**1. A structured summary: customer ID, root cause, refund amount, and recommended action.**

## Câu 048

### Câu hỏi

Your agent has called lookup_order multiple times while investigating a customer's return requests. Each response includes 40+ fields (items, shipping details, payment info, status history). Tool outputs now represent the majority of the conversation's context. The customer mentions two more orders they want to discuss.

What's the most effective approach before making additional lookups?

### Các lựa chọn trả lời

1. Move all tool responses to a vector database with semantic indexing, retrieving relevant portions as the conversation continues
2. Extract only return-relevant fields (items, purchase date, return window, status) from each existing order response, removing verbose details
3. Have the model generate a natural language summary of each order's key details, replacing structured responses with prose descriptions
4. Proceed with additional lookups without modifying the existing tool output context

### Đáp án đúng

**2. Extract only return-relevant fields (items, purchase date, return window, status) from each existing order response, removing verbose details**

## Câu 049

### Câu hỏi

A customer sends: "This is frustrating. I've explained my issue twice and nothing is being resolved. I want to talk to a real person NOW." The agent has not yet called any tools to investigate their account.

What should the agent do?

### Các lựa chọn trả lời

1. Immediately call escalate_to_human with the conversation history.
2. Acknowledge the frustration and ask one targeted question to understand the specific issue before escalating.
3. Briefly explain what the agent can help with and offer to resolve the issue quickly, escalating only if the customer repeats their request.
4. First call get_customer and lookup_order to gather account context, then escalate to a human agent.

### Đáp án đúng

**2. Acknowledge the frustration and ask one targeted question to understand the specific issue before escalating.**

## Câu 050

### Câu hỏi

You're implementing the escalation logic for when the agent should call escalate_to_human. Your team proposes four different approaches for triggering escalation.

Which approach will most reliably identify cases that genuinely require human intervention?

### Các lựa chọn trả lời

1. Implement sentiment analysis that monitors for frustration indicators (negative language, repeated questions, exclamation marks) and trigger escalation when the frustration score exceeds a configured threshold.
2. Instruct the agent to escalate when the customer requests a human, when the issue requires policy exceptions, or when the agent cannot make meaningful progress.
3. Configure the agent to escalate after three consecutive tool calls that fail to resolve the customer's stated issue, ensuring a reasonable attempt before involving a human.
4. Build a rules engine that maps specific issue types, customer segments, and product categories to escalation decisions, removing the need for model judgment calls.

### Đáp án đúng

**2. Instruct the agent to escalate when the customer requests a human, when the issue requires policy exceptions, or when the agent cannot make meaningful progress.**

## Câu 051

### Câu hỏi

Your agent is handling a billing dispute. After calling get_customer and lookup_order, it identifies that the dispute involves a promotional pricing error requiring manager approval–beyond the agent's authorization level.

How should the workflow handle this mid-process escalation?

### Các lựa chọn trả lời

1. Persist the complete conversation and tool response history to a database, then call escalate_to_human with a reference ID.
2. Attempt the refund with process_refund anyway, escalating only if the system rejects the transaction.
3. Call escalate_to_human passing only the customer's original message.
4. Compile a structured handoff with customer details, order info, and the identified issue before calling escalate_to_human.

### Đáp án đúng

**4. Compile a structured handoff with customer details, order info, and the identified issue before calling escalate_to_human.**

## Câu 052

### Câu hỏi

During a billing dispute resolution, your agent successfully retrieves customer info via get_customer and order details via lookup_order, but when attempting to process the refund via process_refund, the tool returns a timeout error. The agent has enough information to explain the billing, confirm the refund eligibility, and verify refund eligibility, but cannot actually process the refund due to the backend failure.

What approach best balances first-contact resolution with appropriate error handling?

### Các lựa chọn trả lời

1. Implement automatic retries with exponential backoff for process_refund, keeping the conversation open until the refund is successfully processed
2. Confirm the refund will be processed and close the conversation, since the system has all necessary information to complete it automatically
3. Escalate immediately to a human agent since the refund action cannot be completed
4. Explain the billing, confirm refund eligibility, acknowledge the system issue preventing immediate processing, and offer escalation or retry later

### Đáp án đúng

**4. Explain the billing, confirm refund eligibility, acknowledge the system issue preventing immediate processing, and offer escalation or retry later**

## Câu 053

### Câu hỏi

Production logs reveal inconsistent error responses when lookup_order fails. The agent sometimes retries (wasting 3-4 turns) before concluding on the error. Your MCP tool currently returns only a plain text error message to Claude.

What's the most effective improvement?

### Các lựa chọn trả lời

1. Implement retry logic with exponential backoff in your MCP server for all errors, returning only successful results to the agent.
2. Create an analyze_error MCP tool the agent calls to determine the error type before deciding how to handle it.
3. Return structured error responses with retryable: false for business errors and a customer-friendly explanation for Claude to use.
4. Add few-shot examples to the system prompt showing how to distinguish retryable from non-retryable errors by parsing error message text.

### Đáp án đúng

**3. Return structured error responses with retryable: false for business errors and a customer-friendly explanation for Claude to use.**

## Câu 054

### Câu hỏi

When the agent calls lookup_order and receives order details showing the item was purchased 45 days ago, how does the agentic loop determine whether to call process_refund or escalate_to_human next?

### Các lựa chọn trả lời

1. The order details are added to the conversation and the model reasons about which action to take.
2. The agent follows a pre-configured decision tree mapping order attributes to specific tool calls.
3. The agent executes the remaining steps in a tool sequence planned at the start of the request.
4. The orchestration layer automatically routes to the next tool based on the order's status field.

### Đáp án đúng

**1. The order details are added to the conversation and the model reasons about which action to take.**

## Câu 055

### Câu hỏi

A customer writes: "I've been going back and forth on this return for days. I just want to speak to someone who can actually help me." The agent has confirmed via lookup_order that the return is straightforward–within policy and eligible for immediate processing.

What should the agent do?

### Các lựa chọn trả lời

1. Acknowledge frustration, inform them this is resolvable now, and offer to complete it or escalate
2. Process the refund via process_refund to resolve the underlying issue, then inform them it's complete
3. Call escalate_to_human immediately to honor the customer's request
4. Ask what specifically hasn't worked in previous attempts before deciding whether to escalate or resolve automatically

### Đáp án đúng

**1. Acknowledge frustration, inform them this is resolvable now, and offer to complete it or escalate**

## Câu 056

### Câu hỏi

Compliance requires that refunds exceeding $500 must automatically escalate to a human agent–this rule cannot be left to model discretion. Despite clear system prompt instructions, production logs show the agent occasionally processes high-value refunds directly (3% failure rate).

How should you achieve guaranteed compliance?

### Các lựa chọn trả lời

1. Add few-shot examples to the prompt showing correct escalation behavior at various refund amounts ($400, $500, $600).
2. Strengthen the system prompt with emphatic language: "CRITICAL POLICY: Refunds over $500 MUST trigger human escalation. NEVER process these directly."
3. Implement a hook to intercept tool calls; when the refund process amount exceeds $500, block it and invoke human escalation.
4. Modify the refund tool to return an error with message "Amount exceeds policy limit–please escalate" when threshold is exceeded.

### Đáp án đúng

**3. Implement a hook to intercept tool calls; when the refund process amount exceeds $500, block it and invoke human escalation.**

## Câu 057

### Câu hỏi

A customer raises three separate issues during one session: a refund inquiry (turns 1-15), a subscription question (turns 16-30), and a payment method update (turns 31-45). At turn 48, the customer asks "What happened with my refund?" The conversation is approaching context limits.

What strategy best maintains the agent's ability to address all issues throughout the session?

### Các lựa chọn trả lời

1. Implement sliding window context that retains the most recent 30 turns.
2. Extract and persist structured issue data (order IDs, amounts, statuses) into a separate context layer.
3. Summarize earlier turns into a narrative description, preserving full message history only for the active issue.
4. Rely on MCP tools to re-fetch relevant information on demand when the customer references earlier issues.

### Đáp án đúng

**3. Summarize earlier turns into a narrative description, preserving full message history only for the active issue.**

## Câu 058

### Câu hỏi

The agent verifies customer identity through a multi-step process before resetting passwords. During testing, you notice that after the customer answers the third verification question, the agent asks them to provide their name again, as if the earlier exchange never happened.

What's the most likely cause of this behavior?

### Các lựa chọn trả lời

1. The conversation history isn't being passed in subsequent API requests.
2. The verification tool is clearing the agent's internal state after each successful validation step.
3. Claude's memory retention is limited to two conversational turns by default, requiring explicit configuration to extend it.
4. The prompt lacks instructions telling Claude to remember information across multiple exchanges.

### Đáp án đúng

**1. The conversation history isn't being passed in subsequent API requests.**

## Câu 059

### Câu hỏi

Your process_refund tool returns two types of errors: technical errors ("503 Service Unavailable", "Connection timeout") that are transient (5% of calls), and business errors ("Order exceeds 30-day return window", "Item already refunded") that are permanent (12% of calls). Monitoring shows the agent wastes 3-4 turns retrying business errors that can never succeed. Currently, both error types return only a plain text message to Claude.

What's the most effective way to reduce wasted retries while improving customer-facing response quality?

### Các lựa chọn trả lời

1. Add few-shot examples showing how to distinguish retryable from non-retryable errors by parsing error message text.
2. Return structured error responses with retryable: false for business errors and a customer-friendly explanation for Claude to use.
3. Implement automatic retry logic at the tool level for technical errors only, passing business errors to Claude without retries.
4. Add a check_refund_eligibility tool that must be called before process_refund to prevent business rule violations.

### Đáp án đúng

**2. Return structured error responses with retryable: false for business errors and a customer-friendly explanation for Claude to use.**

## Câu 060

### Câu hỏi

A customer returns 4 hours after their initial session about the same billing dispute. The previous 32-turn session contains context: lookup_status_result messages containing "Status: Pending Refund" and significant tokens from prior lookup results. The agent needs to be prepared to answer the customer fully.

What approach most reliably handles returning customers?

### Các lựa chọn trả lời

1. Resume with the full conversation and add a system prompt instruction that instructs the agent to prioritize resolving the pending refund.
2. Resume with state and configure the agent to automatically re-call all previous tool_results messages to ensure data freshness.
3. Start a new session, inject a structured summary of the previous interaction (issue type, resolution steps, current status), then make fresh tool calls as needed.
4. Create a new session with a structured summary of the previous interaction (issue type, resolution steps, current status), then make fresh tool calls as needed.

### Đáp án đúng

**3. Start a new session, inject a structured summary of the previous interaction (issue type, resolution steps, current status), then make fresh tool calls as needed.**

## Câu 061

### Câu hỏi

Your extraction pipeline processes invoices and extracts line items, subtotals, tax amounts, and grand totals. During evaluation, you discover that in 18% of extractions, the sum of extracted line item amounts doesn't match the extracted grand total—sometimes due to OCR errors in the source document, sometimes due to extraction mistakes by the model. Downstream accounting systems reject records with mismatched totals.

What's the most effective approach to improve extraction reliability?

### Các lựa chọn trả lời

1. Extract line items and totals independently, then use a separate validation model to reconcile discrepancies by determining which extracted values are most likely correct.
2. Add few-shot examples demonstrating invoices where extracted line items sum correctly to the stated total, encouraging the model to produce mathematically consistent extractions.
3. Implement post-processing that automatically adjusts line item amounts proportionally when their sum doesn't match the stated total.
4. Add a "calculated_total" field where the model sums extracted line items alongside a "stated_total" field. Flag records for human review when values differ.

### Đáp án đúng

**4. Add a "calculated_total" field where the model sums extracted line items alongside a "stated_total" field. Flag records for human review when values differ.**

## Câu 062

### Câu hỏi

An engineer asks your agent to identify untested code paths in a legacy payment processing module spanning 45 files. After reading the first 8 source files, the agent's responses are becoming noticeably less accurate — it's forgetting previously discussed code patterns and hasn't yet located all test files or traced critical payment flows.

What's the most effective approach to complete this investigation?

### Các lựa chọn trả lời

1. Spawn subagents to investigate specific questions (e.g., "find all test files for payment processing", "trace refund flow dependencies") while the main agent coordinates findings and preserves high-level understanding.
2. Clear context with /clear, then selectively re-read only the most critical files discovered so far, writing key findings to a scratchpad file that persists between context resets.
3. Document all current findings in a summary report, clear context completely, then use that report as the sole reference for continuing the investigation.
4. Switch to using Grep to search for specific function names instead of reading full files, reducing the content loaded into context for remaining exploration.

### Đáp án đúng

**1. Spawn subagents to investigate specific questions (e.g., "find all test files for payment processing", "trace refund flow dependencies") while the main agent coordinates findings and preserves high-level understanding.**

## Câu 063

### Câu hỏi

The coordinator agent has AgentDefinitions configured for all four specialized subagents, each with appropriate descriptions, prompts, and tool restrictions. During testing, you notice the coordinator correctly reasons about when to delegate — it generates messages like "I'll ask the web search agent to find sources on this topic" — but no subagent execution ever occurs. The coordinator then proceeds as if the delegation happened and continues with incomplete information. Logs show no errors.

What is the most likely cause?

### Các lựa chọn trả lời

1. The coordinator's allowedTools configuration doesn't include "Task", so while it can reason about delegation, it cannot invoke the tool required to spawn subagents.
2. The AgentDefinitions are configured correctly, but the coordinator's system prompt doesn't explicitly list the available subagent types, preventing the model from knowing they can be invoked.
3. Subagent context isolation means task descriptions from the coordinator don't automatically reach subagents; you need to configure explicit context forwarding in ClaudeAgentOptions.
4. The coordinator's max_tokens setting is too low, causing the Task tool invocation to be truncated before the subagent type parameter can be specified.

### Đáp án đúng

**1. The coordinator's allowedTools configuration doesn't include "Task", so while it can reason about delegation, it cannot invoke the tool required to spawn subagents.**

## Câu 064

### Câu hỏi

In production, you observe that simple fact-checking queries (e.g., "What year was the Paris Climate Agreement signed?") traverse all four subagents sequentially, consuming 40+ seconds and significant tokens per query. Complex comparative research benefits from the full pipeline. Your query distribution is diverse and evolving as users discover new applications.

What's the most effective approach to optimize for varying query complexity?

### Các lựa chọn trả lời

1. Train a query complexity classifier on labeled historical data to predict optimal subagent combinations, retraining periodically as query patterns evolve.
2. Create a fast-path for factual questions that bypasses subagents entirely, routing all other queries through the complete pipeline to ensure research thoroughness.
3. Implement pattern-based routing that categorizes queries by structure (single-fact vs. comparative vs. analytical) and maps each category to a predefined subagent combination.
4. Have the coordinator analyze each query and dynamically decide which subagents to invoke based on its assessment of query requirements.

### Đáp án đúng

**4. Have the coordinator analyze each query and dynamically decide which subagents to invoke based on its assessment of query requirements.**

## Câu 065

### Câu hỏi

Production logs reveal inconsistent error handling: when lookup_order fails, the agent sometimes retries 5+ times (wasteful when the order ID doesn't exist), sometimes escalates immediately (premature for temporary network issues), and sometimes asks users for clarification (inappropriate when the issue is a backend permission error). Investigation shows your MCP tool returns uniform error responses: {"isError": true, "content": [{"type": "text", "text": "Operation failed"}]}. The agent cannot distinguish between error types.

What's the most effective improvement?

### Các lựa chọn trả lời

1. Add few-shot examples to the system prompt demonstrating how to interpret error message patterns and select appropriate responses for each.
2. Enhance error responses with structured metadata: include errorCategory (transient/validation/permission), isRetryable boolean, and a description of what caused the failure.
3. Create an analyze_error MCP tool the agent calls after any failure to determine the error category and recommended action.
4. Implement retry logic with exponential backoff in your MCP server for all errors, returning to the agent only after retries are exhausted.

### Đáp án đúng

**2. Enhance error responses with structured metadata: include errorCategory (transient/validation/permission), isRetryable boolean, and a description of what caused the failure.**

## Câu 066

### Câu hỏi

Users report that final reports sometimes lack depth on specific subtopics. Investigation shows that the document analysis agent frequently identifies gaps—for instance, noting "the retrieved sources discuss API authentication but lack details on token refresh patterns"—but under the current strict pipeline, this insight isn't actionable since search has already completed.

What's the most effective architectural change?

### Các lựa chọn trả lời

1. Have the synthesis agent attach confidence scores to each section and flag areas with insufficient coverage for manual review.
2. Have the analysis agent report specific gaps to the coordinator, which triggers targeted searches and re-invokes analysis until sufficient.
3. Have the coordinator review analysis output for gap indicators and re-invoke search with gapinformed queries when gaps are detected.
4. Add a research planning agent before the search phase that decomposes topics into specific sub- questions.

### Đáp án đúng

**2. Have the analysis agent report specific gaps to the coordinator, which triggers targeted searches and re-invokes analysis until sufficient.**

## Câu 067

### Câu hỏi

This currently requires manually copy-pasting content into conversations. The team wants the agent to access this standard Jira ticket data directly.

What's the most effective approach?

### Các lựa chọn trả lời

1. Build a custom MCP server wrapping Jira's API with tools designed specifically for this team's code review workflow.
2. Export Jira tickets to markdown files in the repository that the agent accesses using the Read tool.
3. Use the Bash tool with curl to call Jira's REST API, including authentication headers and parsing JSON responses inline.
4. Integrate an existing Jira MCP server that exposes tickets, comments, and metadata through discoverable tool interfaces.

### Đáp án đúng

**4. Integrate an existing Jira MCP server that exposes tickets, comments, and metadata through discoverable tool interfaces.**

## Câu 068

### Câu hỏi

A critical bug is affecting production users. Error logs show exceptions in the OrderProcessing module with a clear stack trace pointing to a specific area, but you haven't worked with this module before.

What's the most effective approach?

### Các lựa chọn trả lời

1. Use direct execution to examine the stack trace, read the relevant code, and implement a fix once you identify the root cause.
2. Start with direct execution to gather initial information, then switch to plan mode to design a comprehensive solution before implementing.
3. Use plan mode to analyze the error in context of the module's design, enumerate potential root causes, and prioritize fixes systematically.
4. Enter plan mode to explore the module's architecture and dependencies before attempting any fix.

### Đáp án đúng

**1. Use direct execution to examine the stack trace, read the relevant code, and implement a fix once you identify the root cause.**

## Câu 069

### Câu hỏi

After deploying the automated review, you notice high precision but low recall — real bugs are slipping through undetected. Investigation reveals your review prompt instructs Claude to "only report high- confidence issues you are certain about" and "err on the side of not commenting." Developers appreciate the low noise, but a race condition that caused a production outage was visible in a reviewed PR and went unreported. You need to substantially improve bug detection while keeping false positive rates manageable for your team.

What is the most effective approach?

### Các lựa chọn trả lời

1. Add detailed few-shot examples demonstrating bug categories Claude should flag — race conditions, null dereferences, error handling gaps — while keeping the high-confidence filtering instruction to maintain current precision levels.
2. Split the review into a finding stage where Claude's goal is coverage — flagging every potential issue with confidence and severity metadata — and a separate stage that thresholds those findings.
3. Remove the conservative filtering instructions and prompt Claude to report all potential issues, then apply a programmatic filter to deduplicate and suppress categories that historically generate false positives.
4. Expand the context window by including related test files, recent git history, and the module's dependency graph alongside the diff, giving Claude richer signals to assess issue severity.

### Đáp án đúng

**2. Split the review into a finding stage where Claude's goal is coverage — flagging every potential issue with confidence and severity metadata — and a separate stage that thresholds those findings.**

## Câu 070

### Câu hỏi

Your remove_team_member tool uses a dry_run: boolean parameter for previewing impacts before execution. Production monitoring shows the agent bypasses the preview step in 15% of calls by calling with dry_run=false directly. You need to ensure every removal is preceded by a preview that the user explicitly confirms.

What is the most reliable approach?

### Các lựa chọn trả lời

1. Replace with two tools: preview_remove_member returns impact details and a single-use confirmation token; execute_remove_member requires that token, binding execution to the specific previewed action.
2. Add detailed instructions and few-shot examples to the tool description requiring the agent to always call with dry_run=true first and wait for user confirmation before calling with dry_run=false.
3. Add server-side validation that permits dry_run=false only when a dry_run=true call with identical parameters occurred within the past 60 seconds.
4. Annotate the tool as requiring confirmation and configure the orchestration layer to prompt the user for approval before forwarding any calls to annotated tools.

### Đáp án đúng

**1. Replace with two tools: preview_remove_member returns impact details and a single-use confirmation token; execute_remove_member requires that token, binding execution to the specific previewed action.**

## Câu 071

### Câu hỏi

Your invoice extraction uses tool use with strict JSON schemas. JSON syntax errors never occur, but 12% of extractions fail semantic validation--for example, line Item amounts don't extracted total, or vendor IDs don't match valid formats. These failures currently route to manual review.

What's the most effective approach to reduce manual review volume while maintaining accuracy?

### Các lựa chọn trả lời

1. Retry the extraction up to 3 times when validation fallis, accepting the first result that passes validation.
2. Add stricter schema constraints with detailed field descriptions to prevent the model from generating invalid values initially.
3. Implement post-processing logic that automatically corrects common amors, such as recalculating totais from line items when sums don't match.
4. When validation falls, make a follow-up request with the document, extraction, and validation errors for model correction.

### Đáp án đúng

**4. When validation falls, make a follow-up request with the document, extraction, and validation errors for model correction.**

## Câu 072

### Câu hỏi

Your system must extract event details from calendar invitations and output JSON that strictly conforms to a schema with fields for title, date, time, location, and attendees. Downstream reject any malformed or non- conformant JSON.

What approach provides the most reliable schema compliance?

### Các lựa chọn trả lời

1. Define a tool with your target schema as input parameters and have Claude call it with the extracted data.
2. Append instructions like "Output only valid JSON matching the schema exactly" and implement retry logic to re-prompt when JSON parsing fails.
3. Pre-fill Claude's response with an opening brace to force JSON output, then complete and parse the response.
4. Include detailed JSON formatting instructions and the target schema in your prompt, then parse Claude's text response as JSON.

### Đáp án đúng

**1. Define a tool with your target schema as input parameters and have Claude call it with the extracted data.**

## Câu 073

### Câu hỏi

Your extraction system uses tool_use with a JSON schema containing 12 fields and detailed descriptions, totaling approximately 2,500 tokens for the complete tool definition. Processing documents under 150K tokens yields 98% accuracy. For documents between 175-190K tokens, accuracy drops to 71%, with information from the final third consistently missed. The model's context window is 200K tokens.

What is the most likely cause?

### Các lựa chọn trả lời

1. Schemas exceeding 8-10 fields increase decision complexity during parameter generation, reducing extraction accuracy independent of document length.
2. The model distributes attention proportionally across input length, causing fields mentioned only once near the document's end to receive insufficient processing focus.
3. Tool definitions consume input context tokens. Combined with system prompts and document content, the total approaches the context limit, degrading end-of-document processing.
4. Very long documents exceed the model's effective attention span regardless of context limits, causing accuracy degradation for content farther from the prompt instructions.

### Đáp án đúng

**3. Tool definitions consume input context tokens. Combined with system prompts and document content, the total approaches the context limit, degrading end-of-document processing.**

## Câu 074

### Câu hỏi

The extraction pipeline receives documents of varying types—some are invoices, others are contracts, and some are receipts. You've defined separate extraction tools, each with its own schema tailored to the document type. During testing, you observe that with tool_choice: "auto", Claude sometimes returns conversational text instead of calling an extraction tool, causing downstream parsing failures. You need guaranteed structured output without knowing the document type in advance.

What's the most effective approach?

### Các lựa chọn trả lời

1. Add a preliminary classification call, then make a second call with tool_choice forced to the identified extraction tool.
2. Set tool_choice: "any" with all extraction tools defined.
3. Keep tool_choice: "auto" with system prompt instructions requiring tool use.
4. Consolidate all document types into a single unified-schema extraction tool and force that tool.

### Đáp án đúng

**2. Set tool_choice: "any" with all extraction tools defined.**

## Câu 075

### Câu hỏi

Monitoring shows 12% of extractions fall Pydantic validation with specific errors like "expected float for quantity, got '2 to 3". Retrying these requests without modification produces failures.

What's the most effective approach to recover from these validation failures?

### Các lựa chọn trả lời

1. Send a follow-up request including the validation error, asking the model to correct its output
2. Pre-process source documents to standardize problematic formats before sending them for extraction
3. Implement a secondary pipeline using a larger model tier to reprocess documents that fail validation
4. Set temperature to 0 to eliminate output variability and ensure consistent formatting

### Đáp án đúng

**1. Send a follow-up request including the validation error, asking the model to correct its output**

## Câu 076

### Câu hỏi

After three months of weekly sessions, your conversation history has grown to 85,000 tokens. When users ask "What did we conclude about the theme of isolation?", the assistant provides generic literary analysis rather than referencing the group's specific insights from earlier sessions. Discussions often build on previous meetings' conclusions, so maintaining narrative context is important.

What's the most effective approach?

### Các lựa chọn trả lời

1. Add structured XML tags to mark significant discussion conclusions throughout the conversation history.
2. Implement rolling window truncation to keep only the most recent 25,000 tokens.
3. Use semantic embedding to index the full conversation history and retrieve only relevant past exchanges for each user query, replacing the linear conversation format with retrieved segments.
4. Implement progressive summarization where older conversation blocks are replaced with concise summaries that explicitly extract key conclusions, decisions, and recurring themes, keeping recent exchanges verbatim.

### Đáp án đúng

**4. Implement progressive summarization where older conversation blocks are replaced with concise summaries that explicitly extract key conclusions, decisions, and recurring themes, keeping recent exchanges verbatim.**

## Câu 077

### Câu hỏi

You're Implementing a feature where users refine their playlist preferences through multiple conversation turns. After deploying, you notice Claude's responses don't reflect what us earlier in the same conversation— for example, a user says they love jazz, but two messages later Claude asks what genres they enjoy.

What is the most likely cause?

### Các lựa chọn trả lời

1. Claude requires a vector database connection to maintain conversation memory
2. The model's context window has been exceeded by the conversation length
3. Your application isn't including prior messages in the messages array
4. The Claude API requires a session_id parameter that you haven't configured

### Đáp án đúng

**3. Your application isn't including prior messages in the messages array**

## Câu 078

### Câu hỏi

Your home renovation planning assistant uses a system prompt defining an expert contractor persona with specific guidelines: always ask about budget, suggest alternatives at multiple price points, and confirm timeline requirements. During testing, responses follow these guidelines for turns 1-4, but by turn 7, the assistant gives generic advice without asking about budget or timeline. The conversation totals only 2,500 tokens.

What is the most likely cause?

### Các lựa chọn trả lời

1. The model's attention on system prompt instructions naturally weakens as turns accumulate.
2. The assistant's accumulated responses are diluting the system prompt's influence.
3. The system prompt is only sent with the first API request.
4. System prompts only establish initial behavior and don't persist across all turns.

### Đáp án đúng

**2. The assistant's accumulated responses are diluting the system prompt's influence.**

## Câu 079

### Câu hỏi

Users report that during extended conversations, the AI loses track of specific topics, examples, and preferences they mentioned earlier in the session. Your current implementation uses a sliding window that keeps only the most recent 25 message pairs to stay within context limits.

What's the most effective approach to maintain awareness of earlier conversation content while managing context size?

### Các lựa chọn trả lời

1. Increase the window size to 50 message pairs to retain more conversation history before truncation.
2. Replace the sliding window with a hybrid approach: summarize older messages while keeping recent messages verbatim.
3. Add a separate API call each turn to summarize messages being dropped, prepending this running summary to the conversation.
4. Implement vector similarity search over the full conversation history, retrieving relevant past messages for each user query.

### Đáp án đúng

**2. Replace the sliding window with a hybrid approach: summarize older messages while keeping recent messages verbatim.**

## Câu 080

### Câu hỏi

During QA testing, you notice that Claude follows your system prompt guidelines consistently in the first 10- 15 turns, but by turn 25-30, responses begin deviating—using informal tone when formality was specified, occasionally skipping required formatting, or providing information types the guidelines restrict. Conversation length is well within context limits (typically 30,000 tokens out of 200,000 available).

What's the most effective approach to maintain consistent behavior throughout extended conversations?

### Các lựa chọn trả lời

1. Insert user-role messages that reinforce critical guidelines at natural conversation breakpoints, especially before complex requests.
2. Automatically start a new conversation after 20 turns, passing a summary of the prior context to maintain continuity.
3. Implement post-response validation that regenerates each response until it conforms to the specified guidelines.
4. Move behavioral guidelines from the system prompt into the first user message.

### Đáp án đúng

**1. Insert user-role messages that reinforce critical guidelines at natural conversation breakpoints, especially before complex requests.**

## Câu 081

### Câu hỏi

During a conversation about order tracking, your external system receives a webhook indicating the user's package has shipped. The user is actively chatting and will likely send a follow-up message soon. You want the assistant to naturally incorporate this status change in its next response.

What's the most effective approach?

### Các lựa chọn trả lời

1. Append the status update as a prefix to the next user message before calling the API.
2. Configure the assistant to call a get_order_status tool at the start of every response.
3. Immediately send an API request with the update as a synthetic user message, generating an unsolicited assistant response.
4. Add the current shipping status to the system prompt before the next API call.

### Đáp án đúng

**4. Add the current shipping status to the system prompt before the next API call.**

## Câu 082

### Câu hỏi

Users report that responses feel repetitive across turns—each message begins with phrases like "Certainly!" or "I'd be happy to help!" even deep into conversations. You want responses to feel more natural, without these repetitive openers.

What's the most effective approach?

### Các lựa chọn trả lời

1. Append a partial assistant message with a direct response opening that the model will continue from
2. Implement post-processing to detect and strip common greeting phrases from response beginnings
3. Lower the temperature parameter to make response openings more deterministic and less variable
4. Add system prompt instructions specifying phrases to avoid, such as "Never begin responses with 'Certainly' or similar affirmations"

### Đáp án đúng

**1. Append a partial assistant message with a direct response opening that the model will continue from**

## Câu 083

### Câu hỏi

Users frequently send ambiguous requests like "book a venue for the party" without specifying date, guest count, or budget. Your evaluation shows the assistant asks an average of 4.2 clarifying questions before taking any action, causing 35% of users to abandon mid-conversation. However, when you reduce questions, users sometimes receive recommendations that don't match their preferences.

What's the most effective approach to improve this trade-off?

### Các lựa chọn trả lời

1. Instruct the assistant to state explicit assumptions based on conversation history, proceed with recommendations while inviting corrections, and reserve clarifying questions only for irreversible actions like confirming bookings.
2. Configure the assistant to proceed with reasonable defaults (medium-sized venue, next weekend, moderate budget) without explicitly stating these assumptions, allowing users to provide corrections if results don't match expectations.
3. Implement a structured intake form that collects all required parameters (date, guest count, budget, venue type) upfront before the assistant begins providing any recommendations.
4. Configure the assistant to consolidate all clarifying questions into a single compound question (e.g., "What date, guest count, and budget are you considering?") to reduce the total number of conversational turns.

### Đáp án đúng

**1. Instruct the assistant to state explicit assumptions based on conversation history, proceed with recommendations while inviting corrections, and reserve clarifying questions only for irreversible actions like confirming bookings.**

## Câu 084

### Câu hỏi

Your conversational AI tutor has a 2,800-token system prompt containing teaching methodology, persona guidelines, and detailed written instructions for adapting explanations to different proficiency levels. User testing reveals that in conversations exceeding 12 turns (approximately 4,000 tokens of conversation history), the assistant increasingly ignores the proficiency-adaptation guidelines, defaulting to intermediate-level explanations regardless of the learner's stated level.

What's the most effective approach to ensure consistent adherence to these guidelines throughout extended conversations?

### Các lựa chọn trả lời

1. Restructure the system prompt to place the proficiency-adaptation rules in a clearly-marked final section immediately before the conversation history begins.
2. Inject a condensed reminder of the proficiency requirements into the conversation as a system message every 4-5 turns.
3. Replace the verbose proficiency guidelines with few-shot examples demonstrating appropriate responses at each proficiency level, showing concrete differences in vocabulary, complexity, and explanation depth.
4. After each assistant response, make a separate API call to evaluate whether the difficulty level matched the learner's profile, regenerating responses that don't align.

### Đáp án đúng

**3. Replace the verbose proficiency guidelines with few-shot examples demonstrating appropriate responses at each proficiency level, showing concrete differences in vocabulary, complexity, and explanation depth.**

## Câu 085

### Câu hỏi

The system routes documents with extraction confidence below 85% to human review. A quarterly audit reveals that 12% of high-confidence extractions (>85%) also contain errors—cases where the model finds plausible-but-incorrect values. Error sources vary: comparison tables showing competitor specs, appendices referencing different product variants, and ambiguous phrasing the model misinterprets. You need a sustainable strategy to catch these high-confidence errors and measure whether improvements reduce the error rate over time.

What approach is most effective?

### Các lựa chọn trả lời

1. Add a verification pass that re-extracts from each high-confidence document, flagging cases where the two extraction attempts produce different results.
2. Implement stratified random sampling reviewing a fixed percentage of high-confidence extractions weekly, enabling error rate measurement and novel pattern detection.
3. Implement heuristic rules that flag documents containing comparison tables or appendices for review regardless of confidence score.
4. Lower the confidence threshold from 85% to 70%, routing a larger volume of extractions to human review.

### Đáp án đúng

**2. Implement stratified random sampling reviewing a fixed percentage of high-confidence extractions weekly, enabling error rate measurement and novel pattern detection.**

## Câu 086

### Câu hỏi

Your research assistant helps users analyze academic papers over extended conversations. User testing reveals a recurring issue: after conversations exceed 60K tokens, users ask follow-up questions requiring precise numerical details from papers discussed earlier—sample sizes, exact p-values, specific inclusion criteria. Your current approach summarizes paper discussions after 8 turns to stay within context limits. Users report that responses to these precision-dependent questions are often hedged or inaccurate.

What's the most effective architectural change?

### Các lựa chọn trả lời

1. Use a separate Claude call with explicit instructions to generate higher-fidelity summaries that preserve all numerical details and statistical values.
2. Implement retrieval that re-injects relevant paper sections when the user's question suggests they need specific numerical details.
3. Maintain a structured database of key facts extracted from each paper (sample sizes, statistics, methods) and retrieve relevant entries into context when precision-dependent questions are detected.
4. Keep source text from methodology and results sections in context permanently, while summarizing only the conversational discussion and interpretation portions.

### Đáp án đúng

**3. Maintain a structured database of key facts extracted from each paper (sample sizes, statistics, methods) and retrieve relevant entries into context when precision-dependent questions are detected.**

## Câu 087

### Câu hỏi

A security audit requires updating your authentication library from v2 to v3. The migration guide documents breaking changes: authenticate() now returns a Promise instead of accepting a callback, the User type has restructured fields, and three deprecated methods were removed. Grep shows the library is imported in 45 files across several modules.

What's the most effective approach?

### Các lựa chọn trả lời

1. Update the dependency version, run the test suite, and use Claude Code to fix each failure as it appears.
2. Enter plan mode to explore library usage across modules, map affected code paths, then create a migration strategy before implementing.
3. Create a custom slash command encapsulating the migration transformations, then execute it against each file without prior codebase exploration.
4. Paste the migration guide's breaking changes into your prompt and use direct execution to update all usages across the 45 files.

### Đáp án đúng

**2. Enter plan mode to explore library usage across modules, map affected code paths, then create a migration strategy before implementing.**

## Câu 088

### Câu hỏi

You've asked Claude Code to build a PDF report generation feature. The initial implementation queries the database correctly, but the output has formatting issues: table columns are too narrow causing content truncation, dates display without proper formatting, and page break handling is incorrect. You've noticed these issues interact— changing column widths affects how dates render, and page breaks depend on content height.

What's the most effective approach for iterating toward a working solution?

### Các lựa chọn trả lời

1. Start fresh with a detailed prompt specifying all formatting requirements upfront.
2. Provide all three issues in a single detailed message with exact specifications for each, allowing Claude to address them together in one update.
3. Show Claude an example of a correctly formatted report and ask it to match that output, rather than listing the specific technical issues.
4. Address the column width issue first with specific measurements, verify it works, then fix date formatting within the corrected columns, then adjust page breaks— testing after each change.

### Đáp án đúng

**4. Address the column width issue first with specific measurements, verify it works, then fix date formatting within the corrected columns, then adjust page breaks— testing after each change.**

## Câu 089

### Câu hỏi

You're implementing a new payment processing module that must follow your project's established patterns for database transactions, error handling, and audit logging. You've identified three existing modules that exemplify these patterns: db_utils.py, error_handlers.py, and audit_logger.py. This is a one-off integration task—these patterns are well-documented in your team wiki and don't need additional project-level documentation.

What's the most effective approach?

### Các lựa chọn trả lời

1. Add documentation of each pattern to your CLAUDE.md file, establishing them as project conventions that Claude will apply automatically.
2. Ask Claude to explore your codebase to find and understand the transaction, error handling, and logging patterns before generating the new module.
3. Describe the patterns from the three modules in natural language in your prompt, explaining the transaction handling approach, error format, and logging conventions Claude should follow.
4. Use @references to include the three modules directly in your prompt, giving Claude concrete code examples of the patterns to follow.

### Đáp án đúng

**4. Use @references to include the three modules directly in your prompt, giving Claude concrete code examples of the patterns to follow.**

## Câu 090

### Câu hỏi

Your monorepo contains shared coding standards in /docs/standards/security-rules.md (for services handling user data), testing-patterns.md (for all packages), and api-conventions.md (for API-facing services). Your 15 packages are organized by feature domain (/packages/auth/, /packages/billing/, /packages/notifications/, etc.) without naming conventions indicating which handle user data or expose APIs. Package maintainers are expected to configure their own local development settings, as they understand their package's domain requirements. Currently, all package CLAUDE.md files duplicate all three standards, applying irrelevant guidance.

What's the most effective approach?

### Các lựa chọn trả lời

1. Create a shared-standards.nd that uses @imports to combine all three standards, then have each package's CLAUDE.md import that combined file.
2. Put all standards in the root CLAUDE.md with override instructions like "ignore security-rules.md when working in packages that don't handle user data."
3. Create claude/rules/ files for each standard with YAML frontmatter paths listing every package directory where that standard should apply.
4. Use @imports in each package's CLAUDE.md to reference only the specific standard files relevant to that package, based on the maintainer's domain knowledge.

### Đáp án đúng

**4. Use @imports in each package's CLAUDE.md to reference only the specific standard files relevant to that package, based on the maintainer's domain knowledge.**

## Câu 091

### Câu hỏi

The system needs to extract candidate information (name, contact details, skills, work experience, education) from uploaded resumes. The extracted data must strictly conform to a predefined JSON schema, as missing required fields or incorrect data types will cause downstream validation failures.

What is the most reliable approach to ensure Claude's output consistently matches the schema?

### Các lựa chọn trả lời

1. Make two separate API calls—first extracting information as text, then asking Claude to format that text as JSON.
2. Define a tool with an input schema matching your required JSON structure and extract the data from Claude's tool_use response.
3. Include detailed JSON formatting instructions and a template example in the system prompt, asking Claude to output only valid JSON.
4. Parse Claude's text response with regex patterns to extract JSON objects, using retry logic for malformed responses.

### Đáp án đúng

**2. Define a tool with an input schema matching your required JSON structure and extract the data from Claude's tool_use response.**

## Câu 092

### Câu hỏi

Anthropic's tool use documentation states: "Write instructive error messages. Instead of generic errors like 'failed', include what went wrong and what Claude should try next." A billing dispute agent uses lookup_order, which catches all exceptions and returns a tool_result with is_error: true and the message "execution failed". Monitoring shows two failure modes: the agent retries the identical call until hitting the turn limit, or it immediately calls escalate_to_human without trying alternative tools.

Which change follows the documented recommendation and gives Claude the information it needs to select the correct recovery action for each error type?

### Các lựa chọn trả lời

1. Return error-type-specific messages with is_error: true, e.g., "order not found-try get_customer to search by phone" for data errors and "Database timeout (transient)-retry should succeed" for infrastructure errors.
2. Remove is_error: true and return the error details as normal tool content, so Claude reasons about the response as data rather than treating it as a flagged failure condition that biases retry behavior.
3. Add an error classification step in the agentic loop that intercepts tool errors before Claude sees them, tags each as "retry" "try_alternative," or "escalate," and adds that recommendation to the tool result.
4. Implement retry logic with exponential backoff inside each tool implementation so transient errors are resolved transparently within the tool before any failure result is surfaced to Claude in the agentic loop.

### Đáp án đúng

**1. Return error-type-specific messages with is_error: true, e.g., "order not found-try get_customer to search by phone" for data errors and "Database timeout (transient)-retry should succeed" for infrastructure errors.**

## Câu 093

### Câu hỏi

Production logs reveal inconsistent error handling: when tool_code fails, the agent sometimes retries 5 times (even if the tool_id doesn't exist), sometimes escalates immediately (premature for temporary network issues), and sometimes adds user-friendly explanation (inappropriate when the issue is a backend permission error). Investigation shows four MCP tool returns uniform error responses: {"status": "error", "content": "{"type": "Error", "message": "Operation failed."}"}.

The agent learns different types. What's the most effective improvement?

### Các lựa chọn trả lời

1. Create an analyze_error MCP tool the agent calls after any failure to determine the error category and recommended action.
2. Add a few-shot examples to the system prompt demonstrating how to interpret error message patterns and select appropriate responses for each.
3. Implement retry logic with exponential backoff in your MCP server for all errors, returning to the agent only after retries are exhausted.
4. Enhance error responses with structured metadata. Include error_category (transient/retriable/permission), reason, and a description of what caused the failure.

### Đáp án đúng

**4. Enhance error responses with structured metadata. Include error_category (transient/retriable/permission), reason, and a description of what caused the failure.**

## Câu 094

### Câu hỏi

Your code review prompts include both implementation changes and the corresponding test file, but the LLM's review comments fail to point out untested code paths. Analysis reveals the model correctly flags functions that have no tests at all, but fails to identify when conditional branches or error-handling paths within tested functions that have no tests at all, but fails to identify when conditional branches or error-handling paths within tested functio lack coverage.

What's the most effective way to improve detection of branch-level coverage gaps without overcomplicating the pipeline?

### Các lựa chọn trả lời

1. Add explicit instructions directing the model to enumerate each conditional branch and exception path, then verify each has a corresponding test assertion.
2. Restructure the prompt to interleave implementation and tests, presenting each function followed immediately by its test cases
3. Implement a multi-pass pipeline where separate LLM calls first extract all conditional branches, then cross-reference each against test assertions in a second pass.
4. Include few-shot examples showing code with an uncovered branch paired with the review comment identifying the specific missing test case.

### Đáp án đúng

**4. Include few-shot examples showing code with an uncovered branch paired with the review comment identifying the specific missing test case.**

## Câu 095

### Câu hỏi

Your pipeline uses a tool called extract_metadata with a JSON schema for paper details. You've also defined lookup_citations and verify_doi tools for enrichment. During testing, you notice that when users include requests like "extract the metadata and tell me how cited it is," Claude sometimes calls lookup_citations first, which fails because it needs the DOI that extract_metadata would provide.

What's the most effective way to ensure structured metadata extraction happens first?

### Các lựa chọn trả lời

1. Set tool_choice to {"type": "tool", "name": "extract_metadata"} and process the enrichment requests in subsequent turns after receiving the extracted metadata.
2. Set tool_choice to "any" so Claude must use a tool, combined with system prompt instructions prioritizing extract_metadata.
3. Set tool_choice to {"type": "tool", "name": "extract_metadata"} for every API call in the pipeline, ensuring Claude always extracts metadata before any enrichment can occur.
4. Set tool_choice to "auto" and reorder the tool definitions so extract_metadata appears first in the tools array, since Claude prioritizes earlier-listed tools.

### Đáp án đúng

**1. Set tool_choice to {"type": "tool", "name": "extract_metadata"} and process the enrichment requests in subsequent turns after receiving the extracted metadata.**

## Câu 096

### Câu hỏi

Your pipeline reviews every PR using a single API call with a static prompt containing the diff and full text of each changed file — unchanged files are not included. Reviews are posted asynchronously and don't block PR creation. Developers report that reviews consistently miss bugs involving cross-file interactions — for example, a PR renames a function's parameters but the review doesn't flag callers in unchanged files that still use the old argument order. Evaluation shows cross-file bugs account for 35% of production incidents from reviewed PRs.

What is the most effective change to your review design?

### Các lựa chọn trả lời

1. Add chain-of-thought instructions asking the model to list all external references in the diff, then reason step-by-step about how each change might affect callers in other files.
2. Run parallel review passes per changed file with direct dependents included in each pass, then aggregate and deduplicate findings using a final summarization call.
3. Use static analysis to build a dependency graph of changed code, then expand the prompt to include all files within two dependency hops of any changed file.
4. Redesign the review as a turn-limited agentic task where the model can read files and search the codebase via tools, following references to verify cross-file findings.

### Đáp án đúng

**4. Redesign the review as a turn-limited agentic task where the model can read files and search the codebase via tools, following references to verify cross-file findings.**

## Câu 097

### Câu hỏi

Your search Flights tool calls an external airline API that occasionally returns a 503 Service Unavailable error.

What is the most effective way to handle this error in your tool implementation?

### Các lựa chọn trả lời

1. Automatically retry the request up to five times with exponential backoff before returning results to the agent.
2. Return an empty flight list as if the search succeeded but found no matching flights.
3. Return an error message in the tool result explaining the service is temporarily unavailable.
4. Log the error internally and return an empty response, letting the model continue without the flight data.

### Đáp án đúng

**1. Automatically retry the request up to five times with exponential backoff before returning results to the agent.**

## Câu 098

### Câu hỏi

Your agent has a log_workout tool that accepts exercise_type (string), value (number), and measurement (string). Production monitoring shows the agent frequently passes mismatched combinations-using measurement: "reps" for cardio exercises like running, or measurement: "miles" for strength exercises like bench press. Your exercises naturally divide into two categories: cardio (measured in time or distance) and strength (measured in reps and sets). 23% of tool calls have invalid combinations.

What approach would most effectively reduce these errors?

### Các lựa chọn trả lời

1. Add enum constraints on measurement limiting values to "minutes", "miles", "reps", or "sets" to prevent arbitrary measurement strings.
2. Split into log_cardio_workout (with duration_minutes or distance_miles parameters) and log_strength_workout (with reps and sets parameters).
3. Implement server-side validation returning descriptive errors for invalid combinations, allowing the agent to retry with corrections.
4. Add explicit examples to the tool description showing valid combinations (e.g., "For running: use minutes or miles. For push-ups: use reps") with constraints for each exercise category.

### Đáp án đúng

**2. Split into log_cardio_workout (with duration_minutes or distance_miles parameters) and log_strength_workout (with reps and sets parameters).**

## Câu 099

### Câu hỏi

During initial testing, you notice that Claude doesn't seem to remember vocabulary words from earlier in the conversation. When a student asks "Can you quiz me on those words?", responds as if no words have been discussed.

What is the most likely explanation?

### Các lựa chọn trả lời

1. The model's context window has filled up, causing earlier conversation content to be dropped.
2. You need to enable conversation persistence by passing a session ID parameter with each API call.
3. Your system prompt needs explicit instructions telling Claude to remember information from earlier turns.
4. You're not including prior messages in each API request—the stateless API doesn't retain conversation history.

### Đáp án đúng

**4. You're not including prior messages in each API request—the stateless API doesn't retain conversation history.**

## Câu 100

### Câu hỏi

A new user's first message is "Set up my focus music," This could mean configure preferences, create a playlist, or play music immediately. Your system supports all three actions.

What's the effective approach?

### Các lựa chọn trả lời

1. Ask one clarifying question about action type: play now or configure for later
2. Create a new "Focus" playlist with curated tracks and notify the user it's ready.
3. Play popular focus tracks Immediately and let the user redirect if needed
4. Start preference configuration by asking about genres, temps, and artists they prefer for focus.

### Đáp án đúng

**1. Ask one clarifying question about action type: play now or configure for later**

## Câu 101

### Câu hỏi

Your conversational assistant frequently generates multiple clarifying questions when users make ambiguous requests. When a user asks "Can you help me with the report?", the assistant responds: "I'd be happy to help! Could you tell me: 1) Which report? 2) What kind of help—drafting, reviewing, or formatting? 3) What's your deadline?" User analytics show a 40% conversation abandonment rate after these multi-question responses.

What's the most effective way to reduce friction while appropriately handling ambiguity?

### Các lựa chọn trả lời

1. Create a lookup table of common request patterns with predefined default interpretations, having the assistant respond with those defaults without stating the assumptions made.
2. Modify the system prompt to instruct the assistant to make reasonable assumptions from available context, state those assumptions explicitly, and offer to adjust if the interpretation is wrong.
3. Limit the assistant to one clarifying question per turn, using conversation history to accumulate answers over multiple exchanges rather than requesting everything upfront.
4. Add a preprocessing step using a smaller model to classify request ambiguity on a 1-5 scale, routing high-ambiguity requests to a clarification dialog and low-ambiguity requests directly to the assistant.

### Đáp án đúng

**2. Modify the system prompt to instruct the assistant to make reasonable assumptions from available context, state those assumptions explicitly, and offer to adjust if the interpretation is wrong.**

## Câu 102

### Câu hỏi

You need to add a date validation check ensuring event dates are in the future. This requires adding a conditional statement to one existing function in a single file.

What is the most appropriate approach?

### Các lựa chọn trả lời

1. Use direct execution to make the change
2. Enter plan mode first to create a detailed implementation strategy before making the change
3. Start with extended thinking mode enabled to ensure thorough reasoning about the validation logic
4. Enter plan mode to analyze how the validation might impact other parts of the reservation flow

### Đáp án đúng

**1. Use direct execution to make the change**

## Câu 103

### Câu hỏi

Your team's CLAUDE.md includes a rule: "Use 4-space indentation and always run Prettier formatting." Despite this, code reviews reveal that roughly 30% of files Claude Code generates use inconsistent formatting — sometimes 2-space indentation, sometimes missing trailing commas. Adding emphasis ("IMPORTANT: You MUST use Prettier formatting") reduces violations to about 15%, but doesn't eliminate them.

What is the most effective way to ensure all generated code is consistently formatted?

### Các lựa chọn trả lời

1. Add a Stop hook with a prompt-based check that evaluates whether generated code follows formatting standards and prompts Claude to fix violations.
2. Configure a Post ToolUse hook with an Edit|Write matcher that automatically runs Prettier on each file Claude modifies.
3. Extract the formatting rules into a dedicated skill that Claude loads automatically when generating code, with more detailed examples of correct formatting.
4. Split the formatting rules into path-scoped .claude/rules/ files that load when Claude works on matching file types.

### Đáp án đúng

**2. Configure a Post ToolUse hook with an Edit|Write matcher that automatically runs Prettier on each file Claude modifies.**

## Câu 104

### Câu hỏi

You're implementing a caching layer for API responses to speed up the /products endpoint. You have a rough idea—Redis with a 5-minute TTL—but you're new to production caching and aren't sure what other considerations a robust implementation requires.

What's the most effective way to start your iterative workflow?

### Các lựa chọn trả lời

1. Write a specification with your known requirements and "TBD" markers for uncertain areas, having Claude propose solutions for each TBD as it implements.
2. Ask Claude to interview you about the caching requirements before implementing, surfacing considerations like invalidation strategies, cache layers, consistency guarantees, and failure modes.
3. Use plan mode to analyze the current/products endpoint implementation, then provide your caching requirements once Claude explains how the existing code is structured.
4. Start with a minimal request: "Add Redis caching to/products with 5-minute TTL." Add features and fix issues through follow-up prompts as problems surface during testing.

### Đáp án đúng

**2. Ask Claude to interview you about the caching requirements before implementing, surfacing considerations like invalidation strategies, cache layers, consistency guarantees, and failure modes.**

## Câu 105

### Câu hỏi

You've asked Claude to write a data migration script, but the initial output doesn't correctly handle records with null values in required fields.

What's the most effective way to iterate toward a working solution?

### Các lựa chọn trả lời

1. Manually edit the generated code to fix the null handling, then continue working with Claude on other parts.
2. Add "think harder about edge cases" to your prompt and request a complete rewrite of the migration logic.
3. Provide a test case with example input containing null values and the expected output, then ask Claude to fix it.
4. Describe the null value problem in detail and ask Claude to regenerate the entire script with improved edge case handling.

### Đáp án đúng

**3. Provide a test case with example input containing null values and the expected output, then ask Claude to fix it.**

## Câu 106

### Câu hỏi

Production monitoring shows the research phase takes longer than expected. Analysis reveals the coordinator invokes the web search subagent, then invokes the document analysis subagent and waits again. These tasks are independent—neither requires the other's output.

What is the most effective way to run these subagents concurrently?

### Các lựa chọn trả lời

1. Switch both subagents to use a Haiku-tier model instead of Sonnet to reduce their individual execution time.
2. Structure the coordinator to emit both Task tool calls (for web search and document analysis) in a single response message.
3. Create an async orchestration layer outside the agent that spawns parallel threads, each running a separate coordinator.
4. Add detailed instructions to the coordinator's system prompt explaining the performance benefits of parallel execution at the same time.

### Đáp án đúng

**2. Structure the coordinator to emit both Task tool calls (for web search and document analysis) in a single response message.**

## Câu 107

### Câu hỏi

Your automated review calls the Claude API for each PR, using tool_use with a report_findings tool that returns a JSON array of finding objects (each with file_path, line_number, severity, category, and description). During testing on a large PR touching 30+ files, the response hits the max_tokens limit and the output is truncated mid-JSON, causing your pipeline's parser to fail.

What is the most effective way to handle this?

### Các lựa chọn trả lời

1. Increase max_tokens to the model's maximum and instruct Claude to keep finding descriptions under 50 words each.
2. Switch from tool_use to prompting Claude to return findings as a markdown list.
3. Add retry logic that detects truncated JSON and re-sends the request with instructions to report only critical and high severity findings.
4. Split the review into multiple API calls that each analyze a subset of the changed files, then merge the resulting findings arrays.

### Đáp án đúng

**4. Split the review into multiple API calls that each analyze a subset of the changed files, then merge the resulting findings arrays.**

## Câu 108

### Câu hỏi

An engineer sees an unfamiliar error message "SYNC_CONFLICT: entity version mismatch detected" in production logs but doesn't know which of the 12 services in the codebase generates it. They ask the agent to help locate the source code.

What exploration approach will most efficiently find the responsible code?

### Các lựa chọn trả lời

1. Read the project's README and service configuration files to understand the architecture, then systematically Read source files in service directory.
2. Use Grep to search for distinctive text from the error message (like "SYNC_CONFLICT" or "entity version mismatch"), then Read the matching files to understand context.
3. Use Grep to find all files that import the project's error handling module, then Read those files to locate custom error definitions.
4. Use Glob to find files in directories commonly associated with error handling (such as errors/, exceptions/, or handlers/) across services, then Read each matching file.

### Đáp án đúng

**2. Use Grep to search for distinctive text from the error message (like "SYNC_CONFLICT" or "entity version mismatch"), then Read the matching files to understand context.**

## Câu 109

### Câu hỏi

An engineer asks your agent to add comprehensive tests to a legacy codebase with 200 files and minimal existing test coverage. The engineer hasn't specified which modules to prioritize.

How should the agent decompose this open-ended task?

### Các lựa chọn trả lời

1. Start writing tests for the first module alphabetically, using test failures and imports to discover related files organically.
2. Use Glob and Grep to map codebase structure, identify heavily-coupled modules, create a prioritized plan for high-impact areas, and revise as dependencies are discovered.
3. Systematically read all 200 files to create a complete function inventory before writing any tests, ensuring the testing plan accounts for every function before beginning.
4. Create a fixed testing schedule upfront based on directory structure, allocating equal effort to each top-level directory regardless of code complexity or business importance.

### Đáp án đúng

**2. Use Glob and Grep to map codebase structure, identify heavily-coupled modules, create a prioritized plan for high-impact areas, and revise as dependencies are discovered.**

## Câu 110

### Câu hỏi

Your productivity agent connects to three MCP servers: an issue tracker (search_issues, get_issue, create_comment), a documentation wiki (search_docs, get_page, list_spaces), and a database explorer (run_query, get_schema, list_databases). When engineers ask cross-system questions like "What database tables are affected by the authentication refactor in PROJ-1234?", monitoring shows the agent makes 8-10 sequential tool calls, frequently issues exploratory calls because it lacks visibility into what content each server contains, and exhausts context space before completing complex investigations.

What architectural change best leverages MCP capabilities to address these issues?

### Các lựa chọn trả lời

1. Add a prepare_investigation tool to each server that accepts a natural language question and returns relevant content summaries
2. Add an orchestrator that routes questions to a single server based on keywords
3. Expose each server's content catalog as MCP resources—issue summaries, documentation hierarchy, database schemas
4. Consolidate all three servers into a unified MCP server with cross-referencing capabilities

### Đáp án đúng

**3. Expose each server's content catalog as MCP resources—issue summaries, documentation hierarchy, database schemas**

## Câu 111

### Câu hỏi

The synthesis agent completes its initial pass but flags that three key research questions remain unanswered because the web search and document analysis agents didn't find relevant information on those specific subtopics. The coordinator currently proceeds directly to report generation, producing reports with incomplete coverage.

What change would most effectively improve research completeness?

### Các lựa chọn trả lời

1. Give the synthesis agent direct access to web search tools so it can autonomously fill knowledge gaps without returning control to the coordinator.
2. Have the report generation agent note which research questions couldn't be answered, so users understand the limitations of the final output.
3. Have the coordinator evaluate synthesis output for gaps, then re-delegate to web search and document analysis with targeted queries before Invoking synthesis again.
4. Increase the initial breadth of queries sent to web search and document analysis to reduce the probability of missing relevant information.

### Đáp án đúng

**3. Have the coordinator evaluate synthesis output for gaps, then re-delegate to web search and document analysis with targeted queries before Invoking synthesis again.**

## Câu 112

### Câu hỏi

Your documents (query) tool returns results as "Found 3 documents: Q2 Budget Proposal, Q2 Budget Forecast, Annual Review". You want the agent to document (4, multi) and doc (24, multi).

What return format would best enable these multi-step workflows?

### Các lựa chọn trả lời

1. More detailed human-readable descriptions including the size and authors.
2. Structured data containing document IDs and metadata for each result.
3. URLs that users can click to open the document in their browser.
4. A JSON array of document titles extracted from the search results.

### Đáp án đúng

**2. Structured data containing document IDs and metadata for each result.**

## Câu 113

### Câu hỏi

Your agent has access to 50+ specialized API connectors for different external services. As the connector library grew, tool selection accuracy dropped to 58%. You design a search_connectors(description) tool that finds matching connectors, but in testing agents frequently skip searching and call connectors directly (often incorrectly), or search select wrong connectors from the filtered results.

How should you design the tool composition pattern to address both issues?

### Các lựa chọn trả lời

1. Enhance all connector descriptions with detailed usage samples, edge cases, and input requirements. Add few-shot examples showing the correct search-then-use workflow.
2. Design a find_and_execute(description, params) composite tool that searches and immediately executes the best matching connector.
3. Design search_connectors to dynamically add matched connectors to the agent's available tools. Connectors start unavailable and persist once discovered.
4. Design connectors with built-in compatibility validation that return descriptive errors for mismatched requests.

### Đáp án đúng

**3. Design search_connectors to dynamically add matched connectors to the agent's available tools. Connectors start unavailable and persist once discovered.**

## Câu 114

### Câu hỏi

Your publish article tool calls an external CMS API that occasionally returns transient errors (network timeouts, 503s) and non-transient errors (403 permission denied, 422 validation failure). Currently, every error is returned directly to the agent, which leads to the agent retrying non-transient errors and wasting turns on failures that will never succeed.

How should you partition error-handling responsibility between the tool implementation and the agent?

### Các lựa chọn trả lời

1. Handle transient errors (timeouts, 503s) with automatic retries inside the tool implementation, and surface non-transient errors (permission denied, validation fallures) to the agent with descriptive messages so it can take corrective action.
2. Surface all errors to the agent immediately with detailed context, and let the agent decide which errors to retry and how many times-keeping the tool implementation stateless and simple.
3. Implement a universal error handler that catches all exceptions and returns a generic "tool unavailable- try again later" message, shielding the agent from error complexity.
4. Handle all errors inside the tool: Implement retries with exponential backoff for every error type, and only surface a failure to the agent after a fixed number of retry attempts have been exhausted.

### Đáp án đúng

**1. Handle transient errors (timeouts, 503s) with automatic retries inside the tool implementation, and surface non-transient errors (permission denied, validation fallures) to the agent with descriptive messages so it can take corrective action.**

## Câu 115

### Câu hỏi

Your scheduling agent uses get_available_slots(date, provider_id) to retrieve open appointment times, then book_appointment(provider_id, slot_time, patient_id) to reserve a slot. tickets show that 15% of booking attempts fall with "slot no longer available" because another user booked the slot between the availability check and the booking call.

How should you refactor these tools?

### Các lựa chọn trả lời

1. Add a hold_slot(provider_id, slot_time) tool that creates a 60 second temporary reservation, requiring the agent to call it between checking availability and booking.
2. Modify book_appointment to return detailed failure information including currently available alternative slots when the requested slot is unavailable, enabling the agent to retry with a different time.
3. Combine both tools into a single find_and_book_appointment that atomically checks availability and books, returning either the confirmed booking or available alternatives.
4. Keep both tools but add retry logic to the agent's system prompt, instructing it to call get_available_slots again and select a different time if booking fails.

### Đáp án đúng

**3. Combine both tools into a single find_and_book_appointment that atomically checks availability and books, returning either the confirmed booking or available alternatives.**

## Câu 116

### Câu hỏi

Production monitoring shows your search_catalog tool fails 12% of the time: 8% are network timeouts that succeed when immediately retried, while 4% are query syntax errors from malformed user-provided filters that never succeed regardless of retry attempts. Currently, both error types are returned to the agent identically, causing it to waste turns retrying syntax errors and telling users to "try again later" for timeouts.

How should you modify the tool's error handling?

### Các lựa chọn trả lời

1. Implement automatic retry with backoff for network timeouts inside the tool; return syntax errors immediately with parameter validation details.
2. Add few-shot examples to your system prompt demonstrating how to distinguish network errors from syntax errors and handle each case appropriately.
3. Apply exponential backoff retry logic to all errors uniformly, returning a generic "service temporarily unavailable" message after max retries are exhausted.
4. Return all errors with a retryable boolean flag and error type details.

### Đáp án đúng

**1. Implement automatic retry with backoff for network timeouts inside the tool; return syntax errors immediately with parameter validation details.**

## Câu 117

### Câu hỏi

Your document extraction tool uses ML models to extract invoice fields (vendor, amount, date). The models return confidence scores (0.0-1.0) for each extracted field. In production, you observe: (1) the agent proceeds with low-confidence extractions that are incorrect 23% of the time, and (2) the agent requests unnecessary human review for 31% of extractions that were actually correct.

How should you restructure the tool's output?

### Các lựa chọn trả lời

1. Compute an aggregate extraction quality score across all fields and return it alongside the extracted values. Include a text summary describing the overall extraction reliability.
2. Return fields organized into verified and needs_verification objects based on confidence thresholds.
3. Return fields with confidence scores, plus a requires_review boolean computed using your tested confidence thresholds, along with a review_reasons array explaining which fields triggered review.
4. Return fields with their raw confidence scores and add detailed few-shot examples to your system prompt demonstrating how to interpret different confidence ranges and when to request human review.

### Đáp án đúng

**3. Return fields with confidence scores, plus a requires_review boolean computed using your tested confidence thresholds, along with a review_reasons array explaining which fields triggered review.**

## Câu 118

### Câu hỏi

Your agent includes an update_game_score tool that accepts game_date (string), home_team (string), and away_team (string) parameters. Production logs reveal recurring issues: the agent uses team nicknames instead of official names, applies inconsistent date formats, and selects the wrong game when teams have rematches in the same season.

What tool interface change would effectively prevent these errors?

### Các lựa chọn trả lời

1. Add a season parameter to disambiguate rematches, and add a confirm_before_update flag that returns the resolved game details for the agent to verify before the score is committed.
2. Add enum constraints listing valid team names for both team parameters, and add a regex pattern enforcing ISO 8601 format for the date parameter.
3. Add detailed examples to the tool description showing the required date format and complete list of official team names.
4. Replace the three parameters with a single game_id parameter and a separate search_games lookup tool that returns matching game IDs.

### Đáp án đúng

**4. Replace the three parameters with a single game_id parameter and a separate search_games lookup tool that returns matching game IDs.**

## Câu 119

### Câu hỏi

You've configured the system so that all four subagents have access to the complete set of 18 tools. During testing, agents frequently call tools outside their specialization—the synthesis agent attempts web searches, and the report generator tries to analyze documents.

What is the primary cause of this poor tool selection behavior?

### Các lựa chọn trả lời

1. The agents' role descriptions in their system prompts conflict with having access to tools outside that role.
2. Choosing from 18 tools instead of 4-5 relevant ones increases decision complexity beyond reliable selection thresholds.
3. The tool definitions consume too much context window space, leaving insufficient room for task content.
4. The coordinator cannot track which capabilities each subagent has, leading to misrouted tasks.

### Đáp án đúng

**2. Choosing from 18 tools instead of 4-5 relevant ones increases decision complexity beyond reliable selection thresholds.**

## Câu 120

### Câu hỏi

You've documented API error handling conventions in a CLAUDE.md file at your project root, specifying that endpoint handlers should use a custom ApiError class. After several sessions, you notice Claude Code sometimes follows these conventions and sometimes uses generic try/catch blocks with string messages. The inconsistency appears random across different coding sessions.

What's the most efficient first diagnostic step?

### Các lựa chọn trả lời

1. Create path-specific rules in claude/rules/handlers.md with YAML frontmatter scoping the error handling instructions to your API handler files.
2. Search for conflicting instructions in ~/.claude/CLAUDE.md or ~/.claude/rules/ that might override your project conventions.
3. Run /memory to check which memory files are loaded and verify your CLAUDE.md is included.
4. Add more detailed code examples to your CLAUDE.md showing the exact ApiError usage pattern for different endpoint types.

### Đáp án đúng

**3. Run /memory to check which memory files are loaded and verify your CLAUDE.md is included.**

## Câu 121

### Câu hỏi

Your CI pipeline performs security-focused code reviews on approximately 50 PRs daily, currently costing $150/day using the synchronous API. Reviews are non-blocking—developers merge after tests pass and address findings in follow-up commits. You're evaluating the Message Batches API for its 50% cost reduction.

What factor most determines whether batch processing is appropriate for this use case?

### Các lựa chọn trả lời

1. Whether review feedback arriving up to 24 hours after PR creation remains actionable.
2. Whether reducing per-review latency from 30-60 seconds to near-instant matters for your workflow.
3. Whether your result processing can handle reviews arriving in a different order than submitted.
4. Whether you can structure each review as a single request without multi-turn refinement.

### Đáp án đúng

**1. Whether review feedback arriving up to 24 hours after PR creation remains actionable.**

## Câu 122

### Câu hỏi

After a 40-minute session helping plan a dinner party, the conversation has grown to 78,000 tokens. The history includes: (1) the user mentioning a guest has a severe shellfish allergy, (2) measurements for scaling recipes to 8 servings, (3) the user's clarification that "room temperature butter" means 68°F in their kitchen, and (4) general back-and-forth about meal timing and presentation. You need to implement context management before the window limit is reached.

What approach best balances information preservation with token reduction?

### Các lựa chọn trả lời

1. Extract critical structured data (allergies, serving counts, user-defined terms) into a compact reference section, summarize general discussion, and retain recent exchanges verbatim.
2. Summarize the entire conversation history into a concise summary capturing main topics discussed, then append new messages going forward.
3. Implement a sliding window retaining only the most recent 20,000 tokens relying on users to re-state important information when relevant.
4. Store the full conversation externally and use semantic search to retrieve relevant portions for each turn, loading only matching segments into context.

### Đáp án đúng

**1. Extract critical structured data (allergies, serving counts, user-defined terms) into a compact reference section, summarize general discussion, and retain recent exchanges verbatim.**

## Câu 123

### Câu hỏi

Your resource allocation tool returns a simple acknowledgment message after provisioning is requested. Users frequently approve allocations and immediately ask "how much did that cost?" or "which project was that?" - indicating they confirmed without understanding the request.

What tool design change would most effectively address this?

### Các lựa chọn trả lời

1. Implement a 60-second hold before execution completes, allowing users time to review pending allocations and cancel if needed
2. Return structured data including cost estimate, target project, resource specifications, and impact summary in the tool response
3. Add a detail_level parameter with options "minimal" or "comprehensive" that controls how much context the agent presents in confirmations
4. Add a user_acknowledged: boolean parameter that must be set true, with instructions for the agent to only set it after the user explicitly confirms they reviewed the details

### Đáp án đúng

**2. Return structured data including cost estimate, target project, resource specifications, and impact summary in the tool response**

## Câu 124

### Câu hỏi

Your search products tool queries an external catalog API that returns paginated results (50 items per request). Production logs show queries frequently match 200+ products, and the design that auto-fetches all pages causes 15-20 second delays.

How should you redesign the pagination handling?

### Các lựa chọn trả lời

1. Create separate search products and fetch more results tools for pagination.
2. Add a max pages parameter (default: 2) that controls how many pages are fetched internally.
3. Implement server-side relevance ranking and return only the top 50 most relevant items.
4. Return the first page with total match count and cursor for additional pages.

### Đáp án đúng

**4. Return the first page with total match count and cursor for additional pages.**

## Câu 125

### Câu hỏi

Your MCP server implements a check_availability tool that queries an external calendar API. During testing, you encounter three error conditions: (1) the tool is called with a malformed request, missing the required user_email parameter (2) the calendar API returns a 404 because the specified user doesn't exist in the calendar system (3) the calendar API returns a 503 because the service is temporarily unavailable.

How should each error be reported according to MCP's error handling design?

### Các lựa chọn trả lời

1. Report errors 1 and 2 as JSON-RPC protocol errors, report error 3 as a tool result with isError: true
2. Report error 1 as a JSON-RPC protocol error, report errors 2 and 3 as tool results with isError: true
3. Report all three as tool results with isError: true
4. Report all three as JSON-RPC protocol errors.

### Đáp án đúng

**2. Report error 1 as a JSON-RPC protocol error, report errors 2 and 3 as tool results with isError: true**

## Câu 126

### Câu hỏi

Your system has been running for 3 weeks and human reviewers have corrected 847 extractions. Analysis reveals a recurring pattern: when recipes use informal measurements like "a handful" or "a splash," the model either invents specific amounts or leaves fields empty—accounting for 23% of all corrections.

How should you use this feedback to improve extraction accuracy?

### Các lựa chọn trả lời

1. Add few-shot examples to your prompt demonstrating correct handling of informal measurements— extracting them verbatim rather than converting or omitting them.
2. Update your JSON schema to add a "measurement_type" enum field (precise/informal).
3. Implement a post-processing layer that uses pattern matching to detect informal measurement phrases in source text and automatically populate values when the extraction is empty.
4. Fine-tune the model on the 847 corrected extractions.

### Đáp án đúng

**1. Add few-shot examples to your prompt demonstrating correct handling of informal measurements— extracting them verbatim rather than converting or omitting them.**

## Câu 127

### Câu hỏi

"You're the Lead Data Scientist/Engineer on a critical project. Something is not completely right with technical details or the data, and it negative impacts expected outputs. They need to independently develop both approaches to evaluation data...

How do you manage this scenario?"

### Các lựa chọn trả lời

1. Resume the analysis session with fork_session enabled, creating a separate branch for each testing strategy.
2. Continue in the original session, developing end-to-end tests first, then snapshot tests sequentially.
3. Export the analysis session's key findings to a file, then create two new sessions that reference this file.
4. Start two fresh sessions, having each re-read the relevant source files before beginning.

### Đáp án đúng

**1. Resume the analysis session with fork_session enabled, creating a separate branch for each testing strategy.**

## Câu 128

### Câu hỏi

Your automated reviewer uses a single prompt covering security issues, API design, and business logic correctness. Your evaluation suite shows strong recall findings (82%) but poor recall for business logic edge cases in quiz scoring (34%). When you add few-shot examples of logic bugs to the prompt, logic recall is 41% but API design recall drops to 68%.

How should you address this trade-off to improve detection across both categories?

### Các lựa chọn trả lời

1. Replace the few-shot examples with a detailed checklist of specific logic edge cases to verify, such as division-by-zero in score calculation or grading thresholds.
2. Upgrade to a more capable model tier, since its stronger reasoning will handle both concern types in a single prompt and eliminate the recall trade-off.
3. Split the review into separate focused prompts - one for security and API design, another for business logic - each with dedicated examples, then combine findings before posting.
4. Provide the full repository as context instead of just the changed files and surrounding code, giving the model deeper visibility into business logic.

### Đáp án đúng

**3. Split the review into separate focused prompts - one for security and API design, another for business logic - each with dedicated examples, then combine findings before posting.**

## Câu 129

### Câu hỏi

Your code review assistant needs to analyze pull requests and provide feedback on three aspects: code style compliance, potential security issues, and documentation completeness. Each aspect requires reading files, running analysis tools, and generating a report section. The review process follows the same three-step workflow for every PR.

Which task decomposition pattern is most appropriate for this workflow?

### Các lựa chọn trả lời

1. Routing—classify each PR by type (feature, bugfix, refactor) first, then route to different review prompts optimized for that category.
2. Prompt chaining—break the review into sequential steps where each aspect (style, security, documentation) is analyzed separately, with outputs combined in a final synthesis step.
3. Single comprehensive prompt—include all instructions in one prompt and let the model handle all three aspects simultaneously.
4. Orchestrator-workers—have a central LLM analyze each PR to dynamically determine which checks are needed, then delegate to specialized worker LLMs for each identified subtask.

### Đáp án đúng

**2. Prompt chaining—break the review into sequential steps where each aspect (style, security, documentation) is analyzed separately, with outputs combined in a final synthesis step.**

## Câu 130

### Câu hỏi

After the web search and document analysis subagents complete their tasks, the coordinator needs to spawn the synthesis subagent to synthesize the findings.

What is the correct approach for providing the synthesis subagent with the information it needs?

### Các lựa chọn trả lời

1. Pass reference identifiers and configure the subagent with read access to a shared memory store where other subagents deposited their results
2. Include the complete findings from both subagents directly in the synthesis subagent's prompt
3. Provide the subagent with tool definitions that allow it to request outputs from other subagents via callbacks
4. Spawn the subagent with only a brief task description, relying on automatic context inheritance from the coordinator

### Đáp án đúng

**1. Pass reference identifiers and configure the subagent with read access to a shared memory store where other subagents deposited their results**

## Câu 131

### Câu hỏi

Developer Productivity An engineer asks the agent to find all files in the monorepo that import the @company/auth package to understand how authentication is used across services.

Which built-in tool is most appropriate for this task?

### Các lựa chọn trả lời

1. Read, starting with package.json files to trace dependency declarations
2. Bash, to execute find . -type d -name "*auth*" and explore matching directories
3. Glob, to find files with "auth" in their filename or path
4. Grep, to search for the import statement pattern across file contents

### Đáp án đúng

**4. Grep, to search for the import statement pattern across file contents**

## Câu 132

### Câu hỏi

Your MCP server includes archive_file(file_id) and delete_file(file_id) tools. Production logs show the agent calls delete_file when users ask to "remove old backups," policy requires archiving backup files. Both tools currently have minimal descriptions: "Archives a file" and "Deletes a file."

Which change most directly improves tool selection?

### Các lựa chọn trả lời

1. Implement server-side validation that rejects delete_file calls for files tagged as backups, returning an error message suggesting archive_file.
2. Expand tool descriptions to clarify use cases, adding guidance like "Do not use for backup files" to delete_file.
3. Add few-shot examples to the system prompt demonstrating that requests involving "backup" or "old" should use archive_file.
4. Add a confirmation step that requires users to type "CONFIRM DELETE" before delete_file executes.

### Đáp án đúng

**2. Expand tool descriptions to clarify use cases, adding guidance like "Do not use for backup files" to delete_file.**

## Câu 133

### Câu hỏi

Your CRM agent's delete_contact tool handles requests like "delete the duplicate entry for Acme Corp." The database contains similarly named records (e.g., "Acme Corp," "Acme Corporation," "ACME Corp Inc."), and analytics show 8% of deletions are reversed within 24 hours due to misidentified records. Users have also complained that the current multi-step confirmation flow adds too much friction to routine cleanup tasks.

Which approach most effectively reduces the error rate while maintaining workflow efficiency?

### Các lựa chọn trả lời

1. Require users to supply the exact record ID from the CRM Interface rather than using natural language references to contact names.
2. Present matched records with differentiating fields and require single-click confirmation of the intended target before executing deletion.
3. Implement soft-delete with a 30-day recovery window so users can undo mistakes without slowing down the deletion workflow.
4. Deploy automated duplicate detection that identifies and merges probable duplicates, removing the need for manual deletion requests.

### Đáp án đúng

**2. Present matched records with differentiating fields and require single-click confirmation of the intended target before executing deletion.**

## Câu 134

### Câu hỏi

Your team is extracting structured data from 50,000 legacy legal contracts under a two-week deadline. Initial testing with 500 sample documents shows 82% pass JSON schema first attempt, while the remaining 18% fall due to diverse issues—missing required fields, malformed dates, and incorrectly identified parties. Documents that fail typically need refinements targeting their specific failure modes before extraction succeeds.

Which batch processing strategy is the most cost-efficient while still meeting the deadline?

### Các lựa chọn trả lời

1. Submit all 50,000 documents via batch API, then submit failed extractions in successive batches— refining prompts between each batch—until all documents pass validation.
2. Process 2,000 sample documents via real time API to identify failure patterns and refine prompts, then batch process all 50,000 with the optimized prompts.
3. Split documents into 10 sequential batches of 5,000 each, analysing results and refining prompts between batches to improve extraction quality progressively.
4. Use the real-time API for all 50,000 documents since the batch API's 24-hour processing window creates unacceptable deadline risk.

### Đáp án đúng

**1. Submit all 50,000 documents via batch API, then submit failed extractions in successive batches— refining prompts between each batch—until all documents pass validation.**

## Câu 135

### Câu hỏi

After deploying an updated system prompt that improves response quality, users with multi-session conversations spanning several weeks report that the assistant now contradicts its earlier statements and has a noticeably different communication style. New users don't experience these issues.

What's the best approach to resolve this?

### Các lựa chọn trả lời

1. Add instructions to the new system prompt directing the assistant to maintain consistency with any prior statements in the conversation history.
2. Version system prompts and associate each conversation with the prompt version under which it started, applying updates only to new conversations.
3. Regenerate summaries of existing conversations using the new prompt and replace the stored histories to align past context with current behavior.
4. Add a transition message when sessions resume explaining that the assistant has been updated and behavior may differ.

### Đáp án đúng

**2. Version system prompts and associate each conversation with the prompt version under which it started, applying updates only to new conversations.**

## Câu 136

### Câu hỏi

Evaluation shows 94% extraction accuracy on short meeting transcripts (<30 minutes) but only 68% on longer transcripts (>60 minutes) where discussions meander and key information is scattered throughout. Transcripts of both lengths fit within the model's context window.

What pattern most effectively improves accuracy on complex, lengthy documents?

### Các lựa chọn trả lời

1. Add few-shot examples demonstrating correct extraction from lengthy meetings with scattered Information.
2. Upgrade to a more capable model tier for the extraction task
3. Add a pre-extraction step where the model summarizes key discussions and conclusions before performing structured extraction.
4. Split lengthy transcripts Into chunks, extract from each chunk separately, then merge and deduplicate the results.

### Đáp án đúng

**4. Split lengthy transcripts Into chunks, extract from each chunk separately, then merge and deduplicate the results.**

## Câu 137

### Câu hỏi

You're implementing a complex graph traversal algorithm with specific performance requirements and edge cases to handle (disconnected nodes, cycles, weighted edges). You want to structure your workflow for efficient iterative refinement with Claude.

What approach will most effectively enable progressive improvement across multiple iterations?

### Các lựa chọn trả lời

1. Have Claude extensively research the algorithm and create a detailed implementation plan using extended thinking, then implement the complete solution based on that plan.
2. Write a test suite covering expected behavior, edge cases, and performance requirements before implementation. Ask Claude to write code that passes the tests, then iterate by sharing test failures with each refinement request.
3. Provide Claude with a detailed natural language specification of the algorithm, including all requirements and edge cases. Review each output manually and provide descriptive feedback on what behavior needs to change.
4. Provide Claude with a reference implementation from documentation, then ask it to rewrite the code to match your codebase style and add the required edge case handling, comparing outputs against the reference.

### Đáp án đúng

**2. Write a test suite covering expected behavior, edge cases, and performance requirements before implementation. Ask Claude to write code that passes the tests, then iterate by sharing test failures with each refinement request.**

## Câu 138

### Câu hỏi

Your infrastructure-as-code repository includes Terraform modules (/terraform/), Kubernetes manifests (/kubernetes/), and CI/CD pipeline scripts (/pipelines/). Each requires different conventions, but your single root CLAUDE.md has grown to 500+ lines. When developers work on Kubernetes files, Terraform-specific rules load into context unnecessarily, consuming tokens.

What is the best approach to reorganize so only relevant guidance loads when editing specific file types?

### Các lựa chọn trả lời

1. Create files in .claude/rules/ with YAML frontmatter path-scoping (e.g., paths: ["terraform/**/*"]), loading rules only when editing matching files.
2. Split content into subdirectory CLAUDE.md files (/terraform/CLAUDE.md, /kubernetes/CLAUDE.md), so Claude loads directory-specific guidance.
3. Keep the root CLAUDE.md and use @path/to/import syntax to modularly include tool-specific guidance files from separate documents.
4. Restructure the root CLAUDE.md into clearly labeled sections with headers (e.g., "## Terraform Conventions"), improving organization and readability.

### Đáp án đúng

**1. Create files in .claude/rules/ with YAML frontmatter path-scoping (e.g., paths: ["terraform/**/*"]), loading rules only when editing matching files.**

## Câu 139

### Câu hỏi

After expanding the agent's MCP tools with delivery-specific capabilities (check_delivery_status, contact_driver, issue_credit, apply_promo_code, update_delivery_address, reschedule_delivery), the total tool count has grown from 4 to 10. Your evaluation suite shows tool selection accuracy has dropped to 71%. Log analysis reveals the majority of errors involve the agent selecting between semantically overlapping tools- calling issue_credit when process_refund is correct, and calling check_delivery_status when lookup_order already returns the needed data.

Which approach structurally eliminates the semantic overlaps that are being logged as the error source?

### Các lựa chọn trả lời

1. Consolidate semantically overlapping tools-merge issue_credit and process_refund into a single resolve_compensation tool with an optional include_tracking flag.
2. Enable the tool search tool with defer_loading on the six new tools, keeping the original four always loaded, so the agent dynamically calls it when needed.
3. Add few-shot examples to the system prompt demonstrating correct selection for each ambiguous tool pair, such as showing when issue_credit or process_refund is appropriate.
4. Split the tools across two sub-agents - a "financial resolution" agent with process_refund, issue_credit, and apply_promo_code, and a "delivery" agent with the remaining delivery tools - with a coordinator routing between them.

### Đáp án đúng

**1. Consolidate semantically overlapping tools-merge issue_credit and process_refund into a single resolve_compensation tool with an optional include_tracking flag.**

## Câu 140

### Câu hỏi

After expanding the agent's MCP tools with delivery-specific capabilities [apply_promo_code, update_delivery_address, reconcile_delivery], the total tool count has grown from 1 to 7. We have observed that the agent now shows tool selection accuracy has dropped from 86% to 71%. Log analysis reveals the majority of errors involve the agent selecting between semantically overlapping tools — calling issue_credit when process_refund was correct, and calling check_delivery_status when looking order_allready_returns_the_needed_data.

Which approach structurally eliminates the semantic overlap identified in the error source?

### Các lựa chọn trả lời

1. Consolidate semantically overlapping tools – merge issue_credit and process_refund into a single handle_promotions tool with an action parameter and fold check_delivery_status into lookup_order with an optional include_tracking flag.
2. Enable the tool search tool with defer_loading on the six new tools, keeping the original two always loaded, so the agent dynamically discovers specialized tools only when needed.
3. Split the tools across two sub-agents — a 'financial resolution' agent with issue_credit, process_refund, return_order, and apply_promo_code and a 'delivery operations' agent with the remaining delivery tools — with a coordinating routing between them.
4. Add few-shot examples to the system prompt demonstrating correct selection for each ambiguous tool, such as showing when issue_credit applies versus when process_refund is appropriate.

### Đáp án đúng

**1. Consolidate semantically overlapping tools – merge issue_credit and process_refund into a single handle_promotions tool with an action parameter and fold check_delivery_status into lookup_order with an optional include_tracking flag.**

## Câu 141

### Câu hỏi

Your order management system requires tools for three distinct operations: issuing refunds (requires amount and reason), canceling orders (requires reason), and res (requires shipping address). Each operation shares an order id parameter but has different additional requirements. You notice during testing that with your current frequently omits required parameters or includes irrelevant ones.

What design change will most effectively improve parameter accuracy?

### Các lựa chọn trả lời

1. Keep one unified tool with all parameters marked optional, but add few-shot examples in the system prompt showing correct parameter combinations for each operation.
2. Keep one unified tool but add JSON Schema if-then-else conditionals to enforce that parameters like amount are required only when the operation type is "refund".
3. Keep one unified tool with a nested operation object parameter whose internal structure varies by operation type, documented in the tool description.
4. Split into three separate tools (each defining only the parameters required for that specific operation.

### Đáp án đúng

**4. Split into three separate tools (each defining only the parameters required for that specific operation.**

## Câu 142

### Câu hỏi

Your fitness coaching assistant uses a system prompt with detailed conditional logic: "If the user mentions being a beginner, provide step-by-step form instructions. If they use term 'progressive overload' or 'superset', respond concisely. If they ask about injury history, always recommend consulting a physician." During evaluation, you find the assistant correct explicit expertise declarations but struggles when users don't clearly state their level-often defaulting to overly detailed responses regardless of contextual cues like technical terms.

Which change to the system prompt would most directly address this failure to pick up on implicit expertise signals?

### Các lựa chọn trả lời

1. Implement a pre-conversation intake that asks users to rate their experience level, then inject that rating into the system prompt as context for all subsequent responses.
2. Add an explicit instruction for the model to ask a clarifying question about experience level whenever the user's expertise isn't immediately clear from their first message.
3. Replace most conditionals with a general principle: "Adapt explanation depth to match user expertise, mirroring their terminology." Keep only the safety-critical conditional abou consultations.
4. Add more conditional branches to cover additional expertise signals, such as "If user mentions specific rep ranges or asks about periodization, treat as advanced."

### Đáp án đúng

**3. Replace most conditionals with a general principle: "Adapt explanation depth to match user expertise, mirroring their terminology." Keep only the safety-critical conditional abou consultations.**

## Câu 143

### Câu hỏi

You're building a security scanning workflow.

When engineers need to locate all occurrences of a dangerous function like eval() across a large codebase, which tool should your agent use for content search?

### Các lựa chọn trả lời

1. Use Bash to run ls -R | grep eval to recursively list files containing eval.
2. Use Glob with a pattern like /*eval* to find files, then Read each matching file.
3. Use Grep to search for the pattern "eval(" across all files in the codebase.
4. Read the project's main entry file and follow import statements to trace where eval might be used.

### Đáp án đúng

**3. Use Grep to search for the pattern "eval(" across all files in the codebase.**

## Câu 144

### Câu hỏi

Your test generation produces unit tests for new code, but reviews show 55% are low-value: trivial assertions that only verify functions don't throw exceptions, tests duplicating existing coverage, or tests ignoring your team's fixture conventions.

How do you reduce the rate of low-value tests being generated in the first place?

### Các lựa chọn trả lời

1. Restrict test generation to directories where historical quality metrics show higher acceptance rates, disabling it for areas where generated tests consistently require heavy editing.
2. Document testing standards in CLAUDE.md including valuable test criteria, available fixtures with intended use cases, and examples distinguishing meaningful behavioral tests from trivial assertions.
3. Add post-generation coverage analysis that automatically filters out any generated test that doesn't increase line coverage beyond what existing tests provide.
4. Implement a two-phase generation where a second Claude call scores each test against quality criteria, filtering out low-scoring tests before presenting results to developers.

### Đáp án đúng

**2. Document testing standards in CLAUDE.md including valuable test criteria, available fixtures with intended use cases, and examples distinguishing meaningful behavioral tests from trivial assertions.**

## Câu 145

### Câu hỏi

Your expense reimbursement agent processes employee requests using a process reimbursement tool. Company policy requires that reimbursements above $500 must be approved before funds are disbursed.

The agent handles hundreds of requests daily, and you need the threshold enforcement to be tamper-proof regardless of how the agent is prompted ensures the $500 approval threshold cannot be bypassed?

### Các lựa chọn trả lời

1. Provide two tools: auto reimburse (hard-coded limit of $500) and manager approval. Include detailed system prompt instructions telling the agent to check the amount and use the appropriate tool. Add a Post ToolUse hook that logs which tool was called for auditing.
2. The process reimbursement tool accepts an approved by manager parameter. The system prompt instructs the agent to only set this to true after confirming that a manager approved the request. A nightly audit script reviews all reimbursements where approved by manager was set to true.
3. The process reimbursement tool accepts amount and details, and internally enforces the threshold; amounts <$500 are auto-disbursed and the tool returns a success confirmation. Amounts >$500 cause the tool to create a pending approval request and return a status indicating manager review is pending.
4. Implement the threshold check in a PreToolUse hook that inspects the amount parameter before process reimbursement executes. If the amount exceeds $500, the hook modifies the context to add a requires approval: true flag, which the tool checks before disbursing.

### Đáp án đúng

**3. The process reimbursement tool accepts amount and details, and internally enforces the threshold; amounts <$500 are auto-disbursed and the tool returns a success confirmation. Amounts >$500 cause the tool to create a pending approval request and return a status indicating manager review is pending.**

## Câu 146

### Câu hỏi

Your portfolio value tool returns the total value of a user's investment portfolio. You're deciding between returning a structured JSON object with explicit fields versus returning information as a formatted text string.

What is the primary advantage of using structured output with defined fields?

### Các lựa chọn trả lời

1. Structured JSON is processed deterministically by the model, significantly improving accuracy when extracting values.
2. The agent can reliably extract specific values without parsing free form text, reducing errors in subsequent operations.
3. Structured JSON consumes significantly fewer tokens than natural language, substantially reducing API costs.
4. JSON schemas automatically validate that the underlying API returned correct data before the agent processes it.

### Đáp án đúng

**2. The agent can reliably extract specific values without parsing free form text, reducing errors in subsequent operations.**

## Câu 147

### Câu hỏi

Performance analysis reveals your context is composed of accumulated RAG results from all previous queries, which is crowding out conversation history and causing coherence degradation after 15+ turns.

Which approach best addresses this issue?

### Các lựa chọn trả lời

1. Shift context budget to favor RAG results while reducing conversation history allocation
2. Implement semantic deduplication to identify and remove redundant information across the accumulated RAG results and conversation turns
3. Implement a sliding window for RAG results from the last 2-3 queries while preserving conversation history
4. Compress all RAG results into a consolidated summary document that updates incrementally after each retrieval

### Đáp án đúng

**3. Implement a sliding window for RAG results from the last 2-3 queries while preserving conversation history**

## Câu 148

### Câu hỏi

Your team frequently migrates React components to Vue. You've written a step-by-step workflow for Claude Code to follow during each migration, and you want every developer on the team to invoke it by typing /migrate-component. The workflow should stay in sync as the team iterates on it.

Where should you place the skill file?

### Các lựa chọn trả lời

1. In ~/.claude/skills/migrate-component/SKILL.md on each developer's machine
2. As a detailed instruction block in the project's root CLAUDE.md file
3. In .claude/skills/migrate-component/SKILL.md at the project root, committed to version control
4. In the project's .claude/settings.json using a skillOverrides entry to register and define the workflow

### Đáp án đúng

**3. In .claude/skills/migrate-component/SKILL.md at the project root, committed to version control**

## Câu 149

### Câu hỏi

The system processes product reviews using tool use with a defined schema: rating (integer 1-5), pros (string array), cons (string array), and overall_sentiment (enum: positive, negative, mixed). Testing reveals two issues with brief or ambiguous reviews (~20% of the dataset): (1) for reviews like "Great product!", Claude fabricates specific pros and cons rather than indicating this information isn't explicitly stated, and (2) for sarcastic reviews like "Well that was... interesting", Claude picks sentiment arbitrarily since there's no option for ambiguous cases.

What schema modification best addresses both issues?

### Các lựa chọn trả lời

1. Add an extraction_confidence field (0.0-1.0) for each value, and filter outputs where any confidence falls below a threshold.
2. Allow empty arrays for pros/cons as valid output, and add "unclear" to the sentiment enum.
3. Make pros and cons optional fields, and add "neutral" and "unclear" to the sentiment enum.
4. Allow null values for pros/cons, and add "unclear" to the sentiment enum.

### Đáp án đúng

**2. Allow empty arrays for pros/cons as valid output, and add "unclear" to the sentiment enum.**

## Câu 150

### Câu hỏi

Production logs show that when the agent handles complex billing disputes requiring 6+ tool calls, it sometimes exhausts its max_turns limit after gathering data and before completing resolution or escalating. The team's goal is to guarantee that every customer interaction ends with either a completed resolution or a human escalation, regardless of how the agent loop terminates.

Which approach achieves this guarantee?

### Các lựa chọn trả lời

1. Add system prompt instructions telling the agent to call escalate_to_human with a summary of its findings whenever it determines it cannot resolve the dispute.
2. Implement a pre-tool-use hook that counts tool invocations and terminates the loop with an automatic escalation once the agent reaches 80% of its remaining actions.
3. Add orchestration-layer code that checks the agent's outcome after each loop termination - if the loop ended without a completed resolution or escalation, programmatically call escalate_to_human with the accumulated conversation context and tool results.
4. Split the workflow into two sequential agent invocations — a first agent gathers information via get_customer and lookup_order, then the second agent uses that data and handles process_refund or escalate_to_human, each with separate turn budgets.

### Đáp án đúng

**3. Add orchestration-layer code that checks the agent's outcome after each loop termination - if the loop ended without a completed resolution or escalation, programmatically call escalate_to_human with the accumulated conversation context and tool results.**

## Câu 151

### Câu hỏi

A developer uses Claude Code to refactor a function during their development session. Before committing, they ask the same Claude session to review the code for issues. Later, a separate automated CI review catches several bugs that the same-session review missed.

What best explains this discrepancy?

### Các lựa chọn trả lời

1. Claude retains context about its prior reasoning in the session, making it less likely to question its own decisions
2. The CI environment has access to the full codebase context while the local session only sees the current file
3. The extended session length caused the context window to fill with conversation history, leaving less room for thorough analysis
4. The CI review uses a more specific prompt tailored for catching bugs, while the developer's request was too general

### Đáp án đúng

**1. Claude retains context about its prior reasoning in the session, making it less likely to question its own decisions**

## Câu 152

### Câu hỏi

You've configured your Claude agent with three MCP servers: one for git operations, one for Jira ticket management, and one for documentation search.

When a user asks the agent to "create a branch for JIRA- 123 and add documentation links to the ticket," how does the agent access tools across these servers?

### Các lựa chọn trả lời

1. Tools from all configured MCP servers are discovered at connection time and available simultaneously to the agent.
2. You must specify which MCP server to use for each turn, and the agent can only access one server's tools at a time.
3. The agent queries each server sequentially to determine which handles each tool, routing calls based on tool name prefixes.
4. The agent automatically selects the most relevant server based on the request and loads only that server's tools.

### Đáp án đúng

**1. Tools from all configured MCP servers are discovered at connection time and available simultaneously to the agent.**

## Câu 153

### Câu hỏi

An engineer submits two requests: • Request A: "Rename the getUserData function to fetchUserProfile everywhere it's used." • Request B: "Improve error handling throughout the data processing module—add try/catch blocks, meaningful error messages, and ensure failures don't silently corrupt data."

For which request does specifying an explicit multi-phase workflow (such as analyze propose implement with review) most improve outcome quality?

### Các lựa chọn trả lời

1. Neither request benefits significantly
2. Request A, the function rename task
3. Request B, the error handling task
4. Both requests benefit equally

### Đáp án đúng

**3. Request B, the error handling task**

## Câu 154

### Câu hỏi

During initial testing of the automated review pipeline, you notice that reviews on large PRs (50+ changed files) sometimes take over 20 minutes and cost $8-12 per run due to extensive agentic loops — Claude reads files, runs analysis tools, and iterates many times. Your team needs each invocation to abort once it reaches a fixed iteration count and a fixed dollar amount, enforced by Claude Code itself rather than the surrounding job runner.

Which configuration change directly enforces both of those per-invocation caps?

### Các lựa chọn trả lời

1. Switch the --model flag to a smaller, cheaper model so each iteration uses fewer tokens and lower per- call cost.
2. Set timeout-minutes: 5 on the GitHub Actions job step and monitor per-run costs via the Anthropic Console usage dashboard.
3. Set --permission-mode dontAsk to auto-deny any tool permission requests not in the explicitly allowed set.
4. Add --max-turns 10 --max-budget-usd 2.00 to the claude -p invocation to cap iterations and spend.

### Đáp án đúng

**4. Add --max-turns 10 --max-budget-usd 2.00 to the claude -p invocation to cap iterations and spend.**

## Câu 155

### Câu hỏi

Your update_user_profile tool accepts a user_id (required) and an optional fields_to_update object. In testing, Claude frequently omits user_id or passes incorrectly structured data.

What is most critical for helping Claude understand what parameter values to provide?

### Các lựa chọn trả lời

1. Strict JSON Schema type constraints marking user_id as required and defining fields_to_update as an object type
2. Verbose parameter names encoding format hints, such as user_id_string_uuid_format
3. Clear parameter descriptions explaining expected format, such as "user_id : UUID of the user to update (required)"
4. Detailed error responses explaining why invalid parameter values were rejected

### Đáp án đúng

**3. Clear parameter descriptions explaining expected format, such as "user_id : UUID of the user to update (required)"**

## Câu 156

### Câu hỏi

Your conversation history includes two types of content: persistent story elements (character backgrounds, plot structure, world rules) that must remain consistent throughout, and extensive brainstorming discussion that's mostly ephemeral. After 40+ turns, you're hitting context limits and users report the assistant "forgets" established character traits, breaking narrative consistency.

Which approach best ensures persistent story elements remain available to the model while reclaiming context space?

### Các lựa chọn trả lời

1. Store all history in a vector database and retrieve semantically similar passages for each new message, replacing conversation history with retrieved chunks.
2. Apply a sliding-window approach keeping only the most recent 25 turns, relying on the model to infer earlier context from recent discussion flow.
3. Separate persistent story elements into a retained "story bible" section at context start, applying trimming or summarization only to brainstorming discussion.
4. Summarize the entire conversation history into a condensed synopsis every 20 turns, replacing the full history to free up tokens.

### Đáp án đúng

**3. Separate persistent story elements into a retained "story bible" section at context start, applying trimming or summarization only to brainstorming discussion.**

## Câu 157

### Câu hỏi

Users frequently refine their search criteria mid-conversation. You notice a pattern: when users say things like "Actually, let's raise the budget to $650K" or "I'd prefer a condo now instead of a house," the assistant sometimes continues referencing the original preferences in later responses—even though the updates are clearly present in the conversation history. Context usage is only at 35% capacity.

Which solution most reliably ensures the model uses the current preferences?

### Các lựa chọn trả lời

1. Include few-shot examples showing the assistant correctly acknowledging and applying preference changes in responses.
2. Maintain a structured state object with current preferences, update it on changes, and include it in each request.
3. Implement conversation pruning to remove turns containing outdated preferences, ensuring only current ones remain in context.
4. Add system prompt instructions emphasizing that the model should always prioritize the most recently stated preferences over earlier ones.

### Đáp án đúng

**2. Maintain a structured state object with current preferences, update it on changes, and include it in each request.**

## Câu 158

### Câu hỏi

After deploying automated code review, developers report that approximately 35% of flagged findings are false positives falling into consistent patterns: style suggestion contradicting team conventions, security warnings for patterns safe in your deployment context, and performance suggestions that would degrade your specific use case. You want to reduce false positives while maintaining the ability to catch genuine issues.

Which approach best enables the model to generalize its judgment to novel code patterns it hasn't seen before?

### Các lựa chọn trả lời

1. Include few-shot examples in your prompt showing annotated code snippets that distinguish acceptable patterns from genuine issues in each category.
2. Create a comprehensive written specification of all patterns that should not be flagged, then include this full documentation in the system prompt.
3. Implement post-processing that uses keyword matching to filter out findings containing terms like "convention," "context-dependent," or "trade-off."
4. Add instructions to your system prompt to "be conservative," "only flag definite issues," and "consider that some patterns may be intentional."

### Đáp án đúng

**1. Include few-shot examples in your prompt showing annotated code snippets that distinguish acceptable patterns from genuine issues in each category.**

## Câu 159

### Câu hỏi

You are setting up a non-interactive automated code review pipeline using Claude Code. You want Claude to analyze a pulled Git diff (git diff) against the main branch and apply a custom set of code review instructions. However, you notice that when you run the pipeline, Claude only looks at the raw diff text itself and completely stops using its file-reading or code navigation tools. As a result, it fails to inspect the broader codebase repository context, which is critical because the diff modifies a core function called by many other external modules.

Which change to the CLI invocation will cause Claude to read related files in the repository while still successfully applying your custom review instructions?

### Các lựa chọn trả lời

1. Replace --system-prompt with --append-system-prompt so your review instructions are added to Claude Code's default prompt instead of overwriting the built-in guidance for using file-reading and code navigation tools.
2. Keep --system-prompt and add --allowedTools "Read, Glob, Grep" so that the non-interactive mode permits file system tools that it otherwise disables.
3. Stop piping the diff via stdin and instead embed the diff contents inside the prompt string, so Claude Code treats the invocation as an agentic session rather than a stream-processing one.
4. Remove --system-prompt entirely and place the review instructions in a CLAUDE.md file at the repo root, since --system-prompt is incompatible with tool use under -p.

### Đáp án đúng

**1. Replace --system-prompt with --append-system-prompt so your review instructions are added to Claude Code's default prompt instead of overwriting the built-in guidance for using file-reading and code navigation tools.**

## Câu 160

### Câu hỏi

Your development team is using Claude Code to automate test generation across a large codebase. However, developers are frequently rejecting the generated test suites because Claude creates a high volume of trivial assertions or tests that merely maximize line coverage without validating meaningful behavioral logic or edge cases. You want to guide Claude to generate high-quality, production-ready tests directly without introducing high latency or modifying the core pipeline script.

Which strategy best ensures that high-quality, meaningful tests are generated in the first place?

### Các lựa chọn trả lời

1. Document testing standards in CLAUDE.md including valuable test criteria, available fixtures with intended use cases, and examples distinguishing meaningful behavioral tests from trivial assertions.
2. Restrict test generation to directories where historical quality metrics show higher acceptance rates, disabling it for areas where generated tests consistently require heavy editing.
3. Implement a two-phase generation where a second Claude call scores each test against quality criteria, filtering out low-scoring tests before presenting results to developers.
4. Add post-generation coverage analysis that automatically filters out any generated test that doesn't increase line coverage beyond what existing tests provide.

### Đáp án đúng

**1. Document testing standards in CLAUDE.md including valuable test criteria, available fixtures with intended use cases, and examples distinguishing meaningful behavioral tests from trivial assertions.**

## Câu 161

### Câu hỏi

Your music discovery assistant should consistently maintain an enthusiastic tone, explain its reasoning for each recommendation, and ask clarifying questions to better understand user preferences. You want this behavior to persist reliably across all user interactions.

Where should you define these behavioral guidelines?

### Các lựa chọn trả lời

1. In the first assistant message, instructing Claude to follow these guidelines going forward
2. In the system prompt
3. Prepended to each user message before sending to the API
4. In environmental variables that your application passes to the API client

### Đáp án đúng

**2. In the system prompt**

## Câu 162

### Câu hỏi

Your team is configuring MCP servers in Claude Code. You want to add a shared venue lookup server that all team members should have access to, and you personally want to add an experimental music playlist server that only you are testing.

Which configuration approach correctly applies MCP server scopes?

### Các lựa chọn trả lời

1. Add both servers to the project-level .mcp.json file
2. Add both servers to your local ~/.claude.json
3. Add venue server to ~/.claude.json and playlist server to .mcp.json
4. Add venue server to .mcp.json and playlist server to ~/.claude.json

### Đáp án đúng

**4. Add venue server to .mcp.json and playlist server to ~/.claude.json**
