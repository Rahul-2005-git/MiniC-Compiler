import { useState } from 'react'
import ASTViewer from './ASTViewer'

const TABS = [
  { id: 'tokens',   label: 'Tokens',      icon: '◈', badge: 'token_count' },
  { id: 'ast',      label: 'AST',         icon: '⬢', badge: null },
  { id: 'ir',       label: 'LLVM IR',     icon: '◎', badge: null },
  { id: 'asm',      label: 'Assembly',    icon: '⚙', badge: null },
  { id: 'mc',       label: 'Machine Code',icon: '▣', badge: null },
  { id: 'output',   label: 'Output',      icon: '▶', badge: 'error_count' },
]

const TOKEN_COLORS = {
  INT:'#ff79c6',FLOAT:'#ff79c6',VOID:'#ff79c6',CHAR:'#ff79c6',DOUBLE:'#ff79c6',
  IF:'#ff79c6',ELSE:'#ff79c6',WHILE:'#ff79c6',FOR:'#ff79c6',DO:'#ff79c6',
  RETURN:'#ff79c6',BREAK:'#ff79c6',CONTINUE:'#ff79c6',PRINTF:'#50fa7b',SCANF:'#50fa7b',
  INT_LIT:'#bd93f9',FLOAT_LIT:'#bd93f9',STRING_LIT:'#f1fa8c',CHAR_LIT:'#f1fa8c',
  IDENT:'#8be9fd',
  PLUS:'#ff79c6',MINUS:'#ff79c6',STAR:'#ff79c6',SLASH:'#ff79c6',
  EQ:'#50fa7b',NEQ:'#50fa7b',LT:'#50fa7b',GT:'#50fa7b',LE:'#50fa7b',GE:'#50fa7b',
  AND:'#50fa7b',OR:'#50fa7b',ASSIGN:'#f8f8f2',
  LPAREN:'#ffb86c',RPAREN:'#ffb86c',LBRACE:'#ffb86c',RBRACE:'#ffb86c',
  SEMICOLON:'#6272a4',COMMA:'#6272a4',
}

function Empty({ icon, msg }) {
  return (
    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',
      justifyContent:'center',height:'100%',gap:10,color:'var(--text3)' }}>
      <div style={{ fontSize:38,opacity:0.4 }}>{icon}</div>
      <div style={{ fontFamily:'var(--font-mono)',fontSize:12 }}>{msg}</div>
    </div>
  )
}

