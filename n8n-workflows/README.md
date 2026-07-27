# ScopeGuard n8n workflows

## Workflow 1: Analyse Project

`analyse-project.json` imports as **ScopeGuard — Analyse Project**. It accepts a
project and its original client context, validates the request before any model
call, asks Google Gemini for a strictly source-based analysis, normalises the model
output, and returns one frontend-compatible JSON response.

This workflow does not modify the ScopeGuard frontend and does not contain an
API key.

## Nodes

1. **Webhook — Analyse Project** receives a `POST` request at
   `scopeguard-analyse-project` and waits for a Respond to Webhook node.
2. **Validate Input** trims every input string and validates the required
   fields and minimum lengths.
3. **Input Valid?** routes invalid requests directly to the HTTP 400 response.
4. **Prepare AI Prompt** creates the strict source-only analysis instructions
   and required JSON shape.
5. **AI — Analyse Agreement** calls Gemini's `generateContent` REST endpoint
   through a local-n8n-compatible HTTP Request node. It uses a Header Auth
   credential placeholder, never a hardcoded key. **Never Error** remains
   enabled so API failures continue to the safe processing-error response.
6. **Parse and Normalise** reads Gemini text from
   `candidates[0].content.parts[].text`, catches empty or malformed model
   output, ensures arrays exist, repairs invalid requirement statuses to
   `unclear`, supplies missing item IDs, and adds `analysedAt`.
7. **Analysis Successful?** routes normalised output to success or a safe
   processing-error response.
8. **Respond — Success** returns HTTP 200.
9. **Respond — Invalid Input** returns HTTP 400 with validation details.
10. **Respond — Processing Error** returns HTTP 500 without internal error
    details.

## Import into n8n

1. Open n8n and go to **Workflows**.
2. Choose **Import from File**.
3. Select `n8n-workflows/analyse-project.json`.
4. Open **AI — Analyse Agreement** and configure the credential described
   below.
5. Save the workflow. Keep it inactive while testing with the test webhook.

## Create a Gemini API key

