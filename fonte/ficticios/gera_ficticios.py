# Gera prontuários FICTÍCIOS no mesmo padrão dos exemplos (nomes, documentos e casos inventados)
import os,sys,datetime as dt
OUT=sys.argv[1]
SEP="="*80; LIN="-"*80
def cab(rg,leito,adm,nome,nasc,idade):
    return [SEP,"HOSPITAL MUNICIPAL DE ALTA COMPLEXIDADE - PRONTUÁRIO ELETRÔNICO DO PACIENTE",
            f"REGISTRO GERAL (RG): {rg} | LEITO: {leito} | ADMISSÃO: {adm}",
            f"PACIENTE: {nome} | DATA DE NASCIMENTO: {nasc} ({idade} ANOS)",SEP]
def d(s): return dt.datetime.strptime(s,"%d/%m/%Y")
def f(x,ano=True): return x.strftime("%d/%m/%Y" if ano else "%d/%m")

casos={}

# 1) Influenza A em enfermaria, 4 dias, medicação EV e nebulização
L=cab("903417-B","305-ENF A","14/09/2026","ANTÔNIO CARLOS FERREIRA","18/02/1968","58")
L+=["[PÁGINA 1 DE 2] - BOLETIM DE ADMISSÃO E EVOLUÇÃO MÉDICA INICIAL",
"DATA: 14/09/2026 - 07:50h - ADMISSÃO (PRONTO ATENDIMENTO)",
"Médico Responsável: Dr. Ricardo Menezes - CRM/SP 172840",
"Histórico: Paciente com febre alta há 2 dias (39.2°C), mialgia intensa, tosse seca e prostração. Contato domiciliar com caso confirmado de influenza.",
"Diagnóstico de Entrada: INFLUENZA DEVIDA A VÍRUS IDENTIFICADO COM PNEUMONIA.",
"CID-10 de Admissão: J10.0",
"CID-10 Secundários: E66.9 (Obesidade não especificada)",
"Conduta Inicial: Oseltamivir, hidratação endovenosa, oxigênio por cateter nasal e nebulizações. Solicitados hemograma, gasometria e raio-X de tórax.",
LIN,"MAPA DE SINAIS VITAIS E PROCEDIMENTOS DE ENFERMAGEM (14/09 a 15/09)","(Folha 02 a 05 - Registro Diário)",
"14/09/2026:",
"- 08:20h: Radiografia de Tórax PA e Perfil - Tec. Sérgio",
"- 08:40h: Coleta de Hemograma Completo - Tec. Juliana",
"- 08:45h: Coleta de Gasometria Arterial - Enfª Beatriz",
"- 09:00h: Instalada Oxigenoterapia por cateter nasal a 3L/min - Enfª Beatriz",
"- 09:30h: Administração de medicação endovenosa (Dipirona) - Tec. Juliana",
"- 10:00h: Nebulização com SF 0,9% - Tec. Juliana",
"- 16:00h: Nebulização com SF 0,9% - Tec. Juliana",
"- 21:30h: Administração de medicação endovenosa (Dipirona) - Tec. Rafael",
"- 14/09: 4 Aferições de Pressão Arterial | 2 Testes de Glicemia Capilar",
"15/09/2026:",
"- 07:00h: Transferido do PA para a Enfermaria Clínica (leito 305-A) - Enfª Beatriz",
"- 09:00h: Nebulização com SF 0,9% - Tec. Juliana",
"- 09:30h: Administração de medicação endovenosa (Dipirona) - Tec. Juliana",
"- 15:00h: Nebulização com SF 0,9% - Tec. Juliana",
"- 15/09: 4 Aferições de Pressão Arterial | 2 Testes de Glicemia Capilar",
"- Mantida Oxigenoterapia por cateter nasal (14/09 a 15/09 - Total: 2 diárias de O2).",
SEP,"[PÁGINA 2 DE 2] - EVOLUÇÃO NA ENFERMARIA E ALTA",
"DATA: 16/09/2026 a 18/09/2026 - ENFERMARIA CLÍNICA",
"Médico Responsável: Dr. Ricardo Menezes - CRM/SP 172840",
"(Folha 06 a 10 - Evolução e Alta)",
"16/09/2026: Suspensa oxigenoterapia, SpO2 96% em ar ambiente. Afebril há 24 horas.",
"- 08:00h: Nebulização com SF 0,9% - Tec. Juliana",
"- 10:00h: Curativo Simples em acesso venoso periférico - Tec. Juliana",
"- 16/09: 3 Aferições de Pressão Arterial | 2 Testes de Glicemia Capilar",
"17/09/2026:",
"- 08:00h: Coleta de Hemograma Completo de controle - Tec. Juliana",
"- 11:00h: Resultado de Hemograma: sem alterações significativas - Dr. Ricardo Menezes",
"- 17/09: 3 Aferições de Pressão Arterial | 1 Teste de Glicemia Capilar",
"18/09/2026 - 10:30h - ALTA HOSPITALAR (5º DIA DE INTERNAÇÃO)",
"Paciente estável, eupneico em ar ambiente, afebril. Alta com orientações e retorno na UBS em 5 dias.",
"Diagnóstico Definitivo de Alta para Encerramento da AIH: Influenza com pneumonia, vírus identificado (CID-10: J10.0), com comorbidade (CID-10: E66.9).",SEP]
casos["prontuario_ficticio_01_antonio.pdf"]=L

