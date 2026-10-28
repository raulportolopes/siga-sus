"use strict";
/* ============ Tabela SIGTAP oficial (DATASUS), embutida na página ============ */
function linhaSigtap([codigo,nome,sh,sa,sp,perm]){return {codigo,nome,sh:sh/100,sa:sa/100,sp:sp/100,perm:perm||null,valor:(sh+sp)/100}}
const SIGTAP_OFICIAL = SIGTAP_DADOS.linhas.map(linhaSigtap);
const SIGTAP_INFO_OFICIAL = `Competência ${SIGTAP_DADOS.competencia}, ${SIGTAP_OFICIAL.length.toLocaleString("pt-BR")} procedimentos da Tabela Unificada do DATASUS.`;

/* ============ Prontuários de exemplo: texto das folhas, lido pelo mesmo leitor ============ */
const EXEMPLOS = [
  {id:"ex1", arquivo:"prontuario paciente 2.pdf", resumo:"COVID-19 com UTI", paginas:PAG_EX1},
  {id:"ex2", arquivo:"prontuario_paciente_jose.pdf", resumo:"Pneumonia em enfermaria", paginas:PAG_EX2}
];

/* ============ Estado ============ */
const S = {prontuarios:[], atual:"ex1", view:"resultado", aba:"espelho", lim:{}, sigtap:SIGTAP_OFICIAL, sigtapFonte:"oficial", sigtapInfo:SIGTAP_INFO_OFICIAL, competencia:SIGTAP_DADOS.competencia};
let sigtapIndex = new Map();
function indexaSigtap(){sigtapIndex = new Map(S.sigtap.map(s=>[s.codigo,s]))}
try{
  const salvo = localStorage.getItem("sigasus_sigtap_v2");
  if(salvo){const o=JSON.parse(salvo); if(Array.isArray(o.linhas)&&o.linhas.length){S.sigtap=o.linhas.map(linhaSigtap);S.sigtapFonte="importada";S.sigtapInfo=o.info||"";S.competencia=o.competencia||"importada"}}
}catch(e){}
indexaSigtap();

function fmtTempo(ms){return ms<1000?(ms/1000).toFixed(2).replace(".",",")+" s":(ms/1000).toFixed(1).replace(".",",")+" s"}
function montaProntuario(id,origem,arquivo,paginas,msExtra){
  const r=lerProntuario(paginas);
  const p={id,origem,arquivo,...r,tempoLeitura:fmtTempo(r.ms+(msExtra||0))};
  p.procedimentos.forEach(x=>{x.conferido=false;x.qtdManual=null});
  const pp=p.principal&&sigtapIndex.get(p.principal.codigo); const perm=permanencia(p);
  if(pp&&pp.perm&&perm!=null&&perm>2*pp.perm)p.alertas.splice(1,0,`A permanência (${perm} diárias) passou do dobro da média do procedimento principal (${pp.perm} dias). Pode caber diária de permanência a maior (08.02.01.019-9).`);
  if(p.principal&&p.principal.codigo)p.procedimentos.unshift({codigo:p.principal.codigo,descricao:p.principal.descricao,dias:{},fonte:p.principal.origem==="laudo"?`Pág. ${p.principal.pag}`:"Diagnóstico de alta",confianca:p.principal.origem==="laudo"?"alta":"media",observacao:p.principal.origem==="laudo"?`Lido no laudo da AIH (página ${p.principal.pag}).`:`Sugerido pelo CID ${p.diagnosticos[0]?p.diagnosticos[0].cid:""}. Confira a compatibilidade CID × procedimento.`,principal:true,conferido:false,qtdManual:null,qtdFixa:1,provas:[]});
  return p;
}

