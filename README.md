# MiniC Compiler — LLVM · PLY Lex+Yacc · Real Machine Code

A complete web-based compiler with **7 compilation stages**, built on:
- **PLY lex** — tokenizer with `t_` rule functions (bundled, zero deps)
- **PLY yacc** — SLR(1) parser with `p_` grammar rules (bundled, zero deps)  
- **GCC toolchain** — real x86-64 assembly, machine code, and execution
- **React + Vite** — modern split-pane UI

---

## Quick Start

```bash
# Backend
cd backend
pip install flask flask-cors
python app.py
# → http://localhost:5000

# Frontend (new terminal)
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## 7-Stage Pipeline

| # | Stage | Tool | Output |
|---|-------|------|--------|
| 1 | **Lexer** | PLY `lex` — `t_` rule functions | Token stream with types, values, line/col |
| 2 | **Parser** | PLY `yacc` SLR(1) — `p_` grammar | Full AST with 25+ node types |
| 3 | **Semantic** | Symbol table + scope analysis | Errors, warnings, unused vars |
| 4 | **LLVM IR** | GCC GIMPLE / text IR generator | LLVM-style intermediate representation |
| 5 | **Assembly** | `gcc -S -O1` | Real x86-64 Intel/AT&T assembly |
| 6 | **Machine Code** | `objdump -d -M intel` | Hex bytes + Intel mnemonics per function |
| 7 | **Execute** | Native GCC binary | Real stdout/stderr with stdin support |

---

## Project Structure

```
minic-compiler/
├── backend/
│   ├── app.py                    Flask entry point
│   ├── requirements.txt
│   ├── ply/
│   │   ├── lex.py                Bundled PLY lexer engine
│   │   └── yacc.py               Bundled PLY SLR(1) parser engine
│   ├── compiler/
│   │   ├── lexer.py              MiniC t_ token rules (PLY lex API)
│   │   ├── parser.py             MiniC p_ grammar rules (PLY yacc API)
│   │   ├── semantic.py           Symbol tables, type checking, scoping
│   │   ├── codegen.py            GCC wrapper: assembly, machine code, execution
│   │   └── llvm_ir.py            LLVM IR generator (GCC GIMPLE / text)
│   └── routes/
│       └── compile.py            POST /compile — 8-stage pipeline
│
└── frontend/
    └── src/
        ├── components/
        │   ├── Sidebar.jsx       Navigation + pipeline legend
        │   ├── CodeEditor.jsx    Syntax-highlighted editor, auto-indent
        │   ├── ASTViewer.jsx     Interactive collapsible tree
        │   └── OutputTabs.jsx    6 output tabs including Machine Code
        └── pages/
            ├── Home.jsx          Pipeline overview
            ├── Compiler.jsx      Main IDE with stage progress
            ├── ASTPage.jsx       Standalone AST explorer
            ├── History.jsx       Compile run history
            └── Settings.jsx      Options panel
```

---

## API

### `POST /api/compile`

```json
{
  "code": "int main() { ... }",
  "stdin": "",
  "options": { "assembly": true, "machine_code": true, "execute": true }
}
```

Response:
```json
{
  "tokens":       [{ "type": "INT", "value": "int", "line": 1, "col": 1 }],
  "ast":          { "type": "Program", "body": [...] },
  "ir":           "; LLVM IR or GCC GIMPLE dump",
  "assembly":     ".globl main\nmain:\n  ...",
  "machine_code": [{ "name": "main", "instructions": [{ "addr": "0", "bytes": "55", "instr": "push rbp" }] }],
  "output":       "120\n",
  "errors":       [],
  "warnings":     [],
  "stats":        { "elapsed_ms": 142, "token_count": 38, "error_count": 0 }
}
```

---

## Supported Language Features

- `int`, `float`, `char`, `void`, `double` types
- All arithmetic: `+`, `-`, `*`, `/`, `%`
- All bitwise: `&`, `|`, `^`, `~`, `<<`, `>>`
- Compound assignment: `+=`, `-=`, `*=`, `/=`
- `++` / `--` prefix and postfix
- Ternary: `? :`
- `if` / `else if` / `else`
- `while`, `for`, `do-while` loops
- `break`, `continue`
- `return`
- `printf`, `scanf`
- Multi-parameter recursive functions
- Nested blocks and scoping

---

## PLY Lex+Yacc Architecture

The bundled `ply/lex.py` and `ply/yacc.py` implement the full PLY API:

**Lexer** (`compiler/lexer.py`):
- Rules defined as `t_PLUS = r'\+'` (string) or `def t_IDENT(t):` (function with docstring regex)
- Keywords handled via reserved dict in `t_IDENT`
- Newline tracking, comment skipping, full error recovery

**Parser** (`compiler/parser.py`):
- Grammar rules as `def p_function_def(p): '''function_def : type_spec IDENT ...'''`
- Operator precedence encoded via grammar layering (add_expr → mul_expr → unary_expr)
- SLR(1) table construction: FIRST/FOLLOW sets, LR(0) item sets, action/goto tables
