import json,sys,os
# Gera o site do SIGA-SUS a partir dos arquivos desta pasta.
# Uso: python3 build.py            -> grava ../index.html (site) e prontuai.html (versão do protótipo no Claude)
#      python3 build.py A.html B.html -> grava a versão do Claude em A.html e o site em B.html
AQUI=os.path.dirname(os.path.abspath(__file__))
os.chdir(AQUI)
if len(sys.argv)<3: sys.argv=[sys.argv[0],'prontuai.html',os.path.join('..','index.html')]
base=open('base_v1.html',encoding='utf-8').read()
head=base[:base.index('<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js')]
def rep(a,b):
    global head
    assert head.count(a)==1,(a[:70],head.count(a)); head=head.replace(a,b)
rep('<title>ProntuAI Faturamento SUS</title>','<title>SIGA-SUS Faturamento</title>')
rep('<div><b>ProntuAI</b><small>Faturamento hospitalar SUS · AIH</small></div>','<div><b>SIGA-SUS</b><small>Leitura de prontuário e faturamento AIH</small></div>')
rep('Nada fica gravado</b>\n      Os prontuários ficam só na memória desta tela. Ao fechar, tudo é descartado.','Tudo roda no seu computador</b>\n      O PDF é lido aqui mesmo, sem enviar nada para servidor. Ao fechar, tudo é descartado.')
rep('<p>Arraste o PDF que veio do SAME ou clique para escolher. A IA lê todas as folhas, conta cada procedimento por dia e monta o espelho da AIH com os códigos SIGTAP.</p>',
    '<p>Arraste o PDF que veio do SAME ou clique para escolher. O leitor reconhece o padrão do prontuário (datas, horários, listas e totais), conta cada procedimento por dia e monta o espelho da AIH com os códigos SIGTAP.</p>')
rep('<b>A IA lê e soma</b>','<b>O leitor soma</b>')
rep('<h3>Prontuários de exemplo</h3><span class="selo">já processados</span>','<h3>Prontuários de exemplo</h3><span class="selo">lidos pelo mesmo leitor</span>')
# SIGTAP table header + rules panel
rep('<div class="tabela-rola"><table><thead><tr><th>Código</th><th>Procedimento</th><th class="r">Valor</th></tr></thead><tbody id="tb-sigtap"></tbody></table></div>\n        <div class="rodape-tab" id="rodape-sigtap"></div>\n      </div>',
    '<div class="tabela-rola"><table><thead><tr><th>Código</th><th>Procedimento</th><th class="r">Hospitalar (SH)</th><th class="r">Profissional (SP)</th><th class="r">Ambulatorial (SA)</th></tr></thead><tbody id="tb-sigtap"></tbody></table></div>\n        <div class="rodape-tab" id="rodape-sigtap"></div>\n      </div>\n      <div class="painel">\n        <div class="painel-cab"><h3>Regras de leitura</h3><span class="selo">o que o leitor procura em cada linha</span></div>\n        <div class="tabela-rola"><table><thead><tr><th>Procedimento</th><th>Código SIGTAP</th><th>Como conta</th><th>Palavras que reconhece</th></tr></thead><tbody id="tb-regras"></tbody></table></div>\n      </div>')
rep('accept=".txt,.csv,text/plain,text/csv"','accept=".zip,.txt,.csv,application/zip,text/plain,text/csv"')
rep('<button class="btn" id="restaurar-sigtap" hidden>Voltar ao exemplo</button>','<button class="btn" id="restaurar-sigtap" hidden>Voltar à tabela 08/2026</button>')
# LGPD
i=head.index('<p>O PDF é aberto dentro do seu navegador.'); j=head.index('<h3>Responsabilidade do faturista</h3>')
head=head[:i]+'''<p>O PDF é aberto e lido dentro do seu navegador, pelo próprio computador do faturista. Nenhum arquivo, texto ou resultado é enviado para servidor, nem para inteligência artificial.</p>
        <p>Os prontuários aparecem na lista "Prontuários da sessão" apenas enquanto a tela estiver aberta. O botão "Descartar" apaga um prontuário na hora, e fechar a página apaga todos.</p>
        <h3>O que fica salvo</h3>
        <p>Só a tabela SIGTAP importada, que é pública, fica guardada neste navegador para não precisar importar de novo.</p>
        <h3>Como a leitura funciona</h3>
        <p>O leitor segue o padrão do prontuário: cabeçalho do paciente, datas do dia, horários, listas com marcadores e linhas de resumo como "6 Aferições de Pressão Arterial". Cada regra está na tela Tabela SIGTAP, e cada número do espelho aparece na aba Rastreio com o trecho e a página de onde veio.</p>
        '''+head[j:]
