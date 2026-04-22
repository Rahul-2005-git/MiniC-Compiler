import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

const STAGES = [
  { n:'01', name:'Lexer',        sub:'PLY lex',      color:'#22d3ee', icon:'◈',
    desc:'35+ token types — keywords, identifiers, operators — with line/column tracking' },
  { n:'02', name:'Parser',       sub:'PLY yacc SLR(1)', color:'#a78bfa', icon:'⬡',
    desc:'40+ grammar rules, full operator precedence, braceless if/while, recursive calls' },
  { n:'03', name:'Semantic',     sub:'Symbol Table', color:'#fb923c', icon:'◎',
    desc:'Multi-scope symbol tables, type checking, undeclared variable & unused var detection' },
  { n:'04', name:'LLVM IR',      sub:'GCC GIMPLE',   color:'#4ade80', icon:'≡',
    desc:'Intermediate representation with SSA form, allocas, branches, and function calls' },
  { n:'05', name:'Assembly',     sub:'GCC -S -O1',   color:'#f59e0b', icon:'⚙',
    desc:'Real x86-64 Intel syntax assembly — push/pop, mov, lea, call, ret' },
  { n:'06', name:'Machine Code', sub:'objdump',      color:'#fb7185', icon:'▣',
    desc:'Hex bytes per instruction with Intel mnemonics — per-function breakdown' },
  { n:'07', name:'Execute',      sub:'Native binary',color:'#4ade80', icon:'▶',
    desc:'Compiles and runs real binary — stdout captured, stdin supported, timed' },
]

const FEATURES = [
  { icon:'◈', label:'Syntax Highlighting', desc:'C keywords, types, operators — all color-coded in editor' },
  { icon:'⬡', label:'Interactive AST', desc:'Expand/collapse tree nodes, color-coded by node type' },
  { icon:'▣', label:'Machine Code View', desc:'Hex bytes + Intel mnemonics with per-function breakdown' },
  { icon:'◎', label:'AI Code Explain', desc:'Claude API explains your code in plain English instantly' },
  { icon:'⊞', label:'Compile History', desc:'Last 100 runs stored with stats, source, and timing data' },
  { icon:'⚙', label:'Configurable', desc:'Toggle assembly, machine code, and execution stages' },
]

const SAMPLES = [
  { label: 'Factorial', code: `int factorial(int n) {
  if (n <= 1) return 1;
  return n * factorial(n-1);
}` },
  { label: 'Prime Check', code: `int is_prime(int n) {
  int i = 2;
  while (i*i <= n) {
    if (n % i == 0) return 0;
    i = i + 1;
  }
  return 1;
}` },
  { label: 'GCD', code: `int gcd(int a, int b) {
  while (b != 0) {
    int t = b;
    b = a % b;
    a = t;
  }
  return a;
}` },
]

