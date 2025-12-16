const express = require('express');
const { listYards, createYard, updateYard, deleteYard } = require('../controllers/yardController');

const router = express.Router();

router.get('/', listYards);
router.post('/', createYard);
router.put('/:id', updateYard);
router.delete('/:id', deleteYard);

module.exports = router;
