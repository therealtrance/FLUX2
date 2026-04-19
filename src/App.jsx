import { useEffect, useMemo, useState } from 'react'

const TABS = ['Home', 'Plan', 'Team', 'Analyze']
const PLAN_VIEWS = ['Projects', 'Scenarios', 'Timeline', 'Compare']
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

function getSkillCoverage(member, sr) {
  const requirements = Object.entries(sr || {})
  if (!requirements.length) return { score: 100, covered: 0, total: 0 }
  let score = 0
  let covered = 0
  for (const [skillId, needed] of requirements) {
    const have = Number(member.sp?.[skillId] || 0)
    const ratio = Math.min(have / Number(needed || 1), 1)
    if (have >= Number(needed || 0)) covered += 1
    score += ratio
  }
  return { score: Math.round((score / requirements.length) * 100), covered, total: requirements.length }
}

function getCoverageGaps(team, project) {
  return Object.entries(project.sr || {}).map(([skillId, needed]) => {
    const best = Math.max(0, ...team.map((member) => Number(member.sp?.[skillId] || 0)))
    const skill = skills.find((s) => s.id === skillId)
    return { skillId, name: skill?.name || skillId, needed: Number(needed), best, covered: best >= Number(needed) }
  })
}

function getProjectAssignedFitAverage(project, team) {
  if (!project.roster?.length) return 0
  const fits = project.roster.map((entry) => {
    const member = team.find((person) => person.id === entry.mId)
    if (!member) return 0
    return getSkillCoverage(member, project.sr).score
  })
  return Math.round(fits.reduce((sum, score) => sum + score, 0) / fits.length)
}

function getProjectRisk(project, team) {
  const gaps = getCoverageGaps(team, project).filter((gap) => !gap.covered)
  const avgFit = getProjectAssignedFitAverage(project, team)
  const reasons = []
  if (!project.owner) reasons.push('No owner')
  if (!project.roster?.length) reasons.push('No roster')
  if (gaps.length) reasons.push(`${gaps.length} uncovered skill gap${gaps.length > 1 ? 's' : ''}`)
  if ((project.prio === 'Critical' || project.prio === 'High') && avgFit > 0 && avgFit < 80) reasons.push(`Assigned fit ${avgFit}%`)
  if (project.prio === 'Critical' && !project.roster?.length) reasons.push('Critical work without staffing')
  return { avgFit, gaps, riskCount: reasons.length, reasons, isRisk: reasons.length > 0 }
}

function getAssignmentWarnings({ member, project, allocation, memberLoad }) {
  const warnings = []
  const existing = project.roster.find((entry) => entry.mId === member.id)
  if (existing) warnings.push('Already assigned to this project')
  const projectedLoad = memberLoad(member.id) + Number(allocation || 0)
  if (projectedLoad > Number(member.cap || 0)) warnings.push(`Would exceed capacity by ${projectedLoad - Number(member.cap || 0)}%`)
  return warnings
}

function getScenarioProjects(projects, scenarioId) {
  return projects.filter((project) => project.scId === scenarioId)
}

function getScenarioFte(projects, scenarioId) {
  return getScenarioProjects(projects, scenarioId).reduce((sum, project) => sum + Number(project.fte || 0), 0)
}

function getScenarioCriticalCount(projects, scenarioId) {
  return getScenarioProjects(projects, scenarioId).filter((project) => project.prio === 'Critical').length
}

function getScenarioMemberLoad(projects, memberId, scenarioId) {
  return getScenarioProjects(projects, scenarioId).reduce((sum, project) => {
    const hit = project.roster.find((entry) => entry.mId === memberId)
    return sum + (hit ? Number(hit.alloc) : 0)
  }, 0)
}

function getScenarioOverCapacityCount(projects, team, scenarioId) {
  return team.filter((member) => getScenarioMemberLoad(projects, member.id, scenarioId) > Number(member.cap || 0)).length
}

function getScenarioSkillGaps(projects, team, scenarioId) {
  const scenarioProjects = getScenarioProjects(projects, scenarioId)
  return scenarioProjects.flatMap((project) => Object.entries(project.sr || {}).map(([skillId, needed]) => {
    const best = Math.max(0, ...team.map((member) => Number(member.sp?.[skillId] || 0)))
    const skill = skills.find((s) => s.id === skillId)
    return { projectId: project.id, projectName: project.name, skillId, skillName: skill?.name || skillId, needed: Number(needed), best, covered: best >= Number(needed) }
  }))
}

function getScenarioAssignedFitAverage(projects, team, scenarioId) {
  const scenarioProjects = getScenarioProjects(projects, scenarioId)
  const fits = []
  for (const project of scenarioProjects) {
    for (const entry of project.roster || []) {
      const member = team.find((person) => person.id === entry.mId)
      if (!member) continue
      fits.push(getSkillCoverage(member, project.sr).score)
    }
  }
  if (!fits.length) return 0
  return Math.round(fits.reduce((sum, score) => sum + score, 0) / fits.length)
}

function getScenarioHealth(projects, team, scenarioId) {
  const scenarioProjects = getScenarioProjects(projects, scenarioId)
  const riskProjects = scenarioProjects.filter((project) => getProjectRisk(project, team).isRisk)
  const gaps = getScenarioSkillGaps(projects, team, scenarioId).filter((gap) => !gap.covered)
  return { riskProjects: riskProjects.length, uncoveredGaps: gaps.length, avgFit: getScenarioAssignedFitAverage(projects, team, scenarioId), overCapacity: getScenarioOverCapacityCount(projects, team, scenarioId) }
}

function normalizeRoster(project) {
  return (project?.roster || []).map((entry) => `${entry.mId}:${entry.role}:${entry.alloc}`).sort().join('|')
}

