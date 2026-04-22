import { useState, useCallback } from 'react'
import CodeEditor, { SAMPLE_CODE } from '../components/CodeEditor'
import OutputTabs from '../components/OutputTabs'
import { compileCode } from '../services/api'

const EXAMPLES = [
  { label:'Factorial', desc:'Recursion', code:`int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}
int main() {
    int i = 1;
    while (i <= 8) {
        printf("%d! = %d\\n", i, factorial(i));
        i = i + 1;
    }
    return 0;
}` },
  { label:'FizzBuzz', desc:'Conditionals', code:`int main() {
    int i = 1;
    while (i <= 20) {
        if (i % 15 == 0) {
            printf("FizzBuzz\\n");
        } else {
            if (i % 3 == 0) { printf("Fizz\\n"); }
            else { if (i % 5 == 0) { printf("Buzz\\n"); }
            else { printf("%d\\n", i); } }
        }
        i = i + 1;
    }
    return 0;
}` },
  { label:'Fibonacci', desc:'Dynamic', code:`int fib(int n) {
    if (n <= 1) return n;
    return fib(n-1) + fib(n-2);
}
int main() {
    int i = 0;
    while (i <= 10) {
        printf("fib(%d)=%d\\n", i, fib(i));
        i = i + 1;
    }
    return 0;
}` },
  { label:'Primes', desc:'Number theory', code:`int is_prime(int n) {
    if (n < 2) return 0;
    int i = 2;
    while (i * i <= n) {
        if (n % i == 0) return 0;
        i = i + 1;
    }
    return 1;
}
int main() {
    printf("Primes up to 50:\\n");
    int n = 2;
    while (n <= 50) {
        if (is_prime(n)) printf("%d ", n);
        n = n + 1;
    }
    printf("\\n");
    return 0;
}` },
  { label:'GCD/LCM', desc:'Algorithms', code:`int gcd(int a, int b) {
    while (b != 0) {
        int t = b; b = a % b; a = t;
    }
    return a;
}
int lcm(int a, int b) {
    return (a / gcd(a, b)) * b;
}
int main() {
    printf("gcd(48,18)=%d\\n", gcd(48,18));
    printf("lcm(12,8)=%d\\n",  lcm(12,8));
    return 0;
}` },
]

const STAGE_DEFS = [
  { key:'lex',  label:'Lex',  color:'#22d3ee' },
  { key:'parse',label:'Parse',color:'#a78bfa' },
  { key:'sem',  label:'Sem',  color:'#fb923c' },
  { key:'ir',   label:'IR',   color:'#4ade80' },
  { key:'asm',  label:'ASM',  color:'#f59e0b' },
  { key:'mc',   label:'MC',   color:'#fb7185' },
  { key:'exec', label:'Run',  color:'#4ade80' },
]

