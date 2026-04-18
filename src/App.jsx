import { useMemo, useState } from 'react'

const TABS = ['Home', 'Plan', 'Team', 'Analyze']
const PLAN_VIEWS = ['Projects', 'Scenarios', 'Timeline']
const TEAM_VIEWS = ['Roster', 'Skills']
const ANALYZE_VIEWS = ['Growth', 'Reports']

const disciplines = [
  { id: 'd1', name: 'Product Design', color: '#00e5a0' },
  { id: 'd2', name: 'Service Design', color: '#38bdf8' },
  { id: 'd3', name: 'Platform/Systems', color: '#a78bfa' },
  { id: 'd4', name: 'Research & Ops', color: '#fb923c' },
]

const skills = [
  { id: 's1', name: 'User Research', cat: 'Discovery', color: '#a78bfa' },
  { id: 's2', name: 'Facilitation', cat: 'Discovery', color: '#a78bfa' },
  { id: 's3', name: 'IA', cat: 'Structure', color: '#38bdf8' },
  { id: 's4', name: 'Systems Design', cat: 'Structure', color: '#38bdf8' },
  { id: 's5', name: 'Interaction Design', cat: 'Craft', color: '#00e5a0' },
  { id: 's6', name: 'Prototyping', cat: 'Craft', color: '#00e5a0' },
  { id: 's7', name: 'Visual Design', cat: 'Craft', color: '#00e5a0' },
  { id: 's8', name: 'Content Strategy', cat: 'Strategy', color: '#fb923c' },
]

const team = [
  { id: 't1', name: 'Maya Chen', role: 'Sr. UX Designer', discId: 'd1', cap: 80, emp: 'FTE', avatar: 'MC', sp: { s5: 4, s6: 4, s7: 3 }, powers: ['Workshop Design', 'Storytelling'] },
  { id: 't2', name: 'Jordan Webb', role: 'UX Researcher', discId: 'd4', cap: 100, emp: 'FTE', avatar: 'JW', sp: { s1: 5, s2: 4, s8: 3 }, powers: ['Human Centered Design'] },
  { id: 't3', name: 'Sam Rivera', role: 'UX Architect', discId: 'd3', cap: 100, emp: 'FTE', avatar: 'SR', sp: { s3: 4, s4: 5, s5: 3 }, powers: ['Technical Writing', 'Developer Advocacy'] },
  { id: 't4', name: 'Alex Kim', role: 'Visual Designer', discId: 'd1', cap: 60, emp: 'Contractor', avatar: 'AK', sp: { s7: 4, s6: 3, s8: 2 }, powers: ['Motion Design'] },
]

const scenarios = [
  { id: 'sc1', name: 'Q3 Roadmap', desc: 'Committed Q3 deliverables', color: '#00e5a0', active: true },
  { id: 'sc2', name: 'Stretch Plan', desc: 'If we hit hiring targets', color: '#38bdf8', active: false },
]

const projects = [
  {
    id: 'p1', scId: 'sc1', name: 'Mobile App Redesign', type: 'full', stage: 'Design', prio: 'High', due: '2025-09-15', owner: 'Maya Chen', fte: 2,
    sr: { s5: 3, s7: 3, s6: 3 },
    roster: [
      { mId: 't1', alloc: 60, role: 'Lead Designer' },
      { mId: 't4', alloc: 50, role: 'Visual Designer' },
    ],
  },
  {
    id: 'p2', scId: 'sc1', name: 'Enterprise Dashboard', type: 'full', stage: 'Deliver', prio: 'Critical', due: '2025-08-31', owner: 'Sam Rivera', fte: 3,
    sr: { s3: 4, s4: 4, s5: 3 },
    roster: [
      { mId: 't3', alloc: 80, role: 'UX Architect' },
      { mId: 't1', alloc: 30, role: 'IxD Support' },
    ],
  },
  {
    id: 'p3', scId: 'sc1', name: 'User Research Sprint', type: 'full', stage: 'Discovery', prio: 'Medium', due: '2025-08-15', owner: 'Jordan Webb', fte: 1,
    sr: { s1: 3, s2: 3 },
    roster: [
      { mId: 't2', alloc: 70, role: 'Lead Researcher' },
    ],
  },
  {
    id: 'p4', scId: 'sc2', name: 'Design System v2', type: 'full', stage: 'Define', prio: 'High', due: '2025-10-31', owner: 'Sam Rivera', fte: 2,
    sr: { s4: 4, s7: 3 },
    roster: [
      { mId: 't3', alloc: 60, role: 'Systems Lead' },
      { mId: 't4', alloc: 40, role: 'Visual Systems' },
    ],
  },
  {
    id: 'p5', scId: 'sc1', name: 'Design Guild', type: 'side', stage: 'Discovery', prio: 'Low', due: 'Ongoing', owner: 'Maya Chen', fte: 0.2,
    sr: {},
    roster: [
      { mId: 't1', alloc: 10, role: 'Facilitator' },
      { mId: 't2', alloc: 10, role: 'Contributor' },
      { mId: 't3', alloc: 10, role: 'Contributor' },
    ],
  },
]