/* ============ Utilitários ============ */
const $ = s=>document.querySelector(s);
const esc = s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const BRL = new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"});
const fmtCod = c=>{c=String(c||"").replace(/\D/g,"");return c.length===10?`${c.slice(0,2)}.${c.slice(2,4)}.${c.slice(4,6)}.${c.slice(6,9)}-${c[9]}`:(c||"—")};
const DSEM=["dom","seg","ter","qua","qui","sex","sáb"];
function parseData(s){const m=/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(s||"").trim());return m?new Date(+m[3],+m[2]-1,+m[1]):null}
function fmtData(d){return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`}
function curta(s){return String(s||"").slice(0,5)}
function qtdIA(x){return x.qtdFixa!=null?x.qtdFixa:Object.values(x.dias||{}).reduce((a,b)=>a+(+b||0),0)}
function qtd(x){return x.qtdManual!=null?x.qtdManual:qtdIA(x)}
function valorUnit(x){const s=sigtapIndex.get(x.codigo);return s?s.valor:null}
function nomeSigtap(x){const s=sigtapIndex.get(x.codigo);return s?s.nome:null}
/* Por que o código não soma na AIH: só tem valor no ambulatório (SA) ou a tabela não traz valor (custeio fixo, como PAB e Vigilância) */
function motivoSemValor(x){const s=sigtapIndex.get(x.codigo);if(!s||s.valor!==0)return "";
  return s.sa>0?`Não soma na internação (só no ambulatório vale ${BRL.format(s.sa)}): lance no MV para registro.`:"Sem valor no SIGTAP (custeio fixo): lance no MV para registro."}
function permanencia(p){const a=parseData(p.internacao.admissao),b=parseData(p.internacao.alta);if(!a||!b)return null;return Math.round((b-a)/864e5)}
function listaDias(p){
  const set=new Set();
  const a=parseData(p.internacao.admissao),b=parseData(p.internacao.alta);
  if(a&&b&&b>=a&&(b-a)/864e5<=800){for(let d=new Date(a);d<=b;d.setDate(d.getDate()+1))set.add(fmtData(d))}
  p.procedimentos.forEach(x=>Object.keys(x.dias||{}).forEach(k=>{if(parseData(k))set.add(k)}));
  return [...set].sort((x,y)=>parseData(x)-parseData(y));
}
let toastT;
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("on");clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove("on"),2800)}
const atual = ()=>S.prontuarios.find(p=>p.id===S.atual);

/* ============ Navegação ============ */
function ir(view,id){
  if(id&&id!==S.atual)S.lim={};
  if(id)S.atual=id;
  if(view==="resultado"&&!atual())view="nova";
  S.view=view;
  document.querySelectorAll(".view").forEach(v=>v.hidden=true);
  $("#view-"+view).hidden=false;
  if(view==="resultado")renderResultado();
  if(view==="sigtap")renderSigtap();
  renderMenu();
  window.scrollTo({top:0,behavior:"instant"});
}
function renderMenu(){
  $("#lista-pac").innerHTML = S.prontuarios.length? S.prontuarios.map(p=>`
    <button class="pac-item" data-pac="${esc(p.id)}" aria-current="${S.view==="resultado"&&S.atual===p.id}">
      <span>${esc(p.paciente.nome||"Paciente sem nome")}</span>
      <small>${esc(p.paciente.leito||"")} · ${esc(curta(p.internacao.admissao))} a ${esc(curta(p.internacao.alta)||"—")}</small>
    </button>`).join("") : `<div class="vazio" style="padding:8px 10px;text-align:left">Nenhum prontuário aberto.</div>`;
  ["nova","sigtap","lgpd"].forEach(v=>$("#nav-"+v).setAttribute("aria-current",S.view===v));
}
document.querySelector(".menu").addEventListener("click",e=>{
  const b=e.target.closest("button");if(!b)return;
  if(b.dataset.pac)ir("resultado",b.dataset.pac);
  else if(b.dataset.view)ir(b.dataset.view);
});

/* ============ Resultado ============ */
const ICONE_FASE={pa:"PA",uti:"UTI",enf:"ENF"};
function renderResultado(){
  const p=atual(); const el=$("#view-resultado");
  if(!p){el.innerHTML="";return}
  const perm=permanencia(p);
  const procs=p.procedimentos;
  const totalItens=procs.filter(x=>!x.principal).reduce((a,x)=>a+qtd(x),0);
  let valor=0,semValor=0;procs.forEach(x=>{const v=valorUnit(x);if(v==null){if(x.codigo)semValor++}else valor+=v*qtd(x)});
  const confer=procs.filter(x=>x.conferido).length;
  const cidPrinc=p.diagnosticos[0];
  const outros=p.diagnosticos.slice(1);
  const nomePrinc=p.principal?(nomeSigtap(p.principal)||p.principal.descricao):null;

  el.innerHTML=`
  <div class="migalha"><b>Prontuários da sessão</b> / ${esc(p.paciente.nome)}
    ${p.origem==="exemplo"?'<span class="selo">exemplo</span>':'<span class="selo ia">enviado agora</span>'}
    <span class="selo ${confer===procs.length?"ok":"aviso"}">${confer===procs.length?"conferido":"aguardando conferência"}</span>
  </div>

  <section class="painel paciente">
    <div class="pac-esq">
      <h1 class="pac-nome">${esc(p.paciente.nome||"Paciente sem nome")}</h1>
      <dl class="ficha">
        <div><dt>Registro</dt><dd>${esc(p.paciente.registro||"—")}</dd></div>
        <div><dt>Leito</dt><dd>${esc(p.paciente.leito||"—")}</dd></div>
        <div><dt>Nascimento</dt><dd>${esc(p.paciente.nascimento||"—")}${p.paciente.idade?` · ${esc(p.paciente.idade)} anos`:""}</dd></div>
        <div><dt>Admissão</dt><dd>${esc(p.internacao.admissao||"—")}</dd></div>
        <div><dt>Saída</dt><dd>${esc(p.internacao.alta||"—")}</dd></div>
        <div><dt>Permanência</dt><dd>${perm!=null?`${perm} diárias`:"—"}</dd></div>
        <div><dt>Desfecho</dt><dd>${esc(p.internacao.desfecho||"—")}</dd></div>
        <div><dt>Documento</dt><dd>${esc(p.paginas)} pág.${p.folhas?" · "+esc(p.folhas):""}</dd></div>
      </dl>
    </div>
    <div class="pac-aih">
      <div class="aih-tit"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M9 3h6v4H9zM5 5h4M15 5h4v16H5V5"/><path d="M9 13l2 2 4-4"/></svg>Dados para a AIH</div>
      <div class="aih-linha"><small>Procedimento principal ${p.principal&&p.principal.origem==="laudo"?"(do laudo da AIH)":"sugerido"}</small><span>${p.principal?`<span class="mono" style="color:var(--azul)">${fmtCod(p.principal.codigo)}</span> ${esc(nomePrinc)}`:"Não identificado. Escolha na tabela SIGTAP."}</span></div>
      <div class="aih-linha"><small>CID principal e secundários</small>
        <div class="cids">${cidPrinc?`<span class="cid principal"><b>${esc(cidPrinc.cid)}</b>${esc(cidPrinc.descricao)}</span>`:"—"}${outros.map(d=>`<span class="cid"><b>${esc(d.cid)}</b>${esc(d.descricao)}</span>`).join("")}</div>
      </div>
      <div class="aih-linha"><small>Médicos responsáveis</small><span>${(p.internacao.medicos||[]).map(esc).join("<br>")||"—"}</span></div>
    </div>
  </section>

  <section class="kpis">
    <div class="painel kpi destaque"><small>Valor estimado da AIH</small><strong>${BRL.format(valor)}</strong><span>${semValor?`${semValor} código(s) fora da tabela carregada`:`SIGTAP ${esc(S.competencia)} · SH + SP`}</span></div>
    <div class="painel kpi"><small>Procedimentos encontrados</small><strong>${procs.length}</strong><span>tipos diferentes no espelho</span></div>
    <div class="painel kpi"><small>Total de itens somados</small><strong>${totalItens}</strong><span>em ${listaDias(p).length} dias de internação</span></div>
    <div class="painel kpi"><small>Tempo de leitura</small><strong>${esc(p.tempoLeitura||"—")}</strong><span>contra cerca de 2h30 no papel</span></div>
  </section>

  ${p.alertas&&p.alertas.length?`<section class="alertas"><h3><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/></svg>Pontos para conferir antes de lançar</h3><ul>${p.alertas.map(a=>`<li>${esc(a)}</li>`).join("")}</ul></section>`:""}

  ${S.amostras&&S.amostras[p.id]?`<section class="amostra-box"><p><b>O leitor deixou algo de fora?</b> Gere uma amostra deste prontuário <b>sem os dados do paciente</b> (nomes, documentos e números apagados, datas deslocadas). Confira o texto e mande para a equipe do SIGA-SUS ajustar o leitor a este modelo.</p><button class="btn pri" id="bt-amostra">Gerar amostra sem dados do paciente</button><div id="amostra-saida"></div></section>`:""}

  <section class="painel">
    <div class="painel-cab" style="padding-bottom:0;border-bottom:0">
      <div class="acoes" style="margin-left:0">
        <button class="btn pri" id="bt-copiar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>Copiar para o MV</button>
        <button class="btn" id="bt-csv"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M12 4v12M7 11l5 5 5-5M5 20h14"/></svg>Exportar planilha</button>
        <button class="btn" id="bt-todos">Marcar tudo como conferido</button>
      </div>
      <div class="acoes"><button class="btn perigo" id="bt-descartar">Descartar prontuário</button></div>
    </div>
    <div class="abas" role="tablist">
      ${[["espelho","Espelho da AIH"],["mapa","Mapa diário"],["rastreio","Rastreio"],["tempo","Linha do tempo"],["resumo","Resumo"]].map(([k,t])=>`<button role="tab" data-aba="${k}" aria-selected="${S.aba===k}">${t}</button>`).join("")}
    </div>
    ${Object.entries({espelho:()=>htmlEspelho(p,valor),mapa:()=>htmlMapa(p),rastreio:()=>htmlRastreio(p),tempo:()=>htmlTempo(p),resumo:()=>htmlResumo(p)}).map(([k,f])=>`<div class="aba" id="aba-${k}" ${S.aba!==k?"hidden":""}>${S.aba===k?f():""}</div>`).join("\n    ")}
  </section>`;
  ligaResultado(p);
}
function htmlEspelho(p,valor){
  const procs=p.procedimentos; const confer=procs.filter(x=>x.conferido).length;
  return `<div class="tabela-rola"><table>
    <thead><tr><th class="c">Conferido</th><th>Código SIGTAP</th><th>Procedimento</th><th>Onde está</th><th class="r">Qtd.</th><th class="r">Valor unit.</th><th class="r">Subtotal</th><th class="c">Leitura</th></tr></thead>
    <tbody>${procs.map((x,i)=>{const v=valorUnit(x);const q=qtd(x);const alt=x.qtdManual!=null&&x.qtdManual!==qtdIA(x);const nome=nomeSigtap(x);const motivo=motivoSemValor(x);
      return `<tr class="${x.conferido?"conferido":""}">
      <td class="c"><input type="checkbox" class="chk" id="chk-${i}" data-i="${i}" ${x.conferido?"checked":""} aria-label="Conferido"></td>
      <td class="mono num" style="white-space:nowrap">${fmtCod(x.codigo)}</td>
      <td><div class="proc-nome">${esc(nome||x.descricao)}${x.principal?'<span class="tag-principal">principal</span>':""}</div>${x.observacao?`<div class="proc-sub">${esc(x.observacao)}</div>`:(!x.principal&&nome?`<div class="proc-sub">No prontuário: ${esc(x.descricao.toLowerCase())}</div>`:"")}${motivo?`<div class="proc-sub sem-valor-motivo">${esc(motivo)}</div>`:""}</td>
      <td style="white-space:nowrap;color:var(--ink-2)">${esc(x.fonte||"—")}</td>
      <td class="r"><input type="number" min="0" class="qtd num ${alt?"alterada":""}" id="qtd-${i}" data-i="${i}" value="${q}" aria-label="Quantidade" title="${alt?"Alterado pelo faturista. O leitor contou "+qtdIA(x):"Contado pelo leitor"}"></td>
      <td class="r num">${!x.codigo?'<span style="color:var(--ink-3)">incluso</span>':v==null?'<span style="color:var(--ink-3)">fora da tabela</span>':v===0?`<span class="sem-valor" title="${esc(motivo)}">sem valor</span>`:BRL.format(v)}</td>
      <td class="r num" style="font-weight:700">${v==null||v===0?'<span style="color:var(--ink-3);font-weight:400">—</span>':BRL.format(v*q)}</td>
      <td class="c"><span class="conf ${esc(x.confianca||"media")}">${{alta:"segura",media:"conferir",baixa:"duvidosa"}[x.confianca]||"conferir"}</span></td>
    </tr>`}).join("")}</tbody>
    <tfoot><tr><td></td><td colspan="3">Total da conta</td><td class="r num">${procs.filter(x=>!x.principal).reduce((a,x)=>a+qtd(x),0)}</td><td></td><td class="r num">${BRL.format(valor)}</td><td></td></tr></tfoot>
  </table></div>
  <div class="rodape-tab"><span><b class="num">${confer}</b> de <b class="num">${procs.length}</b> linhas conferidas</span><div class="barra"><i style="width:${procs.length?confer/procs.length*100:0}%"></i></div><span class="nota-valor">Valores SIGTAP ${esc(S.competencia)}: serviço hospitalar + profissional (SH + SP). Itens "sem valor" e "incluso" entram na contagem para o MV, mas não somam na AIH: a tabela SIGTAP não paga esses procedimentos à parte na internação.</span></div>`;
}
function htmlMapa(p){
  const ds=listaDias(p); const procs=p.procedimentos.filter(x=>!x.principal);
  const max=procs.reduce((m,x)=>Object.values(x.dias||{}).reduce((a,v)=>Math.max(a,+v||0),m),1);
  const fases=p.fases||{}; const usadas=new Set(Object.values(fases));
  return `<div class="tabela-rola"><table class="mapa">
    <thead><tr><th>Procedimento</th>${ds.map(d=>{const dt=parseData(d);const f=fases[d];return `<th class="dia num">${curta(d)}<small>${DSEM[dt.getDay()]}</small>${f?`<span class="fase ${f}">${ICONE_FASE[f]}</span>`:""}</th>`}).join("")}<th class="r">Total</th></tr></thead>
    <tbody>${procs.map(x=>`<tr><td><div class="proc-nome" style="font-size:13.5px">${esc(x.descricao)}</div><div class="proc-sub mono">${fmtCod(x.codigo)}</div></td>
      ${ds.map(d=>{const n=+(x.dias||{})[d]||0;const pct=n?Math.round(18+n/max*62):0;return `<td><span class="cel num ${n?"":"zero"}" style="${n?`background:color-mix(in srgb,var(--azul) ${pct}%,transparent);color:${pct>45?"#fff":"var(--ink)"}`:""}">${n||"·"}</span></td>`}).join("")}
      <td class="r tot num">${qtdIA(x)}</td></tr>`).join("")}</tbody>
  </table></div>
  <div class="legenda">${usadas.has("pa")?'<span><span class="fase pa">PA</span> pronto atendimento</span>':""}${usadas.has("uti")?'<span><span class="fase uti">UTI</span> terapia intensiva</span>':""}${usadas.has("enf")?'<span><span class="fase enf">ENF</span> enfermaria</span>':""}<span>Cada célula é o que o faturista anotaria no rascunho para aquele dia.</span></div>`;
}
/* Listas longas aparecem em partes, com "Mostrar mais", para a tela não travar */
const PASSO_INI=300,PASSO=1000;
const lim=k=>S.lim[k]||PASSO_INI;
function maisLinhas(k,total){const n=lim(k);return total>n?`<div class="mais-linhas"><span>Mostrando <b class="num">${n.toLocaleString("pt-BR")}</b> de <b class="num">${total.toLocaleString("pt-BR")}</b></span><button class="btn" data-mais="${k}">Mostrar mais ${Math.min(PASSO,total-n).toLocaleString("pt-BR")}</button></div>`:""}
function htmlRastreio(p){
  const linhas=[];
  p.procedimentos.forEach(x=>(x.provas||[]).forEach(pv=>linhas.push({...pv,proc:x.descricao})));
  linhas.sort((a,b)=>(parseData(a.data)-parseData(b.data))||(a.pag-b.pag));
  const ign=p.ignorados||[];
  return `<p class="rast-intro">Cada linha abaixo é um trecho do prontuário que o leitor transformou em procedimento. Assim o faturista confere de onde veio cada número.</p>
  <div class="tabela-rola"><table>
    <thead><tr><th>Data</th><th>Pág.</th><th>Trecho do prontuário</th><th>Contou como</th><th class="r">Qtd.</th></tr></thead>
    <tbody>${linhas.slice(0,lim("rastreio")).map(l=>`<tr><td class="num" style="white-space:nowrap">${esc(curta(l.data))}</td><td class="num">${esc(l.pag)}</td><td class="trecho">${esc(l.trecho)}</td><td style="white-space:nowrap;font-weight:600">${esc(l.proc)}</td><td class="r num" style="font-weight:700">${l.qtd}</td></tr>`).join("")}</tbody>
  </table></div>${maisLinhas("rastreio",linhas.length)}
  ${ign.length?`<h3 class="rast-sub">Citados, mas não contados</h3><div class="tabela-rola"><table>
    <thead><tr><th>Data</th><th>Pág.</th><th>Trecho do prontuário</th><th>Seria</th><th>Por que não contou</th></tr></thead>
    <tbody>${ign.slice(0,lim("ign")).map(l=>`<tr><td class="num" style="white-space:nowrap">${esc(curta(l.data))}</td><td class="num">${esc(l.pag)}</td><td class="trecho">${esc(l.trecho)}</td><td style="white-space:nowrap">${esc(l.regra)}</td><td><span class="conf media">${esc(l.motivo)}</span></td></tr>`).join("")}</tbody>
  </table></div>${maisLinhas("ign",ign.length)}`:""}`;
}
const TIPOS={admissao:"Admissão",exame:"Exame",intercorrencia:"Evolução",diagnostico:"Diagnóstico",procedimento:"Procedimento",transferencia:"Transferência",alta:"Alta",obito:"Óbito"};
function htmlTempo(p){
  const ev=p.eventos||[];
  if(!ev.length)return `<div class="vazio">Nenhum evento clínico identificado.</div>`;
  return `<ol class="tempo">${ev.slice(0,lim("tempo")).map(e=>{const dt=parseData(e.data);return `<li class="t-${esc(e.tipo)}"><div class="quando num">${esc(curta(e.data))}<small>${esc(e.hora||(dt?DSEM[dt.getDay()]:""))}</small></div><span class="ponto"><i></i></span><div><span class="tipo">${esc(TIPOS[e.tipo]||e.tipo||"Registro")}</span><p>${esc(e.texto)}</p></div></li>`}).join("")}</ol>${maisLinhas("tempo",ev.length)}`;
}
function htmlResumo(p){
  return `<div class="resumo"><p>${esc(p.resumo||"Sem resumo.")}</p>
    <div><h3 style="font-size:14px;margin-bottom:10px;color:var(--ink-2)">Diagnósticos encontrados</h3><div class="diag-evol">${p.diagnosticos.map((d,i)=>`<div><b>${esc(d.cid)}</b><span>${esc(d.descricao)}<br><small style="color:var(--ink-3)">${esc(d.data||"")} · ${i===0?"principal":esc({entrada:"entrada",alta:"alta",secundario:"secundário",atualizado:"atualizado"}[d.tipo]||d.tipo||"")}</small></span></div>`).join("")||"Nenhum CID encontrado."}</div></div></div>`;
}
function ligaResultado(p){
  const remonta=()=>{const y=window.scrollY;renderResultado();window.scrollTo(0,y)};
  document.querySelectorAll(".abas button").forEach(b=>b.onclick=()=>{if(S.aba===b.dataset.aba)return;S.aba=b.dataset.aba;remonta();const n=document.querySelector(`.abas button[data-aba="${S.aba}"]`);n&&n.focus()});
  document.querySelectorAll("[data-mais]").forEach(b=>b.onclick=()=>{S.lim[b.dataset.mais]=lim(b.dataset.mais)+PASSO;remonta()});
  document.querySelectorAll(".chk").forEach(c=>c.onchange=()=>{p.procedimentos[+c.dataset.i].conferido=c.checked;renderResultado()});
  document.querySelectorAll(".qtd").forEach(c=>c.onchange=()=>{const x=p.procedimentos[+c.dataset.i];const v=Math.max(0,Math.round(+c.value||0));x.qtdManual=v===qtdIA(x)?null:v;renderResultado();const n=$("#qtd-"+c.dataset.i);n&&n.focus()});
  ligaAmostra(S.amostras&&S.amostras[p.id]);
  $("#bt-todos").onclick=()=>{p.procedimentos.forEach(x=>x.conferido=true);renderResultado();toast("Todas as linhas marcadas como conferidas")};
  $("#bt-copiar").onclick=()=>copiarMV(p);
  $("#bt-csv").onclick=()=>exportarCSV(p);
  const bd=$("#bt-descartar");
  bd.onclick=()=>{
    if(bd.dataset.confirma){S.prontuarios=S.prontuarios.filter(x=>x!==p);S.atual=S.prontuarios[0]?.id;toast("Prontuário descartado da memória");ir(S.atual?"resultado":"nova");return}
    bd.dataset.confirma="1";bd.textContent="Clique de novo para descartar";setTimeout(()=>{if(bd.isConnected){delete bd.dataset.confirma;bd.textContent="Descartar prontuário"}},4000);
  };
}
function linhasEspelho(p){return p.procedimentos.map(x=>({cod:fmtCod(x.codigo),nome:nomeSigtap(x)||x.descricao,q:qtd(x),v:valorUnit(x),conf:x.conferido}))}
async function copiarMV(p){
  const txt=["Código SIGTAP\tProcedimento\tQuantidade",...linhasEspelho(p).map(l=>`${l.cod}\t${l.nome}\t${l.q}`)].join("\n");
  try{await navigator.clipboard.writeText(txt);toast("Espelho copiado. Cole no MV ou numa planilha.")}
  catch(e){const ta=document.createElement("textarea");ta.value=txt;document.body.appendChild(ta);ta.select();try{document.execCommand("copy");toast("Espelho copiado")}catch(_){toast("Não deu para copiar. Use Exportar planilha.")}ta.remove()}
}
async function exportarCSV(p){
  const n=v=>v==null?"":v.toFixed(2).replace(".",",");
  const linhas=[`Paciente;${p.paciente.nome};Registro;${p.paciente.registro||""};Admissão;${p.internacao.admissao||""};Saída;${p.internacao.alta||""}`,"",
    "Código SIGTAP;Procedimento;Quantidade;Valor unitário;Subtotal;Conferido",
    ...linhasEspelho(p).map(l=>[l.cod,`"${String(l.nome).replace(/"/g,'""')}"`,l.q,n(l.v),n(l.v==null?null:l.v*l.q),l.conf?"sim":"não"].join(";"))];
  const csv="﻿"+linhas.join("\r\n");
  const nome="espelho_aih_"+(p.paciente.nome||"paciente").normalize("NFD").replace(/[^\w]+/g,"_").toLowerCase()+".csv";
  let dl=null;
  if(window.claude&&window.claude.use){try{dl=await window.claude.use("downloads")}catch(e){}}
  if(dl){try{await dl.save({filename:nome,data:csv});toast("Planilha salva")}catch(e){if(e&&e.code!=="declined")toast("Não foi possível salvar a planilha")}return}
  const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
  const a=document.createElement("a");a.href=url;a.download=nome;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),3000);toast("Planilha baixada");
}

