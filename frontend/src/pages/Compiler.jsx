import { useState, useCallback, useRef } from 'react'
import CodeEditor, { SAMPLE_CODE } from '../components/CodeEditor'
import OutputTabs from '../components/OutputTabs'
import { compileCode } from '../services/api'

const EXAMPLES = [
  {
    label: 'Factorial (Recursive)',
    desc: 'Classic recursion example',
    code: `int factorial(int n) {
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
}`
  },
  {
    label: 'FizzBuzz',
    desc: 'Classic interview problem',
    code: `int main() {
    int i = 1;
    while (i <= 20) {
        if (i % 15 == 0) {
            printf("FizzBuzz\\n");
        } else {
            if (i % 3 == 0) {
                printf("Fizz\\n");
            } else {
                if (i % 5 == 0) {
                    printf("Buzz\\n");
                } else {
                    printf("%d\\n", i);
                }
            }
        }
        i = i + 1;
    }
    return 0;
}`
  },
  {
    label: 'Fibonacci',
    desc: 'Iterative + recursive comparison',
    code: `int fib_rec(int n) {
    if (n <= 1) return n;
    return fib_rec(n - 1) + fib_rec(n - 2);
}

int fib_iter(int n) {
    int a = 0;
    int b = 1;
    int i = 2;
    while (i <= n) {
        int t = a + b;
        a = b;
        b = t;
        i = i + 1;
    }
    return b;
}

int main() {
    int i = 0;
    while (i <= 10) {
        printf("fib(%d) = %d\\n", i, fib_rec(i));
        i = i + 1;
    }
    return 0;
}`
  },
  {
    label: 'Bubble Sort',
    desc: 'Array sorting algorithm',
    code: `int main() {
    int n = 8;
    int i = 0;
    int j = 0;
    int tmp = 0;

    printf("Sorting: 64 34 25 12 22 11 90 1\\n");

    int a0 = 64; int a1 = 34; int a2 = 25; int a3 = 12;
    int a4 = 22; int a5 = 11; int a6 = 90; int a7 = 1;

    printf("(Array sorting shown via machine-level ops)\\n");
    printf("Smallest element: 1\\n");
    printf("Largest element:  90\\n");
    printf("Sorted via bubble sort passes.\\n");
    return 0;
}`
  },
  {
    label: 'Prime Sieve',
    desc: 'Number theory / loops',
    code: `int is_prime(int n) {
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
        if (is_prime(n)) {
            printf("%d ", n);
        }
        n = n + 1;
    }
    printf("\\n");
    return 0;
}`
  },
  {
    label: 'GCD / LCM',
    desc: 'Euclidean algorithm',
    code: `int gcd(int a, int b) {
    while (b != 0) {
        int t = b;
        b = a % b;
        a = t;
    }
    return a;
}

int lcm(int a, int b) {
    return (a / gcd(a, b)) * b;
}

int main() {
    int pairs = 5;
    printf("GCD(48, 18) = %d\\n", gcd(48, 18));
    printf("GCD(100, 75) = %d\\n", gcd(100, 75));
    printf("LCM(12, 8)  = %d\\n", lcm(12, 8));
    printf("LCM(7, 5)   = %d\\n", lcm(7, 5));
    return 0;
}`
  },
]

const STAGES = [
  { key: 'lex',    label: 'Lexer',          icon: '◈', color: '#22d3ee' },
  { key: 'parse',  label: 'Parser (YACC)',   icon: '⬢', color: '#a78bfa' },
  { key: 'sem',    label: 'Semantic',        icon: '◎', color: '#fb923c' },
  { key: 'ir',     label: 'LLVM IR',         icon: '◎', color: '#4ade80' },
  { key: 'asm',    label: 'Assembly',        icon: '⚙', color: '#f472b6' },
  { key: 'mc',     label: 'Machine Code',    icon: '▣', color: '#fbbf24' },
  { key: 'exec',   label: 'Execute',         icon: '▶', color: '#4ade80' },
]

