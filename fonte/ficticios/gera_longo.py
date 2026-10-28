# Prontuário FICTÍCIO longo (N páginas) no padrão dos exemplos, com a contagem esperada de cada procedimento
import sys,json,html,datetime as dt
N=int(sys.argv[1]); OUT=sys.argv[2]
LPP=30  # linhas de registro por página
dias=max(20,round(N/40))
adm=dt.date(2026,3,2); alta=adm+dt.timedelta(days=dias-1)
uti_ini=adm+dt.timedelta(days=2); uti_sai=adm+dt.timedelta(days=2+min(25,dias//3))  # dia em que volta para a enfermaria
f=lambda d:d.strftime("%d/%m/%Y")
TEC=["Tec. Juliana","Tec. Rafael","Enfª Beatriz","Tec. Camila","Enfª Márcia","Tec. Sérgio"]
# (regra, texto) — regra None = não conta
ROT=[("pa","Aferição de Pressão Arterial: {a}x{b} mmHg"),(None,"Sinais vitais: FC {a} bpm, FR 18 irpm, SpO2 9{c}%, Tax 36,{c}°C"),
     ("glic","Teste de Glicemia Capilar: 1{a} mg/dL"),(None,"Mudança de decúbito realizada, paciente colaborativo"),
     ("ev","Administração de medicação endovenosa (Ceftriaxona 1g)"),(None,"Banho no leito e troca de roupa de cama"),
     ("neb","Nebulização com SF 0,9% 5 mL"),(None,"Resultado de Hemograma: Hb 1{c},2 g/dL, leucócitos {a}.{b}00"),
     ("pa","Aferição de Pressão Arterial: {b}x{a} mmHg"),("im","Aplicação de medicação Intramuscular (Dipirona 1g)"),
     (None,"Dieta oferecida, aceitação de {a}%"),("cur1","Curativo Simples em acesso venoso periférico")]
esp={}; vistos_diaria=set()
def conta(r,d,n=1):
    if r in("o2","uti"):
        if (r,d) in vistos_diaria:return
        vistos_diaria.add((r,d))
    esp[r]=esp.get(r,0)+n
cab=lambda k:["HOSPITAL MUNICIPAL DE ALTA COMPLEXIDADE - PRONTUÁRIO ELETRÔNICO DO PACIENTE",
  f"REGISTRO GERAL (RG): 771203-X | LEITO: 12-UTI | ADMISSÃO: {f(adm)}",
  "PACIENTE: JOAQUIM TESTE DE LONGA PERMANÊNCIA | DATA DE NASCIMENTO: 03/05/1950 (75 ANOS)",
  f"[PÁGINA {k} DE {N}] - REGISTRO MULTIPROFISSIONAL",f"(Folha {k} a {k} - Registro Diário)"]
paginas=[]; ppd=N/dias; k=0; i=0
for di in range(dias):
    d=adm+dt.timedelta(days=di); fim=round((di+1)*ppd)
    primeira=True
    while k<fim:
        k+=1; L=cab(k)
        if k==1:
            L+=[f"DATA: {f(adm)} - 08:10h - ADMISSÃO (PRONTO ATENDIMENTO)","Médico Responsável: Dr. Ricardo Menezes - CRM/SP 172840",
                "Histórico: Paciente com febre, tosse produtiva e dispneia há 4 dias. Pressão arterial elevada na chegada.",
                "Diagnóstico de Entrada: PNEUMONIA NÃO ESPECIFICADA.","CID-10 de Admissão: J18.9"]
        if primeira:
            L.append(f"{f(d)}:"); primeira=False
            L.append("- 07:30h: Coleta de Hemograma Completo - Tec. Juliana"); conta("hemog",d)
            if di%3==0: L.append("- 07:45h: Radiografia de Tórax no leito - Tec. Sérgio"); conta("rx",d)
            if d==uti_ini: L.append("- 10:00h: Paciente transferido para a UTI adulto por piora respiratória - Enfª Beatriz")
            if d==uti_sai: L.append("- 11:00h: Transferido da UTI para a enfermaria clínica - Enfª Márcia")
            if uti_ini<=d<uti_sai: L.append("- 08:00h: Mantida oxigenoterapia por cateter nasal a 3L/min - Enfª Beatriz"); conta("o2",d)
            if d==alta:
                L+=[f"{f(d)} - 10:30h - ALTA HOSPITALAR ({dias}º DIA DE INTERNAÇÃO)",
                    "Diagnóstico Definitivo de Alta para Encerramento da AIH: Pneumonia não especificada (CID-10: J18.9)."]
        else:
            L.append(f"Continuação do registro do dia {d.strftime('%d/%m')}")
        for j in range(LPP if d!=alta else 4):
            r,t=ROT[i%len(ROT)]; i+=1
            t=t.format(a=60+i%40,b=10+i%9,c=i%9)
            L.append(f"- {6+(j*17)//60%18:02d}:{(j*17)%60:02d}h: {t} - {TEC[i%len(TEC)]}")
            if r: conta(r,d)
        if k%7==0: L.append("Evolução de enfermagem: Paciente em repouso, pressão arterial estável, nebulização bem tolerada, sem queixas.")
        paginas.append(L)
for d in range((uti_sai-uti_ini).days): conta("uti",uti_ini+dt.timedelta(days=d))
h=['<!doctype html><meta charset="utf-8"><style>@page{size:A4;margin:14mm 16mm}body{font-family:Carlito,"Liberation Sans",Arial,sans-serif;font-size:9pt;color:#111}section{break-after:page}p{margin:0 0 3pt;line-height:1.22}</style>']
for L in paginas: h.append("<section>"+"".join(f"<p>{html.escape(l)}</p>" for l in L)+"</section>")
open(OUT+".html","w",encoding="utf-8").write("".join(h))
json.dump({"paginas":N,"dias":dias,"admissao":f(adm),"alta":f(alta),"esperado":esp},open(OUT+".json","w"),ensure_ascii=False,indent=1)
print(json.dumps({"dias":dias,"esperado":esp},ensure_ascii=False))
