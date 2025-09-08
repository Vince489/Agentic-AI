// mock_tools.js - Export all mock tools for trip planning
import { flightSearchTool } from './flight_api.js';
import { hotelSearchTool } from './hotel_api.js';
import { attractionSearchTool } from './travel_guide_api.js';
import { restaurantSearchTool } from './restaurant_api.js';

// Export all mock tools
export const mockTools = {
    flight_api: flightSearchTool,
    hotel_api: hotelSearchTool,
    travel_guide_api: attractionSearchTool,
    restaurant_api: restaurantSearchTool
};

// Individual exports for convenience
export { flightSearchTool, hotelSearchTool, attractionSearchTool, restaurantSearchTool };

// Tool registry for dynamic lookup
export const toolRegistry = {
    'flight_api': flightSearchTool,
    'hotel_api': hotelSearchTool,
    'travel_guide_api': attractionSearchTool,
    'restaurant_api': restaurantSearchTool
};

console.log('🛠️ Mock tools loaded successfully:');
console.log('  ✈️ Flight Search API');
console.log('  🏨 Hotel Search API');
console.log('  🗺️ Travel Guide/Attractions API');
console.log('  🍽️ Restaurant Search API');
