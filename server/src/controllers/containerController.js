const xlsx = require('xlsx');
const Container = require('../models/Container');

const DEFAULT_STATUS = 'AT_TERMINAL';
const STATUS_VALUES = Container.STATUSES || [
  'AT_TERMINAL',
  'IN_TRANSIT_FROM_TERMINAL',
  'AT_CUSTOMER_YARD',
  'AT_OTHER_YARD',
  'EMPTY_AT_CUSTOMER',
  'RETURNING_TO_TERMINAL',
  'RETURNED'
];

const getTopOrderIndexForStage = async (status, yardId) => {
  const query = { status };
  if (status === 'AT_OTHER_YARD') {
    query.yardId = yardId || null;
  }

  const top = await Container.findOne(query).sort({ orderIndex: 1 }).lean();
  if (!top || typeof top.orderIndex !== 'number') {
    return 0;
  }
  return top.orderIndex - 1;
};

const normalizeHeader = (header) => {
  return header
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
};

const mapRowToContainer = (row) => {
  const normalizedRow = {};

  Object.entries(row).forEach(([key, value]) => {
    const normalizedKey = normalizeHeader(key);
    normalizedRow[normalizedKey] = value;
  });

  const headerMap = {
    case_number: 'caseNumber',
    input_person: 'inputPerson',
    eta: 'eta',
    container: 'containerNumber',
    container_number: 'containerNumber',
    container_no: 'containerNumber',
    mbl: 'mblNumber',
    chassis: 'chassisId',
    driver_pp: 'driverId',
    payments_demurrage_pier_pass: 'demurrage',
    size: 'size',
    terminals: 'terminal',
    lfd: 'lfd',
    appt: 'appointmentTime',
    notes_comments: 'notes',
    delivery_appt: 'deliveryAppointment',
    empty_status: 'emptyStatus',
    rt_loc_empty_appt: 'rtLocEmptyApp',
    yards: 'yards',
    pu_driver: 'puDriver',
    delivery_address_company_name_warehouse_contract: 'deliveryAddressCompany',
    delivery_address_company_name: 'deliveryAddressCompany',
    billing_party: 'billingParty',
    weight: 'weight'
  };

  const container = {};

  Object.entries(normalizedRow).forEach(([normalizedKey, value]) => {
    const field = headerMap[normalizedKey];
    if (!field) return;

    if (typeof value === 'string') {
      container[field] = value.trim();
      return;
    }

    if (value instanceof Date) {
      container[field] = value.toISOString();
      return;
    }

    container[field] = value != null ? String(value) : value;
  });

  return container;
};

const getContainers = async (_req, res) => {
  try {
    const containers = await Container.aggregate([
      {
        $addFields: {
          _sortOrder: {
            $ifNull: ['$orderIndex', Number.MAX_SAFE_INTEGER]
          },
          status: { $ifNull: ['$status', DEFAULT_STATUS] },
          id: { $toString: '$_id' }
        }
      },
      { $sort: { _sortOrder: 1, createdAt: -1, _id: 1 } },
      { $project: { _sortOrder: 0, _id: 0 } }
    ]);
    return res.status(200).json({ data: containers, message: 'Success' });
  } catch (err) {
    console.error('Error fetching containers:', err);
    return res.status(500).json({ error: 'Failed to fetch containers' });
  }
};

const getContainerById = async (req, res) => {
  try {
    const { id } = req.params;
    const container = await Container.findById(id);

    if (!container) {
      return res.status(404).json({ error: 'Container not found' });
    }

    const jsonContainer = container.toJSON();
    jsonContainer.status = jsonContainer.status || DEFAULT_STATUS;

    return res.status(200).json({ data: jsonContainer, message: 'Success' });
  } catch (err) {
    console.error('Error fetching container:', err);
    return res.status(500).json({ error: 'Failed to fetch container' });
  }
};

