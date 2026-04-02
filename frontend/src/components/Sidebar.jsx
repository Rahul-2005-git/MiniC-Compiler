import { NavLink } from 'react-router-dom'

const NAV = [
  { to:'/', label:'Home',       icon:'⬡', exact:true },
  { to:'/compiler', label:'Compiler',  icon:'◈' },
  { to:'/ast',      label:'AST Viewer',icon:'⬢' },
  { to:'/history',  label:'History',   icon:'◎' },
  { to:'/settings', label:'Settings',  icon:'◇' },
]

const STAGES = [
  { label:'Lexer (PLY lex)',  color:'#22d3ee' },
  { label:'Parser (PLY yacc)',color:'#a78bfa' },
  { label:'Semantic',        color:'#fb923c' },
  { label:'LLVM IR',         color:'#4ade80' },
  { label:'Assembly',        color:'#f472b6' },
  { label:'Machine Code',    color:'#fbbf24' },
  { label:'Execute',         color:'#4ade80' },
]

export default function Sidebar() {
  return (
    <aside style={{
      width:'var(--sidebar-w)', minHeight:'100vh',
      background:'var(--bg2)', borderRight:'1px solid var(--border)',
      display:'flex', flexDirection:'column', flexShrink:0,
    }}>
      {/* Logo */}
      <div style={{ padding:'20px 18px 16px', borderBottom:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{
            width:34, height:34,
            background:'linear-gradient(135deg,#4ade80,#22d3ee)',
            borderRadius:9, display:'flex', alignItems:'center',
            justifyContent:'center', fontSize:17, fontWeight:800,
            color:'#0a0c10', flexShrink:0, boxShadow:'0 0 14px rgba(74,222,128,0.3)',
          }}>C</div>
          <div>
            <div style={{ fontWeight:800, fontSize:14, letterSpacing:'-0.3px' }}>MiniC</div>
            <div style={{ fontSize:9, color:'var(--text3)', letterSpacing:'1px',
              textTransform:'uppercase', fontFamily:'var(--font-mono)' }}>LLVM Compiler</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding:'10px 10px', flex:1 }}>
        <div style={{ fontSize:9, color:'var(--text3)', letterSpacing:'1.2px',
          textTransform:'uppercase', padding:'4px 10px 8px', fontFamily:'var(--font-mono)' }}>
          Navigation
        </div>
        {NAV.map(item => (
          <NavLink key={item.to} to={item.to} end={item.exact}
            style={({ isActive }) => ({
              display:'flex', alignItems:'center', gap:9,
              padding:'9px 12px', borderRadius:8, marginBottom:1,
              textDecoration:'none', fontWeight: isActive ? 600 : 400,
              fontSize:13, color: isActive ? 'var(--accent)' : 'var(--text2)',
              background: isActive ? 'rgba(74,222,128,0.08)' : 'transparent',
              borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
              transition:'all 0.15s',
            })}
          >
            <span style={{ fontSize:15, lineHeight:1, width:18, textAlign:'center' }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        {/* Pipeline legend */}
        <div style={{ marginTop:20, padding:'0 4px' }}>
          <div style={{ fontSize:9, color:'var(--text3)', letterSpacing:'1.2px',
            textTransform:'uppercase', padding:'4px 8px 10px', fontFamily:'var(--font-mono)' }}>
            Pipeline
          </div>
          {STAGES.map((s,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8,
              padding:'5px 8px', borderRadius:6, marginBottom:1 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:s.color,
                flexShrink:0, boxShadow:`0 0 4px ${s.color}` }} />
              <span style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--font-mono)' }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6,
          fontSize:10, color:'var(--text3)', fontFamily:'var(--font-mono)' }}>
          <div style={{ width:5, height:5, borderRadius:'50%', background:'var(--accent)',
            boxShadow:'0 0 5px var(--accent)' }} />
          Flask · :5000
        </div>
        <div style={{ fontSize:9, color:'var(--text3)', fontFamily:'var(--font-mono)',
          marginTop:3, opacity:0.5 }}>PLY + GCC + objdump</div>
      </div>
    </aside>
  )
}
