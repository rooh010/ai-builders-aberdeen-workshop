import { useState } from 'react'
import './App.css'
import ReportModal from './ReportModal'

const FORMATS = [
  { value: 'executive_summary', label: 'Executive Summary', desc: '1-page overview for leadership' },
  { value: 'visual_timeline', label: 'Timeline', desc: 'Visual timeline with emojis' },
  { value: 'root_cause_analysis', label: 'Root Cause Analysis', desc: 'What happened and why' },
  { value: 'impact_assessment', label: 'Impact Assessment', desc: 'Technical and business impact' },
  { value: 'resolution', label: 'Resolution', desc: 'Actions taken and verification' },
  { value: 'action_items', label: 'Action Items', desc: 'Organized task tracker' },
  { value: 'executive_communication', label: 'Executive Email', desc: 'Email-ready communication' },
]

const EXAMPLES = {
  api: `[14:23] @sarah: API latency spiking on prod, anyone else seeing this?
[14:24] @mike: seeing it too, p95 latency at 5s usually 200ms
[14:24] @sarah: checking new relic, huge spike starting at 14:20
[14:25] @jen: customer support getting complaints about slow page loads
[14:26] @mike: running slow query log analysis now
[14:27] PagerDuty alert: HIGH - API Response Time
[14:27] @sarah: acknowledging pagerduty, investigating
[14:28] @mike: found it! query pattern from dashboard taking 8+ seconds
[14:29] @sarah: which dashboard?
[14:30] @mike: the new analytics dashboard deployed this morning
[14:31] @sarah: found it - unindexed query from new dashboard, checking the deployment
[14:32] @sarah: query doing full table scan on users table
[14:33] @mike: can we add an index or should we rollback?
[14:33] @sarah: rolling back dashboard deployment now
[14:34] @jen: customers still reporting issues
[14:35] @mike: latency dropping back to normal, p95 now at 250ms
[14:36] @sarah: rollback complete, monitoring for next 10 mins
[14:38] @mike: all metrics green, latency back to baseline 200ms`,

  db: `[09:15] monitoring: DB replication lag alert - 5 minutes behind
[09:16] @alex: on it, checking the primary
[09:17] @alex: checking database cluster status with pg_stat_replication
[09:18] @jordan: I see it too, replica-2 and replica-3 both lagging
[09:19] @alex: primary showing high write throughput, checking for long-running queries
[09:20] @jordan: found a batch job running since 9am, inserting millions of rows
[09:21] @alex: that's the data migration job, should have been throttled
[09:22] @alex: replication lag now at 10 minutes and growing
[09:23] @alex: checking replication slots... all look normal
[09:24] @jordan: should we pause the batch job?
[09:25] @alex: yes, pausing batch job now
[09:27] @jordan: temporarily routing reads to replica-1 only, it's only 2 min behind
[09:28] @alex: batch job paused, monitoring lag
[09:30] @alex: lag starting to decrease, down to 8 minutes
[09:32] @jordan: replica-1 caught up, still routing there
[09:35] @alex: replica-2 down to 3 minutes lag
[09:38] @jordan: replica-3 catching up too, at 2 minutes now
[09:40] @alex: all replicas caught up, lag back to normal <30 seconds
[09:42] @jordan: restored read traffic to all replicas
[09:43] @alex: resuming batch job with throttling enabled
[09:45] @alex: monitoring looks good, all replicas healthy`,

  k8s: `[16:45] @kim: getting alerts about pod crashes in prod namespace
[16:45] @sam: checking now
[16:46] @sam: seeing CrashLoopBackOff on user-service pods
[16:46] @kim: how many pods affected?
[16:47] @sam: 5 out of 10 pods are crashing
[16:47] @kim: checking logs... seeing OOMKilled in events
[16:48] @sam: yeah, memory usage looks really high
[16:48] @kim: running kubectl describe pod user-service-7d4f9c8b6-xj2k9
[16:49] @kim: confirmed - pods being killed for exceeding memory limits
[16:50] @kim: memory usage spiked after 3pm deployment
[16:50] @sam: checking what changed in that deployment
[16:51] @kim: comparing resource requests... limits are still at 512Mi
[16:52] @sam: looking at the code diff, new feature added caching layer
[16:53] @kim: that would explain it, cache probably growing unbounded
[16:54] @sam: should we rollback or increase limits?
[16:54] @kim: increase limits for now, we can optimize the cache later
[16:55] @sam: increasing memory limits to 1Gi now
[16:56] @sam: updated deployment, rolling out now
[16:57] @kim: watching pods... new ones coming up healthy
[16:58] @sam: memory usage stable around 750Mi
[16:59] @kim: error rate dropping
[17:00] @kim: traffic back to normal levels, all pods healthy
[17:02] @sam: creating ticket to optimize cache memory usage
[17:03] @kim: incident resolved, will write up postmortem`,
}

