import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function listModels() {
    console.log('Testing Google AI connection...');
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
        console.error('Error: GOOGLE_API_KEY is not defined in .env');
        return;
    }

    console.log(`API Key found: ${apiKey.substring(0, 8)}...`);

    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        // List available models
        console.log('\nAttempting to list models...');

        // Try a simple generation with gemini-pro
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent('Hello');
        const response = await result.response;
        console.log('Success with gemini-pro!');
        console.log('Response:', response.text());
    } catch (error: any) {
        console.error('Error with gemini-pro:', error.message);

        // Try gemini-1.5-pro
        try {
            console.log('\nTrying gemini-1.5-pro...');
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const result = await model.generateContent('Hello');
            const response = await result.response;
            console.log('Success with gemini-1.5-pro!');
            console.log('Response:', response.text());
        } catch (error2: any) {
            console.error('Error with gemini-1.5-pro:', error2.message);
        }
    }
}

listModels();
