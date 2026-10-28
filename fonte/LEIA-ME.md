# SIGA-SUS: como atualizar o sistema

O site publicado em https://siga-sus.magox.tech é o arquivo `index.html` da raiz deste repositório. Ele é **gerado**: não edite o `index.html` à mão. Mude os arquivos desta pasta `fonte/` e gere de novo.

## O que tem nesta pasta

| Arquivo | Para que serve |
|---|---|
| `leitor.js` | Regras de leitura do prontuário (o que conta, como conta, código SIGTAP) |
| `app.js` | Telas: envio do PDF, tela de carregamento, espelho da AIH, mapa diário, rastreio |
| `base_v1.html` | Layout, cores e textos fixos |
| `build.py` | Junta tudo e gera o site |
| `sigtap_202608.json` | Tabela SIGTAP 08/2026 (DATASUS, 5.023 procedimentos). Valores em centavos: código, nome, SH, SA, SP, média de permanência |
| `paginas_maria.json`, `paginas_jose.json` | Texto dos 2 prontuários de exemplo que aparecem no site |
| `copias_url.txt` | Endereço do Google Apps Script que recebe as cópias **autorizadas**. Apagar este arquivo desliga a pergunta "Guardar uma cópia?" |
| `copias/salvar-copias.gs` | Código do Google Apps Script que grava as cópias na pasta do Google Drive |
| `exemplos/`, `ficticios/` | PDFs para testar. Os de `ficticios/` são de pacientes inventados; `gera_ficticios.py` cria mais |

## Atualizar de outro computador

Precisa de **Git** e **Python 3** instalados.

1. Baixe o projeto: `git clone https://github.com/raulportolopes/siga-sus.git`
2. Mude o que precisar dentro de `fonte/`
3. Gere o site: `python3 fonte/build.py` (no Windows: `py fonte\build.py`)
4. Abra o `index.html` no navegador e teste com os PDFs de `fonte/ficticios/`
5. Publique: `git add -A`, depois `git commit -m "o que mudou"` e `git push`. Em cerca de 1 minuto o site atualiza

Sem Git: baixe o `.zip` do Google Drive, faça os passos 2 a 4 e envie o `index.html` novo pelo site do GitHub (no repositório, **Add file** e depois **Upload files**).

## Cuidados que já deram problema

- **Nada de lookbehind** nas expressões regulares (`(?<=` ou `(?<!`). O Safari do iPad e do iPhone antes do iOS 16.4 não entende, e o site inteiro fica em branco.
- `\b` não funciona antes de letra acentuada (`ÓBITO`). Use um grupo com letras, como em `leitor.js`.
- O pdf.js vem da versão `legacy` (cdn.jsdelivr.net) porque a versão normal não roda em iPad antigo.
- A cópia do prontuário só pode ser enviada quando a pessoa clica em **Guardar cópia**. A tela de privacidade promete isso.
