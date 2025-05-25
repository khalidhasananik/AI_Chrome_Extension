(function () {
  if (document.getElementById('ai-chat-head')) return;

  const CHAT_WIDTH = 380;
  const CHAT_SPACING = 30;
  const GEMINI_API_KEY = CONFIG.GEMINI_API_KEY
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
  const AVATAR_LIST = [
    "1.png", "2.png", "3.png", "4.png", "5.png"
  ]; // Place these in /chat-heads/

  const chatHead = document.createElement('div');
  chatHead.id = 'ai-chat-head';
  const imagePath = chrome.runtime.getURL("chat-heads/4.png");
  chatHead.innerHTML = `<img id="chat-head-img" src="${imagePath}" alt="chat head" />`;
  document.body.appendChild(chatHead);

  const chatWindow = document.createElement('div');
  chatWindow.id = 'ai-chat-window';
  chatWindow.style.display = 'none';
  document.body.appendChild(chatWindow);

  const style = document.createElement('style');
  style.textContent = `
    #ai-chat-head {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: #ffffff;
      border: 2px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 100000;
      box-shadow: 0 4px 14px rgba(0,0,0,0.15);
    }

    #chat-head-img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
    }

    #ai-chat-window {
      position: fixed;
      width: 360px;
      max-height: 80vh;
      background: #f9fafb;
      border-radius: 12px;
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
      padding: 20px;
      z-index: 100001;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      display: flex;
      flex-direction: column;
      gap: 14px;
      overflow-y: auto;
      box-sizing: border-box;
    }

    #ai-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
      font-size: 17px;
      color: #111827;
    }

    #ai-close {
      cursor: pointer;
      color: #6b7280;
    }

    #ai-messages {
      min-height: 20px;
      overflow-y: auto;
      font-size: 14px;
      padding: 10px;
      background: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
      box-shadow:
        inset 0 0 0 1px rgba(255, 255, 255, 0.1),
        0 0 12px rgba(99, 102, 241, 0.25);
      flex: 1;
      white-space: pre-wrap;
      transition: box-shadow 0.3s ease;
      transition: border-radius 0.3s ease, height 0.3s ease;
    }

    #ai-messages.compact {
      border-radius: 999px;
    }
    #ai-messages.expanded {
      border-radius: 12px;
    }



    #ai-buttons {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .ai-action {
      padding: 10px 16px;
      border-radius: 30px;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
      color: #111;
      font-weight: 500;
      font-size: 14px;
      transition: all 0.3s ease;
    }

    .ai-action:hover {
      background: rgba(255, 255, 255, 0.3);
      box-shadow:
      0 6px 16px rgba(0, 0, 0, 0.15),
      0 0 8px rgba(76, 0, 255, 0.3); /* subtle purple glow */
    }

    #ai-input-wrapper {
      position: relative;
      width: 100%;
    }

    #ai-input {
      width: 100%;
      height: 50px;
      padding: 0 48px 0 20px;
      border-radius: 999px;
      border: none;
      outline: none;
      font-size: 14px;
      background: linear-gradient(to right, #ffffff, #f0f4ff);
      color: #111827;
      font-weight: 500;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.3), 0 0 8px rgba(99, 102, 241, 0.4);
    }

    #ai-send {
      position: absolute;
      top: 50%;
      right: 10px;
      transform: translateY(-50%);
      height: 36px;
      width: 36px;
      background: linear-gradient(to right, #4f46e5, #3b82f6);
      border: none;
      border-radius: 50%;
      color: white;
      cursor: pointer;
      box-shadow: 0 0 10px rgba(99, 102, 241, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }

    #ai-send:hover {
      box-shadow: 0 0 14px rgba(59, 130, 246, 0.8);
    }

    #ai-send svg {
      width: 20px;
      height: 20px;
    }

    #ai-avatar-picker {
      display: flex;
      gap: 4px;
      overflow-x: auto;
      margin-top: 10px;
    }

    .avatar-thumb {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      cursor: pointer;
      object-fit: cover;
      border: 2px solid transparent;
    }

    .avatar-thumb.active {
      border-color: #4f46e5;
    }

    .ai-bulb {
      position: fixed;
      z-index: 100002;
      background: #6366f1;
      color: white;
      padding: 6px 10px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      font-size: 13px;
    }
  `;
  document.head.appendChild(style);

  function callGeminiAPI(promptText) {
    return fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
    })
      .then(res => res.json())
      .then(data => {
        let raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "(No response)";
        return raw.replace(/\*+/g, '').trim(); // Remove * markup
      });
  }

  function renderChatUI(prompt = null) {
    chatWindow.innerHTML = `
      <div id="ai-header">
      AI Assistant <span id="ai-close">✖</span>
      </div>

      <div id="ai-buttons">
      <button class="ai-action" data-action="summarize">Summarize</button>
      <button class="ai-action" data-action="explain">Explain</button>
      <button class="ai-action" data-action="translate">Translate</button>
      </div>

      <div id="ai-messages"></div>

      <div id="ai-input-wrapper" style="display: flex; gap: 8px; margin-top: 10px;">
      <input type="text" id="ai-input" placeholder="Ask me anything..." style="flex:1;" />
      <button id="ai-send" style="display: flex; align-items: center; justify-content: center; padding: 0 12px;">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" height="20" width="20" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
      </div>

      <div id="ai-avatar-picker" style="margin-top: 10px;"></div>
    `;

    document.getElementById('ai-close').onclick = () => chatWindow.style.display = 'none';

    const aiMessages = document.getElementById("ai-messages");

    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        const height = entry.contentRect.height;
        if (height <= 30) {
          aiMessages.classList.add("compact");
          aiMessages.classList.remove("expanded");
        } else {
          aiMessages.classList.add("expanded");
          aiMessages.classList.remove("compact");
        }
      }
    });

    observer.observe(aiMessages);

    const messages = document.getElementById('ai-messages');
    const input = document.getElementById('ai-input');
    if (prompt) input.value = prompt;

    // Helper to add AI reply with copy icon
    function addAIReply(replyText) {
      const replyId = 'ai-reply-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
      const div = document.createElement('div');
      // Remove leading/trailing whitespace from replyText to avoid extra spaces
      const cleanReply = replyText.trim();
      div.innerHTML = `
<strong>AI:</strong> <span id="${replyId}" style="white-space:pre-wrap;">${cleanReply}</span><button class="ai-copy-btn" title="Copy" style="margin-left:0px;cursor:pointer;border:none;background:transparent;font-size:15px;">📋</button>
      `;
      messages.appendChild(div);
      const copyBtn = div.querySelector('.ai-copy-btn');
      copyBtn.onclick = () => {
        const text = div.querySelector(`#${replyId}`).innerText;
        navigator.clipboard.writeText(text);
        copyBtn.textContent = "✅";
        setTimeout(() => copyBtn.textContent = "📋", 1200);
      };
    }

    document.getElementById('ai-send').onclick = async () => {
      const userInput = input.value.trim();
      if (!userInput) return;
      messages.innerHTML += `<div><strong>You:</strong> ${userInput}</div>`;
      const reply = await callGeminiAPI(userInput);
      addAIReply(reply);
      messages.scrollTop = messages.scrollHeight;
      input.value = '';
    };

    document.querySelectorAll(".ai-action").forEach(btn => {
      btn.onclick = async () => {
        let text = input.value.trim() || window.getSelection().toString().trim();
        if (!text) return alert("Please input or highlight some text.");
        const type = btn.dataset.action;
        const prompts = {
          summarize: `Summarize this: ${text}`,
          explain: `Explain this clearly: ${text}`,
          translate: `Translate this into Bangla: ${text}`
        };
        messages.innerHTML += `<div><strong>You:</strong> ${prompts[type]}</div>`;
        const reply = await callGeminiAPI(prompts[type]);
        addAIReply(reply);
        messages.scrollTop = messages.scrollHeight;
      };
    });

    const picker = document.getElementById('ai-avatar-picker');
    AVATAR_LIST.forEach((file, i) => {
      const img = document.createElement('img');
      img.src = chrome.runtime.getURL(`chat-heads/${file}`);
      img.className = 'avatar-thumb';
      img.onclick = () => {
        document.getElementById('chat-head-img').src = img.src;
        document.querySelectorAll('.avatar-thumb').forEach(a => a.classList.remove('active'));
        img.classList.add('active');
        // Remove custom avatar selection
        chrome.storage.local.remove('ai_custom_avatar');
      };
      picker.appendChild(img);
    });

    // Add custom upload avatar
    const uploadLabel = document.createElement('label');
    uploadLabel.style.display = 'inline-block';
    uploadLabel.style.cursor = 'pointer';
    uploadLabel.title = 'Upload custom avatar';

    const uploadInput = document.createElement('input');
    uploadInput.type = 'file';
    uploadInput.accept = 'image/*';
    uploadInput.style.display = 'none';

    const uploadIcon = document.createElement('span');
    uploadIcon.textContent = '➕';
    uploadIcon.style.display = 'inline-block';
    uploadIcon.style.width = '36px';
    uploadIcon.style.height = '36px';
    uploadIcon.style.lineHeight = '36px';
    uploadIcon.style.textAlign = 'center';
    uploadIcon.style.borderRadius = '50%';
    uploadIcon.style.background = '#f3f4f6';
    uploadIcon.style.fontSize = '22px';
    uploadIcon.style.border = '2px solid transparent';
    uploadIcon.className = 'avatar-thumb';

    uploadLabel.appendChild(uploadInput);
    uploadLabel.appendChild(uploadIcon);
    picker.appendChild(uploadLabel);

    uploadInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (evt) {
        const imgUrl = evt.target.result;
        document.getElementById('chat-head-img').src = imgUrl;
        document.querySelectorAll('.avatar-thumb').forEach(a => a.classList.remove('active'));
        uploadIcon.classList.add('active');
        // Persist the uploaded avatar in chrome.storage.local
        chrome.storage.local.set({ ai_custom_avatar: imgUrl });
      };
      reader.readAsDataURL(file);
    };

    // Restore custom avatar selection if present
    chrome.storage.local.get('ai_custom_avatar', (result) => {
      if (result && result.ai_custom_avatar) {
        document.getElementById('chat-head-img').src = result.ai_custom_avatar;
        document.querySelectorAll('.avatar-thumb').forEach(a => a.classList.remove('active'));
        uploadIcon.classList.add('active');
      }
    });
  }

  // Restore custom avatar on load (outside renderChatUI)
  chrome.storage.local.get('ai_custom_avatar', (result) => {
    if (result && result.ai_custom_avatar) {
      const chatHeadImg = document.getElementById('chat-head-img');
      if (chatHeadImg) {
        chatHeadImg.src = result.ai_custom_avatar;
      }
    }
  });

  chatHead.onclick = () => {
    if (chatWindow.style.display === 'none') {
      renderChatUI();
      const rect = chatHead.getBoundingClientRect();
      let left = rect.left;
      let top = rect.top + rect.height + CHAT_SPACING;
      const maxTop = window.innerHeight - 400;
      if (left + CHAT_WIDTH > window.innerWidth) left = window.innerWidth - CHAT_WIDTH - CHAT_SPACING;
      if (top > maxTop) top = maxTop;
      chatWindow.style.left = `${left}px`;
      chatWindow.style.top = `${top}px`;
      chatWindow.style.display = 'flex';
    } else {
      chatWindow.style.display = 'none';
    }
  };

  // Highlight handler
  let bulb;
  document.addEventListener("mouseup", () => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    if (bulb) bulb.remove();
    if (text.length > 0) {
      const rect = selection.getRangeAt(0).getBoundingClientRect();
      bulb = document.createElement("button");
      bulb.textContent = "💡 AI";
      bulb.className = 'ai-bulb';
      bulb.style.top = `${rect.top + window.scrollY - 28}px`;
      bulb.style.left = `${rect.left + window.scrollX}px`;
      document.body.appendChild(bulb);
      bulb.onclick = () => {
        renderChatUI(`Summarize this: ${text}`);
        const headRect = chatHead.getBoundingClientRect();
        let left = headRect.left;
        let top = headRect.top + headRect.height + CHAT_SPACING;
        const maxTop = window.innerHeight - 400;
        if (left + CHAT_WIDTH > window.innerWidth) left = window.innerWidth - CHAT_WIDTH - CHAT_SPACING;
        if (top > maxTop) top = maxTop;
        chatWindow.style.left = `${left}px`;
        chatWindow.style.top = `${top}px`;
        chatWindow.style.display = 'flex';
        bulb.remove();
      };
    }
  });

  // Draggable chat head
  let dragging = false, offsetX = 0, offsetY = 0;
  chatHead.addEventListener('mousedown', (e) => {
    dragging = true;
    offsetX = e.clientX - chatHead.getBoundingClientRect().left;
    offsetY = e.clientY - chatHead.getBoundingClientRect().top;
    e.preventDefault();
  });
  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    let left = e.clientX - offsetX;
    let top = e.clientY - offsetY;
    left = Math.max(0, Math.min(left, window.innerWidth - chatHead.offsetWidth));
    top = Math.max(0, Math.min(top, window.innerHeight - chatHead.offsetHeight));
    chatHead.style.left = `${left}px`;
    chatHead.style.top = `${top}px`;
    chatHead.style.bottom = 'auto';
    chatHead.style.right = 'auto';
  });
  document.addEventListener('mouseup', () => dragging = false);
})();
