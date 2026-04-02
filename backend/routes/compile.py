from flask import Blueprint, request, jsonify
from datetime import datetime
import traceback

compile_bp = Blueprint('compile', __name__)

history_store = []

@compile_bp.route('/compile', methods=['POST'])
def compile_code():
    data = request.get_json()
    code = data.get('code', '')
    options = data.get('options', {})
    gen_asm = options.get('assembly', True)
    gen_mc  = options.get('machine_code', True)
    gen_exec = options.get('execute', True)
    stdin_input = data.get('stdin', '')

    result = {
        'tokens': [], 'ast': None,
        'ir': '', 'assembly': '', 'machine_code': [],
        'output': '', 'c_source': '',
        'errors': [], 'warnings': [],
        'stats': {}
    }

    import time
    t0 = time.time()

    try:
        # ── Stage 1: Lex ─────────────────────────────────────────────────
        from compiler.lexer import tokenize
        tokens, lex_errors = tokenize(code)
        result['tokens'] = tokens
        if lex_errors:
            result['errors'].extend(lex_errors)

        # ── Stage 2: Parse ───────────────────────────────────────────────
        from compiler.parser import parse
        ast, parse_errors = parse(tokens)
        result['ast'] = ast
        if parse_errors:
            result['errors'].extend(parse_errors)

        # ── Stage 3: Semantic Analysis ───────────────────────────────────
        sem_diags = []
        if ast:
            from compiler.semantic import analyze
            sem_diags = analyze(ast)
            errors = [d for d in sem_diags if '[ERROR]' in d]
            warnings = [d for d in sem_diags if '[WARNING]' in d]
            result['errors'].extend(errors)
            result['warnings'].extend(warnings)

        # ── Stage 4: Reconstruct C source ────────────────────────────────
        c_src = code  # use original source for GCC stages
        if ast:
            try:
                from compiler.codegen import CGenerator
                c_src = CGenerator().generate(ast)
                result['c_source'] = c_src
            except:
                result['c_source'] = code

        has_fatal = any('[ERROR]' in e or 'Syntax error' in e or 'error' in e.lower()
                        for e in result['errors'])

        # ── Stage 5: LLVM IR ─────────────────────────────────────────────
        if ast and not has_fatal:
            try:
                from compiler.llvm_ir import generate_ir_from_c
                result['ir'] = generate_ir_from_c(c_src)
            except Exception as e:
                result['ir'] = f'; IR error: {e}'

        # ── Stage 6: Assembly (GCC) ──────────────────────────────────────
        if gen_asm and not has_fatal:
            try:
                from compiler.codegen import generate_assembly
                asm, asm_err = generate_assembly(c_src, intel_syntax=True)
                if asm:
                    result['assembly'] = asm
                elif asm_err:
                    result['warnings'].append(f'Assembly: {asm_err[:300]}')
            except Exception as e:
                result['warnings'].append(f'Assembly generation failed: {e}')

        # ── Stage 7: Machine Code (objdump) ──────────────────────────────
        if gen_mc and not has_fatal:
            try:
                from compiler.codegen import generate_machine_code
                mc, mc_err = generate_machine_code(c_src)
                if mc:
                    result['machine_code'] = mc
                elif mc_err:
                    result['warnings'].append(f'Machine code: {mc_err[:300]}')
            except Exception as e:
                result['warnings'].append(f'Machine code generation failed: {e}')

        # ── Stage 8: Execute ─────────────────────────────────────────────
        if gen_exec and not has_fatal:
            try:
                from compiler.codegen import execute_program
                output, exec_err = execute_program(c_src, stdin_input)
                if output:
                    result['output'] = output
                elif exec_err:
                    result['errors'].append(f'Execution: {exec_err}')
            except Exception as e:
                result['errors'].append(f'Execution failed: {e}')

        # ── Stats ─────────────────────────────────────────────────────────
        elapsed = round((time.time() - t0) * 1000, 1)
        result['stats'] = {
            'elapsed_ms': elapsed,
            'token_count': len(tokens),
            'error_count': len(result['errors']),
            'warning_count': len(result['warnings']),
            'has_ir': bool(result['ir']),
            'has_asm': bool(result['assembly']),
            'has_mc': bool(result['machine_code']),
        }

        # ── History ───────────────────────────────────────────────────────
        entry = {
            'id': len(history_store) + 1,
            'code': code,
            'timestamp': datetime.utcnow().isoformat(),
            'stats': result['stats'],
        }
        history_store.append(entry)
        if len(history_store) > 100:
            history_store.pop(0)

    except Exception as e:
        result['errors'].append(f'Internal error: {str(e)}')
        result['errors'].append(traceback.format_exc()[:1000])

    return jsonify(result)


@compile_bp.route('/history', methods=['GET'])
def get_history():
    return jsonify(list(reversed(history_store)))

@compile_bp.route('/history/<int:entry_id>', methods=['GET'])
def get_history_entry(entry_id):
    for e in history_store:
        if e['id'] == entry_id:
            return jsonify(e)
    return jsonify({'error': 'Not found'}), 404
