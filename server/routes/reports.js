const express = require('express');
const router = express.Router();

// TODO: Implementar rotas de reports
router.get('/', (req, res) => {
  res.json({ message: 'Reports - Em desenvolvimento' });
});

module.exports = router;