1. Open the
   [Google AI Studio API Keys page](https://aistudio.google.com/app/apikey).
2. Sign in and accept the Gemini API terms if prompted.
3. Select an existing Google Cloud project or create/import one.
4. Choose **Create API key**.
5. Copy the key once and store it securely. Do not paste it into this
   repository.

Google's current API-key guidance is available at
[Using Gemini API keys](https://ai.google.dev/gemini-api/docs/api-key).

## Configure the n8n credential manually

The HTTP Request node expects an n8n **Header Auth** credential named:

`ScopeGuard Gemini API`

Create that credential in n8n with:

- Credential type: **Header Auth**
- Header name: `x-goog-api-key`
- Header value: your Gemini API key, with no `Bearer` prefix

Then open **AI — Analyse Agreement** and select the credential you created.

## Endpoint and model

The workflow currently uses the stable, structured-output-capable model:

`gemini-flash-latest`

Google currently lists this model on the Gemini Developer API free tier. Free
usage is still subject to Google's regional availability and rate limits. See
the current [Gemini API pricing page](https://ai.google.dev/gemini-api/docs/pricing)
before relying on a particular quota.

The HTTP Request node calls:

`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent`

To change the model, open **AI — Analyse Agreement** and replace only
`gemini-2.5-flash-lite` in that URL with another supported Gemini model name.
The request body uses Gemini `system_instruction`, `contents`, and
`generationConfig`, with `responseMimeType` set to `application/json`.

Do not put an API key in the workflow JSON, a Code node, a frontend environment
variable, or Git. n8n credentials must remain encrypted inside your n8n
instance.

## Test with the n8n test webhook

1. Open the imported workflow.
2. Select **Webhook — Analyse Project**.
3. Choose **Listen for test event** or **Execute workflow** so the test webhook
   is listening.
4. From the repository root, run:

```powershell
$body = Get-Content -Raw ".\n8n-workflows\test-payloads\analyse-project.json"
Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:5678/webhook-test/scopeguard-analyse-project" `
  -ContentType "application/json" `
  -Body $body |
  ConvertTo-Json -Depth 20
```

Replace `http://localhost:5678` if n8n is hosted elsewhere.

If the request reaches **Respond — Processing Error**, confirm:

- **AI — Analyse Agreement** has the `ScopeGuard Gemini API` credential selected.
- The credential header is exactly `x-goog-api-key`.
- The key is active for the Gemini API.
- `gemini-2.5-flash-lite` is available for the key's project and region.

The test payload should identify the homepage, product catalogue, shopping
cart, contact form, and mobile responsiveness as confirmed requirements. The
homepage approval should be a decision; three-week delivery should be a
deadline; payment integration should remain proposed or postponed; and the
missing product images and About page content should appear as pending work or
open questions.

## Expected success response

The precise wording is model-generated, but the response shape is:

```json
{
  "success": true,
  "projectId": "demo-001",
  "analysis": {
    "summary": "A concise, source-based summary.",
    "requirements": [],
    "decisions": [],
    "deadlines": [],
    "actionItems": [],
    "openQuestions": [],
    "clientPreferences": [],
    "people": [],
    "analysedAt": "2026-01-01T12:00:00.000Z"
  }
}
```

## Expected validation error

An invalid request returns HTTP 400:

```json
{
  "success": false,
  "error": "Invalid request",
  "details": [
    "originalContext must contain at least 30 characters."
  ]
}
```

To test validation from Windows PowerShell:

```powershell
$invalidBody = @{
  projectId = "demo-001"
  projectName = "ABC Clothing Website"
  originalContext = "Too short"
} | ConvertTo-Json

try {
  Invoke-RestMethod `
    -Method Post `
    -Uri "http://localhost:5678/webhook-test/scopeguard-analyse-project" `
    -ContentType "application/json" `
    -Body $invalidBody
} catch {
  $_.ErrorDetails.Message
}
```

Start the test listener again before each test-webhook call.

## Production webhook

After the workflow is configured, tested, saved, and activated, its production
path is:

`/webhook/scopeguard-analyse-project`

For a local default n8n instance, that is:

`http://localhost:5678/webhook/scopeguard-analyse-project`

Before exposing the production webhook publicly, configure suitable webhook
authentication, restrict allowed callers, use HTTPS, and review n8n execution
data retention because the workflow processes client communications. Never
commit the Gemini API key, n8n credentials, or exported credential data. If a
key is exposed, revoke it in Google AI Studio and create a replacement.

---

## Workflow 2: Detect Scope Change

`detect-scope-change.json` imports as
**ScopeGuard — Detect Scope Change**. It compares a new client message with the
confirmed requirements, recorded decisions, and deadlines from Workflow 1.
It returns new requests, changed requirements, conflicts, cautious project
impact, and a professional suggested reply.

The workflow validates the request before calling Gemini. Repeated requirements
and non-material clarifications are not meant to be flagged. Missing arrays and
IDs are normalised, invalid risk levels fall back to `medium` or `none`, and
empty or malformed Gemini responses return a safe HTTP 500 response.

### Workflow 2 nodes

1. **Webhook — Detect Scope Change** accepts a `POST` request at
   `scopeguard-detect-scope-change`.
2. **Validate Input** trims strings and checks `projectId`,
   `existingAnalysis`, `existingAnalysis.requirements`, and `newMessage`.
3. **Input Valid?** prevents invalid input from reaching Gemini.
4. **Prepare Comparison Prompt** builds a comparison record using confirmed
   requirements, decisions, and deadlines.
5. **AI — Detect Scope Change** calls Gemini using the same HTTP Request
   structure and Header Auth credential as Workflow 1.
6. **Parse and Normalise** reads
   `candidates[0].content.parts[].text`, validates JSON, supplies arrays and
   IDs, normalises risk, and adds `checkedAt`.
7. **Scope Analysis Successful?** routes usable results to success and
   processing failures to the safe error response.
8. **Respond — Success** returns HTTP 200.
9. **Respond — Invalid Input** returns HTTP 400 with validation details.
10. **Respond — Processing Error** returns HTTP 500 without exposing internal
    errors.

### Import Workflow 2

1. Open n8n and go to **Workflows**.
2. Choose **Import from File**.
3. Select `n8n-workflows/detect-scope-change.json`.
4. Open **AI — Detect Scope Change**.
5. Select the same **Header Auth** credential used by Workflow 1:
   `ScopeGuard Gemini API`.
6. Confirm that **Never Error** is enabled and the response format is JSON.
7. Save the workflow. Keep it inactive while using the test webhook.

Workflow 2 uses the same working model as Workflow 1:

`gemini-2.5-flash-lite`

Its endpoint is:

`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent`

If the working model is changed later, update the model segment in both
workflow URLs so their behaviour remains consistent.

### Test Workflow 2 with PowerShell

1. Open the imported Workflow 2.
2. Select **Webhook — Detect Scope Change**.
3. Choose **Listen for test event** or **Execute workflow**.
4. From the ScopeGuard repository root, run:

```powershell
$body = Get-Content -Raw ".\n8n-workflows\test-payloads\detect-scope-change.json"
Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:5678/webhook-test/scopeguard-detect-scope-change" `
  -ContentType "application/json" `
  -Body $body |
  ConvertTo-Json -Depth 20
```

Replace `http://localhost:5678` if n8n is hosted at another address. Start the
test listener again before each test-webhook request.

The provided payload should produce:

- `isScopeChange: true`
- `riskLevel: high`
- product reviews, discount codes, and live chat as new requests
- the Friday request as deadline compression or a conflict
- cautious impact wording about possible additional development work, a
  revised timeline, or revised pricing, without exact figures
- a polite, copy-ready suggested reply

The successful response shape is:

```json
{
  "success": true,
  "projectId": "demo-001",
  "scopeCheck": {
    "isScopeChange": true,
    "riskLevel": "high",
    "newRequests": [],
    "changedRequirements": [],
    "conflicts": [],
    "impact": [],
    "explanation": "A source-based explanation.",
    "suggestedReply": "A professional reply ready to send.",
    "checkedAt": "2026-01-01T12:00:00.000Z"
  }
}
```

To verify validation, start the Workflow 2 test listener and run:

```powershell
$invalidBody = @{
  projectId = "demo-001"
  existingAnalysis = @{ requirements = @() }
  newMessage = "Short"
} | ConvertTo-Json -Depth 10

try {
  Invoke-RestMethod `
    -Method Post `
    -Uri "http://localhost:5678/webhook-test/scopeguard-detect-scope-change" `
    -ContentType "application/json" `
    -Body $invalidBody
} catch {
  $_.ErrorDetails.Message
}
```

The production webhook path, available after Workflow 2 is activated, is:

`/webhook/scopeguard-detect-scope-change`

The default local production URL is:

`http://localhost:5678/webhook/scopeguard-detect-scope-change`

Both workflows use the `ScopeGuard Gemini API` n8n credential with the
`x-goog-api-key` header. Never paste the Gemini key into either workflow JSON,
the README, frontend code, or source control.
