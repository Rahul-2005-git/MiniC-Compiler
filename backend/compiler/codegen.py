# Code generation: LLVM IR, x86 Assembly, Machine Code, Execution
# Uses real GCC toolchain for assembly/machine code output

import subprocess
import tempfile
import os
import re

GCC = 'gcc'
OBJDUMP = 'objdump'

def _write_tmp(code, suffix='.c'):
    fd, path = tempfile.mkstemp(suffix=suffix)
    with os.fdopen(fd, 'w') as f:
        f.write(code)
    return path

def _run(cmd, timeout=10):
    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=timeout
        )
        return result.stdout, result.stderr, result.returncode
    except subprocess.TimeoutExpired:
        return '', 'Compilation timed out', 1
    except FileNotFoundError as e:
        return '', f'Tool not found: {e}', 1

def ast_to_c(ast):
    """Convert our MiniC AST back to valid C source for GCC."""
    if ast is None:
        return ''
    gen = CGenerator()
    return gen.generate(ast)

class CGenerator:
    def __init__(self):
        self.indent = 0

    def I(self):
        return '    ' * self.indent

    def generate(self, node):
        if not node or not isinstance(node, dict):
            return ''
        t = node.get('type', '')
        m = getattr(self, f'gen_{t}', self.gen_generic)
        return m(node)

    def gen_generic(self, node):
        return ''

    def gen_Program(self, node):
        lines = ['#include <stdio.h>', '#include <stdlib.h>', '#include <string.h>', '']
        for decl in node.get('body', []):
            lines.append(self.generate(decl))
        return '\n'.join(lines)

    def gen_FunctionDecl(self, node):
        params = ', '.join(
            f"{p['ptype']} {p['name']}" for p in node.get('params', [])
        ) or 'void' if node['ret_type'] == 'void' else ', '.join(
            f"{p['ptype']} {p['name']}" for p in node.get('params', [])
        )
        if not node.get('params'):
            params = ''
        ret = node['ret_type']
        name = node['name']
        body = self.generate(node['body'])
        return f"{ret} {name}({params}) {body}\n"

    def gen_Block(self, node):
        self.indent += 1
        stmts = '\n'.join(self.generate(s) for s in node.get('stmts', []) if s)
        self.indent -= 1
        return '{\n' + stmts + '\n' + self.I() + '}'

    def gen_VarDecl(self, node):
        vtype = node['vtype']
        name = node['name']
        if 'size' in node:
            return f"{self.I()}{vtype} {name}[{node['size']}];"
        if node.get('init'):
            return f"{self.I()}{vtype} {name} = {self.generate(node['init'])};"
        return f"{self.I()}{vtype} {name};"

    def gen_ExprStmt(self, node):
        return f"{self.I()}{self.generate(node['expr'])};"

    def gen_IfStmt(self, node):
        cond = self.generate(node['cond'])
        then = self.generate(node['then'])
        result = f"{self.I()}if ({cond}) {then}"
        if node.get('else_'):
            result += f"\n{self.I()}else {self.generate(node['else_'])}"
        return result

    def gen_WhileStmt(self, node):
        return f"{self.I()}while ({self.generate(node['cond'])}) {self.generate(node['body'])}"

    def gen_ForStmt(self, node):
        init = self.generate(node.get('init') or {}).rstrip(';').strip()
        cond = self.generate(node.get('cond') or {})
        update = self.generate(node.get('update') or {})
        body = self.generate(node['body'])
        return f"{self.I()}for ({init}; {cond}; {update}) {body}"

    def gen_DoWhileStmt(self, node):
        return f"{self.I()}do {self.generate(node['body'])} while ({self.generate(node['cond'])});"

    def gen_ReturnStmt(self, node):
        if node.get('value'):
            return f"{self.I()}return {self.generate(node['value'])};"
        return f"{self.I()}return;"

    def gen_BreakStmt(self, node):
        return f"{self.I()}break;"

    def gen_ContinueStmt(self, node):
        return f"{self.I()}continue;"

    def gen_PrintfStmt(self, node):
        args = ', '.join(self.generate(a) for a in node.get('args', []))
        return f'{self.I()}printf({args});'

    def gen_ScanfStmt(self, node):
        args = ', '.join(self.generate(a) for a in node.get('args', []))
        return f'{self.I()}scanf({args});'

    def gen_Assign(self, node):
        return f"{self.generate(node['left'])} = {self.generate(node['right'])}"

    def gen_BinOp(self, node):
        l = self.generate(node['left'])
        r = self.generate(node['right'])
        return f"({l} {node['op']} {r})"

    def gen_UnaryOp(self, node):
        return f"({node['op']}{self.generate(node['operand'])})"

    def gen_PostfixOp(self, node):
        return f"({self.generate(node['operand'])}{node['op']})"

    def gen_Ternary(self, node):
        c = self.generate(node['cond'])
        t = self.generate(node['then'])
        e = self.generate(node['else_'])
        return f"({c} ? {t} : {e})"

    def gen_FuncCall(self, node):
        args = ', '.join(self.generate(a) for a in node.get('args', []))
        return f"{node['name']}({args})"

    def gen_ArrayAccess(self, node):
        return f"{self.generate(node['arr'])}[{self.generate(node['idx'])}]"

    def gen_MemberAccess(self, node):
        return f"{self.generate(node['obj'])}{node['op']}{node['member']}"

    def gen_Identifier(self, node):
        return node['name']

    def gen_IntLiteral(self, node):
        return str(node['value'])

    def gen_FloatLiteral(self, node):
        v = node['value']
        return f"{v:.6f}f" if v != int(v) else f"{v:.1f}f"

    def gen_StringLiteral(self, node):
        escaped = node['value'].replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n').replace('\t', '\\t')
        return f'"{escaped}"'

    def gen_CharLiteral(self, node):
        return f"'{node['value']}'"


