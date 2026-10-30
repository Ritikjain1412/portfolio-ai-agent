import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import './App.css'

function App() {
  const [messages, setMessages] = useState([
    { role: "ai", content: "Hello! I am Ritik's AI assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput(""); 
    
    // Memory logic (History)
    const chatHistory = [...messages, { role: "user", content: userMessage }];
    
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setMessages((prev) => [...prev, { role: "ai", content: "" }]);

    try {
      const response = await fetch("http://127.0.0.1:8000/chat", {
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
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="chat-container">
      <h2>Ritik's AI Portfolio</h2>
      
      <div className="chat-box">
        {messages.map((msg, index) => (
          <div key={index} className={"message-row " + msg.role}>
            <div className={"message-bubble " + msg.role}>
              <div className="message-sender">
                {msg.role === "user" ? "Ritik" : "AI"}
              </div>
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message..." 
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  )
}

export default App