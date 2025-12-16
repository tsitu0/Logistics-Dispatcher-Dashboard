const mongoose = require('mongoose');

const yardSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    contact: { type: String, trim: true },
    notes: { type: String, trim: true }
  },
  {
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
      }
    }
  }
);

module.exports = mongoose.model('Yard', yardSchema);
