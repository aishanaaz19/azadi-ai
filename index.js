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
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// --- Dialogflow Configuration ---
const GCLOUD_PROJECT_ID = process.env.GCLOUD_PROJECT_ID;
const GCLOUD_CLIENT_EMAIL = process.env.GCLOUD_CLIENT_EMAIL;
const GCLOUD_PRIVATE_KEY = process.env.GCLOUD_PRIVATE_KEY.replace(/\\n/g, '\n');

const sessionClient = new dialogflow.SessionsClient({
  credentials: {
    client_email: GCLOUD_CLIENT_EMAIL,
    private_key: GCLOUD_PRIVATE_KEY,
  }
});

// --- Quiz Data and Logic ---
const quizQuestions = [
    {
        question: "Who wrote our national anthem, 'Jana Gana Mana'?",
        answer: "Rabindranath Tagore"
    },
    {
        question: "Who is known as the 'Iron Man of India'?",
        answer: "Sardar Vallabhbhai Patel"
    },
    {
        question: "The 'Jallianwala Bagh massacre' took place in which city?",
        answer: "Amritsar"
    },
    {
        question: "What is the national motto of India?",
        answer: "Satyameva Jayate"
    },
    {
        question: "Who designed the Indian national flag?",
        answer: "Pingali Venkayya"
    }
];

// This will store the state of each user's quiz
const userQuizSessions = {};

// --- API Routes ---

// This route handles the normal chat messages
app.post('/send-to-dialogflow', async (req, res) => {
    // ... (This code remains exactly the same as before)
});


// --- NEW: Webhook for Quiz Logic ---
app.post('/webhook', (req, res) => {
    const intentName = req.body.queryResult.intent.displayName;
    const sessionId = req.body.session.split('/').pop(); // Extract session ID

    let responseText = "Sorry, I didn't get that. Let's try the next question.";

    if (intentName === 'Quiz-Start') {
        // Initialize the quiz for the user
        userQuizSessions[sessionId] = {
            currentQuestionIndex: 0,
            score: 0
        };
        responseText = quizQuestions[0].question;
    } else if (intentName.startsWith('Quiz-Q')) {
        const session = userQuizSessions[sessionId];
        if (!session) {
            // If session expired, restart quiz
            userQuizSessions[sessionId] = { currentQuestionIndex: 0, score: 0 };
            responseText = "Your session expired. Let's start over. " + quizQuestions[0].question;
        } else {
            const userAnswer = req.body.queryResult.queryText;
            const currentQuestion = quizQuestions[session.currentQuestionIndex];

            // Check if the answer is correct (simple check)
            if (userAnswer.toLowerCase().includes(currentQuestion.answer.toLowerCase())) {
                session.score++;
                responseText = "Correct! Your score is " + session.score + ". ";
            } else {
                responseText = "That's not right. The correct answer was " + currentQuestion.answer + ". ";
            }

            // Move to the next question
            session.currentQuestionIndex++;

            if (session.currentQuestionIndex < quizQuestions.length) {
                // Ask the next question
                responseText += quizQuestions[session.currentQuestionIndex].question;
            } else {
                // End of quiz
                responseText += "Quiz finished! Your final score is " + session.score + " out of " + quizQuestions.length + ". ";
                if (session.score >= 4) {
                    responseText += "Congratulations! You've earned the 'Freedom Fighter' badge! 🇮🇳";
                } else {
                    responseText += "Good effort! Keep learning about our history.";
                }
                // Clear the session
                delete userQuizSessions[sessionId];
            }
        }
    }

    // Send the response back to Dialogflow
    res.json({
        fulfillmentText: responseText
    });
});


// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
