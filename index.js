// This line must be at the very top to load environment variables
import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dialogflow from '@google-cloud/dialogflow';
import { v4 as uuidv4 } from 'uuid';

// --- Replicating __dirname in ES Modules ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// The port can also be in the .env file or default to 5000
const PORT = process.env.PORT || 5000;

// --- Middleware (No changes here) ---
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// --- Dialogflow Configuration (Securely from .env file) ---
// This code now reads the credentials from your .env file locally,
// or from Render's environment variables when deployed.
const GCLOUD_PROJECT_ID = process.env.GCLOUD_PROJECT_ID;
const GCLOUD_CLIENT_EMAIL = process.env.GCLOUD_CLIENT_EMAIL;
const GCLOUD_PRIVATE_KEY = process.env.GCLOUD_PRIVATE_KEY; // dotenv handles newlines automatically

const sessionClient = new dialogflow.SessionsClient({
  credentials: {
    client_email: GCLOUD_CLIENT_EMAIL,
    private_key: GCLOUD_PRIVATE_KEY,
  }
});

// --- API Route (No changes to the logic) ---
app.post('/send-to-dialogflow', async (req, res) => {
    const { message } = req.body;
    const sessionId = uuidv4();
    const sessionPath = sessionClient.projectAgentSessionPath(GCLOUD_PROJECT_ID, sessionId);

    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: message,
                languageCode: 'en-US',
            },
        },
    };

    try {
        const responses = await sessionClient.detectIntent(request);
        const result = responses[0].queryResult;
        res.send({ reply: result.fulfillmentText });
    } catch (error) {
        console.error('Dialogflow Error:', error);
        res.status(500).send({ error: 'Error communicating with Dialogflow' });
    }
});

// --- Start the Server (No changes here) ---
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
