import React, { useState, useEffect, useRef } from 'react';
import './ChatInterface.css'; 

function ChatInterface({ messages, onSendMessage, isLoading }) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null); // Ref for scrolling

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }
  useEffect(scrollToBottom, [messages]); // Trigger scroll on messages change

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) { // Check isLoading here
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  return (
    <div className="chat-interface">
      <div className="message-list">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.sender}`}>
            {/* Check if it's a bot message with products */}
            {msg.sender === 'bot' && msg.products && msg.products.length > 0 ? (
              <>
                {/* Render the cleaned introductory text */}
                {msg.text && <p className="intro-text">{msg.text}</p>}

                {/* Render the list of products */}
                <ul className="product-list">
                  {msg.products.map((product) => (
                    <li key={product.id} className="product-item">
                      <strong className="product-name">{product.name}</strong>
                      <p className="product-description">{product.description}</p>
                      {/* Optional: Display ID subtly if needed */}
                      {/* <span className="product-id">ID: {product.id}</span> */}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              // Otherwise, just render the message text as before
              <p>{msg.text}</p>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Loading indicator remains the same */}
      {isLoading && !messages[messages.length - 1]?.text.includes('Restarting') && (
        <div className="loading-indicator">
          <div className="spinner" />
          <span className="loading-text">Contemplating...</span>
        </div>
      )}

      {/* Input form remains the same */}
      <form onSubmit={handleSubmit} className="message-input-form">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
          aria-label="Chat input"
        />
        <button type="submit" disabled={isLoading || !inputValue.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}

export default ChatInterface;