/* ============ Envio de PDF ============ */
function renderExemplos(){
  $("#exemplos").innerHTML=EXEMPLOS.map(e=>{const p=S.prontuarios.find(x=>x.id===e.id)||montaProntuario(e.id,"exemplo",e.arquivo,e.paginas);
    return `<button class="painel exemplo" data-ex="${e.id}"><span class="doc">PDF</span><span><b>${esc(p.paciente.nome)}</b><small>${esc(e.resumo)} · ${permanencia(p)} diárias · ${esc(e.arquivo)}</small></span></button>`}).join("");
  $("#exemplos").onclick=ev=>{const b=ev.target.closest("[data-ex]");if(!b)return;
    if(!S.prontuarios.find(p=>p.id===b.dataset.ex)){const e=EXEMPLOS.find(x=>x.id===b.dataset.ex);S.prontuarios.push(montaProntuario(e.id,"exemplo",e.arquivo,e.paginas))}
    ir("resultado",b.dataset.ex)};
}
if(window.pdfjsLib){pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/pdf.worker.min.js"}
const drop=$("#drop");
["dragenter","dragover"].forEach(t=>drop.addEventListener(t,e=>{e.preventDefault();drop.classList.add("sobre")}));
["dragleave","drop"].forEach(t=>drop.addEventListener(t,e=>{e.preventDefault();drop.classList.remove("sobre")}));
drop.addEventListener("drop",e=>{const f=e.dataTransfer.files[0];if(f)analisar(f)});
$("#arquivo").addEventListener("change",e=>{const f=e.target.files[0];e.target.value="";if(f)analisar(f)});

const ETAPAS=["Abrindo o PDF","Extraindo o texto das folhas","Reconhecendo o padrão do prontuário","Cruzando com a tabela SIGTAP","Montando o espelho da AIH"];
function mostraProgresso(etapa,detalhe,erro){
  const box=$("#progresso-box");box.hidden=false;
  box.innerHTML=`<div class="painel progresso">
    <h3 style="font-size:17px">${esc(box.dataset.arquivo||"")}</h3>
    <ol class="etapas">${ETAPAS.map((t,i)=>`<li class="${i<etapa?"feita":i===etapa&&!erro?"ativa":""}"><span class="m"></span>${t}${i===etapa&&detalhe&&!erro?` <span style="color:var(--ink-3);font-weight:500">· ${esc(detalhe)}</span>`:""}</li>`).join("")}</ol>
    ${erro?`<div class="msg erro">${esc(erro)}</div>`:""}
    ${erro&&S.amostra?`<div class="amostra-box"><p>Para o leitor aprender este modelo, gere uma amostra do texto <b>sem os dados do paciente</b>: nomes, documentos e números são apagados e as datas mudam. Confira o texto e mande para a equipe do SIGA-SUS.</p><button class="btn pri" id="bt-amostra">Gerar amostra sem dados do paciente</button><div id="amostra-saida"></div></div>`:""}</div>`;
  ligaAmostra(S.amostra);
}
function ligaAmostra(dados){
  const bt=$("#bt-amostra");
  if(bt&&dados)bt.onclick=()=>{
    const txt=amostraAnonima(dados.paginas,dados.arquivo,dados.nOcr);
    $("#amostra-saida").innerHTML=`<textarea class="amostra-txt" readonly rows="12" aria-label="Amostra sem dados do paciente">${esc(txt)}</textarea><div class="pc-botoes"><button class="btn" id="bt-amostra-copiar">Copiar texto</button><button class="btn pri" id="bt-amostra-baixar">Baixar arquivo</button></div>`;
    $("#bt-amostra-baixar").onclick=()=>baixaTexto(txt,"amostra_sem_dados_do_paciente.txt");
    $("#bt-amostra-copiar").onclick=async()=>{try{await navigator.clipboard.writeText(txt);toast("Amostra copiada")}catch(e){const a=$(".amostra-txt");a.focus();a.select();toast("Texto selecionado: copie com Ctrl+C")}};
  };
}
const pausa=ms=>new Promise(r=>setTimeout(r,ms));
/* Cópia autorizada: só no site, quando o endereço de recebimento estiver configurado. Nunca envia sem a pessoa clicar em "Guardar cópia" */
const URL_COPIAS=window.SIGA_URL_COPIAS||"";
function perguntaCopia(nome){return new Promise(fim=>{
  let el=$("#pergunta-copia");
  if(!el){el=document.createElement("div");el.id="pergunta-copia";el.className="carregando";document.body.appendChild(el)}
  el.innerHTML=`<div class="carr-card pergunta" role="dialog" aria-modal="true" aria-labelledby="pc-tit">
    <h2 id="pc-tit">Guardar uma cópia deste prontuário?</h2>
    <p class="carr-arq">${esc(nome)}</p>
    <p>A cópia do PDF vai para a equipe do SIGA-SUS e é usada só para testar e melhorar o leitor. O arquivo tem dados do paciente: autorize apenas se a sua unidade permitir.</p>
    <p>A leitura funciona do mesmo jeito nos dois casos.</p>
    <div class="pc-botoes"><button class="btn" id="pc-nao">Não guardar</button><button class="btn pri" id="pc-sim">Guardar cópia</button></div>
  </div>`;
  el.hidden=false;document.body.classList.add("lendo");
  const resp=v=>{document.removeEventListener("keydown",tecla);el.hidden=true;document.body.classList.remove("lendo");fim(v)};
  const tecla=e=>{if(e.key==="Escape")resp(false)};
  document.addEventListener("keydown",tecla);
  $("#pc-nao").onclick=()=>resp(false);$("#pc-sim").onclick=()=>resp(true);
  $("#pc-nao").focus();
})}
/* O Apps Script recebe no máximo uns 50 MB por envio, e o PDF cresce 1/3 em base64 */
const LIMITE_COPIA=30*1024*1024;
const mb=b=>(b/1048576).toLocaleString("pt-BR",{maximumFractionDigits:0})+" MB";
/* Tempo que falta na leitura das folhas, a partir do ritmo até agora */
function faltam(i,n,ms,minN=200,minI=20){
  if(n<minN||i<minI||i>=n)return "";
  const s=ms/i*(n-i)/1000;
  return s<60?" · menos de 1 min":` · faltam cerca de ${Math.ceil(s/60)} min`;
}
function enviaCopia(arquivo){return new Promise(fim=>{
  const r=new FileReader();
  r.onerror=()=>fim(false);
  r.onload=()=>{const b64=String(r.result).split(",")[1]||"";
    fetch(URL_COPIAS,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=utf-8"},
      body:JSON.stringify({chave:"siga-sus-copias",nome:arquivo.name,origem:location.host,arquivo:b64})})
      .then(()=>fim(true),()=>fim(false))};
  r.readAsDataURL(arquivo);
})}
/* Tela "Lendo o seu prontuário": fica no mínimo DUR_LEITURA ms, mesmo quando a leitura termina antes */
const DUR_LEITURA=3800;
function abreCarregando(nome){
  let el=$("#carregando");
  if(!el){el=document.createElement("div");el.id="carregando";el.className="carregando";el.setAttribute("role","status");el.setAttribute("aria-live","polite");document.body.appendChild(el)}
  el.innerHTML=`<div class="carr-card">
    <div class="carr-doc" aria-hidden="true"><svg viewBox="0 0 40 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M25 3H8a4 4 0 0 0-4 4v34a4 4 0 0 0 4 4h24a4 4 0 0 0 4-4V14z"/><path d="M25 3v11h11"/><path d="M12 24h16M12 31h16M12 38h9"/></svg><i class="carr-scan"></i></div>
    <h2>Lendo o seu prontuário</h2>
    <p class="carr-arq">${esc(nome)}</p>
    <div class="carr-barra"><i></i></div>
    <div class="carr-det"><span></span><b class="num">0%</b></div>
    <ol class="carr-etapas">${ETAPAS.map(t=>`<li><span class="m"></span>${t}</li>`).join("")}</ol>
    <button class="btn carr-cancelar" type="button" hidden>Cancelar leitura</button>
  </div>`;
  el.hidden=false;document.body.classList.add("lendo");
  const t0=performance.now(),barra=el.querySelector(".carr-barra i"),pct=el.querySelector(".carr-det b"),det=el.querySelector(".carr-det span"),lis=[...el.querySelectorAll(".carr-etapas li")];
  let pronto=false,aberto=true,lidas=null,etapaMin=0,cancelado=false,aoCancelar=null;
  const btCancelar=el.querySelector(".carr-cancelar");
  btCancelar.onclick=()=>{cancelado=true;btCancelar.disabled=true;btCancelar.textContent="Cancelando…";aoCancelar&&aoCancelar()};
  (function quadro(){if(!aberto)return;
    /* PDF grande: a barra segue as folhas já lidas, e não só o relógio */
    const f=pronto?1:Math.min(.94,(performance.now()-t0)/DUR_LEITURA,lidas===null?1:lidas*.94);
    const et=pronto?ETAPAS.length:Math.max(etapaMin,Math.min(ETAPAS.length-1,Math.floor(f/.94*ETAPAS.length)));
    barra.style.width=(f*100).toFixed(1)+"%";pct.textContent=Math.round(f*100)+"%";
    lis.forEach((li,i)=>li.className=i<et?"feita":i===et?"ativa":"");
    requestAnimationFrame(quadro)})();
  return {
    detalhe:t=>{det.textContent=t},
    folhas:(i,n)=>{lidas=i/n},
    /* OCR: a barra recomeça para as folhas escaneadas, mas a lista continua em "Extraindo o texto" */
    ocr:(sim)=>{etapaMin=sim?1:0;btCancelar.hidden=!sim},
    cancelado:()=>cancelado,
    aoCancelar:fn=>{aoCancelar=fn},
    termina:async()=>{await pausa(Math.max(0,DUR_LEITURA-(performance.now()-t0)));pronto=true;det.textContent="Pronto";await pausa(300)},
    fecha:()=>{aberto=false;el.hidden=true;document.body.classList.remove("lendo")}
  };
}
const limpaTexto=t=>String(t).replace(/[ \t]+/g," ").replace(/\n{2,}/g,"\n").trim();
async function extraiPDF(arquivo,onPagina){
  if(!window.pdfjsLib)throw new Error("O leitor de PDF não carregou. Confira a internet e recarregue a página.");
  const pdf=await pdfjsLib.getDocument({data:await arquivo.arrayBuffer()}).promise;
  const paginas=[];
  try{
    for(let i=1;i<=pdf.numPages;i++){
      const pg=await pdf.getPage(i);const tc=await pg.getTextContent();
      let txt="",ultY=null;
      for(const it of tc.items){const y=it.transform?it.transform[5]:null;if(ultY!==null&&y!==null&&Math.abs(y-ultY)>2&&!txt.endsWith("\n"))txt+="\n";txt+=it.str;if(it.hasEOL)txt+="\n";ultY=y}
      paginas.push(limpaTexto(txt));
      pg.cleanup(); /* solta a memória da folha: prontuários de milhares de folhas */
      if(i%10===0||i===pdf.numPages)onPagina(i,pdf.numPages);
      if(i%25===0)await pausa(0); /* deixa a tela atualizar quando o pdf.js roda sem worker */
    }
  }finally{pdf.destroy()}
  return paginas;
}
/* ============ OCR: folhas escaneadas (imagem) ============
   Tesseract.js roda dentro do navegador: o prontuário não sai do computador.
   Só é baixado quando o PDF tem folha escaneada. Lê bem texto impresso; letra à mão, quase nada. */
