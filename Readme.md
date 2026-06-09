# ⟨/⟩ CalcPro — Calculadora Científica

<div align="center">

![CalcPro Banner](assets/banner.png)

**Calculadora Científica Profissional** | HTML5 · CSS3 · JavaScript Puro

[![License: MIT](https://img.shields.io/badge/License-MIT-e94560.svg?style=flat-square)](LICENSE)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Zero Dependencies](https://img.shields.io/badge/deps-zero-2ec27e?style=flat-square)

[Demo ao Vivo](#) · [Reportar Bug](../../issues) · [Solicitar Feature](../../issues)

</div>

---

## 📋 Sobre o Projeto

CalcPro é uma **calculadora científica de alta precisão** construída do zero com HTML5, CSS3 e JavaScript puro — sem frameworks, sem bibliotecas, sem `eval()`. O motor matemático é um parser de expressões escrito à mão (tokenizador + parser de descida recursiva), garantindo segurança e performance.

O design segue um padrão **Dark Mode premium**, com tipografia dupla (`JetBrains Mono` para o display, `Inter` para controles), acentos em vermelho-coral e azul elétrico, e um glow sutil no resultado que é a assinatura visual do projeto.

---

## ✨ Recursos

### 🔢 Operações Básicas
- Soma, subtração, multiplicação, divisão
- Porcentagem contextual (ex: `200 + 10%` → `220`)
- Inversão de sinal (+/−)
- Ponto decimal
- Limpar tudo (AC) e apagar último caractere (⌫)

### 🔬 Funções Científicas
| Função | Descrição |
|--------|-----------|
| `sin` `cos` `tan` | Trigonometria (graus ou radianos) |
| `sin⁻¹` `cos⁻¹` `tan⁻¹` | Trigonometria inversa |
| `log` | Logaritmo base 10 |
| `ln` | Logaritmo natural |
| `eˣ` | Exponencial |
| `√x` `∛x` | Raiz quadrada e cúbica |
| `x²` `xʸ` | Quadrado e potência |
| `\|x\|` | Valor absoluto |
| `x!` | Fatorial (até 170) |
| `π` `e` | Constantes matemáticas |

### 🧠 Recursos Avançados
- **Histórico de operações** — painel lateral com os últimos 50 cálculos clicáveis
- **Memória** — M+, M−, MR, MC com indicador visual no display
- **Teclado físico** — atalhos para todas as operações principais
- **Alternância DEG/RAD** — com indicador no display
- **Parênteses** — suporte a expressões com `(` `)`
- **Notação científica** — display inteligente para números muito grandes/pequenos
- **Copiar resultado** — botão de clipboard no display
- **Validação de erros** — divisão por zero, domínio inválido, fatorial de negativo, etc.
- **Responsivo** — desktop, tablet e celular
- **Acessível** — `aria-label`, `aria-live`, navegação por teclado, `prefers-reduced-motion`

---

## 🚀 Como Executar

### Opção 1 — Direto no navegador
```bash
# Clone o repositório
git clone https://github.com/seu-usuario/scientific-calculator.git

# Entre na pasta
cd scientific-calculator

# Abra o arquivo principal
open index.html        # macOS
start index.html       # Windows
xdg-open index.html    # Linux
```

### Opção 2 — Servidor local (recomendado)
```bash
# Com Python
python -m http.server 8080

# Com Node.js (npx)
npx serve .

# Acesse em http://localhost:8080
```

---

## ⌨️ Atalhos de Teclado

| Tecla | Ação |
|-------|------|
| `0–9` | Dígitos |
| `+` `-` `*` `/` | Operadores |
| `Enter` ou `=` | Calcular |
| `Backspace` | Apagar |
| `Escape` | Limpar tudo |
| `.` | Ponto decimal |
| `%` | Porcentagem |
| `(` `)` | Parênteses |
| `s` | sin |
| `c` | cos |
| `t` | tan |
| `l` | log |
| `n` | ln |
| `r` | √x |
| `p` | π |

---

## 📁 Estrutura do Projeto

```
scientific-calculator/
│
├── index.html          # Markup semântico, acessível
├── css/
│   └── style.css       # Design tokens, dark theme, responsivo
├── js/
│   └── script.js       # Engine (tokenizer+parser), state, UI
├── assets/
│   └── banner.png      # Imagem de preview
│
├── README.md
├── LICENSE
└── .gitignore
```

### Arquitetura do JavaScript

```
script.js
├── CalcEngine     — tokenizador + parser de descida recursiva (sem eval)
├── CalcMemory     — slots de memória (M+, M-, MR, MC)
├── CalcHistory    — persistência em sessionStorage
├── CalcState      — gerenciador de estado imutável
├── Calculator     — lógica de entrada e operações científicas
└── CalcUI         — bindings DOM, render, teclado, toasts
```

---

## 🛠️ Tecnologias

- **HTML5** — Semântica, acessibilidade (`aria-*`, roles, live regions)
- **CSS3** — Custom properties (design tokens), Grid, Flexbox, animações
- **JavaScript ES2022** — Módulos IIFE, closures, sem dependências externas
- **Google Fonts** — JetBrains Mono + Inter

---

## 📸 Screenshots

> *(adicione suas capturas de tela aqui)*

| Desktop | Mobile |
|---------|--------|
| ![Desktop](assets/screenshot-desktop.png) | ![Mobile](assets/screenshot-mobile.png) |

---

## 📄 Licença

Distribuído sob a licença **MIT**. Veja [`LICENSE`](LICENSE) para mais detalhes.

---

## 👤 Créditos

Desenvolvido com atenção aos detalhes de UX, performance e qualidade de código.

- Design inspirado em calculadoras científicas modernas e interfaces premium
- Parser matemático implementado manualmente (tokenizer + recursive descent)
- Tipografia: [JetBrains Mono](https://www.jetbrains.com/lp/mono/) + [Inter](https://rsms.me/inter/)

---

<div align="center">

Feito com ❤️ e muito JavaScript puro

⭐ Se este projeto te ajudou, considere dar uma estrela no GitHub!

</div>