# 2) COVID-19 com UTI de 3 dias sem intubação, sonda vesical, tomografia
L=cab("618254-D","210-UTI","02/10/2026","LÚCIA HELENA SANTOS","09/06/1954","72")
L+=["[PÁGINA 1 DE 3] - BOLETIM DE ADMISSÃO E EVOLUÇÃO MÉDICA INICIAL",
"DATA: 02/10/2026 - 14:20h - ADMISSÃO (PRONTO ATENDIMENTO)",
"Médico Responsável: Dra. Helena Vasconcelos - CRM/SP 154302",
"Histórico: Paciente com tosse, febre e cansaço há 5 dias. Hoje com piora da falta de ar. Hipertensa em uso irregular de medicação.",
"Diagnóstico de Entrada: SÍNDROME GRIPAL A ESCLARECER.",
"CID-10 de Admissão: J11.1",
"CID-10 Secundários: I10 (Hipertensão essencial)",
"Conduta Inicial: Isolamento respiratório, coleta de RT-PCR, tomografia de tórax e oxigênio sob máscara.",
LIN,"MAPA DE SINAIS VITAIS E PROCEDIMENTOS DE ENFERMAGEM (02/10 a 03/10)","(Folha 02 a 04 - Registro Diário)",
"02/10/2026:",
"- 14:40h: Coleta de swab nasofaríngeo para RT-PCR (SARS-CoV-2) - Tec. Diego",
"- 15:30h: Tomografia Computadorizada de Tórax - Tec. Sérgio",
"- 16:00h: Laudo da Tomografia: opacidades em vidro fosco bilaterais, acometimento de 40% - Dra. Helena Vasconcelos",
"- 16:10h: Instalada Oxigenoterapia sob Máscara de Venturi a 50% - Enfª Patrícia",
"- 02/10: 4 Aferições de Pressão Arterial | 2 Testes de Glicemia Capilar",
"03/10/2026:",
"- 09:00h: Resultado de Exame RT-PCR liberado: POSITIVO PARA SARS-CoV-2.",
"- 11:00h: Paciente evolui com piora do padrão respiratório (SpO2 89% com máscara).",
"- 03/10: 5 Aferições de Pressão Arterial | 3 Testes de Glicemia Capilar",
SEP,"[PÁGINA 2 DE 3] - TRANSFERÊNCIA PARA UTI",
"DATA: 03/10/2026 - 13:00h - PARECER DA INTENSIVA (UTI)",
"Médico Responsável: Dr. Marcelo Tavares - CRM/SP 201577",
"Evolução: Insuficiência respiratória aguda por COVID-19, sem indicação de intubação no momento. Transferência para UTI para monitorização e suporte não invasivo.",
"NCS / CID-10 Atualizado: U07.1 (COVID-19, vírus identificado).",
LIN,"PROCEDIMENTOS E NOTAS DE ENFERMAGEM UTI (03/10 a 06/10)","(Folha 05 a 11 - Registro UTI)",
"- 03/10 às 13:30h: Passagem de Sonda Vesical de Demora para controle de diurese - Enfª Patrícia.",
"- 03/10 às 14:00h: Coleta de Gasometria Arterial - Enfª Patrícia.",
"- 04/10 às 08:00h: Eletrocardiograma de 12 derivações - Tec. Diego.",
"- Mantida Oxigenoterapia sob Máscara de Reservatório (03/10 a 06/10 - Total: 4 diárias de O2).",
"Aferições de Sinais Vitais em UTI (03/10 a 06/10):",
"- 04/10: 6 Aferições de Pressão Arterial | 4 Testes de Glicemia Capilar",
"- 05/10: 6 Aferições de Pressão Arterial | 4 Testes de Glicemia Capilar",
"- 06/10: 4 Aferições de Pressão Arterial | 3 Testes de Glicemia Capilar",
SEP,"[PÁGINA 3 DE 3] - ENFERMARIA E ALTA",
"DATA: 06/10/2026 a 09/10/2026 - ENFERMARIA",
"Médico Responsável: Dra. Helena Vasconcelos - CRM/SP 154302",
"(Folha 12 a 16 - Evolução e Alta)",
"06/10/2026: Transferida da UTI para a enfermaria. Retirada a sonda vesical.",
"07/10/2026: Suspensa oxigenoterapia, SpO2 94% em ar ambiente.",
"- 10:00h: Curativo Simples em acesso venoso periférico - Tec. Diego",
"- 07/10: 3 Aferições de Pressão Arterial | 2 Testes de Glicemia Capilar",
"08/10/2026:",
"- 08:00h: Aplicação de medicação Intramuscular (Sintomático) - Tec. Diego",
"- 08/10: 3 Aferições de Pressão Arterial | 2 Testes de Glicemia Capilar",
"09/10/2026 - 11:00h - ALTA HOSPITALAR (8º DIA DE INTERNAÇÃO)",
"Paciente estável, eupneica em ar ambiente, afebril.",
"Diagnóstico Definitivo de Alta para Encerramento da AIH: COVID-19, vírus identificado (CID-10: U07.1), com histórico inicial de Síndrome Gripal (CID-10: J11.1) e comorbidade (CID-10: I10).",SEP]
casos["prontuario_ficticio_02_lucia.pdf"]=L

