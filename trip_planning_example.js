// trip_planning_example.js - Example of using mock tools with trip planning agency
import { AgencyFactory } from './AgencyFactory.js';
import { AgentFactory } from './AgentFactory.js';
import { TeamFactory } from './TeamFactory.js';
import { mockTools } from './tools/mock_tools.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create a tool registry that includes both existing and mock tools
const toolRegistry = {
    // Existing tools
    calculator: (await import('./tools/calculator_tool.js')).calculatorTool,
    webSearch: (await import('./tools/search_tool.js')).webSearchTool,

    // Mock trip planning tools - matching the names in trip.json
    flight_api: mockTools.flight_api,
    hotel_api: mockTools.hotel_api,
    travel_guide_api: mockTools.travel_guide_api,
    restaurant_api: mockTools.restaurant_api
};

async function runTripPlanningExample() {
    console.log('🌍 Trip Planning Agency Example with Mock Tools\n');

    try {
        // Set up API keys
        const apiKeys = {
            gemini: process.env.GEMINI_API_KEY,
            anthropic: process.env.ANTHROPIC_API_KEY,
            openai: process.env.OPENAI_API_KEY,
            groq: process.env.GROQ_API_KEY,
            mistral: process.env.MISTRAL_API_KEY
        };

        // Create factories following the working cc.js pattern
        const agentFactory = new AgentFactory({
            defaultProvider: 'gemini',
            apiKeys
        });

        // Register tools individually like in cc.js
        Object.values(toolRegistry).forEach(tool => {
            agentFactory.registerTool(tool);
        });

        const teamFactory = new TeamFactory({ agentFactory });
        const agencyFactory = new AgencyFactory({
            teamFactory,
            agentFactory
        });

        // Load the trip planning agency configuration
        const agency = await agencyFactory.loadAgencyFromFile('./trip.json');

        console.log(`✅ Agency loaded: ${agency.name}`);
        console.log(`📋 Description: ${agency.description}\n`);
        
        // Example trip request
        const tripRequest = {
            prompt: `Plan a 5-day romantic trip to Paris for 2 people. 
                    Budget: $3000 total. 
                    Departure from New York on June 15, 2024, returning June 20, 2024.
                    Interests: art, history, fine dining, romantic atmosphere.
                    Prefer 4-star hotels and moderate to upscale restaurants.`
        };
        
        console.log('🎯 Trip Request:');
        console.log(tripRequest.prompt);
        console.log('\n🚀 Starting trip planning process...\n');

        // Execute the trip planning workflow
        const team = agency.teams['trip-planning-team'];
        if (!team) {
            throw new Error('Trip planning team not found');
        }

        const result = await team.run(tripRequest, { agency });
        
        console.log('\n🎉 Trip Planning Completed!');
        console.log('\n📋 Final Results:');
        console.log(JSON.stringify(result, null, 2));
        
        return result;
        
    } catch (error) {
        console.error('❌ Error in trip planning:', error);
        throw error;
    }
}

// Example of testing individual tools
async function testIndividualTools() {
    console.log('\n🔧 Testing Individual Mock Tools:\n');
    
    // Test flight search
    console.log('1. Flight Search Test:');
    const flightResult = await toolRegistry.flight_api.call({
        origin: 'New York',
        destination: 'Paris',
        departureDate: '2024-06-15',
        returnDate: '2024-06-20',
        passengers: 2,
        class: 'economy',
        budget: 800
    });
    
    const flights = JSON.parse(flightResult);
    console.log(`   Found ${flights.outboundFlights.length} outbound flights`);
    console.log(`   Cheapest outbound: $${flights.outboundFlights[0]?.pricePerPerson || 'N/A'}`);
    
    // Test hotel search
    console.log('\n2. Hotel Search Test:');
    const hotelResult = await toolRegistry.hotel_api.call({
        location: 'Paris',
        checkInDate: '2024-06-15',
        checkOutDate: '2024-06-20',
        guests: 2,
        starRating: 4,
        budget: 200
    });
    
    const hotels = JSON.parse(hotelResult);
    console.log(`   Found ${hotels.totalResults} hotels`);
    console.log(`   Cheapest hotel: $${hotels.hotels[0]?.pricePerNight || 'N/A'}/night`);
    
    // Test attractions
    console.log('\n3. Attractions Search Test:');
    const attractionResult = await toolRegistry.travel_guide_api.call({
        location: 'Paris',
        duration: 5,
        interests: 'art,history',
        budget: 'medium'
    });
    
    const attractions = JSON.parse(attractionResult);
    console.log(`   Found ${attractions.totalAttractions} attractions`);
    console.log(`   Daily itineraries: ${attractions.dailyItineraries.length} days`);
    
    // Test restaurants
    console.log('\n4. Restaurant Search Test:');
    const restaurantResult = await toolRegistry.restaurant_api.call({
        location: 'Paris',
        cuisine: 'french',
        priceRange: 'moderate',
        atmosphere: 'romantic',
        maxResults: 3
    });
    
    const restaurants = JSON.parse(restaurantResult);
    console.log(`   Found ${restaurants.totalResults} restaurants`);
    console.log(`   Average price: $${restaurants.averagePrice || 'N/A'}`);
    
    console.log('\n✅ All individual tool tests completed!');
}

// Run the example
async function main() {
    try {
        // First test individual tools
        await testIndividualTools();
        
        // Then run the full trip planning example
        console.log('\n' + '='.repeat(60));
        console.log('🏢 FULL AGENCY WORKFLOW TEST');
        console.log('='.repeat(60));
        
        // Note: This would require the full agency implementation to work
        // For now, we'll just show that the tools are ready
        console.log('\n📝 Note: To run the full agency workflow, ensure:');
        console.log('   1. All agent configurations are properly set up');
        console.log('   2. LLM providers are configured with API keys');
        console.log('   3. The AgencyFactory can load the trip.json configuration');
        console.log('\n🛠️ Mock tools are ready for integration!');
        
        // Uncomment the line below when ready to test the full workflow:
        await runTripPlanningExample();
        
    } catch (error) {
        console.error('💥 Example failed:', error.message);
        process.exit(1);
    }
}

// Run the main function
main();
