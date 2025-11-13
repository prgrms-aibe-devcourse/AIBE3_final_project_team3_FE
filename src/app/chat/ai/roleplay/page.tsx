"use client";
import { useEffect, useRef, useState } from "react";

type Scenario = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  initialMessage: string;
  context: string;
};

type Message = {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
};

const scenarios: Scenario[] = [
  {
    id: "job-interview",
    title: "Job Interview",
    description: "Practice answering common interview questions",
    emoji: "🏢",
    initialMessage:
      "Hello! Thank you for coming in today. Please have a seat and tell me about yourself.",
    context:
      "You are interviewing for a software developer position at a tech startup.",
  },
  {
    id: "daily-neighbor",
    title: "Neighbor Chat",
    description: "Casual conversation with your neighbor",
    emoji: "🏠",
    initialMessage:
      "Good morning! Beautiful weather we're having today, isn't it?",
    context: "You meet your friendly neighbor while checking the mail.",
  },
  {
    id: "friend-yesterday",
    title: "Friend Catch-up",
    description: "Talk about what happened yesterday with a friend",
    emoji: "👫",
    initialMessage:
      "Hey! I heard you had quite an adventure yesterday. Tell me all about it!",
    context: "Your friend wants to hear about your interesting day yesterday.",
  },
  {
    id: "restaurant-order",
    title: "Restaurant Order",
    description: "Order food at a restaurant",
    emoji: "🍽️",
    initialMessage:
      "Good evening! Welcome to our restaurant. Have you had a chance to look at the menu?",
    context:
      "You're at a nice restaurant and the waiter is ready to take your order.",
  },
  {
    id: "doctor-visit",
    title: "Doctor Visit",
    description: "Describe symptoms to a doctor",
    emoji: "👩‍⚕️",
    initialMessage: "Good afternoon. What brings you in to see me today?",
    context:
      "You're visiting a doctor because you haven't been feeling well lately.",
  },
  {
    id: "shopping",
    title: "Shopping Help",
    description: "Ask for help while shopping",
    emoji: "🛍️",
    initialMessage: "Hello! Can I help you find anything today?",
    context: "A sales associate approaches you in a clothing store.",
  },
];

// Mock AI responses based on scenario
const generateMockResponse = (
  userMessage: string,
  scenario: Scenario
): string => {
  const responses = {
    "job-interview": [
      "That's great background! Can you tell me about a challenging project you've worked on?",
      "Interesting! What do you consider your greatest strength as a developer?",
      "I see. How do you handle working under pressure and tight deadlines?",
      "Good point. Do you have any questions about our company culture or the role?",
    ],
    "daily-neighbor": [
      "Yes, it's perfect for gardening! I was just thinking about planting some flowers.",
      "How's your family doing? I haven't seen them around lately.",
      "Did you hear about the new coffee shop opening down the street?",
      "By the way, we're having a small BBQ this weekend. You should come by!",
    ],
    "friend-yesterday": [
      "Wow, that sounds crazy! What happened next?",
      "I can't believe that actually happened to you!",
      "That must have been so exciting! How did you feel?",
      "You always have the most interesting stories! What did you do after that?",
    ],
    "restaurant-order": [
      "Excellent choice! Would you like to start with an appetizer?",
      "How would you like that cooked? And what would you like to drink?",
      "Great! That comes with a choice of side. Would you prefer fries or salad?",
      "Perfect! Your order should be ready in about 15-20 minutes. Anything else I can get you?",
    ],
    "doctor-visit": [
      "I see. How long have you been experiencing these symptoms?",
      "On a scale of 1 to 10, how would you rate your discomfort?",
      "Have you taken any medication for this? Any allergies I should know about?",
      "Let me examine you. Based on what you've told me, I think we should run some tests.",
    ],
    shopping: [
      "What size are you looking for? We have that style in several colors.",
      "That would look great on you! Would you like to try it on? The fitting rooms are right over there.",
      "We're actually having a sale on that brand today - 20% off!",
      "If you're not completely satisfied, you can return it within 30 days with the receipt.",
    ],
  };

  const scenarioResponses =
    responses[scenario.id as keyof typeof responses] ||
    responses["daily-neighbor"];
  return scenarioResponses[
    Math.floor(Math.random() * scenarioResponses.length)
  ];
};