# 3) Pneumonia bacteriana grave: UTI, IOT, VMI, CVC e óbito
L=cab("447902-A","104-UTI","21/08/2026","ROBERTO ALVES DA COSTA","30/01/1946","80")
L+=["[PÁGINA 1 DE 2] - BOLETIM DE ADMISSÃO E EVOLUÇÃO MÉDICA INICIAL",
"DATA: 21/08/2026 - 23:10h - ADMISSÃO (PRONTO ATENDIMENTO)",
"Médico Responsável: Dr. Eduardo Paiva - CRM/SP 118265",
"Histórico: Paciente acamado, trazido pela família com febre, rebaixamento do nível de consciência e esforço respiratório importante.",
"Diagnóstico de Entrada: PNEUMONIA BACTERIANA NÃO ESPECIFICADA.",
"CID-10 de Admissão: J15.9",
"CID-10 Secundários: I50.9 (Insuficiência cardíaca não especificada)",
"Conduta Inicial: Antibiótico de amplo espectro, hemoculturas, gasometria, intubação e vaga de UTI.",
LIN,"PROCEDIMENTOS E NOTAS DE ENFERMAGEM UTI (21/08 a 25/08)","(Folha 02 a 09 - Registro UTI)",
"- 21/08 às 23:30h: Coleta de 2 Hemoculturas (amostras periféricas) - Enfª Simone.",
"- 21/08 às 23:40h: Coleta de Gasometria Arterial - Enfª Simone.",
"- 22/08 às 00:15h: Transferência para UTI após estabilização inicial no PA.",
"- 22/08 às 00:30h: Realizada Intubação Orotraqueal (IOT) e início de Ventilação Mecânica Invasiva (VMI).",
"- 22/08 às 01:10h: Passagem de Cateter Venoso Central (CVC) em veia jugular interna direita - Dr. Eduardo Paiva.",
"- 22/08 às 02:00h: Passagem de Sonda Nasogástrica para dieta enteral - Enfª Simone.",
"- Mantido em Ventilação Mecânica Invasiva (22/08 a 25/08 - Total: 4 diárias de Suporte Ventilatório / VMI).",
"- Curativo Complexo/Especial (Grau II) em sítio de inserção de CVC:",
"* 22/08 às 14:00h (Enfª Simone)",
"* 23/08 às 14:00h (Enfª Simone)",
"* 24/08 às 14:00h (Enfª Simone)",
"Aferições de Sinais Vitais em UTI (22/08 a 25/08):",
"- 22/08: 8 Aferições de Pressão Arterial | 4 Testes de Glicemia Capilar",
"- 23/08: 8 Aferições de Pressão Arterial | 4 Testes de Glicemia Capilar",
"- 24/08: 8 Aferições de Pressão Arterial | 4 Testes de Glicemia Capilar",
"- 25/08: 4 Aferições de Pressão Arterial | 2 Testes de Glicemia Capilar",
SEP,"[PÁGINA 2 DE 2] - EVOLUÇÃO NA UTI E ÓBITO",
"DATA: 23/08/2026 a 25/08/2026 - UTI ADULTO",
"Médico Responsável: Dra. Fernanda Lopes - CRM/SP 223019",
"(Folha 10 a 13 - Evolução)",
"Evolução: Choque séptico refratário de foco pulmonar, com necessidade crescente de drogas vasoativas.",
"24/08/2026: Resultado de Hemocultura: crescimento de Klebsiella pneumoniae.",
"25/08/2026 - 06:40h - ÓBITO",
"Paciente evolui com parada cardiorrespiratória em assistolia, sem resposta às manobras de reanimação. Óbito constatado às 06:40h pela Dra. Fernanda Lopes.",
"Diagnóstico Definitivo de Alta para Encerramento da AIH: Pneumonia bacteriana não especificada (CID-10: J15.9), com comorbidade (CID-10: I50.9).",SEP]
casos["prontuario_ficticio_03_roberto_obito.pdf"]=L