function badgeClass(priority) {
  if (priority === 'Critical') return 'badge critical'
  if (priority === 'High') return 'badge high'
  if (priority === 'Medium') return 'badge medium'
  return 'badge low'
}

function memberLoad(memberId) {
  return projects.reduce((sum, project) => {
    const hit = project.roster.find((r) => r.mId === memberId)
    return sum + (hit ? hit.alloc : 0)
  }, 0)
}

function requirementList(sr) {
  return Object.entries(sr).map(([sid, level]) => {
    const skill = skills.find((s) => s.id === sid)
    return `${skill?.name || sid} ${level}`
  })
}

function App() {
  const [tab, setTab] = useState('Home')
  const [planView, setPlanView] = useState('Projects')
  const [teamView, setTeamView] = useState('Roster')
  const [analyzeView, setAnalyzeView] = useState('Growth')

  const activeScenario = scenarios.find((s) => s.active)
  const activeProjects = useMemo(
    () => projects.filter((project) => project.scId === activeScenario?.id),
    [activeScenario],
  )

  const totalFte = activeProjects.reduce((sum, project) => sum + project.fte, 0)
  const overAllocated = team.filter((member) => memberLoad(member.id) > member.cap)
  const criticalProjects = activeProjects.filter((project) => project.prio === 'Critical').length

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <div className="eyebrow">FLUX2</div>
          <h1>UX Resource Planner</h1>
          <p>Planning, staffing, and visibility for UX workstreams.</p>
        </div>
      </header>

      <nav className="tabs">
        {TABS.map((item) => (
          <button
            key={item}
            className={tab === item ? 'tab active' : 'tab'}
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
      </nav>

      {tab === 'Home' && (
        <section className="page-grid">
          <article className="panel stat-panel">
            <span className="label">Active scenario</span>
            <strong>{activeScenario?.name}</strong>
            <p>{activeScenario?.desc}</p>
          </article>
          <article className="panel stat-panel">
            <span className="label">Active projects</span>
            <strong>{activeProjects.length}</strong>
            <p>{criticalProjects} critical priorities in flight</p>
          </article>
          <article className="panel stat-panel">
            <span className="label">Planned FTE</span>
            <strong>{totalFte.toFixed(1)}</strong>
            <p>Across roadmap and side-of-desk commitments</p>
          </article>
          <article className="panel stat-panel">
            <span className="label">Allocation risk</span>
            <strong>{overAllocated.length}</strong>
            <p>People currently over capacity</p>
          </article>

          <article className="panel wide">
            <div className="section-head">
              <div>
                <span className="label">Highlights</span>
                <h2>What needs attention</h2>
              </div>
            </div>
            <div className="stack">
              {overAllocated.map((member) => (
                <div key={member.id} className="row-card">
                  <div>
                    <strong>{member.name}</strong>
                    <p>{member.role}</p>
                  </div>
                  <span className="badge critical">{memberLoad(member.id)}% / {member.cap}%</span>
                </div>
              ))}
              {overAllocated.length === 0 && <p className="muted">No one is over capacity right now.</p>}
            </div>
          </article>

          <article className="panel wide">
            <div className="section-head">
              <div>
                <span className="label">Roadmap snapshot</span>
                <h2>Current projects</h2>
              </div>
            </div>
            <div className="stack">
              {activeProjects.map((project) => (
                <div key={project.id} className="project-row">
                  <div>
                    <strong>{project.name}</strong>
                    <p>{project.stage} · Due {project.due} · Owner {project.owner}</p>
                  </div>
                  <span className={badgeClass(project.prio)}>{project.prio}</span>
                </div>
              ))}
            </div>
          </article>
        </section>
      )}

      {tab === 'Plan' && (
        <section>
          <div className="subtabs">
            {PLAN_VIEWS.map((item) => (
              <button key={item} className={planView === item ? 'subtab active' : 'subtab'} onClick={() => setPlanView(item)}>{item}</button>
            ))}
          </div>

          {planView === 'Projects' && (
            <div className="stack">
              {projects.map((project) => (
                <article key={project.id} className="panel">
                  <div className="section-head">
                    <div>
                      <span className="label">{project.type === 'side' ? 'Side effort' : 'Project'}</span>
                      <h2>{project.name}</h2>
                      <p>{project.stage} · Due {project.due} · Owner {project.owner}</p>
                    </div>
                    <span className={badgeClass(project.prio)}>{project.prio}</span>
                  </div>
                  <div className="two-col">
                    <div>
                      <span className="label">Required skills</span>
                      <ul className="chip-list">
                        {requirementList(project.sr).map((item) => <li key={item}>{item}</li>)}
                        {requirementList(project.sr).length === 0 && <li>No minimum skill gates</li>}
                      </ul>
                    </div>
                    <div>
                      <span className="label">Roster</span>
                      <ul className="list">
                        {project.roster.map((entry) => {
                          const member = team.find((person) => person.id === entry.mId)
                          return <li key={`${project.id}-${entry.mId}`}>{member?.name} · {entry.role} · {entry.alloc}%</li>
                        })}
                      </ul>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {planView === 'Scenarios' && (
            <div className="stack">
              {scenarios.map((scenario) => (
                <article key={scenario.id} className="panel">
                  <div className="section-head">
                    <div>
                      <span className="label">Scenario</span>
                      <h2>{scenario.name}</h2>
                      <p>{scenario.desc}</p>
                    </div>
                    <span className={scenario.active ? 'badge medium' : 'badge low'}>{scenario.active ? 'Active' : 'Inactive'}</span>
                  </div>
                </article>
              ))}
            </div>
          )}

          {planView === 'Timeline' && (
            <article className="panel">
              <div className="section-head">
                <div>
                  <span className="label">Timeline</span>
                  <h2>Quarter view</h2>
                </div>
              </div>
              <div className="timeline">
                {activeProjects.map((project) => (
                  <div key={project.id} className="timeline-row">
                    <div className="timeline-name">{project.name}</div>
                    <div className="timeline-bar-wrap">
                      <div className="timeline-bar" style={{ width: `${Math.max(project.fte * 22, 16)}%` }} />
                    </div>
                    <div className="timeline-meta">{project.due}</div>
                  </div>
                ))}
              </div>
            </article>
          )}
        </section>
      )}

      {tab === 'Team' && (
        <section>
          <div className="subtabs">
            {TEAM_VIEWS.map((item) => (
              <button key={item} className={teamView === item ? 'subtab active' : 'subtab'} onClick={() => setTeamView(item)}>{item}</button>
            ))}
          </div>

          {teamView === 'Roster' && (
            <div className="stack roster-grid">
              {team.map((member) => {
                const load = memberLoad(member.id)
                const discipline = disciplines.find((item) => item.id === member.discId)
                return (
                  <article key={member.id} className="panel">
                    <div className="person-head">
                      <div className="avatar">{member.avatar}</div>
                      <div>
                        <h2>{member.name}</h2>
                        <p>{member.role}</p>
                      </div>
                    </div>
                    <div className="meta-block">
                      <span className="pill" style={{ borderColor: discipline?.color, color: discipline?.color }}>{discipline?.name}</span>
                      <span className="pill">{member.emp}</span>
                    </div>
                    <div className="capacity-line">
                      <span>{load}% allocated</span>
                      <span>{member.cap}% cap</span>
                    </div>
                    <div className="meter"><div className={load > member.cap ? 'meter-fill danger' : 'meter-fill'} style={{ width: `${Math.min(load, 100)}%` }} /></div>
                    <p className="muted small">Superpowers: {member.powers.join(', ')}</p>
                  </article>
                )
              })}
            </div>
          )}

          {teamView === 'Skills' && (
            <article className="panel">
              <div className="section-head">
                <div>
                  <span className="label">Skills matrix</span>
                  <h2>Capabilities on the team</h2>
                </div>
              </div>
              <div className="skill-matrix">
                <div className="matrix-head matrix-row">
                  <div>Skill</div>
                  {team.map((member) => <div key={member.id}>{member.avatar}</div>)}
                </div>
                {skills.map((skill) => (
                  <div key={skill.id} className="matrix-row">
                    <div>{skill.name}</div>
                    {team.map((member) => <div key={member.id}>{member.sp[skill.id] || '—'}</div>)}
                  </div>
                ))}
              </div>
            </article>
          )}
        </section>
      )}

      {tab === 'Analyze' && (
        <section>
          <div className="subtabs">
            {ANALYZE_VIEWS.map((item) => (
              <button key={item} className={analyzeView === item ? 'subtab active' : 'subtab'} onClick={() => setAnalyzeView(item)}>{item}</button>
            ))}
          </div>

          {analyzeView === 'Growth' && (
            <div className="page-grid">
              <article className="panel">
                <span className="label">Upskill target</span>
                <h2>Interaction Design depth</h2>
                <p>Maya and Sam already contribute here. A next hire or coaching plan should strengthen cross-coverage.</p>
              </article>
              <article className="panel">
                <span className="label">Upskill target</span>
                <h2>Systems + visual pairing</h2>
                <p>Design System v2 depends on strong systems and visual collaboration. Alex is the obvious partner for Sam.</p>
              </article>
              <article className="panel wide">
                <span className="label">Risk summary</span>
                <h2>Capacity and continuity</h2>
                <p>The active roadmap leans heavily on Maya and Sam. The healthiest next step is either redistributing delivery support or adding another senior craft-focused designer.</p>
              </article>
            </div>
          )}

          {analyzeView === 'Reports' && (
            <article className="panel">
              <div className="section-head">
                <div>
                  <span className="label">Report</span>
                  <h2>Executive summary</h2>
                </div>
              </div>
              <ul className="list">
                <li>{activeProjects.length} active efforts tied to the current roadmap</li>
                <li>{overAllocated.length} team members exceed capacity</li>
                <li>{criticalProjects} critical project currently in flight</li>
                <li>{totalFte.toFixed(1)} FTE planned in the active scenario</li>
              </ul>
            </article>
          )}
        </section>
      )}
    </div>
  )
}
