import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft, ArrowRight, BookOpen, BriefcaseBusiness, Check, CheckCircle2, ChevronRight,
  Circle, Clock3, Command, Compass, Flame, GitBranch, LayoutGrid, Menu, Moon,
  RotateCcw, Search, ShieldCheck, Sun, Target, Trophy, X, Zap,
} from 'lucide-react'
import { answerKey, chapters, domainAudit, examPatterns, lessonDetails, lessonVisualGuides, navItems, quiz, stats, supplementalKnowledge } from './data'
import englishStudyGuide from '../../Tool1/CCAR_F_FOUNDATIONS_STUDY_GUIDE_EN.md?raw'
import {
  applicationDecisionEn, applicationsEn, englishSectionMarkers, examPatternsEn, LANGUAGE_KEY,
  localizedChapters, quizEn, ui,
} from './i18n'

const STORAGE_KEY = 'ccar-learning-progress-v1'

function useLanguage() {
  const [lang, setLang] = useState(() => localStorage.getItem(LANGUAGE_KEY) === 'en' ? 'en' : 'vi')
  useEffect(() => {
    localStorage.setItem(LANGUAGE_KEY, lang)
    document.documentElement.lang = lang
    document.title = lang === 'en' ? 'CCAR-F Learning Lab — Visual Agentic AI Course' : 'CCAR-F Learning Lab — Học Agentic AI trực quan'
  }, [lang])
  return { lang, setLang, t: ui[lang] }
}

function useLearningProgress() {
  const [completed, setCompleted] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [] } catch { return [] }
  })
  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(completed)), [completed])
  const toggle = (id) => setCompleted((items) => items.includes(id) ? items.filter((x) => x !== id) : [...items, id])
  return { completed, toggle }
}

function Logo() {
  return <div className="logo"><span className="logo-mark"><Command size={18} /></span><span>CCAR<span className="logo-dot">/</span>LAB</span></div>
}

function Sidebar({ view, setView, completed, open, onClose, t }) {
  const pct = Math.round((completed.length / chapters.length) * 100)
  return <>
    {open && <button className="sidebar-scrim" aria-label="Đóng menu" onClick={onClose} />}
    <aside className={`sidebar ${open ? 'is-open' : ''}`}>
      <div className="sidebar-top"><Logo /><button className="icon-btn mobile-close" aria-label={t.close} onClick={onClose}><X size={20} /></button></div>
      <nav className="main-nav" aria-label={t.navLabel}>
        <p className="nav-label">{t.navLabel}</p>
        {navItems.map(({ id, icon: Icon }) => <button key={id} className={view === id ? 'active' : ''} onClick={() => { setView(id); onClose() }}><Icon size={18} /><span>{t[id]}</span>{view === id && <ChevronRight size={16} />}</button>)}
      </nav>
      <div className="side-progress">
        <div className="progress-orbit"><span style={{ '--progress': `${pct * 3.6}deg` }}><b>{pct}%</b></span></div>
        <div><strong>{t.progress}</strong><small>{completed.length}/{chapters.length} {t.topics}</small></div>
      </div>
      <div className="sidebar-tip"><Flame size={18} /><p><strong>{t.tip}</strong><span>{t.tipText}</span></p></div>
      <p className="sidebar-version">FOUNDATIONS · 2026</p>
    </aside>
  </>
}

function Topbar({ onMenu, query, setQuery, dark, setDark, lang, setLang, t }) {
  return <header className="topbar">
    <button className="icon-btn menu-btn" aria-label="Menu" onClick={onMenu}><Menu size={21} /></button>
    <div className="search-box"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.search} /><kbd>⌘ K</kbd></div>
    <div className="top-actions"><span className="status-pill"><span /> {t.verified}</span><div className="language-switch" role="group" aria-label={t.language}><button aria-pressed={lang === 'vi'} className={lang === 'vi' ? 'active' : ''} onClick={() => setLang('vi')}>VI</button><button aria-pressed={lang === 'en'} className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button></div><button className="icon-btn" aria-label={t.theme} onClick={() => setDark(!dark)}>{dark ? <Sun size={19} /> : <Moon size={19} />}</button></div>
  </header>
}

