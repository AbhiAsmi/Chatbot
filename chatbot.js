import Groq from 'groq-sdk';
import { tavily } from '@tavily/core';
import NodeCache from 'node-cache';
import dotenv from "dotenv"
dotenv.config();

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const cache = new NodeCache({ stdTTL: 60 * 60 * 24 }); 

export async function generate(userMessage, threadId) {
    const baseMessages = [
        {
            role: 'system',
            content: `You are an intelligent, friendly, and thorough assistant.And Your Name is Abhi. Answer questions in a clear, step-by-step, and structured format, just like ChatGPT. Always follow these rules:

1. Provide a direct answer first. Make it concise but complete.
2. Follow the answer with a detailed explanation. Break it into numbered or bullet points if needed.
3. If applicable, provide code, examples, or calculations clearly and correctly.
4. Use a friendly and approachable tone, but remain professional.
5. Avoid repeating the user's question in your answer.
6. Always double-check calculations or facts before giving the answer.
7. If a step-by-step method exists (for solving problems, coding, etc.), always include it.
8. Use headings or sections for clarity when the answer is long.

Example Answer Format:

Answer: [Direct, concise answer]  
Explanation:  
1. [Step 1 of reasoning/explanation]  
2. [Step 2...]  
3. [Additional notes, examples, or tips if applicable]  

Code/Example (if relevant):  [language]  

`,
        },
    ];

    const messages = cache.get(threadId) ?? baseMessages;

    messages.push({
        role: 'user',
        content: userMessage,
    });

    const MAX_RETRIES = 10;
    let count = 0;

    while (true) {
        if (count > MAX_RETRIES) {
            return 'I Could not find the result, please try again';
        }
        count++;

        const completions = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            temperature: 0,
            messages: messages,
            tools: [
                {
                    type: 'function',
                    function: {
                        name: 'webSearch',
                        description:
                            'Search the latest information and realtime data on the internet.',
                        parameters: {
                            type: 'object',
                            properties: {
                                query: {
                                    type: 'string',
                                    description: 'The search query to perform search on.',
                                },
                            },
                            required: ['query'],
                        },
                    },
                },
            ],
            tool_choice: 'auto',
        });

        messages.push(completions.choices[0].message);

        const toolCalls = completions.choices[0].message.tool_calls;

        if (!toolCalls) {
            cache.set(threadId, messages);
            return completions.choices[0].message.content;
        }

        for (const tool of toolCalls) {
            const functionName = tool.function.name;
            const functionParams = tool.function.arguments;

            if (functionName === 'webSearch') {
                const toolResult = await webSearch(JSON.parse(functionParams));
                messages.push({
                    tool_call_id: tool.id,
                    role: 'tool',
                    name: functionName,
                    content: toolResult,
                });
            }
        }
    }
}
async function webSearch({ query }) {
    console.log('Calling web search...');
    const response = await tvly.search(query);
    const finalResult = response.results.map((result) => result.content).join('\n\n');

    return finalResult;
}
