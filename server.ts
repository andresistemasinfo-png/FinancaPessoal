import express from "express";
import { createServer as createViteServer } from "vite";
import { google } from "googleapis";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(cors());

const PORT = 3000;

// In-memory store for tokens (for preview purposes)
let userTokens: any = null;

app.get("/api/auth/url", (req, res) => {
  const origin = req.query.origin as string;
  const redirectUri = `${origin}/auth/callback`;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/spreadsheets"],
    prompt: "consent",
    state: origin,
  });

  res.json({ url: authUrl });
});

app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
  const { code, state } = req.query;
  
  // Use the origin passed in the state, or fallback to https + host
  const origin = state ? String(state) : `https://${req.get("host")}`;
  const redirectUri = `${origin}/auth/callback`;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );

  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    userTokens = tokens;

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Autenticação concluída. Esta janela será fechada automaticamente.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("OAuth Error:", error);
    res.status(500).send("Erro na autenticação");
  }
});

app.post("/api/sync/create", async (req, res) => {
  if (!userTokens) return res.status(401).json({ error: "Não autenticado" });

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials(userTokens);
  const sheets = google.sheets({ version: "v4", auth: oauth2Client });

  try {
    const response = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title: "Controle Financeiro Pessoal" },
        sheets: [
          { properties: { title: "Contas" } },
          { properties: { title: "Projetos" } },
          { properties: { title: "Agentes" } },
          { properties: { title: "Classes" } },
          { properties: { title: "Lancamentos" } },
        ],
      },
    });
    res.json({
      spreadsheetId: response.data.spreadsheetId,
      url: response.data.spreadsheetUrl,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/sync/save", async (req, res) => {
  if (!userTokens) return res.status(401).json({ error: "Não autenticado" });
  const { spreadsheetId, data } = req.body;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials(userTokens);
  const sheets = google.sheets({ version: "v4", auth: oauth2Client });

  try {
    const buildValues = (items: any[]) => {
      if (!items || items.length === 0) return [];
      const headers = Object.keys(items[0]);
      const rows = items.map((item) =>
        headers.map((h) =>
          item[h] !== undefined && item[h] !== null ? String(item[h]) : ""
        )
      );
      return [headers, ...rows];
    };

    const dataToUpdate = [
      { range: "Contas!A1", values: buildValues(data.contas) },
      { range: "Projetos!A1", values: buildValues(data.projetos) },
      { range: "Agentes!A1", values: buildValues(data.agentes) },
      { range: "Classes!A1", values: buildValues(data.classes) },
      { range: "Lancamentos!A1", values: buildValues(data.lancamentos) },
    ].filter((d) => d.values.length > 0);

    if (dataToUpdate.length > 0) {
      // Clear existing data first
      await sheets.spreadsheets.values.batchClear({
        spreadsheetId,
        requestBody: {
          ranges: ["Contas", "Projetos", "Agentes", "Classes", "Lancamentos"],
        },
      });

      // Update with new data
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: "USER_ENTERED",
          data: dataToUpdate,
        },
      });
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