function Hero({ onStart, t }) {
  return <section className="hero">
    <img className="hero-image" src="/agent-learning-hero.png" alt={t.heroAlt} />
    <div className="hero-vignette" />
    <div className="hero-content">
      <div className="eyebrow"><span className="pulse" /> {t.heroEyebrow}</div>
      <h1>{t.heroTitleA}<br /><em>{t.heroTitleB}</em> {t.heroTitleC}</h1>
      <p>{t.heroBody}</p>
      <div className="hero-actions"><button className="primary-btn" onClick={onStart}>{t.start} <ArrowRight size={18} /></button><a className="ghost-btn" href="#learning-map">{t.roadmap} <LayoutGrid size={17} /></a></div>
      <div className="hero-proof"><div className="avatar-stack"><span>AI</span><span>UX</span><span>QA</span></div><p><b>{t.structuredFrom}</b><br />{t.checkedAll}</p></div>
    </div>
  </section>
}

function StatsStrip({ t }) {
  return <section className="stats-strip">{stats.map((item, i) => <div key={item.value}><span className="stat-index">0{i + 1}</span><strong>{item.value}</strong><p>{t.stats[i]}</p></div>)}</section>
}

function ChapterCard({ item, done, onOpen, t }) {
  const Icon = item.icon
  return <article className={`chapter-card tone-${item.color} ${done ? 'is-done' : ''}`} onClick={() => onOpen(item)} tabIndex="0" onKeyDown={(e) => e.key === 'Enter' && onOpen(item)}>
    <div className="card-top"><span className="chapter-no">{item.number}</span><span className="icon-wrap"><Icon size={20} /></span>{done && <span className="done-badge"><Check size={13} /> {t.done}</span>}</div>
    <p className="card-eyebrow">{item.eyebrow}</p><h3>{item.title}</h3><p className="card-summary">{item.summary}</p>
    <div className="card-meta"><span><Clock3 size={14} /> {item.duration} {t.minutes}</span><span>{item.questions}</span></div>
    <button className="card-link">{t.explore} <ArrowRight size={16} /></button>
  </article>
}

function AgentLoopVisual({ lang }) {
  const labels = lang === 'en' ? ['Request', 'Select tool', 'Result', 'Decision'] : ['Yêu cầu', 'Chọn tool', 'Kết quả', 'Quyết định']
  return <div className="loop-visual"><div className="loop-core"><Zap size={24} /><span>MODEL</span></div>{labels.map((x, i) => <div className={`loop-node n${i + 1}`} key={x}><span>{i + 1}</span>{x}</div>)}</div>
}

function TraceVisual() { return <div className="trace-visual">{['Error log', 'Grep', 'Entry point', 'Call chain', 'Root cause'].map((x, i) => <div key={x} className="trace-step"><i>{i + 1}</i><span>{x}</span>{i < 4 && <ChevronRight size={18} />}</div>)}</div> }

function DecisionVisual({ lang }) { return <div className="decision-visual"><div className="decision-root">{lang === 'en' ? 'Blast radius?' : 'Bán kính ảnh hưởng?'}</div><div className="branch-line" /><div className="decision-options"><div><span>{lang === 'en' ? 'Small + clear' : 'Nhỏ + rõ'}</span><b>Direct execute</b></div><div><span>{lang === 'en' ? 'Broad + uncertain' : 'Lớn + mơ hồ'}</span><b>Explore → Plan</b></div><div><span>{lang === 'en' ? 'Two approaches' : 'Hai phương án'}</span><b>Fork session</b></div></div></div> }

function LayersVisual({ lang }) { return <div className="layers-visual"><div><small>{lang === 'en' ? 'LAYER 03' : 'LỚP 03'}</small><b>Recent turns</b><span>{lang === 'en' ? 'Verbatim' : 'Giữ nguyên văn'}</span></div><div><small>{lang === 'en' ? 'LAYER 02' : 'LỚP 02'}</small><b>Past decisions</b><span>Progressive summary</span></div><div><small>{lang === 'en' ? 'LAYER 01' : 'LỚP 01'}</small><b>Critical facts</b><span>Structured state</span></div></div> }

