# MiniC Parser using PLY yacc (SLR grammar)
# Grammar rules follow PLY conventions: p_ prefix functions with docstring BNF

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from ply import yacc
from compiler.lexer import tokens, build_lexer

# ─── Operator precedence (lowest to highest) ──────────────────────────────
# Note: For our recursive descent this is encoded in grammar structure

# ─── AST node helper ─────────────────────────────────────────────────────
def node(type_, **kw):
    n = {'type': type_, 'children': [], 'label': type_}
    n.update(kw)
    return n

# ─── Grammar Rules ────────────────────────────────────────────────────────

def p_program(p):
    '''program : top_level_list'''
    p[0] = node('Program', body=p[1], children=p[1], label='Program')

def p_top_level_list(p):
    '''top_level_list : top_level_list top_level_decl
                      | top_level_decl'''
    if len(p) == 3:
        p[0] = p[1] + [p[2]]
    else:
        p[0] = [p[1]]

def p_top_level_decl(p):
    '''top_level_decl : function_def
                      | var_decl'''
    p[0] = p[1]

# ─── Types ───────────────────────────────────────────────────────────────
def p_type_spec(p):
    '''type_spec : INT
                 | FLOAT
                 | VOID
                 | CHAR
                 | DOUBLE'''
    p[0] = p[1]

# ─── Function definition ─────────────────────────────────────────────────
def p_function_def(p):
    '''function_def : type_spec IDENT LPAREN param_list RPAREN block'''
    params = p[4] or []
    p[0] = node('FunctionDecl',
        ret_type=p[1], name=p[2], params=params, body=p[6],
        label=f"fn {p[1]} {p[2]}()",
        children=params + [p[6]]
    )

def p_function_def_noparams(p):
    '''function_def : type_spec IDENT LPAREN RPAREN block'''
    p[0] = node('FunctionDecl',
        ret_type=p[1], name=p[2], params=[], body=p[5],
        label=f"fn {p[1]} {p[2]}()",
        children=[p[5]]
    )

def p_param_list(p):
    '''param_list : param_list COMMA param
                  | param'''
    if len(p) == 4:
        p[0] = p[1] + [p[3]]
    else:
        p[0] = [p[1]]

def p_param(p):
    '''param : type_spec IDENT'''
    p[0] = node('Param', ptype=p[1], name=p[2],
                label=f"param {p[1]} {p[2]}", children=[])

def p_param_array(p):
    '''param : type_spec IDENT LBRACKET RBRACKET'''
    p[0] = node('Param', ptype=p[1]+'[]', name=p[2],
                label=f"param {p[1]}[] {p[2]}", children=[])

# ─── Block ───────────────────────────────────────────────────────────────
def p_block(p):
    '''block : LBRACE stmt_list RBRACE
             | LBRACE RBRACE'''
    stmts = p[2] if len(p) == 4 else []
    p[0] = node('Block', stmts=stmts, children=stmts, label='Block {}')

def p_stmt_list(p):
    '''stmt_list : stmt_list stmt
                 | stmt'''
    if len(p) == 3:
        p[0] = p[1] + ([p[2]] if p[2] else [])
    else:
        p[0] = [p[1]] if p[1] else []

# ─── Statements ──────────────────────────────────────────────────────────
def p_stmt(p):
    '''stmt : var_decl
            | expr_stmt
            | if_stmt
            | while_stmt
            | for_stmt
            | do_while_stmt
            | return_stmt
            | break_stmt
            | continue_stmt
            | printf_stmt
            | scanf_stmt
            | block
            | SEMICOLON'''
    p[0] = p[1] if p[1] != ';' else None

def p_var_decl(p):
    '''var_decl : type_spec IDENT SEMICOLON
                | type_spec IDENT ASSIGN expr SEMICOLON
                | type_spec IDENT LBRACKET INT_LIT RBRACKET SEMICOLON'''
    if len(p) == 4:
        p[0] = node('VarDecl', vtype=p[1], name=p[2], init=None,
                    label=f"var {p[1]} {p[2]}", children=[])
    elif len(p) == 6:
        p[0] = node('VarDecl', vtype=p[1], name=p[2], init=p[4],
                    label=f"var {p[1]} {p[2]} =", children=[p[4]])
    else:
        p[0] = node('VarDecl', vtype=p[1]+'[]', name=p[2], size=p[4], init=None,
                    label=f"var {p[1]}[{p[4]}] {p[2]}", children=[])

