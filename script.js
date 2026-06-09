/**
 * CalcPro — Scientific Calculator
 * script.js — Core engine, no eval(), safe expression parser
 *
 * Architecture:
 *  - CalcEngine  : pure math engine (tokenizer → parser → evaluator)
 *  - CalcState   : immutable state manager
 *  - CalcUI      : DOM bindings and rendering
 *  - CalcHistory : history persistence (sessionStorage)
 *  - CalcMemory  : memory slots manager
 */

'use strict';

/* ════════════════════════════════════════════════════
   CALC ENGINE — Tokenizer + Recursive Descent Parser
   No eval(), full operator precedence, parentheses
   ════════════════════════════════════════════════════ */
const CalcEngine = (() => {

  // ── Tokenizer ──────────────────────────────────────
  const TOKEN = {
    NUMBER: 'NUMBER',
    PLUS: '+', MINUS: '-', STAR: '*', SLASH: '/',
    CARET: '^', PERCENT: '%',
    LPAREN: '(', RPAREN: ')',
    EOF: 'EOF',
  };

  function tokenize(expr) {
    const tokens = [];
    let i = 0;

    while (i < expr.length) {
      const ch = expr[i];

      if (/\s/.test(ch)) { i++; continue; }

      // Numbers (including scientific notation)
      if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(expr[i+1] ?? ''))) {
        let num = '';
        while (i < expr.length && /[0-9.]/.test(expr[i])) num += expr[i++];
        // Scientific notation: e.g. 1.5e-10
        if (i < expr.length && (expr[i] === 'e' || expr[i] === 'E')) {
          num += expr[i++];
          if (i < expr.length && (expr[i] === '+' || expr[i] === '-')) num += expr[i++];
          while (i < expr.length && /[0-9]/.test(expr[i])) num += expr[i++];
        }
        tokens.push({ type: TOKEN.NUMBER, value: parseFloat(num) });
        continue;
      }

      switch (ch) {
        case '+': tokens.push({ type: TOKEN.PLUS });    i++; break;
        case '-': tokens.push({ type: TOKEN.MINUS });   i++; break;
        case '*': tokens.push({ type: TOKEN.STAR });    i++; break;
        case '/': tokens.push({ type: TOKEN.SLASH });   i++; break;
        case '^': tokens.push({ type: TOKEN.CARET });   i++; break;
        case '%': tokens.push({ type: TOKEN.PERCENT }); i++; break;
        case '(': tokens.push({ type: TOKEN.LPAREN });  i++; break;
        case ')': tokens.push({ type: TOKEN.RPAREN });  i++; break;
        default:
          throw new Error(`Token inesperado: ${ch}`);
      }
    }

    tokens.push({ type: TOKEN.EOF });
    return tokens;
  }

  // ── Recursive Descent Parser ───────────────────────
  // Grammar:
  //   expr     → term (('+' | '-') term)*
  //   term     → factor (('*' | '/' | '%') factor)*
  //   factor   → base ('^' factor)?        (right-assoc)
  //   base     → '-'? primary
  //   primary  → NUMBER | '(' expr ')'
  function parse(tokens) {
    let pos = 0;

    const peek  = ()  => tokens[pos];
    const eat   = (t) => { const tok = tokens[pos++]; if (tok.type !== t) throw new Error('Parse error'); return tok; };
    const check = (t) => tokens[pos].type === t;

    function expr() {
      let left = term();
      while (check(TOKEN.PLUS) || check(TOKEN.MINUS)) {
        const op = tokens[pos++].type;
        const right = term();
        left = op === TOKEN.PLUS ? left + right : left - right;
      }
      return left;
    }

    function term() {
      let left = factor();
      while (check(TOKEN.STAR) || check(TOKEN.SLASH) || check(TOKEN.PERCENT)) {
        const op = tokens[pos++].type;
        const right = factor();
        if (op === TOKEN.STAR)   { left = left * right; continue; }
        if (op === TOKEN.SLASH)  {
          if (right === 0) throw new Error('Divisão por zero');
          left = left / right; continue;
        }
        if (op === TOKEN.PERCENT) { left = left % right; continue; }
      }
      return left;
    }

    function factor() {
      const base = unary();
      if (check(TOKEN.CARET)) {
        pos++;
        const exp = factor(); // right-associative
        return Math.pow(base, exp);
      }
      return base;
    }

    function unary() {
      if (check(TOKEN.MINUS)) {
        pos++;
        return -primary();
      }
      if (check(TOKEN.PLUS)) {
        pos++;
        return primary();
      }
      return primary();
    }

    function primary() {
      const tok = tokens[pos];
      if (tok.type === TOKEN.NUMBER) {
        pos++;
        return tok.value;
      }
      if (tok.type === TOKEN.LPAREN) {
        pos++;
        const val = expr();
        eat(TOKEN.RPAREN);
        return val;
      }
      throw new Error('Expressão inválida');
    }

    const result = expr();
    if (peek().type !== TOKEN.EOF) throw new Error('Expressão inválida');
    return result;
  }

  // ── Public API ─────────────────────────────────────
  /**
   * Evaluate a cleaned expression string.
   * @param {string} expression  — normalized expression
   * @returns {number}
   */
  function evaluate(expression) {
    const tokens = tokenize(expression);
    const result = parse(tokens);
    if (!isFinite(result)) throw new Error('Resultado indefinido');
    return result;
  }

  return { evaluate };
})();


