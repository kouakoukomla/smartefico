/**
 * Journal des conversations de l'assistant SmartEfico — Google Apps Script.
 *
 * Ce fichier ne tourne pas dans le dépôt : il se colle dans la feuille Google
 * qui reçoit les conversations (Extensions > Apps Script), puis se déploie en
 * « application Web ». api/chat.js lui envoie chaque échange à l'adresse de ce
 * déploiement, enregistrée dans la variable ASSISTANT_GOOGLE_SHEET du projet
 * Vercel `smartefico`.
 *
 * Une ligne par échange : la date, le numéro de conversation (tiré au hasard
 * par la page, il regroupe les questions d'un même visiteur), la question et
 * la réponse. Rien d'autre : ni adresse IP, ni page, ni navigateur.
 *
 * Les lignes de plus de six mois sont effacées chaque nuit, comme le disent
 * l'article 10 des CGC et la mention sous le champ de l'assistant. Changer
 * CONSERVATION_MOIS oblige à changer ces deux textes.
 *
 * Mise en place, une fois :
 *   1. Exécuter `installer` depuis l'éditeur et accepter les autorisations :
 *      crée l'onglet, ses en-têtes, et la purge de chaque nuit.
 *   2. Déployer > Nouveau déploiement > Application Web, « Exécuter en tant
 *      que : moi », « Qui a accès : tout le monde ». Copier l'adresse /exec.
 *   3. La poser dans Vercel sous ASSISTANT_GOOGLE_SHEET, puis redéployer.
 * L'adresse /exec suffit pour écrire dans la feuille : elle ne doit vivre que
 * dans Vercel, jamais dans le dépôt, qui est public. Elle ne permet pas de lire.
 */

var ONGLET = 'Conversations';
var CONSERVATION_MOIS = 6;
var EN_TETES = ['Date', 'Conversation', 'Question', 'Réponse'];
// Une cellule Google Sheets tient 50 000 caractères.
var PLAFOND = 45000;

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    var question = texte(d.question);
    if (!question) return sortie('vide');
    var date = new Date(d.date);
    if (isNaN(date.getTime())) date = new Date();
    var numero = String(d.conversation || '').replace(/[^a-z0-9]/gi, '').slice(0, 24);
    onglet().appendRow([date, numero, question, texte(d.reponse)]);
    return sortie('ok');
  } catch (err) {
    return sortie('erreur');
  }
}

// Un texte qui commence par =, +, - ou @ serait lu comme une formule : un
// visiteur pourrait faire calculer la feuille. L'apostrophe, invisible dans
// la cellule, le garde en texte.
function texte(v) {
  var s = String(v == null ? '' : v).slice(0, PLAFOND);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function sortie(statut) {
  return ContentService.createTextOutput(JSON.stringify({ statut: statut }))
    .setMimeType(ContentService.MimeType.JSON);
}

function onglet() {
  var classeur = SpreadsheetApp.getActiveSpreadsheet();
  var f = classeur.getSheetByName(ONGLET);
  if (f) return f;
  f = classeur.insertSheet(ONGLET, 0);
  f.appendRow(EN_TETES);
  f.getRange(1, 1, 1, EN_TETES.length).setFontWeight('bold');
  f.setFrozenRows(1);
  f.setColumnWidth(1, 140);
  f.setColumnWidth(2, 110);
  f.setColumnWidth(3, 360);
  f.setColumnWidth(4, 520);
  f.getRange('A:A').setNumberFormat('dd/MM/yyyy HH:mm');
  f.getRange('C:D').setWrap(true).setVerticalAlignment('top');
  return f;
}

// Efface les lignes de plus de six mois, où qu'elles soient : la feuille a
// pu être triée ou filtrée entre-temps.
function purger() {
  var f = onglet();
  var n = f.getLastRow() - 1;
  if (n < 1) return;
  var limite = new Date();
  limite.setMonth(limite.getMonth() - CONSERVATION_MOIS);
  var dates = f.getRange(2, 1, n, 1).getValues();
  function perimee(i) {
    var d = dates[i][0];
    return d instanceof Date && d < limite;
  }
  for (var i = n - 1; i >= 0; i -= 1) {
    if (!perimee(i)) continue;
    var fin = i;
    while (i > 0 && perimee(i - 1)) i -= 1;
    f.deleteRows(i + 2, fin - i + 1);
  }
}

function installer() {
  onglet();
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'purger') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('purger').timeBased().everyDays(1).atHour(3).create();
  purger();
}
