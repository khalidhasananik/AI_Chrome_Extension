document.getElementById('sendBtn').addEventListener('click', () => {
    const input = document.getElementById('userInput').value;
    document.getElementById('response').textContent = `You said: ${input}`;
});
