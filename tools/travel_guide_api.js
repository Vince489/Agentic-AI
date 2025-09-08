// travel_guide_api.js - Mock Travel Guide/Attractions Search Tool
export const attractionSearchTool = {
    name: 'travel_guide_api',
    description: 'Searches for tourist attractions, activities, and points of interest in a specified location.',
    schema: {
        function_declaration: {
            name: 'travel_guide_api',
            description: 'Searches for tourist attractions, activities, and points of interest in a specified location.',
            parameters: {
                type: 'OBJECT',
                properties: {
                    location: {
                        type: 'STRING',
                        description: 'City or area name (e.g., "Paris", "Manhattan", "Rome")',
                    },
                    category: {
                        type: 'STRING',
                        description: 'Type of attraction: museums, landmarks, parks, entertainment, shopping, tours (optional)',
                    },
                    duration: {
                        type: 'NUMBER',
                        description: 'Number of days for the itinerary (default: 3)',
                    },
                    interests: {
                        type: 'STRING',
                        description: 'Traveler interests (e.g., "history,art,food,nature")',
                    },
                    budget: {
                        type: 'STRING',
                        description: 'Budget level: low, medium, high (optional)',
                    }
                },
                required: ['location'],
            },
        },
    },
    call: async (params) => {
        console.log(`🗺️ [TRAVEL GUIDE API] Searching attractions with params:`, params);
        
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 800));
            
            const { location, category, duration = 3, interests, budget = 'medium' } = params;
            
            // Mock attraction data by location
            const attractionsByLocation = {
                'paris': [
                    { name: 'Eiffel Tower', category: 'landmarks', price: 25, duration: '2-3 hours', rating: 4.6 },
                    { name: 'Louvre Museum', category: 'museums', price: 17, duration: '3-4 hours', rating: 4.7 },
                    { name: 'Notre-Dame Cathedral', category: 'landmarks', price: 0, duration: '1-2 hours', rating: 4.5 },
                    { name: 'Arc de Triomphe', category: 'landmarks', price: 13, duration: '1 hour', rating: 4.4 },
                    { name: 'Seine River Cruise', category: 'tours', price: 35, duration: '1.5 hours', rating: 4.3 },
                    { name: 'Montmartre & Sacré-Cœur', category: 'landmarks', price: 0, duration: '2-3 hours', rating: 4.5 },
                    { name: 'Champs-Élysées', category: 'shopping', price: 0, duration: '2-3 hours', rating: 4.2 },
                    { name: 'Versailles Palace', category: 'landmarks', price: 20, duration: '4-5 hours', rating: 4.6 }
                ],
                'new york': [
                    { name: 'Statue of Liberty', category: 'landmarks', price: 23, duration: '3-4 hours', rating: 4.5 },
                    { name: 'Central Park', category: 'parks', price: 0, duration: '2-4 hours', rating: 4.6 },
                    { name: 'Empire State Building', category: 'landmarks', price: 37, duration: '1-2 hours', rating: 4.4 },
                    { name: 'Metropolitan Museum', category: 'museums', price: 25, duration: '3-4 hours', rating: 4.7 },
                    { name: 'Times Square', category: 'entertainment', price: 0, duration: '1-2 hours', rating: 4.2 },
                    { name: 'Brooklyn Bridge', category: 'landmarks', price: 0, duration: '1-2 hours', rating: 4.6 },
                    { name: 'High Line Park', category: 'parks', price: 0, duration: '1-2 hours', rating: 4.5 },
                    { name: 'Broadway Show', category: 'entertainment', price: 85, duration: '2.5 hours', rating: 4.8 }
                ],
                'london': [
                    { name: 'Tower of London', category: 'landmarks', price: 30, duration: '2-3 hours', rating: 4.5 },
                    { name: 'British Museum', category: 'museums', price: 0, duration: '3-4 hours', rating: 4.7 },
                    { name: 'Big Ben & Parliament', category: 'landmarks', price: 0, duration: '1 hour', rating: 4.4 },
                    { name: 'London Eye', category: 'entertainment', price: 32, duration: '1 hour', rating: 4.3 },
                    { name: 'Buckingham Palace', category: 'landmarks', price: 0, duration: '1-2 hours', rating: 4.2 },
                    { name: 'Westminster Abbey', category: 'landmarks', price: 25, duration: '1-2 hours', rating: 4.5 },
                    { name: 'Thames River Cruise', category: 'tours', price: 20, duration: '1.5 hours', rating: 4.4 },
                    { name: 'Covent Garden', category: 'shopping', price: 0, duration: '2-3 hours', rating: 4.3 }
                ]
            };
            
            // Default attractions for unknown locations
            const defaultAttractions = [
                { name: 'Historic City Center', category: 'landmarks', price: 0, duration: '2-3 hours', rating: 4.3 },
                { name: 'Local Museum', category: 'museums', price: 15, duration: '2-3 hours', rating: 4.2 },
                { name: 'City Park', category: 'parks', price: 0, duration: '1-2 hours', rating: 4.4 },
                { name: 'Walking Tour', category: 'tours', price: 25, duration: '2-3 hours', rating: 4.5 },
                { name: 'Local Market', category: 'shopping', price: 0, duration: '1-2 hours', rating: 4.1 },
                { name: 'Cultural District', category: 'entertainment', price: 10, duration: '2-4 hours', rating: 4.3 }
            ];
            
            // Get attractions for the location
            const locationKey = location.toLowerCase().replace(/\s+/g, ' ');
            let attractions = attractionsByLocation[locationKey] || defaultAttractions;
            
            // Filter by category if specified
            if (category) {
                attractions = attractions.filter(attr => attr.category === category.toLowerCase());
            }
            
            // Filter by interests if specified
            if (interests) {
                const interestList = interests.toLowerCase().split(',').map(i => i.trim());
                attractions = attractions.filter(attr => {
                    return interestList.some(interest => {
                        if (interest === 'history') return ['landmarks', 'museums'].includes(attr.category);
                        if (interest === 'art') return ['museums'].includes(attr.category);
                        if (interest === 'nature') return ['parks'].includes(attr.category);
                        if (interest === 'food') return ['tours', 'shopping'].includes(attr.category);
                        if (interest === 'entertainment') return ['entertainment', 'tours'].includes(attr.category);
                        return attr.category.includes(interest);
                    });
                });
            }
            
            // Filter by budget
            if (budget === 'low') {
                attractions = attractions.filter(attr => attr.price <= 15);
            } else if (budget === 'high') {
                attractions = attractions.filter(attr => attr.price >= 20);
            }
            
            // Add additional details to attractions
            const enhancedAttractions = attractions.map(attr => ({
                ...attr,
                description: `A must-visit ${attr.category.slice(0, -1)} in ${location}`,
                address: `${Math.floor(Math.random() * 999) + 1} ${attr.name.split(' ')[0]} Street, ${location}`,
                openingHours: attr.category === 'parks' ? '24/7' : '9:00 AM - 6:00 PM',
                bestTimeToVisit: ['Morning', 'Afternoon', 'Evening'][Math.floor(Math.random() * 3)],
                accessibility: 'Wheelchair accessible',
                nearbyTransport: ['Metro', 'Bus', 'Taxi'][Math.floor(Math.random() * 3)],
                tips: `Book tickets in advance for ${attr.name}`,
                photoUrl: `https://example.com/photos/${attr.name.toLowerCase().replace(/\s+/g, '-')}.jpg`
            }));
            
            // Create daily itinerary suggestions
            const dailyItineraries = [];
            const attractionsPerDay = Math.ceil(enhancedAttractions.length / duration);
            
            for (let day = 1; day <= duration; day++) {
                const startIndex = (day - 1) * attractionsPerDay;
                const dayAttractions = enhancedAttractions.slice(startIndex, startIndex + attractionsPerDay);
                
                dailyItineraries.push({
                    day,
                    theme: `Day ${day}: ${dayAttractions[0]?.category || 'Exploration'}`,
                    attractions: dayAttractions,
                    estimatedCost: dayAttractions.reduce((sum, attr) => sum + attr.price, 0),
                    totalDuration: `${dayAttractions.length * 2}-${dayAttractions.length * 4} hours`
                });
            }
            
            const result = {
                searchCriteria: {
                    location,
                    category,
                    duration,
                    interests,
                    budget
                },
                attractions: enhancedAttractions,
                dailyItineraries,
                totalAttractions: enhancedAttractions.length,
                estimatedTotalCost: enhancedAttractions.reduce((sum, attr) => sum + attr.price, 0),
                searchTimestamp: new Date().toISOString(),
                recommendations: {
                    bestDays: duration,
                    budgetTips: budget === 'low' ? 'Many free attractions available' : 'Consider combo tickets for savings',
                    seasonalNote: 'Check seasonal opening hours and weather conditions'
                }
            };
            
            console.log(`🗺️ [TRAVEL GUIDE API] Found ${result.totalAttractions} attractions for ${duration} days`);
            return JSON.stringify(result, null, 2);
            
        } catch (error) {
            console.error(`🗺️ [TRAVEL GUIDE API] Error during attraction search:`, error);
            return `Attraction search error: ${error.message}`;
        }
    },
};
