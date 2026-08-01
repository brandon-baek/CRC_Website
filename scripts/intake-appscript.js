/**
 * Google Apps Script for the Consumer Resource Center intake form.
 *
 * Paste this into the Apps Script editor attached to the intake Google Sheet,
 * then deploy it as a Web App. Full instructions: docs/intake-sheet-setup.md
 *
 * It only ever appends a row. It cannot read the Sheet, and it returns nothing
 * about it, so the deployment being reachable does not expose submissions.
 */

/** Must match INTAKE_SHARED_KEY in the Cloudflare Pages project. */
const SHARED_KEY = '';

/**
 * Set this to a staff address to get an email whenever someone writes in.
 * Left empty, no mail is sent — the Sheet is still updated either way.
 */
const NOTIFY_EMAIL = '';

const HEADERS = [
  'Submitted at',
  'Language',
  'Page',
  'First name',
  'Last name',
  'Phone',
  'Email',
  'City',
  'ZIP',
  'Concern',
  'Concern (other)',
  'What happened',
];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // Reject anyone who found the URL but not the key.
    if (SHARED_KEY && data.key !== SHARED_KEY) {
      return jsonOut({ error: 'unauthorized' });
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

    // Write the header row once, on the first submission.
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    sheet.appendRow([
      data.submittedAt || new Date().toISOString(),
      data.locale || '',
      data.page || '',
      data.firstName || '',
      data.lastName || '',
      // Leading apostrophe keeps Sheets from mangling a phone number or a
      // ZIP with a leading zero into a number.
      data.phone ? "'" + data.phone : '',
      data.email || '',
      data.city || '',
      data.zip ? "'" + data.zip : '',
      data.concern || '',
      data.concernOther || '',
      data.story || '',
    ]);

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail({
        to: NOTIFY_EMAIL,
        subject: 'New intake form submission',
        body: [
          'Name: ' + data.firstName + ' ' + data.lastName,
          'Phone: ' + (data.phone || '—'),
          'Email: ' + (data.email || '—'),
          'City/ZIP: ' + (data.city || '—') + ' ' + (data.zip || ''),
          'Concern: ' + (data.concern || '—') + ' ' + (data.concernOther || ''),
          'Language: ' + (data.locale || '—'),
          '',
          data.story || '',
          '',
          'Open the Sheet to reply.',
        ].join('\n'),
      });
    }

    return jsonOut({ ok: true });
  } catch (err) {
    return jsonOut({ error: String(err) });
  }
}

function jsonOut(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
