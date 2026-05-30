import { Leaf, Cpu, Globe, Users, Droplets, BookOpen, Lightbulb, Briefcase, HeartHandshake } from "lucide-react";

export const pillars = [
  {
    id: "agriculture",
    title: "Agriculture",
    description: "Promoting modernized farming, sustainable practices, and food security in our communities.",
    extendedDescription: "We equip the youth with modern agricultural techniques, emphasizing organic farming, hydroponics, and data-driven crop management to ensure long-term food security and resilient farming communities.",
    image: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=1000&auto=format&fit=crop",
    sampleProjects: ["Barangay Community Gardens", "Organic Fertilizer Production", "Seed Bank Initiative"],
    upcomingEvents: [
      { title: "Hydroponics Workshop", date: "May 15, 2026", description: "Learn how to build and maintain a soil-less urban farm." },
      { title: "Seed Distribution Drive", date: "June 2, 2026", description: "Free distribution of high-yield vegetable seeds for community gardens." }
    ],
    icon: Leaf,
  },
  {
    id: "stem",
    title: "STEM & Innovation",
    description: "Integrating modern science, technology, engineering, and math into everyday problem solving.",
    extendedDescription: "By introducing robotics, IoT, and basic coding, we encourage the youth to develop innovative solutions to local challenges, preparing them for a highly digital future.",
    image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1000&auto=format&fit=crop",
    sampleProjects: ["Drone Mapping for Agriculture", "Smart Irrigation Systems", "Youth Coding Camps"],
    upcomingEvents: [
      { title: "Robotics Bootcamp", date: "May 20, 2026", description: "Introduction to building and programming basic Arduino robots." },
      { title: "Local Hackathon", date: "July 15, 2026", description: "Create tech solutions for agricultural challenges." }
    ],
    icon: Cpu,
  },
  {
    id: "environment",
    title: "Environment",
    description: "Promoting sustainable practices and climate change resilience in our communities.",
    extendedDescription: "We advocate for environmental stewardship through massive reforestation efforts, waste management seminars, and climate change awareness campaigns to protect our natural resources.",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1000&auto=format&fit=crop",
    sampleProjects: ["Annual Tree Planting Drive", "River Clean-up Ops", "Upcycling Workshops"],
    upcomingEvents: [
      { title: "River Clean-up Ops", date: "June 5, 2026", description: "Join us for our monthly river clean-up drive." },
      { title: "Waste Management Seminar", date: "June 12, 2026", description: "Learn proper segregation and composting." }
    ],
    icon: Globe,
  },
  {
    id: "culture",
    title: "Culture & Arts",
    description: "Preserving local heritage and fostering creativity among the youth.",
    extendedDescription: "We celebrate and preserve indigenous culture and local arts, providing platforms for young artists and performers to showcase their talents and keep traditions alive.",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1000&auto=format&fit=crop",
    sampleProjects: ["Traditional Dance Troupe", "Local Craft Exhibits", "Heritage Storytelling Sessions"],
    upcomingEvents: [
      { title: "Cultural Dance Workshop", date: "May 28, 2026", description: "Learn traditional Kalilangan dances." },
      { title: "Local Craft Exhibit", date: "August 10, 2026", description: "Showcasing the artistic talents of 4-H youth." }
    ],
    icon: Users,
  },
  {
    id: "health",
    title: "Health & Wellness",
    description: "Ensuring the physical and mental well-being of our community members.",
    extendedDescription: "A holistic approach to well-being, focusing on proper nutrition, physical fitness, hygiene, and mental health awareness programs for the youth.",
    image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1000&auto=format&fit=crop",
    sampleProjects: ["Community Sports Fests", "Mental Health Seminars", "Nutrition and Feeding Programs"],
    upcomingEvents: [
      { title: "Community Feeding Program", date: "May 10, 2026", description: "Volunteer to distribute nutritious meals in Barangay San Vicente." },
      { title: "Mental Health First Aid", date: "June 25, 2026", description: "Seminar for youth leaders on mental health awareness." }
    ],
    icon: Droplets,
  },
  {
    id: "education",
    title: "Education",
    description: "Providing access to continuous learning and technical skills development.",
    extendedDescription: "We bridge the educational gap by organizing supplementary tutoring, scholarship assistance, and vocational training to ensure no youth is left behind.",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1000&auto=format&fit=crop",
    sampleProjects: ["Peer Tutoring Network", "Library Resource Drives", "Technical-Vocational Certifications"],
    upcomingEvents: [
      { title: "Book Donation Drive", date: "May 5, 2026", description: "Collecting educational books for the municipal library." },
      { title: "Peer Tutoring Registration", date: "July 1, 2026", description: "Sign up to be a volunteer tutor for the upcoming school year." }
    ],
    icon: BookOpen,
  },
  {
    id: "leadership",
    title: "Leadership",
    description: "Empowering the next generation of leaders to guide their communities.",
    extendedDescription: "We mold the character of our members through rigorous leadership bootcamps, instilling integrity, active citizenship, and the 4-H core values.",
    image: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=1000&auto=format&fit=crop",
    sampleProjects: ["Youth Leadership Summits", "Parliamentary Procedure Training", "Mentorship Program"],
    upcomingEvents: [
      { title: "Youth Leadership Summit", date: "August 15, 2026", description: "Annual gathering of all 4-H officers across Kalilangan." },
      { title: "Parliamentary Rules Masterclass", date: "September 5, 2026", description: "Training for chapter presidents and secretaries." }
    ],
    icon: Lightbulb,
  },
  {
    id: "livelihood",
    title: "Livelihood",
    description: "Creating sustainable economic opportunities for youth and farmers.",
    extendedDescription: "We foster entrepreneurship by providing start-up capital, business management training, and direct market access for youth-led micro-enterprises.",
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32b7?q=80&w=1000&auto=format&fit=crop",
    sampleProjects: ["Food Processing Cooperatives", "Handicraft Marketing", "Youth Agribusiness Loans"],
    upcomingEvents: [
      { title: "Agribusiness Pitch Competition", date: "July 20, 2026", description: "Pitch your business idea and win starting capital." },
      { title: "Food Processing Workshop", date: "August 2, 2026", description: "Learn how to make fruit jams and preserves for extra income." }
    ],
    icon: Briefcase,
  },
  {
    id: "community-service",
    title: "Community Service",
    description: "Fostering the spirit of volunteerism and civic engagement to help those in need.",
    extendedDescription: "We believe in giving back to the community through organized volunteer initiatives, outreach programs, and emergency relief operations, encouraging the youth to actively participate in building a more caring society.",
    image: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?q=80&w=1000&auto=format&fit=crop",
    sampleProjects: ["Barangay Feeding Programs", "Disaster Relief Operations", "Back-to-School Distribution"],
    upcomingEvents: [
      { title: "Mega Feeding Program", date: "June 30, 2026", description: "A municipal-wide feeding program targeting undernourished children." },
      { title: "Volunteer Orientation", date: "May 25, 2026", description: "Briefing and registration for new community service volunteers." }
    ],
    icon: HeartHandshake,
  }
];

