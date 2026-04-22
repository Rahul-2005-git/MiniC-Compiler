# PLY-compatible Lexer Engine (bundled, no external deps)
# Implements the full PLY lex API: t_ rules, token(), input(), lineno tracking

import re
import sys

class LexError(Exception):
    pass

class LexToken:
    def __init__(self):
        self.type = None
        self.value = None
        self.lineno = 1
        self.lexpos = 0
    def __repr__(self):
        return f'LexToken({self.type},{self.value!r},{self.lineno},{self.lexpos})'

class Lexer:
    def __init__(self):
        self._rules = []          # (regex, func_or_str, name)
        self._ignore = ''
        self._tokens = []
        self._error_func = None
        self.lineno = 1
        self.lexpos = 0
        self.lexdata = ''
        self._master_re = None
        self._func_map = {}

    def input(self, data):
        self.lexdata = data
        self.lexpos = 0
        self.lineno = 1

    def token(self):
        lexdata = self.lexdata
        lexpos = self.lexpos
        lexlen = len(lexdata)

        while lexpos < lexlen:
            # Skip ignored characters
            if self._ignore:
                m = re.match(f'[{re.escape(self._ignore)}]+', lexdata[lexpos:])
                if m:
                    self.lineno += m.group().count('\n')
                    lexpos += len(m.group())
                    if lexpos >= lexlen:
                        self.lexpos = lexpos
                        return None
                    continue

            # Try master regex
            m = self._master_re.match(lexdata, lexpos)
            if not m:
                if self._error_func:
                    tok = LexToken()
                    tok.value = lexdata[lexpos:]
                    tok.lineno = self.lineno
                    tok.lexpos = lexpos
                    tok.type = 'error'
                    self._error_func(tok)
                    lexpos = self.lexpos = tok.lexpos + 1
                    continue
                else:
                    raise LexError(f"Illegal character '{lexdata[lexpos]}' at line {self.lineno}")

            tokname = m.lastgroup
            tokval = m.group()
            lexpos += len(tokval)

            if tokname in self._func_map:
                func = self._func_map[tokname]
                tok = LexToken()
                tok.type = tokname
                tok.value = tokval
                tok.lineno = self.lineno
                tok.lexpos = m.start()
                self.lineno += tokval.count('\n')
                self.lexpos = lexpos
                tok.lexer = self
                result = func(tok)
                if result is None:
                    continue
                return result
            else:
                self.lineno += tokval.count('\n')
                tok = LexToken()
                tok.type = tokname
                tok.value = tokval
                tok.lineno = self.lineno
                tok.lexpos = m.start()
                self.lexpos = lexpos
                return tok

        self.lexpos = lexpos
        return None

    def __iter__(self):
        return self

    def __next__(self):
        t = self.token()
        if t is None:
            raise StopIteration
        return t

def lex(module=None, object=None, debug=False, optimize=False, **kwargs):
    lx = Lexer()
    target = module or object

    if target is None:
        # Get caller's frame
        import inspect
        frame = inspect.stack()[1][0]
        target_dict = frame.f_globals
        target_dict.update(frame.f_locals)
        # Use a namespace object
        class NS: pass
        ns = NS()
        ns.__dict__.update(target_dict)
        target = ns

    tokens = getattr(target, 'tokens', [])
    ignore = getattr(target, 't_ignore', '')
    lx._ignore = ignore
    lx._tokens = list(tokens)

    rules = []
    func_map = {}

    # Collect t_ rules
    attrs = {}
    for name in dir(target):
        if name.startswith('t_'):
            attrs[name] = getattr(target, name)

    # Error handler
    if 't_error' in attrs:
        lx._error_func = attrs.pop('t_error')
        if hasattr(lx._error_func, 'lexpos'):
            pass

    # Separate function rules (with docstrings = regex) and string rules
    func_rules = []
    str_rules = []

    for name, val in attrs.items():
        tokname = name[2:]  # strip t_
        if callable(val) and val.__doc__:
            # Function rule - sort by line number for priority
            func_rules.append((val.__code__.co_firstlineno, tokname, val.__doc__, val))
        elif isinstance(val, str):
            str_rules.append((tokname, val))

    # Sort function rules by line number (higher priority = earlier)
    func_rules.sort(key=lambda x: x[0])

    # Build master regex: functions first (by line order), then strings (by length desc)
    str_rules.sort(key=lambda x: len(x[1]), reverse=True)

    all_rules = []
    for lineno, tokname, pattern, func in func_rules:
        all_rules.append((tokname, pattern))
        func_map[tokname] = func

    for tokname, pattern in str_rules:
        all_rules.append((tokname, pattern))

    # Build combined regex with named groups
    parts = [f'(?P<{name}>{pattern})' for name, pattern in all_rules]
    master = '|'.join(parts)
    lx._master_re = re.compile(master)
    lx._func_map = func_map
    lx._rules = all_rules

    return lx
