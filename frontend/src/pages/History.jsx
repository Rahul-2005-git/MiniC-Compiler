import { useState, useEffect } from 'react'
import { getHistory } from '../services/api'

function timeAgo(iso) {
  const d = (Date.now() - new Date(iso+'Z').getTime()) / 1000
  if (d < 60) return `${Math.floor(d)}s ago`
  if (d < 3600) return `${Math.floor(d/60)}m ago`
  if (d < 86400) return `${Math.floor(d/3600)}h ago`
  return new Date(iso).toLocaleDateString()
}

export default function History() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')

  const fetch_ = async () => {
    setLoading(true)
    try {
      const res = await getHistory()
      setHistory(res.data)
    } catch (e) { setError('Backend unreachable') }
    setLoading(false)
  }

  useEffect(() => { fetch_() }, [])

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* List */}
      <div style={{
        width: 290, borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', background: 'var(--bg2)',
      }}>
        <div style={{
          padding: '14px 18px 12px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, color: 'var(--amber)' }}>⊞</span>
            <span style={{ fontWeight: 700, fontSize: 14, fontFamily: 'var(--font-ui)' }}>History</span>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{
              fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text3)',
              background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '2px 8px',
            }}>{history.length}</span>
            <button onClick={fetch_} style={{
              padding: '4px 9px', borderRadius: 6, fontSize: 12,
              background: 'var(--bg3)', color: 'var(--text3)',
              border: '1px solid var(--border)',
            }}>↻</button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          {loading && (
            <div style={{ padding: 24, color: 'var(--text3)', fontSize: 12,
              textAlign: 'center', fontFamily: 'var(--font-mono)' }}>Loading...</div>
          )}
          {!loading && error && (
            <div style={{ padding: 18, color: 'var(--error)', fontSize: 11,
              fontFamily: 'var(--font-mono)' }}>{error}</div>
          )}
          {!loading && !error && history.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text3)' }}>
              <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.2 }}>⊞</div>
              <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>No history yet</div>
              <div style={{ fontSize: 11, marginTop: 4, opacity: 0.6 }}>Compile some code first</div>
            </div>
          )}
          {history.map(entry => {
            const s = entry.stats || {}
            const ok = s.error_count === 0
            const isActive = selected?.id === entry.id
            return (
              <div key={entry.id} onClick={() => setSelected(entry)} style={{
                padding: '12px 18px', borderBottom: '1px solid var(--border)',
                cursor: 'pointer', transition: 'all 0.1s',
                background: isActive ? 'var(--bg3)' : 'transparent',
                borderLeft: `2px solid ${isActive ? 'var(--amber)' : 'transparent'}`,
              }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg3)44' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{
                    fontSize: 9, fontFamily: 'var(--font-mono)', borderRadius: 10, padding: '2px 7px',
                    background: ok ? 'var(--green-dim)' : 'rgba(251,113,133,0.1)',
                    color: ok ? 'var(--green)' : 'var(--error)',
                    border: `1px solid ${ok ? 'var(--green)22' : 'var(--error)22'}`,
                  }}>{ok ? '✓ OK' : `✕ ${s.error_count} err`}</span>
                  <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                    #{entry.id}
                  </span>
                </div>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text2)', marginBottom: 4 }}>
                  {s.token_count} tokens
                  {s.elapsed_ms ? ` · ${s.elapsed_ms}ms` : ''}
                </div>
                <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                  {s.has_asm && <span style={{ fontSize: 9, color: 'var(--text3)', background: 'var(--bg4)', borderRadius: 4, padding: '1px 5px', fontFamily: 'var(--font-mono)' }}>asm</span>}
                  {s.has_mc  && <span style={{ fontSize: 9, color: 'var(--text3)', background: 'var(--bg4)', borderRadius: 4, padding: '1px 5px', fontFamily: 'var(--font-mono)' }}>mc</span>}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                  {timeAgo(entry.timestamp)}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Detail */}
      <div style={{ flex: 1, overflow: 'auto', padding: 28 }}>
        {selected ? (
          <div style={{ animation: 'fadeIn 0.2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h3 style={{
                  fontWeight: 700, fontSize: 18, marginBottom: 4,
                  fontFamily: 'var(--font-ui)',
                  background: 'linear-gradient(90deg, var(--text), var(--amber2))',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  display: 'inline-block',
                }}>Run #{selected.id}</h3>
                <p style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                  {new Date(selected.timestamp+'Z').toLocaleString()}
                </p>
              </div>

              {selected.stats && (
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { k: 'Tokens', v: selected.stats.token_count, c: 'var(--cyan)' },
                    { k: 'Time',   v: `${selected.stats.elapsed_ms}ms`, c: 'var(--amber)' },
                    { k: 'Errors', v: selected.stats.error_count,
                      c: selected.stats.error_count > 0 ? 'var(--error)' : 'var(--green)' },
                  ].map(s => (
                    <div key={s.k} style={{
                      background: 'var(--bg2)', border: '1px solid var(--border)',
                      borderRadius: 10, padding: '8px 14px', textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 17, fontWeight: 700, color: s.c, fontFamily: 'var(--font-mono)' }}>{s.v}</div>
                      <div style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'var(--font-mono)' }}>{s.k}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{
              fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase',
              letterSpacing: '1.5px', marginBottom: 8, fontFamily: 'var(--font-mono)',
            }}>Source Code</div>
            <pre style={{
              background: '#0d1117', borderRadius: 12, padding: '18px 20px',
              border: '1px solid var(--border)', fontFamily: 'var(--font-mono)',
              fontSize: 12.5, color: '#94a3b8', lineHeight: 1.8,
              overflowX: 'auto', whiteSpace: 'pre-wrap', maxHeight: 500, overflow: 'auto',
            }}>{selected.code}</pre>
          </div>
        ) : (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '100%', color: 'var(--text3)', gap: 12,
          }}>
            <div style={{ fontSize: 48, opacity: 0.15 }}>⊞</div>
            <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)' }}>Select a run to view details</div>
          </div>
        )}
      </div>
    </div>
  )
}
