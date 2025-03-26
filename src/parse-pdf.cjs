const pdfParse = require("pdf-parse");
module.exports = async function parsePdf(data) {
  const result = await pdfParse(data);
  return result;
}