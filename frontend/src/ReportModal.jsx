import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { jsPDF } from 'jspdf'
import './ReportModal.css'

function ReportModal({ reports, formats, generatingFormats, incidentNotes, onRegenerate, onClose }) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeTab, setActiveTab] = useState('executive_summary')
  const [createdTickets, setCreatedTickets] = useState(new Set())
  const currentReport = reports[activeTab] || ''
  const currentFormatLabel = formats.find(f => f.value === activeTab)?.label || activeTab
  const isRegenerating = generatingFormats.includes(activeTab)

  // Check if all reports are completed
  const allReportsCompleted = formats.every(f => reports[f.value])

  const getTabStatus = (formatValue) => {
    if (reports[formatValue]) return 'completed'
    if (generatingFormats.includes(formatValue)) return 'generating'
    return 'pending'
  }

  const downloadMarkdown = () => {
    if (!currentReport) return
    const blob = new Blob([currentReport], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `incident-report-${activeTab}-${new Date().toISOString().split('T')[0]}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const printReport = () => {
    window.print()
  }

  const copyToClipboard = () => {
    if (!currentReport) return
    navigator.clipboard.writeText(currentReport).then(() => {
      alert('Report copied to clipboard!')
    }).catch(err => {
      alert('Failed to copy: ' + err)
    })
  }

  const createJiraTicket = (itemKey) => {
    setCreatedTickets(prev => new Set([...prev, itemKey]))
    setTimeout(() => {
      setCreatedTickets(prev => {
        const next = new Set(prev)
        next.delete(itemKey)
        return next
      })
    }, 3000)
  }

  const exportAllToPDF = () => {
    // Check if we have any completed reports
    const completedReports = formats.filter(f => reports[f.value])
    if (completedReports.length === 0) {
      alert('No reports available to export. Please wait for reports to generate.')
      return
    }

    // Function to clean markdown formatting
    const cleanMarkdown = (text) => {
      let cleaned = text

      // Replace ALL emoji with text equivalents (jsPDF can't handle emoji properly)
      // Timeline emojis
      cleaned = cleaned.replace(/🔴|🛑|❗/g, '[ALERT]')
      cleaned = cleaned.replace(/🔵|🔷|ℹ️/g, '[INFO]')
      cleaned = cleaned.replace(/🟢|✅|✓|✔/g, '[OK]')
      cleaned = cleaned.replace(/🟡|⚠️|⚡/g, '[WARNING]')
      cleaned = cleaned.replace(/🔧|🛠️|⚙️/g, '[FIX]')
      cleaned = cleaned.replace(/⏱️|⏰|🕐/g, '[TIME]')
      cleaned = cleaned.replace(/📊|📈|📉/g, '[METRICS]')
      cleaned = cleaned.replace(/🚀|▶️|➡️/g, '[START]')
      cleaned = cleaned.replace(/❌|✗|✘/g, '[X]')
      cleaned = cleaned.replace(/☑|☒/g, '[CHECK]')

      // Arrows and symbols
      cleaned = cleaned.replace(/→|➜|➔|➡/g, '->')
      cleaned = cleaned.replace(/←|⬅/g, '<-')
      cleaned = cleaned.replace(/↑/g, '^')
      cleaned = cleaned.replace(/↓/g, 'v')

      // Replace fancy quotes with regular quotes
      cleaned = cleaned.replace(/['']|ʻ|'/g, "'")
      cleaned = cleaned.replace(/[""]|ˮ/g, '"')

      // Replace other Unicode symbols
      cleaned = cleaned.replace(/•/g, '*')
      cleaned = cleaned.replace(/–|—/g, '-')
      cleaned = cleaned.replace(/…/g, '...')

      // Remove or replace any remaining emoji (catch-all)
      // This regex matches most emoji ranges
      cleaned = cleaned.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '[EMOJI]')

      // Extract text from code blocks (keep timeline content, just remove formatting)
      cleaned = cleaned.replace(/```[\s\S]*?```/g, (match) => {
        // Remove the ``` markers and any language identifier
        let content = match.replace(/```\w*\n?/g, '').replace(/```/g, '')

        // Apply emoji cleaning to code block content
        content = content.replace(/🔴|🛑|❗/g, '[ALERT]')
        content = content.replace(/🔵|🔷/g, '[INFO]')
        content = content.replace(/🟢|✅|✓/g, '[OK]')
        content = content.replace(/🟡|⚠️/g, '[WARNING]')
        content = content.replace(/🔧|🛠️/g, '[FIX]')
        content = content.replace(/⏱️|⏰/g, '[TIME]')
        content = content.replace(/['']|ʻ/g, "'")
        content = content.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '[EMOJI]')

        // AGGRESSIVE CLEANING: Remove ALL % characters (they break jsPDF)
        content = content.replace(/%/g, '')

        // Remove lines that are mostly just box drawing characters
        const lines = content.split('\n').filter(line => {
          const trimmed = line.trim()
          if (!trimmed) return false
          // Remove lines that are just separators
          if (/^[=\-_]+$/.test(trimmed)) return false
          // Remove lines that are mostly spaces (leftover from box removal)
          if (trimmed.replace(/\s/g, '').length < 3) return false
          // Keep everything else
          return true
        })

        // Clean up each line
        const cleanedLines = lines.map(line => {
          return line.trim().replace(/^[|\s]+/, '').replace(/[|\s]+$/, '')
        }).filter(line => line.length > 0)

        return '\n' + cleanedLines.join('\n') + '\n'
      })

      // Remove markdown headers but keep the text
      cleaned = cleaned.replace(/^#{1,6}\s+/gm, '')

      // Remove bold/italic markers (do this BEFORE list processing)
      cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1')
      cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1')

      // Clean up list markers
      cleaned = cleaned.replace(/^- \[ \] /gm, '[ ] ')
      cleaned = cleaned.replace(/^- \[x\] /gm, '[x] ')
      cleaned = cleaned.replace(/^- /gm, '  * ')

      // Remove extra blank lines
      cleaned = cleaned.replace(/\n{3,}/g, '\n\n')

      // CRITICAL: Remove ALL problematic characters that break jsPDF rendering
      cleaned = cleaned.replace(/%/g, '')  // ASCII art boxes

      // Remove Unicode box-drawing characters (these also break jsPDF)
      cleaned = cleaned.replace(/[│├└┴┤┬┼─━┃┏┓┗┛┣┫┳┻╋]/g, '|')
      cleaned = cleaned.replace(/[═╔╗╚╝╠╣╦╩╬]/g, '=')

      // Remove any remaining problematic Unicode symbols
      cleaned = cleaned.replace(/[▪▫■□▢▣▤▥▦▧▨▩▬▭▮▯]/g, '*')
      cleaned = cleaned.replace(/[◆◇◈◉◊○◌◍◎●]/g, 'o')

      // Remove lines that are just separator characters (|, =, -, etc.)
      cleaned = cleaned.split('\n').filter(line => {
        const trimmed = line.trim()
        if (!trimmed) return true // Keep blank lines
        // Remove lines that are mostly separator characters
        const separatorChars = (trimmed.match(/[|=\-_+]/g) || []).length
        // If more than 80% of the line is separators, remove it
        return separatorChars < trimmed.length * 0.8
      }).join('\n')

      return cleaned.trim()
    }

    try {
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 20
      const maxWidth = pageWidth - (2 * margin)
      let yPosition = margin

      // Title page
      pdf.setFontSize(24)
      pdf.setTextColor(15, 52, 96)
      pdf.text('Incident Report Package', pageWidth / 2, yPosition, { align: 'center' })

      yPosition += 15
      pdf.setFontSize(12)
      pdf.setTextColor(102, 102, 102)
      pdf.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), pageWidth / 2, yPosition, { align: 'center' })

      yPosition += 10
      pdf.setFontSize(10)
      pdf.setTextColor(136, 136, 136)
      pdf.text('Aberdeen AI Builders Workshop - October 2025', pageWidth / 2, yPosition, { align: 'center' })

      // Add each report
      completedReports.forEach((format) => {
        // New page for each report
        pdf.addPage()
        yPosition = margin

        // Section header
        pdf.setFontSize(18)
        pdf.setTextColor(15, 52, 96)
        pdf.text(format.label, margin, yPosition)
        yPosition += 10

        // Line under header
        pdf.setDrawColor(15, 52, 96)
        pdf.setLineWidth(0.5)
        pdf.line(margin, yPosition, pageWidth - margin, yPosition)
        yPosition += 10

        // Report content - clean markdown first
        pdf.setFontSize(10)
        pdf.setTextColor(51, 51, 51)

        const reportContent = cleanMarkdown(reports[format.value])
        const lines = pdf.splitTextToSize(reportContent, maxWidth)

        lines.forEach(line => {
          if (yPosition > pageHeight - margin) {
            pdf.addPage()
            yPosition = margin
          }
          pdf.text(line, margin, yPosition)
          yPosition += 5
        })
      })

      // Save the PDF
      pdf.save(`incident-reports-${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (error) {
      console.error('PDF generation error:', error)
      alert('Failed to generate PDF: ' + error.message)
    }
  }

  // Custom component for list items in Action Items tab
  const customComponents = activeTab === 'action_items' ? {
    li: ({ children, ...props }) => {
      // Use the text content as a stable key
      const textContent = typeof children === 'string'
        ? children
        : Array.isArray(children)
          ? children.map(c => typeof c === 'string' ? c : '').join('')
          : String(children)
      const ticketKey = `${activeTab}-${textContent.substring(0, 50)}`
      const isCreated = createdTickets.has(ticketKey)

      return (
        <li {...props} className="action-item-with-button">
          <span className="action-item-content">{children}</span>
          <button
            className={`jira-btn ${isCreated ? 'created' : ''}`}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              createJiraTicket(ticketKey)
            }}
            disabled={isCreated}
          >
            {isCreated ? '✓ Created' : '+ Jira'}
          </button>
        </li>
      )
    }
  } : {}

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-container ${isFullscreen ? 'fullscreen' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <h2>Incident Reports</h2>
          </div>
          <div className="modal-actions">
            <button onClick={() => setIsFullscreen(!isFullscreen)} className="action-btn fullscreen-btn" title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
              {isFullscreen ? '⊟' : '⛶'}
            </button>
            <button onClick={() => onRegenerate(activeTab)} className="action-btn regenerate-btn" title="Regenerate this report" disabled={!currentReport || isRegenerating}>
              🔄 Regenerate
            </button>
            <button
              onClick={exportAllToPDF}
              className="action-btn pdf-btn"
              title={allReportsCompleted ? "Export all reports to PDF" : "Wait for all reports to complete"}
              disabled={!allReportsCompleted}
            >
              📄 Export PDF
            </button>
            <button onClick={copyToClipboard} className="action-btn copy-btn" title="Copy to clipboard" disabled={!currentReport}>
              📋 Copy
            </button>
            <button onClick={downloadMarkdown} className="action-btn download-btn" title="Download as Markdown" disabled={!currentReport}>
              💾 Download
            </button>
            <button onClick={printReport} className="action-btn print-btn" title="Print report" disabled={!currentReport}>
              🖨️ Print
            </button>
            <button onClick={onClose} className="action-btn close-btn" title="Close">
              ✕
            </button>
          </div>
        </div>

        <div className="tabs-container">
          {formats.map(format => {
            const status = getTabStatus(format.value)
            return (
              <button
                key={format.value}
                className={`tab ${activeTab === format.value ? 'active' : ''} ${status}`}
                onClick={() => setActiveTab(format.value)}
              >
                {format.label}
                {status === 'completed' && <span className="tab-indicator completed">✓</span>}
                {status === 'generating' && <span className="tab-indicator generating">⟳</span>}
                {status === 'pending' && <span className="tab-indicator pending">⏱</span>}
              </button>
            )
          })}
        </div>

        <div className="modal-content">
          <div className="report-view">
            {currentReport ? (
              <ReactMarkdown components={customComponents}>{currentReport}</ReactMarkdown>
            ) : (
              <div className="loading-placeholder">
                <div className="spinner"></div>
                <p>Generating {currentFormatLabel}...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportModal
