import { useState } from 'react'

// ─── Functional settings that actually work ───────────────────────────────
export default function Settings() {
  const [saved, setSaved] = useState(false)
  const [fontSize, setFontSize] = useState(13)
  const [backendUrl, setBackendUrl] = useState('http://localhost:5000')
  const [config, setConfig] = useState({
    assembly:     true,
    machine_code: true,
    execute:      true,
    intel_syntax: true,
    line_numbers: true,
    auto_indent:  true,
  })

  const toggle = (k) => setConfig(c => ({ ...c, [k]: !c[k] }))

  const handleSave = () => {
    // Persist to localStorage (works in browser)
    localStorage.setItem('minic_config', JSON.stringify({ fontSize, backendUrl, ...config }))
    setSaved(true)
    setTimeout(() => setSaved(false), 2200)
  }

  const Toggle = ({ k, color = 'var(--amber)' }) => (
    <button
      onClick={() => toggle(k)}
      style={{
        width: 44, height: 24, borderRadius: 12, position: 'relative',
        background: config[k]
          ? 'linear-gradient(90deg, var(--amber), #f97316)'
          : 'var(--bg4)',
        border: `1px solid ${config[k] ? 'var(--amber)44' : 'var(--border2)'}`,
        flexShrink: 0, transition: 'all 0.25s',
        boxShadow: config[k] ? '0 0 10px var(--amber-dim)' : 'none',
      }}
    >
      <div style={{
        width: 16, height: 16, borderRadius: '50%',
        background: config[k] ? '#0a0b0e' : 'var(--text3)',
        position: 'absolute', top: 3,
        left: config[k] ? 24 : 4,
        transition: 'left 0.25s, background 0.25s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
      }} />
    </button>
  )

  const Row = ({ label, sub, right, last }) => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 18px',
      borderBottom: last ? 'none' : '1px solid var(--border)',
    }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{sub}</div>}
      </div>
      {right}
    </div>
  )

  const Section = ({ title, icon, children }) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 14, color: 'var(--amber)' }}>{icon}</span>
        <span style={{
          fontSize: 10, color: 'var(--text3)', letterSpacing: '1.5px',
          textTransform: 'uppercase', fontFamily: 'var(--font-mono)',
        }}>{title}</span>
      </div>
      <div style={{
        background: 'var(--bg2)', borderRadius: 12,
        border: '1px solid var(--border)', overflow: 'hidden',
      }}>
        {children}
      </div>
    </div>
  )

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '28px 36px 40px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{
          fontWeight: 700, fontSize: 22, letterSpacing: '-0.5px',
          fontFamily: 'var(--font-ui)', marginBottom: 5,
          background: 'linear-gradient(90deg, var(--text), var(--amber2))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          display: 'inline-block',
        }}>Settings</h2>
        <p style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
          Configure your compiler environment
        </p>
      </div>

      <div style={{ maxWidth: 540 }}>

        {/* Editor */}
        <Section title="Editor" icon="◈">
          <Row label="Font Size" sub="Code editor font size in pixels"
            right={
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={() => setFontSize(f => Math.max(10, f-1))} style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border)',
                  fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>−</button>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600,
                  color: 'var(--amber2)', minWidth: 26, textAlign: 'center',
                }}>{fontSize}</span>
                <button onClick={() => setFontSize(f => Math.min(20, f+1))} style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border)',
                  fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>+</button>
              </div>
            }
          />
          <Row label="Line Numbers" sub="Show line numbers in the code editor" right={<Toggle k="line_numbers" />} />
          <Row label="Auto Indent" sub="Smart indentation when pressing Enter" right={<Toggle k="auto_indent" />} last />
        </Section>

        {/* Compiler */}
        <Section title="Compiler Stages" icon="⚙">
          <Row label="Generate Assembly" sub="gcc -S -O1 → x86-64 Intel syntax" right={<Toggle k="assembly" />} />
          <Row label="Machine Code" sub="objdump -d -M intel → hex + mnemonics" right={<Toggle k="machine_code" />} />
          <Row label="Execute Program" sub="Compile & run native binary, capture stdout" right={<Toggle k="execute" />} />
          <Row label="Intel Syntax" sub="Use Intel syntax (vs AT&T) for assembly" right={<Toggle k="intel_syntax" />} last />
        </Section>

        {/* Backend */}
        <Section title="Backend" icon="◎">
          <Row label="Flask Server URL" sub="REST API endpoint for compilation"
            right={
              <input
                value={backendUrl}
                onChange={e => setBackendUrl(e.target.value)}
                style={{
                  background: 'var(--bg3)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '6px 12px', fontSize: 11,
                  color: 'var(--amber2)', width: 200, fontFamily: 'var(--font-mono)',
                }}
              />
            }
            last
          />
        </Section>

        {/* About */}
        <Section title="About" icon="⬡">
          {[
            ['Version', '2.0.0'],
            ['Lexer', 'PLY lex (bundled)'],
            ['Parser', 'PLY yacc SLR(1)'],
            ['Assembly', 'GCC -S'],
            ['Disassembly', 'objdump Intel'],
            ['Frontend', 'React 18 + Vite 5'],
          ].map(([k, v], i, arr) => (
            <Row key={k} label={k} sub=""
              last={i === arr.length - 1}
              right={
                <span style={{
                  fontSize: 11, fontFamily: 'var(--font-mono)',
                  color: 'var(--amber2)',
                  background: 'var(--amber-dim)', border: '1px solid var(--amber)33',
                  borderRadius: 6, padding: '3px 9px',
                }}>{v}</span>
              }
            />
          ))}
        </Section>

        {/* Save button */}
        <button onClick={handleSave} style={{
          padding: '11px 32px', borderRadius: 10, fontSize: 13.5, fontWeight: 700,
          background: saved
            ? 'var(--green-dim)'
            : 'linear-gradient(90deg, var(--amber), #f97316)',
          color: saved ? 'var(--green)' : '#0a0b0e',
          border: saved ? '1px solid var(--green)44' : 'none',
          fontFamily: 'var(--font-ui)', transition: 'all 0.3s',
          boxShadow: saved ? '0 0 14px var(--green-dim)' : 'var(--glow-amber)',
        }}>
          {saved ? '✓ Saved to localStorage' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