const createContainer = async (req, res) => {
  try {
    const { caseNumber, status, yardStatus, ...rest } = req.body;
    const trimmedCaseNumber = (caseNumber || '').toString().trim();

    if (!trimmedCaseNumber) {
      return res.status(400).json({ error: 'caseNumber is required' });
    }

    if (status && !STATUS_VALUES.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    if (status === 'AT_OTHER_YARD') {
      if (!rest.yardId) {
        return res.status(400).json({ error: 'yardId is required when status is AT_OTHER_YARD' });
      }
      if (!yardStatus || !['LOADED', 'EMPTY'].includes(yardStatus)) {
        return res.status(400).json({ error: 'yardStatus must be LOADED or EMPTY when status is AT_OTHER_YARD' });
      }
    }

    const newContainer = await Container.create({
      caseNumber: trimmedCaseNumber,
      status: status || DEFAULT_STATUS,
      yardStatus: status === 'AT_OTHER_YARD' ? yardStatus : null,
      yardId: status === 'AT_OTHER_YARD' ? rest.yardId : null,
      ...rest
    });

    return res.status(201).json({ data: newContainer, message: 'Container created' });
  } catch (err) {
    console.error('Error creating container:', err);
    return res.status(500).json({ error: 'Failed to create container' });
  }
};

const updateContainer = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};

    if (Object.prototype.hasOwnProperty.call(updates, 'caseNumber')) {
      const trimmedCaseNumber = (updates.caseNumber || '').toString().trim();
      if (!trimmedCaseNumber) {
        return res.status(400).json({ error: 'caseNumber cannot be empty' });
      }
      updates.caseNumber = trimmedCaseNumber;
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'status')) {
      if (!STATUS_VALUES.includes(updates.status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }
      if (updates.status === 'AT_OTHER_YARD') {
        if (!updates.yardId) {
          return res.status(400).json({ error: 'yardId is required when status is AT_OTHER_YARD' });
        }
        if (!updates.yardStatus || !['LOADED', 'EMPTY'].includes(updates.yardStatus)) {
          return res.status(400).json({ error: 'yardStatus must be LOADED or EMPTY when status is AT_OTHER_YARD' });
        }
      }
      if (!Object.prototype.hasOwnProperty.call(updates, 'orderIndex')) {
        updates.orderIndex = await getTopOrderIndexForStage(updates.status, updates.yardId);
      }
      if (updates.status !== 'AT_OTHER_YARD') {
        updates.yardId = null;
        updates.yardStatus = null;
      }
    }

    const updated = await Container.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

    if (!updated) {
      return res.status(404).json({ error: 'Container not found' });
    }

    return res.status(200).json({ data: updated, message: 'Container updated' });
  } catch (err) {
    console.error('Error updating container:', err);
    return res.status(500).json({ error: 'Failed to update container' });
  }
};

const updateContainerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, yardId = null, yardStatus = null, orderIndex } = req.body || {};

    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    if (!STATUS_VALUES.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    if (status === 'AT_OTHER_YARD') {
      if (!yardId) {
        return res.status(400).json({ error: 'yardId is required when status is AT_OTHER_YARD' });
      }
      if (!yardStatus || !['LOADED', 'EMPTY'].includes(yardStatus)) {
        return res.status(400).json({ error: 'yardStatus must be LOADED or EMPTY when status is AT_OTHER_YARD' });
      }
    }

    const resolvedOrderIndex =
      typeof orderIndex === 'number' && Number.isFinite(orderIndex)
        ? orderIndex
        : await getTopOrderIndexForStage(status, yardId);

    const updated = await Container.findByIdAndUpdate(
      id,
      {
        status,
        yardId: status === 'AT_OTHER_YARD' ? yardId : null,
        yardStatus: status === 'AT_OTHER_YARD' ? yardStatus : null,
        orderIndex: resolvedOrderIndex
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Container not found' });
    }

    return res.status(200).json({ data: updated, message: 'Container status updated' });
  } catch (err) {
    console.error('Error updating container status:', err);
    return res.status(500).json({ error: 'Failed to update container status' });
  }
};

const deleteContainer = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Container.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Container not found' });
    }

    return res.status(200).json({ data: deleted, message: 'Container deleted' });
  } catch (err) {
    console.error('Error deleting container:', err);
    return res.status(500).json({ error: 'Failed to delete container' });
  }
};

const importContainers = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No file uploaded. Please upload an XLSX file.' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      return res.status(400).json({ error: 'No sheets found in the uploaded file.' });
    }

    const worksheet = workbook.Sheets[sheetName];
    // Use formatted text so date/time cells stay as strings
    const rows = xlsx.utils.sheet_to_json(worksheet, { defval: '', raw: false });

    if (!rows.length) {
      return res.status(400).json({ error: 'The uploaded sheet is empty.' });
    }

    const operations = [];
    let skippedCount = 0;

    const missingCaseRows = [];

    rows.forEach((row, idx) => {
      const mapped = mapRowToContainer(row);
      if (!mapped.caseNumber) {
        skippedCount += 1;
        missingCaseRows.push(idx + 1);
        return;
      }

      mapped.orderIndex = idx;

      const setOnInsert = {
        status: DEFAULT_STATUS,
        yardStatus: null
      };

      operations.push({
        updateOne: {
          filter: { caseNumber: mapped.caseNumber },
          update: { $set: mapped, $setOnInsert: setOnInsert },
          upsert: true,
          setDefaultsOnInsert: true
        }
      });
    });

    if (missingCaseRows.length) {
      return res.status(400).json({
        error: 'Case Number is required for every row. Please add it and re-upload.',
        details: { missingRows: missingCaseRows }
      });
    }

    if (!operations.length) {
      return res.status(400).json({ error: 'No valid rows found. Ensure each row has a Case Number value.' });
    }

    const result = await Container.bulkWrite(operations, { ordered: false });

    const responseData = {
      insertedCount: result.upsertedCount || 0,
      updatedCount: result.modifiedCount || 0,
      matchedExisting: result.matchedCount || 0,
      skippedCount,
      totalRows: rows.length
    };

    return res.status(200).json({ data: responseData, message: 'Import completed' });
  } catch (err) {
    console.error('Error importing containers:', err);
    return res.status(500).json({ error: 'Failed to import containers' });
  }
};

module.exports = {
  getContainers,
  getContainerById,
  createContainer,
  updateContainer,
  updateContainerStatus,
  deleteContainer,
  importContainers
};