def p_expr_stmt(p):
    '''expr_stmt : expr SEMICOLON'''
    p[0] = node('ExprStmt', expr=p[1], label='ExprStmt', children=[p[1]])

def p_if_stmt(p):
    '''if_stmt : IF LPAREN expr RPAREN block
               | IF LPAREN expr RPAREN block ELSE block
               | IF LPAREN expr RPAREN block ELSE if_stmt
               | IF LPAREN expr RPAREN single_stmt
               | IF LPAREN expr RPAREN single_stmt ELSE block
               | IF LPAREN expr RPAREN single_stmt ELSE single_stmt
               | IF LPAREN expr RPAREN single_stmt ELSE if_stmt'''
    if len(p) == 6:
        p[0] = node('IfStmt', cond=p[3], then=p[5], else_=None,
                    label='if', children=[p[3], p[5]])
    else:
        p[0] = node('IfStmt', cond=p[3], then=p[5], else_=p[7],
                    label='if-else', children=[p[3], p[5], p[7]])

def p_single_stmt(p):
    '''single_stmt : expr_stmt
                   | return_stmt
                   | break_stmt
                   | continue_stmt
                   | printf_stmt
                   | scanf_stmt'''
    p[0] = p[1]

def p_while_stmt(p):
    '''while_stmt : WHILE LPAREN expr RPAREN block
                  | WHILE LPAREN expr RPAREN single_stmt'''
    p[0] = node('WhileStmt', cond=p[3], body=p[5],
                label='while', children=[p[3], p[5]])

def p_for_stmt(p):
    '''for_stmt : FOR LPAREN for_init expr SEMICOLON expr RPAREN block
                | FOR LPAREN for_init expr SEMICOLON RPAREN block
                | FOR LPAREN SEMICOLON expr SEMICOLON expr RPAREN block'''
    if len(p) == 9 and p[3] is not None:
        p[0] = node('ForStmt', init=p[3], cond=p[4], update=p[6], body=p[8],
                    label='for', children=[c for c in [p[3], p[4], p[6], p[8]] if c])
    elif len(p) == 8:
        p[0] = node('ForStmt', init=p[3], cond=p[4], update=None, body=p[7],
                    label='for', children=[c for c in [p[3], p[4], p[7]] if c])
    else:
        p[0] = node('ForStmt', init=None, cond=p[4], update=p[6], body=p[8],
                    label='for', children=[p[4], p[6], p[8]])

def p_for_init(p):
    '''for_init : expr SEMICOLON
                | var_decl'''
    p[0] = p[1]

def p_do_while_stmt(p):
    '''do_while_stmt : DO block WHILE LPAREN expr RPAREN SEMICOLON'''
    p[0] = node('DoWhileStmt', body=p[2], cond=p[5],
                label='do-while', children=[p[2], p[5]])

def p_return_stmt(p):
    '''return_stmt : RETURN expr SEMICOLON
                   | RETURN SEMICOLON'''
    if len(p) == 4:
        p[0] = node('ReturnStmt', value=p[2], label='return', children=[p[2]])
    else:
        p[0] = node('ReturnStmt', value=None, label='return', children=[])

def p_break_stmt(p):
    '''break_stmt : BREAK SEMICOLON'''
    p[0] = node('BreakStmt', label='break', children=[])

def p_continue_stmt(p):
    '''continue_stmt : CONTINUE SEMICOLON'''
    p[0] = node('ContinueStmt', label='continue', children=[])

def p_printf_stmt(p):
    '''printf_stmt : PRINTF LPAREN arg_list RPAREN SEMICOLON
                   | PRINTF LPAREN RPAREN SEMICOLON'''
    args = p[3] if len(p) == 6 else []
    p[0] = node('PrintfStmt', args=args, label='printf', children=args)

def p_scanf_stmt(p):
    '''scanf_stmt : SCANF LPAREN arg_list RPAREN SEMICOLON'''
    p[0] = node('ScanfStmt', args=p[3], label='scanf', children=p[3])

def p_arg_list(p):
    '''arg_list : arg_list COMMA expr
                | expr'''
    if len(p) == 4:
        p[0] = p[1] + [p[3]]
    else:
        p[0] = [p[1]]

# ─── Expressions (operator precedence encoded in grammar) ────────────────
def p_expr(p):
    '''expr : assign_expr'''
    p[0] = p[1]