export default function Home() {
  const nav = useNavigate()
  const [activeSample, setActiveSample] = useState(0)
  const [visibleStage, setVisibleStage] = useState(-1)
  const [charIdx, setCharIdx] = useState(0)

  // Animate stages on load
  useEffect(() => {
    STAGES.forEach((_, i) => {
      setTimeout(() => setVisibleStage(i), 120 * i + 300)
    })
  }, [])

  // Typewriter effect on code sample
  const fullCode = SAMPLES[activeSample].code
  useEffect(() => {
    setCharIdx(0)
    const t = setInterval(() => {
      setCharIdx(c => {
        if (c >= fullCode.length) { clearInterval(t); return c }
        return c + 2
      })
    }, 18)
    return () => clearInterval(t)
  }, [activeSample, fullCode])

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg)' }}>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div style={{
        padding: '52px 52px 40px',
        position: 'relative', overflow: 'hidden',
        borderBottom: '1px solid var(--border)',
      }}>
        {/* Background grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          opacity: 0.3,
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent)',
        }} />

        {/* Glow orbs */}
        <div style={{
          position: 'absolute', top: -80, right: 80, width: 400, height: 400,
          background: 'radial-gradient(circle, var(--amber-dim) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -100, left: 100, width: 300, height: 300,
          background: 'radial-gradient(circle, var(--cyan-dim) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', maxWidth: 680 }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--amber-dim)', border: '1px solid var(--amber)44',
            borderRadius: 100, padding: '5px 14px', marginBottom: 24,
            animation: 'fadeIn 0.5s ease both',
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%', background: 'var(--amber)',
              animation: 'pulse 2s ease-in-out infinite', boxShadow: '0 0 6px var(--amber)',
            }} />
            <span style={{
              fontSize: 11, color: 'var(--amber2)', fontFamily: 'var(--font-mono)',
              fontWeight: 500, letterSpacing: '0.5px',
            }}>PLY LEX + YACC · GCC · REAL MACHINE CODE</span>
          </div>

          <h1 style={{
            fontSize: 56, fontWeight: 700, lineHeight: 1.05,
            letterSpacing: '-2px', marginBottom: 20,
            fontFamily: 'var(--font-ui)',
            animation: 'fadeIn 0.6s ease 0.1s both',
          }}>
            <span style={{ color: 'var(--text)' }}>MiniC</span>
            <br />
            <span style={{
              background: 'linear-gradient(90deg, var(--amber), var(--amber2), var(--cyan))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Compiler</span>
            <span style={{ color: 'var(--text3)', fontSize: 36, fontWeight: 400 }}> · LLVM</span>
          </h1>

          <p style={{
            fontSize: 15.5, color: 'var(--text2)', lineHeight: 1.75,
            maxWidth: 540, marginBottom: 32,
            animation: 'fadeIn 0.6s ease 0.2s both',
          }}>
            Source code → tokens → AST → LLVM IR → x86 assembly →
            machine code hex → live execution. A complete 7-stage
            compiler pipeline in your browser.
          </p>

          <div style={{ display: 'flex', gap: 10, animation: 'fadeIn 0.6s ease 0.3s both' }}>
            <button onClick={() => nav('/compiler')} style={{
              padding: '11px 28px', borderRadius: 10, fontSize: 14, fontWeight: 600,
              background: 'var(--amber)', color: '#0a0b0e',
              boxShadow: 'var(--glow-amber)',
              fontFamily: 'var(--font-ui)',
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              Open Compiler →
            </button>
            <button onClick={() => nav('/ast')} style={{
              padding: '11px 22px', borderRadius: 10, fontSize: 14, fontWeight: 500,
              background: 'transparent', color: 'var(--text2)',
              border: '1px solid var(--border2)',
              fontFamily: 'var(--font-ui)',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='var(--border3)'; e.currentTarget.style.color='var(--text)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border2)'; e.currentTarget.style.color='var(--text2)' }}
            >
              AST Viewer
            </button>
          </div>
        </div>
      </div>

      {/* ── TWO-COL: Pipeline + Code preview ─────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        borderBottom: '1px solid var(--border)',
      }}>
        {/* Pipeline stages */}
        <div style={{ padding: '36px 52px', borderRight: '1px solid var(--border)' }}>
          <div style={{
            fontSize: 10, color: 'var(--text3)', letterSpacing: '2px',
            textTransform: 'uppercase', fontFamily: 'var(--font-mono)',
            marginBottom: 20,
          }}>7-Stage Pipeline</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {STAGES.map((s, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', borderRadius: 10,
                background: visibleStage >= i ? 'var(--bg3)' : 'transparent',
                border: `1px solid ${visibleStage >= i ? 'var(--border)' : 'transparent'}`,
                opacity: visibleStage >= i ? 1 : 0,
                transform: visibleStage >= i ? 'none' : 'translateX(-12px)',
                transition: 'all 0.4s ease',
                cursor: 'default',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = s.color + '44'; e.currentTarget.style.background = s.color + '08' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg3)' }}
              >
                <span style={{
                  fontSize: 9, color: 'var(--text3)', fontFamily: 'var(--font-mono)',
                  minWidth: 18,
                }}>{s.n}</span>
                <div style={{
                  width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                  background: s.color + '15', border: `1px solid ${s.color}33`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, color: s.color,
                }}>{s.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{s.name}</span>
                    <span style={{
                      fontSize: 9, color: s.color, fontFamily: 'var(--font-mono)',
                      background: s.color + '15', borderRadius: 4, padding: '1px 6px',
                    }}>{s.sub}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1, lineHeight: 1.4 }}>
                    {s.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live code preview */}
        <div style={{ padding: '36px 40px', display: 'flex', flexDirection: 'column' }}>
          <div style={{
            fontSize: 10, color: 'var(--text3)', letterSpacing: '2px',
            textTransform: 'uppercase', fontFamily: 'var(--font-mono)',
            marginBottom: 20,
          }}>Code Preview</div>

          {/* Sample tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
            {SAMPLES.map((s, i) => (
              <button key={i} onClick={() => setActiveSample(i)} style={{
                padding: '5px 12px', borderRadius: 7, fontSize: 11,
                fontFamily: 'var(--font-mono)',
                background: activeSample === i ? 'var(--amber-dim)' : 'var(--bg3)',
                color: activeSample === i ? 'var(--amber2)' : 'var(--text3)',
                border: `1px solid ${activeSample === i ? 'var(--amber)44' : 'var(--border)'}`,
                transition: 'all 0.15s',
              }}>{s.label}</button>
            ))}
          </div>

          {/* Code block */}
          <div style={{
            flex: 1, background: '#0d1117', borderRadius: 12,
            border: '1px solid var(--border)',
            padding: '18px 20px', fontFamily: 'var(--font-mono)',
            fontSize: 13, lineHeight: '22px', overflow: 'hidden',
            position: 'relative',
            boxShadow: 'inset 0 0 40px rgba(0,0,0,0.3)',
          }}>
            {/* Window dots */}
            <div style={{ display: 'flex', gap: 5, marginBottom: 14 }}>
              {['#fb7185','#fbbf24','#4ade80'].map((c,i) => (
                <div key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: c, opacity: 0.7 }} />
              ))}
            </div>
            <pre style={{
              color: '#94a3b8', whiteSpace: 'pre-wrap', margin: 0,
              fontFamily: 'var(--font-mono)',
            }}>
              {fullCode.slice(0, charIdx)
                .split('\n')
                .map((line, li) => {
                  const hl = line
                    .replace(/(int|float|void|return|if|while|for)\b/g, '<kw>$1</kw>')
                    .replace(/(\d+)/g, '<num>$1</num>')
                    .replace(/(\/\/.*$)/g, '<cmt>$1</cmt>')
                  return <span key={li} dangerouslySetInnerHTML={{
                    __html: hl
                      .replace(/<kw>(.*?)<\/kw>/g, `<span style="color:#fb79c6;font-weight:600">$1</span>`)
                      .replace(/<num>(.*?)<\/num>/g, `<span style="color:#bd93f9">$1</span>`)
                      .replace(/<cmt>(.*?)<\/cmt>/g, `<span style="color:#6272a4;font-style:italic">$1</span>`)
                  }} />
                })
                .reduce((acc, el, i, arr) => [...acc, el, i < arr.length-1 ? '\n' : ''], [])}
              <span style={{
                display: 'inline-block', width: 2, height: '1em',
                background: 'var(--amber)', marginLeft: 1, verticalAlign: 'middle',
                animation: 'blink 1s step-start infinite',
              }} />
            </pre>
          </div>

          {/* Output hint */}
          <div style={{
            marginTop: 12, padding: '10px 16px', background: 'var(--bg3)',
            borderRadius: 8, border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 10, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>$</span>
            <span style={{ fontSize: 11, color: 'var(--text2)', fontFamily: 'var(--font-mono)' }}>
              ./program → 120  |  7 stages  |  ~142ms
            </span>
          </div>
        </div>
      </div>

      {/* ── FEATURES GRID ────────────────────────────────────────────────── */}
      <div style={{ padding: '36px 52px', borderBottom: '1px solid var(--border)' }}>
        <div style={{
          fontSize: 10, color: 'var(--text3)', letterSpacing: '2px',
          textTransform: 'uppercase', fontFamily: 'var(--font-mono)',
          marginBottom: 20,
        }}>Features</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{
              padding: '18px 20px', borderRadius: 12,
              background: 'var(--bg2)', border: '1px solid var(--border)',
              transition: 'all 0.2s',
              cursor: 'default',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = 'var(--bg3)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = 'var(--bg2)' }}
            >
              <div style={{ fontSize: 20, marginBottom: 10, color: 'var(--amber)' }}>{f.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 5, color: 'var(--text)' }}>{f.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── LANGUAGE FEATURES ────────────────────────────────────────────── */}
      <div style={{ padding: '32px 52px 40px' }}>
        <div style={{
          fontSize: 10, color: 'var(--text3)', letterSpacing: '2px',
          textTransform: 'uppercase', fontFamily: 'var(--font-mono)',
          marginBottom: 16,
        }}>Supported Language</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {[
            'int / float / char / void','Arithmetic + − × ÷ %','Bitwise & | ^ ~ << >>',
            'if / else if / else','while / for / do-while','break / continue','return',
            'printf / scanf','Recursive functions','Multi-param functions',
            'Nested scopes','++ / -- operators','+= -= *= /=','Ternary ? :',
            'Comparisons == != < > <= >=','Logical && ||',
          ].map(f => (
            <span key={f} style={{
              fontSize: 11.5, fontFamily: 'var(--font-mono)',
              background: 'var(--bg3)', color: 'var(--text2)',
              border: '1px solid var(--border)', borderRadius: 6,
              padding: '4px 11px', transition: 'all 0.15s',
              cursor: 'default',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--amber)44'; e.currentTarget.style.color = 'var(--amber2)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text2)' }}
            >✓ {f}</span>
          ))}
        </div>
      </div>

    </div>
  )
}
