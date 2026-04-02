import { useState } from 'react'

const TYPE_COLORS = {
  Program: '#4ade80',
  FunctionDecl: '#22d3ee',
  Block: '#8b5cf6',
  VarDecl: '#f472b6',
  IfStmt: '#fbbf24',
  WhileStmt: '#fb923c',
  ReturnStmt: '#34d399',
  PrintfStmt: '#60a5fa',
  BinOp: '#a78bfa',
  Assign: '#f87171',
  Identifier: '#94a3b8',
  IntLiteral: '#86efac',
  FloatLiteral: '#86efac',
  StringLiteral: '#fde68a',
  FuncCall: '#22d3ee',
  ExprStmt: '#64748b',
  Param: '#c084fc',
  UnaryOp: '#a78bfa',
}

function ASTNode({ node, depth = 0, isLast = true }) {
  const [collapsed, setCollapsed] = useState(depth > 3)
  if (!node || typeof node !== 'object') return null

  const hasChildren = node.children && node.children.filter(Boolean).length > 0
  const color = TYPE_COLORS[node.type] || '#94a3b8'
  const label = node.label || node.type
  const indent = depth * 20

  return (
    <div style={{ paddingLeft: depth === 0 ? 0 : 20, position: 'relative' }}>
      {depth > 0 && (
        <div style={{
          position: 'absolute', left: 0, top: 0,
          width: 20, height: 16,
          borderLeft: `1px dashed #2a2f3e`,
          borderBottom: `1px dashed #2a2f3e`,
          pointerEvents: 'none',
        }} />
      )}
      <div
        onClick={() => hasChildren && setCollapsed(c => !c)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '3px 8px 3px 6px',
          borderRadius: 6,
          cursor: hasChildren ? 'pointer' : 'default',
          userSelect: 'none',
          marginBottom: 3,
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${color}22`,
          transition: 'background 0.1s',
          maxWidth: '100%',
        }}
        onMouseEnter={e => e.currentTarget.style.background = `${color}11`}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
      >
        {hasChildren && (
          <span style={{ color: 'var(--text3)', fontSize: 10, width: 12 }}>
            {collapsed ? '▶' : '▼'}
          </span>
        )}
        <span style={{
          fontSize: 10, fontFamily: 'var(--font-mono)',
          background: `${color}22`, color,
          borderRadius: 4, padding: '1px 5px',
          fontWeight: 600,
        }}>
          {node.type}
        </span>
        <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text2)' }}>
          {label !== node.type ? label : ''}
        </span>
      </div>

      {hasChildren && !collapsed && (
        <div style={{ borderLeft: '1px dashed #2a2f3e', marginLeft: 12, paddingLeft: 0 }}>
          {node.children.filter(Boolean).map((child, i) => (
            <ASTNode
              key={i}
              node={child}
              depth={depth + 1}
              isLast={i === node.children.filter(Boolean).length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function ASTViewer({ ast }) {
  if (!ast) return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: 200, gap: 10, color: 'var(--text3)',
    }}>
      <div style={{ fontSize: 32 }}>⬢</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>No AST — compile some code first</div>
    </div>
  )

  return (
    <div style={{
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      padding: '12px 8px',
      overflow: 'auto',
      height: '100%',
    }}>
      <div style={{
        display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14,
        paddingBottom: 10, borderBottom: '1px solid var(--border)',
      }}>
        {Object.entries(TYPE_COLORS).slice(0, 8).map(([k, v]) => (
          <span key={k} style={{
            fontSize: 10, background: `${v}22`, color: v,
            borderRadius: 4, padding: '2px 7px', fontFamily: 'var(--font-mono)',
          }}>{k}</span>
        ))}
      </div>
      <ASTNode node={ast} depth={0} />
    </div>
  )
}
