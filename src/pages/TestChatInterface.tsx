import React from 'react';

// Mock data types
type Message = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
};

const mockMessages: Message[] = [
  {
    id: '1',
    content: 'Hello! I need help with a legal question about property law.',
    role: 'user',
    timestamp: '10:30 AM'
  },
  {
    id: '2',
    content: 'Of course! I\'d be happy to help you with property law questions. What specific aspect would you like to know about?',
    role: 'assistant',
    timestamp: '10:31 AM'
  },
  {
    id: '3',
    content: 'My neighbor built a fence that extends into my property by about 2 feet. What are my options?',
    role: 'user',
    timestamp: '10:32 AM'
  },
  {
    id: '4',
    content: 'This is a common property dispute. Here are your main options:\n\n1. First, verify your property boundaries with official surveys\n2. Document the encroachment with photos and measurements\n3. Have a friendly discussion with your neighbor\n4. If needed, send a formal written request\n5. Consider mediation\n6. As a last resort, legal action\n\nWould you like me to explain any of these options in more detail?',
    role: 'assistant',
    timestamp: '10:33 AM'
  },
  {
    id: '5',
    content: 'Yes, could you explain more about the mediation process?',
    role: 'user',
    timestamp: '10:34 AM'
  }
];

const TestChatInterface: React.FC = () => {
  const [newMessage, setNewMessage] = React.useState('');
  const [messages] = React.useState<Message[]>(mockMessages);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would send the message
    console.log('Message submitted:', newMessage);
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Fixed Header */}
      <div className="flex-none bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white font-semibold">LE</span>
                </div>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Legal Assistant</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Property Law Expert</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
              >
                <div className="flex flex-col space-y-2 max-w-[75%]">
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      message.role === 'assistant'
                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    {message.content}
                  </div>
                  <span className={`text-xs ${
                    message.role === 'assistant' 
                      ? 'text-gray-500 dark:text-gray-400 ml-2' 
                      : 'text-gray-500 dark:text-gray-400 mr-2 text-right'
                  }`}>
                    {message.timestamp}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Fixed Footer - Input Box */}
      <div className="flex-none bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <form onSubmit={handleSubmit} className="flex space-x-4">
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="w-full rounded-full border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TestChatInterface;
