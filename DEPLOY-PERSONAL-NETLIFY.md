# Deploy this dashboard to your own (personal) Netlify account

This folder is the whole Next.js dashboard. It does not need the organisation's GitHub repo to be connected to Netlify:
it talks to the QA repo (`ICMarkets/icm.qa-agent`) through the GitHub API using the token you already created.

Note: a Next.js app with login, API routes and server pages cannot be deployed by dragging the folder into Netlify's
"Deploy manually" box (that only serves static files). Use the Netlify CLI below: it builds the app on your Mac and uploads it.

## Steps (about 10 minutes)

1. Install Node 20+ and the Netlify CLI (once):
   ```bash
   npm install -g netlify-cli
   ```
2. Unzip, then in a terminal:
   ```bash
   cd icm-qa-dashboard
   netlify login                         # opens the browser: sign in to YOUR Netlify account
   netlify sites:create --name icm-lp-qa # pick any free name; this links the folder to the new site
   ```
3. Set the environment variables (secrets are hidden afterwards):
   ```bash
   netlify env:set NODE_VERSION 20
   netlify env:set DASHBOARD_USER admin
   netlify env:set DASHBOARD_PASSWORD 'choose-a-strong-password' --secret
   netlify env:set GITHUB_TOKEN 'github_pat_...' --secret
   netlify env:set GITHUB_REPO ICMarkets/icm.qa-agent
   netlify env:set RESULTS_BRANCH main
   netlify env:set WORKFLOW_FILE qa-agent.yml
   netlify env:set WORKFLOW_REF main
   # optional: netlify env:set NEXT_PUBLIC_SHEET_URL 'https://docs.google.com/spreadsheets/d/.../edit'
   ```
   (If `--secret` is not accepted by your CLI version, set the same variables in the Netlify UI:
   Site configuration -> Environment variables, and tick "Contains secret values".)
4. Build and publish:
   ```bash
   netlify deploy --build --prod
   ```
   The last lines print the live URL (`https://icm-lp-qa.netlify.app`). Open it and log in.
5. In the QA repo on GitHub (Settings -> Secrets and variables -> Actions -> Variables) add
   `DASHBOARD_URL` = that URL, so Slack's "See here" link points to it.

## Updating later
Replace the files with a newer zip and run `netlify deploy --build --prod` again. Changing a variable: `netlify env:set ...`
then redeploy.

## Quick checks
- Login page appears (browser pop-up asking user + password): normal.
- Overview shows runs. If it says "Could not load results", the message explains the token problem.
- The play button next to a URL should answer "Run queued" and a run appears in the repo's Actions tab.
- Schedule card: Save should work (needs the token's Contents: Read and write).

## Local test before deploying (optional)
```bash
cp .env.example .env.local     # fill GITHUB_TOKEN etc.
npm install && npm run dev     # http://localhost:3000
```
