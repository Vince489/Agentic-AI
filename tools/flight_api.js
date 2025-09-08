// flight_api.js - Mock Flight Search Tool
export const flightSearchTool = {
    name: 'flight_api',
    description: 'Searches for flights between origin and destination with specified dates and preferences.',
    schema: {
        function_declaration: {
            name: 'flight_api',
            description: 'Searches for flights between origin and destination with specified dates and preferences.',
            parameters: {
                type: 'OBJECT',
                properties: {
                    origin: {
                        type: 'STRING',
                        description: 'Origin airport code or city name (e.g., "LAX", "Los Angeles")',
                    },
                    destination: {
                        type: 'STRING',
                        description: 'Destination airport code or city name (e.g., "JFK", "New York")',
                    },
                    departureDate: {
                        type: 'STRING',
                        description: 'Departure date in YYYY-MM-DD format',
                    },
                    returnDate: {
                        type: 'STRING',
                        description: 'Return date in YYYY-MM-DD format (optional for one-way)',
                    },
                    passengers: {
                        type: 'NUMBER',
                        description: 'Number of passengers (default: 1)',
                    },
                    budget: {
                        type: 'NUMBER',
                        description: 'Maximum budget per person in USD (optional)',
                    },
                    class: {
                        type: 'STRING',
                        description: 'Flight class preference: economy, business, first (default: economy)',
                    }
                },
                required: ['origin', 'destination', 'departureDate'],
            },
        },
    },
    call: async (params) => {
        console.log(`✈️ [FLIGHT API] Searching flights with params:`, params);
        
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const { origin, destination, departureDate, returnDate, passengers = 1, budget, class: flightClass = 'economy' } = params;
            
            // Mock flight data with realistic variations
            const airlines = ['American Airlines', 'Delta', 'United', 'Southwest', 'JetBlue', 'Alaska Airlines'];
            const aircraftTypes = ['Boeing 737', 'Airbus A320', 'Boeing 777', 'Airbus A330'];
            
            // Generate mock flights
            const outboundFlights = [];
            const returnFlights = [];
            
            // Create 3-5 outbound flight options
            for (let i = 0; i < Math.floor(Math.random() * 3) + 3; i++) {
                const airline = airlines[Math.floor(Math.random() * airlines.length)];
                const aircraft = aircraftTypes[Math.floor(Math.random() * aircraftTypes.length)];
                const basePrice = flightClass === 'economy' ? 200 + Math.random() * 400 : 
                                 flightClass === 'business' ? 800 + Math.random() * 1200 : 
                                 2000 + Math.random() * 2000;
                
                const departureTime = `${String(6 + Math.floor(Math.random() * 16)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;
                const duration = 2 + Math.random() * 8; // 2-10 hours
                const arrivalHour = (parseInt(departureTime.split(':')[0]) + Math.floor(duration)) % 24;
                const arrivalTime = `${String(arrivalHour).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;
                
                outboundFlights.push({
                    flightNumber: `${airline.split(' ')[0].substring(0, 2).toUpperCase()}${Math.floor(Math.random() * 9000) + 1000}`,
                    airline,
                    aircraft,
                    origin,
                    destination,
                    departureDate,
                    departureTime,
                    arrivalTime,
                    duration: `${Math.floor(duration)}h ${Math.floor((duration % 1) * 60)}m`,
                    price: Math.round(basePrice * passengers),
                    pricePerPerson: Math.round(basePrice),
                    class: flightClass,
                    stops: Math.random() > 0.7 ? 1 : 0,
                    baggage: flightClass === 'economy' ? '1 carry-on included' : 'All baggage included',
                    cancellation: flightClass === 'economy' ? 'Non-refundable' : 'Refundable'
                });
            }
            
            // Create return flights if return date provided
            if (returnDate) {
                for (let i = 0; i < Math.floor(Math.random() * 3) + 3; i++) {
                    const airline = airlines[Math.floor(Math.random() * airlines.length)];
                    const aircraft = aircraftTypes[Math.floor(Math.random() * aircraftTypes.length)];
                    const basePrice = flightClass === 'economy' ? 200 + Math.random() * 400 : 
                                     flightClass === 'business' ? 800 + Math.random() * 1200 : 
                                     2000 + Math.random() * 2000;
                    
                    const departureTime = `${String(6 + Math.floor(Math.random() * 16)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;
                    const duration = 2 + Math.random() * 8;
                    const arrivalHour = (parseInt(departureTime.split(':')[0]) + Math.floor(duration)) % 24;
                    const arrivalTime = `${String(arrivalHour).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;
                    
                    returnFlights.push({
                        flightNumber: `${airline.split(' ')[0].substring(0, 2).toUpperCase()}${Math.floor(Math.random() * 9000) + 1000}`,
                        airline,
                        aircraft,
                        origin: destination,
                        destination: origin,
                        departureDate: returnDate,
                        departureTime,
                        arrivalTime,
                        duration: `${Math.floor(duration)}h ${Math.floor((duration % 1) * 60)}m`,
                        price: Math.round(basePrice * passengers),
                        pricePerPerson: Math.round(basePrice),
                        class: flightClass,
                        stops: Math.random() > 0.7 ? 1 : 0,
                        baggage: flightClass === 'economy' ? '1 carry-on included' : 'All baggage included',
                        cancellation: flightClass === 'economy' ? 'Non-refundable' : 'Refundable'
                    });
                }
            }
            
            // Filter by budget if provided
            const filteredOutbound = budget ? outboundFlights.filter(f => f.pricePerPerson <= budget) : outboundFlights;
            const filteredReturn = budget ? returnFlights.filter(f => f.pricePerPerson <= budget) : returnFlights;
            
            // Sort by price
            filteredOutbound.sort((a, b) => a.pricePerPerson - b.pricePerPerson);
            filteredReturn.sort((a, b) => a.pricePerPerson - b.pricePerPerson);
            
            const result = {
                searchCriteria: {
                    origin,
                    destination,
                    departureDate,
                    returnDate,
                    passengers,
                    class: flightClass,
                    budget
                },
                outboundFlights: filteredOutbound,
                returnFlights: filteredReturn,
                totalResults: filteredOutbound.length + filteredReturn.length,
                searchTimestamp: new Date().toISOString()
            };
            
            console.log(`✈️ [FLIGHT API] Found ${result.totalResults} flight options`);
            return JSON.stringify(result, null, 2);
            
        } catch (error) {
            console.error(`✈️ [FLIGHT API] Error during flight search:`, error);
            return `Flight search error: ${error.message}`;
        }
    },
};
