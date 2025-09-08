// restaurant_api.js - Mock Restaurant Search Tool
export const restaurantSearchTool = {
    name: 'restaurant_api',
    description: 'Searches for restaurants and dining options in a specified location with cuisine and preference filters.',
    schema: {
        function_declaration: {
            name: 'restaurant_api',
            description: 'Searches for restaurants and dining options in a specified location with cuisine and preference filters.',
            parameters: {
                type: 'OBJECT',
                properties: {
                    location: {
                        type: 'STRING',
                        description: 'City, neighborhood, or area name (e.g., "Manhattan", "Paris 1st Arrondissement")',
                    },
                    cuisine: {
                        type: 'STRING',
                        description: 'Cuisine type (e.g., "italian", "french", "asian", "american", "local")',
                    },
                    priceRange: {
                        type: 'STRING',
                        description: 'Price range: budget, moderate, upscale, fine-dining (optional)',
                    },
                    mealType: {
                        type: 'STRING',
                        description: 'Meal type: breakfast, lunch, dinner, brunch (optional)',
                    },
                    dietaryRestrictions: {
                        type: 'STRING',
                        description: 'Dietary needs (e.g., "vegetarian", "vegan", "gluten-free", "halal")',
                    },
                    atmosphere: {
                        type: 'STRING',
                        description: 'Desired atmosphere: casual, romantic, family-friendly, business (optional)',
                    },
                    maxResults: {
                        type: 'NUMBER',
                        description: 'Maximum number of results to return (default: 10)',
                    }
                },
                required: ['location'],
            },
        },
    },
    call: async (params) => {
        console.log(`🍽️ [RESTAURANT API] Searching restaurants with params:`, params);
        
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 900));
            
            const { 
                location, 
                cuisine, 
                priceRange = 'moderate', 
                mealType, 
                dietaryRestrictions, 
                atmosphere, 
                maxResults = 10 
            } = params;
            
            // Mock restaurant data by location and cuisine
            const cuisineTypes = ['italian', 'french', 'asian', 'american', 'mexican', 'indian', 'japanese', 'mediterranean', 'local'];
            const restaurantNames = {
                italian: ['Bella Vista', 'Nonna\'s Kitchen', 'Il Giardino', 'Pasta Palace', 'Roma Trattoria'],
                french: ['Le Petit Bistro', 'Chez Laurent', 'La Belle Époque', 'Café de Paris', 'Brasserie Moderne'],
                asian: ['Golden Dragon', 'Sakura Garden', 'Spice Route', 'Bamboo House', 'Lotus Blossom'],
                american: ['The Grill House', 'Liberty Diner', 'Smokehouse BBQ', 'Classic Burger Co', 'Main Street Café'],
                mexican: ['Casa Miguel', 'El Sombrero', 'Fiesta Cantina', 'Aztec Kitchen', 'Taco Libre'],
                indian: ['Taj Palace', 'Spice Garden', 'Mumbai Express', 'Curry House', 'Saffron Restaurant'],
                japanese: ['Sushi Zen', 'Tokyo Kitchen', 'Ramen Bar', 'Wasabi House', 'Kyoto Garden'],
                mediterranean: ['Olive Grove', 'Santorini Taverna', 'Cyprus Garden', 'Aegean Breeze', 'Mykonos Grill'],
                local: ['Local Flavors', 'Heritage Kitchen', 'Traditional Table', 'Regional Cuisine', 'Native Tastes']
            };
            
            // Price ranges
            const priceRanges = {
                budget: { symbol: '$', min: 10, max: 25 },
                moderate: { symbol: '$$', min: 25, max: 50 },
                upscale: { symbol: '$$$', min: 50, max: 100 },
                'fine-dining': { symbol: '$$$$', min: 100, max: 200 }
            };
            
            const restaurants = [];
            const selectedCuisines = cuisine ? [cuisine.toLowerCase()] : cuisineTypes.slice(0, 5);
            
            for (let i = 0; i < maxResults; i++) {
                const selectedCuisine = selectedCuisines[Math.floor(Math.random() * selectedCuisines.length)];
                const names = restaurantNames[selectedCuisine] || restaurantNames.local;
                const name = names[Math.floor(Math.random() * names.length)];
                
                const priceInfo = priceRanges[priceRange];
                const avgPrice = Math.floor(Math.random() * (priceInfo.max - priceInfo.min) + priceInfo.min);
                
                // Generate rating and reviews
                const rating = (3.5 + Math.random() * 1.5).toFixed(1);
                const reviewCount = Math.floor(Math.random() * 1000) + 50;
                
                // Generate opening hours based on meal type
                let openingHours = '11:00 AM - 10:00 PM';
                if (mealType === 'breakfast') openingHours = '7:00 AM - 11:00 AM';
                else if (mealType === 'lunch') openingHours = '11:00 AM - 3:00 PM';
                else if (mealType === 'dinner') openingHours = '5:00 PM - 11:00 PM';
                else if (mealType === 'brunch') openingHours = '9:00 AM - 3:00 PM';
                
                // Generate features based on atmosphere
                const features = ['Outdoor Seating', 'Reservations Accepted', 'Takeout Available'];
                if (atmosphere === 'romantic') features.push('Intimate Lighting', 'Wine Selection');
                if (atmosphere === 'family-friendly') features.push('Kids Menu', 'High Chairs');
                if (atmosphere === 'business') features.push('Private Dining', 'WiFi', 'Quiet Environment');
                
                // Add dietary options
                const dietaryOptions = [];
                if (dietaryRestrictions) {
                    const restrictions = dietaryRestrictions.toLowerCase().split(',').map(r => r.trim());
                    restrictions.forEach(restriction => {
                        if (restriction === 'vegetarian') dietaryOptions.push('Vegetarian Options');
                        if (restriction === 'vegan') dietaryOptions.push('Vegan Menu');
                        if (restriction === 'gluten-free') dietaryOptions.push('Gluten-Free Options');
                        if (restriction === 'halal') dietaryOptions.push('Halal Certified');
                    });
                }
                
                restaurants.push({
                    restaurantId: `REST${Math.floor(Math.random() * 90000) + 10000}`,
                    name: `${name} ${location}`,
                    cuisine: selectedCuisine.charAt(0).toUpperCase() + selectedCuisine.slice(1),
                    priceRange: priceInfo.symbol,
                    averagePrice: avgPrice,
                    rating: parseFloat(rating),
                    reviewCount,
                    location: `${Math.floor(Math.random() * 999) + 1} ${name.split(' ')[0]} Street, ${location}`,
                    phone: `+1 (555) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
                    openingHours,
                    features: features.slice(0, Math.floor(Math.random() * 3) + 2),
                    dietaryOptions,
                    atmosphere: atmosphere || ['Casual', 'Cozy', 'Modern', 'Traditional'][Math.floor(Math.random() * 4)],
                    reservationRequired: priceRange === 'upscale' || priceRange === 'fine-dining',
                    deliveryAvailable: priceRange === 'budget' || priceRange === 'moderate',
                    specialties: [
                        `Signature ${selectedCuisine} dishes`,
                        `Chef's special`,
                        `Traditional ${selectedCuisine} cuisine`
                    ],
                    distance: `${(Math.random() * 2 + 0.1).toFixed(1)} km from center`,
                    estimatedWaitTime: `${Math.floor(Math.random() * 30) + 10} minutes`,
                    dressCode: priceRange === 'fine-dining' ? 'Smart casual' : 'Casual',
                    parkingAvailable: Math.random() > 0.5,
                    website: `https://www.${name.toLowerCase().replace(/\s+/g, '')}.com`,
                    menuHighlights: [
                        `Popular ${selectedCuisine} appetizer`,
                        `House specialty main course`,
                        `Traditional dessert`
                    ]
                });
            }
            
            // Sort by rating
            restaurants.sort((a, b) => b.rating - a.rating);
            
            // Group by meal times if requested
            const mealRecommendations = mealType ? {
                [mealType]: restaurants.slice(0, 5)
            } : {
                breakfast: restaurants.filter(r => r.openingHours.includes('7:00 AM') || r.openingHours.includes('8:00 AM')).slice(0, 3),
                lunch: restaurants.filter(r => r.openingHours.includes('11:00 AM') || r.openingHours.includes('12:00 PM')).slice(0, 3),
                dinner: restaurants.filter(r => r.openingHours.includes('5:00 PM') || r.openingHours.includes('6:00 PM')).slice(0, 4)
            };
            
            const result = {
                searchCriteria: {
                    location,
                    cuisine,
                    priceRange,
                    mealType,
                    dietaryRestrictions,
                    atmosphere,
                    maxResults
                },
                restaurants: restaurants.slice(0, maxResults),
                mealRecommendations,
                totalResults: restaurants.length,
                averagePrice: Math.round(restaurants.reduce((sum, r) => sum + r.averagePrice, 0) / restaurants.length),
                searchTimestamp: new Date().toISOString(),
                tips: {
                    reservations: 'Book in advance for popular restaurants',
                    timing: 'Lunch is typically less crowded than dinner',
                    local: 'Ask locals for hidden gem recommendations'
                }
            };
            
            console.log(`🍽️ [RESTAURANT API] Found ${result.totalResults} restaurants`);
            return JSON.stringify(result, null, 2);
            
        } catch (error) {
            console.error(`🍽️ [RESTAURANT API] Error during restaurant search:`, error);
            return `Restaurant search error: ${error.message}`;
        }
    },
};
