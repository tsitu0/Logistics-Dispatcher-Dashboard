const mongoose = require('mongoose');

const CONTAINER_STATUSES = [
  'AT_TERMINAL',
  'IN_TRANSIT_FROM_TERMINAL',
  'ON_WAY_TO_CUSTOMER',
  'ON_WAY_TO_YARD',
  'AT_CUSTOMER_YARD',
  'AT_OTHER_YARD',
  'EMPTY_AT_CUSTOMER',
  'RETURNING_TO_TERMINAL',
  'RETURNED'
];

const containerSchema = new mongoose.Schema(
  {
    containerNumber: { type: String, trim: true },
    caseNumber: { type: String, required: true, trim: true },
    mblNumber: String,
    size: String,
    terminal: String,
    deliveryAddressCompany: String,
    weight: Number,
    lfd: String,
    eta: String,
    billingParty: String,
    demurrage: String,
    inputPerson: String,
    appointmentTime: String,
    deliveryAppointment: String,
    emptyStatus: String,
    rtLocEmptyApp: String,
    yards: String,
    puDriver: String,
    notes: String,
    driverId: String,
    chassisId: String,
    status: {
      type: String,
      enum: CONTAINER_STATUSES,
      default: 'AT_TERMINAL'
    },
    yardId: {
      type: String,
      default: null
    },
    yardStatus: {
      type: String,
      enum: ['LOADED', 'EMPTY'],
      default: null,
      validate: {
        validator: (value) => value === null || ['LOADED', 'EMPTY'].includes(value),
        message: 'yardStatus must be LOADED or EMPTY'
      }
    },
    orderIndex: { type: Number, default: Number.MAX_SAFE_INTEGER },
    createdAt: { type: Date, default: Date.now }
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

const Container = mongoose.model('Container', containerSchema);
Container.STATUSES = CONTAINER_STATUSES;

module.exports = Container;
