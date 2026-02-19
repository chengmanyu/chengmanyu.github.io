//-------------------------- chatbot------------------------

// ==================== 聊天機器人配置 ====================
const DEEPSEEK_API_KEY = 'sk-e21a1283d3804330a9a06a1134fccf80';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

// Jeff 的個人信息 - 根據你的實際情況修改
const JEFF_INFO = {
    name: 'Jeff Cheng',
    title: 'Full Stack Developer / AI Enthusiast',
    skills: ['JavaScript', 'Python', 'React', 'Node.js', 'AI/ML', 'Web Development'],
    experience: '5+ years of software development',
    education: 'Computer Science degree',
    projects: [
        'Portfolio Website with AI Chatbot',
        'E-commerce Platform',
        'Real-time Chat Application',
        'Machine Learning Projects'
    ],
    email: 'jeff@example.com',
    github: 'https://github.com/jeffcheng',
    location: 'Taiwan',
    bio: 'Passionate about creating innovative solutions and learning new technologies.'
};

// 系統提示詞
const SYSTEM_PROMPT = `你是 ${JEFF_INFO.name} 的 AI 助手。你的角色是代表 Jeff 回答關於他的問題。

關於 Jeff 的信息：
- 姓名：${JEFF_INFO.name}
- 職位：${JEFF_INFO.title}
- 技能：${JEFF_INFO.skills.join(', ')}
- 工作經驗：${JEFF_INFO.experience}
- 教育背景：${JEFF_INFO.education}
- 主要項目：${JEFF_INFO.projects.join(', ')}
- 郵箱：${JEFF_INFO.email}
- GitHub：${JEFF_INFO.github}
- 位置：${JEFF_INFO.location}
- 個人簡介：${JEFF_INFO.bio}

請用友善、專業的語氣回答用戶的問題。如果問題與 Jeff 無關，可以禮貌地將對話引導回 Jeff 相關的話題。
用戶的語言是中文或英文，請用相同的語言回答。`;

// ==================== 聊天記錄管理 ====================
class ChatHistory {
    constructor(maxMessages = 20) {
        this.messages = [];
        this.maxMessages = maxMessages;
    }

    addMessage(role, content) {
        this.messages.push({ role, content });
        // 保持消息數量在限制內
        if (this.messages.length > this.maxMessages) {
            this.messages = this.messages.slice(-this.maxMessages);
        }
    }

    getMessages() {
        return this.messages;
    }

    clear() {
        this.messages = [];
    }
}

// ==================== 聊天機器人類 ====================
class ChatBot {
    constructor() {
        this.chatHistory = new ChatHistory();
        this.isLoading = false;
        this.initializeDOM();
        this.attachEventListeners();
    }

