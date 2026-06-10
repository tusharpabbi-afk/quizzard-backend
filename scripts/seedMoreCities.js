/**
 * Hand-curated city trivia: Delhi, Kolkata, Hyderabad. Verifiable landmarks,
 * history, culture. Author-leveled.
 * Run: MONGO_URI="<atlas>" node scripts/seedMoreCities.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Question = require("../models/Question");
const { seedCategory } = require("./_seedHelper");

const DELHI = [
  { q: "The Red Fort, a UNESCO World Heritage Site, is located in which city?", correct: "Delhi", wrong: ["Agra", "Jaipur", "Lucknow"], level: "easy" },
  { q: "The towering Qutub Minar is located in which city?", correct: "Delhi", wrong: ["Hyderabad", "Agra", "Bhopal"], level: "easy" },
  { q: "India Gate, a war memorial arch, stands in which city?", correct: "Delhi", wrong: ["Mumbai", "Kolkata", "Amritsar"], level: "easy" },
  { q: "Which is India's main seat of Parliament and President's residence?", correct: "New Delhi", wrong: ["Mumbai", "Kolkata", "Nagpur"], level: "easy" },
  { q: "Delhi's main international airport is named after which leader?", correct: "Indira Gandhi", wrong: ["Jawaharlal Nehru", "Rajiv Gandhi", "Sardar Patel"], level: "easy" },
  { q: "On the banks of which river is Delhi situated?", correct: "Yamuna", wrong: ["Ganga", "Sutlej", "Gomti"], level: "medium" },
  { q: "The lotus-shaped Bahá'í House of Worship is in which city?", correct: "Delhi", wrong: ["Jaipur", "Chandigarh", "Pune"], level: "medium" },
  { q: "Humayun's Tomb, an early Mughal mausoleum, is located in which city?", correct: "Delhi", wrong: ["Agra", "Fatehpur Sikri", "Aurangabad"], level: "medium" },
  { q: "The bustling old market Chandni Chowk is in which city?", correct: "Delhi", wrong: ["Lucknow", "Jaipur", "Varanasi"], level: "medium" },
  { q: "Connaught Place, a famous circular commercial hub, is in which city?", correct: "Delhi", wrong: ["Mumbai", "Bengaluru", "Kolkata"], level: "medium" },
  { q: "The Akshardham Temple complex on the Yamuna banks is in which city?", correct: "Delhi", wrong: ["Gandhinagar", "Jaipur", "Lucknow"], level: "medium" },
  { q: "Jama Masjid, one of India's largest mosques, is located in which city?", correct: "Delhi", wrong: ["Hyderabad", "Lucknow", "Bhopal"], level: "medium" },
  { q: "Which Mughal emperor built the Red Fort in Delhi?", correct: "Shah Jahan", wrong: ["Akbar", "Aurangzeb", "Humayun"], level: "hard" },
  { q: "Delhi officially became the capital of British India in which year?", correct: "1911", wrong: ["1858", "1947", "1900"], level: "hard" },
  { q: "The 16th-century 'Purana Qila' (Old Fort) is located in which city?", correct: "Delhi", wrong: ["Agra", "Gwalior", "Jaipur"], level: "hard" },
  { q: "As an administrative unit, Delhi is officially designated as what?", correct: "National Capital Territory", wrong: ["A full state", "A municipal corporation only", "A district"], level: "hard" },
];

const KOLKATA = [
  { q: "Kolkata is the capital of which Indian state?", correct: "West Bengal", wrong: ["Bihar", "Odisha", "Jharkhand"], level: "easy" },
  { q: "By what name was Kolkata formerly known?", correct: "Calcutta", wrong: ["Cuttack", "Dacca", "Cawnpore"], level: "easy" },
  { q: "The grand white-marble Victoria Memorial is located in which city?", correct: "Kolkata", wrong: ["Mumbai", "Chennai", "Delhi"], level: "easy" },
  { q: "Which city is affectionately known as the 'City of Joy'?", correct: "Kolkata", wrong: ["Mumbai", "Jaipur", "Varanasi"], level: "medium" },
  { q: "The Howrah Bridge spans which river in Kolkata?", correct: "Hooghly", wrong: ["Ganga", "Damodar", "Yamuna"], level: "medium" },
  { q: "Which grand festival is the biggest celebration in Kolkata?", correct: "Durga Puja", wrong: ["Diwali", "Ganesh Chaturthi", "Onam"], level: "easy" },
  { q: "Nobel laureate poet Rabindranath Tagore hailed from which city?", correct: "Kolkata", wrong: ["Dhaka", "Patna", "Lucknow"], level: "medium" },
  { q: "Mother Teresa founded the Missionaries of Charity in which city?", correct: "Kolkata", wrong: ["Mumbai", "Chennai", "Goa"], level: "medium" },
  { q: "Park Street, famous for its restaurants and nightlife, is in which city?", correct: "Kolkata", wrong: ["Mumbai", "Bengaluru", "Pune"], level: "medium" },
  { q: "The beloved Bengali sweet 'rosogolla' is strongly associated with which city/region?", correct: "Kolkata (Bengal)", wrong: ["Lucknow", "Jaipur", "Hyderabad"], level: "easy" },
  { q: "Kolkata served as the capital of British India until which year?", correct: "1911", wrong: ["1857", "1947", "1935"], level: "hard" },
  { q: "Kolkata is the only Indian city that still operates a network of what?", correct: "Trams", wrong: ["Cable cars", "Monorail", "Ferries as main transit"], level: "hard" },
  { q: "India's first underground metro railway (opened 1984) was built in which city?", correct: "Kolkata", wrong: ["Delhi", "Mumbai", "Chennai"], level: "hard" },
  { q: "The Indian Museum, the oldest and largest museum in India, is in which city?", correct: "Kolkata", wrong: ["Delhi", "Mumbai", "Chennai"], level: "hard" },
];

const HYDERABAD = [
  { q: "Hyderabad is the capital of which Indian state?", correct: "Telangana", wrong: ["Andhra Pradesh", "Karnataka", "Maharashtra"], level: "easy" },
  { q: "The iconic four-arched monument 'Charminar' is located in which city?", correct: "Hyderabad", wrong: ["Bijapur", "Mysuru", "Bhopal"], level: "easy" },
  { q: "Which famous style of biryani is associated with Hyderabad?", correct: "Hyderabadi Biryani", wrong: ["Lucknowi Biryani", "Kolkata Biryani", "Malabar Biryani"], level: "easy" },
  { q: "Hyderabad is nicknamed the 'City of' what?", correct: "Pearls", wrong: ["Lakes", "Nawabs", "Joy"], level: "medium" },
  { q: "The historic Golconda Fort is located in which city?", correct: "Hyderabad", wrong: ["Bidar", "Warangal", "Gulbarga"], level: "medium" },
  { q: "Hyderabad was historically ruled by leaders holding which title?", correct: "Nizam", wrong: ["Nawab", "Peshwa", "Wodeyar"], level: "medium" },
  { q: "A giant monolithic statue in the middle of Hyderabad's Hussain Sagar lake depicts whom?", correct: "Gautam Buddha", wrong: ["Lord Shiva", "Mahatma Gandhi", "Sardar Patel"], level: "medium" },
  { q: "Hyderabad's modern IT and business district is popularly called what?", correct: "HITEC City", wrong: ["Cyber Valley", "Tech Park", "Silicon Town"], level: "medium" },
  { q: "Hyderabad and its neighbour Secunderabad are together known as the what?", correct: "Twin Cities", wrong: ["Sister Cities", "Dual Capitals", "Metro Pair"], level: "medium" },
  { q: "The richly stocked Salar Jung Museum is located in which city?", correct: "Hyderabad", wrong: ["Mysuru", "Chennai", "Pune"], level: "hard" },
  { q: "Ramoji Film City, recognised as the world's largest film studio complex, is near which city?", correct: "Hyderabad", wrong: ["Mumbai", "Chennai", "Bengaluru"], level: "hard" },
  { q: "The Birla Mandir overlooking Hyderabad is built primarily from what material?", correct: "White marble", wrong: ["Red sandstone", "Granite", "Limestone"], level: "hard" },
  { q: "The Nizam of Hyderabad in the early 20th century was reputed to be among the world's what?", correct: "Richest men", wrong: ["Tallest rulers", "Youngest kings", "Most travelled"], level: "hard" },
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await seedCategory(mongoose, Question, "Delhi", DELHI);
  await seedCategory(mongoose, Question, "Kolkata", KOLKATA);
  await seedCategory(mongoose, Question, "Hyderabad", HYDERABAD);
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
