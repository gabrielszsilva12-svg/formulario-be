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
  "Quer nos contar mais?"
];

function setupSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return "Planilha configurada: " + spreadsheet.getUrl();
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
    const row = [
      timestamp,
      byQuestion[HEADERS[1]] || "",
      byQuestion[HEADERS[2]] || "",
      byQuestion[HEADERS[3]] || "",
      byQuestion[HEADERS[4]] || "",
      byQuestion[HEADERS[5]] || "",
      typeof data.mensagem === "string" ? data.mensagem : ""
    ];

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
      let sheet = spreadsheet.getSheetByName(SHEET_NAME);
      if (!sheet) {
        sheet = spreadsheet.insertSheet(SHEET_NAME);
        sheet.appendRow(HEADERS);
        sheet.setFrozenRows(1);
      } else if (sheet.getLastRow() === 0) {
        sheet.appendRow(HEADERS);
        sheet.setFrozenRows(1);
      }
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
