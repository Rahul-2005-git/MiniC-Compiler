# PLY-compatible YACC/Parser Engine (bundled, no external deps)
# Implements SLR(1) parsing with the standard PLY p_ rule API

import re
import sys
import inspect
from collections import defaultdict

class YaccError(Exception):
    pass

class YaccSymbol:
    def __init__(self):
        self.type = None
        self.value = None
        self.lineno = 0
        self.endlineno = 0

class YaccProduction:
    def __init__(self, s, pslice):
        self.slice = pslice
        self.stack = s
    def __getitem__(self, n):
        if n >= 0:
            return self.slice[n].value
        else:
            return self.stack[n].value
    def __setitem__(self, n, v):
        self.slice[n].value = v
    def __len__(self):
        return len(self.slice)
    @property
    def lineno(self):
        for s in self.slice:
            if hasattr(s, 'lineno') and s.lineno:
                return s.lineno
        return 0
    def lineno_at(self, n):
        return getattr(self.slice[n], 'lineno', 0)

# --- Grammar classes ---

class Production:
    def __init__(self, name, syms, func, lineno):
        self.name = name
        self.syms = syms
        self.func = func
        self.lineno = lineno
        self.id = 0
    def __repr__(self):
        return f"{self.name} -> {' '.join(self.syms) if self.syms else 'ε'}"
    def __len__(self):
        return len(self.syms)

class Grammar:
    def __init__(self, tokens):
        self.productions = []
        self.prodnames = defaultdict(list)
        self.tokens = set(tokens)
        self.terminals = defaultdict(list)
        self.nonterminals = defaultdict(list)
        self.first = {}
        self.follow = {}
        self.start = None

    def add_production(self, name, syms, func, lineno):
        p = Production(name, syms, func, lineno)
        p.id = len(self.productions)
        self.productions.append(p)
        self.prodnames[name].append(p)
        if self.start is None:
            self.start = name
        for sym in syms:
            if sym in self.tokens:
                self.terminals[sym].append(p)
            else:
                self.nonterminals[sym].append(p)
        return p

    def compute_first(self):
        first = defaultdict(set)
        for t in self.tokens:
            first[t] = {t}
        first['$end'] = {'$end'}
        changed = True
        while changed:
            changed = False
            for p in self.productions:
                before = len(first[p.name])
                if not p.syms:
                    first[p.name].add('')
                else:
                    for sym in p.syms:
                        sym_first = first[sym] - {''}
                        first[p.name] |= sym_first
                        if '' not in first[sym]:
                            break
                    else:
                        first[p.name].add('')
                if len(first[p.name]) > before:
                    changed = True
        self.first = dict(first)
        return self.first

    def first_of_seq(self, syms):
        result = set()
        for sym in syms:
            f = self.first.get(sym, set())
            result |= (f - {''})
            if '' not in f:
                return result
        result.add('')
        return result

    def compute_follow(self):
        follow = defaultdict(set)
        if self.start:
            follow[self.start].add('$end')
        changed = True
        while changed:
            changed = False
            for p in self.productions:
                for i, sym in enumerate(p.syms):
                    if sym in self.nonterminals or sym in self.prodnames:
                        before = len(follow[sym])
                        rest = p.syms[i+1:]
                        f = self.first_of_seq(rest)
                        follow[sym] |= (f - {''})
                        if '' in f:
                            follow[sym] |= follow[p.name]
                        if len(follow[sym]) > before:
                            changed = True
        self.follow = dict(follow)
        return self.follow

class LR0Item:
    def __init__(self, prod, dot):
        self.prod = prod
        self.dot = dot
    @property
    def at_end(self):
        return self.dot >= len(self.prod.syms)
    @property
    def next_sym(self):
        if not self.at_end:
            return self.prod.syms[self.dot]
        return None
    def advance(self):
        return LR0Item(self.prod, self.dot + 1)
    def __eq__(self, other):
        return self.prod.id == other.prod.id and self.dot == other.dot
    def __hash__(self):
        return hash((self.prod.id, self.dot))
    def __repr__(self):
        syms = list(self.prod.syms)
        syms.insert(self.dot, '•')
        return f"{self.prod.name} -> {' '.join(syms) if syms else 'ε'}"

class LRTable:
    def __init__(self, grammar):
        self.grammar = grammar
        self.action = {}  # (state, token) -> ('shift', state) | ('reduce', prod) | ('accept',)
        self.goto = {}    # (state, nt) -> state
        self.states = []
        self._build()

    def _closure(self, items):
        closure = set(items)
        changed = True
        while changed:
            changed = False
            for item in list(closure):
                sym = item.next_sym
                if sym and sym in self.grammar.prodnames:
                    for prod in self.grammar.prodnames[sym]:
                        new_item = LR0Item(prod, 0)
                        if new_item not in closure:
                            closure.add(new_item)
                            changed = True
        return frozenset(closure)

    def _goto(self, items, sym):
        moved = {item.advance() for item in items if item.next_sym == sym}
        return self._closure(moved)

    def _build(self):
        g = self.grammar
        # Augmented start
        aug_name = g.start + "'"
        aug_prod = Production(aug_name, [g.start], None, 0)
        aug_prod.id = -1

        start_item = LR0Item(aug_prod, 0)
        start_state = self._closure({start_item})

        states = [start_state]
        state_map = {start_state: 0}
        queue = [start_state]

        trans = {}  # (state_id, sym) -> state_id

        while queue:
            state = queue.pop(0)
            sid = state_map[state]
            syms = {item.next_sym for item in state if item.next_sym}
            for sym in syms:
                nxt = self._goto(state, sym)
                if not nxt:
                    continue
                if nxt not in state_map:
                    state_map[nxt] = len(states)
                    states.append(nxt)
                    queue.append(nxt)
                trans[(sid, sym)] = state_map[nxt]

        self.states = states

        # Build action/goto tables (SLR)
        follow = g.compute_follow()

        for state, sid in state_map.items():
            for item in state:
                sym = item.next_sym
                if sym:
                    if sym in g.tokens or sym == '$end':
                        key = (sid, sym)
                        if key in trans:
                            self.action[key] = ('shift', trans[(sid, sym)])
                    else:
                        key = (sid, sym)
                        if key in trans:
                            self.goto[(sid, sym)] = trans[(sid, sym)]
                else:
                    # Reduce
                    if item.prod.id == -1:
                        # Accept
                        self.action[(sid, '$end')] = ('accept',)
                    else:
                        for tok in follow.get(item.prod.name, set()):
                            key = (sid, tok)
                            if key not in self.action:
                                self.action[key] = ('reduce', item.prod)
                            # shift-reduce conflict: prefer shift (common default)