rep('<p>A IA faz a contagem e sugere os códigos. A conferência e o lançamento no sistema de faturamento continuam com o faturista, que marca cada linha conferida antes de exportar.</p>',
    '<p>O leitor faz a contagem e sugere os códigos. A conferência e o lançamento no sistema de faturamento continuam com o faturista, que marca cada linha conferida antes de exportar.</p>\n        <p style="color:var(--ink-3);font-size:13.5px">SIGA-SUS é um protótipo independente e não é um sistema oficial do Ministério da Saúde. Tabela SIGTAP: dados públicos do DATASUS.</p>')
# extra CSS
rep('.toast{position:fixed','''.rast-intro{margin:0;padding:14px 18px 6px;color:var(--ink-2);max-width:80ch}
.rast-sub{font-size:14px;padding:18px 18px 8px;color:var(--ink-2)}
td.trecho{color:var(--ink);min-width:260px;line-height:1.35}
.regra-pal{font-family:var(--f-mono);font-size:12px;color:var(--ink-2);line-height:1.5;min-width:220px}
.nota-valor{flex-basis:100%;font-size:12.5px;color:var(--ink-3)}
.sem-valor{display:inline-block;font-size:12px;font-weight:600;color:var(--ink-2);background:var(--surface-2);border:1px solid var(--line);border-radius:999px;padding:1px 8px;cursor:help;white-space:nowrap}
.sem-valor-motivo{color:var(--ink-2);margin-top:2px}
.carregando{position:fixed;top:0;right:0;bottom:0;left:0;z-index:60;display:grid;place-items:center;padding:16px;background:rgba(7,29,65,.58);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);animation:carr-in .18s ease-out}
.carregando[hidden]{display:none}
body.lendo{overflow:hidden}
.carr-card{width:100%;max-width:440px;background:var(--surface);color:var(--ink);border-radius:18px;padding:30px 26px 24px;box-shadow:0 20px 60px rgba(7,29,65,.35);text-align:center;position:relative;overflow:hidden}
.carr-card::before{content:"";position:absolute;left:0;right:0;top:0;height:5px;background:linear-gradient(90deg,var(--verde) 0 33.3%,var(--amarelo) 33.3% 66.6%,var(--azul) 66.6%)}
.carr-doc{position:relative;width:72px;height:88px;margin:0 auto 16px;border-radius:12px;background:var(--azul-suave);color:var(--azul);display:grid;place-items:center;overflow:hidden}
.carr-doc svg{width:40px;height:48px}
.carr-scan{position:absolute;left:9px;right:9px;top:12px;height:3px;border-radius:2px;background:var(--verde);box-shadow:0 0 10px var(--verde);animation:carr-scan 1.1s ease-in-out infinite alternate}
.carr-card h2{font-family:var(--f-display);font-size:22px;font-weight:800;margin:0 0 4px}
.carr-arq{margin:0 0 18px;color:var(--ink-3);font-size:14px;overflow-wrap:anywhere}
.carr-barra{height:8px;border-radius:99px;background:var(--surface-2);overflow:hidden}
.carr-barra i{display:block;height:100%;width:0;border-radius:inherit;background:var(--azul)}
.carr-det{display:flex;justify-content:space-between;gap:12px;margin-top:7px;font-size:13px;color:var(--ink-3);min-height:1.3em}
.carr-det b{color:var(--azul);font-weight:700}
.carr-etapas{list-style:none;margin:18px 0 0;padding:0;text-align:left;display:grid;gap:10px;font-size:14.5px;color:var(--ink-3)}
.carr-etapas li{display:flex;align-items:center;gap:10px}
.carr-etapas .m{width:18px;height:18px;border-radius:50%;border:2px solid var(--line);flex:none;display:grid;place-items:center;box-sizing:border-box}
.carr-etapas li.ativa{color:var(--ink);font-weight:600}
.carr-etapas li.ativa .m{border-color:var(--azul);border-top-color:transparent;animation:carr-gira .7s linear infinite}
.carr-etapas li.feita{color:var(--ink-2)}
.carr-etapas li.feita .m{border-color:var(--verde);background:var(--verde)}
.carr-etapas li.feita .m::after{content:"";width:4px;height:8px;border:solid var(--surface);border-width:0 2px 2px 0;transform:translateY(-1px) rotate(45deg)}
.carr-card.pergunta{text-align:left}
.carr-card.pergunta h2{font-size:21px}
.carr-card.pergunta p{margin:0 0 12px;color:var(--ink-2);line-height:1.45}
.carr-card.pergunta .carr-arq{margin-bottom:14px;color:var(--ink-3)}
.pc-botoes{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;margin-top:18px}
.pc-botoes .btn{padding:10px 18px;font-size:15px}
@keyframes carr-in{from{opacity:0}to{opacity:1}}
@keyframes carr-scan{to{top:calc(100% - 15px)}}
@keyframes carr-gira{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.carregando,.carr-scan,.carr-etapas li.ativa .m{animation:none}}
.toast{position:fixed''')
# Aviso no lugar da tela em branco se o navegador não rodar o sistema (ES5 de propósito)
aviso='''<script>
(function(){function aviso(){if(window.SIGA_OK)return;var v=document.getElementById("view-resultado");if(!v||v.textContent.replace(/\\s/g,""))return;v.hidden=false;
v.innerHTML='<div class="painel" style="padding:24px;margin-top:24px"><h3 style="margin:0 0 8px">Este navegador não conseguiu abrir o SIGA-SUS</h3><p style="margin:0;color:var(--ink-2)">Atualize o sistema do aparelho (no iPad ou iPhone: Ajustes, Geral, Atualização de Software) e recarregue a página. Se não for possível atualizar, abra no computador.</p></div>'}
window.addEventListener("error",function(){setTimeout(aviso,0)});window.addEventListener("load",function(){setTimeout(aviso,300)})})();
</script>
'''
# pdf.js "legacy": a versão normal exige Safari 15.4+; a legacy traz polyfills para iPad/iPhone mais antigos
scripts=aviso+'''<script src="https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/pdf.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/pdf.worker.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
'''
def js(o): return json.dumps(o,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')
dados='<script>\nconst SIGTAP_DADOS='+open('sigtap_202608.json',encoding='utf-8').read().replace('</','<\\/')+';\nconst PAG_EX1='+js(json.load(open('paginas_maria.json')))+';\nconst PAG_EX2='+js(json.load(open('paginas_jose.json')))+';\n</script>\n'
leitor=open('leitor.js',encoding='utf-8').read().replace('if(typeof module!=="undefined")module.exports={lerProntuario,REGRAS};','')
app=open('app.js',encoding='utf-8').read()
main='<script>\n'+leitor+'\n'+app+'\nwindow.SIGA_OK=true;\n</script>\n'
out=head+scripts+dados+main
assert '�' not in out
open(sys.argv[1],'w',encoding='utf-8').write(out)
print(len(out.encode()))
# Versão do site (GitHub Pages): documento completo. Sem doctype e viewport o celular abre em modo de compatibilidade e na largura de computador
if len(sys.argv)>2:
    # Cópia autorizada: endereço do Apps Script em copias_url.txt. Sem ele, o site fica igual ao protótipo
    url=open('copias_url.txt').read().strip() if os.path.exists('copias_url.txt') else ''
    hs=head;cfg=''
    if url:
        for a,b in [('O PDF é lido aqui mesmo, sem enviar nada para servidor. Ao fechar, tudo é descartado.','O PDF é lido aqui mesmo. Uma cópia só vai para a equipe do SIGA-SUS se você autorizar.'),
            ('Nenhum arquivo, texto ou resultado é enviado para servidor, nem para inteligência artificial.</p>','Nenhum texto ou resultado é enviado para servidor, nem para inteligência artificial.</p>\n        <p>Ao enviar um prontuário, o sistema pergunta se pode guardar uma cópia do PDF. Só quando você clica em "Guardar cópia" o arquivo vai para um armazenamento da equipe do SIGA-SUS, usado apenas para testar e melhorar o leitor. A cópia contém os dados do paciente: autorize só se a sua unidade permitir.</p>'),
            ('<p>Só a tabela SIGTAP importada, que é pública, fica guardada neste navegador para não precisar importar de novo.</p>','<p>Neste navegador, só a tabela SIGTAP importada, que é pública, fica guardada para não precisar importar de novo. Fora dele, ficam apenas as cópias de PDF que você autorizou guardar.</p>')]:
            assert hs.count(a)==1,a[:50]; hs=hs.replace(a,b)
        cfg='<script>window.SIGA_URL_COPIAS='+json.dumps(url)+';</script>\n'
    out=hs+cfg+scripts+dados+main
    i=out.index('</style>')+len('</style>')
    site=('<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n'
          '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
          +out[:i]+'\n</head>\n<body>'+out[i:]+'</body>\n</html>\n')
    open(sys.argv[2],'w',encoding='utf-8').write(site)
    print(len(site.encode()))