/* ════════════════════════════════════════════════════
   CALC MEMORY
   ════════════════════════════════════════════════════ */
const CalcMemory = (() => {
  let _value = 0;
  let _hasValue = false;

  return {
    store(v) { _value = v; _hasValue = true; },
    add(v)   { _value += v; _hasValue = true; },
    sub(v)   { _value -= v; _hasValue = true; },
    recall() { return _hasValue ? _value : null; },
    clear()  { _value = 0; _hasValue = false; },
    hasValue() { return _hasValue; },
  };
})();


/* ════════════════════════════════════════════════════
   CALC HISTORY
   ════════════════════════════════════════════════════ */
const CalcHistory = (() => {
  const MAX_ITEMS = 50;
  const KEY = 'calcpro_history';

  function load() {
    try {
      return JSON.parse(sessionStorage.getItem(KEY) ?? '[]');
    } catch { return []; }
  }

  function save(items) {
    try { sessionStorage.setItem(KEY, JSON.stringify(items)); } catch {}
  }

  function push(expression, result) {
    const items = load();
    items.unshift({ expression, result, ts: Date.now() });
    if (items.length > MAX_ITEMS) items.length = MAX_ITEMS;
    save(items);
  }

  function clear() { save([]); }
  function getAll() { return load(); }

  return { push, clear, getAll };
})();


/* ════════════════════════════════════════════════════
   CALC STATE
   ════════════════════════════════════════════════════ */
const CalcState = (() => {
  let state = createInitialState();

  function createInitialState() {
    return {
      currentInput: '',   // raw string being built
      expression: '',     // display expression line (human-readable)
      result: '0',        // current displayed result
      operator: null,     // pending operator (+,-,*,/)
      prevValue: null,    // value before operator
      awaitingOperand: false,
      hasError: false,
      angleMode: 'RAD',   // 'RAD' | 'DEG'
      justEvaluated: false, // true right after pressing =
    };
  }

  return {
    get: () => ({ ...state }),
    set: (patch) => { state = { ...state, ...patch }; },
    reset: () => { state = createInitialState(); },
    getAngleMode: () => state.angleMode,
    toggleAngle: () => {
      state.angleMode = state.angleMode === 'RAD' ? 'DEG' : 'RAD';
      return state.angleMode;
    },
  };
})();