export default function RoleplayChatPage() {
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(
    null
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startScenario = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setMessages([
      {
        id: "1",
        content: scenario.initialMessage,
        sender: "ai",
        timestamp: new Date(),
      },
    ]);
  };

  const sendMessage = () => {
    if (!inputMessage.trim() || !selectedScenario) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: generateMockResponse(inputMessage, selectedScenario),
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000);
  };

  const resetChat = () => {
    setSelectedScenario(null);
    setMessages([]);
    setInputMessage("");
    setIsTyping(false);
  };

  if (!selectedScenario) {
    return (
      <div className="flex flex-col h-full bg-gray-800 p-4">
        <div className="max-w-4xl mx-auto w-full">
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">🎭</div>
            <h1 className="text-3xl font-bold mb-2 text-white">
              Roleplay Scenarios
            </h1>
            <p className="text-gray-300">
              Choose a scenario to practice real-life conversations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scenarios.map((scenario) => (
              <div
                key={scenario.id}
                onClick={() => startScenario(scenario)}
                className="bg-gray-700 rounded-lg p-6 cursor-pointer hover:bg-gray-600 transition-colors border border-gray-600"
              >
                <div className="text-3xl mb-3">{scenario.emoji}</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {scenario.title}
                </h3>
                <p className="text-gray-300 text-sm mb-3">
                  {scenario.description}
                </p>
                <div className="text-xs text-gray-400 italic">
                  "{scenario.initialMessage.substring(0, 50)}..."
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <a
              href="/chat"
              className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Back to Chat Menu
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-800">
      {/* Chat Area - 2/3 */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-700 border-b border-gray-600 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{selectedScenario.emoji}</span>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {selectedScenario.title}
                </h2>
                <p className="text-sm text-gray-300">
                  {selectedScenario.context}
                </p>
              </div>
            </div>
            <button
              onClick={resetChat}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition-colors text-sm"
            >
              New Scenario
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.sender === "user"
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-600 text-white"
                }`}
              >
                <p>{message.content}</p>
                <div
                  className={`text-xs mt-1 ${
                    message.sender === "user"
                      ? "text-emerald-100"
                      : "text-gray-300"
                  }`}
                >
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-600 text-white rounded-lg p-3 max-w-[70%]">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-gray-700 border-t border-gray-600 p-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type your response..."
              className="flex-1 bg-gray-600 text-white border border-gray-500 rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500"
              disabled={isTyping}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isTyping}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Scenario Info Panel - 1/3 */}
      <div className="w-1/3 bg-gray-900 border-l border-gray-600 flex flex-col">
        <div className="p-4 border-b border-gray-600">
          <h3 className="text-lg font-semibold text-white mb-2">
            Scenario Guide
          </h3>
        </div>

        <div className="flex-1 p-4 space-y-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium text-emerald-400 mb-2">
              Current Scenario
            </h4>
            <p className="text-white font-medium">{selectedScenario.title}</p>
            <p className="text-gray-300 text-sm mt-1">
              {selectedScenario.description}
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-400 mb-2">Context</h4>
            <p className="text-gray-300 text-sm">{selectedScenario.context}</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium text-purple-400 mb-2">Tips</h4>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>• Be natural and conversational</li>
              <li>• Ask follow-up questions</li>
              <li>• Use appropriate tone for the situation</li>
              <li>• Don't worry about perfect grammar</li>
            </ul>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium text-yellow-400 mb-2">Progress</h4>
            <p className="text-gray-300 text-sm">
              Messages exchanged: {messages.length}
            </p>
            <div className="mt-2 bg-gray-700 rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min((messages.length / 10) * 100, 100)}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
