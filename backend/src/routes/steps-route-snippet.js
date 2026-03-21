// Adicionar essa rota no arquivo backend/src/routes/products.js

// GET /api/customization-steps
router.get('/customization-steps', (req, res) => {
  const steps = db.prepare(`
    SELECT * FROM customization_steps WHERE active = 1 ORDER BY sort_order
  `).all();

  const stepsWithOptions = steps.map(step => {
    const options = db.prepare(`
      SELECT * FROM step_options WHERE step_id = ? AND active = 1 ORDER BY sort_order
    `).all(step.id);
    return { ...step, options };
  });

  res.json(stepsWithOptions);
});
