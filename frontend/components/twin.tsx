'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Copy, Check } from 'lucide-react';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export default function Twin() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string>('');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const maxCharacters = 500;
    const quickPrompts = [
        'Tell me about yourself',
        'What is your expertise?',
        'Give me your strengths and weaknesses.',
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/chat`, {

                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: input,
                    session_id: sessionId || undefined,
                }),
            });

            if (!response.ok) throw new Error('Failed to send message');

            const data = await response.json();

            if (!sessionId) {
                setSessionId(data.session_id);
            }

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.response,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Error:', error);
            // Add error message
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = async (text: string, id: string) => {
        try {
            await navigator.clipboard?.writeText(text);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 1200);
        } catch (err) {
            console.error('Copy failed', err);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 rounded-lg shadow-lg">
            {/* Header */}
            <div className="bg-linear-to-r from-slate-700 to-slate-800 text-white p-4 rounded-t-lg flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Bot className="w-6 h-6" />
                        AI digital twin deployed to the cloud
                    </h2>
                    <p className="text-sm text-slate-300 mt-1">Ask anything about Shreyas.</p>
                </div>
                <button
                    onClick={() => {
                        setMessages([]);
                        setSessionId('');
                    }}
                    className="text-sm bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-md border border-white/20 transition-colors"
                >
                    New chat
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-100">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-8">
                        <Bot className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p>Hello! I&apos;m your Digital Twin.</p>
                        <p className="text-sm mt-2">Ask me anything about AI deployment!</p>
                    </div>
                )}

                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'
                            }`}
                    >
                        {message.role === 'assistant' && (
                            <div className="shrink-0">
                                <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                                    <Bot className="w-5 h-5 text-white" />
                                </div>
                            </div>
                        )}

                        <div
                            className={`relative max-w-[70%] rounded-lg p-3 group ${message.role === 'user'
                                    ? 'bg-slate-700 text-white'
                                    : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
                                }`}
                        >
                            <p className="whitespace-pre-wrap">{message.content}</p>
                            <div className="flex items-center gap-3 text-xs mt-2 text-gray-400">
                                <span className={message.role === 'user' ? 'text-slate-200' : 'text-gray-500'}>
                                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full border ${message.role === 'user' ? 'border-slate-400/40 text-slate-100' : 'border-gray-200 text-gray-600'}`}>
                                    {message.role === 'user' ? 'sent' : 'responded'}
                                </span>
                                <button
                                    onClick={() => handleCopy(message.content, message.id)}
                                    className="ml-auto hidden group-hover:inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-transparent hover:border-slate-300 text-gray-500 hover:text-gray-700 transition-colors"
                                    aria-label="Copy message"
                                >
                                    {copiedId === message.id ? (
                                        <>
                                            <Check className="w-3 h-3" /> Copied
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3 h-3" /> Copy
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {message.role === 'user' && (
                            <div className="shrink-0">
                                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-white" />
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {isLoading && (
                    <div className="flex gap-3 justify-start">
                        <div className="shrink-0">
                            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                            <div className="h-3 w-24 bg-linear-to-r from-slate-200 via-slate-300 to-slate-200 rounded-full animate-pulse" />
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 p-4 bg-white rounded-b-lg space-y-3">
                <div className="flex flex-wrap gap-2">
                    {quickPrompts.map((prompt) => (
                        <button
                            key={prompt}
                            onClick={() => setInput(prompt)}
                            className="text-sm px-3 py-1 rounded-full border border-gray-200 text-gray-600 hover:text-slate-700 hover:border-slate-300 transition-colors"
                            disabled={isLoading}
                        >
                            {prompt}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value.slice(0, maxCharacters))}
                        onKeyDown={handleKeyPress}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600 focus:border-transparent text-gray-800 resize-none min-h-[44px] max-h-32"
                        disabled={isLoading}
                        rows={1}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!input.trim() || isLoading}
                        className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
                <div className="text-right text-xs text-gray-400">
                    {input.length}/{maxCharacters} characters
                </div>
            </div>
        </div>
    );
}