# 4) Pneumonia em enfermaria com total de O2 que não bate com o período e folha faltando (testa os alertas)
L=cab("530611-C","118-ENF C","05/10/2026","FRANCISCA DE ASSIS LIMA","12/12/1980","45")
L+=["[PÁGINA 1 DE 2] - BOLETIM DE ADMISSÃO E EVOLUÇÃO MÉDICA INICIAL",
"DATA: 05/10/2026 - 16:00h - ADMISSÃO (PRONTO ATENDIMENTO)",
"Médico Responsável: Dra. Juliana Prado - CRM/SP 187744",
"Histórico: Paciente com febre e dor torácica ventilatório-dependente há 4 dias, tosse com secreção amarelada.",
"Diagnóstico de Entrada: BRONCOPNEUMONIA NÃO ESPECIFICADA.",
"CID-10 de Admissão: J18.0",
"Conduta Inicial: Antibiótico endovenoso, oxigênio por cateter nasal, hemograma e raio-X de tórax.",
LIN,"MAPA DE SINAIS VITAIS E PROCEDIMENTOS DE ENFERMAGEM (05/10 a 06/10)","(Folha 02 a 03 - Registro Diário)",
"05/10/2026:",
"- 16:30h: Radiografia de Tórax PA e Perfil - Tec. Sérgio",
"- 16:45h: Coleta de Hemograma Completo - Tec. Camila",
"- 17:00h: Instalada Oxigenoterapia por cateter nasal a 2L/min - Enfª Márcia",
"- 18:00h: Aplicação de medicação Intramuscular (Dipirona) - Tec. Camila",
"- 05/10: 3 Aferições de Pressão Arterial",
"06/10/2026:",
"- 08:00h: Aplicação de medicação Intramuscular (Dipirona) - Tec. Camila",
"- 14:00h: Nebulização com SF 0,9% - Tec. Camila",
"- 06/10: 4 Aferições de Pressão Arterial",
"- Mantida Oxigenoterapia por cateter nasal (05/10 a 07/10 - Total: 2 diárias de O2).",
SEP,"[PÁGINA 2 DE 2] - EVOLUÇÃO NA ENFERMARIA E ALTA",
"DATA: 07/10/2026 a 08/10/2026 - ENFERMARIA CLÍNICA",
"Médico Responsável: Dra. Juliana Prado - CRM/SP 187744",
"(Folha 05 a 07 - Evolução e Alta)",
"07/10/2026: Suspensa oxigenoterapia, SpO2 97% em ar ambiente.",
"- 09:00h: Curativo Simples em acesso venoso periférico - Tec. Camila",
"- 07/10: 3 Aferições de Pressão Arterial",
"08/10/2026 - 09:30h - ALTA HOSPITALAR (4º DIA DE INTERNAÇÃO)",
"Paciente estável, afebril, eupneica. Alta com antibiótico oral.",
"Diagnóstico Definitivo de Alta para Encerramento da AIH: Broncopneumonia não especificada (CID-10: J18.0).",SEP]
casos["prontuario_ficticio_04_francisca_alertas.pdf"]=L

import html,json
for nome,linhas in casos.items():
    base=os.path.join(OUT,nome[:-4])
    open(base+".txt","w",encoding="utf-8").write("\n".join(linhas)+"\n")
    h='<!doctype html><meta charset="utf-8"><style>@page{size:A4;margin:22mm 20mm}body{font-family:Carlito,Calibri,"Liberation Sans",Arial,sans-serif;font-size:10.5pt;color:#111}p{margin:0 0 7pt;line-height:1.3;overflow-wrap:anywhere}</style>'
    h+="".join(f"<p>{html.escape(l)}</p>" for l in linhas)
    open(base+".html","w",encoding="utf-8").write(h)
print(json.dumps(list(casos)))