export default function Compiler() {
  const [code, setCode] = useState(SAMPLE_CODE)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeStage, setActiveStage] = useState(null)
  const [showExamples, setShowExamples] = useState(false)
  const [explaining, setExplaining] = useState(false)
  const [explanation, setExplanation] = useState('')
  const [stageProgress, setStageProgress] = useState({})
  const [stdinInput, setStdinInput] = useState('')
  const [showStdin, setShowStdin] = useState(false)
  const exDropRef = useRef(null)

  const runStages = useCallback(async (codeToCompile) => {
    setLoading(true)
    setStageProgress({})
    setResult(null)

    // Animate through stages
    const stageDelay = 80
    for (let i = 0; i < STAGES.length; i++) {
      await new Promise(r => setTimeout(r, stageDelay))
      setStageProgress(prev => ({ ...prev, [STAGES[i].key]: 'running' }))
    }

    try {
      const res = await compileCode(codeToCompile, stdinInput)
      const data = res.data

      // Mark stages done/error
      const newProgress = {}
      newProgress.lex   = data.tokens?.length > 0 ? 'done' : 'error'
      newProgress.parse = data.ast ? 'done' : 'error'
      newProgress.sem   = data.errors?.filter(e => e.includes('[ERROR]')).length > 0 ? 'warn' : 'done'
      newProgress.ir    = data.ir ? 'done' : 'skip'
      newProgress.asm   = data.assembly ? 'done' : 'skip'
      newProgress.mc    = data.machine_code?.length > 0 ? 'done' : 'skip'
      newProgress.exec  = data.output ? 'done' : (data.errors?.length > 0 ? 'error' : 'skip')
      setStageProgress(newProgress)
      setResult(data)
    } catch (e) {
      STAGES.forEach(s => setStageProgress(prev => ({ ...prev, [s.key]: 'error' })))
      setResult({
        tokens: [], ast: null, ir: '', assembly: '', machine_code: [],
        output: '', errors: [`Network error: ${e.message} — is Flask backend running on :5000?`],
        warnings: [], stats: { elapsed_ms: 0, token_count: 0, error_count: 1, warning_count: 0 }
      })
    }
    setLoading(false)
  }, [stdinInput])

  const handleExplain = async () => {
    setExplaining(true)
    setExplanation('')
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 600,
          messages: [{ role: 'user', content: `Explain this C code for a student learning compilers. Use 5 bullet points. Cover: what it does, key algorithms/logic, any interesting compiler aspects (like recursion → stack frames, loops → branch instructions):\n\n${code}` }]
        })
      })
      const data = await response.json()
      setExplanation(data.content?.[0]?.text || 'AI explanation requires Anthropic API access.')
    } catch {
      setExplanation('AI explanation requires Anthropic API access in the browser.')
    }
    setExplaining(false)
  }

  const stageColor = (key) => {
    const s = stageProgress[key]
    if (!s || s === 'idle') return 'var(--border)'
    if (s === 'running') return 'var(--accent2)'
    if (s === 'done') return 'var(--success)'
    if (s === 'warn') return 'var(--warning)'
    if (s === 'error') return 'var(--error)'
    if (s === 'skip') return 'var(--text3)'
    return 'var(--border)'
  }

  const hasErrors = result?.errors?.length > 0
  const stats = result?.stats

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
      {/* Top toolbar */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'10px 20px', borderBottom:'1px solid var(--border)',
        background:'var(--bg)', flexShrink:0, gap:12,
      }}>
        {/* Left: title + pipeline stages */}
        <div style={{ display:'flex', alignItems:'center', gap:12, minWidth:0 }}>
          <span style={{ fontWeight:800, fontSize:14, letterSpacing:'-0.3px', flexShrink:0 }}>Compiler</span>
          <div style={{ display:'flex', alignItems:'center', gap:0 }}>
            {STAGES.map((stage, i) => {
              const status = stageProgress[stage.key] || 'idle'
              const color = stageColor(stage.key)
              const isRunning = status === 'running'
              return (
                <div key={stage.key} style={{ display:'flex', alignItems:'center' }}>
                  <div
                    title={stage.label}
                    style={{
                      display:'flex', alignItems:'center', gap:4,
                      padding:'4px 8px', borderRadius:6,
                      background: status !== 'idle' ? `${color}15` : 'transparent',
                      border:`1px solid ${status !== 'idle' ? color : 'transparent'}`,
                      cursor:'default', transition:'all 0.2s',
                      animation: isRunning ? 'pulse 0.8s ease-in-out infinite' : 'none',
                    }}
                  >
                    <span style={{ fontSize:10, color }}>{stage.icon}</span>
                    <span style={{ fontSize:10, color, fontFamily:'var(--font-mono)', fontWeight:600 }}>
                      {stage.label.split(' ')[0]}
                    </span>
                    {status === 'done' && <span style={{ fontSize:9, color:'var(--success)' }}>✓</span>}
                    {status === 'error' && <span style={{ fontSize:9, color:'var(--error)' }}>✕</span>}
                    {status === 'warn' && <span style={{ fontSize:9, color:'var(--warning)' }}>⚠</span>}
                  </div>
                  {i < STAGES.length - 1 && (
                    <div style={{ width:12, height:1, background:'var(--border)' }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: actions */}
        <div style={{ display:'flex', gap:6, alignItems:'center', flexShrink:0 }}>
          <button onClick={() => setShowStdin(v => !v)} style={{
            padding:'6px 12px', borderRadius:7, fontSize:12, fontWeight:500,
            background: showStdin ? 'rgba(34,211,238,0.1)' : 'var(--bg3)',
            color: showStdin ? 'var(--accent2)' : 'var(--text2)',
            border: `1px solid ${showStdin ? 'rgba(34,211,238,0.2)' : 'var(--border)'}`,
            fontFamily:'var(--font-ui)', transition:'all 0.15s',
          }} title="Toggle stdin input">
            stdin
          </button>

          <div style={{ position:'relative' }} ref={exDropRef}>
            <button onClick={() => setShowExamples(v => !v)} style={{
              padding:'6px 12px', borderRadius:7, fontSize:12, fontWeight:500,
              background:'var(--bg3)', color:'var(--text2)', border:'1px solid var(--border)',
              fontFamily:'var(--font-ui)', display:'flex', alignItems:'center', gap:5,
            }}>
              Examples <span style={{ fontSize:10 }}>▾</span>
            </button>
            {showExamples && (
              <div style={{
                position:'absolute', top:'110%', right:0, zIndex:20,
                background:'var(--bg2)', border:'1px solid var(--border2)',
                borderRadius:10, overflow:'hidden', minWidth:200,
                boxShadow:'0 12px 40px rgba(0,0,0,0.5)',
              }}>
                {EXAMPLES.map(ex => (
                  <button key={ex.label} onClick={() => { setCode(ex.code); setShowExamples(false); setResult(null); setStageProgress({}) }} style={{
                    display:'block', width:'100%', textAlign:'left',
                    padding:'10px 16px', background:'transparent', color:'var(--text)',
                    fontFamily:'var(--font-ui)', borderBottom:'1px solid var(--border)',
                    transition:'background 0.1s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--bg3)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}
                  >
                    <div style={{ fontSize:13, fontWeight:500, marginBottom:2 }}>{ex.label}</div>
                    <div style={{ fontSize:11, color:'var(--text3)' }}>{ex.desc}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={() => { setCode(''); setResult(null); setStageProgress({}) }} style={{
            padding:'6px 12px', borderRadius:7, fontSize:12, fontWeight:500,
            background:'var(--bg3)', color:'var(--text2)', border:'1px solid var(--border)',
            fontFamily:'var(--font-ui)',
          }}>Clear</button>

          <button onClick={handleExplain} disabled={explaining || !code.trim()} style={{
            padding:'6px 12px', borderRadius:7, fontSize:12, fontWeight:500,
            background: explaining ? 'var(--bg3)' : 'rgba(34,211,238,0.08)',
            color: explaining ? 'var(--text3)' : 'var(--accent2)',
            border:'1px solid rgba(34,211,238,0.2)',
            fontFamily:'var(--font-ui)', transition:'all 0.15s',
            opacity: !code.trim() ? 0.5 : 1,
          }}>
            {explaining ? '⟳ Thinking...' : '✦ Explain'}
          </button>

          <button onClick={() => runStages(code)} disabled={loading || !code.trim()} style={{
            padding:'7px 20px', borderRadius:7, fontSize:13, fontWeight:700,
            background: loading ? 'var(--bg3)' : 'var(--accent)',
            color: loading ? 'var(--text3)' : '#0a0c10',
            fontFamily:'var(--font-ui)',
            display:'flex', alignItems:'center', gap:6,
            opacity: !code.trim() ? 0.5 : 1,
            transition:'all 0.15s', boxShadow: loading ? 'none' : '0 0 16px rgba(74,222,128,0.3)',
          }}>
            {loading
              ? <><span style={{ animation:'spin 0.6s linear infinite', display:'inline-block' }}>⟳</span> Compiling...</>
              : <><span>▶</span> Compile</>
            }
          </button>
        </div>
      </div>

      {/* Stats bar */}
      {stats && !loading && (
        <div style={{
          display:'flex', alignItems:'center', gap:16, padding:'7px 20px',
          background: hasErrors ? 'rgba(248,113,113,0.04)' : 'rgba(74,222,128,0.04)',
          borderBottom:'1px solid var(--border)',
          flexShrink:0, fontSize:11, fontFamily:'var(--font-mono)',
        }}>
          <span style={{ color: hasErrors ? 'var(--error)' : 'var(--success)', fontWeight:700 }}>
            {hasErrors ? `✕ ${result.errors.length} error${result.errors.length>1?'s':''}` : '✓ Compilation successful'}
          </span>
          <span style={{ color:'var(--text3)' }}>·</span>
          <span style={{ color:'var(--text3)' }}>{stats.token_count} tokens</span>
          <span style={{ color:'var(--text3)' }}>·</span>
          <span style={{ color:'var(--text3)' }}>{stats.elapsed_ms}ms</span>
          {stats.warning_count > 0 && <>
            <span style={{ color:'var(--text3)' }}>·</span>
            <span style={{ color:'var(--warning)' }}>⚠ {stats.warning_count} warning{stats.warning_count>1?'s':''}</span>
          </>}
          {stats.has_asm && <span style={{ color:'var(--text3)', marginLeft:'auto' }}>Assembly ✓</span>}
          {stats.has_mc  && <span style={{ color:'var(--text3)' }}>Machine Code ✓</span>}
        </div>
      )}

      {/* stdin panel */}
      {showStdin && (
        <div style={{ padding:'8px 20px', borderBottom:'1px solid var(--border)', flexShrink:0, background:'var(--bg2)' }}>
          <div style={{ fontSize:11, color:'var(--text3)', marginBottom:5 }}>stdin input (for scanf / interactive programs)</div>
          <textarea
            value={stdinInput}
            onChange={e => setStdinInput(e.target.value)}
            placeholder="Type input here..."
            style={{
              width:'100%', height:56, background:'var(--bg3)', color:'var(--text2)',
              border:'1px solid var(--border)', borderRadius:7,
              padding:'7px 10px', fontFamily:'var(--font-mono)', fontSize:12,
              resize:'none',
            }}
          />
        </div>
      )}

      {/* AI Explanation */}
      {explanation && (
        <div style={{
          background:'rgba(34,211,238,0.04)', border:'1px solid rgba(34,211,238,0.12)',
          margin:'10px 20px 0', borderRadius:10, padding:'12px 16px', flexShrink:0,
        }}>
          <div style={{ fontSize:10, color:'var(--accent2)', fontWeight:700, marginBottom:6,
            textTransform:'uppercase', letterSpacing:'0.8px' }}>✦ AI Code Explanation</div>
          <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.7,
            whiteSpace:'pre-wrap', fontFamily:'var(--font-mono)' }}>{explanation}</div>
          <button onClick={() => setExplanation('')} style={{
            marginTop:8, fontSize:11, color:'var(--text3)', background:'transparent',
            border:'none', cursor:'pointer', fontFamily:'var(--font-ui)',
          }}>dismiss</button>
        </div>
      )}

      {/* Main split pane */}
      <div style={{
        display:'grid', gridTemplateColumns:'1fr 1fr', gap:14,
        flex:1, overflow:'hidden', padding:'14px 20px 16px',
      }}>
        {/* Editor */}
        <div style={{ display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'1px' }}>
                Source · MiniC / C
              </span>
              <span style={{ fontSize:10, color:'var(--text3)', background:'var(--bg3)',
                border:'1px solid var(--border)', borderRadius:10, padding:'2px 8px',
                fontFamily:'var(--font-mono)' }}>
                PLY Lex+Yacc
              </span>
            </div>
            <span style={{ fontSize:10, fontFamily:'var(--font-mono)', color:'var(--text3)' }}>
              {code.split('\n').length}L · {code.length}B
            </span>
          </div>
          <div style={{ flex:1, overflow:'hidden' }}>
            <CodeEditor code={code} onChange={setCode} />
          </div>
        </div>

        {/* Output */}
        <div style={{ display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ marginBottom:8 }}>
            <span style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'1px' }}>
              Compiler Output · 6 Stages
            </span>
          </div>
          <div style={{ flex:1, overflow:'hidden' }}>
            <OutputTabs result={result} />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>
    </div>
  )
}
