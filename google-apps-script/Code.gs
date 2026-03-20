const SHEET_NAME_MAP = {
  youth_registration: 'Youth Registration',
  pastors_missionaries_registration: 'PastorsMissionaries Registration',
  merch_order: 'Merch Orders'
};

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    const formType = String(payload.formType || '').trim();
    if (!formType) {
      throw new Error('Missing formType in payload.');
    }

    const sheetName = SHEET_NAME_MAP[formType] || String(payload.targetSheet || 'Submissions').trim();
    const sheet = getOrCreateSheet_(sheetName);
    appendSubmission_(sheet, formType, payload);

    return jsonResponse_({ ok: true, sheet: sheetName });
  } catch (err) {
    return jsonResponse_({ ok: false, error: err.message });
  }
}

function doGet() {
  return jsonResponse_({
    ok: true,
    message: 'YouthCamp2026 Google Sheets endpoint is running.'
  });
}

function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error('No request body received.');
  }

  const raw = e.postData.contents;
  let payload;

  try {
    payload = JSON.parse(raw);
  } catch (jsonErr) {
    // Supports posting as payload={...json...}
    const maybePayload = (e.parameter && e.parameter.payload) ? e.parameter.payload : '';
    if (!maybePayload) {
      throw new Error('Invalid JSON payload.');
    }
    payload = JSON.parse(maybePayload);
  }

  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload must be a JSON object.');
  }

  return payload;
}

function getOrCreateSheet_(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

function appendSubmission_(sheet, formType, payload) {
  if (formType === 'youth_registration') {
    const headers = [
      'submittedAt',
      'churchName',
      'pastorName',
      'churchAddress',
      'delegationHeadName',
      'delegationHeadEmail',
      'men',
      'ladies',
      'totalDelegates',
      'totalFee',
      'paymentMethod',
      'referenceNo',
      'amountPaid',
      'paymentDate',
      'accountName',
      'receiptFileName',
      'delegatesJson'
    ];
    ensureHeader_(sheet, headers);

    const summary = payload.summary || {};
    const payment = payload.payment || {};
    const row = [
      payload.submittedAt || new Date().toISOString(),
      payload.churchName || '',
      payload.pastorName || '',
      payload.churchAddress || '',
      payload.delegationHeadName || '',
      payload.delegationHeadEmail || '',
      Number(summary.men || 0),
      Number(summary.ladies || 0),
      Number(summary.total || 0),
      Number(summary.totalFee || 0),
      payment.method || '',
      payment.referenceNo || '',
      Number(payment.amountPaid || 0),
      payment.paymentDate || '',
      payment.accountName || '',
      payment.receiptFileName || '',
      JSON.stringify(payload.delegates || [])
    ];
    sheet.appendRow(row);
    return;
  }

  if (formType === 'pastors_missionaries_registration') {
    const headers = [
      'submittedAt',
      'role',
      'firstName',
      'middleName',
      'lastName',
      'gender',
      'birthDate',
      'civilStatus',
      'contactNumber',
      'email',
      'emergencyContactPerson',
      'emergencyContactNumber',
      'homeAddress',
      'churchName',
      'churchAddress',
      'yearsInMinistry',
      'ministryInterest',
      'paymentMethod',
      'referenceNo',
      'amountPaid',
      'paymentDate',
      'accountName',
      'receiptFileName'
    ];
    ensureHeader_(sheet, headers);

    const personal = payload.personalInfo || {};
    const church = payload.churchInfo || {};
    const payment = payload.payment || {};
    const row = [
      payload.submittedAt || new Date().toISOString(),
      payload.role || '',
      personal.firstName || '',
      personal.middleName || '',
      personal.lastName || '',
      personal.gender || '',
      personal.birthDate || '',
      personal.civilStatus || '',
      personal.contactNumber || '',
      personal.email || '',
      personal.emergencyContactPerson || '',
      personal.emergencyContactNumber || '',
      personal.homeAddress || '',
      church.churchName || '',
      church.churchAddress || '',
      church.yearsInMinistry || '',
      church.ministryInterest || '',
      payment.method || '',
      payment.referenceNo || '',
      Number(payment.amountPaid || 0),
      payment.paymentDate || '',
      payment.accountName || '',
      payment.receiptFileName || ''
    ];
    sheet.appendRow(row);
    return;
  }

  if (formType === 'merch_order') {
    const headers = [
      'submittedAt',
      'firstName',
      'lastName',
      'churchName',
      'facebookLink',
      'quantity',
      'size',
      'unitPrice',
      'totalAmount',
      'receiptFileName'
    ];
    ensureHeader_(sheet, headers);

    const row = [
      payload.submittedAt || new Date().toISOString(),
      payload.firstName || '',
      payload.lastName || '',
      payload.churchName || '',
      payload.facebookLink || '',
      Number(payload.quantity || 0),
      payload.size || '',
      Number(payload.unitPrice || 0),
      Number(payload.totalAmount || 0),
      payload.receiptFileName || ''
    ];
    sheet.appendRow(row);
    return;
  }

  const headers = ['submittedAt', 'formType', 'rawJson'];
  ensureHeader_(sheet, headers);
  sheet.appendRow([
    payload.submittedAt || new Date().toISOString(),
    formType,
    JSON.stringify(payload)
  ]);
}

function ensureHeader_(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
