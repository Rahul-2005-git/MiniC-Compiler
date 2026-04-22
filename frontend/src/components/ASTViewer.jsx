import { useState, useCallback } from 'react'

const NODE_STYLES = {
  Program:      { color: '#f59e0b', bg: '#f59e0b15', shape: '⬡' },
  FunctionDecl: { color: '#22d3ee', bg: '#22d3ee15', shape: 'ƒ' },
  Block:        { color: '#a78bfa', bg: '#a78bfa15', shape: '{}' },
  VarDecl:      { color: '#fb7185', bg: '#fb718515', shape: 'var' },
  IfStmt:       { color: '#fbbf24', bg: '#fbbf2415', shape: 'if' },
  WhileStmt:    { color: '#fb923c', bg: '#fb923c15', shape: '↺' },
  ForStmt:      { color: '#fb923c', bg: '#fb923c15', shape: 'for' },
  DoWhileStmt:  { color: '#fb923c', bg: '#fb923c15', shape: 'do' },
  ReturnStmt:   { color: '#4ade80', bg: '#4ade8015', shape: '←' },
  PrintfStmt:   { color: '#60a5fa', bg: '#60a5fa15', shape: 'pr' },
  ScanfStmt:    { color: '#60a5fa', bg: '#60a5fa15', shape: 'sc' },
  BinOp:        { color: '#c084fc', bg: '#c084fc15', shape: '⊕' },
  UnaryOp:      { color: '#c084fc', bg: '#c084fc15', shape: '!' },
  PostfixOp:    { color: '#c084fc', bg: '#c084fc15', shape: '++' },
  Assign:       { color: '#4ade80', bg: '#4ade8015', shape: '=' },
  Identifier:   { color: '#94a3b8', bg: '#94a3b810', shape: 'id' },
  IntLiteral:   { color: '#86efac', bg: '#86efac12', shape: '42' },
  FloatLiteral: { color: '#86efac', bg: '#86efac12', shape: '3.14' },
  StringLiteral:{ color: '#fde68a', bg: '#fde68a12', shape: '"' },
  CharLiteral:  { color: '#fde68a', bg: '#fde68a12', shape: "'" },
  FuncCall:     { color: '#22d3ee', bg: '#22d3ee12', shape: '()' },
  ExprStmt:     { color: '#475569', bg: '#47556912', shape: ';' },
  Param:        { color: '#c084fc', bg: '#c084fc12', shape: 'p' },
  Ternary:      { color: '#e879f9', bg: '#e879f912', shape: '?' },
  ArrayAccess:  { color: '#f59e0b', bg: '#f59e0b12', shape: '[]' },
  BreakStmt:    { color: '#fb7185', bg: '#fb718512', shape: 'brk' },
  ContinueStmt: { color: '#fb7185', bg: '#fb718512', shape: 'cnt' },
}

const getStyle = (type) => NODE_STYLES[type] || { color: '#64748b', bg: '#64748b12', shape: '?' }

