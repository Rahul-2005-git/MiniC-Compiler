import { useState } from 'react'
import ASTViewer from './ASTViewer'

const TABS = [
  { id: 'tokens', label: 'Tokens',      icon: '◈' },
  { id: 'ast',    label: 'AST',         icon: '⬡' },
  { id: 'ir',     label: 'LLVM IR',     icon: '≡' },
  { id: 'asm',    label: 'Assembly',    icon: '⚙' },
  { id: 'mc',     label: 'Machine Code',icon: '▣' },
  { id: 'output', label: 'Output',      icon: '▶' },
]

const TK_COLOR = {
  INT:'#fb79c6',FLOAT:'#fb79c6',VOID:'#fb79c6',CHAR:'#fb79c6',DOUBLE:'#fb79c6',
  IF:'#fb79c6',ELSE:'#fb79c6',WHILE:'#fb79c6',FOR:'#fb79c6',DO:'#fb79c6',
  RETURN:'#fb79c6',BREAK:'#fb79c6',CONTINUE:'#fb79c6',
  PRINTF:'#4ade80',SCANF:'#4ade80',
  INT_LIT:'#a78bfa',FLOAT_LIT:'#a78bfa',
  STRING_LIT:'#fde68a',CHAR_LIT:'#fde68a',
  IDENT:'#22d3ee',
  PLUS:'#fb79c6',MINUS:'#fb79c6',STAR:'#fb79c6',SLASH:'#fb79c6',
  EQ:'#4ade80',NEQ:'#4ade80',LT:'#4ade80',GT:'#4ade80',LE:'#4ade80',GE:'#4ade80',
  AND:'#4ade80',OR:'#4ade80',ASSIGN:'#f59e0b',
  LPAREN:'#fbbf24',RPAREN:'#fbbf24',LBRACE:'#fbbf24',RBRACE:'#fbbf24',
  LBRACKET:'#fbbf24',RBRACKET:'#fbbf24',
  SEMICOLON:'#334155',COMMA:'#475569',
}

function Empty({ icon, msg, hint }) {
  return (
    <div style={{
      display:'flex',flexDirection:'column',alignItems:'center',
      justifyContent:'center',height:'100%',gap:10,
    }}>
      <div style={{
        width:48,height:48,borderRadius:12,background:'var(--bg3)',
        border:'1px solid var(--border)',display:'flex',alignItems:'center',
        justifyContent:'center',fontSize:20,color:'var(--text4)',
      }}>{icon}</div>
      <div style={{fontFamily:'var(--font-mono)',fontSize:12,color:'var(--text3)'}}>{msg}</div>
      {hint && <div style={{fontSize:11,color:'var(--text4)',maxWidth:200,textAlign:'center'}}>{hint}</div>}
    </div>
  )
}