export const ledgerData = [
  { id: 1, date: "2024-03-15", description: "Agriculture Equipment Grant", category: "Grants", amount: 150000, status: "Cleared" },
  { id: 2, date: "2024-03-10", description: "Tree Planting Initiative", category: "Environment", amount: -25000, status: "Spent" },
  { id: 3, date: "2024-02-28", description: "Local Government Subsidy", category: "LGU Support", amount: 50000, status: "Cleared" },
  { id: 4, date: "2024-02-20", description: "Youth Leadership Seminar", category: "Training", amount: -15000, status: "Spent" },
  { id: 5, date: "2024-02-05", description: "Private Donation (TechCorp)", category: "Donation", amount: 30000, status: "Cleared" },
];

export const partners = [
  { id: 1, name: "AgriTech Solutions", logo: "AT" },
  { id: 2, name: "Eco Builders Inc.", logo: "EB" },
  { id: 3, name: "National Farmers Union", logo: "NFU" },
  { id: 4, name: "Future Leaders Org", logo: "FLO" },
  { id: 5, name: "Tech For Good", logo: "TFG" },
];

export const councilMembers = [
  { id: 1, name: "Maria Santos", role: "Federation President", image: "https://i.pravatar.cc/150?u=maria" },
  { id: 2, name: "Juan Dela Cruz", role: "Vice President", image: "https://i.pravatar.cc/150?u=juan" },
  { id: 3, name: "Ana Reyes", role: "Secretary", image: "https://i.pravatar.cc/150?u=ana" },
  { id: 4, name: "Pedro Bautista", role: "Treasurer", image: "https://i.pravatar.cc/150?u=pedro" },
  { id: 5, name: "Lucas Gomez", role: "Auditor", image: "https://i.pravatar.cc/150?u=lucas" },
  { id: 6, name: "Carla Lim", role: "P.I.O.", image: "https://i.pravatar.cc/150?u=carla" },
  { id: 7, name: "David Roxas", role: "Sgt. at Arms", image: "https://i.pravatar.cc/150?u=david" },
  { id: 8, name: "Elena Cruz", role: "Council Member", image: "https://i.pravatar.cc/150?u=elena" },
];

