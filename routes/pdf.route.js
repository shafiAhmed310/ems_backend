const express = require('express');
const router = express.Router();
const fileUpload = require('../middleware/storage');
const pdfController = require('../controllers/pdf.controller');
const auth = require('../middleware/auth')

router.get('/get-pdf',auth.auth, pdfController.getPdf);
router.get('/get-pdf/:id', auth.auth, pdfController.getPdfWIthID);
router.get('/:month',auth.auth,pdfController.getPdfWIthMonth)
router.post('/add-pdf',auth.auth,fileUpload.upload.single('file'), pdfController.addPdf);
router.put('/edit-pdf/:id', auth.auth, pdfController.updatePdf);
router.post('/search-pdf',auth.auth,pdfController.searchPdf)
module.exports = router;
