const { Router } = require("express");
const multer = require("multer");
const readline = require("readline");
const { Readable } = require("stream");
const XLSX = require('xlsx');

const multerConfig = multer();

const router = Router();

const studentsListCard = require("./controllers/studentsListCard");
const studentsListFrequency = require("./controllers/studentsListFrequency");
const pouchesTags = require("./controllers/pouchesTags");
const teachersImport = require("./controllers/teachersImport");
const descriptors = require("./controllers/descriptors");

router.get("/test", (request, response) => {
  response.json({ message: "Ok api running" });
})

router.post("/students-list-card", multerConfig.single("file"), studentsListCard)
router.post("/students-list-frequency", multerConfig.single("file"), studentsListFrequency)
router.post("/pouches-tags", multerConfig.single("file"), pouchesTags)

router.post("/teachers-import", multerConfig.single("file"), teachersImport)

router.post("/descriptors", multerConfig.single("file"), descriptors)


module.exports = router;
