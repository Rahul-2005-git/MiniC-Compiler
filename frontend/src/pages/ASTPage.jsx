import { useState } from 'react'
import CodeEditor from '../components/CodeEditor'
import ASTViewer from '../components/ASTViewer'
import { compileCode } from '../services/api'

const DEMO = `int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n-1) + fibonacci(n-2);
}

int main() {
    int i = 0;
    while (i <= 7) {
        printf("fib(%d) = %d\\n", i, fibonacci(i));
        i = i + 1;
    }
    return 0;
}`

export default function ASTPage() {
  const [code, setCode] = useState(DEMO)
  const [ast, setAst] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState([])
  const [stats, setStats] = useState(null)

  const handleParse = async () => {
    setLoading(true)
    setErrors([])
    try {
      const res = await compileCode(code)
      setAst(res.data.ast)
      setErrors(res.data.errors || [])
      setStats(res.data.stats)
    } catch (e) {
      setErrors([`Network error: ${e.message}`])
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 22px', borderBottom: '1px solid var(--border)',
        flexShrink: 0, background: 'var(--bg2)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: 'var(--cyan-dim)', border: '1px solid var(--cyan)33',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, color: 'var(--cyan)',
            }}>⬡</div>
            <span style={{ fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-ui)' }}>AST Viewer</span>
            {stats && (
              <span style={{
                fontSize: 10, color: 'var(--cyan)', fontFamily: 'var(--font-mono)',
                background: 'var(--cyan-dim)', border: '1px solid var(--cyan)22',
                borderRadius: 10, padding: '2px 9px',
              }}>{stats.token_count} tokens · {stats.elapsed_ms}ms</span>
            )}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginTop: 2, marginLeft: 38 }}>
            Click nodes to expand/collapse · Color-coded by type
          </div>
        </div>

        <button onClick={handleParse} disabled={loading} style={{
          padding: '8px 22px', borderRadius: 9, fontSize: 13, fontWeight: 700,
          background: loading ? 'var(--bg3)' : 'linear-gradient(90deg, var(--cyan), #06b6d4)',
          color: loading ? 'var(--text3)' : '#0a0b0e',
          fontFamily: 'var(--font-ui)',
          boxShadow: loading ? 'none' : 'var(--glow-cyan)',
          display: 'flex', alignItems: 'center', gap: 7,
        }}>
          {loading
            ? <><span style={{ animation: 'spin 0.6s linear infinite', display: 'inline-block' }}>⟳</span> Parsing...</>
            : <><span>⬡</span> Parse & View AST</>
          }
        </button>
      </div>

      {/* Error bar */}
      {errors.length > 0 && (
        <div style={{
          padding: '8px 22px', background: 'rgba(251,113,133,0.06)',
          borderBottom: '1px solid rgba(251,113,133,0.15)',
          fontSize: 12, color: '#fca5a5', fontFamily: 'var(--font-mono)',
          flexShrink: 0,
        }}>
          ✕ {errors.join('  ·  ').slice(0, 200)}
        </div>
      )}

      {/* Split pane */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', flex: 1, overflow: 'hidden' }}>
        {/* Editor */}
        <div style={{
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          borderRight: '1px solid var(--border)',
          padding: '14px 16px',
        }}>
          <div style={{
            fontSize: 9, color: 'var(--text3)', letterSpacing: '1.5px',
            textTransform: 'uppercase', fontFamily: 'var(--font-mono)',
            marginBottom: 8,
          }}>Source · MiniC</div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <CodeEditor code={code} onChange={setCode} />
          </div>
        </div>

        {/* AST */}
        <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <ASTViewer ast={ast} />
        </div>
      </div>
    </div>
  )
}
