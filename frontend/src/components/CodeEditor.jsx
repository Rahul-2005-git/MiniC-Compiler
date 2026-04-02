import { useRef } from 'react'

export const SAMPLE_CODE = `int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

int main() {
    int i = 1;
    while (i <= 6) {
        printf("%d! = %d\\n", i, factorial(i));
        i = i + 1;
    }
    return 0;
}`

const KW = new Set(['int','float','void','char','double','if','else','while','for',
  'do','return','break','continue','printf','scanf','struct','typedef','const','static'])

function syntaxHL(code) {
  const lines = code.split('\n')
  return lines.map(line => {
    let out = ''
    let i = 0
    while (i < line.length) {
      // Block comment (shouldn't happen across lines but just in case)
      if (line[i] === '/' && line[i+1] === '/') {
        out += `<span style="color:#6272a4">${esc(line.slice(i))}</span>`
        break
      }
      // String literal
      if (line[i] === '"') {
        let end = i + 1
        while (end < line.length && !(line[end] === '"' && line[end-1] !== '\\')) end++
        out += `<span style="color:#f1fa8c">${esc(line.slice(i, end+1))}</span>`
        i = end + 1; continue
      }
      // Char literal
      if (line[i] === "'") {
        let end = i + 1
        while (end < line.length && line[end] !== "'") end++
        out += `<span style="color:#f1fa8c">${esc(line.slice(i, end+1))}</span>`
        i = end + 1; continue
      }
      // Numbers
      if (/\d/.test(line[i]) || (line[i]==='.' && /\d/.test(line[i+1]||''))) {
        let end = i
        while (end < line.length && /[\d.xXa-fA-FlLuU]/.test(line[end])) end++
        out += `<span style="color:#bd93f9">${esc(line.slice(i,end))}</span>`
        i = end; continue
      }
      // Preprocessor
      if (line[i] === '#') {
        out += `<span style="color:#ff79c6">${esc(line.slice(i))}</span>`
        break
      }
      // Identifier / keyword
      if (/[a-zA-Z_]/.test(line[i])) {
        let end = i
        while (end < line.length && /[a-zA-Z0-9_]/.test(line[end])) end++
        const word = line.slice(i, end)
        if (KW.has(word)) {
          out += `<span style="color:#ff79c6;font-weight:600">${word}</span>`
        } else if (line[end] === '(') {
          out += `<span style="color:#50fa7b">${word}</span>`
        } else {
          out += `<span style="color:#8be9fd">${word}</span>`
        }
        i = end; continue
      }
      // Operators
      if (/[+\-*\/%=<>!&|^~?:.]/.test(line[i])) {
        out += `<span style="color:#ff79c6">${esc(line[i])}</span>`
        i++; continue
      }
      // Braces / parens
      if (/[{}()\[\];,]/.test(line[i])) {
        out += `<span style="color:#ffb86c">${esc(line[i])}</span>`
        i++; continue
      }
      out += esc(line[i]); i++
    }
    return out
  }).join('\n')
}

function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}

export default function CodeEditor({ code, onChange }) {
  const taRef   = useRef(null)
  const preRef  = useRef(null)
  const lnRef   = useRef(null)

  const lines = code.split('\n')

  const sync = () => {
    if (preRef.current && taRef.current) {
      preRef.current.scrollTop  = taRef.current.scrollTop
      preRef.current.scrollLeft = taRef.current.scrollLeft
    }
    if (lnRef.current && taRef.current) {
      lnRef.current.scrollTop = taRef.current.scrollTop
    }
  }

  const onKey = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const s = e.target.selectionStart, en = e.target.selectionEnd
      const nv = code.slice(0,s) + '    ' + code.slice(en)
      onChange(nv)
      requestAnimationFrame(() => {
        taRef.current.selectionStart = taRef.current.selectionEnd = s + 4
      })
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      const s = e.target.selectionStart
      const lineStart = code.lastIndexOf('\n', s-1) + 1
      const currentLine = code.slice(lineStart, s)
      const indent = currentLine.match(/^(\s*)/)[1]
      const extraIndent = /[{([]$/.test(currentLine.trim()) ? '    ' : ''
      const insert = '\n' + indent + extraIndent
      const nv = code.slice(0,s) + insert + code.slice(e.target.selectionEnd)
      onChange(nv)
      requestAnimationFrame(() => {
        const pos = s + insert.length
        taRef.current.selectionStart = taRef.current.selectionEnd = pos
      })
    }
    if (e.key === '}' || e.key === ')') {
      // Auto-dedent: check if current line is only whitespace
      const s = e.target.selectionStart
      const lineStart = code.lastIndexOf('\n', s-1) + 1
      const currentLine = code.slice(lineStart, s)
      if (/^\s+$/.test(currentLine) && currentLine.length >= 4) {
        e.preventDefault()
        const nv = code.slice(0, s-4) + e.key + code.slice(s)
        onChange(nv)
        requestAnimationFrame(() => {
          taRef.current.selectionStart = taRef.current.selectionEnd = s - 3
        })
      }
    }
  }

  const shared = {
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
    lineHeight: '22px',
    padding: '14px 14px 14px 0',
    whiteSpace: 'pre',
    overflowWrap: 'normal',
    wordBreak: 'normal',
    width: '100%',
    tabSize: 4,
  }

  return (
    <div style={{
      display:'flex', background:'#1e1e2e', borderRadius:10,
      border:'1px solid var(--border)', overflow:'hidden', height:'100%',
      boxShadow:'inset 0 0 0 1px rgba(255,255,255,0.02)',
    }}>
      {/* Line numbers */}
      <div ref={lnRef} style={{
        ...shared, width:46, minWidth:46, padding:'14px 8px',
        textAlign:'right', color:'#44475a', userSelect:'none',
        overflow:'hidden', flexShrink:0,
        borderRight:'1px solid #282a36',
      }}>
        {lines.map((_,i) => (
          <div key={i} style={{ lineHeight:'22px' }}>{i+1}</div>
        ))}
      </div>

      {/* Editor */}
      <div style={{ flex:1, position:'relative', overflow:'hidden' }}>
        <pre ref={preRef} aria-hidden="true" style={{
          ...shared, position:'absolute', top:0, left:0, right:0, bottom:0,
          pointerEvents:'none', overflow:'auto', color:'#f8f8f2',
          paddingLeft:14, margin:0, background:'transparent',
        }}
          dangerouslySetInnerHTML={{ __html: syntaxHL(code) + '\n' }}
        />
        <textarea ref={taRef} value={code}
          onChange={e => onChange(e.target.value)}
          onScroll={sync} onKeyDown={onKey} spellCheck={false} autoComplete="off"
          style={{
            ...shared, position:'absolute', top:0, left:0, right:0, bottom:0,
            resize:'none', color:'transparent', caretColor:'#f8f8f2',
            overflow:'auto', paddingLeft:14, margin:0,
            background:'transparent', zIndex:1, border:'none', outline:'none',
          }}
        />
      </div>
    </div>
  )
}