function PyramidVisual({ lang }) { return <div className="pyramid-visual"><div><b>SEMANTIC</b><span>{lang === 'en' ? 'Correct meaning & source' : 'Đúng nghĩa & nguồn'}</span></div><div><b>SCHEMA</b><span>{lang === 'en' ? 'Correct fields & types' : 'Đúng field & type'}</span></div><div><b>SYNTAX</b><span>{lang === 'en' ? 'Valid JSON' : 'Parse được JSON'}</span></div></div> }

function SplitMergeVisual({ lang }) { return <div className="split-visual"><div className="sm-card"><small>{lang === 'en' ? 'DIFFERENT INTENTS' : 'KHÁC INTENT'}</small><b>Refund</b><b>Cancel</b><b>Reship</b><span>→ {lang === 'en' ? 'SPLIT' : 'TÁCH'}</span></div><div className="sm-divider">VS</div><div className="sm-card"><small>{lang === 'en' ? 'OVERLAPPING INTENT' : 'CHỒNG NGHĨA'}</small><b>Issue credit</b><b>Process refund</b><span>→ {lang === 'en' ? 'MERGE' : 'GỘP'}</span></div></div> }

function ErrorsVisual({ lang }) { return <div className="errors-visual"><div className="error-card retry"><i>503</i><p><b>Transient</b><span>{lang === 'en' ? 'Tool retries + backoff' : 'Tool tự retry + backoff'}</span></p></div><div className="error-card stop"><i>422</i><p><b>Permanent</b><span>{lang === 'en' ? 'Return actionable metadata' : 'Trả metadata cho agent'}</span></p></div></div> }

function ShieldVisual({ lang }) { return <div className="shield-visual"><ShieldCheck size={68} /><div><span>PROMPT</span><span className="arrow-down">↓</span><b>BACKEND POLICY</b><small>{lang === 'en' ? 'Cannot be bypassed' : 'Không thể bị bypass'}</small></div></div> }

function AgentsVisual() { return <div className="agents-visual"><div className="agent coordinator">C</div><div className="agent a1">S</div><div className="agent a2">D</div><div className="agent a3">R</div><span className="agent-line l1" /><span className="agent-line l2" /><span className="agent-line l3" /></div> }

function HandoffVisual({ lang }) { return <div className="handoff-visual"><div className="chat-mini"><span>{lang === 'en' ? '01 focused question' : '01 câu hỏi'}</span><b>{lang === 'en' ? 'Understand the issue' : 'Hiểu đúng vấn đề'}</b></div><ArrowRight /><div className="chat-mini accent"><span>Structured</span><b>Human handoff</b></div></div> }

function PrecisionVisual() { return <div className="precision-visual"><div><span>STAGE 1</span><b>Discovery</b><small>Tối ưu recall</small></div><ChevronRight /><div><span>STAGE 2</span><b>Threshold</b><small>Kiểm soát noise</small></div></div> }

function CompassVisual() { return <div className="compass-visual"><div className="compass-ring"><Compass size={46} /><span className="north">SLA</span><span className="east">COST</span><span className="south">QUALITY</span><span className="west">LATENCY</span></div></div> }

function ChapterVisual({ type, lang }) {
  const map = { loop: AgentLoopVisual, trace: TraceVisual, decision: DecisionVisual, layers: LayersVisual, pyramid: PyramidVisual, splitmerge: SplitMergeVisual, errors: ErrorsVisual, shield: ShieldVisual, agents: AgentsVisual, handoff: HandoffVisual, precision: PrecisionVisual, compass: CompassVisual }
  const Visual = map[type] || AgentLoopVisual
  return <div className="lesson-visual"><Visual lang={lang} /></div>
}