export const newsArticles = [
  {
    id: 1,
    title: "4-H Federation Launches Agriculture & STEM Programs in 15 Barangays",
    excerpt: "The new initiative aims to integrate modern technology such as drone mapping and IoT sensors into traditional farming practices, empowering local youth.",
    date: "2024-03-20",
    category: "Press Release",
    image: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=1000&auto=format&fit=crop"
  },
  {
    id: 2,
    title: "Youth Council Secures TechCorp Innovation Grant",
    excerpt: "TechCorp has awarded a ₱150,000 grant to support the Federation's digital literacy campaign across remote municipalities.",
    date: "2024-03-15",
    category: "Milestone",
    image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1000&auto=format&fit=crop"
  },
  {
    id: 3,
    title: "Annual Tree Planting Drive Exceeds Target",
    excerpt: "Over 5,000 seedlings were planted during the localized environmental advocacy drive, doubling last year's records.",
    date: "2024-02-28",
    category: "Event",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1000&auto=format&fit=crop"
  }
];

export const merchandise = [
  {
    id: 1,
    name: "4-H Official T-Shirt",
    price: 350,
    category: "Apparel",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000&auto=format&fit=crop",
    description: "High-quality cotton blend t-shirt featuring the 4-H emblem.",
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    rating: 4.8,
    reviews: [
      { user: "Jane D.", comment: "Very comfortable and fits perfectly!" },
      { user: "Mark S.", comment: "Great material, love wearing it to chapter meetings." }
    ],
    details: "Made from 100% organic cotton. Durable print that won't fade after multiple washes."
  },
  {
    id: 2,
    name: "Classic Green Cap",
    price: 200,
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=1000&auto=format&fit=crop",
    description: "Adjustable baseball cap with embroidered 4-H Kalilangan logo.",
    sizes: ["One Size"],
    rating: 4.5,
    reviews: [
      { user: "Paul R.", comment: "Excellent quality embroidery." }
    ],
    details: "Structured 6-panel profile. Adjustable brass buckle closure. 100% cotton twill."
  },
  {
    id: 3,
    name: "Waterproof Sticker Pack",
    price: 50,
    category: "Souvenirs",
    image: "https://images.unsplash.com/photo-1589810635657-22ce2ebbafea?q=80&w=1000&auto=format&fit=crop",
    description: "A set of 5 die-cut stickers featuring various 4-H pillars and quotes.",
    sizes: [],
    rating: 4.9,
    reviews: [
      { user: "Anna K.", comment: "They look so good on my laptop and water bottle!" }
    ],
    details: "Vinyl stickers coated with a protective laminate that makes them durable, waterproof and scratch-resistant."
  },
  {
    id: 4,
    name: "Eco-friendly Tote Bag",
    price: 150,
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1597484661643-2f5fef640ddd?q=80&w=1000&auto=format&fit=crop",
    description: "Reusable canvas tote bag, perfect for groceries or everyday use.",
    sizes: ["Standard"],
    rating: 4.7,
    reviews: [
      { user: "Elena M.", comment: "Spacious and strong!" }
    ],
    details: "12 oz unbleached natural canvas. Reinforced shoulder straps. Printed with eco-friendly ink."
  },
  {
    id: 5,
    name: "Insulated Tumbler",
    price: 450,
    category: "Drinkware",
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=1000&auto=format&fit=crop",
    description: "Keep your drinks hot or cold for hours with this stylish tumbler.",
    sizes: ["500ml", "750ml"],
    rating: 4.9,
    reviews: [
      { user: "Chris L.", comment: "Keeps water ice cold all day." }
    ],
    details: "Double-wall vacuum insulation. Made with food-grade 18/8 stainless steel."
  },
  {
    id: 6,
    name: "Lanyard & ID Lace",
    price: 80,
    category: "Souvenirs",
    image: "https://images.unsplash.com/photo-1628151016650-7164ff896d9f?q=80&w=1000&auto=format&fit=crop",
    description: "Official 4-H neck lanyard for your IDs and keys.",
    sizes: [],
    rating: 4.6,
    reviews: [],
    details: "Sublimation printed lanyard with breakaway safety release and sturdy metal clip."
  }
];

