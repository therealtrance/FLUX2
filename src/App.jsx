import { useState } from 'react'

export default function App() {
  const [count, setCount] = useState(0)

  return (
    <div style={{ padding: 20 }}>
      <h1>FLUX Planner 🚀</h1>
      <p>This is your starting point.</p>
      <button onClick={() => setCount(count + 1)}>
        Clicks: {count}
      </button>
    </div>
  )
}
