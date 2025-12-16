const express = require('express');
const multer = require('multer');
const {
  getContainers,
  getContainerById,
  createContainer,
  updateContainer,
  updateContainerStatus,
  deleteContainer,
  importContainers
} = require('../controllers/containerController');

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.get('/', getContainers);
router.post('/import', upload.single('file'), importContainers);
router.put('/:id/status', updateContainerStatus);
router.get('/:id', getContainerById);
router.post('/', createContainer);
router.put('/:id', updateContainer);
router.delete('/:id', deleteContainer);

module.exports = router;
