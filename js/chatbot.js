/* ===================== CHATBOT JS ===================== */

document.addEventListener('DOMContentLoaded', () => {
    // Knowledge Base
    const KNOWLEDGE_BASE = {
        greetings: {
            triggers: ['hello', 'hi', 'hey', 'greetings', 'kumusta', 'kamusta'],
            response: 'Salute, Brother! I am your Asia 2 Virtual Assistant. How can I help you today?'
        },
        about: {
            triggers: ['what is tau gamma phi', 'about the fraternity', 'what is tgp', 'mission', 'pillars'],
            response: 'Tau Gamma Phi is the Triskelion Grand Fraternity, built on Academic Excellence, Community Service, and Brotherhood. We are one of the most respected fraternities in the Philippines.'
        },
        asia2: {
            triggers: ['asia 2', 'asia2', 'chapter', 'local'],
            response: 'The Asia 2 Community Chapter was established in 2008. We currently have 52 active brothers dedicated to uplifting our community through service and honor.'
        },
        history: {
            triggers: ['history', 'founded', 'legacy', 'milestone'],
            response: 'Our chapter has a rich legacy of service. From our founding in 2008 to launching monthly outreach programs like the Clean-Up Drive and Libreng Almusal, we continue to grow stronger in unity.'
        },
        projects: {
            triggers: ['project', 'service', 'clean-up', 'cleanup', 'almusal', 'breakfast'],
            response: 'We have two main monthly projects: 1. **Community Clean-Up Drive** to maintain our environment, and 2. **Libreng Almusal** where we serve hot meals to underprivileged families.'
        },
        leadership: {
            triggers: ['leader', 'president', 'grand triskelion', 'gt', 'officer', 'leadership'],
            response: 'Our current Grand Triskelion is **Bro. Laureano Pontejos**. He is supported by Deputy Grand Triskelion **Bro. Gibe Ibuna** and a dedicated team of Master Officers.'
        },
        contact: {
            triggers: ['contact', 'email', 'message', 'join', 'reach'],
            response: 'You can reach us at **jemisa@sscrcan.edu.ph** or use the contact form at the bottom of the page. Messages go directly to our Grand Triskelion.'
        },
        motto: {
            triggers: ['motto', 'slogan', 'tenets'],
            response: '"Fortis Voluntas Fraternitas" (Strength, Will, Brotherhood) and "Once a Triskelion, Always a Triskelion".'
        }
    };

    // UI Elements
    const body = document.body;
    
    // Create Chatbot Elements
    const chatContainer = document.createElement('div');
    chatContainer.id = 'chatbot-container';
    chatContainer.innerHTML = `
        <div class="chatbot-toggle" id="chatToggle">
            <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2m0 14H5.2L4 17.2V4h16v12Z"/></svg>
        </div>
        <div class="chatbot-window" id="chatWindow">
            <div class="chatbot-header">
                <div class="chatbot-header-info">
                    <img src="images/asia2logo.png" alt="Logo">
                    <h3>Asia 2 Assistant</h3>
                </div>
                <div class="chatbot-close" id="chatClose">&times;</div>
            </div>
            <div class="chatbot-messages" id="chatMessages">
                <div class="message bot">
                    Salute! I'm the Asia 2 virtual assistant. Ask me anything about our brotherhood, history, or projects.
                    <div class="suggested-questions">
                        <button class="suggest-btn">About Asia 2</button>
                        <button class="suggest-btn">Our Projects</button>
                        <button class="suggest-btn">Leadership</button>
                    </div>
                </div>
            </div>
            <div class="chatbot-input-area">
                <input type="text" id="chatInput" placeholder="Type a message...">
                <button class="chatbot-send" id="chatSend">
                    <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                </button>
            </div>
        </div>
    `;
    body.appendChild(chatContainer);

    const chatToggle = document.getElementById('chatToggle');
    const chatWindow = document.getElementById('chatWindow');
    const chatClose = document.getElementById('chatClose');
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');

    // Toggle Chat
    chatToggle.addEventListener('click', () => {
        chatWindow.classList.add('active');
    });

    chatClose.addEventListener('click', () => {
        chatWindow.classList.remove('active');
    });

    // Send Message Logic
    const sendMessage = () => {
        const text = chatInput.value.trim();
        if (!text) return;

        // User Message
        appendMessage(text, 'user');
        chatInput.value = '';

        // Bot Response
        setTimeout(() => {
            const response = getResponse(text);
            appendMessage(response, 'bot');
        }, 500);
    };

    const appendMessage = (text, sender) => {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        msgDiv.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const getResponse = (input) => {
        const lowerInput = input.toLowerCase();
        
        // Check Knowledge Base
        for (const key in KNOWLEDGE_BASE) {
            const entry = KNOWLEDGE_BASE[key];
            if (entry.triggers.some(t => lowerInput.includes(t))) {
                return entry.response;
            }
        }

        // Check for member search
        if (typeof MEMBERS !== 'undefined') {
            const foundMember = MEMBERS.find(m => lowerInput.includes(m.name.toLowerCase()));
            if (foundMember) {
                return `**${foundMember.name}** is a member of our chapter with the role of **${foundMember.role}**.`;
            }
        }

        if (lowerInput.includes('how many members')) {
             return `The Asia 2 Community Chapter currently has **52 active brothers**.`;
        }

        return "I'm not sure about that. Try asking about our 'projects', 'history', 'leadership', or a specific member's name!";
    };

    // Event Listeners
    chatSend.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Suggested Questions
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('suggest-btn')) {
            const question = e.target.textContent;
            chatInput.value = question;
            sendMessage();
        }
    });
});
