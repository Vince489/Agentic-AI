// hotel_api.js - Mock Hotel Search Tool
export const hotelSearchTool = {
    name: 'hotel_api',
    description: 'Searches for hotels in a specified location with check-in/out dates and preferences.',
    schema: {
        function_declaration: {
            name: 'hotel_api',
            description: 'Searches for hotels in a specified location with check-in/out dates and preferences.',
            parameters: {
                type: 'OBJECT',
                properties: {
                    location: {
                        type: 'STRING',
                        description: 'City or area name (e.g., "New York", "Manhattan", "Times Square")',
                    },
                    checkInDate: {
                        type: 'STRING',
                        description: 'Check-in date in YYYY-MM-DD format',
                    },
                    checkOutDate: {
                        type: 'STRING',
                        description: 'Check-out date in YYYY-MM-DD format',
                    },
                    guests: {
                        type: 'NUMBER',
                        description: 'Number of guests (default: 2)',
                    },
                    rooms: {
                        type: 'NUMBER',
                        description: 'Number of rooms (default: 1)',
                    },
                    budget: {
                        type: 'NUMBER',
                        description: 'Maximum budget per night in USD (optional)',
                    },
                    starRating: {
                        type: 'NUMBER',
                        description: 'Minimum star rating (1-5, optional)',
                    },
                    amenities: {
                        type: 'STRING',
                        description: 'Preferred amenities (e.g., "wifi,pool,gym,spa")',
                    }
                },
                required: ['location', 'checkInDate', 'checkOutDate'],
            },
        },
    },
    call: async (params) => {
        console.log(`🏨 [HOTEL API] Searching hotels with params:`, params);
        
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1200));
            
            const { location, checkInDate, checkOutDate, guests = 2, rooms = 1, budget, starRating, amenities } = params;
            
            // Calculate number of nights
            const checkIn = new Date(checkInDate);
            const checkOut = new Date(checkOutDate);
            const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
            
            // Mock hotel data
            const hotelChains = ['Marriott', 'Hilton', 'Hyatt', 'InterContinental', 'Sheraton', 'Westin', 'Courtyard', 'Hampton Inn', 'Holiday Inn'];
            const hotelTypes = ['Hotel', 'Resort', 'Suites', 'Inn', 'Lodge', 'Boutique Hotel'];
            const neighborhoods = ['Downtown', 'City Center', 'Business District', 'Historic Quarter', 'Waterfront', 'Airport Area'];
            
            const commonAmenities = ['Free WiFi', 'Fitness Center', 'Business Center', 'Concierge', '24/7 Front Desk'];
            const luxuryAmenities = ['Spa', 'Pool', 'Restaurant', 'Room Service', 'Valet Parking', 'Airport Shuttle'];
            
            // Generate mock hotels
            const hotels = [];
            
            for (let i = 0; i < Math.floor(Math.random() * 5) + 6; i++) {
                const chain = hotelChains[Math.floor(Math.random() * hotelChains.length)];
                const type = hotelTypes[Math.floor(Math.random() * hotelTypes.length)];
                const neighborhood = neighborhoods[Math.floor(Math.random() * neighborhoods.length)];
                const stars = Math.floor(Math.random() * 3) + 3; // 3-5 stars
                
                // Price varies by star rating
                const basePrice = stars === 3 ? 80 + Math.random() * 70 :
                                 stars === 4 ? 150 + Math.random() * 100 :
                                 250 + Math.random() * 200;
                
                const pricePerNight = Math.round(basePrice);
                const totalPrice = pricePerNight * nights * rooms;
                
                // Skip if over budget
                if (budget && pricePerNight > budget) continue;
                if (starRating && stars < starRating) continue;
                
                // Generate amenities based on star rating
                let hotelAmenities = [...commonAmenities];
                if (stars >= 4) {
                    hotelAmenities.push(...luxuryAmenities.slice(0, Math.floor(Math.random() * 4) + 2));
                }
                if (stars === 5) {
                    hotelAmenities.push('Butler Service', 'Luxury Spa', 'Fine Dining', 'Premium Location');
                }
                
                // Filter by requested amenities if provided
                if (amenities) {
                    const requestedAmenities = amenities.toLowerCase().split(',').map(a => a.trim());
                    const hasRequiredAmenities = requestedAmenities.every(req => 
                        hotelAmenities.some(hotel => hotel.toLowerCase().includes(req))
                    );
                    if (!hasRequiredAmenities) continue;
                }
                
                hotels.push({
                    hotelId: `HTL${Math.floor(Math.random() * 90000) + 10000}`,
                    name: `${chain} ${location} ${type}`,
                    chain,
                    starRating: stars,
                    location: `${neighborhood}, ${location}`,
                    address: `${Math.floor(Math.random() * 9999) + 1} ${neighborhood} Street, ${location}`,
                    pricePerNight,
                    totalPrice,
                    currency: 'USD',
                    nights,
                    rooms,
                    guests,
                    amenities: hotelAmenities,
                    roomType: guests <= 2 ? 'Standard King Room' : 'Standard Double Room',
                    cancellation: pricePerNight > 200 ? 'Free cancellation until 24h before' : 'Non-refundable',
                    breakfast: stars >= 4 ? 'Complimentary breakfast included' : 'Breakfast available for additional fee',
                    rating: (3.5 + Math.random() * 1.5).toFixed(1),
                    reviewCount: Math.floor(Math.random() * 2000) + 100,
                    distanceFromCenter: `${(Math.random() * 5 + 0.5).toFixed(1)} km from city center`,
                    checkInTime: '15:00',
                    checkOutTime: '11:00',
                    wifi: 'Free WiFi',
                    parking: stars >= 4 ? 'Valet parking available' : 'Self-parking available'
                });
            }
            
            // Sort by price
            hotels.sort((a, b) => a.pricePerNight - b.pricePerNight);
            
            const result = {
                searchCriteria: {
                    location,
                    checkInDate,
                    checkOutDate,
                    nights,
                    guests,
                    rooms,
                    budget,
                    starRating,
                    amenities
                },
                hotels: hotels.slice(0, 8), // Return top 8 results
                totalResults: hotels.length,
                searchTimestamp: new Date().toISOString(),
                currency: 'USD'
            };
            
            console.log(`🏨 [HOTEL API] Found ${result.totalResults} hotel options`);
            return JSON.stringify(result, null, 2);
            
        } catch (error) {
            console.error(`🏨 [HOTEL API] Error during hotel search:`, error);
            return `Hotel search error: ${error.message}`;
        }
    },
};
