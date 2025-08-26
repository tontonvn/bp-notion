// netlify/functions/notion-sync.js
import { Client } from "@notionhq/client";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "OPTIONS,POST",
};

export async function handler(event) {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: cors, body: "ok" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: cors, body: "Method Not Allowed" };
  }

  try {
    const { sbp, dbp, hr, wt, t, note, site } = JSON.parse(event.body || "{}");
    if (!sbp || !dbp || !t) throw new Error("missing fields");

    const notion = new Client({ auth: process.env.NOTION_TOKEN });
    const DB_ID = process.env.NOTION_DB_ID;

    await notion.pages.create({
      parent: { database_id: DB_ID },
      properties: {
        Date:   { date:   { start: t } },
        Site:   { select: { name: site === "office" ? "診療室" : "家庭" } },
        SBP:    { number: Number(sbp) },
        DBP:    { number: Number(dbp) },
        HR:     { number: hr != null ? Number(hr) : null },
        Weight: { number: wt != null ? Number(wt) : null },
      },
      children: note
        ? [{ object: "block", type: "paragraph",
             paragraph: { rich_text: [{ type: "text", text: { content: note } }] } }]
        : [],
    });

    return { statusCode: 200, headers: { ...cors, "Content-Type": "application/json" }, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    return { statusCode: 400, headers: { ...cors, "Content-Type": "text/plain" }, body: String(e) };
  }
}
