import { useEffect, useMemo, useState } from 'react'

const TABS = ['Home', 'Plan', 'Team', 'Analyze']
const PLAN_VIEWS = ['Projects', 'Scenarios', 'Timeline']
const TEAM_VIEWS = ['Roster', 'Skills']
const ANALYZE_VIEWS = ['Growth', 'Reports']
const STORAGE_KEY = 'flux2-planner-state-v1'

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

const seedTeam = [
  { id: 't1', name: 'Maya Chen', role: 'Sr. UX Designer', discId: 'd1', cap: 80, emp: 'FTE', avatar: 'MC', sp: { s5: 4, s6: 4, s7: 3 }, powers: ['Workshop Design', 'Storytelling'] },
  { id: 't2', name: 'Jordan Webb', role: 'UX Researcher', discId: 'd4', cap: 100, emp: 'FTE', avatar: 'JW', sp: { s1: 5, s2: 4, s8: 3 }, powers: ['Human Centered Design'] },
  { id: 't3', name: 'Sam Rivera', role: 'UX Architect', discId: 'd3', cap: 100, emp: 'FTE', avatar: 'SR', sp: { s3: 4, s4: 5, s5: 3 }, powers: ['Technical Writing', 'Developer Advocacy'] },
  { id: 't4', name: 'Alex Kim', role: 'Visual Designer', discId: 'd1', cap: 60, emp: 'Contractor', avatar: 'AK', sp: { s7: 4, s6: 3, s8: 2 }, powers: ['Motion Design'] },
]

const seedScenarios = [
  { id: 'sc1', name: 'Q3 Roadmap', desc: 'Committed Q3 deliverables', color: '#00e5a0', active: true },
  { id: 'sc2', name: 'Stretch Plan', desc: 'If we hit hiring targets', color: '#38bdf8', active: false },
]

const seedProjects = [
  { id: 'p1', scId: 'sc1', name: 'Mobile App Redesign', type: 'full', stage: 'Design', prio: 'High', due: '2025-09-15', owner: 'Maya Chen', fte: 2, sr: { s5: 3, s7: 3, s6: 3 }, roster: [{ id: 'r1', mId: 't1', alloc: 60, role: 'Lead Designer' }, { id: 'r2', mId: 't4', alloc: 50, role: 'Visual Designer' }] },
  { id: 'p2', scId: 'sc1', name: 'Enterprise Dashboard', type: 'full', stage: 'Deliver', prio: 'Critical', due: '2025-08-31', owner: 'Sam Rivera', fte: 3, sr: { s3: 4, s4: 4, s5: 3 }, roster: [{ id: 'r3', mId: 't3', alloc: 80, role: 'UX Architect' }, { id: 'r4', mId: 't1', alloc: 30, role: 'IxD Support' }] },
  { id: 'p3', scId: 'sc1', name: 'User Research Sprint', type: 'full', stage: 'Discovery', prio: 'Medium', due: '2025-08-15', owner: 'Jordan Webb', fte: 1, sr: { s1: 3, s2: 3 }, roster: [{ id: 'r5', mId: 't2', alloc: 70, role: 'Lead Researcher' }] },
  { id: 'p4', scId: 'sc2', name: 'Design System v2', type: 'full', stage: 'Define', prio: 'High', due: '2025-10-31', owner: 'Sam Rivera', fte: 2, sr: { s4: 4, s7: 3 }, roster: [{ id: 'r6', mId: 't3', alloc: 60, role: 'Systems Lead' }, { id: 'r7', mId: 't4', alloc: 40, role: 'Visual Systems' }] },
  { id: 'p5', scId: 'sc1', name: 'Design Guild', type: 'side', stage: 'Discovery', prio: 'Low', due: 'Ongoing', owner: 'Maya Chen', fte: 0.2, sr: {}, roster: [{ id: 'r8', mId: 't1', alloc: 10, role: 'Facilitator' }, { id: 'r9', mId: 't2', alloc: 10, role: 'Contributor' }, { id: 'r10', mId: 't3', alloc: 10, role: 'Contributor' }] },
]

const uid = (prefix) => `${prefix}${Math.random().toString(36).slice(2, 8)}`

