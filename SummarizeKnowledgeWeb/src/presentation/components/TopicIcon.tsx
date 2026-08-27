import {
  Binary,
  Bot,
  BrainCircuit,
  Braces,
  CloudCog,
  Code2,
  Cpu,
  Database,
  FlaskConical,
  GitBranch,
  GraduationCap,
  Network,
  ServerCog,
  ShieldCheck,
  Workflow,
  type LucideIcon,
} from 'lucide-react'

const icons: Record<string, LucideIcon> = {
  binary: Binary,
  bot: Bot,
  brain: BrainCircuit,
  braces: Braces,
  cloud: CloudCog,
  code: Code2,
  cpu: Cpu,
  database: Database,
  flask: FlaskConical,
  graph: GitBranch,
  interview: GraduationCap,
  network: Network,
  server: ServerCog,
  security: ShieldCheck,
  workflow: Workflow,
}

interface TopicIconProps {
  readonly name: string
  readonly size?: number
  readonly strokeWidth?: number
}

export function TopicIcon({
  name,
  size = 20,
  strokeWidth = 1.8,
}: TopicIconProps) {
  const Icon = icons[name] ?? Braces
  return <Icon aria-hidden="true" size={size} strokeWidth={strokeWidth} />
}
