export interface Event {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  description: string;
}

const ALL_EVENTS: Event[] = [
  {
    id: "1",
    name: "Summer Music Festival 2026",
    imageUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=300&fit=crop",
    price: 89.99,
    description: "Three days of live music performances featuring top artists from around the world.",
  },
  {
    id: "2",
    name: "Tech Conference 2026",
    imageUrl: "https://blog.inevent.com/wp-content/uploads/2024/01/Women-in-tech_Conferences_The_Best_Events_for_2024-1180x570.webp",
    price: 199.99,
    description: "Connect with industry leaders and discover the latest innovations in technology.",
  },
  {
    id: "3",
    name: "Comedy Night Live",
    imageUrl: "https://files.seatengine.com/talent/headshots/photos/89343/full/data",
    price: 45.00,
    description: "Laugh out loud with hilarious stand-up comedians performing live on stage.",
  },
  {
    id: "4",
    name: "Jazz Evening Concert",
    imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop",
    price: 65.00,
    description: "Experience smooth jazz melodies from internationally acclaimed musicians.",
  },
  {
    id: "5",
    name: "Art Exhibition Opening",
    imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRf8_4N7ox3IHnKBX_oqOffvWg7OV7eOJopaQ&ss",
    price: 25.00,
    description: "Explore contemporary art from emerging and established artists worldwide.",
  },
  {
    id: "6",
    name: "Marathon Race 2026",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/BSK_CSOB_MARATON046_%2833791445325%29.jpg/1280px-BSK_CSOB_MARATON046_%2833791445325%29.jpg",
    price: 75.00,
    description: "Join thousands of runners for a challenging 42km marathon through the city.",
  },
  {
    id: "7",
    name: "Food & Wine Festival",
    imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2zH7YI9UNdeeIKYaFlKNRVTy7Gpb8awtOOA&s",
    price: 120.00,
    description: "Taste exquisite cuisine and premium wines from renowned chefs and vineyards.",
  },
  {
    id: "8",
    name: "Product Launch Event",
    imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=300&fit=crop",
    price: 0.00,
    description: "Be first to see the unveiling of the latest revolutionary product innovation.",
  },
  {
    id: "9",
    name: "Yoga Wellness Retreat",
    imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=300&fit=crop",
    price: 299.99,
    description: "Rejuvenate your mind and body with yoga, meditation, and wellness workshops.",
  },
  {
    id: "10",
    name: "Photography Workshop",
    imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTAfojXdIt9di92Na5fViWmvrzr9egH713Arg&s",
    price: 85.00,
    description: "Learn photography techniques from professional photographers in an interactive setting.",
  },
  {
    id: "11",
    name: "Dance Battle Championship",
    imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQprB-Y2uTDAh592RUOPMao5Z_1SiPb62SrlA&s",
    price: 50.00,
    description: "Watch talented dancers compete in this thrilling battle of rhythms and moves.",
  },
  {
    id: "12",
    name: "Gaming Tournament Finals",
    imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS2H4-zYPQHGc6l43tWu5EyUXtn2DMtSPsCHA&s",
    price: 40.00,
    description: "Experience esports action as top gaming teams compete for the championship title.",
  },
  {
    id: "13",
    name: "Business Networking Summit",
    imageUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop",
    price: 149.99,
    description: "Network with entrepreneurs and business leaders to grow your professional network.",
  },
  {
    id: "14",
    name: "Film Festival Premiere",
    imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNNOkkUdFw39obV7kbVVxcm3Y4WwL-VF1d1A&s",
    price: 30.00,
    description: "Watch award-winning international films from independent and renowned directors.",
  },
  {
    id: "15",
    name: "Fashion Show 2024",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
    price: 95.00,
    description: "Witness stunning fashion collections from top designers on the runway.",
  },
];

const ITEMS_PER_PAGE = 12;

/**
 * Simulates API call to fetch events for a specific page
 * TODO: Replace with actual API call - e.g., fetch(`/api/events?page=${page}`)
 */
export const fetchEventsByPage = async (page: number): Promise<Event[]> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;

  return ALL_EVENTS.slice(startIndex, endIndex);
};

/**
 * Simulates API call to fetch total number of pages
 * TODO: Replace with actual API call - e.g., fetch(`/api/events/total-pages`)
 */
export const fetchTotalPages = async (): Promise<number> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  return Math.ceil(ALL_EVENTS.length / ITEMS_PER_PAGE);
};

/**
 * Simulates API call to fetch a single event by ID
 * TODO: Replace with actual API call - e.g., fetch(`/api/events/${id}`)
 */
export const fetchEventById = async (id: string): Promise<Event | null> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  return ALL_EVENTS.find((event) => event.id === id) || null;
};