function TokensView({ tokens }) {
  const [filter, setFilter] = useState('')
  if (!tokens?.length) return <Empty icon="◈" msg="No tokens — compile first" />
  const cats = [...new Set(tokens.map(t => t.type))]
  const filtered = filter ? tokens.filter(t => t.type === filter) : tokens
  return (
    <div style={{ display:'flex',flexDirection:'column',height:'100%' }}>
      <div style={{ padding:'10px 14px 8px', borderBottom:'1px solid var(--border)',
        display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',flexShrink:0 }}>
        <span style={{ fontSize:11,color:'var(--text3)',fontFamily:'var(--font-mono)',
          background:'var(--bg3)',padding:'3px 10px',borderRadius:20,border:'1px solid var(--border)' }}>
          {tokens.length} tokens
        </span>
        <select value={filter} onChange={e=>setFilter(e.target.value)} style={{
          background:'var(--bg3)',color:'var(--text2)',border:'1px solid var(--border)',
          borderRadius:6,padding:'3px 8px',fontSize:11,fontFamily:'var(--font-mono)',
          outline:'none',
        }}>
          <option value="">All types</option>
          {cats.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div style={{ flex:1,overflow:'auto',padding:'12px 14px',
        display:'flex',flexWrap:'wrap',gap:5,alignContent:'flex-start' }}>
        {filtered.map((tok,i) => (
          <div key={i} style={{ fontFamily:'var(--font-mono)',fontSize:11,
            padding:'5px 9px',borderRadius:7,background:'var(--bg3)',
            border:'1px solid var(--border)',cursor:'default',
            transition:'border-color 0.12s,transform 0.12s',
          }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--border2)';e.currentTarget.style.transform='translateY(-1px)'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.transform='none'}}
          >
            <div style={{ color:TOKEN_COLORS[tok.type]||'#94a3b8',fontWeight:700,fontSize:9,marginBottom:2 }}>{tok.type}</div>
            <div style={{ color:'var(--text)',fontSize:12 }}>{String(tok.value).slice(0,20)}</div>
            <div style={{ color:'var(--text3)',fontSize:9,marginTop:1 }}>L{tok.line}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function IRView({ ir }) {
  if (!ir) return <Empty icon="◎" msg="No LLVM IR — compile first" />
  const lines = ir.split('\n')
  return (
    <div style={{ height:'100%',overflow:'auto',fontFamily:'var(--font-mono)',fontSize:12.5,lineHeight:'20px' }}>
      {lines.map((line, i) => {
        let color = 'var(--text2)'
        let bg = 'transparent'
        if (line.startsWith(';')) color='#6272a4'
        else if (/^define/.test(line)) {color='#ff79c6';bg='rgba(255,121,198,0.04)'}
        else if (/^declare/.test(line)) color='#50fa7b'
        else if (/^target|^source/.test(line)) color='#44475a'
        else if (/^[a-zA-Z_@][\w.]*:$/.test(line.trim())) {color='#fbbf24';bg='rgba(251,191,36,0.04)'}
        else if (line.includes('= alloca')) color='#8be9fd'
        else if (/store|load/.test(line)) color='#bd93f9'
        else if (/\bbr\b|\bret\b/.test(line)) color='#ff79c6'
        else if (/\bcall\b/.test(line)) color='#50fa7b'
        else if (/icmp/.test(line)) color='#f1fa8c'
        else if (/^\s+%\w+ =/.test(line)) color='#8be9fd'
        return (
          <div key={i} style={{ display:'flex',background:bg }}>
            <span style={{ color:'#44475a',minWidth:36,textAlign:'right',paddingRight:14,paddingLeft:6,userSelect:'none',flexShrink:0 }}>{i+1}</span>
            <span style={{ color,whiteSpace:'pre',paddingRight:16 }}>{line||' '}</span>
          </div>
        )
      })}
    </div>
  )
}

function ASMView({ asm }) {
  if (!asm) return <Empty icon="⚙" msg="No assembly — compile first" />
  const lines = asm.split('\n')
  return (
    <div style={{ height:'100%',overflow:'auto',fontFamily:'var(--font-mono)',fontSize:12.5,lineHeight:'20px' }}>
      {lines.map((line,i) => {
        let color = 'var(--text2)'
        let bg = 'transparent'
        const t = line.trim()
        if (t.startsWith('.')) color = '#6272a4'
        else if (/^\w+:/.test(t) && !t.includes('\t')) {color='#fbbf24';bg='rgba(251,191,36,0.04)'}
        else if (/\.(globl|type|size|file|section|align|string|byte|long)/.test(t)) color='#6272a4'
        else if (/\s(mov|push|pop|call|ret|jmp|je|jne|jl|jg|jle|jge|sub|add|mul|imul|div|cmp|lea|and|or|xor|test)/.test(t)) color='#8be9fd'
        else if (/;/.test(t)) color='#6272a4'
        return (
          <div key={i} style={{ display:'flex',background:bg }}>
            <span style={{ color:'#44475a',minWidth:36,textAlign:'right',paddingRight:14,paddingLeft:6,userSelect:'none',flexShrink:0 }}>{i+1}</span>
            <span style={{ color,whiteSpace:'pre',paddingRight:16 }}>{line||' '}</span>
          </div>
        )
      })}
    </div>
  )
}

function MCView({ mc }) {
  const [activeFunc, setActiveFunc] = useState(0)
  if (!mc?.length) return <Empty icon="▣" msg="No machine code — compile first" />
  const sec = mc[activeFunc] || mc[0]
  return (
    <div style={{ display:'flex',flexDirection:'column',height:'100%' }}>
      {/* Function tabs */}
      <div style={{ display:'flex',gap:4,padding:'8px 12px 0',borderBottom:'1px solid var(--border)',
        flexShrink:0,flexWrap:'wrap' }}>
        {mc.map((s,i) => (
          <button key={i} onClick={()=>setActiveFunc(i)} style={{
            padding:'5px 12px',borderRadius:'6px 6px 0 0',fontSize:11.5,
            fontFamily:'var(--font-mono)',fontWeight:activeFunc===i?700:400,
            color:activeFunc===i?'var(--accent2)':'var(--text3)',
            background:activeFunc===i?'var(--bg)':'transparent',
            borderBottom:activeFunc===i?'2px solid var(--accent2)':'2px solid transparent',
            transition:'all 0.15s',
          }}>
            {s.name}
            <span style={{ marginLeft:6,fontSize:9,opacity:0.7 }}>{s.instructions.length} ops</span>
          </button>
        ))}
      </div>
      {/* Instructions table */}
      <div style={{ flex:1,overflow:'auto',fontFamily:'var(--font-mono)',fontSize:12 }}>
        <table style={{ width:'100%',borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'var(--bg3)',position:'sticky',top:0 }}>
              <th style={{ padding:'8px 14px',textAlign:'left',color:'var(--text3)',fontSize:10,
                fontWeight:600,letterSpacing:'0.8px',textTransform:'uppercase',width:80,
                borderBottom:'1px solid var(--border)' }}>Offset</th>
              <th style={{ padding:'8px 14px',textAlign:'left',color:'var(--text3)',fontSize:10,
                fontWeight:600,letterSpacing:'0.8px',textTransform:'uppercase',width:220,
                borderBottom:'1px solid var(--border)' }}>Hex Bytes</th>
              <th style={{ padding:'8px 14px',textAlign:'left',color:'var(--text3)',fontSize:10,
                fontWeight:600,letterSpacing:'0.8px',textTransform:'uppercase',
                borderBottom:'1px solid var(--border)' }}>Instruction (Intel Syntax)</th>
            </tr>
          </thead>
          <tbody>
            {sec.instructions.map((ins,i) => {
              const instr = ins.instr.trim()
              let icolor = 'var(--text2)'
              if (/^(mov|lea|push|pop)/.test(instr)) icolor='#8be9fd'
              else if (/^(call|ret)/.test(instr)) icolor='#50fa7b'
              else if (/^(j[a-z]+|jmp)/.test(instr)) icolor='#fbbf24'
              else if (/^(cmp|test)/.test(instr)) icolor='#bd93f9'
              else if (/^(add|sub|mul|imul|div|idiv|inc|dec)/.test(instr)) icolor='#ffb86c'
              else if (/^(and|or|xor|not|shl|shr)/.test(instr)) icolor='#f472b6'
              else if (/^endbr|^nop/.test(instr)) icolor='#44475a'
              const hexBytes = ins.bytes || ''
              const hexParts = hexBytes.trim().split(/\s+/)
              return (
                <tr key={i} style={{ borderBottom:'1px solid rgba(42,47,62,0.5)' }}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                >
                  <td style={{ padding:'5px 14px',color:'#6272a4',fontSize:11 }}>
                    0x{ins.addr.padStart(4,'0')}
                  </td>
                  <td style={{ padding:'5px 14px' }}>
                    <div style={{ display:'flex',gap:4,flexWrap:'wrap' }}>
                      {hexParts.map((b,j) => (
                        <span key={j} style={{ color:'#bd93f9',fontSize:11,
                          background:'rgba(189,147,249,0.08)',borderRadius:3,
                          padding:'1px 3px' }}>{b}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding:'5px 14px',color:icolor,fontSize:12.5 }}>{instr}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function OutputView({ output, errors, warnings, stats }) {
  return (
    <div style={{ padding:16,height:'100%',overflow:'auto',display:'flex',flexDirection:'column',gap:12 }}>
      {stats && (
        <div style={{ display:'flex',gap:8,flexWrap:'wrap',flexShrink:0 }}>
          {[
            { label:'Tokens', val:stats.token_count, color:'var(--accent2)' },
            { label:'Time', val:`${stats.elapsed_ms}ms`, color:'var(--accent)' },
            { label:'Errors', val:stats.error_count, color:stats.error_count>0?'var(--error)':'var(--success)' },
            { label:'Warnings', val:stats.warning_count, color:stats.warning_count>0?'var(--warning)':'var(--text3)' },
          ].map(s => (
            <div key={s.label} style={{ background:'var(--bg3)',border:'1px solid var(--border)',
              borderRadius:8,padding:'7px 12px',textAlign:'center' }}>
              <div style={{ fontSize:16,fontWeight:700,color:s.color,fontFamily:'var(--font-mono)' }}>{s.val}</div>
              <div style={{ fontSize:10,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.5px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {warnings?.length > 0 && (
        <div>
          <div style={{ fontSize:10,textTransform:'uppercase',letterSpacing:'1px',color:'var(--warning)',marginBottom:6 }}>Warnings</div>
          {warnings.map((w,i) => (
            <div key={i} style={{ display:'flex',gap:8,background:'rgba(251,191,36,0.06)',
              border:'1px solid rgba(251,191,36,0.18)',borderRadius:7,padding:'8px 12px',marginBottom:5,
              fontSize:12,fontFamily:'var(--font-mono)',color:'#fde68a',lineHeight:1.5 }}>
              <span style={{ color:'var(--warning)',flexShrink:0 }}>⚠</span>{w}
            </div>
          ))}
        </div>
      )}

      {errors?.length > 0 && (
        <div>
          <div style={{ fontSize:10,textTransform:'uppercase',letterSpacing:'1px',color:'var(--error)',marginBottom:6 }}>Errors</div>
          {errors.map((e,i) => (
            <div key={i} style={{ display:'flex',gap:8,background:'rgba(248,113,113,0.07)',
              border:'1px solid rgba(248,113,113,0.2)',borderRadius:7,padding:'10px 12px',marginBottom:5,
              fontSize:12,fontFamily:'var(--font-mono)',color:'#fca5a5',lineHeight:1.5,whiteSpace:'pre-wrap' }}>
              <span style={{ color:'var(--error)',flexShrink:0 }}>✕</span>{e}
            </div>
          ))}
        </div>
      )}

      {output && !errors?.length && (
        <div>
          <div style={{ fontSize:10,textTransform:'uppercase',letterSpacing:'1px',color:'var(--success)',marginBottom:6 }}>Execution Output</div>
          <pre style={{ background:'#0a0c10',borderRadius:10,padding:'14px 16px',
            border:'1px solid var(--border)',fontFamily:'var(--font-mono)',fontSize:13,
            color:'#4ade80',lineHeight:1.8,overflowX:'auto',whiteSpace:'pre-wrap',
            maxHeight:300,overflow:'auto',
          }}>
            <span style={{ color:'#44475a',userSelect:'none' }}>$ ./program{'\n'}</span>
            {output}
          </pre>
        </div>
      )}

      {!output && !errors?.length && !warnings?.length && (
        <Empty icon="▶" msg="Compile code to see output" />
      )}
    </div>
  )
}

export default function OutputTabs({ result }) {
  const [active, setActive] = useState('tokens')
  const stats = result?.stats || {}
  const hasErrors = result?.errors?.length > 0

  return (
    <div style={{ display:'flex',flexDirection:'column',background:'var(--bg2)',
      borderRadius:'var(--radius)',border:'1px solid var(--border)',overflow:'hidden',height:'100%' }}>
      <div style={{ display:'flex',padding:'6px 10px 0',borderBottom:'1px solid var(--border)',
        background:'var(--bg2)',flexShrink:0,overflowX:'auto',gap:1 }}>
        {TABS.map(tab => {
          const badgeVal = tab.id==='tokens' ? stats.token_count : (tab.id==='output' ? (result?.errors?.length||0) : null)
          return (
            <button key={tab.id} onClick={()=>setActive(tab.id)} style={{
              padding:'6px 12px',borderRadius:'6px 6px 0 0',fontSize:12,fontWeight:active===tab.id?700:400,
              fontFamily:'var(--font-ui)',
              color:active===tab.id?'var(--accent)':'var(--text3)',
              background:active===tab.id?'var(--bg)':'transparent',
              borderBottom:active===tab.id?'2px solid var(--accent)':'2px solid transparent',
              display:'flex',alignItems:'center',gap:5,whiteSpace:'nowrap',
              transition:'all 0.15s',
            }}>
              <span style={{ fontSize:13 }}>{tab.icon}</span>
              {tab.label}
              {badgeVal>0 && (
                <span style={{ fontSize:9,background:tab.id==='output'&&hasErrors?'var(--error)':'var(--accent)',
                  color:'#0d0f14',borderRadius:10,padding:'1px 5px',fontWeight:700 }}>{badgeVal}</span>
              )}
            </button>
          )
        })}
      </div>
      <div style={{ flex:1,overflow:'hidden' }}>
        {active==='tokens'  && <TokensView tokens={result?.tokens} />}
        {active==='ast'     && <ASTViewer ast={result?.ast} />}
        {active==='ir'      && <IRView ir={result?.ir} />}
        {active==='asm'     && <ASMView asm={result?.assembly} />}
        {active==='mc'      && <MCView mc={result?.machine_code} />}
        {active==='output'  && <OutputView output={result?.output} errors={result?.errors} warnings={result?.warnings} stats={stats} />}
      </div>
    </div>
  )
}
