
import dotenv from 'dotenv';
import path from 'path';
import OpenAI from 'openai';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function testOpenAI() {
    console.log('Testing OpenAI connection...');
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        console.error('Error: OPENAI_API_KEY is not defined in .env');
        return;
    }

    console.log(`API Key found: ${apiKey.substring(0, 8)}...`);

    const openai = new OpenAI({
        apiKey: apiKey,
    });

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'user', content: 'Hello, are you working?' }
            ],
            max_tokens: 50,
        });

        console.log('Success! Response:');
        console.log(response.choices[0]?.message?.content);
    } catch (error: any) {
        console.error('OpenAI API Error:');
        console.error(error);
    }
}

testOpenAI();
