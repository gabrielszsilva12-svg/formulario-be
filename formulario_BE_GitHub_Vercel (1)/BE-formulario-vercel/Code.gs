/**
 * Integração do formulário BE com Google Sheets.
 * Destino: planilha informada pelo usuário.
 *
 * Como publicar:
 * 1. Abra https://script.google.com/ e crie um projeto.
 * 2. Cole este arquivo no editor (Code.gs).
 * 3. Execute setupSheet uma vez e autorize o acesso à planilha.
 * 4. Implantar > Nova implantação > Aplicativo da Web.
 *    Executar como: Eu; Quem tem acesso: Qualquer pessoa.
 * 5. Copie a URL terminada em /exec para a constante GOOGLE_APPS_SCRIPT_URL em index.html.
 */

const SPREADSHEET_ID = "1oXyHoXg4fk2HdPCt3DiM0yKahf-Yrt7KspGS-WBqHJQ";
const SHEET_NAME = "Respostas BE";

const HEADERS = [
  "Data/hora",
  "Como você se sente sendo cliente BE hoje?",
  "Como foi a sua experiência no processo de compra?",
  "Você recebe o acompanhamento de obra?",
  "Quando precisa falar com a BE, como é o contato e o suporte?",
  "O que mais ajudaria a melhorar a sua experiência?",
  "Quer nos contar mais?",
  "Interesse em recompra ou indicação",
  "Nome da pessoa interessada",
  "Sobrenome da pessoa interessada",
  "Celular da pessoa interessada",
  "E-mail da pessoa interessada"
];

function setupSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);
  ensureHeaders_(sheet);
  return "Planilha configurada: " + spreadsheet.getUrl();
}


function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    return;
  }
  const width=Math.max(sheet.getLastColumn(),1);
  const existing=sheet.getRange(1,1,1,width).getValues()[0].map(function(v){return String(v||"").trim();});
  const missing=HEADERS.filter(function(header){return existing.indexOf(header)===-1;});
  if(missing.length)sheet.getRange(1,width+1,1,missing.length).setValues([missing]);
  sheet.setFrozenRows(1);
}

function doPost(e) {
  try {
    if (!e || !e.parameter || !e.parameter.payload) {
      throw new Error("Payload ausente.");
    }

    const data = JSON.parse(e.parameter.payload);
    const answers = Array.isArray(data.respostas) ? data.respostas : [];
    const byQuestion = {};
    answers.forEach(function(item) {
      if (item && item.pergunta) {
        byQuestion[item.pergunta] = Array.isArray(item.escolhas)
          ? item.escolhas.join("; ")
          : "";
      }
    });

    const timestamp = data.em ? new Date(data.em) : new Date();
    const valuesByHeader = {
      "Data/hora": timestamp,
      "Como você se sente sendo cliente BE hoje?": byQuestion[HEADERS[1]] || "",
      "Como foi a sua experiência no processo de compra?": byQuestion[HEADERS[2]] || "",
      "Você recebe o acompanhamento de obra?": byQuestion[HEADERS[3]] || "",
      "Quando precisa falar com a BE, como é o contato e o suporte?": byQuestion[HEADERS[4]] || "",
      "O que mais ajudaria a melhorar a sua experiência?": byQuestion[HEADERS[5]] || "",
      "Quer nos contar mais?": typeof data.mensagem === "string" ? data.mensagem : "",
      "Interesse em recompra ou indicação": data.indicacao && data.indicacao.interesse ? data.indicacao.interesse : "",
      "Nome da pessoa interessada": data.indicacao && data.indicacao.interesse === "Sim" ? (data.indicacao.nome || "") : "",
      "Sobrenome da pessoa interessada": data.indicacao && data.indicacao.interesse === "Sim" ? (data.indicacao.sobrenome || "") : "",
      "Celular da pessoa interessada": data.indicacao && data.indicacao.interesse === "Sim" ? (data.indicacao.celular || "") : "",
      "E-mail da pessoa interessada": data.indicacao && data.indicacao.interesse === "Sim" ? (data.indicacao.email || "") : ""
    };

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
      let sheet = spreadsheet.getSheetByName(SHEET_NAME);
      if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);
      ensureHeaders_(sheet);
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
        .map(function(value) { return String(value || "").trim(); });
      const row = headers.map(function(header) {
        return Object.prototype.hasOwnProperty.call(valuesByHeader, header) ? valuesByHeader[header] : "";
      });
      sheet.appendRow(row);
    } finally {
      lock.releaseLock();
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(error.message || error) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService
    .createTextOutput("Integração do formulário BE ativa. Use POST para enviar respostas.")
    .setMimeType(ContentService.MimeType.TEXT);
}
