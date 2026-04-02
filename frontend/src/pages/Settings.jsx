import { useState } from 'react'

export default function Settings() {
  const [saved, setSaved] = useState(false)
  const [fontSize, setFontSize] = useState(13)
  const [backendUrl, setBackendUrl] = useState('http://localhost:5000')
  const [opts, setOpts] = useState({
    assembly: true, machine_code: true, execute: true,
    lineNumbers: true, autoIndent: true, intelSyntax: true,
  })

  const toggle = (key) => setOpts(o => ({ ...o, [key]: !o[key] }))

  const Toggle = ({ k }) => (
    <div onClick={() => toggle(k)} style={{
      width:38, height:20, borderRadius:10,
      background: opts[k] ? 'var(--accent)' : 'var(--border2)',
      position:'relative', cursor:'pointer', transition:'background 0.2s',
      flexShrink:0,
    }}>
      <div style={{
        width:14, height:14, borderRadius:'50%', background:'#fff',
        position:'absolute', top:3, left: opts[k] ? 21 : 3,
        transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </div>
  )

  const Row = ({ label, desc, control }) => (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'13px 18px', borderBottom:'1px solid var(--border)' }}>
      <div>
        <div style={{ fontWeight:500, fontSize:13, marginBottom:2 }}>{label}</div>
        <div style={{ fontSize:11, color:'var(--text3)' }}>{desc}</div>
      </div>
      {control}
    </div>
  )

  const Section = ({ title, children }) => (
    <div style={{ marginBottom:22 }}>
      <div style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'1.2px',
        color:'var(--text3)', marginBottom:10, fontFamily:'var(--font-mono)' }}>{title}</div>
      <div style={{ background:'var(--bg2)', borderRadius:10,
        border:'1px solid var(--border)', overflow:'hidden' }}>
        {children}
      </div>
    </div>
  )

  return (
    <div style={{ padding:'28px 40px', maxWidth:580, height:'100%', overflowY:'auto' }}>
      <h2 style={{ fontWeight:800, fontSize:17, marginBottom:4 }}>Settings</h2>
      <p style={{ fontSize:12, color:'var(--text3)', marginBottom:24 }}>
        Configure editor, compiler stages, and backend connection
      </p>

      <Section title="Editor">
        <Row label="Font Size" desc="Code editor font size in pixels"
          control={
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <button onClick={() => setFontSize(f => Math.max(10,f-1))} style={{
                width:26, height:26, borderRadius:6, background:'var(--bg3)',
                color:'var(--text)', border:'1px solid var(--border)',
                fontFamily:'var(--font-ui)', fontSize:14,
              }}>−</button>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:13,
                minWidth:24, textAlign:'center' }}>{fontSize}</span>
              <button onClick={() => setFontSize(f => Math.min(20,f+1))} style={{
                width:26, height:26, borderRadius:6, background:'var(--bg3)',
                color:'var(--text)', border:'1px solid var(--border)',
                fontFamily:'var(--font-ui)', fontSize:14,
              }}>+</button>
            </div>
          }
        />
        <Row label="Line Numbers" desc="Show line numbers in editor" control={<Toggle k="lineNumbers" />} />
        <Row label="Auto Indent" desc="Smart indentation on Enter" control={<Toggle k="autoIndent" />} />
      </Section>

      <Section title="Compiler Stages">
        <Row label="Generate Assembly" desc="Produce x86-64 assembly via GCC -S" control={<Toggle k="assembly" />} />
        <Row label="Machine Code" desc="Disassemble binary with objdump" control={<Toggle k="machine_code" />} />
        <Row label="Execute Program" desc="Compile and run the program binary" control={<Toggle k="execute" />} />
        <Row label="Intel Syntax" desc="Use Intel syntax for assembly output" control={<Toggle k="intelSyntax" />} />
      </Section>

      <Section title="Backend">
        <Row label="Flask URL" desc="Backend server address"
          control={
            <input value={backendUrl} onChange={e => setBackendUrl(e.target.value)}
              style={{ background:'var(--bg3)', border:'1px solid var(--border)',
                borderRadius:7, padding:'6px 10px', fontSize:11,
                color:'var(--text2)', width:200, fontFamily:'var(--font-mono)',
              }}
            />
          }
        />
      </Section>

      <Section title="About">
        {[
          ['Version',    '2.0.0'],
          ['Lexer',      'PLY lex (bundled)'],
          ['Parser',     'PLY yacc SLR(1) (bundled)'],
          ['Assembly',   'GCC -S (x86-64)'],
          ['Disassembly','objdump Intel syntax'],
          ['Execution',  'Native GCC binary'],
          ['Frontend',   'React 18 + Vite 5'],
        ].map(([k, v]) => (
          <Row key={k} label={k} desc=""
            control={<span style={{ fontSize:11, fontFamily:'var(--font-mono)',
              color:'var(--accent)', background:'rgba(74,222,128,0.08)',
              border:'1px solid rgba(74,222,128,0.15)', borderRadius:5,
              padding:'2px 8px' }}>{v}</span>}
          />
        ))}
      </Section>

      <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000) }} style={{
        padding:'10px 28px', borderRadius:8, fontSize:13, fontWeight:700,
        background: saved ? 'rgba(74,222,128,0.1)' : 'var(--accent)',
        color: saved ? 'var(--success)' : '#0a0c10',
        border: saved ? '1px solid rgba(74,222,128,0.3)' : 'none',
        fontFamily:'var(--font-ui)', transition:'all 0.3s',
      }}>
        {saved ? '✓ Saved!' : 'Save Settings'}
      </button>
    </div>
  )
}
