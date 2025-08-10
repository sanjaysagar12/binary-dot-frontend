import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const getGeminiApiKey = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('Gemini API key not found in environment variables. Please set GEMINI_API_KEY.');
    }
    return apiKey;
};

export const GeminiAI = async (
    systemPrompt: string,
    userPrompt: string
): Promise<string> => {
    try {
        const apiKey = getGeminiApiKey();
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Combine system prompt and user prompt
        const fullPrompt = `${systemPrompt}\n\nUser: ${userPrompt}\n\nAssistant:`;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = await response.text();
        return text;
    } catch (error) {
        console.error("Error getting AI response:", error);
        throw new Error("Sorry, I couldn't process your request. Please make sure your API key is set correctly in the environment variable GEMINI_API_KEY.");
    }
};

// Function to detect if user is asking for events
const detectEventQuery = (prompt: string): string | null => {
    const eventKeywords = ['events', 'event', 'find events', 'show events', 'gaming events', 'sports events', 'tech events', 'music events', 'art events', 'food events', 'education events', 'business events'];
    const tagKeywords = ['gaming', 'sports', 'tech', 'music', 'art', 'food', 'education', 'business'];
    
    const lowerPrompt = prompt.toLowerCase();
    
    // Check for specific tag mentions
    for (const tag of tagKeywords) {
        if (lowerPrompt.includes(tag)) {
            return tag;
        }
    }
    
    // Check for general event queries
    if (eventKeywords.some(keyword => lowerPrompt.includes(keyword))) {
        return 'all'; // Return all events
    }
    
    return null;
};

// Function to fetch events from API
const fetchEvents = async (tag: string) => {
    try {
        const url = tag === 'all' 
            ? 'https://api-avalink.portos.cloud/api/event/all'
            : `https://api-avalink.portos.cloud/api/event/tag/${encodeURIComponent(tag)}`;
            
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch events: ${response.status}`);
        }
        
        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Error fetching events:', error);
        return [];
    }
};

// Function to format events for AI response
const formatEventsForAI = (events: any[], tag: string) => {
    if (events.length === 0) {
        return tag === 'all' 
            ? "I couldn't find any events at the moment."
            : `I couldn't find any events tagged with "${tag}".`;
    }
    
    const eventList = events.slice(0, 5).map((event, index) => {
        return `${index + 1}. **${event.title}**
   - Description: ${event.description.substring(0, 100)}${event.description.length > 100 ? '...' : ''}
   - Tag: #${event.tag}
   - Date: ${new Date(event.startDate).toLocaleDateString()}
   - Participants: ${event._count?.participants || 0}${event.maxParticipants ? `/${event.maxParticipants}` : ''}
   - Prize Pool: ${event.prizePool ? `$${event.prizePool}` : 'None'}
   - Creator: ${event.creator.name}`;
    }).join('\n\n');
    
    const tagText = tag === 'all' ? 'all categories' : `the "${tag}" category`;
    const moreText = events.length > 5 ? `\n\n*Note: Showing 5 of ${events.length} total events.*` : '';
    
    return `Here are the available events in ${tagText}:\n\n${eventList}${moreText}`;
};

export async function POST(request: NextRequest) {
    try {
        const { prompt } = await request.json();
        
        if (!prompt) {
            return NextResponse.json(
                { error: 'Prompt is required' },
                { status: 400 }
            );
        }

        // Check if user is asking for events
        const detectedTag = detectEventQuery(prompt);
        
        if (detectedTag) {
            // Fetch events and format response
            const events = await fetchEvents(detectedTag);
            const eventsText = formatEventsForAI(events, detectedTag);
            
            // Use AI to create a natural response with the events data
            const systemPrompt = `You are a helpful assistant for an event platform. The user asked about events and here's the current data: ${eventsText}. 
            
            Respond in a friendly, conversational manner. Present the events information clearly and suggest they can click on events to view more details or join them. Keep your response concise but helpful.
            
            IMPORTANT: Provide your response in plain text format only. Do not use markdown formatting, asterisks, hashtags, or any other markdown syntax. Use simple text with natural line breaks for readability.`;
            
            const aiResponse = await GeminiAI(systemPrompt, prompt);
            
            return NextResponse.json({ 
                response: aiResponse,
                events: events.slice(0, 5), // Return events data for frontend use
                type: 'events'
            });
        } else {
            // Handle general blockchain/AI questions with Avalink platform knowledge
            const systemPrompt = `You are a knowledgeable AI assistant for Avalink (formerly Binary.dot), a decentralized contest and reward platform built on the Avalanche blockchain. You help users understand blockchain technology, cryptocurrencies, smart contracts, DeFi, NFTs, and related topics, with specific expertise about the Avalink platform.

            ## About Avalink Platform:

            **Core Mission:** Avalink empowers and onboards the next generation of Web3 users by combining learning, earning, and community building in a secure, transparent, and user-friendly environment on the Avalanche blockchain.

            **Key Features:**
            - **Decentralized Contests & Campaigns:** Host various contests, quizzes, challenges, and UGC campaigns with guaranteed cryptocurrency rewards
            - **Learn & Earn Programs:** Tiered educational programs that combine Web3 skill building with real crypto incentives
            - **Locked Reward Smart Contracts:** Contest rewards are securely locked in Avalanche smart contracts, ensuring transparent and guaranteed payouts
            - **Avalanche Integration:** Leverages Avalanche's fast, low-fee, eco-friendly blockchain for smooth transactions
            - **User-Generated Content:** Community-driven campaigns that foster authentic engagement and project promotion
            - **Multi-Wallet Support:** Supports MetaMask, Avalanche wallets, and others for easy onboarding
            - **Gamification:** Leaderboards, badges, seasonal challenges, and ambassador programs
            - **Business Solutions:** Free and premium campaigns with analytics, staking incentives, and promotional partnerships

            **Target Audience:**
            - Students and newcomers seeking blockchain education and earning opportunities
            - Young professionals and crypto enthusiasts building Web3 skills
            - Avalanche-based projects seeking transparent promotion and token distribution
            - Businesses engaging crypto-savvy audiences through interactive contests
            - Content creators contributing to ecosystem growth

            **Competitive Advantages:**
            - Unique combination of education, decentralized contests, and locked smart contract rewards
            - Strong emphasis on trust and transparency via Avalanche blockchain
            - Deep Avalanche ecosystem integration with high performance and low fees
            - Focus on student onboarding and community-driven project promotion
            - Socially impactful mission empowering next-gen Web3 innovators

            When users ask about the platform, contests, rewards, or learning opportunities, provide specific information about Avalink's features and benefits. For general blockchain questions, provide accurate, helpful, and educational responses while relating them to the Avalink ecosystem when relevant.

            Keep responses concise but informative, and always maintain a helpful, educational tone.
            
            IMPORTANT: Provide your response in plain text format only. Do not use markdown formatting, asterisks, bold text, hashtags, or any other markdown syntax. Use simple text with natural line breaks and spacing for readability.`;
            
            const aiResponse = await GeminiAI(systemPrompt, prompt);
            
            return NextResponse.json({ 
                response: aiResponse,
                type: 'general'
            });
        }
        
    } catch (error) {
        console.error('Error in AI API:', error);
        return NextResponse.json(
            { error: 'Failed to process request' },
            { status: 500 }
        );
    }
}
