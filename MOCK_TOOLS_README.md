# Mock Trip Planning Tools

This directory contains mock implementations of the external APIs referenced in `trip.json` for testing the trip planning agency without requiring real API keys or external services.

## Available Mock Tools

### 1. Flight Search API (`flight_api.js`)
- **Tool Name**: `flightSearch`
- **Purpose**: Searches for flights between origin and destination
- **Parameters**:
  - `origin` (required): Origin airport/city
  - `destination` (required): Destination airport/city  
  - `departureDate` (required): Departure date (YYYY-MM-DD)
  - `returnDate` (optional): Return date for round-trip
  - `passengers` (optional): Number of passengers (default: 1)
  - `budget` (optional): Maximum budget per person
  - `class` (optional): Flight class (economy/business/first)

### 2. Hotel Search API (`hotel_api.js`)
- **Tool Name**: `hotelSearch`
- **Purpose**: Searches for hotels in specified location
- **Parameters**:
  - `location` (required): City or area name
  - `checkInDate` (required): Check-in date (YYYY-MM-DD)
  - `checkOutDate` (required): Check-out date (YYYY-MM-DD)
  - `guests` (optional): Number of guests (default: 2)
  - `rooms` (optional): Number of rooms (default: 1)
  - `budget` (optional): Maximum budget per night
  - `starRating` (optional): Minimum star rating (1-5)
  - `amenities` (optional): Preferred amenities

### 3. Travel Guide API (`travel_guide_api.js`)
- **Tool Name**: `attractionSearch`
- **Purpose**: Searches for tourist attractions and activities
- **Parameters**:
  - `location` (required): City or area name
  - `category` (optional): Type of attraction (museums/landmarks/parks/etc.)
  - `duration` (optional): Number of days for itinerary (default: 3)
  - `interests` (optional): Traveler interests (history,art,food,nature)
  - `budget` (optional): Budget level (low/medium/high)

### 4. Restaurant Search API (`restaurant_api.js`)
- **Tool Name**: `restaurantSearch`
- **Purpose**: Searches for restaurants and dining options
- **Parameters**:
  - `location` (required): City or neighborhood name
  - `cuisine` (optional): Cuisine type (italian/french/asian/etc.)
  - `priceRange` (optional): Price range (budget/moderate/upscale/fine-dining)
  - `mealType` (optional): Meal type (breakfast/lunch/dinner/brunch)
  - `dietaryRestrictions` (optional): Dietary needs
  - `atmosphere` (optional): Desired atmosphere
  - `maxResults` (optional): Maximum results (default: 10)

## Usage

### Import All Tools
```javascript
import { mockTools } from './tools/mock_tools.js';

// Use flight search
const flightResults = await mockTools.flight_api.call({
    origin: 'New York',
    destination: 'Paris',
    departureDate: '2024-06-15',
    returnDate: '2024-06-22'
});
```

### Import Individual Tools
```javascript
import { flightSearchTool, hotelSearchTool } from './tools/mock_tools.js';

const flights = await flightSearchTool.call(params);
const hotels = await hotelSearchTool.call(params);
```

### Tool Registry Lookup
```javascript
import { toolRegistry } from './tools/mock_tools.js';

const tool = toolRegistry['flightSearch'];
const result = await tool.call(params);
```

## Testing

Run the test script to verify all mock tools are working:

```bash
node test_mock_tools.js
```

This will test all four APIs with sample data and display results.

## Integration with trip.json

The mock tools are designed to match the tool references in `trip.json`:

- `flight-researcher` agent uses `flight_api` → `flightSearchTool`
- `hotel-booker` agent uses `hotel_api` → `hotelSearchTool`  
- `itinerary-builder` agent uses `travel_guide_api` → `attractionSearchTool`
- `itinerary-builder` agent uses `restaurant_api` → `restaurantSearchTool`

## Mock Data Features

- **Realistic Data**: All tools return realistic sample data with proper structure
- **Randomization**: Results vary on each call to simulate real API behavior
- **Parameter Filtering**: Tools respect filter parameters (budget, preferences, etc.)
- **Error Handling**: Proper error handling and logging
- **Consistent Schema**: All tools follow the same schema structure as existing tools

## Sample Response Structure

Each tool returns JSON with:
- `searchCriteria`: Echo of input parameters
- Main results array (flights/hotels/attractions/restaurants)
- `totalResults`: Count of results
- `searchTimestamp`: When the search was performed
- Additional metadata and recommendations

## Benefits for Testing

1. **No External Dependencies**: Test without real API keys
2. **Fast Response**: No network delays
3. **Predictable Data**: Consistent structure for testing
4. **Cost-Free**: No API usage charges
5. **Offline Development**: Work without internet connection

## Next Steps

1. Test individual tools with `test_mock_tools.js`
2. Integrate with your trip planning agency
3. Replace with real APIs when ready for production
4. Use the same tool interface for seamless transition
