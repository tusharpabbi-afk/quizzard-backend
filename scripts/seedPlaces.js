/**
 * Hand-curated place trivia: India (broad), Mumbai, Lucknow. Verifiable facts
 * (geography, history, culture, landmarks). Author-leveled.
 * Run: MONGO_URI="<atlas>" node scripts/seedPlaces.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Question = require("../models/Question");
const { seedCategory } = require("./_seedHelper");

const INDIA = [
  { q: "What is the capital of India?", correct: "New Delhi", wrong: ["Mumbai", "Kolkata", "Chennai"], level: "easy" },
  { q: "In which year did India gain independence?", correct: "1947", wrong: ["1945", "1950", "1942"], level: "easy" },
  { q: "On which date does India celebrate Independence Day?", correct: "15 August", wrong: ["26 January", "2 October", "1 January"], level: "easy" },
  { q: "On which date is India's Republic Day celebrated?", correct: "26 January", wrong: ["15 August", "2 October", "14 November"], level: "easy" },
  { q: "Who was the first Prime Minister of India?", correct: "Jawaharlal Nehru", wrong: ["Mahatma Gandhi", "Sardar Patel", "Dr. Rajendra Prasad"], level: "easy" },
  { q: "Who was the first President of India?", correct: "Dr. Rajendra Prasad", wrong: ["Jawaharlal Nehru", "S. Radhakrishnan", "Zakir Husain"], level: "medium" },
  { q: "Who is regarded as the 'Father of the Nation' in India?", correct: "Mahatma Gandhi", wrong: ["Jawaharlal Nehru", "Bhagat Singh", "Subhas Chandra Bose"], level: "easy" },
  { q: "What is the national animal of India?", correct: "Bengal Tiger", wrong: ["Lion", "Elephant", "Leopard"], level: "easy" },
  { q: "What is the national bird of India?", correct: "Indian Peacock", wrong: ["Eagle", "Parrot", "Kingfisher"], level: "easy" },
  { q: "What is the national flower of India?", correct: "Lotus", wrong: ["Rose", "Marigold", "Jasmine"], level: "easy" },
  { q: "What is the currency of India?", correct: "Indian Rupee", wrong: ["Taka", "Rupiah", "Dinar"], level: "easy" },
  { q: "The Taj Mahal is located in which city?", correct: "Agra", wrong: ["Delhi", "Jaipur", "Lucknow"], level: "easy" },
  { q: "Which Mughal emperor built the Taj Mahal?", correct: "Shah Jahan", wrong: ["Akbar", "Aurangzeb", "Babur"], level: "medium" },
  { q: "Which is the longest river in India?", correct: "Ganga", wrong: ["Yamuna", "Godavari", "Brahmaputra"], level: "medium" },
  { q: "How many states does India have?", correct: "28", wrong: ["29", "27", "30"], level: "medium" },
  { q: "Which is the largest Indian state by area?", correct: "Rajasthan", wrong: ["Madhya Pradesh", "Maharashtra", "Uttar Pradesh"], level: "medium" },
  { q: "Which is the most populous Indian state?", correct: "Uttar Pradesh", wrong: ["Maharashtra", "Bihar", "West Bengal"], level: "medium" },
  { q: "Who composed India's national anthem, 'Jana Gana Mana'?", correct: "Rabindranath Tagore", wrong: ["Bankim Chandra Chattopadhyay", "Sarojini Naidu", "Subramania Bharati"], level: "medium" },
  { q: "What is India's national song?", correct: "Vande Mataram", wrong: ["Jana Gana Mana", "Sare Jahan Se Achha", "Ae Watan"], level: "medium" },
  { q: "Which is the highest mountain peak located entirely within India?", correct: "Kanchenjunga", wrong: ["Mount Everest", "Nanda Devi", "K2"], level: "hard" },
  { q: "What is India's space research organisation called?", correct: "ISRO", wrong: ["NASA", "DRDO", "BARC"], level: "easy" },
  { q: "India's Chandrayaan missions are aimed at exploring which body?", correct: "The Moon", wrong: ["Mars", "Venus", "The Sun"], level: "easy" },
  { q: "India's Mangalyaan mission was sent to which planet?", correct: "Mars", wrong: ["Jupiter", "Venus", "Saturn"], level: "medium" },
  { q: "The Golden Temple is located in which city?", correct: "Amritsar", wrong: ["Delhi", "Patna", "Anandpur Sahib"], level: "easy" },
  { q: "Which city is known as the 'Pink City'?", correct: "Jaipur", wrong: ["Udaipur", "Jodhpur", "Jaisalmer"], level: "medium" },
  { q: "Which city is known as the 'City of Lakes'?", correct: "Udaipur", wrong: ["Bhopal", "Nainital", "Srinagar"], level: "medium" },
  { q: "Which Indian city is regarded as the country's financial capital?", correct: "Mumbai", wrong: ["New Delhi", "Bengaluru", "Kolkata"], level: "easy" },
  { q: "The largest desert in India is the what?", correct: "Thar Desert", wrong: ["Kutch Desert", "Deccan Desert", "Spiti Desert"], level: "medium" },
  { q: "The Sundarbans mangrove forest lies mainly in which Indian state?", correct: "West Bengal", wrong: ["Odisha", "Kerala", "Tamil Nadu"], level: "medium" },
  { q: "How many languages are listed in the Eighth Schedule of the Indian Constitution?", correct: "22", wrong: ["18", "28", "15"], level: "hard" },
  { q: "Who wrote 'Vande Mataram'?", correct: "Bankim Chandra Chattopadhyay", wrong: ["Rabindranath Tagore", "Muhammad Iqbal", "Sarojini Naidu"], level: "hard" },
  { q: "The Konark Sun Temple is located in which state?", correct: "Odisha", wrong: ["West Bengal", "Tamil Nadu", "Bihar"], level: "hard" },
  { q: "What is the capital of the state of Kerala?", correct: "Thiruvananthapuram", wrong: ["Kochi", "Kozhikode", "Thrissur"], level: "medium" },
  { q: "India's first satellite, launched in 1975, was named what?", correct: "Aryabhata", wrong: ["Bhaskara", "Rohini", "INSAT"], level: "hard" },
  { q: "Which mountain range runs along India's western coast?", correct: "Western Ghats", wrong: ["Aravalli Range", "Eastern Ghats", "Vindhya Range"], level: "medium" },
  { q: "Which sea lies to the west of India?", correct: "Arabian Sea", wrong: ["Bay of Bengal", "Andaman Sea", "Red Sea"], level: "easy" },
  { q: "Which bay lies to the east of India?", correct: "Bay of Bengal", wrong: ["Arabian Sea", "South China Sea", "Persian Gulf"], level: "easy" },
  // More
  { q: "What is the capital of West Bengal?", correct: "Kolkata", wrong: ["Patna", "Bhubaneswar", "Ranchi"], level: "easy" },
  { q: "What is the national fruit of India?", correct: "Mango", wrong: ["Banana", "Apple", "Jackfruit"], level: "easy" },
  { q: "Which mountain range forms India's northern frontier?", correct: "Himalayas", wrong: ["Aravallis", "Western Ghats", "Vindhyas"], level: "easy" },
  { q: "The Rajya Sabha is which house of the Indian Parliament?", correct: "The Upper House", wrong: ["The Lower House", "The Cabinet", "The Judiciary"], level: "medium" },
  { q: "The Lok Sabha is which house of the Indian Parliament?", correct: "The Lower House", wrong: ["The Upper House", "The Senate", "The Council"], level: "medium" },
  { q: "Who is regarded as the chief architect of the Indian Constitution?", correct: "B. R. Ambedkar", wrong: ["Jawaharlal Nehru", "Rajendra Prasad", "Sardar Patel"], level: "medium" },
  { q: "On which date did the Constitution of India come into effect?", correct: "26 January 1950", wrong: ["15 August 1947", "26 November 1949", "2 October 1950"], level: "medium" },
  { q: "What is the national tree of India?", correct: "Banyan", wrong: ["Neem", "Peepal", "Mango tree"], level: "medium" },
  { q: "What is the southernmost tip of mainland India called?", correct: "Kanyakumari", wrong: ["Rameswaram", "Kovalam", "Point Calimere"], level: "medium" },
  { q: "Which Indian state is the country's largest producer of tea?", correct: "Assam", wrong: ["Kerala", "West Bengal", "Tamil Nadu"], level: "medium" },
  { q: "The Andaman and Nicobar Islands lie in which body of water?", correct: "Bay of Bengal", wrong: ["Arabian Sea", "Indian Ocean only", "Andaman Sea only"], level: "medium" },
  { q: "What is the capital of Tamil Nadu?", correct: "Chennai", wrong: ["Coimbatore", "Madurai", "Bengaluru"], level: "medium" },
  { q: "Which city served as British India's capital before it shifted to Delhi in 1911?", correct: "Kolkata (Calcutta)", wrong: ["Mumbai (Bombay)", "Chennai (Madras)", "Allahabad"], level: "hard" },
  { q: "The Ajanta and Ellora rock-cut caves are located in which state?", correct: "Maharashtra", wrong: ["Madhya Pradesh", "Karnataka", "Gujarat"], level: "hard" },
  { q: "The ruins of Hampi, capital of the Vijayanagara Empire, are in which state?", correct: "Karnataka", wrong: ["Telangana", "Tamil Nadu", "Andhra Pradesh"], level: "hard" },
  { q: "The Brihadeeswarar (Big) Temple built by the Cholas stands in which city?", correct: "Thanjavur", wrong: ["Madurai", "Kanchipuram", "Mysuru"], level: "hard" },
  { q: "What is India's national aquatic animal?", correct: "Ganges River Dolphin", wrong: ["Olive Ridley Turtle", "Indian Otter", "Gharial"], level: "hard" },
  { q: "Which is India's national river?", correct: "Ganga", wrong: ["Yamuna", "Narmada", "Kaveri"], level: "medium" },
];

const MUMBAI = [
  { q: "Mumbai is the capital of which Indian state?", correct: "Maharashtra", wrong: ["Gujarat", "Goa", "Karnataka"], level: "easy" },
  { q: "By what name was Mumbai formerly known?", correct: "Bombay", wrong: ["Madras", "Calcutta", "Poona"], level: "easy" },
  { q: "Which seafront arch monument is a famous Mumbai landmark?", correct: "Gateway of India", wrong: ["India Gate", "Charminar", "Qutub Minar"], level: "easy" },
  { q: "Mumbai lies on the coast of which sea?", correct: "Arabian Sea", wrong: ["Bay of Bengal", "Indian Ocean only", "Laccadive Sea"], level: "easy" },
  { q: "Mumbai's curving seafront promenade, lit up at night, is nicknamed what?", correct: "The Queen's Necklace", wrong: ["The Golden Mile", "The Silver Line", "The Pearl Strand"], level: "medium" },
  { q: "That illuminated promenade is officially known as what?", correct: "Marine Drive", wrong: ["Juhu Beach", "Worli Sea Face", "Carter Road"], level: "medium" },
  { q: "Mumbai's UNESCO-listed main railway terminus (formerly Victoria Terminus) is now named what?", correct: "Chhatrapati Shivaji Maharaj Terminus", wrong: ["Mumbai Central", "Dadar Junction", "Churchgate"], level: "medium" },
  { q: "The cable-stayed bridge linking Bandra and Worli is called the what?", correct: "Bandra–Worli Sea Link", wrong: ["Howrah Bridge", "Atal Setu", "Vashi Bridge"], level: "medium" },
  { q: "Mumbai's famous lunchbox delivery men are known as what?", correct: "Dabbawalas", wrong: ["Hamals", "Tiffinwalas", "Coolies"], level: "medium" },
  { q: "Which Bollywood superstar lives in the Mumbai bungalow named 'Mannat'?", correct: "Shah Rukh Khan", wrong: ["Amitabh Bachchan", "Salman Khan", "Aamir Khan"], level: "easy" },
  { q: "The Siddhivinayak Temple in Mumbai is dedicated to which deity?", correct: "Lord Ganesha", wrong: ["Lord Shiva", "Lord Vishnu", "Goddess Lakshmi"], level: "medium" },
  { q: "The Elephanta Caves are reached by ferry from which Mumbai landmark?", correct: "Gateway of India", wrong: ["Marine Drive", "Juhu Beach", "Worli Fort"], level: "hard" },
  { q: "Which festival, featuring the 'Lalbaugcha Raja', is celebrated grandly in Mumbai?", correct: "Ganesh Chaturthi", wrong: ["Navratri", "Diwali", "Gudi Padwa"], level: "medium" },
  { q: "India's oldest stock exchange, located in Mumbai, is the what?", correct: "Bombay Stock Exchange", wrong: ["National Stock Exchange", "Mumbai Trade Exchange", "Dalal Exchange"], level: "medium" },
  { q: "Dharavi, one of Asia's largest slum settlements, is located in which city?", correct: "Mumbai", wrong: ["Delhi", "Kolkata", "Chennai"], level: "medium" },
  { q: "The Haji Ali Dargah sits on an islet off the coast of which city?", correct: "Mumbai", wrong: ["Hyderabad", "Surat", "Kochi"], level: "medium" },
  // More
  { q: "Which famous beach lies in Mumbai's upscale suburb of the same name?", correct: "Juhu Beach", wrong: ["Marina Beach", "Calangute Beach", "Digha Beach"], level: "easy" },
  { q: "Which Indian city is the headquarters of the Hindi film industry, Bollywood?", correct: "Mumbai", wrong: ["Hyderabad", "Chennai", "New Delhi"], level: "easy" },
  { q: "Author Suketu Mehta's famous book gave Mumbai which nickname?", correct: "Maximum City", wrong: ["City of Dreams", "Gateway City", "Island City"], level: "medium" },
  { q: "Powai Lake and the campus of IIT Bombay are located in which city?", correct: "Mumbai", wrong: ["Pune", "Nagpur", "Nashik"], level: "medium" },
  { q: "Nariman Point, a prominent business district, is in which city?", correct: "Mumbai", wrong: ["Ahmedabad", "Kolkata", "Bengaluru"], level: "medium" },
  { q: "Mumbai was originally a cluster of how many islands?", correct: "Seven", wrong: ["Three", "Five", "Ten"], level: "hard" },
  { q: "India's first passenger railway (1853) ran from Bombay to which town?", correct: "Thane", wrong: ["Pune", "Surat", "Kalyan"], level: "hard" },
  { q: "The British acquired Bombay from which European power (as part of a royal dowry)?", correct: "Portugal", wrong: ["The Netherlands", "France", "Spain"], level: "hard" },
  { q: "The Mahalaxmi Dhobi Ghat in Mumbai is famous as a giant open-air what?", correct: "Laundry", wrong: ["Fish market", "Flower market", "Spice market"], level: "hard" },
];

const LUCKNOW = [
  { q: "Lucknow is the capital of which Indian state?", correct: "Uttar Pradesh", wrong: ["Bihar", "Madhya Pradesh", "Rajasthan"], level: "easy" },
  { q: "Lucknow is famously known as the 'City of' what?", correct: "Nawabs", wrong: ["Lakes", "Joy", "Pearls"], level: "medium" },
  { q: "Which delicate hand embroidery is Lucknow renowned for?", correct: "Chikankari", wrong: ["Zardozi", "Phulkari", "Kantha"], level: "medium" },
  { q: "On the banks of which river is Lucknow situated?", correct: "Gomti", wrong: ["Yamuna", "Ganga", "Saryu"], level: "medium" },
  { q: "The famous labyrinth inside Lucknow's Bara Imambara is called what?", correct: "Bhulbhulaiya", wrong: ["Sheesh Mahal", "Diwan-e-Khas", "Charbagh"], level: "hard" },
  { q: "Which grand gateway is an iconic landmark of Lucknow?", correct: "Rumi Darwaza", wrong: ["Buland Darwaza", "India Gate", "Charminar"], level: "medium" },
  { q: "Lucknow's rich, slow-cooked royal cuisine belongs to which tradition?", correct: "Awadhi cuisine", wrong: ["Mughlai-Punjabi", "Hyderabadi", "Chettinad"], level: "medium" },
  { q: "Which melt-in-the-mouth kebab is a Lucknow speciality?", correct: "Galouti kebab", wrong: ["Seekh kebab", "Shami kebab", "Reshmi kebab"], level: "medium" },
  { q: "The polite Lucknawi phrase symbolising its courteous culture is what?", correct: "Pehle aap", wrong: ["Jee huzoor", "Shukriya", "Aadaab"], level: "hard" },
  { q: "The 1857 siege ruins known as 'The Residency' are located in which city?", correct: "Lucknow", wrong: ["Kanpur", "Jhansi", "Meerut"], level: "hard" },
  { q: "Lucknow's historic ruling dynasty were the Nawabs of which kingdom?", correct: "Awadh", wrong: ["Rohilkhand", "Bundelkhand", "Hyderabad"], level: "medium" },
  { q: "Which lively market area is a famous shopping hub in Lucknow?", correct: "Hazratganj", wrong: ["Chandni Chowk", "Sarojini", "Linking Road"], level: "medium" },
  { q: "The IPL franchise 'Lucknow Super Giants' plays in which league?", correct: "Indian Premier League", wrong: ["Big Bash League", "Pakistan Super League", "The Hundred"], level: "easy" },
  // More
  { q: "Lucknow is the cultural heart of which historic region of Uttar Pradesh?", correct: "Awadh", wrong: ["Bundelkhand", "Rohilkhand", "Braj"], level: "easy" },
  { q: "Tunday Kababi, a legendary kebab eatery, is famously located in which city?", correct: "Lucknow", wrong: ["Hyderabad", "Delhi", "Bhopal"], level: "easy" },
  { q: "Lucknow is celebrated for its refined etiquette and 'tehzeeb', a word meaning what?", correct: "Politeness / culture", wrong: ["Cuisine", "Architecture", "Music"], level: "medium" },
  { q: "The Chota Imambara, a grand monument, is located in which city?", correct: "Lucknow", wrong: ["Hyderabad", "Bhopal", "Murshidabad"], level: "medium" },
  { q: "King George's Medical University (KGMU), a renowned institution, is in which city?", correct: "Lucknow", wrong: ["Kanpur", "Varanasi", "Allahabad"], level: "medium" },
  { q: "Lucknow's main airport is named after which figure?", correct: "Chaudhary Charan Singh", wrong: ["Sardar Patel", "Atal Bihari Vajpayee", "Ram Manohar Lohia"], level: "hard" },
  { q: "The historic La Martiniere College, founded by a Frenchman, is located in which city?", correct: "Lucknow", wrong: ["Kolkata", "Shimla", "Dehradun"], level: "hard" },
  { q: "Which delicate, hand-woven brocade fabric, besides chikankari, is associated with Lucknow's region?", correct: "Mukaish / zardozi work", wrong: ["Banarasi silk", "Pashmina", "Kanjeevaram"], level: "hard" },
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await seedCategory(mongoose, Question, "India", INDIA);
  await seedCategory(mongoose, Question, "Mumbai", MUMBAI);
  await seedCategory(mongoose, Question, "Lucknow", LUCKNOW);
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
