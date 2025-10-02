const input = document.querySelector('#input');
const chatContainer = document.querySelector('#chat-container');
const askBtn = document.querySelector('#ask');
const threadId = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);

input?.addEventListener('keyup', handleEnter);
askBtn?.addEventListener('click', handleAsk);
const loading = document.createElement('div');
loading.className = 'loading';
loading.textContent = 'Thinking...';

async function generate(text) {
    const msg = document.createElement('div');
    msg.className = 'my-message';
    msg.textContent = text;
    chatContainer?.appendChild(msg);
    input.value = '';
    chatContainer?.appendChild(loading);
    const assistantMessage = await callServer(text);
    const assistantMsgElem = document.createElement('div');
    assistantMsgElem.className = 'bot-message';
    assistantMsgElem.textContent = assistantMessage;
    loading.remove();
    chatContainer?.appendChild(assistantMsgElem);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function callServer(inputText) {
    try {
        const response = await fetch('https://chatbot-svg4.onrender.com/chat', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify({ threadId: threadId, message: inputText }),
        });

        if (!response.ok) {
            return "⚠️ Server error!";
        }

        const result = await response.json();
        return result.message;
    } catch (err) {
        return "⚠️ Unable to reach the server!";
    }
}

async function handleAsk() {
    const text = input?.value.trim();
    if (!text) return;
    await generate(text);
}

async function handleEnter(e) {
    if (e.key === 'Enter') {
        const text = input?.value.trim();
        if (!text) return;
        await generate(text);
    }
}
