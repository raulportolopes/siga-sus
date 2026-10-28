# SIGA-SUS

Site que lê o PDF do prontuário (por regras, sem IA, tudo no navegador), conta os procedimentos por dia e monta o espelho da AIH com códigos SIGTAP 08/2026. Publicado em https://siga-sus.magox.tech pelo GitHub Pages (branch `main`, raiz). O dono do projeto não é programador: responda em português e explique passo a passo.

## Como mudar

- `index.html` da raiz é **gerado**. Nunca edite à mão: mude `fonte/` e rode `python fonte/build.py` (no Windows: `py fonte\build.py`).
- `fonte/leitor.js` tem as regras de leitura; `fonte/app.js` as telas; `fonte/base_v1.html` layout e textos; `fonte/build.py` junta tudo. Detalhes em `fonte/LEIA-ME.md`.
- Publicar: `git add -A`, `git commit -m "..."`, `git push`. O site atualiza em cerca de 1 minuto.

## Testar antes de publicar

Abra o `index.html` no navegador e envie os PDFs de `fonte/ficticios/`. Totais esperados no espelho:

| PDF | Total |
|---|---|
| 01_antonio | R$ 582,42 |
| 02_lucia | R$ 2.094,40 |
| 03_roberto_obito | R$ 2.599,51 (desfecho Óbito) |
| 04_francisca_alertas | R$ 582,42, com alerta de folha 04 faltando e total de O2 diferente |

Os exemplos de `fonte/exemplos/` (Maria e José) também aparecem no próprio site e não podem mudar de resultado sem motivo.

## Regras que não podem quebrar

- Nada de lookbehind em regex (`(?<=`, `(?<!`): o Safari do iPad/iPhone antes do iOS 16.4 deixa o site inteiro em branco.
- `\b` não funciona antes de letra acentuada; use um grupo de letras como em `leitor.js`.
- pdf.js 3.11.174 da build `legacy` (cdn.jsdelivr.net). O site precisa de doctype e viewport (o `build.py` já põe).
- Prontuário é dado de saúde (LGPD). A cópia do PDF só vai para o Google Drive quando a pessoa clica em **Guardar cópia**; nunca enviar ou guardar sem esse clique. Nunca colocar prontuário de paciente real no repositório, só fictícios.
