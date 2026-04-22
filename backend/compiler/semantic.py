# Semantic Analyzer: Symbol table, scope tracking, type inference, error reporting

class SemanticError:
    def __init__(self, msg, level='error'):
        self.msg = msg
        self.level = level
    def __str__(self):
        return f"[{self.level.upper()}] {self.msg}"

class Symbol:
    def __init__(self, name, stype, kind='var', lineno=0):
        self.name = name
        self.stype = stype
        self.kind = kind   # 'var', 'func', 'param'
        self.lineno = lineno
        self.used = False

class SymbolTable:
    def __init__(self, parent=None, name='global'):
        self.symbols = {}
        self.parent = parent
        self.name = name

    def define(self, sym):
        self.symbols[sym.name] = sym

    def lookup(self, name):
        if name in self.symbols:
            return self.symbols[name]
        if self.parent:
            return self.parent.lookup(name)
        return None

    def lookup_local(self, name):
        return self.symbols.get(name)

class SemanticAnalyzer:
    def __init__(self):
        self.diagnostics = []
        self.global_scope = SymbolTable(name='global')
        self.scope = self.global_scope
        self.func_return_type = None
        self.loop_depth = 0

    def err(self, msg):
        self.diagnostics.append(SemanticError(msg, 'error'))

    def warn(self, msg):
        self.diagnostics.append(SemanticError(msg, 'warning'))

    def push_scope(self, name='block'):
        self.scope = SymbolTable(parent=self.scope, name=name)

    def pop_scope(self):
        # Warn about unused vars
        for sym in self.scope.symbols.values():
            if sym.kind == 'var' and not sym.used:
                self.warn(f"Variable '{sym.name}' declared but never used")
        self.scope = self.scope.parent

    def analyze(self, node):
        if not node or not isinstance(node, dict):
            return 'unknown'
        t = node.get('type', '')
        method = f'visit_{t}'
        visitor = getattr(self, method, self.visit_generic)
        return visitor(node)

    def visit_generic(self, node):
        for c in node.get('children', []):
            if c:
                self.analyze(c)
        return 'unknown'

    def visit_Program(self, node):
        for decl in node.get('body', []):
            self.analyze(decl)

    def visit_FunctionDecl(self, node):
        name = node['name']
        if self.global_scope.lookup_local(name):
            self.err(f"Function '{name}' already defined")
        self.global_scope.define(Symbol(name, node['ret_type'], kind='func'))
        self.push_scope(name=name)
        self.func_return_type = node['ret_type']
        for param in node.get('params', []):
            self.scope.define(Symbol(param['name'], param['ptype'], kind='param'))
        self.analyze(node['body'])
        self.func_return_type = None
        self.pop_scope()

    def visit_Block(self, node):
        self.push_scope()
        for stmt in node.get('stmts', []):
            self.analyze(stmt)
        self.pop_scope()

    def visit_VarDecl(self, node):
        name = node['name']
        if self.scope.lookup_local(name):
            self.err(f"Variable '{name}' already declared in this scope")
        self.scope.define(Symbol(name, node['vtype'], kind='var'))
        if node.get('init'):
            self.analyze(node['init'])

    def visit_Assign(self, node):
        left = node['left']
        if left['type'] == 'Identifier':
            sym = self.scope.lookup(left['name'])
            if not sym:
                self.err(f"Assignment to undeclared variable '{left['name']}'")
            else:
                sym.used = True
        self.analyze(node['right'])

    def visit_Identifier(self, node):
        sym = self.scope.lookup(node['name'])
        if not sym:
            self.err(f"Undeclared identifier '{node['name']}'")
        else:
            sym.used = True
            return sym.stype
        return 'int'

    def visit_BinOp(self, node):
        lt = self.analyze(node['left'])
        rt = self.analyze(node['right'])
        op = node['op']
        if op in ('/', '%') and node['right'].get('type') == 'IntLiteral' and node['right'].get('value') == 0:
            self.warn("Division by zero detected")
        return 'float' if 'float' in (lt, rt) else 'int'

    def visit_UnaryOp(self, node):
        return self.analyze(node['operand'])

    def visit_PostfixOp(self, node):
        return self.analyze(node['operand'])

    def visit_IfStmt(self, node):
        self.analyze(node['cond'])
        self.analyze(node['then'])
        if node.get('else_'):
            self.analyze(node['else_'])

    def visit_WhileStmt(self, node):
        self.analyze(node['cond'])
        self.loop_depth += 1
        self.analyze(node['body'])
        self.loop_depth -= 1

    def visit_ForStmt(self, node):
        self.push_scope('for')
        if node.get('init'):
            self.analyze(node['init'])
        if node.get('cond'):
            self.analyze(node['cond'])
        if node.get('update'):
            self.analyze(node['update'])
        self.loop_depth += 1
        self.analyze(node['body'])
        self.loop_depth -= 1
        self.pop_scope()

    def visit_DoWhileStmt(self, node):
        self.loop_depth += 1
        self.analyze(node['body'])
        self.loop_depth -= 1
        self.analyze(node['cond'])

    def visit_ReturnStmt(self, node):
        if node.get('value'):
            self.analyze(node['value'])
        elif self.func_return_type and self.func_return_type != 'void':
            self.warn(f"Return with no value in non-void function")

    def visit_BreakStmt(self, node):
        if self.loop_depth == 0:
            self.err("'break' statement outside of loop")

    def visit_ContinueStmt(self, node):
        if self.loop_depth == 0:
            self.err("'continue' statement outside of loop")

    def visit_PrintfStmt(self, node):
        for arg in node.get('args', []):
            self.analyze(arg)

    def visit_ScanfStmt(self, node):
        for arg in node.get('args', []):
            self.analyze(arg)

    def visit_ExprStmt(self, node):
        self.analyze(node['expr'])

    def visit_FuncCall(self, node):
        sym = self.scope.lookup(node['name'])
        if not sym:
            # Could be a stdlib function — warn but don't error
            self.warn(f"Call to undeclared function '{node['name']}' (may be stdlib)")
        for arg in node.get('args', []):
            self.analyze(arg)
        return sym.stype if sym else 'int'

    def visit_Ternary(self, node):
        self.analyze(node['cond'])
        t1 = self.analyze(node['then'])
        t2 = self.analyze(node['else_'])
        return t1

    def visit_ArrayAccess(self, node):
        self.analyze(node['arr'])
        self.analyze(node['idx'])
        return 'int'

    def visit_IntLiteral(self, n): return 'int'
    def visit_FloatLiteral(self, n): return 'float'
    def visit_StringLiteral(self, n): return 'char*'
    def visit_CharLiteral(self, n): return 'char'


def analyze(ast):
    if ast is None:
        return []
    analyzer = SemanticAnalyzer()
    analyzer.analyze(ast)
    return [str(d) for d in analyzer.diagnostics]
