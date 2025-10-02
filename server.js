import express from 'express';
import cors from 'cors';
import { generate } from './chatbot.js'; 
const app = express();
const port = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());
app.get('/', (req, res) => {
    res.send('Chatbot backend is running!');
});
app.post('/chat', async (req, res) => {
    const { message, threadId } = req.body;

    if (!message || !threadId) {
        return res.status(400).json({ message: 'All fields are required!' });
    }

    console.log(`Received message: ${message}`);

    try {
        const result = await generate(message, threadId);
        res.json({ message: result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