function ASTNode({ node, depth = 0, isLast = true, isRoot = false }) {
  const [collapsed, setCollapsed] = useState(depth > 2)
  if (!node || typeof node !== 'object') return null

  const children = (node.children || []).filter(Boolean)
  const hasChildren = children.length > 0
  const s = getStyle(node.type)
  const label = node.label && node.label !== node.type ? node.label : null

  return (
    <div style={{
      paddingLeft: depth === 0 ? 0 : 20,
      position: 'relative',
    }}>
      {/* Connector lines */}
      {depth > 0 && (
        <>
          <div style={{
            position: 'absolute', left: 0, top: 14,
            width: 16, height: 1,
            background: `linear-gradient(90deg, ${s.color}44, transparent)`,
          }} />
          <div style={{
            position: 'absolute', left: 0, top: isRoot ? 14 : 0,
            width: 1, height: isLast ? 14 : '100%',
            background: `${s.color}22`,
          }} />
        </>
      )}

      {/* Node itself */}
      <div
        onClick={() => hasChildren && setCollapsed(c => !c)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          marginBottom: 4, cursor: hasChildren ? 'pointer' : 'default',
          userSelect: 'none',
          padding: '3px 8px 3px 4px',
          borderRadius: 7, border: `1px solid ${s.color}30`,
          background: s.bg,
          transition: 'all 0.15s',
          maxWidth: '100%',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = s.color + '60'
          e.currentTarget.style.background = s.color + '20'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = s.color + '30'
          e.currentTarget.style.background = s.bg
        }}
      >
        {/* Collapse toggle */}
        {hasChildren && (
          <span style={{
            width: 14, height: 14, borderRadius: 3,
            background: s.color + '20', border: `1px solid ${s.color}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 8, color: s.color, flexShrink: 0,
            transition: 'transform 0.2s',
            transform: collapsed ? 'none' : 'rotate(90deg)',
          }}>▶</span>
        )}
        {!hasChildren && <div style={{ width: 14 }} />}

        {/* Type badge */}
        <span style={{
          fontSize: 9, fontFamily: 'var(--font-mono)',
          background: s.color + '25', color: s.color,
          borderRadius: 4, padding: '1px 5px', fontWeight: 700,
          letterSpacing: '0.3px', flexShrink: 0,
        }}>{s.shape}</span>

        {/* Type name */}
        <span style={{
          fontSize: 11.5, fontFamily: 'var(--font-mono)',
          color: s.color, fontWeight: 600, flexShrink: 0,
        }}>{node.type}</span>

        {/* Label */}
        {label && (
          <span style={{
            fontSize: 11, fontFamily: 'var(--font-mono)',
            color: 'var(--text2)', maxWidth: 180,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>· {label}</span>
        )}

        {/* Child count badge */}
        {hasChildren && collapsed && (
          <span style={{
            fontSize: 9, background: s.color + '20', color: s.color,
            borderRadius: 10, padding: '1px 5px', fontFamily: 'var(--font-mono)',
            flexShrink: 0,
          }}>{children.length}</span>
        )}
      </div>

      {/* Children */}
      {hasChildren && !collapsed && (
        <div style={{ marginLeft: 4 }}>
          {children.map((child, i) => (
            <ASTNode
              key={i} node={child}
              depth={depth + 1}
              isLast={i === children.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function Legend() {
  const items = Object.entries(NODE_STYLES).slice(0, 12)
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 5,
      padding: '10px 14px 10px',
      borderBottom: '1px solid var(--border)',
      flexShrink: 0,
    }}>
      {items.map(([type, s]) => (
        <span key={type} style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 9.5, fontFamily: 'var(--font-mono)',
          background: s.bg, color: s.color,
          border: `1px solid ${s.color}30`,
          borderRadius: 5, padding: '2px 7px',
        }}>
          <span style={{ fontSize: 8, fontWeight: 700 }}>{s.shape}</span>
          {type}
        </span>
      ))}
    </div>
  )
}

export default function ASTViewer({ ast, compact = false }) {
  const [search, setSearch] = useState('')
  const [expandAll, setExpandAll] = useState(false)

  if (!ast) return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', gap: 14,
      color: 'var(--text3)',
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 14,
        background: 'var(--bg3)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24, color: 'var(--text4)',
      }}>⬡</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
        No AST — compile some code first
      </div>
      <div style={{ fontSize: 11, color: 'var(--text4)', maxWidth: 220, textAlign: 'center' }}>
        Click "Compile" on the Compiler page to generate the AST tree
      </div>
    </div>
  )

  // Flatten stats
  const countNodes = (n) => {
    if (!n) return 0
    return 1 + (n.children || []).reduce((s, c) => s + countNodes(c), 0)
  }
  const totalNodes = countNodes(ast)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px', borderBottom: '1px solid var(--border)',
        flexShrink: 0, background: 'var(--bg3)',
      }}>
        <div style={{
          fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)',
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '2px 9px',
        }}>{totalNodes} nodes</div>

        <input
          placeholder="filter nodes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 7, padding: '4px 10px', fontSize: 11,
            color: 'var(--text2)', fontFamily: 'var(--font-mono)',
            maxWidth: 160,
          }}
        />
        <button
          onClick={() => setExpandAll(v => !v)}
          style={{
            padding: '4px 10px', borderRadius: 6, fontSize: 10,
            background: 'var(--bg2)', color: 'var(--text3)',
            border: '1px solid var(--border)', fontFamily: 'var(--font-mono)',
          }}
        >{expandAll ? 'Collapse All' : 'Expand All'}</button>
      </div>

      {/* Legend */}
      {!compact && <Legend />}

      {/* Tree */}
      <div style={{
        flex: 1, overflow: 'auto', padding: '14px 16px',
        fontFamily: 'var(--font-mono)',
      }}>
        <ASTNode node={ast} depth={0} isRoot />
      </div>
    </div>
  )
}
