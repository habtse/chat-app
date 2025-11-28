import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'test-key',
});

interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

// Generate AI response
export const generateAIResponse = async (
    userMessage: string,
    conversationHistory: ChatMessage[] = []
): Promise<string> => {
    try {
        // Check if API key is configured
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'test-key') {
            return "I'm an AI assistant, but I'm not fully configured yet. Please add your OpenAI API key to the backend .env file to enable AI responses.";
        }

        const messages: ChatMessage[] = [
            {
                role: 'system',
                content: 'You are a helpful AI assistant in a chat application. Be friendly, concise, and helpful. Keep responses brief and conversational.',
            },
            ...conversationHistory.slice(-10), // Keep last 10 messages for context
            {
                role: 'user',
                content: userMessage,
            },
        ];

        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages,
            max_tokens: 500,
            temperature: 0.7,
        });

        return response.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
    } catch (error: any) {
        console.error('OpenAI API error:', error);

        if (error.code === 'invalid_api_key') {
            return "I'm having trouble connecting to my AI service. Please check the API key configuration.";
        }

        return 'Sorry, I encountered an error while processing your message. Please try again.';
    }
};

// Get conversation history from messages
export const formatConversationHistory = (messages: any[]): ChatMessage[] => {
    return messages.map(msg => ({
        role: msg.sender.name === 'AI Assistant' ? 'assistant' : 'user',
        content: msg.content,
    }));
};

export default { generateAIResponse, formatConversationHistory };