function App() {
  const [incidentNotes, setIncidentNotes] = useState('')
  const [reports, setReports] = useState({})
  const [status, setStatus] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [generatingFormats, setGeneratingFormats] = useState([])

  const loadExample = (type) => {
    setIncidentNotes(EXAMPLES[type] || '')
  }

  const generateSingleReport = async (formatType) => {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch('http://localhost:5000/api/generate_report', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            incident_notes: incidentNotes,
            format: formatType,
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

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.substring(6))

              if (data.type === 'status') {
                setStatus(`[${formatType}] ${data.message}`)
              } else if (data.type === 'content') {
                generatedContent += data.chunk
                setReports(prev => ({
                  ...prev,
                  [formatType]: generatedContent
                }))
              } else if (data.type === 'complete') {
                setReports(prev => ({
                  ...prev,
                  [formatType]: generatedContent
                }))
                resolve(generatedContent)
              } else if (data.type === 'error') {
                reject(new Error(data.error))
              }
            }
          }
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  const generateReport = async () => {
    if (!incidentNotes.trim()) {
      alert('Please enter incident notes first!')
      return
    }

    setReports({})
    setStatus('🔌 Starting generation of all report formats in parallel...')
    setIsGenerating(true)
    setShowModal(true)

    const allFormats = FORMATS.map(f => f.value)

    // Mark all formats as generating
    setGeneratingFormats([...allFormats])

    // Generate all reports in parallel for much faster completion
    const generatePromises = allFormats.map(async (formatType) => {
      try {
        await generateSingleReport(formatType)
        setStatus(`✅ Completed ${FORMATS.find(f => f.value === formatType)?.label}`)
        // Remove from generating array when done
        setGeneratingFormats(prev => prev.filter(f => f !== formatType))
        return { formatType, success: true }
      } catch (error) {
        setStatus(`❌ Error generating ${formatType}: ${error.message}`)
        setGeneratingFormats(prev => prev.filter(f => f !== formatType))
        return { formatType, success: false, error }
      }
    })

    // Wait for all to complete
    await Promise.all(generatePromises)

    setGeneratingFormats([])
    setIsGenerating(false)
    setStatus('✅ All reports generated!')
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
            rows={15}
          />

          <button
            onClick={generateReport}
            disabled={isGenerating}
            className="generate-btn"
          >
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </button>

          {status && (
            <div className="status">
              {status}
            </div>
          )}
        </div>
      </div>

      <footer className="footer">
        <p>Built with Flask & Claude CLI | React Frontend</p>
        <p className="workshop-tag">Aberdeen AI Builders Workshop - October 2025</p>
      </footer>

      {showModal && (
        <ReportModal
          reports={reports}
          formats={FORMATS}
          generatingFormats={generatingFormats}
          incidentNotes={incidentNotes}
          onRegenerate={(formatType) => {
            setReports(prev => {
              const updated = { ...prev }
              delete updated[formatType]
              return updated
            })
            setGeneratingFormats(prev => [...prev, formatType])
            setStatus(`📝 Regenerating ${FORMATS.find(f => f.value === formatType)?.label}...`)
            generateSingleReport(formatType).then(() => {
              setGeneratingFormats(prev => prev.filter(f => f !== formatType))
              setStatus(`✅ Regenerated ${FORMATS.find(f => f.value === formatType)?.label}`)
            }).catch(error => {
              setGeneratingFormats(prev => prev.filter(f => f !== formatType))
              setStatus(`❌ Error regenerating ${formatType}: ${error.message}`)
            })
          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}

export default App
