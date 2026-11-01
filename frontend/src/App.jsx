import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import './App.css'
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
function App() {
  const [messages, setMessages] = useState([
    { role: "ai", content: "Hello! I am Ritik's AI assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [showJobModal, setShowJobModal] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const messagesEndRef = useRef(null);
  const [language, setLanguage] = useState("English");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Bhai, aapka browser voice typing support nahi karta. Google Chrome use karo!");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN'; 
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    /* YEH NAYA CODE ASLI ERROR PAKDEGA */
    recognition.onerror = (event) => {
      console.error("Mic ka Error: ", event.error);
      alert("Mic Error: " + event.error); // Screen par popup dega
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      setInput(event.results[0][0].transcript);
    };
    recognition.start();
  };
  const exportChat = () => {
  // Chat ko ekdum sundar design mein PDF ke liye taiyar karte hain
  const chatContent = messages.map(m => `
    <div style="margin-bottom: 15px; padding: 10px; border-bottom: 1px solid #ddd;">
      <strong style="color: ${m.role === 'ai' ? '#2563eb' : '#475569'};">
        ${m.role === 'ai' ? 'RitikAI' : 'You'}:
      </strong>
      <p style="margin-top: 8px; color: #1e293b; line-height: 1.5;">${m.content}</p>
    </div>
  `).join('');

  // Ek nayi window khol kar usme print dialog chalayenge
  const printWindow = window.open('', '', 'height=600,width=800');
  printWindow.document.write('<html><head><title>RitikAI Chat History</title></head><body style="font-family: Arial, sans-serif; padding: 20px;">');
  printWindow.document.write('<h2 style="text-align: center; color: #0f172a;">RitikAI Chat History</h2>');
  printWindow.document.write(chatContent);
  printWindow.document.write('</body></html>');
  
  printWindow.document.close();
  printWindow.focus();
  
  // Direct PDF save wala option open ho jayega
  setTimeout(() => {
    printWindow.print();
  }, 250);
};
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput(""); 
    setIsLoading(true);
    // Memory logic (History)
    const chatHistory = [...messages, { role: "user", content: userMessage + " (Please reply strictly in " + language + ")" }];
    
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setMessages((prev) => [...prev, { role: "ai", content: "" }]);

    try {
      const response = await fetch("https://portfolio-ai-agent-jrgm.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatHistory }) 
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          newMessages[lastIndex] = {
            ...newMessages[lastIndex],
            content: newMessages[lastIndex].content + chunk
          };
          return newMessages;
        });
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className={isDarkMode ? "chat-container dark-mode" : "chat-container"}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  <h2>Ritik's AI Portfolio</h2>
  <button 
    onClick={() => setIsDarkMode(!isDarkMode)} 
    style={{ background: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer' }}
  >
    {isDarkMode ? '☀️' : '🌙'}
  </button>
</div>
      
      <div className="chat-box">
        {messages.map((msg, index) => (
          <div key={index} className={"message-row " + msg.role}>
            <div className={"message-bubble " + msg.role}>
              <div className="message-sender">
                {msg.role === "user" ? "Ritik" : "AI"}
              </div>
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{msg.content}</ReactMarkdown>
                
              {msg.role === "ai" && index > 0 && (
  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '5px' }}>
    <button 
      onClick={() => {
        navigator.clipboard.writeText(msg.content);
        alert("Copied! 📋");
      }} 
      style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px', opacity: '0.6' }}
      title="Copy"
    >
      📋
    </button>
  </div>
)}
            </div>
          </div>
        ))}
        
      
      {isLoading && (
  <div className="message-row ai">
    <div className="message-bubble ai typing-indicator">
      <span></span><span></span><span></span>
    </div>
  </div>
)}
      <div ref={messagesEndRef} />
    </div>
        
      
    {/* --- Quick AI Action Buttons --- */}
        <div style={{ display: 'flex', gap: '10px', padding: '10px 20px', overflowX: 'auto', borderTop: '1px solid #334155' }}>
          
          <button 
            onClick={() => setInput("Why should we hire Ritik Jain for an AI/Software role?")}
            style={{ background: '#1e293b', color: '#bae6fd', border: '1px solid #bae6fd', padding: '8px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            ✨ Why hire Ritik?
          </button>

          <button 
            onClick={() => setInput("Generate 3 tough technical interview questions based on Ritik's resume.")}
            style={{ background: '#1e293b', color: '#bae6fd', border: '1px solid #bae6fd', padding: '8px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            🎯 Interview Qs
          </button>

          <button 
            onClick={() => setInput("I am pasting a Job Description below. Give Ritik a suitability score (0-100%) and tell me what matches and what is missing:")}
            style={{ background: '#1e293b', color: '#bae6fd', border: '1px solid #bae6fd', padding: '8px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            📊 Suitability Score
          </button>
          <button 
  onClick={() => setLanguage(language === "English" ? "Hindi" : "English")}
  style={{ background: 'transparent', color: '#bae6fd', border: '1px solid #bae6fd', padding: '8px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap' }}
>
  🌐 {language === "English" ? "Switch to Hindi" : "Switch to English"}
</button>
<button 
  onClick={exportChat}
  style={{ background: '#334155', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap' }}
>
  📄 Export as PDF
</button>
        </div>
      <div className="input-area">
        <textarea 
  value={input}
  onChange={(e) => setInput(e.target.value)}
  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
  placeholder="Type your message..."
  rows="2"
  style={{ width: '100%', padding: '10px', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '5px', resize: 'none' }}
/>
        
      
      {/* NAYA MIC BUTTON YAHAN AAYEGA */}
      <button 
          onClick={startListening}
          style={{ 
            background: isListening ? '#ef4444' : '#334155', 
            color: 'white', 
            padding: '12px', 
            borderRadius: '8px', 
            border: 'none', 
            cursor: 'pointer',
            marginRight: '10px'
          }}
          title="Click to Speak"
        >
          {isListening ? '🛑' : '🎙️'}
      </button>

     
        <button onClick={sendMessage}>Send</button>
        <button onClick={() => setMessages([{ role: "ai", content: "Hello! I am Ritik's AI assistant. How can I help you today?" }])} style={{ marginLeft: '10px', backgroundColor: '#64748b', color: 'white' }}>Clear</button>
      </div>
    </div>
  )
}


  


export default App