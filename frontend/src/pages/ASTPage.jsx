import { useState } from 'react'
import CodeEditor from '../components/CodeEditor'
import ASTViewer from '../components/ASTViewer'
import { compileCode } from '../services/api'

const DEMO = `int main() {
  int x;
  x = 10;
  if (x > 5) {
    printf("big\\n");
  } else {
    printf("small\\n");
  }
  return 0;
}`

export default function ASTPage() {
  const [code, setCode] = useState(DEMO)
  const [ast, setAst] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState([])

  const handleParse = async () => {
    setLoading(true)
    try {
      const res = await compileCode(code)
      setAst(res.data.ast)
      setErrors(res.data.errors || [])
    } catch (e) {
      setErrors([`Error: ${e.message}`])
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', padding: '16px 24px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontWeight: 700, fontSize: 16, marginBottom: 3 }}>AST Viewer</h2>
          <p style={{ fontSize: 12, color: 'var(--text3)' }}>Parse code and explore the Abstract Syntax Tree interactively</p>
        </div>
        <button onClick={handleParse} disabled={loading} style={{
          padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700,
          background: 'var(--accent2)', color: '#0d0f14',
          fontFamily: 'var(--font-ui)', transition: 'opacity 0.15s',
        }}>
          {loading ? '⟳ Parsing...' : '⬢ Parse & View AST'}
        </button>
      </div>

      {errors.length > 0 && (
        <div style={{
          background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
          borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12,
          color: '#fca5a5', fontFamily: 'var(--font-mono)',
        }}>
          {errors.join('\n')}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, flex: 1, overflow: 'hidden' }}>
        <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>Source</div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <CodeEditor code={code} onChange={setCode} />
          </div>
        </div>
        <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>
            AST — click nodes to expand/collapse
          </div>
          <div style={{
            flex: 1, background: 'var(--bg2)', borderRadius: 'var(--radius)',
            border: '1px solid var(--border)', overflow: 'auto',
          }}>
            <ASTViewer ast={ast} />
          </div>
        </div>
      </div>
    </div>
  )
}
