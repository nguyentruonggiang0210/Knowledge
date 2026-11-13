import type { KnowledgeTopic } from '../../domain/knowledge/KnowledgeTopic'
import type { Locale } from './messages'

type TopicCopy = Pick<
  KnowledgeTopic,
  'title' | 'navTitle' | 'eyebrow' | 'description' | 'outcomes'
>

const englishTopics: Readonly<Record<string, TopicCopy>> = {
  'ai-machine-learning': {
    title: 'AI & Machine Learning: foundations to production',
    navTitle: 'AI & Machine Learning',
    eyebrow: 'AI Engineer capability map',
    description: 'A concise map from mathematics, data and machine learning through deep learning, LLMs, evaluation and production AI operations.',
    outcomes: [
      'Connect mathematical and data foundations to modern AI models',
      'Choose workflows, models and metrics from problem constraints instead of trends',
      'Understand the training, evaluation, deployment and governance lifecycle',
      'Distinguish complete learning material from experimental source scaffolds',
    ],
  },
  'rag-agent-systems': {
    title: 'RAG & Agent Systems: retrieval, tools and orchestration',
    navTitle: 'RAG & Agent Systems',
    eyebrow: 'LLM application architecture',
    description: 'From indexing and hybrid retrieval to agent loops, tools, MCP, context, multi-agent orchestration, evaluation and production guardrails.',
    outcomes: [
      'Design a RAG pipeline with separate offline ingestion and online retrieval',
      'Apply sparse, dense, RRF, reranking, MMR and context budgets correctly',
      'Build bounded agent loops with explicit tool contracts and termination states',
      'Evaluate reliability, security and scaling limits of a RAG agent',
    ],
  },
  'data-engineering': {
    title: 'Data Engineering: end-to-end analytics pipeline',
    navTitle: 'Data Engineering',
    eyebrow: 'GitHub Trending Analytics capstone',
    description: 'A hands-on architecture from EDA, point-in-time features and PySpark ETL to PostgreSQL, FastAPI, observability and an Angular dashboard.',
    outcomes: [
      'Describe the complete flow from large CSV inputs to API and dashboard',
      'Apply Spark cleaning, partitioning, windows, caching and JDBC batching',
      'Design point-in-time features and verify batch/online parity',
      'Shape schemas, indexes, async APIs and monitoring around query needs',
      'Separate target architecture from source components that remain scaffolds',
    ],
  },
  'algorithms-data-structures': {
    title: 'Algorithms & Data Structures',
    navTitle: 'Algorithms',
    eyebrow: 'Patterns · Invariants · C#',
    description: 'A map of 36 algorithm and data-structure topics for solving coding interviews through invariants, complexity, dry runs and systematic tests.',
    outcomes: [
      'Recognize the right pattern from constraints and access patterns',
      'State invariants, argue correctness and analyze time/space complexity',
      'Select suitable data structures, graph algorithms and DP models',
      'Solve C# interview problems with explicit edge cases and tests',
    ],
  },
  'advanced-databases': {
    title: 'Advanced Databases',
    navTitle: 'Advanced Databases',
    eyebrow: 'PostgreSQL · ClickHouse · Production',
    description: 'Design, optimize and operate PostgreSQL OLTP and ClickHouse OLAP, from transactions and execution plans to CDC, HA and schema evolution.',
    outcomes: [
      'Choose PostgreSQL OLTP or ClickHouse OLAP from workload characteristics',
      'Read execution plans and prove optimizations with measurements',
      'Design safe transactions, indexes, schemas, partitions and migrations',
      'Operate backups, replication, observability, CDC and failure drills',
    ],
  },
  'java-jvm-spring': {
    title: 'Java, JVM & Spring for C# engineers',
    navTitle: 'Java · JVM · Spring',
    eyebrow: 'Backend engineering',
    description: 'A focused path from Java and the JVM to Spring Boot, persistence, security, observability and senior interview readiness.',
    outcomes: [
      'Map C#/.NET concepts to Java idioms without line-by-line translation',
      'Explain JVM runtime, class loading, GC/JIT and diagnostic evidence',
      'Design Spring Boot services with clear boundaries, transactions and tests',
      'Choose JDBC, JPA or MyBatis by query shape and SQL ownership',
      'Build a verifiable senior-level roadmap and capstone',
    ],
  },
  'dotnet-api-containers': {
    title: 'C#/.NET, APIs & Containers',
    navTitle: 'C#/.NET & APIs',
    eyebrow: 'C# · CLR · ASP.NET Core · Data · Docker · GraphQL',
    description: 'A map from the C# type system, CLR, ASP.NET Core and EF Core to Linux/Windows containers, with an accurate review of the GraphQL draft.',
    outcomes: [
      'Explain C# value/reference semantics and important CLR abstractions',
      'Read ASP.NET Core composition roots, dependency injection and pipelines',
      'Design EF Core data access and transactions around resource boundaries',
      'Explain multi-stage builds and Linux versus Windows containers',
      'Distinguish application, container and Visual Studio profile ports',
      'Understand the intended Hot Chocolate and EF Core integration',
      'Identify what is missing before treating the GraphQL draft as runnable',
    ],
  },
  'concurrency-messaging': {
    title: 'Concurrency, Pipelines & Messaging',
    navTitle: 'Concurrency · Messaging',
    eyebrow: 'Parallel workloads',
    description: 'Mental models and practical .NET pipelines covering bounded concurrency, messaging, distributed consistency, caching, retries and admission control.',
    outcomes: [
      'Distinguish concurrency, parallelism, asynchronous I/O and thread ownership',
      'Build bounded producer-consumer pipelines with backpressure',
      'Choose patterns for files, batch ETL and media workloads',
      'Design cancellation, fault isolation, thread-safe state and deterministic output',
      'Explain redelivery, idempotency, outbox/inbox and broker guarantees',
      'Analyze CAP/PACELC, quorum, sagas, caching and admission control by failure mode',
    ],
  },
  'terraform-cloud': {
    title: 'Terraform & Cloud Engineering',
    navTitle: 'Terraform & Cloud',
    eyebrow: 'IaC · OCI · Multi-cloud',
    description: 'Terraform from HCL and state to modules, CI/CD, OCI production foundations and controlled migration to AWS or Azure.',
    outcomes: [
      'Write typed HCL with validation and stable module contracts',
      'Manage state, backends, imports and refactors without damaging infrastructure',
      'Design a secure OCI foundation and operate Terraform through CI/CD',
      'Evaluate migration and multi-cloud through semantics, not renamed resources',
    ],
  },
  'devops-sre-security': {
    title: 'DevOps, SRE & Security',
    navTitle: 'DevOps & SRE',
    eyebrow: 'Delivery · Reliability · Defense',
    description: 'The production delivery and operations lifecycle from Linux, networking, CI/CD and containers to observability, SLOs, incidents, DR and security by design.',
    outcomes: [
      'Design fast delivery flows with security and recovery guardrails',
      'Investigate incidents across Linux, networks and applications with telemetry',
      'Define SLI/SLOs, capacity, alerts and resilience from user outcomes',
      'Respond to incidents, test DR and manage production supply-chain risk',
    ],
  },
  'system-design-interview': {
    title: 'System Design & Interview',
    navTitle: 'System Design & Interview',
    eyebrow: 'Structured thinking · Communication · Decisions',
    description: 'A unified practice system spanning 834 questions, algorithms, system design, Java/.NET expertise and behavioral interviews—focused on reasoning, not memorization.',
    outcomes: [
      'Work through system design with a clear failure-first process',
      'Communicate data, consistency, scale and reliability trade-offs',
      'Solve coding problems with an explicit protocol, tests and complexity analysis',
      'Tell evidence-based STAR(R) stories with concrete lessons',
      'Create a practice loop with quizzes, mock interviews and rubrics',
    ],
  },
  'software-engineering-quality': {
    title: 'Software Engineering & Quality',
    navTitle: 'Engineering & Quality',
    eyebrow: 'Changeability · Verification · Operational evidence',
    description: 'Principles that turn running code into changeable, testable and operable systems: modeling, boundaries, contracts, testing, delivery and decision records.',
    outcomes: [
      'Place dependency boundaries so business rules remain framework-independent',
      'Design contracts, error models and backward-compatible changes',
      'Choose the right unit, integration, contract and end-to-end tests',
      'Turn CI, review, observability and rollback into quality gates',
      'Produce ADRs, runbooks and portfolios backed by working evidence',
    ],
  },
  'docker-kubernetes': {
    title: 'Docker & Kubernetes Engineering',
    navTitle: 'Docker & Kubernetes',
    eyebrow: 'Containers · Orchestration · Operations',
    description: 'A production-oriented path from container internals, images and Compose to Kubernetes workloads, networking, storage, security, observability and disaster recovery.',
    outcomes: [
      'Build small, reproducible and secure container images',
      'Operate Docker networking, storage, Compose and runtime resources',
      'Design Kubernetes workloads, scheduling, networking and persistent state',
      'Apply probes, autoscaling, RBAC, policies, delivery and debugging practices',
      'Validate production readiness through labs, failure drills and runbooks',
    ],
  },
}

export function localizeTopics(
  topics: readonly KnowledgeTopic[],
  locale: Locale,
): readonly KnowledgeTopic[] {
  if (locale === 'vi') return topics
  return topics.map((topic) => {
    const translation = englishTopics[topic.id]
    return translation ? { ...topic, ...translation } : topic
  })
}

export function hasEnglishTopicTranslation(topicId: string) {
  return Object.hasOwn(englishTopics, topicId)
}