function compareProjects(projectsA, projectsB, team) {
  const mapA = new Map(projectsA.map((p) => [p.name, p]))
  const mapB = new Map(projectsB.map((p) => [p.name, p]))
  const names = [...new Set([...mapA.keys(), ...mapB.keys()])]
  return names.map((name) => {
    const a = mapA.get(name)
    const b = mapB.get(name)
    if (a && !b) {
      return {
        name,
        status: 'Only in A',
        a,
        b: null,
        diff: { changedFields: ['Project only in A'], gapA: getCoverageGaps(team, a).filter((gap) => !gap.covered).length, gapB: 0, rosterChanged: false, requirementsChanged: false },
      }
    }
    if (!a && b) {
      return {
        name,
        status: 'Only in B',
        a: null,
        b,
        diff: { changedFields: ['Project only in B'], gapA: 0, gapB: getCoverageGaps(team, b).filter((gap) => !gap.covered).length, rosterChanged: false, requirementsChanged: false },
      }
    }
    const changedFields = []
    if (a.owner !== b.owner) changedFields.push('Owner')
    if (a.due !== b.due) changedFields.push('Due date')
    if (a.prio !== b.prio) changedFields.push('Priority')
    if (a.stage !== b.stage) changedFields.push('Stage')
    if (Number(a.fte) !== Number(b.fte)) changedFields.push('FTE')
    const requirementsChanged = JSON.stringify(a.sr || {}) !== JSON.stringify(b.sr || {})
    const rosterChanged = normalizeRoster(a) !== normalizeRoster(b)
    if (requirementsChanged) changedFields.push('Requirements')
    if (rosterChanged) changedFields.push('Roster')
    return {
      name,
      status: changedFields.length ? 'Changed' : 'Same',
      a,
      b,
      diff: { changedFields, gapA: getCoverageGaps(team, a).filter((gap) => !gap.covered).length, gapB: getCoverageGaps(team, b).filter((gap) => !gap.covered).length, rosterChanged, requirementsChanged },
    }
  })
}

function Field({ label, children }) {
  return <label className="field"><span className="label">{label}</span>{children}</label>
}

function SkillRequirementsEditor({ project, team, setProjects }) {
  const usedSkillIds = Object.keys(project.sr || {})
  const availableSkills = skills.filter((skill) => !usedSkillIds.includes(skill.id))
  const [newSkillId, setNewSkillId] = useState(availableSkills[0]?.id || skills[0]?.id || '')
  const [newLevel, setNewLevel] = useState(3)
  const gaps = getCoverageGaps(team, project)

  useEffect(() => {
    const nextAvailable = skills.find((skill) => !Object.keys(project.sr || {}).includes(skill.id))
    if (nextAvailable) setNewSkillId(nextAvailable.id)
  }, [project.sr])

  const updateRequirement = (skillId, value) => setProjects((prev) => prev.map((item) => item.id === project.id ? { ...item, sr: { ...(item.sr || {}), [skillId]: Number(value) } } : item))
  const removeRequirement = (skillId) => setProjects((prev) => prev.map((item) => {
    if (item.id !== project.id) return item
    const nextSr = { ...(item.sr || {}) }
    delete nextSr[skillId]
    return { ...item, sr: nextSr }
  }))
  const addRequirement = (e) => {
    e.preventDefault()
    if (!newSkillId || project.sr?.[newSkillId]) return
    setProjects((prev) => prev.map((item) => item.id === project.id ? { ...item, sr: { ...(item.sr || {}), [newSkillId]: Number(newLevel) } } : item))
  }

  return <div className="roster-editor"><div className="section-head compact"><div><span className="label">Skill requirements</span><h3>Edit required skills</h3></div></div><form className="mini-form" onSubmit={addRequirement}><Field label="Skill"><select className="input" value={newSkillId} onChange={(e) => setNewSkillId(e.target.value)} disabled={!availableSkills.length}>{availableSkills.map((skill) => <option key={skill.id} value={skill.id}>{skill.name}</option>)}</select></Field><Field label="Required level"><input className="input" type="number" min="1" max="5" value={newLevel} onChange={(e) => setNewLevel(e.target.value)} /></Field><div className="form-actions"><button className="subtab active" type="submit" disabled={!availableSkills.length}>Add skill</button></div></form><div className="stack">{Object.entries(project.sr || {}).length === 0 && <p className="muted">No skill requirements yet.</p>}{Object.entries(project.sr || {}).map(([skillId, level]) => { const skill = skills.find((s) => s.id === skillId); return <div key={skillId} className="power-row"><div className="req-name"><strong>{skill?.name || skillId}</strong></div><div className="req-controls"><input className="input req-level" type="number" min="1" max="5" value={level} onChange={(e) => updateRequirement(skillId, e.target.value)} /><button className="subtab danger" type="button" onClick={() => removeRequirement(skillId)}>Remove</button></div></div> })}</div><div className="section-head compact team-subhead"><div><span className="label">Coverage gaps</span></div></div><div className="stack">{gaps.length === 0 && <p className="muted">No gaps to evaluate until skills are added.</p>}{gaps.map((gap) => <div key={gap.skillId} className="candidate-panel"><div className="candidate-line"><strong>{gap.name}</strong><span className={gap.covered ? 'badge medium' : 'badge critical'}>{gap.covered ? 'Covered' : 'Gap'}</span></div><div className="candidate-line small-line"><span>Need {gap.needed}</span><span>Best on team {gap.best}</span></div></div>)}</div></div>
}

function ProjectTransferEditor({ project, scenarios, setProjects, setExpandedProjects, setCompareA, setCompareB, setPlanView }) {
  const targetScenarios = scenarios.filter((scenario) => scenario.id !== project.scId)
  const [targetScenarioId, setTargetScenarioId] = useState(targetScenarios[0]?.id || '')
  useEffect(() => { const nextTarget = scenarios.find((scenario) => scenario.id !== project.scId); setTargetScenarioId(nextTarget?.id || '') }, [project.scId, scenarios])
  const copyProject = () => {
    if (!targetScenarioId) return
    const targetScenario = scenarios.find((scenario) => scenario.id === targetScenarioId)
    const clonedProject = { ...project, id: uid('p'), scId: targetScenarioId, name: `${project.name} (${targetScenario?.name || 'Copy'})`, roster: project.roster.map((entry) => ({ ...entry, id: uid('r') })) }
    setProjects((prev) => [...prev, clonedProject])
    setExpandedProjects((prev) => ({ ...prev, [clonedProject.id]: true }))
    setCompareA(project.scId)
    setCompareB(targetScenarioId)
    setPlanView('Compare')
  }
  const moveProject = () => {
    if (!targetScenarioId) return
    const confirmed = window.confirm('Move this project to the selected scenario?')
    if (!confirmed) return
    setProjects((prev) => prev.map((item) => item.id === project.id ? { ...item, scId: targetScenarioId } : item))
    setCompareA(project.scId)
    setCompareB(targetScenarioId)
    setPlanView('Compare')
  }
  if (!targetScenarios.length) return null
  return <div className="roster-editor"><div className="section-head compact"><div><span className="label">Scenario transfer</span><h3>Copy or move project</h3></div></div><div className="mini-form"><Field label="Target scenario"><select className="input" value={targetScenarioId} onChange={(e) => setTargetScenarioId(e.target.value)}>{targetScenarios.map((scenario) => <option key={scenario.id} value={scenario.id}>{scenario.name}</option>)}</select></Field><div className="form-actions"><button className="subtab" type="button" onClick={copyProject}>Copy to scenario</button><button className="subtab active" type="button" onClick={moveProject}>Move to scenario</button></div></div></div>
}

