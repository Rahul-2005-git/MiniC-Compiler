import { NavLink, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'

const NAV = [
  { to: '/',         label: 'Home',       icon: '⌂',  exact: true },
  { to: '/compiler', label: 'Compiler',   icon: '◈' },
  { to: '/ast',      label: 'AST Viewer', icon: '⬡' },
  { to: '/history',  label: 'History',    icon: '⊞' },
  { to: '/settings', label: 'Settings',   icon: '⚙' },
]

const PIPELINE_DOTS = [
  { label: 'Lexer',        color: '#22d3ee', tool: 'PLY lex' },
  { label: 'Parser',       color: '#a78bfa', tool: 'PLY yacc' },
  { label: 'Semantic',     color: '#fb923c', tool: 'Symbol Table' },
  { label: 'LLVM IR',      color: '#4ade80', tool: 'GCC GIMPLE' },
  { label: 'Assembly',     color: '#f59e0b', tool: 'GCC -S' },
  { label: 'Machine Code', color: '#fb7185', tool: 'objdump' },
  { label: 'Execute',      color: '#4ade80', tool: 'Binary' },
]

export default function Sidebar() {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick(v => (v + 1) % 7), 1400)
    return () => clearInterval(t)
  }, [])

  return (
    <aside style={{
      width: 'var(--sidebar-w)', height: '100vh',
      background: 'var(--bg2)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      flexShrink: 0, position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative vertical line */}
      <div style={{
        position: 'absolute', top: 0, right: 0, width: 1, height: '100%',
        background: 'linear-gradient(180deg, transparent, var(--amber)44, var(--cyan)44, transparent)',
        pointerEvents: 'none',
      }} />

      {/* Logo */}
      <div style={{
        padding: '22px 20px 18px',
        borderBottom: '1px solid var(--border)',
        position: 'relative',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--amber), #f97316)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 700, color: '#0a0b0e',
            boxShadow: 'var(--glow-amber)', flexShrink: 0,
            fontFamily: 'var(--font-mono)',
          }}>C</div>
          <div>
            <div style={{
              fontWeight: 700, fontSize: 15, letterSpacing: '-0.3px',
              fontFamily: 'var(--font-ui)',
              background: 'linear-gradient(90deg, var(--text), var(--amber2))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>MiniC</div>
            <div style={{
              fontSize: 9, color: 'var(--text3)', letterSpacing: '1.5px',
              textTransform: 'uppercase', fontFamily: 'var(--font-mono)',
            }}>LLVM Compiler</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: '14px 10px 0', flex: 1 }}>
        <div style={{
          fontSize: 9, color: 'var(--text3)', letterSpacing: '1.5px',
          textTransform: 'uppercase', padding: '0 10px 10px',
          fontFamily: 'var(--font-mono)',
        }}>Navigation</div>

        {NAV.map((item, i) => (
          <NavLink key={item.to} to={item.to} end={item.exact}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 8, marginBottom: 2,
              textDecoration: 'none', fontWeight: isActive ? 600 : 400,
              fontSize: 13.5,
              color: isActive ? 'var(--amber2)' : 'var(--text2)',
              background: isActive
                ? 'linear-gradient(90deg, var(--amber-dim), transparent)'
                : 'transparent',
              borderLeft: isActive ? '2px solid var(--amber)' : '2px solid transparent',
              animation: isActive ? 'none' : 'none',
            })}
          >
            <span style={{ fontSize: 15, width: 18, textAlign: 'center', lineHeight: 1 }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        {/* Pipeline tracker */}
        <div style={{
          marginTop: 24, padding: '14px 12px',
          background: 'var(--bg3)', borderRadius: 10,
          border: '1px solid var(--border)',
          marginLeft: 10, marginRight: 10,
        }}>
          <div style={{
            fontSize: 9, color: 'var(--text3)', letterSpacing: '1.5px',
            textTransform: 'uppercase', fontFamily: 'var(--font-mono)',
            marginBottom: 12,
          }}>Pipeline</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {PIPELINE_DOTS.map((p, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                opacity: tick === i ? 1 : 0.4,
                transition: 'opacity 0.5s',
              }}>
                <div style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: p.color, flexShrink: 0,
                  boxShadow: tick === i ? `0 0 8px ${p.color}` : 'none',
                  transition: 'box-shadow 0.5s',
                }} />
                <span style={{
                  fontSize: 10.5, color: tick === i ? 'var(--text)' : 'var(--text3)',
                  fontFamily: 'var(--font-mono)',
                  transition: 'color 0.5s',
                }}>{p.label}</span>
                <span style={{
                  fontSize: 9, color: tick === i ? p.color : 'var(--text4)',
                  fontFamily: 'var(--font-mono)', marginLeft: 'auto',
                  transition: 'color 0.5s',
                }}>{p.tool}</span>
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* Footer status */}
      <div style={{
        padding: '12px 18px 14px',
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--green)',
            boxShadow: 'var(--glow-green)',
            animation: 'pulse 2s ease-in-out infinite',
          }} />
          <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
            Flask · :5000
          </span>
        </div>
      </div>
    </aside>
  )
}