def p_assign_expr(p):
    '''assign_expr : ternary_expr
                   | unary_expr ASSIGN assign_expr
                   | unary_expr PLUSEQ assign_expr
                   | unary_expr MINUSEQ assign_expr
                   | unary_expr STAREQ assign_expr
                   | unary_expr SLASHEQ assign_expr'''
    if len(p) == 2:
        p[0] = p[1]
    else:
        op = p[2]
        rhs = p[3]
        if op != '=':
            # Desugar: x += y -> x = x + y
            op_map = {'+=': '+', '-=': '-', '*=': '*', '/=': '/'}
            rhs = node('BinOp', op=op_map[op], left=p[1], right=p[3],
                       label=op_map[op], children=[p[1], p[3]])
        p[0] = node('Assign', left=p[1], right=rhs,
                    label='= (assign)', children=[p[1], rhs])

def p_ternary_expr(p):
    '''ternary_expr : or_expr
                    | or_expr QUESTION expr COLON ternary_expr'''
    if len(p) == 2:
        p[0] = p[1]
    else:
        p[0] = node('Ternary', cond=p[1], then=p[3], else_=p[5],
                    label='? :', children=[p[1], p[3], p[5]])

def p_or_expr(p):
    '''or_expr : and_expr
               | or_expr OR and_expr'''
    if len(p) == 2:
        p[0] = p[1]
    else:
        p[0] = node('BinOp', op='||', left=p[1], right=p[3],
                    label='||', children=[p[1], p[3]])

def p_and_expr(p):
    '''and_expr : bitor_expr
               | and_expr AND bitor_expr'''
    if len(p) == 2:
        p[0] = p[1]
    else:
        p[0] = node('BinOp', op='&&', left=p[1], right=p[3],
                    label='&&', children=[p[1], p[3]])

def p_bitor_expr(p):
    '''bitor_expr : bitxor_expr
                  | bitor_expr BITOR bitxor_expr'''
    if len(p) == 2:
        p[0] = p[1]
    else:
        p[0] = node('BinOp', op='|', left=p[1], right=p[3],
                    label='|', children=[p[1], p[3]])

def p_bitxor_expr(p):
    '''bitxor_expr : bitand_expr
                   | bitxor_expr BITXOR bitand_expr'''
    if len(p) == 2:
        p[0] = p[1]
    else:
        p[0] = node('BinOp', op='^', left=p[1], right=p[3],
                    label='^', children=[p[1], p[3]])

def p_bitand_expr(p):
    '''bitand_expr : eq_expr
                   | bitand_expr BITAND eq_expr'''
    if len(p) == 2:
        p[0] = p[1]
    else:
        p[0] = node('BinOp', op='&', left=p[1], right=p[3],
                    label='&', children=[p[1], p[3]])

def p_eq_expr(p):
    '''eq_expr : rel_expr
               | eq_expr EQ rel_expr
               | eq_expr NEQ rel_expr'''
    if len(p) == 2:
        p[0] = p[1]
    else:
        p[0] = node('BinOp', op=p[2], left=p[1], right=p[3],
                    label=p[2], children=[p[1], p[3]])

def p_rel_expr(p):
    '''rel_expr : shift_expr
               | rel_expr LT shift_expr
               | rel_expr GT shift_expr
               | rel_expr LE shift_expr
               | rel_expr GE shift_expr'''
    if len(p) == 2:
        p[0] = p[1]
    else:
        p[0] = node('BinOp', op=p[2], left=p[1], right=p[3],
                    label=p[2], children=[p[1], p[3]])

def p_shift_expr(p):
    '''shift_expr : add_expr
                  | shift_expr LSHIFT add_expr
                  | shift_expr RSHIFT add_expr'''
    if len(p) == 2:
        p[0] = p[1]
    else:
        p[0] = node('BinOp', op=p[2], left=p[1], right=p[3],
                    label=p[2], children=[p[1], p[3]])

def p_add_expr(p):
    '''add_expr : mul_expr
               | add_expr PLUS mul_expr
               | add_expr MINUS mul_expr'''
    if len(p) == 2:
        p[0] = p[1]
    else:
        p[0] = node('BinOp', op=p[2], left=p[1], right=p[3],
                    label=p[2], children=[p[1], p[3]])