def generate_llvm_ir(c_source):
    """Generate LLVM IR using our text-based generator (no clang needed)."""
    # Use our custom IR generator
    from compiler.llvm_ir import generate_ir_from_c
    return generate_ir_from_c(c_source)


def generate_assembly(c_source, intel_syntax=True):
    """Generate x86-64 assembly using GCC."""
    src = _write_tmp(c_source)
    asm_out = src.replace('.c', '.s')
    try:
        flags = [GCC, '-S', src, '-o', asm_out, '-O1',
                 '-fno-asynchronous-unwind-tables', '-fno-exceptions']
        if intel_syntax:
            flags += ['-masm=intel']
        stdout, stderr, rc = _run(flags)
        if rc != 0:
            return None, stderr
        with open(asm_out) as f:
            return f.read(), stderr or None
    finally:
        for p in [src, asm_out]:
            try: os.unlink(p)
            except: pass


def generate_machine_code(c_source):
    """Compile to binary and disassemble to get machine code."""
    src = _write_tmp(c_source)
    obj_out = src.replace('.c', '.o')
    try:
        # Compile to object file
        _, stderr, rc = _run([GCC, '-c', src, '-o', obj_out, '-O0'])
        if rc != 0:
            return None, stderr

        # Disassemble with Intel syntax showing hex bytes
        stdout, stderr, rc = _run([
            OBJDUMP, '-d', '-M', 'intel',
            '--no-show-raw-insn',
            obj_out
        ])

        # Also get hex dump version
        hex_out, _, _ = _run([OBJDUMP, '-d', obj_out])

        # Parse into structured format
        sections = _parse_disassembly(stdout, hex_out)
        return sections, None
    finally:
        for p in [src, obj_out]:
            try: os.unlink(p)
            except: pass


def _parse_disassembly(intel_asm, hex_asm):
    """Parse objdump output into structured machine code sections."""
    sections = []
    current_func = None
    current_lines = []

    for line in intel_asm.split('\n'):
        # Function header: "0000000000000000 <factorial>:"
        m = re.match(r'^([0-9a-f]+)\s+<([^>]+)>:', line)
        if m:
            if current_func:
                sections.append({'name': current_func, 'addr': current_addr, 'instructions': current_lines})
            current_func = m.group(2)
            current_addr = m.group(1)
            current_lines = []
            continue

        # Instruction line: "   0:	endbr64"
        m = re.match(r'^\s+([0-9a-f]+):\s+(.+)', line)
        if m and current_func:
            addr = m.group(1)
            instr = m.group(2).strip()
            current_lines.append({'addr': addr, 'instr': instr})

    if current_func and current_lines:
        sections.append({'name': current_func, 'addr': current_addr, 'instructions': current_lines})

    # Now add hex bytes from the hex_asm version
    hex_map = {}
    for line in hex_asm.split('\n'):
        m = re.match(r'^\s+([0-9a-f]+):\s+((?:[0-9a-f]{2}\s+)+)', line)
        if m:
            addr = m.group(1).strip().lstrip('0') or '0'
            hex_bytes = m.group(2).strip()
            hex_map[addr] = hex_bytes

    for sec in sections:
        for ins in sec['instructions']:
            a = ins['addr'].lstrip('0') or '0'
            ins['bytes'] = hex_map.get(a, '')

    return sections


def execute_program(c_source, stdin_input='', timeout=5):
    """Compile and execute the C program, return stdout."""
    src = _write_tmp(c_source)
    exe = src.replace('.c', '_exec')
    try:
        _, stderr, rc = _run([GCC, src, '-o', exe, '-lm'])
        if rc != 0:
            return None, f"Compilation failed:\n{stderr}"
        try:
            result = subprocess.run(
                [exe], input=stdin_input, capture_output=True,
                text=True, timeout=timeout
            )
            output = result.stdout
            if result.returncode != 0:
                output += f"\n[Process exited with code {result.returncode}]"
            if result.stderr:
                output += f"\n[stderr]: {result.stderr[:500]}"
            return output or '(no output)', None
        except subprocess.TimeoutExpired:
            return None, f"Execution timed out after {timeout}s"
    finally:
        for p in [src, exe]:
            try: os.unlink(p)
            except: pass
