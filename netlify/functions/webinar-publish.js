/**
 * netlify/functions/webinar-publish.js
 *
 * Lives on the SATELLITE site (not the main researchjunction.org site).
 * Takes the reviewed form data from webinar-admin.html, regenerates
 * index.html with the shared template, and commits it straight to
 * this satellite site's own GitHub repo — which is connected to this
 * Netlify site for auto-deploy, so the commit alone makes it go live.
 * No drag-and-drop step.
 *
 * The published file is named index.html (not webinar.html) so that
 * Netlify serves it at the satellite site's own root URL — Netlify
 * looks for index.html at the publish directory root by default, and
 * serving anything else there 404s on "/". The main site's /webinar
 * redirect then points at this site's root, not at a specific filename.
 *
 * Required Netlify env vars (Site settings → Environment variables):
 *   GH_PAT      — fine-grained GitHub PAT, "Contents: Read and write"
 *                 permission, scoped to ONLY this satellite repo
 *   GH_OWNER    — e.g. "ogadepoju"
 *   GH_REPO     — e.g. "rji-webinar"
 *   GH_BRANCH   — defaults to "main" if unset
 *   ADMIN_TOKEN — the passphrase webinar-admin.html's gate uses;
 *                 this is the REAL check, the browser gate is cosmetic
 *
 * Expects: POST body = the same data shape webinar-template.js takes
 * (title, headline, subtitle, dateDisplay, dateShort, timeDisplay,
 * platformDisplay, speakerName, speakerTitle, formUrl, cards[]),
 * header X-Admin-Token = the passphrase.
 */

const { generateWebinarHtml } = require("./webinar-template.js");

const GITHUB_API = "https://api.github.com";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const adminToken = process.env.ADMIN_TOKEN;
  const providedToken = event.headers["x-admin-token"] || event.headers["X-Admin-Token"];
  if (!adminToken || providedToken !== adminToken) {
    return { statusCode: 401, body: JSON.stringify({ error: "Invalid or missing admin token" }) };
  }

  const { GH_PAT, GH_OWNER, GH_REPO } = process.env;
  const GH_BRANCH = process.env.GH_BRANCH || "main";
  if (!GH_PAT || !GH_OWNER || !GH_REPO) {
    return { statusCode: 500, body: JSON.stringify({ error: "GH_PAT, GH_OWNER, or GH_REPO not configured" }) };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body" }) };
  }

  // Minimal validation — the admin page already checks these, but a
  // function is a public URL, so don't trust the client alone.
  const required = ["title", "headline", "subtitle", "dateDisplay", "dateShort", "timeDisplay", "platformDisplay", "speakerName", "speakerTitle", "formUrl"];
  const missing = required.filter((k) => !data[k]);
  if (missing.length) {
    return { statusCode: 400, body: JSON.stringify({ error: `Missing fields: ${missing.join(", ")}` }) };
  }
  if (!Array.isArray(data.cards) || data.cards.length === 0) {
    return { statusCode: 400, body: JSON.stringify({ error: "cards[] is required" }) };
  }

  const html = generateWebinarHtml(data);
  const path = "index.html";
  const ghHeaders = {
    Authorization: `Bearer ${GH_PAT}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };

  // 1. Get the current file's sha (required by GitHub to update an existing file).
  let currentSha = null;
  try {
    const getRes = await fetch(
      `${GITHUB_API}/repos/${GH_OWNER}/${GH_REPO}/contents/${path}?ref=${GH_BRANCH}`,
      { headers: ghHeaders }
    );
    if (getRes.status === 200) {
      const getJson = await getRes.json();
      currentSha = getJson.sha;
    } else if (getRes.status !== 404) {
      const errText = await getRes.text();
      return { statusCode: 502, body: JSON.stringify({ error: "GitHub GET failed", detail: errText }) };
    }
    // 404 is fine — means index.html doesn't exist yet, we're creating it.
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: "Could not reach GitHub", detail: String(e) }) };
  }

  // 2. Commit the new content.
  const contentBase64 = Buffer.from(html, "utf-8").toString("base64");
  const commitBody = {
    message: `Update webinar page: ${data.title}`,
    content: contentBase64,
    branch: GH_BRANCH,
    ...(currentSha ? { sha: currentSha } : {}),
  };

  let putRes;
  try {
    putRes = await fetch(`${GITHUB_API}/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`, {
      method: "PUT",
      headers: ghHeaders,
      body: JSON.stringify(commitBody),
    });
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: "Could not reach GitHub", detail: String(e) }) };
  }

  if (!putRes.ok) {
    const errText = await putRes.text();
    return { statusCode: 502, body: JSON.stringify({ error: "GitHub commit failed", detail: errText }) };
  }

  const putJson = await putRes.json();
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ok: true,
      commitUrl: putJson.commit && putJson.commit.html_url,
    }),
  };
};
