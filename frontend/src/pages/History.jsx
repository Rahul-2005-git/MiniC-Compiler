import { useState, useEffect } from 'react'
import { getHistory } from '../services/api'

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso+'Z').getTime()) / 1000
  if (diff < 60) return `${Math.floor(diff)}s ago`
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`
  return new Date(iso).toLocaleDateString()
}

export default function History() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const res = await getHistory()
      setHistory(res.data)
    } catch (e) {
      setError('Could not load history — is the backend running?')
    }
    setLoading(false)
  }

  useEffect(() => { fetchHistory() }, [])

  return (
    <div style={{ display:'flex', height:'100%', overflow:'hidden' }}>
      {/* List panel */}
      <div style={{ width:300, borderRight:'1px solid var(--border)',
        display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'14px 18px 12px', borderBottom:'1px solid var(--border)',
          display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontWeight:700, fontSize:13 }}>Compile History</span>
          <div style={{ display:'flex', gap:6 }}>
            <span style={{ fontSize:11, fontFamily:'var(--font-mono)',
              color:'var(--text3)', background:'var(--bg3)',
              border:'1px solid var(--border)', borderRadius:10, padding:'2px 8px' }}>
              {history.length}
            </span>
            <button onClick={fetchHistory} style={{
              fontSize:11, padding:'3px 9px', borderRadius:6,
              background:'var(--bg3)', color:'var(--text2)',
              border:'1px solid var(--border)', fontFamily:'var(--font-ui)',
            }}>↻</button>
          </div>
        </div>

        <div style={{ flex:1, overflow:'auto' }}>
          {loading && (
            <div style={{ padding:24, color:'var(--text3)', fontSize:12, textAlign:'center' }}>Loading...</div>
          )}
          {!loading && error && (
            <div style={{ padding:18, color:'var(--error)', fontSize:11,
              fontFamily:'var(--font-mono)', lineHeight:1.5 }}>{error}</div>
          )}
          {!loading && !error && history.length === 0 && (
            <div style={{ padding:24, color:'var(--text3)', textAlign:'center' }}>
              <div style={{ fontSize:28, marginBottom:8, opacity:0.3 }}>◎</div>
              <div style={{ fontSize:12 }}>No history yet</div>
              <div style={{ fontSize:11, marginTop:4, opacity:0.6 }}>Compile some code first</div>
            </div>
          )}
          {history.map(entry => {
            const s = entry.stats || {}
            const ok = s.error_count === 0
            return (
              <div key={entry.id} onClick={() => setSelected(entry)}
                style={{
                  padding:'12px 18px', borderBottom:'1px solid var(--border)',
                  cursor:'pointer',
                  background: selected?.id===entry.id ? 'var(--bg3)' : 'transparent',
                  borderLeft: selected?.id===entry.id ? '2px solid var(--accent)' : '2px solid transparent',
                  transition:'all 0.1s',
                }}
                onMouseEnter={e => { if (selected?.id!==entry.id) e.currentTarget.style.background='var(--bg2)' }}
                onMouseLeave={e => { if (selected?.id!==entry.id) e.currentTarget.style.background='transparent' }}
              >
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                  <span style={{
                    fontSize:9, fontFamily:'var(--font-mono)', borderRadius:10,
                    padding:'2px 7px',
                    background: ok ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
                    color: ok ? 'var(--success)' : 'var(--error)',
                    border: `1px solid ${ok ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}`,
                  }}>
                    {ok ? '✓ success' : `✕ ${s.error_count} errors`}
                  </span>
                  <span style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--font-mono)' }}>
                    #{entry.id}
                  </span>
                </div>
                <div style={{ fontSize:11, fontFamily:'var(--font-mono)',
                  color:'var(--text2)', marginBottom:3 }}>
                  {s.token_count} tokens · {s.elapsed_ms}ms
                </div>
                <div style={{ display:'flex', gap:5 }}>
                  {s.has_asm && <span style={{ fontSize:9, color:'var(--text3)',
                    background:'var(--bg3)', borderRadius:4, padding:'1px 5px' }}>ASM</span>}
                  {s.has_mc && <span style={{ fontSize:9, color:'var(--text3)',
                    background:'var(--bg3)', borderRadius:4, padding:'1px 5px' }}>MC</span>}
                </div>
                <div style={{ fontSize:10, color:'var(--text3)', marginTop:3 }}>
                  {timeAgo(entry.timestamp)}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Detail panel */}
      <div style={{ flex:1, overflow:'auto', padding:24 }}>
        {selected ? (
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <div>
                <h3 style={{ fontWeight:700, fontSize:15, marginBottom:3 }}>Run #{selected.id}</h3>
                <p style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--font-mono)' }}>
                  {new Date(selected.timestamp+'Z').toLocaleString()}
                </p>
              </div>
              {selected.stats && (
                <div style={{ display:'flex', gap:8 }}>
                  {[
                    { k:'Tokens', v: selected.stats.token_count },
                    { k:'Time', v: `${selected.stats.elapsed_ms}ms` },
                    { k:'Errors', v: selected.stats.error_count },
                  ].map(s => (
                    <div key={s.k} style={{ background:'var(--bg3)',
                      border:'1px solid var(--border)', borderRadius:8,
                      padding:'6px 12px', textAlign:'center' }}>
                      <div style={{ fontSize:15, fontWeight:700,
                        color: s.k==='Errors'&&s.v>0 ? 'var(--error)' : 'var(--text)',
                        fontFamily:'var(--font-mono)' }}>{s.v}</div>
                      <div style={{ fontSize:9, color:'var(--text3)',
                        textTransform:'uppercase', letterSpacing:'0.5px' }}>{s.k}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase',
              letterSpacing:'1px', marginBottom:8 }}>Source Code</div>
            <pre style={{
              background:'#1e1e2e', borderRadius:10, padding:'16px 18px',
              border:'1px solid var(--border)', fontFamily:'var(--font-mono)',
              fontSize:12.5, color:'#f8f8f2', lineHeight:1.75,
              overflowX:'auto', whiteSpace:'pre-wrap', maxHeight:600,
              overflow:'auto',
            }}>{selected.code}</pre>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
            justifyContent:'center', height:'100%', color:'var(--text3)', gap:10 }}>
            <div style={{ fontSize:40, opacity:0.2 }}>◎</div>
            <div style={{ fontSize:13 }}>Select a run to view details</div>
          </div>
        )}
      </div>
    </div>
  )
}