export const barangayChapters = [
  { id: 1, name: "Ninoy Aquino", president: "John Doe", members: 45 },
  { id: 2, name: "Macaopao", president: "Jane Smith", members: 32 },
  { id: 3, name: "Pamotolon", president: "Mark Johnson", members: 28 },
  { id: 4, name: "Central Poblacion", president: "Mary Williams", members: 60 },
  { id: 5, name: "Public Market", president: "James Brown", members: 35 },
  { id: 6, name: "West Poblacion", president: "Patricia Jones", members: 40 },
  { id: 7, name: "Kibaning", president: "Michael Garcia", members: 22 },
  { id: 8, name: "Malinao", president: "Linda Martinez", members: 18 },
  { id: 9, name: "Lampanusan", president: "Robert Rodriguez", members: 30 }
];

export const schoolChapters = [
  { id: 1, name: "Kalilangan National High School", coordinator: "Mr. Ramos", members: 120 },
  { id: 2, name: "Bukidnon State University - Kalilangan", coordinator: "Dr. Fernandez", members: 200 },
  { id: 3, name: "San Vicente National High School", coordinator: "Mrs. Villanueva", members: 85 },
  { id: 4, name: "Macaopao National High School", coordinator: "Mr. Cruz", members: 65 }
];

export const globalUpcomingEvents = [
  {
    id: 1,
    title: "Mega Feeding Program",
    date: "June 30, 2026",
    location: "Barangay Poblacion",
    category: "Community Service",
    description: "A municipal-wide feeding program targeting undernourished children."
  },
  {
    id: 2,
    title: "Youth Leadership Summit",
    date: "August 15, 2026",
    location: "Kalilangan Gymnasium",
    category: "Leadership",
    description: "Annual gathering of all 4-H officers across Kalilangan featuring workshops and strategic planning."
  },
  {
    id: 3,
    title: "Kalilangan Youth Agribusiness Pitch",
    date: "July 20, 2026",
    location: "BukSU - Kalilangan Campus",
    category: "Livelihood",
    description: "Pitch your business idea and win starting capital for your micro-enterprise."
  },
  {
    id: 4,
    title: "River Clean-up Ops",
    date: "June 5, 2026",
    location: "Kalilangan Riverways",
    category: "Environment",
    description: "Join us for our monthly river clean-up drive. Please bring your own reusable water bottles."
  }
];

export const projectsAndPrograms = [
  {
    id: 1,
    title: "Community Seed Bank Establishment",
    status: "Upcoming",
    category: "Agriculture",
    description: "Setting up a local seed bank to preserve indigenous crop varieties and ensure seed availability for local farmers.",
    date: "September 2026",
    location: "Barangay Ninoy Aquino"
  },
  {
    id: 2,
    title: "School Tech Bootcamp",
    status: "Upcoming",
    category: "STEM",
    description: "A 3-day bootcamp introducing high school students to basic robotics and programming.",
    date: "October 2026",
    location: "Kalilangan National High School"
  },
  {
    id: 3,
    title: "Hydroponics Community Demo Farm",
    status: "Ongoing",
    category: "Agriculture",
    description: "Maintenance and scale-up of our smart urban farming initiative.",
    date: "April - November 2026",
    location: "BukSU - Kalilangan Campus"
  },
  {
    id: 4,
    title: "Weekly Feeding Program",
    status: "Ongoing",
    category: "Community Service",
    description: "Providing nutritious meals to undernourished children in targeted areas.",
    date: "Every Saturday",
    location: "Various Barangays"
  },
  {
    id: 5,
    title: "Youth Agribusiness Loans Batch 1",
    status: "Done",
    category: "Livelihood",
    description: "Disbursed micro-loans to 15 youth-led agribusinesses and provided mentorship.",
    date: "January - March 2026",
    location: "Kalilangan LGU"
  },
  {
    id: 6,
    title: "Mental Health First Aid Seminar",
    status: "Done",
    category: "Health & Wellness",
    description: "Trained 50 youth leaders in basic mental health first aid.",
    date: "February 2026",
    location: "Central Poblacion"
  }
];