export default function Compiler() {
  const [code, setCode]           = useState(SAMPLE_CODE)
  const [result, setResult]       = useState(null)
  const [loading, setLoading]     = useState(false)
  const [stages, setStages]       = useState({})
  const [showEx, setShowEx]       = useState(false)
  const [explaining, setExplaining] = useState(false)
  const [explanation, setExplanation] = useState('')
  const [stdin, setStdin]         = useState('')
  const [showStdin, setShowStdin] = useState(false)

  const run = useCallback(async (src) => {
    setLoading(true); setStages({}); setResult(null); setExplanation('')
    // Animate stages
    STAGE_DEFS.forEach((_,i) => setTimeout(() => {
      setStages(p => ({...p, [STAGE_DEFS[i].key]: 'running'}))
    }, i * 90))

    try {
      const res = await compileCode(src, stdin)
      const d = res.data
      const ns = {
        lex:   d.tokens?.length > 0 ? 'ok' : 'err',
        parse: d.ast                 ? 'ok' : 'err',
        sem:   d.errors?.some(e => e.includes('[ERROR]')) ? 'warn' : 'ok',
        ir:    d.ir     ? 'ok' : 'skip',
        asm:   d.assembly ? 'ok' : 'skip',
        mc:    d.machine_code?.length > 0 ? 'ok' : 'skip',
        exec:  d.output ? 'ok' : (d.errors?.length ? 'err' : 'skip'),
      }
      setStages(ns); setResult(d)
    } catch(e) {
      STAGE_DEFS.forEach(s => setStages(p => ({...p, [s.key]: 'err'})))
      setResult({ tokens:[], ast:null, ir:'', assembly:'', machine_code:[],
        output:'', errors:[`Network error: ${e.message}`], warnings:[], stats:{} })
    }
    setLoading(false)
  }, [stdin])

  const explain = async () => {
    setExplaining(true); setExplanation('')
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          model:'claude-sonnet-4-20250514', max_tokens:500,
          messages:[{role:'user',content:`Explain this C code in 5 concise bullet points for a compiler student. Focus on algorithms, control flow, and what the compiler will do:\n\n${code}`}]
        })
      })
      const data = await r.json()
      setExplanation(data.content?.[0]?.text || 'API access required.')
    } catch { setExplanation('Requires Anthropic API access in browser.') }
    setExplaining(false)
  }

  const stageIcon = (k) => {
    const s = stages[k]
    if (!s)            return { dot: 'var(--bg4)', glow: false }
    if (s==='running') return { dot: 'var(--cyan)', glow: true, anim: true }
    if (s==='ok')      return { dot: 'var(--green)', glow: false }
    if (s==='warn')    return { dot: 'var(--warn)', glow: false }
    if (s==='err')     return { dot: 'var(--error)', glow: false }
    return               { dot: 'var(--text4)', glow: false }
  }

  const stats = result?.stats
  const hasErrors = result?.errors?.length > 0

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
      {/* ── Top bar ── */}
      <div style={{
        display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'10px 18px',borderBottom:'1px solid var(--border)',
        background:'var(--bg2)',flexShrink:0,gap:10,
      }}>
        {/* Left: title + stage dots */}
        <div style={{display:'flex',alignItems:'center',gap:14,minWidth:0}}>
          <span style={{fontWeight:700,fontSize:14,fontFamily:'var(--font-ui)',color:'var(--text)',flexShrink:0}}>Compiler</span>
          <div style={{display:'flex',alignItems:'center',gap:2}}>
            {STAGE_DEFS.map((s,i) => {
              const {dot,anim} = stageIcon(s.key)
              return (
                <div key={s.key} style={{display:'flex',alignItems:'center'}}>
                  <div title={s.label} style={{
                    display:'flex',alignItems:'center',gap:4,
                    padding:'3px 7px',borderRadius:5,
                    transition:'all 0.2s',
                    background: stages[s.key] && stages[s.key]!=='running' ? dot+'18' : 'transparent',
                  }}>
                    <div style={{
                      width:6,height:6,borderRadius:'50%',background:dot,flexShrink:0,
                      transition:'all 0.3s',
                      boxShadow: anim ? `0 0 8px ${dot}` : 'none',
                      animation: anim ? 'pulse 0.7s ease-in-out infinite' : 'none',
                    }} />
                    <span style={{fontSize:9,color:dot,fontFamily:'var(--font-mono)',fontWeight:600}}>{s.label}</span>
                  </div>
                  {i < STAGE_DEFS.length-1 && <div style={{width:8,height:1,background:'var(--border2)'}} />}
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: actions */}
        <div style={{display:'flex',gap:6,alignItems:'center',flexShrink:0}}>
          <button onClick={()=>setShowStdin(v=>!v)} style={{
            padding:'6px 11px',borderRadius:7,fontSize:11.5,fontWeight:500,
            background: showStdin ? 'var(--cyan-dim)' : 'var(--bg3)',
            color: showStdin ? 'var(--cyan)' : 'var(--text2)',
            border: `1px solid ${showStdin ? 'var(--cyan)33' : 'var(--border)'}`,
            fontFamily:'var(--font-mono)',
          }}>stdin</button>

          <div style={{position:'relative'}}>
            <button onClick={()=>setShowEx(v=>!v)} style={{
              padding:'6px 11px',borderRadius:7,fontSize:11.5,fontWeight:500,
              background:'var(--bg3)',color:'var(--text2)',border:'1px solid var(--border)',
              fontFamily:'var(--font-ui)',display:'flex',alignItems:'center',gap:4,
            }}>Examples <span style={{fontSize:9}}>▾</span></button>
            {showEx && (
              <div style={{
                position:'absolute',top:'110%',right:0,zIndex:20,
                background:'var(--bg2)',border:'1px solid var(--border2)',
                borderRadius:10,overflow:'hidden',minWidth:180,
                boxShadow:'0 16px 48px rgba(0,0,0,0.6)',
              }}>
                {EXAMPLES.map(ex => (
                  <button key={ex.label} onClick={()=>{setCode(ex.code);setShowEx(false);setResult(null);setStages({})}} style={{
                    display:'block',width:'100%',textAlign:'left',
                    padding:'9px 16px',background:'transparent',
                    borderBottom:'1px solid var(--border)',
                    transition:'background 0.1s',fontFamily:'var(--font-ui)',
                  }}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--bg3)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                  >
                    <div style={{fontSize:13,fontWeight:500,color:'var(--text)',marginBottom:1}}>{ex.label}</div>
                    <div style={{fontSize:10,color:'var(--text3)',fontFamily:'var(--font-mono)'}}>{ex.desc}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={()=>{setCode('');setResult(null);setStages({})}} style={{
            padding:'6px 11px',borderRadius:7,fontSize:11.5,
            background:'var(--bg3)',color:'var(--text2)',border:'1px solid var(--border)',
            fontFamily:'var(--font-ui)',
          }}>Clear</button>

          <button onClick={explain} disabled={explaining||!code.trim()} style={{
            padding:'6px 11px',borderRadius:7,fontSize:11.5,fontWeight:500,
            background: explaining ? 'var(--bg3)' : 'var(--cyan-dim)',
            color: explaining ? 'var(--text3)' : 'var(--cyan)',
            border:'1px solid var(--cyan)22',fontFamily:'var(--font-ui)',
            opacity: !code.trim() ? 0.4 : 1,
          }}>
            {explaining ? '⟳ Thinking...' : '✦ Explain'}
          </button>

          <button onClick={()=>run(code)} disabled={loading||!code.trim()} style={{
            padding:'7px 22px',borderRadius:8,fontSize:13,fontWeight:700,
            background: loading ? 'var(--bg3)' : 'linear-gradient(90deg, var(--amber), #f97316)',
            color: loading ? 'var(--text3)' : '#0a0b0e',
            fontFamily:'var(--font-ui)',opacity: !code.trim() ? 0.4 : 1,
            display:'flex',alignItems:'center',gap:6,
            boxShadow: loading ? 'none' : 'var(--glow-amber)',
          }}>
            {loading
              ? <><span style={{animation:'spin 0.6s linear infinite',display:'inline-block'}}>⟳</span> Compiling</>
              : <><span>▶</span> Compile</>
            }
          </button>
        </div>
      </div>

      {/* ── Status bar ── */}
      {stats && !loading && (
        <div style={{
          display:'flex',alignItems:'center',gap:14,padding:'6px 18px',
          background: hasErrors ? 'rgba(251,113,133,0.04)' : 'rgba(74,222,128,0.04)',
          borderBottom:'1px solid var(--border)',flexShrink:0,
          fontSize:11,fontFamily:'var(--font-mono)',
        }}>
          <span style={{color:hasErrors?'var(--error)':'var(--green)',fontWeight:700}}>
            {hasErrors ? `✕ ${result.errors.length} error${result.errors.length>1?'s':''}` : '✓ Compiled successfully'}
          </span>
          <span style={{color:'var(--text4)'}}>·</span>
          <span style={{color:'var(--text3)'}}>{stats.token_count} tokens</span>
          <span style={{color:'var(--text4)'}}>·</span>
          <span style={{color:'var(--text3)'}}>{stats.elapsed_ms}ms</span>
          {stats.warning_count > 0 && <>
            <span style={{color:'var(--text4)'}}>·</span>
            <span style={{color:'var(--warn)'}}>⚠ {stats.warning_count} warning{stats.warning_count>1?'s':''}</span>
          </>}
          <div style={{marginLeft:'auto',display:'flex',gap:8}}>
            {stats.has_asm && <span style={{color:'var(--text4)'}}>asm ✓</span>}
            {stats.has_mc  && <span style={{color:'var(--text4)'}}>mc ✓</span>}
          </div>
        </div>
      )}

      {/* ── stdin ── */}
      {showStdin && (
        <div style={{padding:'8px 18px',borderBottom:'1px solid var(--border)',flexShrink:0,background:'var(--bg2)'}}>
          <div style={{fontSize:10,color:'var(--text3)',fontFamily:'var(--font-mono)',marginBottom:5}}>
            stdin (for scanf / interactive programs)
          </div>
          <textarea value={stdin} onChange={e=>setStdin(e.target.value)}
            placeholder="Enter input here..."
            style={{
              width:'100%',height:50,background:'var(--bg3)',color:'var(--text2)',
              border:'1px solid var(--border)',borderRadius:7,
              padding:'6px 10px',fontFamily:'var(--font-mono)',fontSize:12,resize:'none',
            }}
          />
        </div>
      )}

      {/* ── Explanation ── */}
      {explanation && (
        <div style={{
          background:'var(--cyan-dim)',border:'1px solid var(--cyan)18',
          margin:'10px 18px 0',borderRadius:10,padding:'12px 16px',flexShrink:0,
        }}>
          <div style={{fontSize:9,color:'var(--cyan)',fontWeight:700,marginBottom:6,
            textTransform:'uppercase',letterSpacing:'1px',fontFamily:'var(--font-mono)'}}>
            ✦ AI Explanation
          </div>
          <div style={{fontSize:12.5,color:'var(--text2)',lineHeight:1.75,
            whiteSpace:'pre-wrap',fontFamily:'var(--font-mono)'}}>{explanation}</div>
          <button onClick={()=>setExplanation('')} style={{
            marginTop:7,fontSize:10,color:'var(--text3)',background:'transparent',
            border:'none',cursor:'pointer',fontFamily:'var(--font-mono)',
          }}>dismiss ✕</button>
        </div>
      )}

      {/* ── Editor + Output ── */}
      <div style={{
        display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,
        flex:1,overflow:'hidden',padding:'12px 18px 16px',
      }}>
        {/* Editor */}
        <div style={{display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:7}}>
            <div style={{display:'flex',alignItems:'center',gap:7}}>
              <span style={{fontSize:9,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'1.5px',fontFamily:'var(--font-mono)'}}>
                Source · MiniC
              </span>
              <span style={{
                fontSize:9,color:'var(--amber2)',background:'var(--amber-dim)',
                border:'1px solid var(--amber)33',borderRadius:10,
                padding:'1px 7px',fontFamily:'var(--font-mono)',
              }}>PLY Lex+Yacc</span>
            </div>
            <span style={{fontSize:9,fontFamily:'var(--font-mono)',color:'var(--text3)'}}>
              {code.split('\n').length}L · {code.length}B
            </span>
          </div>
          <div style={{flex:1,overflow:'hidden'}}>
            <CodeEditor code={code} onChange={setCode} />
          </div>
        </div>

        {/* Output */}
        <div style={{display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div style={{marginBottom:7}}>
            <span style={{fontSize:9,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'1.5px',fontFamily:'var(--font-mono)'}}>
              Compiler Output · 6 Views
            </span>
          </div>
          <div style={{flex:1,overflow:'hidden'}}>
            <OutputTabs result={result} />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
      `}</style>
    </div>
  )
}