class Parser:
    def __init__(self, grammar, table):
        self.grammar = grammar
        self.table = table

    def parse(self, lexer, debug=False):
        tokens = list(lexer)
        tokens.append(type('EOF', (), {'type': '$end', 'value': '$end', 'lineno': 0})())
        pos = 0
        stack = [type('S', (), {'state': 0, 'value': None, 'type': None, 'lineno': 0})()]

        while True:
            state = stack[-1].state
            tok = tokens[pos]

            action = self.table.action.get((state, tok.type))
            if action is None:
                # Error - try error recovery
                expected = [t for (s, t) in self.table.action if s == state]
                raise YaccError(
                    f"Syntax error at '{tok.value}' (line {tok.lineno}). "
                    f"Expected one of: {', '.join(expected)}"
                )

            if action[0] == 'shift':
                sym = type('S', (), {
                    'state': action[1], 'value': tok.value,
                    'type': tok.type, 'lineno': tok.lineno
                })()
                stack.append(sym)
                pos += 1

            elif action[0] == 'reduce':
                prod = action[1]
                plen = len(prod.syms)
                pslice = [type('S', (), {
                    'value': stack[-(plen-i)].value if plen > 0 else None,
                    'type': stack[-(plen-i)].type if plen > 0 else None,
                    'lineno': stack[-(plen-i)].lineno if plen > 0 else 0,
                })() for i in range(plen)] if plen > 0 else []

                # Prepend p[0] slot
                p0 = type('S', (), {'value': None, 'type': prod.name, 'lineno': 0})()
                pslice_full = [p0] + pslice

                if prod.func:
                    prod_obj = YaccProduction(stack, pslice_full)
                    try:
                        prod.func(prod_obj)
                        result = pslice_full[0].value
                    except Exception as e:
                        raise YaccError(f"Error in rule '{prod}': {e}")
                else:
                    result = pslice_full[1].value if plen > 0 else None

                if plen > 0:
                    stack = stack[:-plen]

                goto_state = self.table.goto.get((stack[-1].state, prod.name))
                if goto_state is None:
                    raise YaccError(f"No goto for ({stack[-1].state}, {prod.name})")

                new_sym = type('S', (), {
                    'state': goto_state, 'value': result,
                    'type': prod.name, 'lineno': 0
                })()
                stack.append(new_sym)

            elif action[0] == 'accept':
                return stack[-1].value


def yacc(module=None, debug=False, optimize=False, **kwargs):
    if module is None:
        frame = inspect.stack()[1][0]
        ns = type('NS', (), {})()
        ns.__dict__.update(frame.f_globals)
        ns.__dict__.update(frame.f_locals)
        module = ns

    tokens = list(getattr(module, 'tokens', []))
    # Add EOF
    tokens_set = set(tokens) | {'$end'}

    grammar = Grammar(tokens_set)

    # Collect p_ rules
    p_rules = []
    for name in dir(module):
        if name.startswith('p_') and name != 'p_error':
            func = getattr(module, name)
            if callable(func) and func.__doc__:
                p_rules.append((func.__code__.co_firstlineno, func))

    p_rules.sort(key=lambda x: x[0])

    for _, func in p_rules:
        doc = func.__doc__.strip()
        # Parse grammar rules from docstring
        # Format: "name : sym1 sym2 | sym3 sym4\n  | sym5"
        # Handle multi-line
        lines = doc.split('\n')
        full_doc = ' '.join(l.strip() for l in lines if l.strip())

        # Split on the first ':'
        if ':' not in full_doc:
            continue
        lhs, rhs_str = full_doc.split(':', 1)
        lhs = lhs.strip()
        alternatives = rhs_str.split('|')
        for alt in alternatives:
            syms = alt.strip().split()
            # Filter empty string ('empty' convention)
            if syms == ['empty'] or syms == ['']:
                syms = []
            grammar.add_production(lhs, syms, func if alt == alternatives[0] else _make_redirect(func, lhs, syms), func.__code__.co_firstlineno)

    grammar.compute_first()
    grammar.compute_follow()

    table = LRTable(grammar)

    p_error = getattr(module, 'p_error', None)

    class ParserWrapper:
        def __init__(self, g, t, err):
            self._parser = Parser(g, t)
            self._error = err
        def parse(self, input=None, lexer=None, debug=False, tracking=False, tokenfunc=None):
            if lexer is None:
                raise YaccError("Must provide a lexer")
            if input is not None:
                lexer.input(input)
            try:
                return self._parser.parse(lexer)
            except YaccError as e:
                if self._error:
                    tok = type('T', (), {'type': 'error', 'value': str(e), 'lineno': 0})()
                    self._error(tok)
                    return None
                raise

    return ParserWrapper(grammar, table, p_error)


def _make_redirect(func, name, syms):
    """For alternate productions (after |), same function handles all alternatives."""
    return func
