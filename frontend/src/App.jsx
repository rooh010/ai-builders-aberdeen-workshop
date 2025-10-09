import { useState } from 'react'
import './App.css'

const FORMATS = [
  { value: 'executive_summary', label: 'Executive Summary', desc: '1-page overview for leadership' },
  { value: 'technical_postmortem', label: 'Technical Post-Mortem', desc: 'Detailed analysis with timeline' },
  { value: 'executive_communication', label: 'Executive Email', desc: 'Email-ready communication' },
  { value: 'visual_timeline', label: 'Visual Timeline', desc: 'ASCII art timeline' },
  { value: 'action_items', label: 'Action Items', desc: 'Organized task tracker' },
]

const EXAMPLES = {
  api: `[14:23] @sarah: API latency spiking on prod
[14:24] @mike: seeing it too, p95 latency at 5s usually 200ms
[14:27] PagerDuty alert: HIGH - API Response Time
[14:31] @sarah: found it - unindexed query from new dashboard
[14:35] @mike: latency dropping back to normal`,

  db: `[09:15] monitoring: DB replication lag alert - 5 minutes behind
[09:17] @alex: checking database cluster status
[09:22] @alex: replication lag now at 10 minutes and growing
[09:27] @jordan: temporarily routing reads to replica-1 only
[09:40] @alex: all replicas caught up, lag back to normal`,

  k8s: `[16:45] @kim: getting alerts about pod crashes in prod namespace
[16:46] @sam: seeing CrashLoopBackOff on user-service pods
[16:50] @kim: memory usage spiked after 3pm deployment
[16:55] @sam: increasing memory limits now
[17:00] @kim: traffic back to normal levels`,
}

function App() {
  const [incidentNotes, setIncidentNotes] = useState('')
  const [format, setFormat] = useState('executive_summary')
  const [output, setOutput] = useState('')
  const [status, setStatus] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const loadExample = (type) => {
    setIncidentNotes(EXAMPLES[type] || '')
  }

  const generateReport = async () => {
    if (!incidentNotes.trim()) {
      alert('Please enter incident notes first!')
      return
    }

    setOutput('')
    setStatus('🔌 Connecting to Claude CLI...')
    setIsGenerating(true)

    try {
      const response = await fetch('http://localhost:5000/api/generate_report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          incident_notes: incidentNotes,
          format: format,
        }),
      })

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let generatedContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        const lines = text.split('\n')

        lines.forEach(line => {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.substring(6))

            if (data.type === 'status') {
              setStatus(data.message)
            } else if (data.type === 'content') {
              generatedContent += data.chunk
              setOutput(generatedContent)
              if (data.progress) {
                setStatus(`Streaming output... ${data.progress}`)
              }
            } else if (data.type === 'complete') {
              setStatus(`✅ Generated in ${data.generation_time} • Total: ${data.total_time}`)
              setIsGenerating(false)
            } else if (data.type === 'error') {
              setStatus(`❌ Error: ${data.error}`)
              setIsGenerating(false)
            } else if (data.type === 'heartbeat') {
              setStatus(data.message)
            }
          }
        })
      }
    } catch (error) {
      setStatus(`❌ Connection error: ${error.message}`)
      setIsGenerating(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output).then(() => {
      alert('Copied to clipboard!')
    }).catch(err => {
      alert('Failed to copy: ' + err)
    })
  }

  const clearOutput = () => {
    setOutput('')
    setStatus('')
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Incident Summariser</h1>
        <p>Transform messy incident logs into professional documentation</p>
      </header>

      <div className="container">
        <div className="input-section">
          <div className="section-header">
            <label htmlFor="notes">📝 Incident Notes</label>
            <div className="example-buttons">
              <button onClick={() => loadExample('api')} className="example-btn">API</button>
              <button onClick={() => loadExample('db')} className="example-btn">DB</button>
              <button onClick={() => loadExample('k8s')} className="example-btn">K8s</button>
            </div>
          </div>

          <textarea
            id="notes"
            value={incidentNotes}
            onChange={(e) => setIncidentNotes(e.target.value)}
            placeholder="Paste your incident logs, Slack messages, or PagerDuty alerts here..."
            rows={12}
          />

          <div className="format-section">
            <label htmlFor="format">📄 Output Format</label>
            <select
              id="format"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            >
              {FORMATS.map(f => (
                <option key={f.value} value={f.value}>
                  {f.label} - {f.desc}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={generateReport}
            disabled={isGenerating}
            className="generate-btn"
          >
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </button>
        </div>

        <div className="output-section">
          <div className="section-header">
            <label>✨ Generated Report</label>
            <div className="action-buttons">
              <button
                onClick={copyToClipboard}
                disabled={!output}
                className="copy-btn"
              >
                Copy
              </button>
              <button onClick={clearOutput} className="clear-btn">
                Clear
              </button>
            </div>
          </div>

          {status && (
            <div className="status">
              {status}
            </div>
          )}

          <div className="output">
            {output || 'Generated report will appear here...'}
          </div>
        </div>
      </div>

      <footer className="footer">
        <p>Built with Flask & Claude CLI | React Frontend</p>
        <p className="workshop-tag">Aberdeen AI Builders Workshop - October 2025</p>
      </footer>
    </div>
  )
}

export default App
