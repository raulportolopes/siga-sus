/* ============ Leitor de prontuário por padrão (sem IA) ============
   Cada regra diz quais palavras indicam um procedimento faturável.
   tipo "contagem": soma cada registro (ou o número à frente: "6 Aferições").
   tipo "diaria": no máximo 1 por dia; períodos "13/07 a 18/07" contam cada dia. */
const REGRAS = [
  {id:"pa",    codigo:"0301100039", nome:"Aferição de pressão arterial", tipo:"contagem", padrao:/press[aã]o arterial/i},
  {id:"glic",  codigo:"0214010015", nome:"Glicemia capilar", tipo:"contagem", padrao:/glicemia capilar|\bHGT\b|dextro/i},
  {id:"im",    codigo:"0301100209", nome:"Medicação intramuscular", tipo:"contagem", padrao:/intramuscular|\bvia IM\b/i},
  {id:"ev",    codigo:"0301100195", nome:"Medicação endovenosa", tipo:"contagem", padrao:/(aplica|administra)\S*\s+(de\s+)?medica\S*\s+(endovenos|intravenos|EV\b)/i},
  {id:"pcr",   codigo:"0213010720", nome:"RT-PCR para SARS-CoV-2", tipo:"contagem", padrao:/RT-?PCR|swab nasofar/i, excluir:/resultado|liberad|positivo|negativo/i},
  {id:"cur2",  codigo:"0401010015", nome:"Curativo grau II", tipo:"contagem", padrao:/curativo\s+(complexo|especial|grau\s*(ii|2)\b)|curativo.{0,25}grau\s*(ii|2)\b/i},
  {id:"cur1",  codigo:"0301100284", nome:"Curativo simples", tipo:"contagem", padrao:/curativo\s+simples/i},
  {id:"o2",    codigo:"0301100144", nome:"Oxigenoterapia", tipo:"diaria", padrao:/oxigenoterapia|\bO2\b|cateter nasal|m[aá]scara (de|com) (reservat|venturi)/i, excluir:/ar ambiente|suspens|retirad/i},
  {id:"iot",   codigo:null, nome:"Intubação orotraqueal", tipo:"contagem", nota:"Sem código próprio no SIGTAP: entra na diária de UTI", padrao:/intuba[cç][aã]o|\bIOT\b/i, excluir:/extuba/i},
  {id:"vmi",   codigo:null, nome:"Ventilação mecânica invasiva", tipo:"diaria", nota:"Sem código próprio no SIGTAP: entra na diária de UTI", padrao:/ventila[cç][aã]o mec[aâ]nica|\bVMI\b/i, excluir:/desmame|suspens/i},
  {id:"cvc",   codigo:"0702040150", nome:"Cateter venoso central", tipo:"contagem", nota:"OPM: confirme se é mono ou duplo lúmen", confianca:"media", padrao:/cateter venoso central|\bCVC\b/i, exigir:/passagem|inser[cç][aã]o d[eo] cateter|puncionad|instalad|realizad/i, excluir:/curativo|retirad|s[ií]tio/i},
  {id:"hemog", codigo:"0202020380", nome:"Hemograma completo", tipo:"contagem", padrao:/hemograma/i, excluir:/resultado/i},
  {id:"rx",    codigo:"0204030153", nome:"Raio-X de tórax", tipo:"contagem", padrao:/raio[\s-]?x|radiografia/i, excluir:/resultado|laudo/i},
  {id:"hemoc", codigo:"0202080153", nome:"Hemocultura", tipo:"contagem", padrao:/hemocultura/i, excluir:/resultado/i},
  {id:"neb",   codigo:"0301100101", nome:"Nebulização", tipo:"contagem", padrao:/nebuliza[cç]|inala[cç][aã]o/i},
  {id:"ecg",   codigo:"0211020036", nome:"Eletrocardiograma", tipo:"contagem", padrao:/eletrocardiograma|\bECG\b/i, excluir:/resultado|laudo/i},
  {id:"gaso",  codigo:"0202010732", nome:"Gasometria", tipo:"contagem", padrao:/gasometria/i, excluir:/resultado/i},
  {id:"tc",    codigo:"0206020031", nome:"Tomografia de tórax", tipo:"contagem", padrao:/tomografia/i, excluir:/resultado|laudo/i},
  {id:"svd",   codigo:"0301100055", nome:"Sondagem vesical", tipo:"contagem", padrao:/sonda(gem)?\s+vesical|\bSVD\b/i, excluir:/retirad/i},
  {id:"sng",   codigo:"0301100179", nome:"Sondagem nasogástrica", tipo:"contagem", padrao:/sonda(gem)?\s+naso(g[aá]strica|enteral)|\bSN[GE]\b/i, excluir:/retirad/i}
];
const REGRA_UTI = {id:"uti", codigo:"0802010083", nome:"Diária de UTI adulto", tipo:"diaria"};
const CID_DESC = {"U07.1":"COVID-19, vírus identificado","U07.2":"COVID-19, vírus não identificado","B34.2":"Infecção por coronavírus","B97.2":"Coronavírus como causa de doença","J18.9":"Pneumonia não especificada","J18.0":"Broncopneumonia não especificada","J15.9":"Pneumonia bacteriana não especificada","J11.1":"Influenza com manifestações respiratórias","J96.0":"Insuficiência respiratória aguda","I10":"Hipertensão essencial","E11.9":"Diabetes mellitus tipo 2 sem complicações","A41.9":"Sepse não especificada","N39.0":"Infecção do trato urinário","I21.9":"Infarto agudo do miocárdio","I64":"Acidente vascular cerebral","J44.1":"DPOC com exacerbação aguda","I50.9":"Insuficiência cardíaca"};
function procPrincipalPorCid(cid){
  if(!cid)return null;
  if(/^(U07|B2[5-9]|B3[0-4]|B97\.2)/.test(cid))return {codigo:"0303010193",descricao:"Tratamento de outras doenças causadas por vírus (B25 a B34)"};
  if(/^J(09|1[0-8])/.test(cid))return {codigo:"0303140151",descricao:"Tratamento de pneumonias ou influenza (gripe)"};
  return null;
}

