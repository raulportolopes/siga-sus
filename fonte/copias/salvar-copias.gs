// SIGA-SUS: recebe as cópias de prontuário que a faturista AUTORIZOU guardar
// e salva na pasta "SIGA-SUS - prontuários enviados" do seu Google Drive.
const NOME_PASTA = "SIGA-SUS - prontuários enviados";
const CHAVE = "siga-sus-copias";

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.chave !== CHAVE || !d.arquivo || d.arquivo.indexOf("JVBER") !== 0) {
      return ContentService.createTextOutput("negado");
    }
    const pastas = DriveApp.getFoldersByName(NOME_PASTA);
    const pasta = pastas.hasNext() ? pastas.next() : DriveApp.createFolder(NOME_PASTA);
    const quando = Utilities.formatDate(new Date(), "America/Sao_Paulo", "yyyy-MM-dd HH'h'mm");
    const nome = quando + " - " + String(d.nome || "prontuario.pdf").replace(/[\\/:*?"<>|]/g, "_");
    const pdf = Utilities.newBlob(Utilities.base64Decode(d.arquivo), "application/pdf", nome);
    pasta.createFile(pdf).setDescription("Enviado pelo SIGA-SUS (" + (d.origem || "") + ") com autorização de quem enviou.");
    return ContentService.createTextOutput("ok");
  } catch (err) {
    return ContentService.createTextOutput("erro");
  }
}

// Abrir a URL /exec no navegador mostra esta mensagem: serve para conferir que está no ar
function doGet() {
  return ContentService.createTextOutput("SIGA-SUS: recebimento de cópias ativo.");
}