/* ════════════════════════════════════════════════════
   MAIN CONTROLLER
   ════════════════════════════════════════════════════ */
const Calculator = (() => {

  // ── Helpers ────────────────────────────────────────
  function toRad(deg) { return (deg * Math.PI) / 180; }
  function formatResult(n) {
    if (!isFinite(n)) return 'Erro';
    // Avoid floating-point noise like 0.10000000000001
    const s = parseFloat(n.toPrecision(12)).toString();
    // Scientific notation for very large/small numbers
    if (Math.abs(n) > 1e15 || (Math.abs(n) < 1e-10 && n !== 0)) {
      return n.toExponential(6);
    }
    return s;
  }

  function factorial(n) {
    n = Math.floor(n);
    if (n < 0)  throw new Error('Fatorial indefinido');
    if (n > 170) throw new Error('Estouro numérico');
    if (n === 0 || n === 1) return 1;
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
  }

  // Normalise human expression for the parser
  function normaliseExpr(expr) {
    return expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/π/g, String(Math.PI))
      .replace(/e(?!\d)/g, String(Math.E)); // 'e' constant, not exponent
  }

  // ── State shortcuts ────────────────────────────────
  const s = () => CalcState.get();
  const update = (p) => CalcState.set(p);

  // ── Input building ─────────────────────────────────
  function appendDigit(d) {
    let { currentInput, justEvaluated } = s();

    if (justEvaluated) {
      currentInput = '';
      update({ justEvaluated: false, expression: '' });
    }

    if (currentInput === '0' && d !== '.') {
      currentInput = d;
    } else {
      if (d === '.' && currentInput.includes('.')) return;
      currentInput += d;
    }

    update({ currentInput, result: currentInput, hasError: false });
  }

  function appendOperator(op) {
    const { currentInput, result, justEvaluated } = s();
    const val = justEvaluated ? parseFloat(result) : parseFloat(currentInput || result);

    // Replace last operator if no operand entered
    if (currentInput === '' && !justEvaluated) {
      update({ operator: op, expression: `${result} ${op}` });
      return;
    }

    update({
      prevValue: val,
      operator: op,
      currentInput: '',
      awaitingOperand: true,
      expression: `${formatResult(val)} ${op}`,
      justEvaluated: false,
      hasError: false,
    });
  }

  function calculate() {
    const { currentInput, operator, prevValue, result, justEvaluated } = s();
    if (operator === null && !justEvaluated) return;

    const rhs = currentInput !== '' ? parseFloat(currentInput) : parseFloat(result);
    const lhs = prevValue ?? parseFloat(result);
    const expr = `${formatResult(lhs)} ${operator} ${formatResult(rhs)}`;

    let res;
    try {
      const normalized = normaliseExpr(`(${lhs})${opToSymbol(operator)}(${rhs})`);
      res = CalcEngine.evaluate(normalized);
    } catch (e) {
      update({ result: e.message, hasError: true, currentInput: '' });
      return;
    }

    const formatted = formatResult(res);
    CalcHistory.push(expr, formatted);
    update({
      result: formatted,
      expression: `${expr} =`,
      currentInput: '',
      operator: null,
      prevValue: null,
      awaitingOperand: false,
      justEvaluated: true,
      hasError: false,
    });
  }

  function opToSymbol(op) {
    const map = { '+': '+', '−': '-', '×': '*', '÷': '/' };
    return map[op] ?? op;
  }

  // ── Scientific functions ────────────────────────────
  function applyUnary(fn) {
    const { result, currentInput, justEvaluated } = s();
    const val = parseFloat(currentInput !== '' ? currentInput : result);
    const mode = CalcState.getAngleMode();

    let res;
    let label;
    try {
      switch (fn) {
        case 'sin':
          res = Math.sin(mode === 'DEG' ? toRad(val) : val);
          label = `sin(${val})`;
          break;
        case 'cos':
          res = Math.cos(mode === 'DEG' ? toRad(val) : val);
          label = `cos(${val})`;
          break;
        case 'tan': {
          const rad = mode === 'DEG' ? toRad(val) : val;
          // tan is undefined at 90°, 270°, etc.
          const cosVal = Math.cos(rad);
          if (Math.abs(cosVal) < 1e-14) throw new Error('Tangente indefinida');
          res = Math.tan(rad);
          label = `tan(${val})`;
          break;
        }
        case 'asin':
          if (val < -1 || val > 1) throw new Error('Domínio inválido');
          res = mode === 'DEG' ? (Math.asin(val) * 180) / Math.PI : Math.asin(val);
          label = `sin⁻¹(${val})`;
          break;
        case 'acos':
          if (val < -1 || val > 1) throw new Error('Domínio inválido');
          res = mode === 'DEG' ? (Math.acos(val) * 180) / Math.PI : Math.acos(val);
          label = `cos⁻¹(${val})`;
          break;
        case 'atan':
          res = mode === 'DEG' ? (Math.atan(val) * 180) / Math.PI : Math.atan(val);
          label = `tan⁻¹(${val})`;
          break;
        case 'log':
          if (val <= 0) throw new Error('Logaritmo inválido');
          res = Math.log10(val);
          label = `log(${val})`;
          break;
        case 'ln':
          if (val <= 0) throw new Error('Logaritmo inválido');
          res = Math.log(val);
          label = `ln(${val})`;
          break;
        case 'exp':
          res = Math.exp(val);
          label = `e^(${val})`;
          break;
        case 'sqrt':
          if (val < 0) throw new Error('Raiz de negativo');
          res = Math.sqrt(val);
          label = `√(${val})`;
          break;
        case 'cbrt':
          res = Math.cbrt(val);
          label = `∛(${val})`;
          break;
        case 'abs':
          res = Math.abs(val);
          label = `|${val}|`;
          break;
        case 'factorial':
          res = factorial(val);
          label = `${val}!`;
          break;
        case 'square':
          res = val * val;
          label = `(${val})²`;
          break;
        default:
          throw new Error('Função desconhecida');
      }
    } catch (e) {
      update({ result: e.message, hasError: true, currentInput: '' });
      return;
    }

    const formatted = formatResult(res);
    CalcHistory.push(label, formatted);
    update({
      result: formatted,
      expression: `${label} =`,
      currentInput: '',
      justEvaluated: true,
      hasError: false,
      operator: null,
      prevValue: null,
    });
  }

  // Power: chains as operator
  function applyPower() {
    appendOperator('^');
    CalcState.set({ expression: s().expression.replace('^', 'yˣ') });
    CalcState.set({ operator: '^' });
  }

  // ── Parentheses (append to expression string) ──────
  // For simplicity, we support full expression entry via
  // the expression string evaluated as a whole.
  let parenExpression = '';
  let usingParenMode = false;

  function resetParenMode() {
    parenExpression = '';
    usingParenMode = false;
  }

  function openParen() {
    usingParenMode = true;
    const { currentInput } = s();
    parenExpression += currentInput + '(';
    update({ currentInput: '', expression: parenExpression, hasError: false });
  }

  function closeParen() {
    if (!usingParenMode) return;
    const { currentInput } = s();
    parenExpression += currentInput + ')';
    update({ currentInput: '', expression: parenExpression });
    // Auto-evaluate if all parens closed
    const opens  = (parenExpression.match(/\(/g) || []).length;
    const closes = (parenExpression.match(/\)/g) || []).length;
    if (opens === closes) evaluateParenExpr();
  }

  function evaluateParenExpr() {
    try {
      const normalized = normaliseExpr(parenExpression);
      const res = CalcEngine.evaluate(normalized);
      const formatted = formatResult(res);
      CalcHistory.push(parenExpression, formatted);
      update({
        result: formatted,
        expression: `${parenExpression} =`,
        currentInput: '',
        justEvaluated: true,
        hasError: false,
      });
    } catch (e) {
      update({ result: e.message, hasError: true });
    }
    resetParenMode();
  }

  // ── Constants ──────────────────────────────────────
  function insertConstant(name) {
    const map = { pi: Math.PI, euler: Math.E };
    const val = formatResult(map[name]);
    update({ currentInput: val, result: val, justEvaluated: false, hasError: false });
  }

  // ── AC / Backspace ─────────────────────────────────
  function clearAll() {
    CalcState.reset();
    resetParenMode();
    update({ result: '0' });
  }

  function backspace() {
    let { currentInput, result } = s();
    if (currentInput.length > 0) {
      currentInput = currentInput.slice(0, -1);
      update({ currentInput, result: currentInput || '0' });
    }
  }

  function toggleSign() {
    let { currentInput, result } = s();
    const val = currentInput || result;
    const neg = val.startsWith('-') ? val.slice(1) : '-' + val;
    update({ currentInput: neg, result: neg });
  }

  function percent() {
    const { currentInput, result, prevValue, operator } = s();
    let val = parseFloat(currentInput || result);
    let res;
    if (operator && prevValue !== null) {
      // 200 + 10% → 200 + 20
      res = (prevValue * val) / 100;
    } else {
      res = val / 100;
    }
    const formatted = formatResult(res);
    update({ currentInput: formatted, result: formatted });
  }

  // ── Memory ─────────────────────────────────────────
  function memoryAction(action) {
    const { result, currentInput } = s();
    const val = parseFloat(currentInput || result);
    switch (action) {
      case 'mc':      CalcMemory.clear(); break;
      case 'mr': {
        const r = CalcMemory.recall();
        if (r !== null) {
          const f = formatResult(r);
          update({ currentInput: f, result: f });
        }
        break;
      }
      case 'm-plus':  CalcMemory.add(val); break;
      case 'm-minus': CalcMemory.sub(val); break;
    }
  }

  return {
    appendDigit,
    appendOperator,
    calculate,
    applyUnary,
    applyPower,
    openParen,
    closeParen,
    insertConstant,
    clearAll,
    backspace,
    toggleSign,
    percent,
    memoryAction,
  };
})();