def p_mul_expr(p):
    '''mul_expr : unary_expr
               | mul_expr STAR unary_expr
               | mul_expr SLASH unary_expr
               | mul_expr PERCENT unary_expr'''
    if len(p) == 2:
        p[0] = p[1]
    else:
        p[0] = node('BinOp', op=p[2], left=p[1], right=p[3],
                    label=p[2], children=[p[1], p[3]])

def p_unary_expr(p):
    '''unary_expr : postfix_expr
                  | MINUS unary_expr
                  | NOT unary_expr
                  | BITNOT unary_expr
                  | PLUSPLUS unary_expr
                  | MINUSMINUS unary_expr
                  | BITAND unary_expr'''
    if len(p) == 2:
        p[0] = p[1]
    else:
        p[0] = node('UnaryOp', op=p[1], operand=p[2],
                    label=f"unary {p[1]}", children=[p[2]])

def p_postfix_expr(p):
    '''postfix_expr : primary_expr
                    | postfix_expr PLUSPLUS
                    | postfix_expr MINUSMINUS
                    | postfix_expr LBRACKET expr RBRACKET
                    | postfix_expr DOT IDENT
                    | postfix_expr ARROW IDENT'''
    if len(p) == 2:
        p[0] = p[1]
    elif len(p) == 3:
        p[0] = node('PostfixOp', op=p[2], operand=p[1],
                    label=f"postfix {p[2]}", children=[p[1]])
    elif len(p) == 5:
        p[0] = node('ArrayAccess', arr=p[1], idx=p[3],
                    label='[]', children=[p[1], p[3]])
    else:
        p[0] = node('MemberAccess', obj=p[1], op=p[2], member=p[3],
                    label=f"{p[2]}{p[3]}", children=[p[1]])

def p_primary_expr(p):
    '''primary_expr : INT_LIT
                    | FLOAT_LIT
                    | STRING_LIT
                    | CHAR_LIT
                    | IDENT
                    | func_call
                    | LPAREN expr RPAREN'''
    if len(p) == 4:
        p[0] = p[2]
    elif p.slice[1].type == 'INT_LIT':
        p[0] = node('IntLiteral', value=p[1], label=str(p[1]), children=[])
    elif p.slice[1].type == 'FLOAT_LIT':
        p[0] = node('FloatLiteral', value=p[1], label=str(p[1]), children=[])
    elif p.slice[1].type == 'STRING_LIT':
        p[0] = node('StringLiteral', value=p[1], label=repr(p[1])[:20], children=[])
    elif p.slice[1].type == 'CHAR_LIT':
        p[0] = node('CharLiteral', value=p[1], label=repr(p[1]), children=[])
    elif p.slice[1].type == 'IDENT':
        p[0] = node('Identifier', name=p[1], label=p[1], children=[])
    else:
        p[0] = p[1]

def p_func_call(p):
    '''func_call : IDENT LPAREN arg_list RPAREN
                 | IDENT LPAREN RPAREN'''
    args = p[3] if len(p) == 5 else []
    p[0] = node('FuncCall', name=p[1], args=args,
                label=f"call {p[1]}()", children=args)

def p_error(p):
    if p:
        raise Exception(f"Syntax error at '{p.value}' (line {p.lineno}, type {p.type})")
    else:
        raise Exception("Syntax error at end of input")

# ─── Build parser ─────────────────────────────────────────────────────────
_parser = None

def build_parser():
    global _parser
    if _parser is None:
        _parser = yacc.yacc(module=sys.modules[__name__], debug=False)
    return _parser

def parse(tokens_list):
    """Parse a list of token dicts. Returns (ast, errors)."""
    # Convert token dicts to lexer-compatible tokens
    class FakeLexer:
        def __init__(self, toks):
            self._toks = toks
            self._pos = 0
            self.lineno = 1
        def input(self, data):
            pass
        def token(self):
            if self._pos >= len(self._toks):
                return None
            t = self._toks[self._pos]
            self._pos += 1
            class T:
                pass
            tok = T()
            tok.type = t['type']
            tok.value = t['value']
            tok.lineno = t['line']
            tok.lexpos = t['col']
            return tok
        def __iter__(self):
            toks = []
            while True:
                t = self.token()
                if t is None:
                    break
                toks.append(t)
            return iter(toks)

    try:
        parser = build_parser()
        fake = FakeLexer(tokens_list)
        # Re-tokenize from source if available, else convert
        ast = parser.parse(input=None, lexer=fake)
        return ast, []
    except Exception as e:
        return None, [str(e)]