    initializeDOM() {
        this.chatbotBall = document.getElementById('chatbotBall');
        this.chatbotWindow = document.getElementById('chatbotWindow');
        this.chatMessages = document.getElementById('chatMessages');
        this.userInput = document.getElementById('userInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.closeBtn = document.getElementById('closeBtn');
    }

    attachEventListeners() {
        this.chatbotBall.addEventListener('click', () => this.toggleChatWindow());
        this.closeBtn.addEventListener('click', () => this.closeChatWindow());
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !this.isLoading) {
                this.sendMessage();
            }
        });
    }

    toggleChatWindow() {
        this.chatbotWindow.classList.toggle('active');
        if (this.chatbotWindow.classList.contains('active')) {
            this.userInput.focus();
            // 首次打開時添加歡迎消息
            if (this.chatMessages.children.length === 0) {
                this.addBotMessage('你好！👋 我是 Jeff 的 AI 助手。有什麼我可以幫助你了解 Jeff 的嗎？');
            }
        }
    }

    closeChatWindow() {
        this.chatbotWindow.classList.remove('active');
    }

    addUserMessage(content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user';
        messageDiv.innerHTML = `<div class="message-bubble">${this.escapeHtml(content)}</div>`;
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addBotMessage(content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot';
        messageDiv.innerHTML = `<div class="message-bubble">${this.formatBotMessage(content)}</div>`;
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addLoadingMessage() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot';
        messageDiv.id = 'loadingMessage';
        messageDiv.innerHTML = `
            <div class="loading">
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
            </div>
        `;
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    removeLoadingMessage() {
        const loadingMsg = document.getElementById('loadingMessage');
        if (loadingMsg) {
            loadingMsg.remove();
        }
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    formatBotMessage(content) {
        // 簡單的 Markdown 格式化
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br/>');
    }

    async sendMessage() {
        const userMessage = this.userInput.value.trim();
        
        if (!userMessage || this.isLoading) {
            return;
        }

        // 清空輸入框
        this.userInput.value = '';
        
        // 添加用戶消息到 UI
        this.addUserMessage(userMessage);
        
        // 添加用戶消息到歷史
        this.chatHistory.addMessage('user', userMessage);
        
        // 顯示加載狀態
        this.isLoading = true;
        this.sendBtn.disabled = true;
        this.addLoadingMessage();

        try {
            const response = await this.callDeepSeekAPI(userMessage);
            this.removeLoadingMessage();
            
            // 添加機器人回應到 UI
            this.addBotMessage(response);
            
            // 添加機器人回應到歷史
            this.chatHistory.addMessage('assistant', response);
        } catch (error) {
            this.removeLoadingMessage();
            console.error('API Error:', error);
            this.addBotMessage('抱歉，我遇到了一個錯誤。請稍後再試。');
        } finally {
            this.isLoading = false;
            this.sendBtn.disabled = false;
            this.userInput.focus();
        }
    }

    async callDeepSeekAPI(userMessage) {
        // 構建消息數組，包含系統提示詞和歷史記錄
        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...this.chatHistory.getMessages()
        ];

        const payload = {
            model: 'deepseek-chat',
            messages: messages,
            temperature: 0.7,
            max_tokens: 1000,
            stream: false
        };

        try {
            const response = await fetch(DEEPSEEK_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API Error: ${response.status} - ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('DeepSeek API Error:', error);
            throw error;
        }
    }
}

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    const chatbot = new ChatBot();
    console.log('💬 AI Chatbot initialized successfully!');
});


//-------------------------chatbot code end -------------------------

// 粒子特效配置
particlesJS('particles-js', {
    particles: {
        number: {
            value: 80,
            density: {
                enable: true,
                value_area: 800
            }
        },
        color: {
            value: '#3498db'
        },
        shape: {
            type: 'circle',
            stroke: {
                width: 0,
                color: '#000000'
            }
        },
        opacity: {
            value: 0.5,
            random: false,
            anim: {
                enable: false
            }
        },
        size: {
            value: 3,
            random: true,
            anim: {
                enable: false
            }
        },
        line_linked: {
            enable: true,
            distance: 150,
            color: '#3498db',
            opacity: 0.4,
            width: 1
        },
        move: {
            enable: true,
            speed: 2,
            direction: 'none',
            random: false,
            straight: false,
            out_mode: 'out',
            bounce: false
        }
    },
    interactivity: {
        detect_on: 'canvas',
        events: {
            onhover: {
                enable: true,
                mode: 'repulse'
            },
            onclick: {
                enable: true,
                mode: 'push'
            },
            resize: true
        },
        modes: {
            repulse: {
                distance: 100,
                duration: 0.4
            },
            push: {
                particles_nb: 4
            }
        }
    },
    retina_detect: true
});

// 平滑滾動
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// 滾動動畫觀察器
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animationPlayState = 'running';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// 觀察所有需要動畫的元素
document.addEventListener('DOMContentLoaded', () => {
    const fadeElements = document.querySelectorAll('.fade-in-up');
    fadeElements.forEach(el => {
        el.style.animationPlayState = 'paused';
        observer.observe(el);
    });
});

// 導航欄滾動效果
let lastScroll = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > lastScroll && currentScroll > 100) {
        navbar.style.transform = 'translateY(-100%)';
    } else {
        navbar.style.transform = 'translateY(0)';
    }
    
    lastScroll = currentScroll;
});

// 技能標籤動畫
const skillTags = document.querySelectorAll('.skill-tag');
skillTags.forEach((tag, index) => {
    tag.style.animationDelay = `${index * 0.1}s`;
});