// ── Tokens ──────────────────────────────────────────────────────────────────
function TokensView({ tokens }) {
  const [filter, setFilter] = useState('')
  if (!tokens?.length) return <Empty icon="◈" msg="No tokens yet" hint="Compile some code to see the token stream" />

  const cats = [...new Set(tokens.map(t => t.type))].sort()
  const filtered = filter ? tokens.filter(t => t.type === filter) : tokens

  return (
    <div style={{ display:'flex',flexDirection:'column',height:'100%' }}>
      <div style={{
        padding:'8px 12px',borderBottom:'1px solid var(--border)',
        display:'flex',gap:8,alignItems:'center',flexShrink:0,
        background:'var(--bg3)',
      }}>
        <span style={{
          fontSize:10,color:'var(--amber2)',fontFamily:'var(--font-mono)',
          background:'var(--amber-dim)',border:'1px solid var(--amber)33',
          borderRadius:10,padding:'2px 9px',
        }}>{tokens.length} tokens</span>
        <select value={filter} onChange={e=>setFilter(e.target.value)} style={{
          background:'var(--bg2)',color:'var(--text2)',border:'1px solid var(--border)',
          borderRadius:7,padding:'3px 8px',fontSize:11,fontFamily:'var(--font-mono)',
        }}>
          <option value="">All types ({cats.length})</option>
          {cats.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {filter && <button onClick={()=>setFilter('')} style={{
          fontSize:10,padding:'3px 8px',borderRadius:6,
          background:'var(--bg2)',color:'var(--text3)',border:'1px solid var(--border)',
          fontFamily:'var(--font-mono)',
        }}>✕ clear</button>}
      </div>
      <div style={{
        flex:1,overflow:'auto',padding:'12px',
        display:'flex',flexWrap:'wrap',gap:5,alignContent:'flex-start',
      }}>
        {filtered.map((tok,i) => {
          const col = TK_COLOR[tok.type] || '#475569'
          return (
            <div key={i} style={{
              fontFamily:'var(--font-mono)',fontSize:11,
              padding:'5px 9px',borderRadius:8,
              background:'var(--bg3)',border:`1px solid ${col}22`,
              cursor:'default',transition:'all 0.12s',
              display:'flex',flexDirection:'column',gap:1,
            }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=col+'55';e.currentTarget.style.transform='translateY(-1px)'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=col+'22';e.currentTarget.style.transform='none'}}
            >
              <span style={{color:col,fontWeight:700,fontSize:8,letterSpacing:'0.5px'}}>{tok.type}</span>
              <span style={{color:'var(--text)',fontSize:12.5}}>{String(tok.value).slice(0,22)}</span>
              <span style={{color:'var(--text4)',fontSize:8}}>L{tok.line}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── IR ───────────────────────────────────────────────────────────────────────
function IRView({ ir }) {
  if (!ir) return <Empty icon="≡" msg="No LLVM IR" hint="Compile successfully to generate IR" />
  const lines = ir.split('\n')
  return (
    <div style={{height:'100%',overflow:'auto',fontFamily:'var(--font-mono)',fontSize:12.5,lineHeight:'21px'}}>
      {lines.map((line,i) => {
        let col = 'var(--text2)'; let bg = 'transparent'
        if (line.startsWith(';')) col='#3d4a6a'
        else if (/^define/.test(line)){col='#fb79c6';bg='rgba(251,121,198,0.04)'}
        else if (/^declare/.test(line)) col='#4ade80'
        else if (/^target|^source/.test(line)) col='#2a3050'
        else if (/^[a-zA-Z_@][\w.]*:$/.test(line.trim())) {col='var(--amber)';bg='var(--amber-dim)'}
        else if (/= alloca/.test(line)) col='#22d3ee'
        else if (/store|load/.test(line)) col='#a78bfa'
        else if (/\bbr\b|\bret\b/.test(line)) col='#fb79c6'
        else if (/\bcall\b/.test(line)) col='#4ade80'
        else if (/icmp/.test(line)) col='var(--amber2)'
        else if (/^\s+%/.test(line)) col='#22d3ee'
        return (
          <div key={i} style={{display:'flex',background:bg,transition:'background 0.1s'}}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'}
            onMouseLeave={e=>e.currentTarget.style.background=bg}
          >
            <span style={{
              color:'var(--text4)',minWidth:38,textAlign:'right',paddingRight:14,
              paddingLeft:6,userSelect:'none',flexShrink:0,fontSize:10,
            }}>{i+1}</span>
            <span style={{color:col,whiteSpace:'pre',paddingRight:16}}>{line||' '}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Assembly ─────────────────────────────────────────────────────────────────
function ASMView({ asm }) {
  if (!asm) return <Empty icon="⚙" msg="No assembly" hint="Compile to generate x86-64 assembly" />
  const lines = asm.split('\n')
  return (
    <div style={{height:'100%',overflow:'auto',fontFamily:'var(--font-mono)',fontSize:12.5,lineHeight:'21px'}}>
      {lines.map((line,i) => {
        const t = line.trim()
        let col = 'var(--text2)'; let bg = 'transparent'; let fw = 400
        if (t.startsWith('.')) col='#2a3050'
        else if (/^\w+:$/.test(t)){col='var(--amber)';bg='var(--amber-dim)';fw=700}
        else if (/\s(mov|lea|push|pop)\s/.test(' '+t)) col='#22d3ee'
        else if (/\s(call|ret)\s/.test(' '+t+' ')) col='#4ade80'
        else if (/\s(jmp|je|jne|jl|jg|jle|jge|ja|jb|jz|jnz)\s/.test(' '+t+' ')) col='var(--amber)'
        else if (/\s(cmp|test)\s/.test(' '+t)) col='#a78bfa'
        else if (/\s(add|sub|mul|imul|div|idiv|inc|dec|neg)\s/.test(' '+t)) col='#fb923c'
        else if (/\s(and|or|xor|not|shl|shr|sar)\s/.test(' '+t)) col='#fb7185'
        return (
          <div key={i} style={{display:'flex',background:bg,fontWeight:fw,transition:'background 0.1s'}}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'}
            onMouseLeave={e=>e.currentTarget.style.background=bg}
          >
            <span style={{color:'var(--text4)',minWidth:38,textAlign:'right',paddingRight:14,paddingLeft:6,userSelect:'none',flexShrink:0,fontSize:10}}>{i+1}</span>
            <span style={{color:col,whiteSpace:'pre',paddingRight:16}}>{line||' '}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Machine Code ─────────────────────────────────────────────────────────────
function MCView({ mc }) {
  const [activeFunc, setActiveFunc] = useState(0)
  if (!mc?.length) return <Empty icon="▣" msg="No machine code" hint="Compile to generate hex disassembly" />
  const sec = mc[activeFunc] || mc[0]

  const iColor = (instr) => {
    const i = instr.trim().toLowerCase()
    if (/^(mov|lea|push|pop)/.test(i)) return '#22d3ee'
    if (/^(call|ret)/.test(i)) return '#4ade80'
    if (/^(j[a-z]+)/.test(i)) return 'var(--amber)'
    if (/^(cmp|test)/.test(i)) return '#a78bfa'
    if (/^(add|sub|imul|mul|div|idiv|inc|dec|neg)/.test(i)) return '#fb923c'
    if (/^(and|or|xor|not|shl|shr|sar|rol|ror)/.test(i)) return '#fb7185'
    if (/^(endbr|nop|hlt)/.test(i)) return 'var(--text4)'
    return 'var(--text2)'
  }

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      {/* Function tabs */}
      <div style={{
        display:'flex',gap:2,padding:'8px 10px 0',
        borderBottom:'1px solid var(--border)',flexShrink:0,
        background:'var(--bg3)',overflowX:'auto',
      }}>
        {mc.map((s,i) => (
          <button key={i} onClick={()=>setActiveFunc(i)} style={{
            padding:'5px 12px',borderRadius:'7px 7px 0 0',fontSize:11.5,
            fontFamily:'var(--font-mono)',fontWeight:activeFunc===i?700:400,
            color:activeFunc===i?'var(--amber2)':'var(--text3)',
            background:activeFunc===i?'var(--bg)':'transparent',
            borderBottom:activeFunc===i?'2px solid var(--amber)':'2px solid transparent',
            whiteSpace:'nowrap',
          }}>
            <span style={{marginRight:5}}>ƒ</span>
            {s.name}
            <span style={{marginLeft:6,fontSize:9,opacity:0.6}}>{s.instructions.length}</span>
          </button>
        ))}
      </div>

      {/* Header row */}
      <div style={{
        display:'grid',gridTemplateColumns:'70px 200px 1fr',
        padding:'7px 14px',borderBottom:'1px solid var(--border)',
        background:'var(--bg3)',flexShrink:0,
      }}>
        {['Offset','Hex Bytes','Intel Instruction'].map(h => (
          <span key={h} style={{
            fontSize:9,color:'var(--text3)',textTransform:'uppercase',
            letterSpacing:'1px',fontFamily:'var(--font-mono)',fontWeight:700,
          }}>{h}</span>
        ))}
      </div>

      {/* Instructions */}
      <div style={{flex:1,overflow:'auto',fontFamily:'var(--font-mono)',fontSize:12}}>
        {sec.instructions.map((ins,i) => {
          const hexParts = (ins.bytes||'').trim().split(/\s+/).filter(Boolean)
          const col = iColor(ins.instr)
          return (
            <div key={i} style={{
              display:'grid',gridTemplateColumns:'70px 200px 1fr',
              padding:'5px 14px',borderBottom:'1px solid var(--border)11',
              transition:'background 0.1s',cursor:'default',
            }}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.025)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}
            >
              <span style={{color:'var(--text4)',fontSize:10,alignSelf:'center'}}>
                0x{ins.addr.padStart(4,'0')}
              </span>
              <div style={{display:'flex',gap:3,flexWrap:'wrap',alignItems:'center'}}>
                {hexParts.map((b,j) => (
                  <span key={j} style={{
                    fontSize:10,fontFamily:'var(--font-mono)',
                    color:'#a78bfa',background:'#a78bfa12',
                    borderRadius:3,padding:'1px 4px',
                    border:'1px solid #a78bfa22',
                  }}>{b}</span>
                ))}
              </div>
              <span style={{color:col,fontSize:12.5,alignSelf:'center'}}>{ins.instr.trim()}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Output ───────────────────────────────────────────────────────────────────
function OutputView({ output, errors, warnings, stats }) {
  return (
    <div style={{padding:14,height:'100%',overflow:'auto',display:'flex',flexDirection:'column',gap:12}}>
      {/* Stats row */}
      {stats && (
        <div style={{display:'flex',gap:8,flexWrap:'wrap',flexShrink:0}}>
          {[
            {k:'Tokens',  v:stats.token_count,  c:'var(--cyan)'},
            {k:'Time',    v:`${stats.elapsed_ms}ms`, c:'var(--amber)'},
            {k:'Errors',  v:stats.error_count,  c:stats.error_count>0?'var(--error)':'var(--green)'},
            {k:'Warnings',v:stats.warning_count,c:stats.warning_count>0?'var(--warn)':'var(--text4)'},
          ].map(s => (
            <div key={s.k} style={{
              background:'var(--bg3)',border:'1px solid var(--border)',
              borderRadius:10,padding:'8px 14px',textAlign:'center',minWidth:70,
            }}>
              <div style={{fontSize:17,fontWeight:700,color:s.c,fontFamily:'var(--font-mono)'}}>{s.v}</div>
              <div style={{fontSize:9,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.5px',fontFamily:'var(--font-mono)'}}>{s.k}</div>
            </div>
          ))}
        </div>
      )}

      {/* Warnings */}
      {warnings?.length > 0 && (
        <div>
          <div style={{fontSize:9,textTransform:'uppercase',letterSpacing:'1px',color:'var(--warn)',marginBottom:6,fontFamily:'var(--font-mono)'}}>Warnings</div>
          {warnings.map((w,i) => (
            <div key={i} style={{
              display:'flex',gap:8,background:'rgba(251,191,36,0.06)',
              border:'1px solid rgba(251,191,36,0.15)',borderRadius:8,padding:'9px 13px',marginBottom:5,
              fontSize:12,fontFamily:'var(--font-mono)',color:'#fde68a',lineHeight:1.5,
            }}>
              <span style={{color:'var(--warn)',flexShrink:0}}>⚠</span>{w}
            </div>
          ))}
        </div>
      )}

      {/* Errors */}
      {errors?.length > 0 && (
        <div>
          <div style={{fontSize:9,textTransform:'uppercase',letterSpacing:'1px',color:'var(--error)',marginBottom:6,fontFamily:'var(--font-mono)'}}>Errors</div>
          {errors.map((e,i) => (
            <div key={i} style={{
              display:'flex',gap:8,background:'rgba(251,113,133,0.07)',
              border:'1px solid rgba(251,113,133,0.2)',borderRadius:8,padding:'10px 13px',marginBottom:5,
              fontSize:12,fontFamily:'var(--font-mono)',color:'#fca5a5',lineHeight:1.5,whiteSpace:'pre-wrap',
            }}>
              <span style={{color:'var(--error)',flexShrink:0}}>✕</span>{e}
            </div>
          ))}
        </div>
      )}

      {/* Output */}
      {output && !errors?.length && (
        <div>
          <div style={{fontSize:9,textTransform:'uppercase',letterSpacing:'1px',color:'var(--green)',marginBottom:8,fontFamily:'var(--font-mono)'}}>Execution Output</div>
          <div style={{
            background:'#050709',borderRadius:10,padding:'16px 18px',
            border:'1px solid var(--border)',fontFamily:'var(--font-mono)',
            fontSize:13,color:'var(--green)',lineHeight:1.9,overflowX:'auto',
            whiteSpace:'pre-wrap',boxShadow:'inset 0 0 24px rgba(0,0,0,0.3)',
          }}>
            <div style={{color:'var(--text4)',marginBottom:6,fontSize:11}}>
              $ ./program
            </div>
            {output}
          </div>
        </div>
      )}

      {!output && !errors?.length && !warnings?.length && (
        <Empty icon="▶" msg="Compile code to see output" hint="Run the compiler to execute your program" />
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function OutputTabs({ result }) {
  const [active, setActive] = useState('tokens')
  const stats = result?.stats || {}
  const hasErrors = result?.errors?.length > 0

  return (
    <div style={{
      display:'flex',flexDirection:'column',
      background:'var(--bg2)',borderRadius:'var(--radius)',
      border:'1px solid var(--border)',overflow:'hidden',height:'100%',
    }}>
      {/* Tab bar */}
      <div style={{
        display:'flex',padding:'6px 8px 0',borderBottom:'1px solid var(--border)',
        background:'var(--bg3)',flexShrink:0,overflowX:'auto',gap:1,
      }}>
        {TABS.map(tab => {
          const badge = tab.id==='tokens' ? stats.token_count
            : tab.id==='output' ? (result?.errors?.length||0) : null
          const isActive = active === tab.id
          return (
            <button key={tab.id} onClick={()=>setActive(tab.id)} style={{
              padding:'6px 11px',borderRadius:'7px 7px 0 0',fontSize:12,
              fontWeight:isActive?700:400,fontFamily:'var(--font-ui)',
              color:isActive?'var(--amber2)':'var(--text3)',
              background:isActive?'var(--bg)':'transparent',
              borderBottom:isActive?'2px solid var(--amber)':'2px solid transparent',
              display:'flex',alignItems:'center',gap:5,whiteSpace:'nowrap',
            }}>
              <span style={{fontSize:12}}>{tab.icon}</span>
              {tab.label}
              {badge>0 && (
                <span style={{
                  fontSize:9,background:tab.id==='output'&&hasErrors?'var(--error)':'var(--amber)',
                  color:'#0a0b0e',borderRadius:10,padding:'1px 5px',fontWeight:700,
                }}>{badge}</span>
              )}
            </button>
          )
        })}
      </div>

      <div style={{flex:1,overflow:'hidden'}}>
        {active==='tokens' && <TokensView tokens={result?.tokens} />}
        {active==='ast'    && <ASTViewer ast={result?.ast} compact />}
        {active==='ir'     && <IRView ir={result?.ir} />}
        {active==='asm'    && <ASMView asm={result?.assembly} />}
        {active==='mc'     && <MCView mc={result?.machine_code} />}
        {active==='output' && <OutputView output={result?.output} errors={result?.errors} warnings={result?.warnings} stats={stats} />}
      </div>
    </div>
  )
}