const OCR_CDN="https://cdn.jsdelivr.net/npm/";
const OCR_OPC={workerPath:OCR_CDN+"tesseract.js@5.1.1/dist/worker.min.js",corePath:OCR_CDN+"tesseract.js-core@5.1.1",langPath:OCR_CDN+"@tesseract.js-data/por@1.0.0/4.0.0_best_int"};
const LETRAS_MIN=120; /* folha com menos letras que isso é tratada como imagem e passa pelo OCR */
function carregaScript(src){return new Promise((ok,falha)=>{const s=document.createElement("script");s.src=src;s.onload=ok;s.onerror=()=>falha(new Error("Não consegui baixar o leitor de folhas escaneadas (OCR). Confira a internet e tente de novo."));document.head.appendChild(s)})}
async function ocrFolhas(arquivo,indices,paginas,aoAvancar,tela){
  const cancela=new Promise((_,falha)=>tela.aoCancelar(()=>falha(Object.assign(new Error("Leitura cancelada"),{code:"cancelled"}))));
  cancela.catch(()=>{});
  const espera=x=>Promise.race([x,cancela]);
  if(!window.Tesseract)await espera(carregaScript(OCR_CDN+"tesseract.js@5.1.1/dist/tesseract.min.js"));
  const movel=/iPhone|iPad|Android|Mobile/i.test(navigator.userAgent);
  const nW=Math.max(1,Math.min(movel?2:4,(navigator.hardwareConcurrency||2)-1,indices.length));
  const sched=Tesseract.createScheduler();
  try{
    const ws=await espera(Promise.all(Array.from({length:nW},()=>Tesseract.createWorker("por",1,OCR_OPC))));
    ws.forEach(w=>sched.addWorker(w));
    const pdf=await espera(pdfjsLib.getDocument({data:await arquivo.arrayBuffer()}).promise);
    try{
      let feitas=0;const fila=new Set();
      for(const i of indices){
        if(tela.cancelado())await cancela;
        const pg=await espera(pdf.getPage(i+1));
        const v1=pg.getViewport({scale:1});
        const vp=pg.getViewport({scale:Math.min(2.5,2200/Math.max(v1.width,v1.height))}); /* cerca de 190 dpi */
        const cv=document.createElement("canvas");cv.width=Math.ceil(vp.width);cv.height=Math.ceil(vp.height);
        const ctx=cv.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,cv.width,cv.height);
        await espera(pg.render({canvasContext:ctx,viewport:vp}).promise);pg.cleanup();
        const img=await new Promise(r=>cv.toBlob(r,"image/png"));cv.width=cv.height=0;
        const job=sched.addJob("recognize",img).then(r=>{paginas[i]=limpaTexto(r.data.text);aoAvancar(++feitas,indices.length)});
        fila.add(job);job.then(()=>fila.delete(job),()=>fila.delete(job));
        if(fila.size>=nW*2)await espera(Promise.race(fila));
      }
      await espera(Promise.all(fila));
    }finally{pdf.destroy()}
  }finally{sched.terminate().catch(()=>{})}
}

