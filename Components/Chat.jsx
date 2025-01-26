import React, { useState } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";

const Chat = () => {
  const [messages, setMessages] = useState([]); // Initialize messages state
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false); // Track loading state

  const handleSend = async () => {
    if (input.trim()) {
      const newUserMessage = { type: "user", text: input };
      setMessages((prevMessages) => [...prevMessages, newUserMessage]);
      setInput("");
      setLoading(true); // Set loading to true when a message is being sent

      try {
        // Sending the message to the backend
        const response = await fetch("http://127.0.0.1:8000/ask", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ question: input }),
        });

        const data = await response.json();

        if (data.answer) {
          // Adding the assistant's response after receiving it from the backend
          setMessages((prev) => [
            ...prev,
            { type: "assistant", text: data.answer },
          ]);
        } else {
          throw new Error("No answer received from the assistant.");
        }
      } catch (error) {
        console.error("Error fetching assistant's response:", error);
        setMessages((prev) => [
          ...prev,
          { type: "assistant", text: "Sorry, there was an error. Please try again." },
        ]);
      } finally {
        setLoading(false); // Set loading to false after response is received
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();  // Prevent form submission
      handleSend();        // Send the message
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Messages Container */}
      <div className="flex-grow p-4 overflow-hidden">
        {messages.map((msg, index) => (
          <motion.div
            key={index}
            className="flex items-start space-x-2 mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Icon (User or Assistant) */}
            <div
              className={`w-11 h-11 rounded-full flex-shrink-0 ${msg.type === "user" ? "bg-blue-500" : ""} flex items-center justify-center`}
            >
              {msg.type === "user" ? (
                <span className="text-2xl font-bold text-white">S</span> // Replace with user icon
              ) : (
                <img
                  src="/Icon.svg"
                  alt="Assistant Icon"
                  className="w-11 h-11 object-cover"
                />
              )}
            </div>

            {/* Message Bubble */}
            <div
              className={`p-3 rounded-lg max-w-[75%] break-words ${
                msg.type === "assistant"
                  ? "bg-green-100 text-gray-800"
                  : "bg-blue-100 text-gray-800"
              }`}
            >
              {msg.text}
            </div>
          </motion.div>
        ))}
        {/* Show loading message when the request is being processed */}
        {loading && (
          <motion.div
            className="flex items-start space-x-2 mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-11 h-11 rounded-full flex-shrink-0 bg-gray-300 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">🤖</span>
            </div>
            <div className="p-3 rounded-lg max-w-[75%] break-words bg-gray-200 text-gray-800">
              Processing your request...
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Container (Fixed at Bottom) */}
      <div className="p-4 bg-white flex items-center space-x-3 sticky bottom-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown} // Handle Enter key press
          placeholder="Send a message..."
          className="flex-grow p-3 focus:ring-0 outline-none bg-[#E4E8EE] rounded"
        />
        <button
          onClick={handleSend}
          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default Chat;
