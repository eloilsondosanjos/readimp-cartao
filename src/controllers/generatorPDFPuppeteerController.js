const puppeteer = require("puppeteer");
const path = require("path");
const fs = require('fs');

const generatorPDFPuppeteer = async (html, fileName) => {
  let browser;
  let page;

  try {
    browser = await puppeteer.launch({headless: true, args:['--no-sandbox']});
    page = await browser.newPage();
  }
  catch(e) {
    const error = "Erro ao gerar relatorio: " + e.stack;
    console.log(error);
    throw new Error(error);
  }
  
  await page.setContent(html);
    
  const destinationFolder = path.resolve("tmp", `${fileName}`)

  await page.addStyleTag({ content: '@media print { .page { page-break-after: always; } }' });
  
  await page.pdf({ path: destinationFolder, format: 'A4'})

  await browser.close() 
}

module.exports = generatorPDFPuppeteer;