function _data(d,m,a){const x=new Date(+a,+m-1,+d);return isNaN(x)?null:x}
function _fmt(d){return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`}
function _maisDias(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x}
function _titulo(s){return String(s).toLowerCase().replace(/(^|\s)(\S)/g,(m,a,b)=>a+b.toUpperCase()).replace(/\b(Da|Das|De|Do|Dos|E)\b/g,w=>w.toLowerCase())}
function _frase(s){s=String(s).trim().replace(/\.$/,"");return s===s.toUpperCase()?s.charAt(0)+s.slice(1).toLowerCase():s}
function _caixaAlta(s){const l=s.replace(/[^A-Za-zÀ-ú]/g,"");return l.length>10&&l.replace(/[^A-ZÀ-Ý]/g,"").length/l.length>.8}
/* Sem lookbehind (?<=...): o Safari do iPad/iPhone antes do iOS 16.4 não entende e a página inteira deixa de carregar */
function _frases(t){return t.replace(/([.;])\s+(?=[A-ZÀ-Ú])/g,"$1\u0001").split("\u0001")}
function _primeiraFrase(t){return t.replace(/\.\s+[\s\S]*$/,".")}
function _limpa(s){return String(s).replace(/^[-*•\s]+/,"").replace(/^\d{1,2}\/\d{1,2}(\/\d{4})?\s*(às\s*)?/i,"").replace(/^\d{1,2}:\d{2}h?\s*[:–-]?\s*/,"").replace(/^[:–-]\s*/,"").replace(/\s+-\s+(Enf|T[ée]c|Dr|Dra|Aux)[^-]*$/i,"").trim()}

function lerProntuario(paginas){
  const t0=(typeof performance!=="undefined"?performance:Date).now();
  // 1. Linhas com página, juntando as que quebraram no meio
  const INICIO=/^([-*•]\s|\d{1,2}\/\d{1,2}|DATA\s*:|={3,}|-{5,}|\[P[ÁA]GINA|\(Folha)/i;
  const linhas=[];
  paginas.forEach((txt,i)=>String(txt).split("\n").forEach(t=>{
    t=t.replace(/\s+/g," ").trim(); if(!t)return;
    const ant=linhas[linhas.length-1];
    const ROTULO=/^[A-ZÀ-Ú][\wÀ-úª.()\/ -]{1,60}:(\s|$)/;
    const continua=ant&&!INICIO.test(t)&&!ROTULO.test(t)&&!/^(={3,}|-{5,})/.test(ant.t)&&!/^(={3,}|-{5,})$/.test(t)&&(/^[a-zà-ú]/.test(t)||/^\(/.test(t)||!/[.:;)!?]$/.test(ant.t));
    if(continua)ant.t+=" "+t; else linhas.push({t,pag:i+1});
  }));
  const texto=linhas.map(l=>l.t).join("\n");

  // 2. Cabeçalho do paciente
  const pega=(re,i=1)=>{const m=re.exec(texto);return m?(m[i]||"").trim():null};
  const pac={
    nome:pega(/PACIENTE\s*:\s*([^|\n]+?)(?=\s*\||\s+DATA DE NASC|\s+NASC|\n|$)/i),
    registro:pega(/(?:REGISTRO GERAL\s*\(RG\)|REGISTRO|PRONTU[ÁA]RIO\s*N?[º°o]?\.?|\bRG\b)\s*:\s*([\w.\-\/]+)/i),
    leito:pega(/LEITO\s*:\s*([\w\-\/]+(?:\s[A-Z]\b)?)/i),
    nascimento:pega(/(?:DATA DE NASCIMENTO|NASCIMENTO|\bDN\b)\s*:\s*(\d{2}\/\d{2}\/\d{4})/i),
    idade:pega(/(?:NASCIMENTO|\bDN\b)\s*:\s*\d{2}\/\d{2}\/\d{4}\s*\((\d{1,3})\s*ANOS?\)/i)
  };
  if(pac.nome)pac.nome=_titulo(pac.nome);
  if(pac.idade)pac.idade=+pac.idade;
  let admissao=pega(/ADMISS[ÃA]O\s*:\s*(\d{2}\/\d{2}\/\d{4})/i)||pega(/DATA\s*:\s*(\d{2}\/\d{2}\/\d{4})/i);
  let ano=admissao?+admissao.slice(6):new Date().getFullYear();

  // 3. Varredura linha a linha
  const ROTULO_PROSA=/^(Hist[óo]rico|Conduta|Evolu[çc][ãa]o|Diagn[óo]stico|Parecer|Exame f[íi]sico|Queixa|HDA|Impress[ãa]o|Observa[çc]|Paciente|Hip[óo]tese|Plano|Prescri[çc])/i;
  const contagem=new Map(); const ignorados=[]; const eventos=[]; const jaEvento=new Set(); const medicos=[]; const cids=[]; const folhas=[];
  let dataAtual=admissao?_data(...admissao.split("/")):null, prosa=false, pendente=null;
  let horaCab="", utiIni=null, utiFim=null, utiProvas=[], alta=null, desfecho=null, diagEntradaTxt=null, viaPA=false, totaisInformados=[];
  const soma=(regra,data,qtd,linha,trecho)=>{
    if(!data)return;
    const k=_fmt(data);
    const c=contagem.get(regra.id)||{regra,dias:{},provas:[]};
    if(regra.tipo==="diaria"){if(c.dias[k])return; c.dias[k]=1}
    else c.dias[k]=(c.dias[k]||0)+qtd;
    c.provas.push({data:k,pag:linha.pag,trecho:_limpa(trecho).slice(0,170),qtd:regra.tipo==="diaria"?1:qtd});
    contagem.set(regra.id,c);
  };
  const evento=(data,tipo,txt,hora)=>{if(!data)return;hora=hora||(dataAtual&&+data===+dataAtual?horaCab:"");txt=_limpa(txt).replace(/\s*\.$/,"");if(!txt)return;const d=_fmt(data),ch=d+"\u0001"+txt;if(!jaEvento.has(ch)){jaEvento.add(ch);eventos.push({data:d,hora:hora||"",tipo,texto:txt.length>170?txt.slice(0,167)+"…":txt})}};

  for(const L of linhas){
    let t=L.t;
    if(/^(={3,}|-{5,})/.test(t)){prosa=false;pendente=null;continue}
    for(const m of t.matchAll(/\(Folhas?\s*(\d+)\s*(?:a|-|até)\s*(\d+)/gi))folhas.push([+m[1],+m[2]]);
    for(const m of t.matchAll(/M[ée]dic[oa] Respons[áa]vel\s*:\s*(.+?)\s*-\s*(CRM[\/\w]*\s*\d+)/gi)){const s=`${m[1].trim()} · ${m[2].replace(/\s+/," ")}`;if(!medicos.includes(s))medicos.push(s)}

    // Data da linha
    let dataLinha=dataAtual, resto=t, ehCabecalhoData=false;
    let m=/^(DATA\s*:\s*)?(\d{1,2})\/(\d{1,2})\/(\d{4})/i.exec(t);
    if(m){dataAtual=_data(m[2],m[3],m[4]);ano=+m[4];dataLinha=dataAtual;ehCabecalhoData=!!m[1]||/^\d{1,2}\/\d{1,2}\/\d{4}\s*-\s*\d/.test(t);horaCab=ehCabecalhoData?((/(\d{1,2}:\d{2})/.exec(t)||[])[1]||""):"";
      resto=t.slice(m[0].length).replace(/^\s*(a\s+\d{1,2}\/\d{1,2}\/\d{4})?\s*[:–-]?\s*/,"");prosa=false;pendente=null;
      if(/^DATA/i.test(t)&&/ADMISS/i.test(t)){viaPA=/PRONTO ATENDIMENTO|\bPA\b|PRONTO[- ]SOCORRO/i.test(t);const h=/(\d{1,2}:\d{2})/.exec(t);evento(dataAtual,"admissao","Admissão"+(viaPA?" pelo pronto atendimento":""),h&&h[1])}
    }else if((m=/^[-*•]\s*(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?\b/.exec(t))){dataLinha=_data(m[1],m[2],m[3]||ano)}
    const hora=(/(?:^|às\s*|[-*•]\s*)(\d{1,2}:\d{2})h?/i.exec(t)||[])[1]||"";

    // Alta / óbito
    if(/ALTA HOSPITALAR|ALTA M[ÉE]DICA|^\S*\s*-?\s*ALTA\b/i.test(t)&&!/Diagn[óo]stico/i.test(t.slice(0,15))){alta=alta||dataLinha;desfecho="Alta hospitalar";evento(dataLinha,"alta",(/(\d+)º DIA/i.exec(t)?`Alta hospitalar no ${/(\d+)º DIA/i.exec(t)[1]}º dia de internação`:"Alta hospitalar"),hora)}
    // \b não funciona antes de letra acentuada ("ÓBITO"), por isso o grupo com letras
    if(/(^|[^A-Za-zÀ-ú])[ÓO]BITO(?![A-Za-zÀ-ú])/i.test(t)&&/constatad|declarad|evolui\S* (a|para) [óo]bito|^\S+\s*-\s*(\d{1,2}:\d{2}h?\s*-\s*)?[ÓO]BITO/i.test(t)){alta=alta||dataLinha;desfecho="Óbito";evento(dataLinha,"obito","Óbito",hora)}

    // UTI: entrada e saída
    const cabecalho=_caixaAlta(t)||/^\[P[ÁA]GINA/i.test(t);
    if(!cabecalho){
      for(const s of _frases(t)){
        if(/(transfer[eê]ncia|transferid[oa]|admitid[oa]|encaminhad[oa]|internad[oa])\b.{0,40}\bUTI\b/i.test(s)&&!/(alta|sa[ií]da) da UTI|da UTI para/i.test(s)){if(!utiIni){utiIni=dataLinha;utiProvas.push({pag:L.pag,trecho:s})}evento(dataLinha,"transferencia","Transferência para a UTI",hora)}
        if(utiIni&&!utiFim&&(/(transferid[oa]|transfer[eê]ncia)\b.{0,30}enfermaria|(alta|sa[ií]da) da UTI/i.test(s))){utiFim=_maisDias(dataLinha,-1);utiProvas.push({pag:L.pag,trecho:s});evento(dataLinha,"transferencia",s,"")}
        if(/transferid[oa]\b|transfer[eê]ncia (para|do|da)\b/i.test(s)&&!/\bUTI\b/i.test(s))evento(dataLinha,"transferencia",s,hora);
        if(/extuba[çc][ãa]o/i.test(s))evento(dataLinha,"procedimento",s,(/às\s*(\d{1,2}:\d{2})/.exec(s)||[])[1]);
      }
    }

    // CIDs
    if(/CID/i.test(t)){
      const tipo=/alta|encerramento|definitiv/i.test(t)?"alta":/atualizad|mudan/i.test(t)?"atualizado":/secund/i.test(t)?"secundario":"entrada";
      const achados=[];
      for(const c of t.matchAll(/\b([A-Z]\d{2}(?:\.\d{1,2})?)\b(?:\s*\(([^)]{3,60})\))?/g)){
        achados.push(c[1]);
        const ex=cids.find(x=>x.cid===c[1]);
        if(ex){if(tipo==="alta"){ex.ordemAlta=Math.min(ex.ordemAlta,achados.length);if(ex.tipo==="atualizado")ex.tipo="alta"}continue}
        const desc=(tipo==="entrada"&&diagEntradaTxt)||CID_DESC[c[1]]||(c[2]?_frase(c[2]):"")||"Descrição não informada";
        cids.push({cid:c[1],descricao:desc,data:dataLinha?_fmt(dataLinha):"",tipo,ordem:cids.length,ordemAlta:tipo==="alta"?achados.length:99});
      }
      if(tipo==="atualizado"&&achados.length)evento(dataLinha,"diagnostico",`Diagnóstico atualizado para ${achados.join(" / ")}`,hora);
    }
    let dm=/Diagn[óo]stico( de Entrada)?\s*:\s*([^.]+)/i.exec(t);if(dm&&!/CID/i.test(t))diagEntradaTxt=diagEntradaTxt||_frase(dm[2]);

    // Eventos de evolução e resultados
    if(/^(Evolu[çc][ãa]o|Parecer)/i.test(t))evento(dataLinha,"intercorrencia",_primeiraFrase(t.replace(/^[^:]+:\s*/,"")),hora);
    if(/^[-*•]/.test(t)&&/resultado|laudo/i.test(t))evento(dataLinha,"exame",t,hora);
    if(/^[-*•]/.test(t)&&/dessatura|evolui\S* com|piora|parada card|instabilidade/i.test(t))evento(dataLinha,"intercorrencia",t,hora);

    // Contagem de procedimentos
    if(cabecalho){prosa=false;pendente=null;continue}
    if(ROTULO_PROSA.test(t)){prosa=true;pendente=null;continue}
    if(/^[-*•]/.test(t))prosa=false;
    if(prosa||(ehCabecalhoData&&/^DATA/i.test(t)))continue;
    if(/^[*•]/.test(t)&&pendente){pendente.forEach(r=>soma(r,dataLinha,1,L,pendente.cab+" — "+t));continue}
    if(!/^[*•]/.test(t))pendente=null;
    const segs=resto.includes("|")?resto.split("|"):_frases(resto);
    for(let seg of segs){
      seg=seg.trim(); if(!seg)continue;
      let dSeg=dataLinha; const ms=/^(?:[-*•]\s*)?(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?\b/.exec(seg); if(ms)dSeg=_data(ms[1],ms[2],ms[3]||ano);
      const casadas=[];
      for(const r of REGRAS){if(!r.padrao.test(seg))continue;
        const ex=r.excluir&&r.excluir.exec(seg);
        if(ex||(r.exigir&&!r.exigir.test(seg))){ignorados.push({data:dSeg?_fmt(dSeg):"",pag:L.pag,trecho:_limpa(seg).slice(0,170),regra:r.nome,motivo:ex?`contém "${ex[0].toLowerCase()}"`:"não diz que foi realizado"});continue}
        casadas.push(r)}
      if(!casadas.length)continue;
      if(/:\s*$/.test(seg)){pendente=casadas;pendente.cab=_limpa(seg).replace(/:\s*$/,"");continue}
      const rg=/(\d{1,2})\/(\d{1,2})(?:\/\d{2,4})?\s+(?:a|até)\s+(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/i.exec(seg);
      const tot=/Total\s*:\s*(\d+)/i.exec(seg);
      // O número não pode vir colado em dígito, barra ou dois-pontos (ex.: "13/07:7")
      const qm=/^(\s*(?:[-*•]\s*)?(?:\d{1,2}\/\d{1,2}(?:\/\d{4})?(?![\d\/])\s*(?:às\s*\d{1,2}:\d{2}h?)?\s*[:–-]?\s*)?(?:\d{1,2}:\d{2}(?!\d)h?\s*[:–-]?\s*)?)(\d{1,2})\s+[A-Za-zÀ-ú]/.exec(seg);
      const qtd=qm&&!/[\d\/:]$/.test(qm[1])?Math.min(+qm[2],48):1;
      for(const r of casadas){
        if(r.tipo==="diaria"&&rg){
          let a=_data(rg[1],rg[2],ano),b=_data(rg[3],rg[4],rg[5]||ano);if(b<a)b=_data(rg[3],rg[4],ano+1);
          let n=0;for(let d=new Date(a);d<=b&&n<120;d=_maisDias(d,1)){soma(r,d,1,L,seg);n++}
          if(tot&&+tot[1]!==n)totaisInformados.push(`${r.nome}: o prontuário informa total ${tot[1]}, mas o período ${rg[1]}/${rg[2]} a ${rg[3]}/${rg[4]} tem ${n} dias.`);
        }else soma(r,dSeg,r.tipo==="diaria"?1:qtd,L,seg);
        if(r.id==="iot"||r.id==="cvc")evento(dSeg,"procedimento",seg,(/(\d{1,2}:\d{2})/.exec(seg)||[])[1]);
      }
    }
  }

  // 4. Fechamento
  const altaD=alta, admD=admissao?_data(...admissao.split("/")):null;
  if(utiIni){
    const fim=utiFim||(altaD?_maisDias(altaD,-1):utiIni);
    const c={regra:REGRA_UTI,dias:{},provas:utiProvas.map(p=>({data:_fmt(utiIni),pag:p.pag,trecho:_limpa(p.trecho).slice(0,170),qtd:1})),confianca:"media",
      observacao:`Calculada pelo período em UTI (${_fmt(utiIni).slice(0,5)} a ${_fmt(fim).slice(0,5)})`};
    for(let d=new Date(utiIni);d<=fim;d=_maisDias(d,1))c.dias[_fmt(d)]=1;
    contagem.set("uti",c);
  }
  const fases={};
  if(admD&&altaD)for(let d=new Date(admD);d<=altaD;d=_maisDias(d,1)){
    const k=_fmt(d); const uti=contagem.get("uti");
    fases[k]=uti&&uti.dias[k]?"uti":(utiIni&&d<utiIni&&viaPA)?"pa":(!utiIni&&viaPA&&+d===+admD)?"pa":"enf";
  }
  const ordem=["uti","vmi","iot","cvc","cur2","o2","pcr","tc","rx","hemoc","hemog","gaso","ecg","neb","svd","sng","pa","glic","im","ev","cur1"];
  const paginasDe=pv=>{const ps=[...new Set(pv.map(p=>p.pag))].sort((a,b)=>a-b);const fx=[];for(const p of ps){const u=fx[fx.length-1];if(u&&p===u[1]+1)u[1]=p;else fx.push([p,p])}return "Pág. "+fx.map(([a,b])=>a===b?a:`${a}–${b}`).join(", ")};
  const procedimentos=[...contagem.values()].sort((a,b)=>ordem.indexOf(a.regra.id)-ordem.indexOf(b.regra.id)).map(c=>({
    codigo:c.regra.codigo,descricao:c.regra.nome,regra:c.regra.id,dias:c.dias,fonte:paginasDe(c.provas),confianca:c.confianca||c.regra.confianca||"alta",observacao:c.observacao||c.regra.nota||null,provas:c.provas
  }));

  // Diagnósticos e procedimento principal
  const cidsAlta=cids.filter(c=>c.ordemAlta<99).sort((a,b)=>a.ordemAlta-b.ordemAlta);
  const cidPrinc=cidsAlta[0]||cids.filter(c=>c.tipo==="atualizado")[0]||cids[0]||null;
  if(cidPrinc){cids.forEach(c=>{if(c!==cidPrinc&&c.tipo==="atualizado")c.tipo="secundario"});cidPrinc.tipo="alta"}
  const diagnosticos=cids.sort((a,b)=>(a===cidPrinc?-1:b===cidPrinc?1:a.ordem-b.ordem)).map(({ordem,ordemAlta,...c})=>c);
  const principal=procPrincipalPorCid(cidPrinc&&cidPrinc.cid);

  // Pontos de atenção
  const alertas=[];
  folhas.sort((a,b)=>a[0]-b[0]);
  for(let i=1;i<folhas.length;i++){const de=folhas[i-1][1]+1,ate=folhas[i][0]-1;if(ate>=de)alertas.push(`${de===ate?"A folha "+String(de).padStart(2,"0")+" não aparece":"As folhas "+de+" a "+ate+" não aparecem"} no prontuário digitalizado (o registro pula da folha ${String(folhas[i-1][1]).padStart(2,"0")} para a ${String(folhas[i][0]).padStart(2,"0")}). Vale pedir ao SAME.`)}
  if(utiIni)alertas.push(`A diária de UTI foi calculada pela transferência registrada (${_fmt(utiIni).slice(0,5)}${utiFim?" a "+_fmt(utiFim).slice(0,5):", sem data de saída"}). Confirme a data de saída da UTI.`);
  const entrada=diagnosticos.find(d=>d.tipo==="entrada");
  if(entrada&&cidPrinc&&entrada.cid!==cidPrinc.cid)alertas.push(`O diagnóstico mudou de ${entrada.cid} para ${cidsAlta.filter(c=>c.tipo!=="entrada").map(c=>c.cid).join(" / ")||cidPrinc.cid}. O procedimento principal sugerido segue o diagnóstico de alta.`);
  if(!cidPrinc)alertas.push("Nenhum CID foi encontrado no prontuário. Informe o CID principal antes de lançar.");
  if(!principal&&cidPrinc)alertas.push(`Não há regra de procedimento principal para o CID ${cidPrinc.cid}. Escolha o procedimento principal na tabela SIGTAP.`);
  if(!altaD)alertas.push("A data de alta ou óbito não foi encontrada. Confira o desfecho da internação.");
  alertas.push(...totaisInformados);
  if(admD&&altaD){const fora=new Set();procedimentos.forEach(p=>Object.keys(p.dias).forEach(k=>{const d=_data(...k.split("/"));if(d<admD||d>altaD)fora.add(k)}));if(fora.size)alertas.push(`Há procedimentos com data fora da internação: ${[...fora].join(", ")}.`)}
  if(ignorados.length)alertas.push(`${ignorados.length} trecho(s) citam procedimentos mas não foram contados (resultado de exame, retirada, curativo de cateter etc.). Veja a aba Rastreio.`);

  // Resumo montado a partir do que foi lido
  const nDiarias=admD&&altaD?Math.round((altaD-admD)/864e5):null;
  const qt=id=>{const c=contagem.get(id);return c?Object.values(c.dias).reduce((a,b)=>a+b,0):0};
  const destaques=[];
  if(qt("iot"))destaques.push("intubação orotraqueal");
  if(qt("vmi"))destaques.push(`${qt("vmi")} dia(s) de ventilação mecânica`);
  if(qt("cvc"))destaques.push("cateter venoso central");
  if(qt("o2"))destaques.push(`${qt("o2")} dia(s) de oxigenoterapia`);
  if(qt("hemoc"))destaques.push(`${qt("hemoc")} hemocultura(s)`);
  if(qt("rx"))destaques.push(`${qt("rx")} raio-X`);
  const totalItens=procedimentos.reduce((a,p)=>a+Object.values(p.dias).reduce((x,y)=>x+y,0),0);
  let resumo=`Paciente${pac.idade?` de ${pac.idade} anos`:""}${admissao?`, internação de ${admissao}`:""}${altaD?` a ${_fmt(altaD)}`:""}${nDiarias!=null?` (${nDiarias} diárias)`:""}${utiIni?`, com passagem pela UTI de ${_fmt(utiIni).slice(0,5)} a ${_fmt(utiFim||utiIni).slice(0,5)}`:""}.`;
  if(entrada)resumo+=` Diagnóstico de entrada: ${entrada.descricao} (${entrada.cid}).`;
  if(cidPrinc)resumo+=` ${entrada?"Diagnóstico de saída":"Diagnóstico principal"}: ${cidPrinc.descricao} (${cidPrinc.cid}).`;
  if(destaques.length)resumo+=` Procedimentos de maior peso: ${destaques.join(", ")}.`;
  resumo+=` O leitor contou ${totalItens} itens em ${procedimentos.length} tipos de procedimento.${desfecho?" Desfecho: "+desfecho.toLowerCase()+".":""}`;

  const ms=Math.max(1,Math.round(((typeof performance!=="undefined"?performance:Date).now())-t0));
  return {
    paciente:pac,
    internacao:{admissao,alta:altaD?_fmt(altaD):null,desfecho,medicos},
    diagnosticos,principal,procedimentos,fases,
    eventos:eventos.sort((a,b)=>(_data(...a.data.split("/"))-_data(...b.data.split("/")))||String(a.hora).localeCompare(String(b.hora))),
    resumo,alertas,ignorados,
    folhas:folhas.length?`Folhas ${String(folhas[0][0]).padStart(2,"0")} a ${String(folhas.reduce((a,f)=>Math.max(a,f[1]),0)).padStart(2,"0")}`:null,
    paginas:paginas.length,ms
  };
}
if(typeof module!=="undefined")module.exports={lerProntuario,REGRAS};
