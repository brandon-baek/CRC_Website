# Setting up the intake form's Google Sheet

The Contact and Get Help pages have a form that sends what people write to a
Google Sheet the staff can read. Until the steps below are done the form shows
"Online intake is coming soon" and stays disabled — the site works fine without
it, so there is no rush and nothing breaks half-configured.

Takes about ten minutes. You need a Google account and access to the Cloudflare
Pages project.

---

## Before you start: who can see this

Submissions contain people's names, phone numbers, email addresses, and the
story of how they were defrauded. Treat the Sheet the way you would treat a
filing cabinet of case notes:

- **Do not turn on link sharing.** Share it with named staff accounts only.
- The Apps Script deployment below is set to "Anyone". That lets the *website*
  add rows. It does **not** let anyone read the Sheet — the script only ever
  appends, and never returns any of its contents.
- If you later export or forward a submission, remember it is somebody's
  personal information.

---

## 1. Create the Sheet

1. Go to [sheets.new](https://sheets.new) to make a blank spreadsheet.
2. Name it something obvious, e.g. **CRC intake form responses**.
3. Leave it empty. The script writes the header row itself on the first
   submission.

## 2. Add the script

1. In the Sheet: **Extensions → Apps Script**. A code editor opens.
2. Delete whatever is in the editor.
3. Open `scripts/intake-appscript.js` in this repository, copy all of it, and
   paste it in.
4. Make up a long random password — letters and numbers, 20+ characters. Put it
   between the quotes on the `SHARED_KEY` line:
   ```js
   const SHARED_KEY = 'paste-your-long-random-password-here';
   ```
   Keep it somewhere safe; you need the same value in step 4.
5. Click the save icon.

## 3. Deploy it as a web app

1. **Deploy → New deployment**.
2. Click the gear next to "Select type" and choose **Web app**.
3. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy**. Google asks you to authorize it — this is your own script
   writing to your own Sheet, so approve it. On the "Google hasn't verified this
   app" screen, choose **Advanced → Go to (project name)**.
5. Copy the **Web app URL**. It looks like
   `https://script.google.com/macros/s/AKfy…/exec`.

> Whenever you edit the script later, you must **Deploy → Manage deployments →
> edit → New version** for the change to take effect. Saving alone does nothing
> to the live URL.

## 4. Tell the website about it

In the Cloudflare Pages project: **Settings → Environment variables →
Production**, add two variables and tick **Encrypt** on both:

| Name | Value |
|---|---|
| `INTAKE_SHEET_URL` | the Web app URL from step 3 |
| `INTAKE_SHARED_KEY` | the same password you put in `SHARED_KEY` |

Then **redeploy** the site (Deployments → Retry deployment, or push any commit).
Environment variables only take effect on a new build.

The form enables itself as soon as the site can see `INTAKE_SHEET_URL` — no code
change needed.

## 5. Check it end to end

1. Open the live `/contact` page. The "coming soon" notice should be gone and
   the fields should be editable.
2. Fill it in with test details and send it.
3. The Sheet should gain a row within a couple of seconds.
4. Do it once more in Korean at `/ko/contact`, and check the Korean text arrives
   readable rather than as boxes or question marks.

---

## Optional: get an email for each submission

In the Apps Script editor, put a staff address on the `NOTIFY_EMAIL` line:

```js
const NOTIFY_EMAIL = 'staff@example.org';
```

Save, then **Deploy → Manage deployments → New version**. Google's free quota is
about 100 such emails a day, which is far more than this form will ever produce.

---

## If something goes wrong

**The form still says "coming soon" after a redeploy.**
Open `https://<your-site>/api/intake` in a browser. It should print
`{"enabled":true}`. If it prints `false`, the site cannot see
`INTAKE_SHEET_URL` — check the spelling of the variable name, that it is set on
the **Production** environment, and that you redeployed after adding it.

**Submissions fail with an error message on the page.**
The site could not reach the Apps Script. Common causes: the deployment's
"Who has access" is not **Anyone**; the script was edited but not redeployed as
a new version; or `INTAKE_SHARED_KEY` and `SHARED_KEY` no longer match.

**Rows appear with empty columns.**
The script's column order comes from `HEADERS`. If you rearranged the Sheet's
columns by hand, put them back — the script appends by position, not by name.

## Testing locally before deploying

```bash
npm run build && npx wrangler pages dev dist
```

Put the same two values in a `.dev.vars` file at the repository root (copy
`.dev.vars.example`). That file is gitignored — never commit real values.
`npm run dev` alone does not run Functions, so the form stays disabled there.