function ProjectEditor({ project, scenarios, setProjects }) {
  const updateProject = (field, value) => setProjects((prev) => prev.map((item) => item.id === project.id ? { ...item, [field]: field === 'fte' ? Number(value) : value } : item))
  return <div className="roster-editor"><div className="section-head compact"><div><span className="label">Project details</span><h3>Edit project</h3></div></div><div className="mini-form"><Field label="Project name"><input className="input" value={project.name} onChange={(e) => updateProject('name', e.target.value)} /></Field><Field label="Owner"><input className="input" value={project.owner || ''} onChange={(e) => updateProject('owner', e.target.value)} /></Field><Field label="Scenario"><select className="input" value={project.scId} onChange={(e) => updateProject('scId', e.target.value)}>{scenarios.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="Type"><select className="input" value={project.type} onChange={(e) => updateProject('type', e.target.value)}><option value="full">full</option><option value="side">side</option></select></Field><Field label="Priority"><select className="input" value={project.prio} onChange={(e) => updateProject('prio', e.target.value)}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></Field><Field label="Stage"><select className="input" value={project.stage} onChange={(e) => updateProject('stage', e.target.value)}><option>Discovery</option><option>Define</option><option>Design</option><option>Deliver</option></select></Field><Field label="Due"><input className="input" value={project.due || ''} onChange={(e) => updateProject('due', e.target.value)} placeholder="2026-05-01" /></Field><Field label="FTE"><input className="input" type="number" step="0.1" value={project.fte} onChange={(e) => updateProject('fte', e.target.value)} /></Field></div></div>
}

function TeamEditor({ member, setTeam }) {
  const updateMember = (field, value) => setTeam((prev) => prev.map((item) => { if (item.id !== member.id) return item; const next = { ...item, [field]: field === 'cap' ? Number(value) : value }; if (field === 'name') next.avatar = value.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || item.avatar; return next }))
  const updatePower = (index, value) => setTeam((prev) => prev.map((item) => { if (item.id !== member.id) return item; const powers = [...(item.powers || [])]; powers[index] = value; return { ...item, powers } }))
  const addPower = () => setTeam((prev) => prev.map((item) => item.id === member.id ? { ...item, powers: [...(item.powers || []), ''] } : item))
  const removePower = (index) => setTeam((prev) => prev.map((item) => item.id === member.id ? { ...item, powers: (item.powers || []).filter((_, i) => i !== index) } : item))
  const updateSkill = (skillId, value) => setTeam((prev) => prev.map((item) => item.id === member.id ? { ...item, sp: { ...(item.sp || {}), [skillId]: value === '' ? undefined : Number(value) } } : item))
  return <div className="roster-editor"><div className="section-head compact"><div><span className="label">Team details</span><h3>Edit person</h3></div></div><div className="mini-form"><Field label="Name"><input className="input" value={member.name} onChange={(e) => updateMember('name', e.target.value)} /></Field><Field label="Role"><input className="input" value={member.role} onChange={(e) => updateMember('role', e.target.value)} /></Field><Field label="Discipline"><select className="input" value={member.discId} onChange={(e) => updateMember('discId', e.target.value)}>{disciplines.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="Capacity %"><input className="input" type="number" value={member.cap} onChange={(e) => updateMember('cap', e.target.value)} /></Field><Field label="Type"><select className="input" value={member.emp} onChange={(e) => updateMember('emp', e.target.value)}><option>FTE</option><option>Contractor</option><option>Part-time</option><option>Consultant</option></select></Field></div><div className="section-head compact team-subhead"><div><span className="label">Superpowers</span></div><button className="subtab" type="button" onClick={addPower}>Add superpower</button></div><div className="stack">{(member.powers || []).length === 0 && <p className="muted">No superpowers listed yet.</p>}{(member.powers || []).map((power, index) => <div key={`${member.id}-power-${index}`} className="power-row"><input className="input" value={power} onChange={(e) => updatePower(index, e.target.value)} placeholder="Workshop Design" /><button className="subtab danger" type="button" onClick={() => removePower(index)}>Remove</button></div>)}</div><div className="section-head compact team-subhead"><div><span className="label">Skill ratings</span></div></div><div className="skill-edit-grid">{skills.map((skill) => <Field key={`${member.id}-${skill.id}`} label={skill.name}><input className="input" type="number" min="1" max="5" value={member.sp?.[skill.id] ?? ''} onChange={(e) => updateSkill(skill.id, e.target.value)} placeholder="—" /></Field>)}</div></div>
}

function RosterEditor({ project, team, setProjects, memberLoad }) {
  const [newRoster, setNewRoster] = useState({ mId: team[0]?.id || '', alloc: 25, role: '' })
  useEffect(() => { setNewRoster((prev) => ({ ...prev, mId: team[0]?.id || '' })) }, [team])
  const recommendations = useMemo(() => [...team].map((member) => { const fit = getSkillCoverage(member, project.sr); const currentLoad = memberLoad(member.id); const remaining = Number(member.cap || 0) - currentLoad; const warnings = getAssignmentWarnings({ member, project, allocation: newRoster.alloc, memberLoad }); return { member, fitScore: fit.score, covered: fit.covered, total: fit.total, currentLoad, remaining, warnings } }).sort((a, b) => (b.fitScore !== a.fitScore ? b.fitScore - a.fitScore : b.remaining - a.remaining)), [team, project, memberLoad, newRoster.alloc])
  const selectedRecommendation = recommendations.find((item) => item.member.id === newRoster.mId)
  const updateRosterItem = (rosterId, field, value) => setProjects((prev) => prev.map((item) => item.id === project.id ? { ...item, roster: item.roster.map((entry) => entry.id === rosterId ? { ...entry, [field]: field === 'alloc' ? Number(value) : value } : entry) } : item))
  const removeRosterItem = (rosterId) => setProjects((prev) => prev.map((item) => item.id === project.id ? { ...item, roster: item.roster.filter((entry) => entry.id !== rosterId) } : item))
  const addRosterItem = (e) => { e.preventDefault(); if (!newRoster.mId) return; setProjects((prev) => prev.map((item) => item.id === project.id ? { ...item, roster: [...item.roster, { id: uid('r'), mId: newRoster.mId, alloc: Number(newRoster.alloc), role: newRoster.role || 'Contributor' }] } : item)); setNewRoster({ mId: team[0]?.id || '', alloc: 25, role: '' }) }
  return <div className="roster-editor"><div className="section-head compact"><div><span className="label">Roster assignment</span><h3>Assign and edit people</h3></div></div><div className="fit-summary-grid">{recommendations.slice(0, 3).map((item, index) => <div key={item.member.id} className="fit-card"><div className="fit-rank">#{index + 1}</div><strong>{item.member.name}</strong><div className="fit-meta">Fit {item.fitScore}% · Free {item.remaining}%</div><div className="fit-meta">Coverage {item.covered}/{item.total || 0}</div></div>)}</div><form className="mini-form" onSubmit={addRosterItem}><Field label="Person"><select className="input" value={newRoster.mId} onChange={(e) => setNewRoster({ ...newRoster, mId: e.target.value })}>{recommendations.map((item) => <option key={item.member.id} value={item.member.id}>{item.member.name} · Fit {item.fitScore}% · Free {item.remaining}%</option>)}</select></Field><Field label="Role"><input className="input" value={newRoster.role} onChange={(e) => setNewRoster({ ...newRoster, role: e.target.value })} placeholder="Lead Designer" /></Field><Field label="Alloc %"><input className="input" type="number" min="1" max="100" value={newRoster.alloc} onChange={(e) => setNewRoster({ ...newRoster, alloc: e.target.value })} /></Field><div className="form-actions"><button className="subtab active" type="submit">Assign</button></div></form>{selectedRecommendation && <div className="candidate-panel"><div className="candidate-line"><strong>{selectedRecommendation.member.name}</strong><span className="badge low">Fit {selectedRecommendation.fitScore}%</span></div><div className="candidate-line small-line"><span>Skill coverage {selectedRecommendation.covered}/{selectedRecommendation.total || 0}</span><span>Current load {selectedRecommendation.currentLoad}% · Free {selectedRecommendation.remaining}%</span></div>{selectedRecommendation.warnings.length > 0 ? <ul className="warning-list">{selectedRecommendation.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul> : <p className="muted">No assignment warnings for this selection.</p>}</div>}<div className="stack">{project.roster.length === 0 && <p className="muted">No one assigned yet.</p>}{project.roster.map((entry) => { const member = team.find((person) => person.id === entry.mId); const totalLoad = member ? memberLoad(member.id) : 0; const over = member ? totalLoad > Number(member.cap) : false; const fit = member ? getSkillCoverage(member, project.sr) : { score: 0 }; return <div key={entry.id} className="roster-row"><div className="roster-main"><strong>{member?.name || entry.mId}</strong><span className={over ? 'badge critical' : 'badge low'}>{totalLoad}% / {member?.cap ?? '—'}%</span><span className="badge medium">Fit {fit.score}%</span></div><div className="roster-fields"><Field label="Role"><input className="input" value={entry.role} onChange={(e) => updateRosterItem(entry.id, 'role', e.target.value)} /></Field><Field label="Alloc %"><input className="input" type="number" min="1" max="100" value={entry.alloc} onChange={(e) => updateRosterItem(entry.id, 'alloc', e.target.value)} /></Field></div><div className="actions"><button className="subtab danger" type="button" onClick={() => removeRosterItem(entry.id)}>Remove</button></div></div> })}</div></div>
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
  const [compareA, setCompareA] = useState(initial.scenarios[0]?.id || '')
  const [compareB, setCompareB] = useState(initial.scenarios[1]?.id || initial.scenarios[0]?.id || '')

  useEffect(() => { window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ team, scenarios, projects })) }, [team, scenarios, projects])

  const activeScenario = scenarios.find((s) => s.active) || scenarios[0]
  const activeProjects = useMemo(() => projects.filter((project) => project.scId === activeScenario?.id), [activeScenario, projects])
  const memberLoad = (memberId) => projects.reduce((sum, project) => { const hit = project.roster.find((r) => r.mId === memberId); return sum + (hit ? Number(hit.alloc) : 0) }, 0)
  const totalFte = activeProjects.reduce((sum, project) => sum + Number(project.fte || 0), 0)
  const overAllocated = team.filter((member) => memberLoad(member.id) > Number(member.cap))
  const criticalProjects = activeProjects.filter((project) => project.prio === 'Critical').length
  const activeScenarioHealth = getScenarioHealth(projects, team, activeScenario?.id)
  const activeScenarioGaps = getScenarioSkillGaps(projects, team, activeScenario?.id).filter((gap) => !gap.covered)
  const riskProjects = activeProjects.map((project) => ({ project, ...getProjectRisk(project, team) })).filter((item) => item.isRisk).sort((a, b) => b.riskCount - a.riskCount || a.avgFit - b.avgFit)
  const overloadedMembers = team.map((member) => ({ member, load: memberLoad(member.id), overBy: memberLoad(member.id) - Number(member.cap || 0) })).filter((item) => item.load > Number(item.member.cap || 0)).sort((a, b) => b.overBy - a.overBy)

  const compareProjectsA = getScenarioProjects(projects, compareA)
  const compareProjectsB = getScenarioProjects(projects, compareB)
  const compareSummaryA = { projectCount: compareProjectsA.length, totalFte: getScenarioFte(projects, compareA), criticalCount: getScenarioCriticalCount(projects, compareA), overCapacity: getScenarioOverCapacityCount(projects, team, compareA), avgFit: getScenarioAssignedFitAverage(projects, team, compareA), gaps: getScenarioSkillGaps(projects, team, compareA).filter((gap) => !gap.covered).length }
  const compareSummaryB = { projectCount: compareProjectsB.length, totalFte: getScenarioFte(projects, compareB), criticalCount: getScenarioCriticalCount(projects, compareB), overCapacity: getScenarioOverCapacityCount(projects, team, compareB), avgFit: getScenarioAssignedFitAverage(projects, team, compareB), gaps: getScenarioSkillGaps(projects, team, compareB).filter((gap) => !gap.covered).length }
  const projectDiffs = compareProjects(compareProjectsA, compareProjectsB, team)
  const staffingDiffs = team.map((member) => { const loadA = getScenarioMemberLoad(projects, member.id, compareA); const loadB = getScenarioMemberLoad(projects, member.id, compareB); return { member, loadA, loadB, delta: loadB - loadA, overA: loadA > Number(member.cap || 0), overB: loadB > Number(member.cap || 0) } })
  const compareChangedCount = projectDiffs.filter((item) => item.status === 'Changed' || item.status === 'Only in A' || item.status === 'Only in B').length
  const compareStaffingDeltaCount = staffingDiffs.filter((item) => item.delta !== 0).length

  const openProjectDrilldown = (projectId) => { setTab('Plan'); setPlanView('Projects'); setExpandedProjects((prev) => ({ ...prev, [projectId]: true })) }
  const openMemberDrilldown = (memberId) => { setTab('Team'); setTeamView('Roster'); setExpandedMembers((prev) => ({ ...prev, [memberId]: true })) }
  const openCompareDrilldown = (scenarioA, scenarioB) => { if (scenarioA) setCompareA(scenarioA); if (scenarioB) setCompareB(scenarioB); setTab('Plan'); setPlanView('Compare') }

  const immediateActions = [...overloadedMembers.slice(0, 2).map((item) => ({ title: `Rebalance ${item.member.name}`, detail: `${item.load}% / ${item.member.cap}% cap`, priority: 'Critical', actionLabel: 'Open person', onClick: () => openMemberDrilldown(item.member.id) })), ...riskProjects.slice(0, 3).map((item) => ({ title: item.project.name, detail: item.reasons.join(' · '), priority: item.project.prio, actionLabel: 'Open project', onClick: () => openProjectDrilldown(item.project.id) }))].slice(0, 5)

  const toggleProject = (id) => setExpandedProjects((prev) => ({ ...prev, [id]: !prev[id] }))
  const toggleMember = (id) => setExpandedMembers((prev) => ({ ...prev, [id]: !prev[id] }))
  const addScenario = (e) => { e.preventDefault(); if (!scenarioForm.name.trim()) return; const newScenario = { id: uid('sc'), ...scenarioForm, active: scenarios.length === 0 }; setScenarios((prev) => [...prev, newScenario]); setScenarioForm({ name: '', desc: '', color: '#38bdf8' }) }
  const duplicateScenario = (scenario) => {
    const newName = window.prompt('Name for duplicated scenario', `${scenario.name} Copy`)
    if (!newName || !newName.trim()) return
    const duplicateRoster = window.confirm('Duplicate roster assignments too? Tap OK for yes or Cancel for no.')
    const newScenarioId = uid('sc')
    const clonedProjects = projects.filter((project) => project.scId === scenario.id).map((project) => ({ ...project, id: uid('p'), scId: newScenarioId, roster: duplicateRoster ? project.roster.map((entry) => ({ ...entry, id: uid('r') })) : [] }))
    setScenarios((prev) => [...prev, { ...scenario, id: newScenarioId, name: newName.trim(), active: false }])
    setProjects((prev) => [...prev, ...clonedProjects])
    setExpandedProjects((prev) => ({ ...prev, ...Object.fromEntries(clonedProjects.map((project) => [project.id, false])) }))
    setCompareB(newScenarioId)
    setPlanView('Compare')
  }
  const setActiveScenario = (id) => setScenarios((prev) => prev.map((item) => ({ ...item, active: item.id === id })))
  const deleteScenario = (id) => { const nextScenarios = scenarios.filter((item) => item.id !== id); if (!nextScenarios.length) return; if (!nextScenarios.some((item) => item.active)) nextScenarios[0].active = true; setScenarios([...nextScenarios]); setProjects((prev) => prev.filter((project) => project.scId !== id)) }
  const addProject = (e) => { e.preventDefault(); if (!projectForm.name.trim()) return; const newProject = { id: uid('p'), ...projectForm, fte: Number(projectForm.fte), roster: [], sr: {} }; setProjects((prev) => [...prev, newProject]); setExpandedProjects((prev) => ({ ...prev, [newProject.id]: true })); setProjectForm({ name: '', scId: activeScenario?.id || scenarios[0]?.id || '', type: 'full', stage: 'Discovery', prio: 'Medium', due: '', owner: '', fte: 1 }) }
  const deleteProject = (id) => setProjects((prev) => prev.filter((project) => project.id !== id))
  const addTeamMember = (e) => { e.preventDefault(); if (!teamForm.name.trim()) return; const initials = teamForm.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(); const newMember = { id: uid('t'), ...teamForm, cap: Number(teamForm.cap), avatar: initials || 'UX', sp: {}, powers: [] }; setTeam((prev) => [...prev, newMember]); setExpandedMembers((prev) => ({ ...prev, [newMember.id]: true })); setTeamForm({ name: '', role: '', discId: 'd1', cap: 100, emp: 'FTE' }) }
  const deleteTeamMember = (id) => { setTeam((prev) => prev.filter((member) => member.id !== id)); setProjects((prev) => prev.map((project) => ({ ...project, roster: project.roster.filter((entry) => entry.mId !== id) }))) }
  const resetAll = () => { setTeam(seedTeam); setScenarios(seedScenarios); setProjects(seedProjects); setExpandedProjects({ [seedProjects[0]?.id || '']: true }); setExpandedMembers({ [seedTeam[0]?.id || '']: true }); setCompareA(seedScenarios[0]?.id || ''); setCompareB(seedScenarios[1]?.id || seedScenarios[0]?.id || '') }

  return <div className="app-shell"><header className="topbar"><div><div className="eyebrow">FLUX2</div><h1>UX Resource Planner</h1><p>Planning, staffing, and visibility for UX workstreams.</p></div><button className="subtab" onClick={resetAll}>Reset seed data</button></header><nav className="tabs">{TABS.map((item) => <button key={item} className={tab === item ? 'tab active' : 'tab'} onClick={() => setTab(item)}>{item}</button>)}</nav>{tab === 'Home' && <section><div className="page-grid"><article className="panel stat-panel"><span className="label">Active scenario</span><strong>{activeScenario?.name}</strong><p>{activeScenario?.desc}</p></article><article className="panel stat-panel"><span className="label">Projects at risk</span><strong>{activeScenarioHealth.riskProjects}</strong><p>Critical work, staffing issues, and uncovered gaps</p></article><article className="panel stat-panel"><span className="label">People over capacity</span><strong>{activeScenarioHealth.overCapacity}</strong><p>Team members loaded above stated capacity</p></article><article className="panel stat-panel"><span className="label">Uncovered skill gaps</span><strong>{activeScenarioHealth.uncoveredGaps}</strong><p>Requirements with no one currently covering the level needed</p></article></div><div className="page-grid"><article className="panel wide"><div className="section-head"><div><span className="label">Immediate actions</span><h2>What needs attention next</h2></div></div><div className="stack">{immediateActions.length ? immediateActions.map((item, index) => <div key={`${item.title}-${index}`} className="candidate-panel"><div className="candidate-line"><strong>{item.title}</strong><span className={badgeClass(item.priority)}>{item.priority}</span></div><div className="small-line">{item.detail}</div><div className="actions"><button className="subtab" type="button" onClick={item.onClick}>{item.actionLabel}</button></div></div>) : <p className="muted">No immediate actions. The active scenario looks healthy.</p>}</div></article><article className="panel"><div className="section-head"><div><span className="label">Capacity risk</span><h2>Top overloaded people</h2></div></div><div className="stack">{overloadedMembers.length ? overloadedMembers.slice(0, 4).map((item) => <div key={item.member.id} className="candidate-panel"><div className="candidate-line"><strong>{item.member.name}</strong><span className="badge critical">+{item.overBy}%</span></div><div className="small-line">{item.load}% allocated against {item.member.cap}% capacity</div><div className="actions"><button className="subtab" type="button" onClick={() => openMemberDrilldown(item.member.id)}>Open person</button></div></div>) : <p className="muted">No one is currently over capacity.</p>}</div></article><article className="panel"><div className="section-head"><div><span className="label">Skill gap risk</span><h2>Top uncovered requirements</h2></div></div><div className="stack">{activeScenarioGaps.length ? activeScenarioGaps.slice(0, 4).map((gap, index) => <div key={`${gap.projectId}-${gap.skillId}-${index}`} className="candidate-panel"><div className="candidate-line"><strong>{gap.projectName}</strong><span className="badge critical">Gap</span></div><div className="small-line">{gap.skillName} needs {gap.needed}; best on team is {gap.best}</div><div className="actions"><button className="subtab" type="button" onClick={() => openProjectDrilldown(gap.projectId)}>Open project</button></div></div>) : <p className="muted">No uncovered skill gaps in the active scenario.</p>}</div></article><article className="panel"><div className="section-head"><div><span className="label">Priority risk</span><h2>Projects needing attention</h2></div></div><div className="stack">{riskProjects.length ? riskProjects.slice(0, 4).map((item) => <div key={item.project.id} className="candidate-panel"><div className="candidate-line"><strong>{item.project.name}</strong><span className={badgeClass(item.project.prio)}>{item.project.prio}</span></div><div className="small-line">{item.reasons.join(' · ') || `Assigned fit ${item.avgFit}%`}</div><div className="actions"><button className="subtab" type="button" onClick={() => openProjectDrilldown(item.project.id)}>Open project</button></div></div>) : <p className="muted">No projects are currently flagged as high risk.</p>}</div></article><article className="panel wide"><div className="section-head"><div><span className="label">Scenario intelligence</span><h2>Compare signal</h2></div></div><div className="two-col"><div><span className="label">Scenario A</span><h2>{scenarios.find((s) => s.id === compareA)?.name || 'Scenario A'}</h2><p>{compareSummaryA.projectCount} projects · {compareSummaryA.totalFte.toFixed(1)} FTE · {compareSummaryA.gaps} gaps · {compareSummaryA.overCapacity} over cap</p></div><div><span className="label">Scenario B</span><h2>{scenarios.find((s) => s.id === compareB)?.name || 'Scenario B'}</h2><p>{compareSummaryB.projectCount} projects · {compareSummaryB.totalFte.toFixed(1)} FTE · {compareSummaryB.gaps} gaps · {compareSummaryB.overCapacity} over cap</p></div></div><div className="stack"><div className="candidate-panel"><div className="candidate-line"><strong>Changed projects</strong><span className="badge high">{compareChangedCount}</span></div><div className="small-line">Projects that differ, were added, or were removed between the selected scenarios</div><div className="actions"><button className="subtab" type="button" onClick={() => openCompareDrilldown(compareA, compareB)}>Open compare</button></div></div><div className="candidate-panel"><div className="candidate-line"><strong>Staffing shifts</strong><span className="badge medium">{compareStaffingDeltaCount}</span></div><div className="small-line">People whose allocation changes between the selected scenarios</div><div className="actions"><button className="subtab" type="button" onClick={() => openCompareDrilldown(compareA, compareB)}>Open compare</button></div></div></div></article></div></section>}{tab === 'Plan' && <section><div className="subtabs">{PLAN_VIEWS.map((item) => <button key={item} className={planView === item ? 'subtab active' : 'subtab'} onClick={() => setPlanView(item)}>{item}</button>)}</div>{planView === 'Projects' && <><form className="panel form-grid" onSubmit={addProject}><div className="section-head"><div><span className="label">Create</span><h2>Add project</h2></div></div><Field label="Project name"><input className="input" value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} /></Field><Field label="Scenario"><select className="input" value={projectForm.scId} onChange={(e) => setProjectForm({ ...projectForm, scId: e.target.value })}>{scenarios.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="Owner"><input className="input" value={projectForm.owner} onChange={(e) => setProjectForm({ ...projectForm, owner: e.target.value })} /></Field><Field label="Priority"><select className="input" value={projectForm.prio} onChange={(e) => setProjectForm({ ...projectForm, prio: e.target.value })}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></Field><Field label="Stage"><select className="input" value={projectForm.stage} onChange={(e) => setProjectForm({ ...projectForm, stage: e.target.value })}><option>Discovery</option><option>Define</option><option>Design</option><option>Deliver</option></select></Field><Field label="Due"><input className="input" value={projectForm.due} onChange={(e) => setProjectForm({ ...projectForm, due: e.target.value })} placeholder="2026-05-01" /></Field><Field label="FTE"><input className="input" type="number" step="0.1" value={projectForm.fte} onChange={(e) => setProjectForm({ ...projectForm, fte: e.target.value })} /></Field><div className="form-actions"><button className="tab active" type="submit">Add project</button></div></form><div className="stack">{projects.map((project) => { const isOpen = !!expandedProjects[project.id]; return <article key={project.id} className="panel"><div className="section-head"><div><span className="label">{project.type === 'side' ? 'Side effort' : 'Project'}</span><h2>{project.name}</h2><p>{project.stage} · Due {project.due || 'TBD'} · Owner {project.owner || 'Unassigned'}</p></div><div className="actions"><span className={badgeClass(project.prio)}>{project.prio}</span><button className="subtab" type="button" onClick={() => toggleProject(project.id)}>{isOpen ? 'Close' : 'Open'}</button><button className="subtab danger" type="button" onClick={() => deleteProject(project.id)}>Delete</button></div></div>{isOpen && <><ProjectEditor project={project} scenarios={scenarios} setProjects={setProjects} /><ProjectTransferEditor project={project} scenarios={scenarios} setProjects={setProjects} setExpandedProjects={setExpandedProjects} setCompareA={setCompareA} setCompareB={setCompareB} setPlanView={setPlanView} /><SkillRequirementsEditor project={project} team={team} setProjects={setProjects} /><div className="two-col"><div><span className="label">Required skills</span><ul className="chip-list">{requirementList(project.sr).length ? requirementList(project.sr).map((item) => <li key={item}>{item}</li>) : <li>No minimum skill gates</li>}</ul></div><div><span className="label">Roster summary</span><ul className="list">{project.roster.length ? project.roster.map((entry) => { const member = team.find((person) => person.id === entry.mId); return <li key={entry.id}>{member?.name || entry.mId} · {entry.role} · {entry.alloc}%</li> }) : <li>No one assigned yet</li>}</ul></div></div><RosterEditor project={project} team={team} setProjects={setProjects} memberLoad={memberLoad} /></>}</article> })}</div></>}{planView === 'Scenarios' && <><form className="panel form-grid" onSubmit={addScenario}><div className="section-head"><div><span className="label">Create</span><h2>Add scenario</h2></div></div><Field label="Scenario name"><input className="input" value={scenarioForm.name} onChange={(e) => setScenarioForm({ ...scenarioForm, name: e.target.value })} /></Field><Field label="Description"><input className="input" value={scenarioForm.desc} onChange={(e) => setScenarioForm({ ...scenarioForm, desc: e.target.value })} /></Field><Field label="Color"><input className="input" value={scenarioForm.color} onChange={(e) => setScenarioForm({ ...scenarioForm, color: e.target.value })} /></Field><div className="form-actions"><button className="tab active" type="submit">Add scenario</button></div></form><div className="stack">{scenarios.map((scenario) => <article key={scenario.id} className="panel"><div className="section-head"><div><span className="label">Scenario</span><h2>{scenario.name}</h2><p>{scenario.desc}</p></div><div className="actions"><button className={scenario.active ? 'subtab active' : 'subtab'} type="button" onClick={() => setActiveScenario(scenario.id)}>{scenario.active ? 'Active' : 'Set active'}</button><button className="subtab" type="button" onClick={() => duplicateScenario(scenario)}>Duplicate</button>{scenarios.length > 1 && <button className="subtab danger" type="button" onClick={() => deleteScenario(scenario.id)}>Delete</button>}</div></div></article>)}</div></>}{planView === 'Timeline' && <article className="panel"><div className="section-head"><div><span className="label">Timeline</span><h2>Quarter view</h2></div></div><div className="timeline">{activeProjects.map((project) => <div key={project.id} className="timeline-row"><div className="timeline-name">{project.name}</div><div className="timeline-bar-wrap"><div className="timeline-bar" style={{ width: `${Math.max(Number(project.fte) * 22, 16)}%` }} /></div><div className="timeline-meta">{project.due || 'TBD'}</div></div>)}</div></article>}{planView === 'Compare' && <section className="stack"><article className="panel"><div className="section-head"><div><span className="label">Scenario compare</span><h2>Compare two planning scenarios</h2></div></div><div className="mini-form"><Field label="Scenario A"><select className="input" value={compareA} onChange={(e) => setCompareA(e.target.value)}>{scenarios.map((scenario) => <option key={scenario.id} value={scenario.id}>{scenario.name}</option>)}</select></Field><Field label="Scenario B"><select className="input" value={compareB} onChange={(e) => setCompareB(e.target.value)}>{scenarios.map((scenario) => <option key={scenario.id} value={scenario.id}>{scenario.name}</option>)}</select></Field></div></article><div className="compare-grid"><article className="panel"><span className="label">Scenario A</span><h2>{scenarios.find((s) => s.id === compareA)?.name || 'Scenario A'}</h2><ul className="list"><li>{compareSummaryA.projectCount} projects</li><li>{compareSummaryA.totalFte.toFixed(1)} FTE</li><li>{compareSummaryA.criticalCount} critical</li><li>{compareSummaryA.overCapacity} over capacity</li><li>{compareSummaryA.gaps} uncovered gaps</li><li>{compareSummaryA.avgFit}% avg assigned fit</li></ul></article><article className="panel"><span className="label">Scenario B</span><h2>{scenarios.find((s) => s.id === compareB)?.name || 'Scenario B'}</h2><ul className="list"><li>{compareSummaryB.projectCount} projects</li><li>{compareSummaryB.totalFte.toFixed(1)} FTE</li><li>{compareSummaryB.criticalCount} critical</li><li>{compareSummaryB.overCapacity} over capacity</li><li>{compareSummaryB.gaps} uncovered gaps</li><li>{compareSummaryB.avgFit}% avg assigned fit</li></ul></article></div><article className="panel"><div className="section-head"><div><span className="label">Project delta</span><h2>What changed between scenarios</h2></div></div><div className="stack">{projectDiffs.map((item) => { const gapDelta = item.diff.gapB - item.diff.gapA; return <div key={item.name} className="candidate-panel"><div className="candidate-line"><strong>{item.name}</strong><span className={item.status === 'Changed' ? 'badge high' : item.status === 'Only in A' ? 'badge low' : item.status === 'Only in B' ? 'badge medium' : 'badge medium'}>{item.status}</span></div>{item.diff.changedFields.length > 0 && <div className="meta-block">{item.diff.changedFields.map((field) => <span key={field} className="pill">{field}</span>)}</div>}{item.a && item.b && item.status === 'Changed' && <div className="small-line">A: {item.a.stage} · {item.a.prio} · {item.a.due || 'TBD'} · {item.a.fte} FTE<br />B: {item.b.stage} · {item.b.prio} · {item.b.due || 'TBD'} · {item.b.fte} FTE</div>}{item.a && !item.b && <div className="small-line">Present only in Scenario A</div>}{!item.a && item.b && <div className="small-line">Present only in Scenario B</div>}<div className="small-line">Gap delta: {gapDelta > 0 ? `+${gapDelta}` : gapDelta} · A gaps {item.diff.gapA} · B gaps {item.diff.gapB}</div></div> })}</div></article><article className="panel"><div className="section-head"><div><span className="label">Staffing delta</span><h2>Allocation change by person</h2></div></div><div className="stack">{staffingDiffs.map((item) => <div key={item.member.id} className="roster-row"><div className="roster-main"><strong>{item.member.name}</strong><span className={item.delta > 0 ? 'badge high' : item.delta < 0 ? 'badge medium' : 'badge low'}>{item.delta > 0 ? `+${item.delta}%` : `${item.delta}%`}</span></div><div className="roster-fields"><div className="small-line">A: {item.loadA}% {item.overA ? '· Over cap' : ''}</div><div className="small-line">B: {item.loadB}% {item.overB ? '· Over cap' : ''}</div></div></div>)}</div></article></section>}</section>}{tab === 'Team' && <section><div className="subtabs">{TEAM_VIEWS.map((item) => <button key={item} className={teamView === item ? 'subtab active' : 'subtab'} onClick={() => setTeamView(item)}>{item}</button>)}</div>{teamView === 'Roster' && <><form className="panel form-grid" onSubmit={addTeamMember}><div className="section-head"><div><span className="label">Create</span><h2>Add team member</h2></div></div><Field label="Name"><input className="input" value={teamForm.name} onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })} /></Field><Field label="Role"><input className="input" value={teamForm.role} onChange={(e) => setTeamForm({ ...teamForm, role: e.target.value })} /></Field><Field label="Discipline"><select className="input" value={teamForm.discId} onChange={(e) => setTeamForm({ ...teamForm, discId: e.target.value })}>{disciplines.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="Capacity %"><input className="input" type="number" value={teamForm.cap} onChange={(e) => setTeamForm({ ...teamForm, cap: e.target.value })} /></Field><Field label="Type"><select className="input" value={teamForm.emp} onChange={(e) => setTeamForm({ ...teamForm, emp: e.target.value })}><option>FTE</option><option>Contractor</option><option>Part-time</option><option>Consultant</option></select></Field><div className="form-actions"><button className="tab active" type="submit">Add person</button></div></form><div className="stack roster-grid">{team.map((member) => { const load = memberLoad(member.id); const discipline = disciplines.find((item) => item.id === member.discId); const isOpen = !!expandedMembers[member.id]; return <article key={member.id} className="panel"><div className="section-head"><div className="person-head"><div className="avatar">{member.avatar}</div><div><h2>{member.name}</h2><p>{member.role}</p></div></div><div className="actions"><button className="subtab" type="button" onClick={() => toggleMember(member.id)}>{isOpen ? 'Close' : 'Open'}</button><button className="subtab danger" type="button" onClick={() => deleteTeamMember(member.id)}>Delete</button></div></div><div className="meta-block"><span className="pill" style={{ borderColor: discipline?.color, color: discipline?.color }}>{discipline?.name}</span><span className="pill">{member.emp}</span></div><div className="capacity-line"><span>{load}% allocated</span><span>{member.cap}% cap</span></div><div className="meter"><div className={load > member.cap ? 'meter-fill danger' : 'meter-fill'} style={{ width: `${Math.min(load, 100)}%` }} /></div><p className="muted small">Superpowers: {(member.powers || []).filter(Boolean).join(', ') || 'None yet'}</p>{isOpen && <TeamEditor member={member} setTeam={setTeam} />}</article> })}</div></>}{teamView === 'Skills' && <article className="panel"><div className="section-head"><div><span className="label">Skills matrix</span><h2>Capabilities on the team</h2></div></div><div className="skill-matrix"><div className="matrix-head matrix-row"><div>Skill</div>{team.map((member) => <div key={member.id}>{member.avatar}</div>)}</div>{skills.map((skill) => <div key={skill.id} className="matrix-row"><div>{skill.name}</div>{team.map((member) => <div key={member.id}>{member.sp?.[skill.id] || '—'}</div>)}</div>)}</div></article>}</section>}{tab === 'Analyze' && <section><div className="subtabs">{ANALYZE_VIEWS.map((item) => <button key={item} className={analyzeView === item ? 'subtab active' : 'subtab'} onClick={() => setAnalyzeView(item)}>{item}</button>)}</div>{analyzeView === 'Growth' && <div className="page-grid"><article className="panel"><span className="label">Upskill target</span><h2>Interaction Design depth</h2><p>Maya and Sam already contribute here. A next hire or coaching plan should strengthen cross-coverage.</p></article><article className="panel"><span className="label">Upskill target</span><h2>Systems + visual pairing</h2><p>Design System v2 depends on strong systems and visual collaboration. Alex is the obvious partner for Sam.</p></article><article className="panel wide"><span className="label">Dashboard</span><h2>Command center is live</h2><p>Home now surfaces immediate actions, overloaded people, uncovered gaps, and scenario compare signals.</p></article></div>}{analyzeView === 'Reports' && <article className="panel"><div className="section-head"><div><span className="label">Report</span><h2>Executive summary</h2></div></div><ul className="list"><li>{activeProjects.length} active efforts tied to the current roadmap</li><li>{overAllocated.length} team members exceed capacity</li><li>{criticalProjects} critical project currently in flight</li><li>{totalFte.toFixed(1)} FTE planned in the active scenario</li></ul></article>}</section>}</div>
