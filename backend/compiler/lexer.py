# MiniC Lexer using PLY lex
# Token rules follow PLY conventions: t_ prefix functions and strings

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from ply import lex

# ─── Token List ───────────────────────────────────────────────────────────────
tokens = (
    # Literals
    'FLOAT_LIT', 'INT_LIT', 'STRING_LIT', 'CHAR_LIT',
    # Identifiers
    'IDENT',
    # Keywords
    'INT', 'FLOAT', 'VOID', 'CHAR', 'DOUBLE',
    'IF', 'ELSE', 'WHILE', 'FOR', 'DO',
    'RETURN', 'BREAK', 'CONTINUE',
    'PRINTF', 'SCANF',
    # Operators
    'PLUS', 'MINUS', 'STAR', 'SLASH', 'PERCENT',
    'PLUSPLUS', 'MINUSMINUS',
    'PLUSEQ', 'MINUSEQ', 'STAREQ', 'SLASHEQ',
    'EQ', 'NEQ', 'LT', 'GT', 'LE', 'GE',
    'AND', 'OR', 'NOT',
    'BITAND', 'BITOR', 'BITXOR', 'BITNOT',
    'LSHIFT', 'RSHIFT',
    'ASSIGN',
    # Delimiters
    'LPAREN', 'RPAREN',
    'LBRACE', 'RBRACE',
    'LBRACKET', 'RBRACKET',
    'SEMICOLON', 'COMMA', 'DOT', 'ARROW',
    'COLON', 'QUESTION',
)

# ─── Reserved keywords mapping ─────────────────────────────────────────────
reserved = {
    'int':      'INT',
    'float':    'FLOAT',
    'void':     'VOID',
    'char':     'CHAR',
    'double':   'DOUBLE',
    'if':       'IF',
    'else':     'ELSE',
    'while':    'WHILE',
    'for':      'FOR',
    'do':       'DO',
    'return':   'RETURN',
    'break':    'BREAK',
    'continue': 'CONTINUE',
    'printf':   'PRINTF',
    'scanf':    'SCANF',
}

# ─── Ignored characters ────────────────────────────────────────────────────
t_ignore = ' \t\r'

# ─── Multi-char operators (must come before single-char) ──────────────────
def t_PLUSPLUS(t):
    r'\+\+'
    return t

def t_MINUSMINUS(t):
    r'--'
    return t

def t_PLUSEQ(t):
    r'\+='
    return t

def t_MINUSEQ(t):
    r'-='
    return t

def t_STAREQ(t):
    r'\*='
    return t

def t_SLASHEQ(t):
    r'/='
    return t

def t_EQ(t):
    r'=='
    return t

def t_NEQ(t):
    r'!='
    return t

def t_LE(t):
    r'<='
    return t

def t_GE(t):
    r'>='
    return t

def t_AND(t):
    r'&&'
    return t

def t_OR(t):
    r'\|\|'
    return t

def t_LSHIFT(t):
    r'<<'
    return t

def t_RSHIFT(t):
    r'>>'
    return t

def t_ARROW(t):
    r'->'
    return t

# ─── Single-char operators ────────────────────────────────────────────────
t_PLUS     = r'\+'
t_MINUS    = r'-'
t_STAR     = r'\*'
t_SLASH    = r'/'
t_PERCENT  = r'%'
t_LT       = r'<'
t_GT       = r'>'
t_NOT      = r'!'
t_BITAND   = r'&'
t_BITOR    = r'\|'
t_BITXOR   = r'\^'
t_BITNOT   = r'~'
t_ASSIGN   = r'='
t_LPAREN   = r'\('
t_RPAREN   = r'\)'
t_LBRACE   = r'\{'
t_RBRACE   = r'\}'
t_LBRACKET = r'\['
t_RBRACKET = r'\]'
t_SEMICOLON= r';'
t_COMMA    = r','
t_DOT      = r'\.'
t_COLON    = r':'
t_QUESTION = r'\?'

# ─── Literals ─────────────────────────────────────────────────────────────
def t_FLOAT_LIT(t):
    r'\d+\.\d*([eE][+-]?\d+)?[fF]?|\d+[eE][+-]?\d+[fF]?'
    t.value = float(t.value.rstrip('fF'))
    return t

def t_INT_LIT(t):
    r'0[xX][0-9a-fA-F]+|0[0-7]*|\d+'
    try:
        t.value = int(t.value, 0)
    except:
        t.value = int(t.value)
    return t

def t_STRING_LIT(t):
    r'"([^"\\]|\\.)*"'
    # Process escape sequences
    raw = t.value[1:-1]
    processed = raw.replace('\\n', '\n').replace('\\t', '\t').replace('\\\\', '\\').replace('\\"', '"').replace('\\0', '\0')
    t.value = processed
    return t

def t_CHAR_LIT(t):
    r"'([^'\\]|\\.)'"
    t.value = t.value[1:-1]
    return t

# ─── Identifiers & keywords ───────────────────────────────────────────────
def t_IDENT(t):
    r'[a-zA-Z_][a-zA-Z0-9_]*'
    t.type = reserved.get(t.value, 'IDENT')
    return t

# ─── Newlines ────────────────────────────────────────────────────────────
def t_newline(t):
    r'\n+'
    t.lexer.lineno += len(t.value) if hasattr(t, "lexer") and t.lexer else None

# ─── Comments ────────────────────────────────────────────────────────────
def t_BLOCK_COMMENT(t):
    r'/\*[\s\S]*?\*/'
    t.lexer.lineno += t.value.count('\n')

def t_LINE_COMMENT(t):
    r'//[^\n]*'
    pass

# ─── Error handling ──────────────────────────────────────────────────────
def t_error(t):
    t.lexer.skip(1)

# ─── Public API ──────────────────────────────────────────────────────────
def build_lexer():
    return lex.lex(module=sys.modules[__name__])

def tokenize(code):
    """Tokenize MiniC source code. Returns (tokens_list, errors_list)."""
    lexer = build_lexer()
    lexer.input(code)
    result = []
    errors = []
    while True:
        tok = lexer.token()
        if tok is None:
            break
        result.append({
            'type': tok.type,
            'value': str(tok.value),
            'line': tok.lineno,
            'col': tok.lexpos,
        })
    return result, errors
