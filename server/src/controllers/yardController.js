const Yard = require('../models/Yard');

const listYards = async (_req, res) => {
  try {
    const yards = await Yard.find({}).sort({ name: 1 });
    const data = yards.map((y) => y.toJSON());
    return res.status(200).json({ data, message: 'Success' });
  } catch (err) {
    console.error('Error fetching yards:', err);
    return res.status(500).json({ error: 'Failed to fetch yards' });
  }
};

const createYard = async (req, res) => {
  try {
    const { name, address, contact, notes } = req.body || {};
    if (!name || !name.toString().trim()) {
      return res.status(400).json({ error: 'name is required' });
    }

    const yard = await Yard.create({
      name: name.toString().trim(),
      address,
      contact,
      notes
    });

    return res.status(201).json({ data: yard, message: 'Yard created' });
  } catch (err) {
    console.error('Error creating yard:', err);
    return res.status(500).json({ error: 'Failed to create yard' });
  }
};

const updateYard = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};
    if (updates.name && !updates.name.toString().trim()) {
      return res.status(400).json({ error: 'name cannot be empty' });
    }
    const yard = await Yard.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );
    if (!yard) {
      return res.status(404).json({ error: 'Yard not found' });
    }
    return res.status(200).json({ data: yard, message: 'Yard updated' });
  } catch (err) {
    console.error('Error updating yard:', err);
    return res.status(500).json({ error: 'Failed to update yard' });
  }
};

const deleteYard = async (req, res) => {
  try {
    const { id } = req.params;
    const yard = await Yard.findByIdAndDelete(id);
    if (!yard) {
      return res.status(404).json({ error: 'Yard not found' });
    }
    return res.status(200).json({ data: yard, message: 'Yard deleted' });
  } catch (err) {
    console.error('Error deleting yard:', err);
    return res.status(500).json({ error: 'Failed to delete yard' });
  }
};

module.exports = {
  listYards,
  createYard,
  updateYard,
  deleteYard
};
