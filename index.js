// Step 1: Change all 'require' to 'import'
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dialogflow from '@google-cloud/dialogflow';
import { v4 as uuidv4 } from 'uuid';

// --- Replicating __dirname in ES Modules ---
// This is the standard way to get the current directory name in an ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

// --- Middleware (No changes here) ---
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// --- Dialogflow Configuration ---
const GCLOUD_PROJECT_ID = 'bharatbot-ojiv'; 
const GCLOUD_CLIENT_EMAIL = 'dialogflow-client@bharatbot-ojiv.iam.gserviceaccount.com'; // From the JSON key file
const GCLOUD_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDhStnvaVJTPKXX\nQ3R3MJdpfswS6nwP46CilGGp4dDAS80j+Sjs7hYbbvWqd1Wc1Dg2bn2yA1cIfHgO\n8Jl+3Cl52W0LmyeZ6kocOwjIDEn/1VTc0WwvaPf4zWODXmkq3T1rQdNB/CAkaOq0\na7aD4OvSIcInjfTleXq3ZvROETl7JsCKHK7Dpw8dkzvmxX43gtr5q2LUh4z6Ce5j\np3pQxrIMUIXwsQ3VL3nPeIhRLR7C5507lf1WYXeHuu4LlJ4EMh3w1eFel3nnuVNj\nG+svliKohrd7S4hqHWttGXXRVAVjgTs/qx6pQ8mV5XnKu1vpp48IrfaWUmnJrdoJ\nbIeV0cF9AgMBAAECggEAJWonYwWu44jtEnYEN653rtBHzD+/MRUAqToS4Bd9nLnZ\n9zFFVS0TDyTwd99lS0Fz68I8w11KTRaoCknLIWYnHd0jKWwaebVkRRJJb+OZPyYA\nIm3wgA0i2rcittSX4EOpaWXJ/lQvSFdY3HQOSxIwR7pN2ADQx3KoaSCYI7DjnBUF\nwqk/Whnl1YwyW94diO3xhsgIg7AyYEsyg3UbPBgm9A6BR+Tx70gTTmcHksjPwGH1\nrOSsTrJaI9rXZ7FWbaG9GmTIYNEZh/8xuxTRlDwP/2h+J/OHEMrksBgq6Dc/VzCF\nMiGrUMmJj2rnw0toyvPlfWNqnuCAS4YF7WXt//ytZwKBgQD8lsg/m9FsGC2oqr4e\nlFDjBeJCuzl0ClfmcCXgblVXHfgr774fOn+WaiiTjqzsIgFKZwSuMG5J++GDpc3p\nUXLAdEHfruG2HUK7bqiBBM8WOsmp0YD0DHne+s09n12TA+m9egvDd9Nx7ECEWlEg\n3G4m10X1b+XoPa+VZBLefpoYkwKBgQDkVbPr/FuRTpoEhsGKqhZfGVDs7GX1REmV\nCv5CMGwBxvK+gAU7SR6Wn5H2+6Pk5v3Z5WGFcyd9IwwkAYD8hEwWJ9yWHTSOGgSl\n4XjYJY5yhNUhMOZyoQMdi272zyaV2UIPtIicz2wDo3CEoIn/cMvl3hS6TS4Mq3gB\nve3jnPtXrwKBgQDSCwjmbEqQGuMNGT8T6r4Aq0nluA8kwd0qkSPOJ7Hryc4vqyNs\nkJa8m/a2DbUaf4SXPGeV+kwcVcrIUL6UQNit1X9Z5PFpIZf2iSSydS9ICwbboo4b\nY6yMkf7OOZH0yRI8MBtMJn68g3t7FCfWrbcjsWxJlw2WPIWgMyHFx32Y5QKBgBAN\nEkPRjqJNUzhkPLDBuibfQbgV+ijerwmCJ1OB0eXiFWhc2YFMZ5EREJK7J89MiaXK\noStfZ/Q9BXp2fJnDtxGLpc8LqIkgvRjoG7WeFkBopA7cQCbouK5YAenpr/2ysxkl\niMD1N9Odpqg8HNdPF5ZGIVDjYgxT9XCx6Eoq2+RTAoGBAO3CYMM2Vu8CjVPZfzrH\nsuaJ9x9755gXZSO5TnHBTWQMougOZtyXMziuzcPRdbUfHEqSggfIN2tqpJhBnqwW\nVJ1Zcl4L4Ui3qf6dmxi5Q8iHup7mwzrwrG4UB04th6qt4P4t0wKBYwJj9YVij+6s\nQ8Cw8YQaiRYnTQxrXIHhsbcU\n-----END PRIVATE KEY-----\n`; 

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