function getInitialState() {
  if (typeof window === 'undefined') return { team: seedTeam, scenarios: seedScenarios, projects: seedProjects }
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return { team: seedTeam, scenarios: seedScenarios, projects: seedProjects }
  try {
    const parsed = JSON.parse(raw)
    return {
      team: parsed.team?.length ? parsed.team : seedTeam,
      scenarios: parsed.scenarios?.length ? parsed.scenarios : seedScenarios,
      projects: parsed.projects?.length ? parsed.projects : seedProjects,
    }
  } catch {
    return { team: seedTeam, scenarios: seedScenarios, projects: seedProjects }
  }
}

function badgeClass(priority) {
  if (priority === 'Critical') return 'badge critical'
  if (priority === 'High') return 'badge high'
  if (priority === 'Medium') return 'badge medium'
  return 'badge low'
}

function requirementList(sr) {
  return Object.entries(sr).map(([sid, level]) => {
    const skill = skills.find((s) => s.id === sid)
    return `${skill?.name || sid} ${level}`
  })
}

function Field({ label, children }) {
  return <label className="field"><span className="label">{label}</span>{children}</label>
}

function ProjectEditor({ project, scenarios, setProjects }) {
  const updateProject = (field, value) => {
    setProjects((prev) => prev.map((item) => item.id === project.id ? {
      ...item,
      [field]: field === 'fte' ? Number(value) : value,
    } : item))
  }

  return (
    <div className="roster-editor">
      <div className="section-head compact"><div><span className="label">Project details</span><h3>Edit project</h3></div></div>
      <div className="mini-form">
        <Field label="Project name"><input className="input" value={project.name} onChange={(e) => updateProject('name', e.target.value)} /></Field>
        <Field label="Owner"><input className="input" value={project.owner || ''} onChange={(e) => updateProject('owner', e.target.value)} /></Field>
        <Field label="Scenario"><select className="input" value={project.scId} onChange={(e) => updateProject('scId', e.target.value)}>{scenarios.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
        <Field label="Type"><select className="input" value={project.type} onChange={(e) => updateProject('type', e.target.value)}><option value="full">full</option><option value="side">side</option></select></Field>
        <Field label="Priority"><select className="input" value={project.prio} onChange={(e) => updateProject('prio', e.target.value)}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></Field>
        <Field label="Stage"><select className="input" value={project.stage} onChange={(e) => updateProject('stage', e.target.value)}><option>Discovery</option><option>Define</option><option>Design</option><option>Deliver</option></select></Field>
        <Field label="Due"><input className="input" value={project.due || ''} onChange={(e) => updateProject('due', e.target.value)} placeholder="2026-05-01" /></Field>
        <Field label="FTE"><input className="input" type="number" step="0.1" value={project.fte} onChange={(e) => updateProject('fte', e.target.value)} /></Field>
      </div>
    </div>
  )
}

function TeamEditor({ member, setTeam }) {
  const updateMember = (field, value) => {
    setTeam((prev) => prev.map((item) => {
      if (item.id !== member.id) return item
      const next = { ...item, [field]: field === 'cap' ? Number(value) : value }
      if (field === 'name') {
        next.avatar = value.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || item.avatar
      }
      return next
    }))
  }

  const updatePower = (index, value) => {
    setTeam((prev) => prev.map((item) => {
      if (item.id !== member.id) return item
      const powers = [...(item.powers || [])]
      powers[index] = value
      return { ...item, powers }
    }))
  }

  const addPower = () => {
    setTeam((prev) => prev.map((item) => item.id === member.id ? { ...item, powers: [...(item.powers || []), ''] } : item))
  }

  const removePower = (index) => {
    setTeam((prev) => prev.map((item) => item.id === member.id ? { ...item, powers: (item.powers || []).filter((_, i) => i !== index) } : item))
  }

  const updateSkill = (skillId, value) => {
    setTeam((prev) => prev.map((item) => item.id === member.id ? { ...item, sp: { ...(item.sp || {}), [skillId]: value === '' ? undefined : Number(value) } } : item))
  }

  return (
    <div className="roster-editor">
      <div className="section-head compact"><div><span className="label">Team details</span><h3>Edit person</h3></div></div>
      <div className="mini-form">
        <Field label="Name"><input className="input" value={member.name} onChange={(e) => updateMember('name', e.target.value)} /></Field>
        <Field label="Role"><input className="input" value={member.role} onChange={(e) => updateMember('role', e.target.value)} /></Field>
        <Field label="Discipline"><select className="input" value={member.discId} onChange={(e) => updateMember('discId', e.target.value)}>{disciplines.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
        <Field label="Capacity %"><input className="input" type="number" value={member.cap} onChange={(e) => updateMember('cap', e.target.value)} /></Field>
        <Field label="Type"><select className="input" value={member.emp} onChange={(e) => updateMember('emp', e.target.value)}><option>FTE</option><option>Contractor</option><option>Part-time</option><option>Consultant</option></select></Field>
      </div>

      <div className="section-head compact team-subhead"><div><span className="label">Superpowers</span></div><button className="subtab" type="button" onClick={addPower}>Add superpower</button></div>
      <div className="stack">
        {(member.powers || []).length === 0 && <p className="muted">No superpowers listed yet.</p>}
        {(member.powers || []).map((power, index) => (
          <div key={`${member.id}-power-${index}`} className="power-row">
            <input className="input" value={power} onChange={(e) => updatePower(index, e.target.value)} placeholder="Workshop Design" />
            <button className="subtab danger" type="button" onClick={() => removePower(index)}>Remove</button>
          </div>
        ))}
      </div>

      <div className="section-head compact team-subhead"><div><span className="label">Skill ratings</span></div></div>
      <div className="skill-edit-grid">
        {skills.map((skill) => (
          <Field key={`${member.id}-${skill.id}`} label={skill.name}>
            <input className="input" type="number" min="1" max="5" value={member.sp?.[skill.id] ?? ''} onChange={(e) => updateSkill(skill.id, e.target.value)} placeholder="—" />
          </Field>
        ))}
      </div>
    </div>
  )
}

function RosterEditor({ project, team, setProjects, memberLoad }) {
  const [newRoster, setNewRoster] = useState({ mId: team[0]?.id || '', alloc: 25, role: '' })

  useEffect(() => {
    setNewRoster((prev) => ({ ...prev, mId: team[0]?.id || '' }))
  }, [team])

  const updateRosterItem = (rosterId, field, value) => {
    setProjects((prev) => prev.map((item) => item.id === project.id ? {
      ...item,
      roster: item.roster.map((entry) => entry.id === rosterId ? { ...entry, [field]: field === 'alloc' ? Number(value) : value } : entry),
    } : item))
  }

  const removeRosterItem = (rosterId) => {
    setProjects((prev) => prev.map((item) => item.id === project.id ? { ...item, roster: item.roster.filter((entry) => entry.id !== rosterId) } : item))
  }

  const addRosterItem = (e) => {
    e.preventDefault()
    if (!newRoster.mId) return
    setProjects((prev) => prev.map((item) => item.id === project.id ? {
      ...item,
      roster: [...item.roster, { id: uid('r'), mId: newRoster.mId, alloc: Number(newRoster.alloc), role: newRoster.role || 'Contributor' }],
    } : item))
    setNewRoster({ mId: team[0]?.id || '', alloc: 25, role: '' })
  }

  return (
    <div className="roster-editor">
      <div className="section-head compact"><div><span className="label">Roster assignment</span><h3>Assign and edit people</h3></div></div>
      <form className="mini-form" onSubmit={addRosterItem}>
        <Field label="Person"><select className="input" value={newRoster.mId} onChange={(e) => setNewRoster({ ...newRoster, mId: e.target.value })}>{team.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></Field>
        <Field label="Role"><input className="input" value={newRoster.role} onChange={(e) => setNewRoster({ ...newRoster, role: e.target.value })} placeholder="Lead Designer" /></Field>
        <Field label="Alloc %"><input className="input" type="number" min="1" max="100" value={newRoster.alloc} onChange={(e) => setNewRoster({ ...newRoster, alloc: e.target.value })} /></Field>
        <div className="form-actions"><button className="subtab active" type="submit">Assign</button></div>
      </form>

      <div className="stack">
        {project.roster.length === 0 && <p className="muted">No one assigned yet.</p>}
        {project.roster.map((entry) => {
          const member = team.find((person) => person.id === entry.mId)
          const totalLoad = member ? memberLoad(member.id) : 0
          const over = member ? totalLoad > Number(member.cap) : false
          return (
            <div key={entry.id} className="roster-row">
              <div className="roster-main"><strong>{member?.name || entry.mId}</strong><span className={over ? 'badge critical' : 'badge low'}>{totalLoad}% / {member?.cap ?? '—'}%</span></div>
              <div className="roster-fields">
                <Field label="Role"><input className="input" value={entry.role} onChange={(e) => updateRosterItem(entry.id, 'role', e.target.value)} /></Field>
                <Field label="Alloc %"><input className="input" type="number" min="1" max="100" value={entry.alloc} onChange={(e) => updateRosterItem(entry.id, 'alloc', e.target.value)} /></Field>
              </div>
              <div className="actions"><button className="subtab danger" type="button" onClick={() => removeRosterItem(entry.id)}>Remove</button></div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function App() {
  const initial = getInitialState()
  const [tab, setTab] = useState('Home')
  const [planView, setPlanView] = useState('Projects')
  const [teamView, setTeamView] = useState('Roster')
  const [analyzeView, setAnalyzeView] = useState('Growth')
  const [team, setTeam] = useState(initial.team)
  const [scenarios, setScenarios] = useState(initial.scenarios)
  const [projects, setProjects] = useState(initial.projects)
  const [expandedProjects, setExpandedProjects] = useState({ [initial.projects[0]?.id || '']: true })
  const [expandedMembers, setExpandedMembers] = useState({ [initial.team[0]?.id || '']: true })
  const [projectForm, setProjectForm] = useState({ name: '', scId: 'sc1', type: 'full', stage: 'Discovery', prio: 'Medium', due: '', owner: '', fte: 1 })
  const [scenarioForm, setScenarioForm] = useState({ name: '', desc: '', color: '#38bdf8' })
  const [teamForm, setTeamForm] = useState({ name: '', role: '', discId: 'd1', cap: 100, emp: 'FTE' })

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ team, scenarios, projects }))
  }, [team, scenarios, projects])

  const activeScenario = scenarios.find((s) => s.active) || scenarios[0]
  const activeProjects = useMemo(() => projects.filter((project) => project.scId === activeScenario?.id), [activeScenario, projects])
  const memberLoad = (memberId) => projects.reduce((sum, project) => {
    const hit = project.roster.find((r) => r.mId === memberId)
    return sum + (hit ? Number(hit.alloc) : 0)
  }, 0)

  const totalFte = activeProjects.reduce((sum, project) => sum + Number(project.fte || 0), 0)
  const overAllocated = team.filter((member) => memberLoad(member.id) > Number(member.cap))
  const criticalProjects = activeProjects.filter((project) => project.prio === 'Critical').length

  const toggleProject = (id) => setExpandedProjects((prev) => ({ ...prev, [id]: !prev[id] }))
  const toggleMember = (id) => setExpandedMembers((prev) => ({ ...prev, [id]: !prev[id] }))

  const addScenario = (e) => {
    e.preventDefault()
    if (!scenarioForm.name.trim()) return
    const newScenario = { id: uid('sc'), ...scenarioForm, active: scenarios.length === 0 }
    setScenarios((prev) => [...prev.map((item) => ({ ...item, active: false })), newScenario])
    setScenarioForm({ name: '', desc: '', color: '#38bdf8' })
  }

  const setActiveScenario = (id) => setScenarios((prev) => prev.map((item) => ({ ...item, active: item.id === id })))

  const deleteScenario = (id) => {
    const nextScenarios = scenarios.filter((item) => item.id !== id)
    if (!nextScenarios.length) return
    if (!nextScenarios.some((item) => item.active)) nextScenarios[0].active = true
    setScenarios([...nextScenarios])
    setProjects((prev) => prev.filter((project) => project.scId !== id))
  }

  const addProject = (e) => {
    e.preventDefault()
    if (!projectForm.name.trim()) return
    const newProject = { id: uid('p'), ...projectForm, fte: Number(projectForm.fte), roster: [], sr: {} }
    setProjects((prev) => [...prev, newProject])
    setExpandedProjects((prev) => ({ ...prev, [newProject.id]: true }))
    setProjectForm({ name: '', scId: activeScenario?.id || scenarios[0]?.id || '', type: 'full', stage: 'Discovery', prio: 'Medium', due: '', owner: '', fte: 1 })
  }

  const deleteProject = (id) => setProjects((prev) => prev.filter((project) => project.id !== id))

  const addTeamMember = (e) => {
    e.preventDefault()
    if (!teamForm.name.trim()) return
    const initials = teamForm.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
    const newMember = { id: uid('t'), ...teamForm, cap: Number(teamForm.cap), avatar: initials || 'UX', sp: {}, powers: [] }
    setTeam((prev) => [...prev, newMember])
    setExpandedMembers((prev) => ({ ...prev, [newMember.id]: true }))
    setTeamForm({ name: '', role: '', discId: 'd1', cap: 100, emp: 'FTE' })
  }

  const deleteTeamMember = (id) => {
    setTeam((prev) => prev.filter((member) => member.id !== id))
    setProjects((prev) => prev.map((project) => ({ ...project, roster: project.roster.filter((entry) => entry.mId !== id) })))
  }

  const resetAll = () => {
    setTeam(seedTeam)
    setScenarios(seedScenarios)
    setProjects(seedProjects)
    setExpandedProjects({ [seedProjects[0]?.id || '']: true })
    setExpandedMembers({ [seedTeam[0]?.id || '']: true })
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <div className="eyebrow">FLUX2</div>
          <h1>UX Resource Planner</h1>
          <p>Planning, staffing, and visibility for UX workstreams.</p>
        </div>
        <button className="subtab" onClick={resetAll}>Reset seed data</button>
      </header>

      <nav className="tabs">
        {TABS.map((item) => <button key={item} className={tab === item ? 'tab active' : 'tab'} onClick={() => setTab(item)}>{item}</button>)}
      </nav>

      {tab === 'Home' && (
        <section className="page-grid">
          <article className="panel stat-panel"><span className="label">Active scenario</span><strong>{activeScenario?.name}</strong><p>{activeScenario?.desc}</p></article>
          <article className="panel stat-panel"><span className="label">Active projects</span><strong>{activeProjects.length}</strong><p>{criticalProjects} critical priorities in flight</p></article>
          <article className="panel stat-panel"><span className="label">Planned FTE</span><strong>{totalFte.toFixed(1)}</strong><p>Across roadmap and side-of-desk commitments</p></article>
          <article className="panel stat-panel"><span className="label">Allocation risk</span><strong>{overAllocated.length}</strong><p>People currently over capacity</p></article>
        </section>
      )}

      {tab === 'Plan' && (
        <section>
          <div className="subtabs">
            {PLAN_VIEWS.map((item) => <button key={item} className={planView === item ? 'subtab active' : 'subtab'} onClick={() => setPlanView(item)}>{item}</button>)}
          </div>

          {planView === 'Projects' && (
            <>
              <form className="panel form-grid" onSubmit={addProject}>
                <div className="section-head"><div><span className="label">Create</span><h2>Add project</h2></div></div>
                <Field label="Project name"><input className="input" value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} /></Field>
                <Field label="Scenario"><select className="input" value={projectForm.scId} onChange={(e) => setProjectForm({ ...projectForm, scId: e.target.value })}>{scenarios.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
                <Field label="Owner"><input className="input" value={projectForm.owner} onChange={(e) => setProjectForm({ ...projectForm, owner: e.target.value })} /></Field>
                <Field label="Priority"><select className="input" value={projectForm.prio} onChange={(e) => setProjectForm({ ...projectForm, prio: e.target.value })}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></Field>
                <Field label="Stage"><select className="input" value={projectForm.stage} onChange={(e) => setProjectForm({ ...projectForm, stage: e.target.value })}><option>Discovery</option><option>Define</option><option>Design</option><option>Deliver</option></select></Field>
                <Field label="Due"><input className="input" value={projectForm.due} onChange={(e) => setProjectForm({ ...projectForm, due: e.target.value })} placeholder="2026-05-01" /></Field>
                <Field label="FTE"><input className="input" type="number" step="0.1" value={projectForm.fte} onChange={(e) => setProjectForm({ ...projectForm, fte: e.target.value })} /></Field>
                <div className="form-actions"><button className="tab active" type="submit">Add project</button></div>
              </form>

              <div className="stack">
                {projects.map((project) => {
                  const isOpen = !!expandedProjects[project.id]
                  return (
                    <article key={project.id} className="panel">
                      <div className="section-head">
                        <div><span className="label">{project.type === 'side' ? 'Side effort' : 'Project'}</span><h2>{project.name}</h2><p>{project.stage} · Due {project.due || 'TBD'} · Owner {project.owner || 'Unassigned'}</p></div>
                        <div className="actions"><span className={badgeClass(project.prio)}>{project.prio}</span><button className="subtab" type="button" onClick={() => toggleProject(project.id)}>{isOpen ? 'Close' : 'Open'}</button><button className="subtab danger" type="button" onClick={() => deleteProject(project.id)}>Delete</button></div>
                      </div>
                      {isOpen && (
                        <>
                          <ProjectEditor project={project} scenarios={scenarios} setProjects={setProjects} />
                          <div className="two-col">
                            <div><span className="label">Required skills</span><ul className="chip-list">{requirementList(project.sr).length ? requirementList(project.sr).map((item) => <li key={item}>{item}</li>) : <li>No minimum skill gates</li>}</ul></div>
                            <div><span className="label">Roster summary</span><ul className="list">{project.roster.length ? project.roster.map((entry) => { const member = team.find((person) => person.id === entry.mId); return <li key={entry.id}>{member?.name || entry.mId} · {entry.role} · {entry.alloc}%</li> }) : <li>No one assigned yet</li>}</ul></div>
                          </div>
                          <RosterEditor project={project} team={team} setProjects={setProjects} memberLoad={memberLoad} />
                        </>
                      )}
                    </article>
                  )
                })}
              </div>
            </>
          )}

          {planView === 'Scenarios' && (
            <>
              <form className="panel form-grid" onSubmit={addScenario}>
                <div className="section-head"><div><span className="label">Create</span><h2>Add scenario</h2></div></div>
                <Field label="Scenario name"><input className="input" value={scenarioForm.name} onChange={(e) => setScenarioForm({ ...scenarioForm, name: e.target.value })} /></Field>
                <Field label="Description"><input className="input" value={scenarioForm.desc} onChange={(e) => setScenarioForm({ ...scenarioForm, desc: e.target.value })} /></Field>
                <Field label="Color"><input className="input" value={scenarioForm.color} onChange={(e) => setScenarioForm({ ...scenarioForm, color: e.target.value })} /></Field>
                <div className="form-actions"><button className="tab active" type="submit">Add scenario</button></div>
              </form>
              <div className="stack">
                {scenarios.map((scenario) => (
                  <article key={scenario.id} className="panel">
                    <div className="section-head">
                      <div><span className="label">Scenario</span><h2>{scenario.name}</h2><p>{scenario.desc}</p></div>
                      <div className="actions"><button className={scenario.active ? 'subtab active' : 'subtab'} type="button" onClick={() => setActiveScenario(scenario.id)}>{scenario.active ? 'Active' : 'Set active'}</button>{scenarios.length > 1 && <button className="subtab danger" type="button" onClick={() => deleteScenario(scenario.id)}>Delete</button>}</div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          {planView === 'Timeline' && (
            <article className="panel">
              <div className="section-head"><div><span className="label">Timeline</span><h2>Quarter view</h2></div></div>
              <div className="timeline">
                {activeProjects.map((project) => (
                  <div key={project.id} className="timeline-row">
                    <div className="timeline-name">{project.name}</div>
                    <div className="timeline-bar-wrap"><div className="timeline-bar" style={{ width: `${Math.max(Number(project.fte) * 22, 16)}%` }} /></div>
                    <div className="timeline-meta">{project.due || 'TBD'}</div>
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
            {TEAM_VIEWS.map((item) => <button key={item} className={teamView === item ? 'subtab active' : 'subtab'} onClick={() => setTeamView(item)}>{item}</button>)}
          </div>

          {teamView === 'Roster' && (
            <>
              <form className="panel form-grid" onSubmit={addTeamMember}>
                <div className="section-head"><div><span className="label">Create</span><h2>Add team member</h2></div></div>
                <Field label="Name"><input className="input" value={teamForm.name} onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })} /></Field>
                <Field label="Role"><input className="input" value={teamForm.role} onChange={(e) => setTeamForm({ ...teamForm, role: e.target.value })} /></Field>
                <Field label="Discipline"><select className="input" value={teamForm.discId} onChange={(e) => setTeamForm({ ...teamForm, discId: e.target.value })}>{disciplines.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
                <Field label="Capacity %"><input className="input" type="number" value={teamForm.cap} onChange={(e) => setTeamForm({ ...teamForm, cap: e.target.value })} /></Field>
                <Field label="Type"><select className="input" value={teamForm.emp} onChange={(e) => setTeamForm({ ...teamForm, emp: e.target.value })}><option>FTE</option><option>Contractor</option><option>Part-time</option><option>Consultant</option></select></Field>
                <div className="form-actions"><button className="tab active" type="submit">Add person</button></div>
              </form>

              <div className="stack roster-grid">
                {team.map((member) => {
                  const load = memberLoad(member.id)
                  const discipline = disciplines.find((item) => item.id === member.discId)
                  const isOpen = !!expandedMembers[member.id]
                  return (
                    <article key={member.id} className="panel">
                      <div className="section-head">
                        <div className="person-head"><div className="avatar">{member.avatar}</div><div><h2>{member.name}</h2><p>{member.role}</p></div></div>
                        <div className="actions"><button className="subtab" type="button" onClick={() => toggleMember(member.id)}>{isOpen ? 'Close' : 'Open'}</button><button className="subtab danger" type="button" onClick={() => deleteTeamMember(member.id)}>Delete</button></div>
                      </div>
                      <div className="meta-block"><span className="pill" style={{ borderColor: discipline?.color, color: discipline?.color }}>{discipline?.name}</span><span className="pill">{member.emp}</span></div>
                      <div className="capacity-line"><span>{load}% allocated</span><span>{member.cap}% cap</span></div>
                      <div className="meter"><div className={load > member.cap ? 'meter-fill danger' : 'meter-fill'} style={{ width: `${Math.min(load, 100)}%` }} /></div>
                      <p className="muted small">Superpowers: {(member.powers || []).filter(Boolean).join(', ') || 'None yet'}</p>
                      {isOpen && <TeamEditor member={member} setTeam={setTeam} />}
                    </article>
                  )
                })}
              </div>
            </>
          )}

          {teamView === 'Skills' && (
            <article className="panel">
              <div className="section-head"><div><span className="label">Skills matrix</span><h2>Capabilities on the team</h2></div></div>
              <div className="skill-matrix">
                <div className="matrix-head matrix-row"><div>Skill</div>{team.map((member) => <div key={member.id}>{member.avatar}</div>)}</div>
                {skills.map((skill) => <div key={skill.id} className="matrix-row"><div>{skill.name}</div>{team.map((member) => <div key={member.id}>{member.sp?.[skill.id] || '—'}</div>)}</div>)}
              </div>
            </article>
          )}
        </section>
      )}

      {tab === 'Analyze' && (
        <section>
          <div className="subtabs">
            {ANALYZE_VIEWS.map((item) => <button key={item} className={analyzeView === item ? 'subtab active' : 'subtab'} onClick={() => setAnalyzeView(item)}>{item}</button>)}
          </div>
          {analyzeView === 'Growth' && (
            <div className="page-grid">
              <article className="panel"><span className="label">Upskill target</span><h2>Interaction Design depth</h2><p>Maya and Sam already contribute here. A next hire or coaching plan should strengthen cross-coverage.</p></article>
              <article className="panel"><span className="label">Upskill target</span><h2>Systems + visual pairing</h2><p>Design System v2 depends on strong systems and visual collaboration. Alex is the obvious partner for Sam.</p></article>
              <article className="panel wide"><span className="label">Editing</span><h2>Team editing is live</h2><p>Open a team card to edit profile details, superpowers, and skill ratings.</p></article>
            </div>
          )}
          {analyzeView === 'Reports' && (
            <article className="panel"><div className="section-head"><div><span className="label">Report</span><h2>Executive summary</h2></div></div><ul className="list"><li>{activeProjects.length} active efforts tied to the current roadmap</li><li>{overAllocated.length} team members exceed capacity</li><li>{criticalProjects} critical project currently in flight</li><li>{totalFte.toFixed(1)} FTE planned in the active scenario</li></ul></article>
          )}
        </section>
      )}
    </div>
  )
}
