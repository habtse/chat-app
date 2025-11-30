import OpenAI from 'openai';

// Initialize OpenAI client (supports both OpenAI and OpenRouter)
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
    baseURL: process.env.OPENAI_API_KEY?.startsWith('sk-or-')
        ? 'https://openrouter.ai/api/v1'
        : undefined,
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
        if (!process.env.OPENAI_API_KEY) {
            return "I'm an AI assistant, but I'm not fully configured yet. Please add your OPENAI_API_KEY to the backend .env file to enable AI responses.";
        }

        // Prepare messages for OpenAI
        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            {
                role: 'system',
                content: 'You are a helpful AI assistant in a chat application. Provide concise and friendly responses.',
            },
            ...conversationHistory.map(msg => ({
                role: msg.role as 'system' | 'user' | 'assistant',
                content: msg.content,
            })),
            {
                role: 'user',
                content: userMessage,
            },
        ];

        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: messages,
            max_tokens: 500,
            temperature: 0.7,
        });

        const response = completion.choices[0]?.message?.content;
        return response || 'Sorry, I could not generate a response.';
    } catch (error: any) {
        console.error('OpenAI API error:', error);

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