/* ============ Amostra sem dados do paciente ============
   Para ensinar o leitor um modelo novo de prontuário: folhas de exemplo com nomes, documentos e números apagados e datas deslocadas.
   A pessoa confere o texto antes de mandar. */
const _vog=s=>s.replace(/[aáàâã]/gi,"[aáàâã]").replace(/[eéê]/gi,"[eéê]").replace(/[ií]/gi,"[ií]").replace(/[oóôõ]/gi,"[oóôõ]").replace(/[uúü]/gi,"[uúü]").replace(/[cç]/gi,"[cç]");
const NAO_NOME=new Set("DAS DOS DATA NASC NASCIMENTO SEXO IDADE ANOS LEITO CNS CPF REGISTRO ATENDIMENTO CONVENIO CONVÊNIO SUS MASCULINO FEMININO PRONTUARIO PRONTUÁRIO ENTRADA INTERNACAO INTERNAÇÃO SETOR CLINICA CLÍNICA MEDICA MÉDICA ENFERMARIA UTI HORA NOME MAE MÃE PAI SOCIAL COMPLETO RESPONSAVEL RESPONSÁVEL ACOMPANHANTE PACIENTE HOSPITAL PDF COPIA CÓPIA SCAN DIGITALIZADO".split(" "));
function amostraAnonima(paginas,arquivo,nOcr){
  const n=paginas.length,idx=new Set();
  for(let i=0;i<Math.min(5,n);i++)idx.add(i);
  const ASSUNTO=/glic|HGT|dextro|nutri|social|enfermag|enfermeir|acompanhante|\bCID|diagn[óo]stic|laudo|procedimento|alta\b|[óo]bito/i;
  const comAssunto=[];for(let i=5;i<n;i++)if(ASSUNTO.test(paginas[i]))comAssunto.push(i);
  for(let k=0;k<16&&k<comAssunto.length;k++)idx.add(comAssunto[Math.floor(k*comAssunto.length/Math.min(16,comAssunto.length))]);
  for(let k=1;idx.size<30&&k<=30&&n>5;k++)idx.add(Math.min(n-1,Math.round(4+(n-5)*k/30)));
  const nomes=new Set();
  const junta=s=>String(s).split(/[^A-Za-zÀ-ú]+/).forEach(w=>{const u=w.toUpperCase();if(w.length>=3&&!NAO_NOME.has(u))nomes.add(u)});
  junta(String(arquivo).replace(/\.pdf$/i,""));
  const ROT_NOME=/\b(PACIENTE|NOME(?:\s+(?:DO\s+PACIENTE|SOCIAL|COMPLETO))?|M[ÃA]E|NOME\s+DA\s+M[ÃA]E|PAI|RESPONS[ÁA]VEL|ACOMPANHANTE)\s*:\s*([^\n|;:]{3,60})/gi;
  idx.forEach(i=>{for(const m of String(paginas[i]).matchAll(ROT_NOME))junta(m[2])});
  const reNome=nomes.size?new RegExp("(^|[^A-Za-zÀ-ú])("+[...nomes].sort((a,b)=>b.length-a.length).map(w=>_vog(w.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"))).join("|")+")(?![A-Za-zÀ-ú])","gi"):null;
  const desloc=40+Math.floor(Math.random()*360);
  const mudaData=(d,m,a)=>{const ano=a.length===2?2000+ +a:+a;const x=new Date(ano,+m-1,+d);if(isNaN(x))return null;x.setDate(x.getDate()-desloc);const dd=String(x.getDate()).padStart(2,"0"),mm=String(x.getMonth()+1).padStart(2,"0");return `${dd}/${mm}/${a.length===2?String(x.getFullYear()).slice(2):x.getFullYear()}`};
  const limpa=t=>{
    t=String(t)
      .replace(/\b(CPF|CNS|CART[ÃA]O\s+(?:SUS|NACIONAL)[^:\n]{0,12}|RG|N[º°o]?\.?\s*(?:DO\s+)?PRONTU[ÁA]RIO|PRONTU[ÁA]RIO|ATENDIMENTO|REGISTRO(?:\s+GERAL)?(?:\s*\(RG\))?|MATR[ÍI]CULA|TELEFONE|FONE|CELULAR|ENDERE[ÇC]O|LOGRADOURO|BAIRRO|CEP|CIDADE|MUNIC[ÍI]PIO|NATURALIDADE|E-?MAIL|DATA\s+DE\s+NASC\w*|DT\.?\s*NASC\w*|NASCIMENTO|IDADE|PROFISS[ÃA]O|ESTADO\s+CIVIL)\s*:\s*[^\n|]{1,70}?(?=\s{2,}|\s+\||\||\n|$|\s+[A-ZÀ-Ú][A-ZÀ-Ú.\/ ]{1,25}:)/gi,"$1: [OCULTO]")
      .replace(/\b(Assinad[oa](?:\s+eletronicamente)?\s+por|Profissional|Prescrit[oa]\s+por|Checad[oa]\s+por|Executad[oa]\s+por|Realizad[oa]\s+por|Solicitante|Usu[áa]rio)\s*:?\s*[^\n|]{2,60}?(?=\s+-\s+|\s{2,}|\||\n|$)/gi,"$1: [PROFISSIONAL]")
      .replace(/\b(Dr\.?|Dra\.?|Enf[ªa]?\.?|Enfermeir[oa]|T[ée]c\.?|T[ée]cnic[oa](?:\s+de\s+enfermagem)?|Aux\.?|Auxiliar|Nutricionista|Assistente\s+[Ss]ocial|Psic[óo]log[oa]|Fisioterapeuta|Fonoaudi[óo]log[oa]|Farmac[êe]utic[oa]|M[ée]dic[oa])\s+(?:-\s+)?((?:[A-ZÀ-Ú][\wÀ-ú]+)(?:\s+(?:d[aeo]s?\s+)?[A-ZÀ-Ú][\wÀ-ú]+){0,3})/g,"$1 [PROFISSIONAL]")
      .replace(/\b(CRM|COREN|CRF|CRN|CREFITO|CRP|CRO|CRESS|CRFa)\b[^\n\d]{0,12}[\d.\-\/]+/gi,"$1 [NÚMERO]")
      .replace(/\[PROFISSIONAL\](?:-?\d{0,2})\s+\d{3,}/g,"[PROFISSIONAL] [NÚMERO]")
      .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g,"[EMAIL]")
      .replace(/\b(\d{1,2})\/(\d{1,2})\/(\d{4}|\d{2})\b/g,(x,d,m,a)=>mudaData(d,m,a)||x)
      .replace(/\d{3}\.\d{3}\.\d{3}-\d{2}/g,"[NÚMERO]")
      .replace(/\b\d{3}\s\d{4}\s\d{4}\s\d{4}\b/g,"[NÚMERO]")
      .replace(/\(?\b\d{2}\)?\s?9?\d{4}-\d{4}\b/g,"[NÚMERO]")
      .replace(/\d{5,}/g,"[NÚMERO]");
    if(reNome)t=t.replace(reNome,"$1[NOME]");
    return t.length>4000?t.slice(0,4000)+"\n[…]":t;
  };
  const lista=[...idx].sort((a,b)=>a-b);
  return ["AMOSTRA SIGA-SUS SEM DADOS DO PACIENTE",
    "Nomes, documentos e números foram apagados e as datas foram deslocadas. Confira antes de enviar.",
    `Documento com ${n} folhas${nOcr?`, ${nOcr} delas escaneadas e lidas por OCR`:""}. Folhas desta amostra: ${lista.map(i=>i+1).join(", ")}.`,""]
    .concat(lista.map(i=>`===== FOLHA ${i+1} =====\n${limpa(paginas[i])||"(sem texto)"}`)).join("\n");
}
function baixaTexto(txt,nome){const url=URL.createObjectURL(new Blob([txt],{type:"text/plain;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download=nome;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000)}
async function analisar(arquivo){
  if(!/\.pdf$/i.test(arquivo.name)&&arquivo.type!=="application/pdf"){toast("Envie um arquivo PDF");return}
  ir("nova");
  $("#progresso-box").dataset.arquivo=arquivo.name;$("#progresso-box").hidden=true;
  const grande=URL_COPIAS&&arquivo.size>LIMITE_COPIA;
  const copia=URL_COPIAS&&!grande&&await perguntaCopia(arquivo.name)?enviaCopia(arquivo):null;
  const tela=abreCarregando(arquivo.name);
  const t0=performance.now();
  let etapa=0,lidas=null,nOcr=0;S.amostra=null;
  try{
    etapa=1;
    const paginas=await extraiPDF(arquivo,(i,n)=>{tela.folhas(i,n);tela.detalhe(`Folha ${i.toLocaleString("pt-BR")} de ${n.toLocaleString("pt-BR")}${faltam(i,n,performance.now()-t0)}`)});
    lidas=paginas;
    /* Folhas escaneadas (imagem, sem texto): reconhecimento de texto aqui mesmo no navegador */
    const imagens=paginas.reduce((a,t,i)=>(t.replace(/\s/g,"").length<LETRAS_MIN&&a.push(i),a),[]);
    if(imagens.length){
      nOcr=imagens.length;tela.ocr(true);tela.folhas(0,nOcr);
      tela.detalhe(`${nOcr.toLocaleString("pt-BR")} folha(s) escaneada(s): preparando o reconhecimento de texto`);
      const t1=performance.now();
      await ocrFolhas(arquivo,imagens,paginas,(k,m)=>{tela.folhas(k,m);tela.detalhe(`Folha escaneada ${k.toLocaleString("pt-BR")} de ${m.toLocaleString("pt-BR")}${faltam(k,m,performance.now()-t1,1,3)}`)},tela);
      tela.ocr(false);
    }
    tela.detalhe(paginas.length===1?"1 folha":`${paginas.length} folhas`);
    const letras=paginas.join("").replace(/\s/g,"").length;
    if(letras/paginas.length<40)throw new Error(nOcr?"Não consegui reconhecer texto nas folhas escaneadas. Pode ser letra à mão, que o reconhecimento quase não lê, ou imagem muito clara ou escura.":"Este PDF não tem texto para ler.");
    etapa=2;
    const p=montaProntuario("pdf"+Date.now(),"envio",arquivo.name,paginas,performance.now()-t0);
    if(nOcr)p.alertas.unshift(`${nOcr} de ${paginas.length} folhas eram imagem (escaneadas) e foram lidas por reconhecimento de texto (OCR). O OCR pode trocar letras e quase não lê letra à mão: confira as quantidades no Rastreio.`);
    etapa=4;
    if(p.procedimentos.filter(x=>!x.principal).length===0)throw new Error(`Não encontrei procedimentos no padrão conhecido${nOcr?` (li ${paginas.length} folhas, ${nOcr} delas por reconhecimento de texto)`:""}. Este modelo de prontuário ainda não está nas regras do leitor.`);
    await tela.termina();tela.fecha();
    S.prontuarios.push(p);S.aba="espelho";S.amostras={[p.id]:{paginas,arquivo:arquivo.name,nOcr}};
    const st=copia?await Promise.race([copia,pausa(50).then(()=>null)]):undefined;
    toast(st===true?"Prontuário lido e cópia guardada.":st===false?"Prontuário lido. A cópia não pôde ser guardada.":grande?`Prontuário lido. O PDF tem ${mb(arquivo.size)}, grande demais para guardar cópia.`:"Prontuário lido. Confira o espelho.");
    if(st===null)copia.then(ok=>toast(ok?"Cópia do prontuário guardada.":"A cópia não pôde ser guardada."));
    ir("resultado",p.id);
  }catch(e){
    tela.fecha();
    if(e&&e.code==="cancelled"){$("#progresso-box").hidden=true;toast("Leitura cancelada");return}
    if(lidas&&lidas.join("").replace(/\s/g,"").length>200)S.amostra={paginas:lidas,arquivo:arquivo.name,nOcr};
    mostraProgresso(etapa,"",e&&e.message?e.message:"Não foi possível ler este PDF. Tente de novo.");
  }
}

/* ============ Tabela SIGTAP e regras ============ */
function renderSigtap(){
  const imp=S.sigtapFonte==="importada";
  $("#sigtap-aviso").innerHTML=`<div class="aviso-sigtap ok"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--verde)" stroke-width="2.4" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg><p><b>${imp?"Tabela importada em uso.":"Tabela SIGTAP oficial em uso."}</b> ${esc(S.sigtapInfo)} Para trocar de competência, baixe o ZIP em <span class="mono">sigtap.datasus.gov.br</span> e importe aqui. Também aceita o <span class="mono">tb_procedimento.csv</span> gerado pelo sigtap_importer.py.</p></div>`;
  $("#restaurar-sigtap").hidden=!imp;
  const q=($("#busca-sigtap").value||"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  const qd=q.replace(/\D/g,""); const palavras=q.split(/\s+/).filter(Boolean);
  const lista=S.sigtap.filter(s=>{if(!q)return true;if(qd&&/^[\d.\-\s]+$/.test(q))return s.codigo.startsWith(qd);const nome=s.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");return palavras.every(w=>nome.includes(w))});
  $("#tb-sigtap").innerHTML=lista.slice(0,200).map(s=>`<tr><td class="mono num" style="white-space:nowrap">${fmtCod(s.codigo)}</td><td>${esc(s.nome)}</td><td class="r num">${BRL.format(s.sh)}</td><td class="r num">${BRL.format(s.sp)}</td><td class="r num">${BRL.format(s.sa)}</td></tr>`).join("")||`<tr><td colspan="5" class="vazio">Nenhum procedimento encontrado.</td></tr>`;
  $("#rodape-sigtap").textContent=lista.length>200?`Mostrando 200 de ${lista.length.toLocaleString("pt-BR")} procedimentos. Refine a busca.`:`${lista.length.toLocaleString("pt-BR")} procedimento(s)`;
  const PALAVRAS={pa:["pressão arterial"],glic:["glicemia capilar","glicemia com valor (Glicemia: 132)","HGT","dextro","glicosimetria"],cons_enf:["consulta/evolução de enfermagem","evolução do enfermeiro","histórico de enfermagem","SAE"],cons_soc:["serviço social","assistente social","CRESS"],cons_nut:["nutricionista","evolução/avaliação nutricional","CRN"],acomp:["acompanhante","acompanhado pela/por"],im:["intramuscular","via IM"],ev:["aplicação/administração de medicação endovenosa"],pcr:["RT-PCR","swab nasofaríngeo"],cur2:["curativo complexo","curativo especial","curativo grau II"],cur1:["curativo simples"],o2:["oxigenoterapia","O2","cateter nasal","máscara de reservatório/Venturi"],iot:["intubação","IOT"],vmi:["ventilação mecânica","VMI"],cvc:["cateter venoso central","CVC","+ passagem/inserção/instalado"],hemog:["hemograma"],rx:["raio-X","radiografia"],hemoc:["hemocultura"],neb:["nebulização","inalação"],ecg:["eletrocardiograma","ECG"],gaso:["gasometria"],tc:["tomografia"],svd:["sonda vesical","SVD"],sng:["sonda nasogástrica/nasoenteral","SNG","SNE"]};
  const IGNORA={glic:"jejum, sérica, glicada",cons_enf:"técnico, auxiliar",acomp:"sem acompanhante, desacompanhado",pcr:"resultado, liberado, positivo, negativo",o2:"ar ambiente, suspensa, retirada",iot:"extubação",vmi:"desmame, suspensa",cvc:"curativo, retirado, sítio",hemog:"resultado",rx:"resultado, laudo",hemoc:"resultado",ecg:"resultado, laudo",gaso:"resultado",tc:"resultado, laudo",svd:"retirada",sng:"retirada"};
  $("#tb-regras").innerHTML=[...REGRAS,...REGRAS_LINHA,REGRA_UTI].map(r=>{const s=r.codigo&&sigtapIndex.get(r.codigo);return `<tr><td class="proc-nome">${esc(r.nome)}</td><td class="mono num" style="white-space:nowrap">${r.codigo?fmtCod(r.codigo):"sem código"}${s?`<div class="proc-sub" style="font-family:var(--f-body)">${esc(s.nome)}</div>`:""}</td><td>${r.tipo==="diaria"?'<span class="conf media">1 por dia</span>':r.tipo==="atendimento"?'<span class="conf media">1 por folha e dia</span>':r.tipo==="acompanhante"?'<span class="conf media">1 por pernoite (60 anos ou mais)</span>':'<span class="conf alta">soma cada registro</span>'}${r.nota&&r.tipo==="atendimento"?`<div class="proc-sub">${esc(r.nota)}</div>`:""}</td><td class="regra-pal">${PALAVRAS[r.id]?esc(PALAVRAS[r.id].join(" · ")):"período entre a transferência para a UTI e a saída"}${IGNORA[r.id]?`<br><span style="color:var(--erro)">ignora quando tem: ${esc(IGNORA[r.id])}</span>`:""}</td></tr>`}).join("");
}
$("#busca-sigtap").addEventListener("input",renderSigtap);
$("#restaurar-sigtap").onclick=()=>{S.sigtap=SIGTAP_OFICIAL;S.sigtapFonte="oficial";S.sigtapInfo=SIGTAP_INFO_OFICIAL;S.competencia=SIGTAP_DADOS.competencia;try{localStorage.removeItem("sigasus_sigtap_v2")}catch(e){}indexaSigtap();renderSigtap();toast("Voltou para a tabela "+SIGTAP_DADOS.competencia)};

/* Importa a tabela: ZIP oficial do DATASUS, tb_procedimento.txt, ou CSV (sigtap_importer.py ou código;nome;valor) */
function decodifica(buf){let t=new TextDecoder("utf-8",{fatal:false}).decode(buf);if(t.includes("\uFFFD"))t=new TextDecoder("windows-1252").decode(buf);return t}
function leLayout(txt){const cols={};txt.split(/\r?\n/).slice(1).forEach(l=>{const c=l.split(",");if(c.length>=4&&c[0].trim())cols[c[0].trim().toLowerCase()]=[+c[2],+c[3]]});return cols}
function leFixo(txt,layout){
  const L=layout||{co_procedimento:[1,10],no_procedimento:[11,260],qt_dias_permanencia:[267,270],vl_sh:[283,294],vl_sa:[295,306],vl_sp:[307,318],dt_competencia:[331,336]};
  const campo=(l,n)=>L[n]?l.slice(L[n][0]-1,L[n][1]).trim():"";
  const linhas=[];let comp="";
  for(const l of txt.split(/\r?\n/)){const cod=campo(l,"co_procedimento");if(!/^\d{10}$/.test(cod))continue;
    linhas.push([cod,campo(l,"no_procedimento"),+campo(l,"vl_sh")||0,+campo(l,"vl_sa")||0,+campo(l,"vl_sp")||0,+campo(l,"qt_dias_permanencia")||null]);comp=comp||campo(l,"dt_competencia")}
  return {linhas,comp};
}
function leCSV(txt){
  const ls=txt.split(/\r?\n/).filter(l=>l.trim());const sep=(ls[0].match(/;/g)||[]).length>(ls[0].match(/,/g)||[]).length?";":",";
  const parte=l=>{const r=[];let cur="",q=false;for(const ch of l){if(ch==='"')q=!q;else if(ch===sep&&!q){r.push(cur);cur=""}else cur+=ch}r.push(cur);return r.map(x=>x.trim())};
  const cab=parte(ls[0]).map(x=>x.toLowerCase().replace(/^\ufeff/,""));
  const linhas=[];let comp="";
  if(cab.includes("co_procedimento")){
    const ix=n=>cab.indexOf(n);
    for(const l of ls.slice(1)){const c=parte(l);const cod=c[ix("co_procedimento")];if(!/^\d{10}$/.test(cod))continue;
      linhas.push([cod,c[ix("no_procedimento")]||"",+c[ix("vl_sh")]||0,+c[ix("vl_sa")]||0,+c[ix("vl_sp")]||0,+c[ix("qt_dias_permanencia")]||null]);comp=comp||(c[ix("dt_competencia")]||"")}
  }else{
    for(const l of ls){const c=parte(l);const cod=(c[0]||"").replace(/\D/g,"");if(cod.length!==10)continue;
      const v=Math.round((+(String(c[2]||"0").replace(/\./g,"").replace(",","."))||0)*100);linhas.push([cod,c[1]||"",v,0,0,null])}
  }
  return {linhas,comp};
}
$("#arq-sigtap").addEventListener("change",async e=>{
  const f=e.target.files[0];e.target.value="";if(!f)return;
  toast("Lendo "+f.name+"…");
  try{
    const buf=await f.arrayBuffer();let r;
    if(/\.zip$/i.test(f.name)){
      if(!window.JSZip)throw new Error("O leitor de ZIP não carregou. Recarregue a página.");
      const zip=await JSZip.loadAsync(buf);const nomes={};zip.forEach((n,o)=>{if(!o.dir)nomes[n.split("/").pop().toLowerCase()]=o});
      if(!nomes["tb_procedimento.txt"])throw new Error("Não achei tb_procedimento.txt dentro do ZIP. É o ZIP da Tabela Unificada do SIGTAP?");
      const layout=nomes["tb_procedimento_layout.txt"]?leLayout(decodifica(await nomes["tb_procedimento_layout.txt"].async("arraybuffer"))):null;
      r=leFixo(decodifica(await nomes["tb_procedimento.txt"].async("arraybuffer")),layout);
    }else{
      const txt=decodifica(buf);const l0=txt.split(/\r?\n/)[0]||"";
      r=(/^\d{10}/.test(l0)&&l0.length>=300)?leFixo(txt,null):leCSV(txt);
    }
    if(!r.linhas.length)throw new Error("Não reconheci procedimentos neste arquivo.");
    const comp=/^\d{6}$/.test(r.comp)?`${r.comp.slice(4,6)}/${r.comp.slice(0,4)}`:"importada";
    S.sigtap=r.linhas.map(linhaSigtap);S.sigtapFonte="importada";S.competencia=comp;
    S.sigtapInfo=`${r.linhas.length.toLocaleString("pt-BR")} procedimentos do arquivo ${f.name}${comp!=="importada"?`, competência ${comp}`:""}.`;
    indexaSigtap();
    try{localStorage.setItem("sigasus_sigtap_v2",JSON.stringify({info:S.sigtapInfo,competencia:comp,linhas:r.linhas}))}catch(e){}
    renderSigtap();toast("Tabela SIGTAP importada");
  }catch(err){toast(err.message||"Não foi possível importar a tabela")}
});

/* ============ Início ============ */
S.prontuarios=EXEMPLOS.map(e=>montaProntuario(e.id,"exemplo",e.arquivo,e.paginas));
renderExemplos();
ir("resultado","ex1");