/* ════════════════════════════════════════════════════
   UI CONTROLLER
   ════════════════════════════════════════════════════ */
const CalcUI = (() => {

  // ── Element refs ────────────────────────────────────
  const $result      = document.getElementById('displayResult');
  const $expression  = document.getElementById('displayExpression');
  const $angleBadge  = document.getElementById('angleModeBadge');
  const $angleBtn    = document.getElementById('angleModeBtn');
  const $memInds     = document.getElementById('memoryIndicators');
  const $histPanel   = document.getElementById('historyPanel');
  const $histList    = document.getElementById('historyList');
  const $toggleHist  = document.getElementById('toggleHistory');
  const $clearHist   = document.getElementById('clearHistory');
  const $copyBtn     = document.getElementById('copyBtn');
  const $kbModal     = document.getElementById('keyboardModal');
  const $toggleKb    = document.getElementById('toggleKeyboard');
  const $closeModal  = document.getElementById('closeModal');
  const $toast       = document.getElementById('toast');

  // ── Render state ───────────────────────────────────
  function render() {
    const { result, expression, hasError, angleMode } = CalcState.get();

    $result.textContent = result;
    $result.className = 'display-result' + (hasError ? ' error' : '');
    $expression.textContent = expression;

    // Angle mode UI
    $angleBadge.textContent = angleMode;
    $angleBadge.className = 'angle-mode-badge' + (angleMode === 'DEG' ? ' deg' : '');
    $angleBtn.textContent = angleMode === 'DEG' ? 'RAD' : 'DEG'; // shows what it'll switch TO
    $angleBtn.className = 'btn btn-mode' + (angleMode === 'DEG' ? ' deg-active' : '');

    // Memory indicators
    $memInds.innerHTML = CalcMemory.hasValue()
      ? '<span class="mem-dot">M</span>'
      : '';

    // Active operator highlight
    document.querySelectorAll('.btn-operator').forEach(b => {
      b.classList.toggle('active', b.dataset.value === CalcState.get().operator);
    });

    // Font size adaptation for long numbers
    const len = result.length;
    if (len > 18)      $result.style.fontSize = '1.2rem';
    else if (len > 14) $result.style.fontSize = '1.6rem';
    else if (len > 10) $result.style.fontSize = '2rem';
    else               $result.style.fontSize = '';
  }

  function popResult() {
    $result.classList.remove('pop');
    void $result.offsetWidth; // reflow
    $result.classList.add('pop');
  }

  // ── History UI ─────────────────────────────────────
  function renderHistory() {
    const items = CalcHistory.getAll();
    if (items.length === 0) {
      $histList.innerHTML = '<li class="history-empty">Nenhum cálculo ainda</li>';
      return;
    }
    $histList.innerHTML = items.map((item, i) => `
      <li class="history-item" data-result="${escapeHtml(item.result)}" tabindex="0"
          role="button" aria-label="${escapeHtml(item.expression)} = ${escapeHtml(item.result)}">
        <div class="history-expr">${escapeHtml(item.expression)}</div>
        <div class="history-res">${escapeHtml(item.result)}</div>
      </li>
    `).join('');

    // Clicking a history item restores the result
    $histList.querySelectorAll('.history-item').forEach(el => {
      const activate = () => {
        const res = el.dataset.result;
        CalcState.set({ currentInput: res, result: res, justEvaluated: true });
        render();
      };
      el.addEventListener('click', activate);
      el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') activate(); });
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Toast ──────────────────────────────────────────
  let toastTimer;
  function showToast(msg, duration = 1800) {
    clearTimeout(toastTimer);
    $toast.textContent = msg;
    $toast.classList.add('show');
    toastTimer = setTimeout(() => $toast.classList.remove('show'), duration);
  }

  // ── Copy ───────────────────────────────────────────
  async function copyResult() {
    const { result } = CalcState.get();
    try {
      await navigator.clipboard.writeText(result);
      showToast('✓ Copiado!');
    } catch {
      showToast('Copie manualmente: ' + result, 3000);
    }
  }

  // ── Button dispatch ────────────────────────────────
  function dispatch(action, value) {
    switch (action) {
      case 'digit':       Calculator.appendDigit(value);       break;
      case 'decimal':     Calculator.appendDigit('.');          break;
      case 'operator':    Calculator.appendOperator(value);     break;
      case 'equals':      Calculator.calculate(); popResult();  break;
      case 'ac':          Calculator.clearAll();                break;
      case 'backspace':   Calculator.backspace();               break;
      case 'toggleSign':  Calculator.toggleSign();              break;
      case 'percent':     Calculator.percent();                 break;
      case 'pow':         Calculator.applyPower();              break;
      case 'paren-open':  Calculator.openParen();               break;
      case 'paren-close': Calculator.closeParen();              break;
      case 'pi':          Calculator.insertConstant('pi');      break;
      case 'euler':       Calculator.insertConstant('euler');   break;
      case 'mc': case 'mr': case 'm-plus': case 'm-minus':
        Calculator.memoryAction(action); break;
      case 'toggleAngle': {
        const mode = CalcState.toggleAngle();
        showToast(mode === 'DEG' ? '📐 Graus' : '📐 Radianos');
        break;
      }
      // Unary scientific functions
      case 'sin': case 'cos': case 'tan':
      case 'asin': case 'acos': case 'atan':
      case 'log': case 'ln': case 'exp':
      case 'sqrt': case 'cbrt': case 'abs':
      case 'factorial': case 'square':
        Calculator.applyUnary(action); break;
    }
    render();
    if (['equals','sin','cos','tan','asin','acos','atan','log','ln',
         'exp','sqrt','cbrt','abs','factorial','square','pow'].includes(action)) {
      renderHistory();
    }
  }

  // ── Button click listener ──────────────────────────
  function initButtons() {
    document.querySelector('.button-grid').addEventListener('click', e => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      dispatch(btn.dataset.action, btn.dataset.value);
    });
  }

  // ── Physical keyboard ──────────────────────────────
  function initKeyboard() {
    document.addEventListener('keydown', e => {
      // Don't intercept when modal is open
      if ($kbModal.classList.contains('open')) {
        if (e.key === 'Escape') closeKbModal();
        return;
      }

      // Prevent browser shortcuts from interfering
      if (['/', '*'].includes(e.key)) e.preventDefault();

      const keyMap = {
        '0':'0','1':'1','2':'2','3':'3','4':'4',
        '5':'5','6':'6','7':'7','8':'8','9':'9',
      };

      if (keyMap[e.key] !== undefined && !e.ctrlKey && !e.metaKey && !e.altKey) {
        dispatch('digit', keyMap[e.key]);
      } else if (e.key === '.') {
        dispatch('decimal');
      } else if (e.key === '+') {
        dispatch('operator', '+');
      } else if (e.key === '-') {
        dispatch('operator', '−');
      } else if (e.key === '*') {
        dispatch('operator', '×');
      } else if (e.key === '/') {
        dispatch('operator', '÷');
      } else if (e.key === 'Enter' || e.key === '=') {
        dispatch('equals');
      } else if (e.key === 'Backspace') {
        dispatch('backspace');
      } else if (e.key === 'Escape') {
        dispatch('ac');
      } else if (e.key === '%') {
        dispatch('percent');
      } else if (e.key === '(') {
        dispatch('paren-open');
      } else if (e.key === ')') {
        dispatch('paren-close');
      } else if (e.key === 's' && !e.ctrlKey) {
        dispatch('sin');
      } else if (e.key === 'c' && !e.ctrlKey) {
        dispatch('cos');
      } else if (e.key === 't' && !e.ctrlKey) {
        dispatch('tan');
      } else if (e.key === 'l' && !e.ctrlKey) {
        dispatch('log');
      } else if (e.key === 'n' && !e.ctrlKey) {
        dispatch('ln');
      } else if (e.key === 'r' && !e.ctrlKey) {
        dispatch('sqrt');
      } else if (e.key === 'p' && !e.ctrlKey) {
        dispatch('pi');
      }
    });
  }

  // ── Panel & modal toggles ──────────────────────────
  function openKbModal()  { $kbModal.classList.add('open'); $toggleKb.classList.add('active'); }
  function closeKbModal() { $kbModal.classList.remove('open'); $toggleKb.classList.remove('active'); }

  function initToggles() {
    // History panel
    $toggleHist.addEventListener('click', () => {
      const open = $histPanel.classList.toggle('open');
      $toggleHist.classList.toggle('active', open);
      if (open) renderHistory();
    });

    $clearHist.addEventListener('click', () => {
      CalcHistory.clear();
      renderHistory();
      showToast('Histórico apagado');
    });

    // Keyboard modal
    $toggleKb.addEventListener('click', openKbModal);
    $closeModal.addEventListener('click', closeKbModal);
    $kbModal.addEventListener('click', e => { if (e.target === $kbModal) closeKbModal(); });

    // Copy button
    $copyBtn.addEventListener('click', copyResult);
  }

  // ── Init ───────────────────────────────────────────
  function init() {
    initButtons();
    initKeyboard();
    initToggles();
    render();
  }

  return { init };
})();


/* ════════════════════════════════════════════════════
   BOOTSTRAP
   ════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  CalcUI.init();
});