function KeywordAtlas({ guide, t }) {
  return <section className="keyword-atlas">
    <div className="content-section-head"><span>{t.atlas}</span><h3>{t.atlasTitle}</h3><p>{t.atlasBody}</p></div>
    <div className="keyword-grid">{guide.keywords.map((keyword, index) => <article className={`keyword-card ${keyword.kind === 'branch' ? 'is-branch' : ''}`} key={keyword.name}>
      <div className="keyword-head"><span>{String(index + 1).padStart(2, '0')}</span><div><h4>{keyword.name}</h4><p>{keyword.note}</p></div></div>
      {keyword.kind === 'branch' ? <div className="branch-flow"><span>{keyword.flow[0]}</span><GitBranch size={17} /><div>{keyword.flow.slice(1).map((node) => <span key={node}>{node}</span>)}</div></div> : <div className="mini-flow">{keyword.flow.map((node, nodeIndex) => <div className="flow-part" key={node}><span>{node}</span>{nodeIndex < keyword.flow.length - 1 && <ArrowRight size={14} />}</div>)}</div>}
    </article>)}</div>
  </section>
}

function PracticalApplication({ guide, t }) {
  return <section className="practical-application">
    <div className="application-title"><span className="application-icon"><BriefcaseBusiness size={21} /></span><div><span>{t.practical}</span><h3>{t.practicalTitle}</h3><p>{t.practicalBody}</p></div></div>
    <div className="application-table"><div className="application-row table-head"><span>{t.situation}</span><span>{t.action}</span><span>{t.result}</span></div>{guide.applications.map(([situation, action, result]) => <div className="application-row" key={situation}><b>{situation}</b><p>{action}</p><small>{result}</small></div>)}</div>
    <div className="decision-rule"><Target size={18} /><p><span>{t.decision}</span>{guide.decision}</p></div>
  </section>
}

function DomainDeepDive({ items, t }) {
  return <section className="domain-deep-dive">
    <div className="content-section-head"><span>{t.deep}</span><h3>{t.deepTitle}</h3><p>{t.deepBody}</p></div>
    <div className="deep-dive-list">{items.map((item, index) => <details key={item.title} open={index === 0}>
      <summary><span>{item.source}</span><b>{item.title}</b><ChevronRight size={17} /></summary>
      <div className="deep-dive-body"><p>{item.explanation}</p><div><span>VÍ DỤ</span><p>{item.example}</p></div><div className="deep-remember"><Zap size={15} /><p><span>GHI NHỚ</span>{item.remember}</p></div></div>
    </details>)}</div>
  </section>
}

