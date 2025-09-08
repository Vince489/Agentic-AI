// test_mock_tools.js - Test script for mock trip planning tools
import { mockTools } from './tools/mock_tools.js';

async function testMockTools() {
    console.log('🧪 Testing Mock Trip Planning Tools\n');
    
    try {
        // Test Flight Search
        console.log('1. Testing Flight Search API...');
        const flightResult = await mockTools.flight_api.call({
            origin: 'New York',
            destination: 'Paris',
            departureDate: '2024-06-15',
            returnDate: '2024-06-22',
            passengers: 2,
            class: 'economy'
        });
        console.log('✅ Flight search completed\n');
        
        // Test Hotel Search
        console.log('2. Testing Hotel Search API...');
        const hotelResult = await mockTools.hotel_api.call({
            location: 'Paris',
            checkInDate: '2024-06-15',
            checkOutDate: '2024-06-22',
            guests: 2,
            rooms: 1,
            starRating: 4
        });
        console.log('✅ Hotel search completed\n');
        
        // Test Attraction Search
        console.log('3. Testing Travel Guide/Attractions API...');
        const attractionResult = await mockTools.travel_guide_api.call({
            location: 'Paris',
            duration: 7,
            interests: 'history,art,food',
            budget: 'medium'
        });
        console.log('✅ Attraction search completed\n');
        
        // Test Restaurant Search
        console.log('4. Testing Restaurant Search API...');
        const restaurantResult = await mockTools.restaurant_api.call({
            location: 'Paris',
            cuisine: 'french',
            priceRange: 'moderate',
            atmosphere: 'romantic',
            maxResults: 5
        });
        console.log('✅ Restaurant search completed\n');
        
        console.log('🎉 All mock tools are working correctly!');
        console.log('\n📊 Sample Results Summary:');
        
        // Parse and show summary
        const flights = JSON.parse(flightResult);
        const hotels = JSON.parse(hotelResult);
        const attractions = JSON.parse(attractionResult);
        const restaurants = JSON.parse(restaurantResult);
        
        console.log(`  ✈️ Found ${flights.outboundFlights.length} outbound flights`);
        console.log(`  🏨 Found ${hotels.totalResults} hotels`);
        console.log(`  🗺️ Found ${attractions.totalAttractions} attractions`);
        console.log(`  🍽️ Found ${restaurants.totalResults} restaurants`);
        
        return {
            flights,
            hotels,
            attractions,
            restaurants
        };
        
    } catch (error) {
        console.error('❌ Error testing mock tools:', error);
        throw error;
    }
}

// Run the test automatically
testMockTools()
    .then(results => {
        console.log('\n✨ Test completed successfully!');
    })
    .catch(error => {
        console.error('\n💥 Test failed:', error.message);
        process.exit(1);
    });

export { testMockTools };
