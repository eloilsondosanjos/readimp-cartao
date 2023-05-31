const readline = require("readline");
const { Readable } = require("stream");
const ejs = require("ejs");
const path = require("path");
const generatorPDFPuppeteer = require('../controllers/generatorPDFPuppeteerController');
const clients = require('../util/clientsList')
const QRCode = require('qrcode');
const moment = require("moment");
const crypto = require("crypto");
const selectTemplate = require("../util/selectTemplate");
const { chunk } = require("lodash");

const pouchesTags = async (request, response) => {

  const { discipline, evaluation, client } = request.body
  const { file } = request

  if (!file) {
    return response.status(400).json(
      { message: 'O arquivo com a lista de alunos é obrigatório' })
  }

  if (!discipline) {
    return response.status(400).json({ message: 'O nome da disciplina é obrigatório' })
  }

  if (!evaluation) {
    return response.status(400).json({ message: 'O nome da avaliação é obrigatório' })
  }

  if (!client) {
    return response.status(400).json(
      { message: 'O client é obrigatório', example: clients })
  }

  const templatName = selectTemplate(response, client);

  const { buffer } = file
  const readableFile = new Readable();
  readableFile.push(buffer.toString("latin1"));
  readableFile.push(null)

  const schoolsLine = readline.createInterface({
    input: readableFile
  })

  const schools = []

  for await (let line of schoolsLine) {
    const schoolsLineSplit = line.split(";")

    schools.push({
      nameSchool: schoolsLineSplit[0].replace('ESCOLA MUNICIPAL ', ''),
      studant: schoolsLineSplit[1],
      class: schoolsLineSplit[4],
      currentYear: schoolsLineSplit[5] + 'º ANO',
      period: schoolsLineSplit[7],
    })
  }

  const items = [];

  for (let i = 1; i < schools.length - 1; i += 1) {

    const dataURL = `${schools[i].nameSchool} ${schools[i].currentYear} ${schools[i].class}`

    // const qrcodeDataURL = await QRCode.toDataURL(dataURL);

    items.push({
      nameSchool: schools[i].nameSchool,
      currentYear: schools[i].currentYear,
      class: schools[i].class,
      period: schools[i].period,
      // qrcodeURL: qrcodeDataURL
    });

  };

  const uniqueItems = Array.from(new Set(items.map(JSON.stringify))).map(JSON.parse);

  const tagData = uniqueItems.map(school => {
    schools.filter((filter) =>
      school.nameSchool === filter.nameSchool &&
      school.currentYear === filter.currentYear &&
      school.class === filter.class
      // &&
      // school.qrcodeURL === filter.qrcodeURL
    )

    const ListStudentsTheUniqueByClass = schools.filter((filter) =>
      school.nameSchool === filter.nameSchool &&
      school.currentYear === filter.currentYear &&
      school.class === filter.class)

    const ListStudentsByClass = ListStudentsTheUniqueByClass.map(studantOfClass => studantOfClass.studant)

    const countTests = String(ListStudentsByClass.length).padStart(2, '0')

    return {
      ...school,
      discipline,
      evaluation,
      countTests
    }

  });

  tagData.sort((a, b) => a.class > b.class ? 1 : a.class < b.class ? -1 : 0)
  tagData.sort((a, b) => a.currentYear > b.currentYear ? 1 : a.currentYear < b.currentYear ? -1 : 0)
  tagData.sort((a, b) => a.nameSchool > b.nameSchool ? 1 : a.nameSchool < b.nameSchool ? -1 : 0)

  const itemsPerPages = 8
  let chunks = []
  let tags = []
 
  for (let i = 0; i < tagData.length; i += itemsPerPages) {
    const chunk = tagData.slice(i, i + itemsPerPages);

    if (chunk.length > 0) {
      const lastElementIndex = i + chunk.length - 1;
      tagData[lastElementIndex].page = Math.ceil((i + 1) / itemsPerPages);
    }

    chunks.push(chunk)
    
  }

  for (let i = 0; i < chunks.length; i++) {
    for(let j = 0; j < chunks[i].length; j++) {
      tags.push(chunks[i][j])
    }
  }

  const filePathTemplat = path.join(__dirname, "../", "views", "templats", templatName);

  ejs.renderFile(filePathTemplat, { tags }, async (err, html) => {
    if (err) {
      return response.status(500).json({ message: "Erro na leitura do arquivo" })
    }

    const clientNameForFile = client.toLowerCase().replace(/\s/g, '_');
    const currentDateForFileName = moment(Date.now()).format('YYYYMMDD');
    const fileHash = crypto.randomBytes(6).toString('hex').toUpperCase();

    const fileName = `etiquetas_${clientNameForFile}_${currentDateForFileName}${fileHash}.pdf`

    await generatorPDFPuppeteer(html, fileName)

    return response.status(201).json(`PDF gerado com sucesso`)
    return response.send(html)
  })
};

module.exports = pouchesTags;