function EnglishDeepDive({ lessonId, t }) {
  const [startMarker, endMarker] = englishSectionMarkers[lessonId]
  const start = englishStudyGuide.indexOf(startMarker)
  const end = englishStudyGuide.indexOf(endMarker, start + startMarker.length)
  const section = englishStudyGuide.slice(start, end > start ? end : undefined)
  let inCode = false
  return <section className="domain-deep-dive english-deep-dive">
    <div className="content-section-head"><span>{t.deep}</span><h3>{t.deepTitle}</h3><p>{t.deepBody}</p></div>
    <div className="english-guide-copy">{section.split('\n').map((raw, index) => {
      const line = raw.trim()
      if (line.startsWith('```')) { inCode = !inCode; return null }
      if (!line) return <span className="guide-space" key={index} />
      if (inCode) return <code className="guide-code" key={index}>{raw}</code>
      if (line.startsWith('### ')) return <h4 key={index}>{line.slice(4)}</h4>
      if (line.startsWith('## ')) return <h3 key={index}>{line.replace(/^##\s+\d+\.\s*/, '')}</h3>
      if (/^\d+\.\s/.test(line) || line.startsWith('- ')) return <p className="guide-list" key={index}>{line.replace(/^(-|\d+\.)\s+/, '')}</p>
      if (line.startsWith('> ')) return <p className="guide-note" key={index}>{line.slice(2)}</p>
      return <p key={index}>{line.replaceAll('**', '').replaceAll('`', '')}</p>
    })}</div>
  </section>
}

function ChapterModal({ item, done, onToggle, onClose, onMove, lang, t }) {
  const [showAnswer, setShowAnswer] = useState(false)
  const details = lessonDetails[item.id]
  const visualGuide = lessonVisualGuides[item.id]
  const supplements = supplementalKnowledge[item.id]
  const englishApplication = { applications: applicationsEn[item.id], decision: applicationDecisionEn[item.id] }
  useEffect(() => {
    const close = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', close); document.body.classList.add('modal-open')
    return () => { document.removeEventListener('keydown', close); document.body.classList.remove('modal-open') }
  }, [onClose])
  useEffect(() => setShowAnswer(false), [item.id])
  const Icon = item.icon
  return <div className="modal-shell" role="dialog" aria-modal="true">
    <button className="modal-scrim" aria-label={t.close} onClick={onClose} />
    <article className={`lesson-modal tone-${item.color}`}>
      <div className="modal-head"><button className="icon-btn" aria-label={t.close} onClick={onClose}><X size={20} /></button><span>{item.questions}</span><button className={`complete-btn ${done ? 'done' : ''}`} onClick={() => onToggle(item.id)}>{done ? <CheckCircle2 size={17} /> : <Circle size={17} />}{done ? t.markedDone : t.markDone}</button></div>
      <div className="lesson-title"><span className="icon-wrap"><Icon size={23} /></span><p>{item.eyebrow} · {item.number}</p><h2>{item.title}</h2><span><Clock3 size={15} /> {item.duration} {t.readMinutes}</span></div>
      <ChapterVisual type={item.visual} lang={lang} />
      <div className="lesson-copy">
        <p className="lesson-intro">{item.intro}</p>
        {lang === 'vi' && <><section className="plain-explain"><span>{t.easy}</span><p>{details.plain}</p></section><KeywordAtlas guide={visualGuide} t={t} /><DomainDeepDive items={supplements} t={t} /></>}
        {lang === 'en' && <EnglishDeepDive lessonId={item.id} t={t} />}
        <h3>{t.principles}</h3>
        <div className="principle-list">{item.principles.map(([title, body], i) => <div key={title}><span>{String(i + 1).padStart(2, '0')}</span><p><b>{title}</b><small>{body}</small></p></div>)}</div>
        {lang === 'vi' && <><section className="worked-example">
          <div className="example-head"><span>{t.example}</span><h3>{details.example.title}</h3><p>{details.example.scenario}</p></div>
          <div className="example-steps">{details.example.steps.map(([number, title, body]) => <div key={number}><span>{number}</span><p><b>{title}</b><small>{body}</small></p></div>)}</div>
          <div className="example-conclusion"><CheckCircle2 size={17} /><p><span>{t.conclusion}</span>{details.example.conclusion}</p></div>
        </section>
        <section className="trap-list"><span>{t.traps}</span><h3>{t.trapsTitle}</h3><ul>{details.traps.map((trap) => <li key={trap}><X size={14} />{trap}</li>)}</ul></section>
        <section className="self-check"><div><span>{t.selfCheck}</span><h3>{details.check}</h3></div><button onClick={() => setShowAnswer((value) => !value)}>{showAnswer ? t.hideAnswer : t.showAnswer} <ChevronRight size={16} /></button>{showAnswer && <p className="self-answer"><CheckCircle2 size={16} />{details.checkAnswer}</p>}</section></>}
        <PracticalApplication guide={lang === 'en' ? englishApplication : visualGuide} t={t} />
        <blockquote><Zap size={19} /><p><span>{t.key}</span>{item.callout}</p></blockquote>
      </div>
      <footer className="modal-footer"><button onClick={() => onMove(-1)}><ArrowLeft size={17} /> {t.previous}</button><button className="next-btn" onClick={() => onMove(1)}>{t.next} <ArrowRight size={17} /></button></footer>
    </article>
  </div>
}

function LearnView({ completed, query, openChapter, curriculum, t }) {
  const filtered = useMemo(() => {
    const term = query.toLowerCase().trim()
    return !term ? curriculum : curriculum.filter((c) => `${c.title} ${c.summary} ${c.questions} ${c.eyebrow}`.toLowerCase().includes(term))
  }, [query, curriculum])
  return <>
    <Hero onStart={() => openChapter(curriculum[0])} t={t} /><StatsStrip t={t} />
    <section className="section-block" id="learning-map"><div className="section-heading"><div><p className="section-kicker">{t.curriculum}</p><h2>{t.mapTitle}</h2><p>{t.mapBody}</p></div><div className="section-progress"><span>{completed.length}/{curriculum.length}</span><small>{t.completed}</small></div></div>
      {filtered.length ? <div className="chapter-grid">{filtered.map((item) => <ChapterCard key={item.id} item={item} done={completed.includes(item.id)} onOpen={openChapter} t={t} />)}</div> : <div className="empty-state"><Search size={30} /><h3>{t.noResult}</h3><p>{t.noResultBody}</p></div>}
    </section>
    <section className="master-rule"><div><span>THE MASTER RULE</span><h2>{t.masterTitle.split('\n')[0]}<br />{t.masterTitle.split('\n')[1]}</h2></div><p>{t.masterBody}</p></section>
  </>
}

function PracticeView({ lang, t }) {
  const [index, setIndex] = useState(0), [selected, setSelected] = useState(null), [score, setScore] = useState(0), [finished, setFinished] = useState(false)
  const questions = lang === 'en' ? quizEn : quiz
  const current = questions[index]
  const choose = (i) => { if (selected !== null) return; setSelected(i); if (i === current.answer) setScore((s) => s + 1) }
  const next = () => { if (index === questions.length - 1) setFinished(true); else { setIndex((n) => n + 1); setSelected(null) } }
  const reset = () => { setIndex(0); setSelected(null); setScore(0); setFinished(false) }
  if (finished) return <section className="practice-page result-page"><div className="result-orbit"><Trophy size={54} /><span>{score}/{questions.length}</span></div><p className="section-kicker">{t.resultKicker}</p><h1>{score >= 10 ? t.resultHigh : score >= 7 ? t.resultMid : t.resultLow}</h1><p>{t.resultBody(Math.round(score / questions.length * 100))}</p><button className="primary-btn" onClick={reset}><RotateCcw size={18} /> {t.retry}</button></section>
  return <section className="practice-page">
    <div className="practice-head"><div><p className="section-kicker">{t.practiceKicker}</p><h1>{t.practiceTitle}</h1><p>{t.practiceBody}</p></div><div className="score-box"><small>{t.score}</small><strong>{score}<span>/{questions.length}</span></strong></div></div>
    <div className="quiz-progress"><span style={{ width: `${((index + 1) / questions.length) * 100}%` }} /></div>
    <article className="quiz-card"><div className="quiz-label"><span>{t.question} {String(index + 1).padStart(2, '0')}</span><small>{index + 1} / {questions.length}</small></div><h2>{current.q}</h2><div className="options">{current.options.map((option, i) => { const state = selected === null ? '' : i === current.answer ? 'correct' : i === selected ? 'wrong' : 'dim'; return <button className={state} key={option} onClick={() => choose(i)}><span>{String.fromCharCode(65 + i)}</span><p>{option}</p>{state === 'correct' && <Check size={18} />}{state === 'wrong' && <X size={18} />}</button> })}</div>
      {selected !== null && <div className={`explanation ${selected === current.answer ? 'right' : 'wrong'}`}><span>{selected === current.answer ? t.correct : t.incorrect}</span><p>{current.why}</p><button onClick={next}>{index === questions.length - 1 ? t.seeResult : t.nextQuestion} <ArrowRight size={17} /></button></div>}
    </article>
  </section>
}

function ReferenceView({ lang, t }) {
  const [number, setNumber] = useState(''), [revealed, setRevealed] = useState(false)
  const n = Number(number), valid = n >= 1 && n <= 162
  useEffect(() => setRevealed(false), [number])
  const patterns = lang === 'en' ? examPatternsEn : examPatterns
  return <section className="reference-page"><div className="reference-hero"><p className="section-kicker">{t.referenceKicker}</p><h1>{t.referenceTitle}</h1><p>{t.referenceBody}</p></div>
    <div className="pattern-grid">{patterns.map(([signal, action], i) => <div key={signal}><span>{String(i + 1).padStart(2, '0')}</span><p>{signal}</p><ArrowRight size={17} /><b>{action}</b></div>)}</div>
    <section className="domain-audit-panel"><div className="audit-summary"><div><span>{t.coverage}</span><h2>{t.coverageTitle}</h2><p>{t.coverageBody}</p></div><strong>100<small>%</small></strong></div><div className="audit-domains">{domainAudit.map((domain) => <div key={domain.code}><span>{domain.code}</span><p><b>{domain.title}</b><small>{domain.sections} sections · {domain.lessons.length} {t.related}</small></p><CheckCircle2 size={17} /></div>)}</div></section>
    <div className="answer-lookup"><div><p className="section-kicker">{t.answerIndex}</p><h2>{t.checkQuestion}</h2><p>{t.checkBody}</p></div><div className="lookup-control"><label htmlFor="questionNumber">{t.questionNumber}</label><div><input id="questionNumber" type="number" min="1" max="162" placeholder="001" value={number} onChange={(e) => setNumber(e.target.value)} /><button disabled={!valid} onClick={() => setRevealed(true)}>{t.check}</button></div>{number && !valid && <small>{t.invalid}</small>}</div>{revealed && valid && <div className="answer-reveal"><span>Q{String(n).padStart(3, '0')}</span><p>{t.correctAnswer}</p><strong>{answerKey[n - 1]}</strong></div>}</div>
    <div className="trap-panel"><div><Target size={25} /><div><span>{t.fiveTraps}</span><h2>{t.trapHeadline}</h2></div></div><ul>{t.referenceTraps.map((trap) => <li key={trap}>{trap}</li>)}</ul></div>
  </section>
}

export default function App() {
  const { lang, setLang, t } = useLanguage()
  const curriculum = useMemo(() => localizedChapters(chapters, lang), [lang])
  const [view, setView] = useState('learn'), [query, setQuery] = useState(''), [menuOpen, setMenuOpen] = useState(false), [selectedChapter, setSelectedChapter] = useState(() => {
    const lessonId = new URLSearchParams(window.location.search).get('lesson')
    return curriculum.find((chapter) => chapter.id === lessonId) ?? null
  })
  const [dark, setDark] = useState(true)
  const { completed, toggle } = useLearningProgress()
  useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light' }, [dark])
  useEffect(() => {
    setQuery('')
    setSelectedChapter((current) => current ? curriculum.find((chapter) => chapter.id === current.id) ?? null : null)
  }, [curriculum])
  useEffect(() => {
    const shortcut = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); document.querySelector('.search-box input')?.focus() } }
    document.addEventListener('keydown', shortcut); return () => document.removeEventListener('keydown', shortcut)
  }, [])
  const syncLessonUrl = (item) => { const url = new URL(window.location.href); if (item) url.searchParams.set('lesson', item.id); else url.searchParams.delete('lesson'); window.history.replaceState({}, '', url) }
  const openChapter = (item) => { setSelectedChapter(item); syncLessonUrl(item) }
  const closeChapter = () => { setSelectedChapter(null); syncLessonUrl(null) }
  const moveChapter = (step) => { const i = curriculum.findIndex((c) => c.id === selectedChapter.id); const next = curriculum[(i + step + curriculum.length) % curriculum.length]; setSelectedChapter(next); syncLessonUrl(next) }
  return <div className="app-shell"><Sidebar view={view} setView={setView} completed={completed} open={menuOpen} onClose={() => setMenuOpen(false)} t={t} /><div className="main-shell"><Topbar onMenu={() => setMenuOpen(true)} query={query} setQuery={setQuery} dark={dark} setDark={setDark} lang={lang} setLang={setLang} t={t} /><main>{view === 'learn' && <LearnView completed={completed} query={query} openChapter={openChapter} curriculum={curriculum} t={t} />}{view === 'practice' && <PracticeView lang={lang} t={t} />}{view === 'reference' && <ReferenceView lang={lang} t={t} />}</main><footer className="site-footer"><Logo /><p>{t.footer}</p><span className="footer-verified"><CheckCircle2 size={14} /> {t.footerChecked}</span></footer></div>{selectedChapter && <ChapterModal item={selectedChapter} done={completed.includes(selectedChapter.id)} onToggle={toggle} onClose={closeChapter} onMove={moveChapter} lang={lang} t={t} />}</div>
}
