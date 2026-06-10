/**
 * "Indian Cinema" trivia — pan-Indian (Bollywood + South + regional, classics to
 * modern blockbusters). Run: node scripts/seedIndianCinema.js
 * Item format: [question, correctAnswer, [wrong1, wrong2, wrong3], level]
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Question = require("../models/Question");
const LEVEL_CONFIG = { easy: { xp: 20, time: 12 }, medium: { xp: 40, time: 10 }, hard: { xp: 80, time: 8 } };
const CATEGORY = "Indian Cinema";

const Q = [
  ["Who is considered the 'Father of Indian Cinema'?", "Dadasaheb Phalke", ["Satyajit Ray", "Raj Kapoor", "Guru Dutt"], "medium"],
  ["What was India's first full-length feature film (1913)?", "Raja Harishchandra", ["Alam Ara", "Mother India", "Awaara"], "hard"],
  ["What was India's first sound film / 'talkie' (1931)?", "Alam Ara", ["Raja Harishchandra", "Kismet", "Devdas"], "hard"],
  ["Which award is the highest honour in Indian cinema?", "Dadasaheb Phalke Award", ["Filmfare Award", "National Film Award for Best Film", "IIFA Award"], "medium"],
  ["Who directed the acclaimed 'Apu Trilogy' starting with Pather Panchali?", "Satyajit Ray", ["Bimal Roy", "Guru Dutt", "Mrinal Sen"], "medium"],
  ["Which Indian filmmaker received an honorary Academy Award in 1992?", "Satyajit Ray", ["Raj Kapoor", "Mani Ratnam", "Yash Chopra"], "hard"],
  ["Who directed the Baahubali films?", "S. S. Rajamouli", ["Prabhas", "Rajinikanth", "Shankar"], "easy"],
  ["Who played the lead role in the Baahubali films?", "Prabhas", ["Ram Charan", "Mahesh Babu", "Allu Arjun"], "easy"],
  ["The song 'Naatu Naatu' from RRR won which major award in 2023?", "The Academy Award for Best Original Song", ["The Grammy for Song of the Year", "The Golden Lion", "The BAFTA for Best Score"], "medium"],
  ["Who directed RRR?", "S. S. Rajamouli", ["Prashanth Neel", "Sukumar", "Lokesh Kanagaraj"], "easy"],
  ["Who composed the Oscar-winning 'Naatu Naatu'?", "M. M. Keeravani", ["A. R. Rahman", "Devi Sri Prasad", "Anirudh"], "medium"],
  ["Which two actors play the leads in RRR?", "N. T. Rama Rao Jr. and Ram Charan", ["Prabhas and Allu Arjun", "Mahesh Babu and Vijay", "Yash and Prabhas"], "medium"],
  ["Who plays the title role in the KGF film series?", "Yash", ["Prabhas", "Allu Arjun", "Vijay Deverakonda"], "medium"],
  ["Who directed the KGF films?", "Prashanth Neel", ["S. S. Rajamouli", "Sukumar", "Lokesh Kanagaraj"], "medium"],
  ["Who plays the title role in 'Pushpa: The Rise'?", "Allu Arjun", ["Ram Charan", "Prabhas", "Vijay Deverakonda"], "easy"],
  ["Which superstar is affectionately called 'Thalaiva' in Tamil cinema?", "Rajinikanth", ["Kamal Haasan", "Vijay", "Ajith"], "easy"],
  ["Which actor, also a politician, is a legend of both Tamil and Hindi cinema, known as 'Ulaganayagan'?", "Kamal Haasan", ["Rajinikanth", "Chiranjeevi", "Mohanlal"], "hard"],
  ["Which actor is called 'Megastar' of Telugu cinema?", "Chiranjeevi", ["Nagarjuna", "Venkatesh", "Mahesh Babu"], "hard"],
  ["What is the term for the Telugu film industry?", "Tollywood", ["Kollywood", "Mollywood", "Sandalwood"], "medium"],
  ["What is the term for the Tamil film industry?", "Kollywood", ["Tollywood", "Mollywood", "Sandalwood"], "medium"],
  ["What does 'Bollywood' refer to?", "The Hindi-language film industry based in Mumbai", ["The Tamil film industry", "All of Indian cinema", "The Bengali film industry"], "easy"],
  ["Which 1957 film, an epic, was India's first Oscar nominee for Best Foreign Language Film?", "Mother India", ["Lagaan", "Salaam Bombay!", "Awaara"], "hard"],
  ["Which two later Indian films were also nominated for the Best Foreign Language Film Oscar?", "Salaam Bombay! and Lagaan", ["Sholay and Mughal-e-Azam", "RRR and Dangal", "Devdas and Taal"], "hard"],
  ["Who directed the 1960 epic 'Mughal-e-Azam'?", "K. Asif", ["Mehboob Khan", "Bimal Roy", "Raj Kapoor"], "hard"],
  ["Which legendary actor-director starred in and directed 'Awaara' and 'Shree 420'?", "Raj Kapoor", ["Dilip Kumar", "Guru Dutt", "Dev Anand"], "medium"],
  ["Which three actors were the great male stars of 1950s-60s Hindi cinema?", "Raj Kapoor, Dilip Kumar and Dev Anand", ["Amitabh, Dharmendra and Vinod Khanna", "Rajesh Khanna, Jeetendra and Shashi Kapoor", "Sunil Dutt, Manoj Kumar and Rajendra Kumar"], "hard"],
  ["Which actress, the star of 'Mughal-e-Azam', is remembered as a great beauty of Hindi cinema?", "Madhubala", ["Nargis", "Meena Kumari", "Waheeda Rehman"], "hard"],
  ["Who directed 'Pyaasa' and 'Kaagaz Ke Phool'?", "Guru Dutt", ["Bimal Roy", "Raj Kapoor", "Satyajit Ray"], "hard"],
  ["Who directed 'Roja', 'Bombay' and 'Dil Se'?", "Mani Ratnam", ["S. S. Rajamouli", "Shankar", "Gautham Menon"], "medium"],
  ["Which Tamil director is famous for grand sci-fi/fantasy films like 'Enthiran' (Robot) and '2.0'?", "Shankar", ["Mani Ratnam", "S. S. Rajamouli", "Lokesh Kanagaraj"], "hard"],
  ["Who is the leading actor of Malayalam cinema known as one of its 'two superstars' alongside Mammootty?", "Mohanlal", ["Dulquer Salmaan", "Fahadh Faasil", "Prithviraj"], "hard"],
  ["What is the term for the Malayalam film industry?", "Mollywood", ["Kollywood", "Tollywood", "Sandalwood"], "hard"],
  ["What is the term for the Kannada film industry?", "Sandalwood", ["Tollywood", "Kollywood", "Mollywood"], "hard"],
  ["Which 2016 Aamir Khan film about wrestling became one of India's highest-grossing films?", "Dangal", ["Sultan", "Chak De! India", "Mary Kom"], "easy"],
  ["Which 2023 Shah Rukh Khan spy film was a massive box-office success?", "Pathaan", ["Jawan", "Tiger 3", "Dunki"], "easy"],
  ["Which composer is known as the 'Mozart of Madras'?", "A. R. Rahman", ["Ilaiyaraaja", "M. M. Keeravani", "Anirudh Ravichander"], "medium"],
  ["A. R. Rahman won two Oscars for which 2008 film?", "Slumdog Millionaire", ["Lagaan", "Dil Se", "127 Hours"], "medium"],
  ["Which Indian sound designer won an Oscar for 'Slumdog Millionaire'?", "Resul Pookutty", ["A. R. Rahman", "Gulzar", "Sound Mirchi"], "hard"],
  ["Which veteran composer of Tamil cinema is revered as 'Isaignani'?", "Ilaiyaraaja", ["A. R. Rahman", "Devi Sri Prasad", "Harris Jayaraj"], "hard"],
  ["Who directed '3 Idiots', 'PK' and 'Munna Bhai M.B.B.S.'?", "Rajkumar Hirani", ["Anurag Kashyap", "Imtiaz Ali", "Zoya Akhtar"], "easy"],
  ["Which actor is called the 'Greek God' and is famed for dancing, e.g. in Dhoom 2 and Krrish?", "Hrithik Roshan", ["Tiger Shroff", "Varun Dhawan", "Shahid Kapoor"], "medium"],
  ["Who directed the gritty crime epic 'Gangs of Wasseypur'?", "Anurag Kashyap", ["Vishal Bhardwaj", "Dibakar Banerjee", "Sriram Raghavan"], "medium"],
  ["Which actress won acclaim and the lead in 'Queen' (2014)?", "Kangana Ranaut", ["Vidya Balan", "Anushka Sharma", "Taapsee Pannu"], "medium"],
  ["Which actress is remembered as India's 'first female superstar', star of Mr. India and Chandni?", "Sridevi", ["Madhuri Dixit", "Rekha", "Hema Malini"], "hard"],
  ["Which 2015 Salman Khan film features him helping a mute Pakistani girl return home?", "Bajrangi Bhaijaan", ["Sultan", "Tiger Zinda Hai", "Ek Tha Tiger"], "easy"],
  ["Which actor plays the lead in 'Vikram' and 'Kaithi', directed by Lokesh Kanagaraj?", "Kamal Haasan (Vikram) / Karthi (Kaithi)", ["Vijay", "Suriya", "Dhanush"], "hard"],
  ["Which Tamil actor-singer also won acclaim in Hindi films like 'Raanjhanaa' and the song 'Why This Kolaveri Di'?", "Dhanush", ["Vijay Sethupathi", "Suriya", "Madhavan"], "medium"],
  ["Who directed the visually grand 'Bajirao Mastani' and 'Padmaavat'?", "Sanjay Leela Bhansali", ["Ashutosh Gowariker", "Karan Johar", "Rohit Shetty"], "medium"],
  ["Which actor is known as 'King Khan' / 'Badshah of Bollywood'?", "Shah Rukh Khan", ["Salman Khan", "Aamir Khan", "Akshay Kumar"], "easy"],
  ["Which 1975 film is hailed as a defining Hindi 'masala' blockbuster?", "Sholay", ["Deewaar", "Don", "Zanjeer"], "easy"],
  ["Who composed music as 'Pancham da', son of S. D. Burman?", "R. D. Burman", ["Naushad", "Madan Mohan", "Laxmikant-Pyarelal"], "hard"],
  ["Which 2017 Telugu film became, on release, one of the highest-grossing Indian films ever?", "Baahubali 2: The Conclusion", ["Saaho", "RRR", "KGF Chapter 2"], "medium"],
  ["Which director made the 2018 Tamil hit 'Vada Chennai' and the Dhanush film 'Asuran'... i.e. directed 'Asuran'?", "Vetrimaaran", ["Mari Selvaraj", "Pa. Ranjith", "Lokesh Kanagaraj"], "hard"],
  ["Which 2022 Kannada film, part 2, was a pan-India blockbuster starring Yash?", "KGF: Chapter 2", ["Kantara", "777 Charlie", "Vikrant Rona"], "easy"],
  ["Which 2022 Kannada film by Rishab Shetty drew acclaim for its folklore and 'Bhoota Kola' theme?", "Kantara", ["KGF", "Charlie 777", "Garuda Gamana"], "medium"],
  ["Which actress made her Bollywood debut in 'Student of the Year' (2012)?", "Alia Bhatt", ["Shraddha Kapoor", "Kriti Sanon", "Parineeti Chopra"], "medium"],
  ["Which actor is known as 'Khiladi Kumar' for his action films?", "Akshay Kumar", ["Ajay Devgn", "Suniel Shetty", "John Abraham"], "easy"],
  ["Which acclaimed actor starred in 'Paan Singh Tomar', 'The Lunchbox' and Hollywood's 'Life of Pi'?", "Irrfan Khan", ["Nawazuddin Siddiqui", "Manoj Bajpayee", "Pankaj Tripathi"], "medium"],
  ["Which actor is acclaimed for 'Gangs of Wasseypur', 'Sacred Games' and 'Manjhi'?", "Nawazuddin Siddiqui", ["Irrfan Khan", "Rajkummar Rao", "Vicky Kaushal"], "medium"],
  ["Which 2009 film by Rajkumar Hirani is about engineering students and friendship?", "3 Idiots", ["Munna Bhai M.B.B.S.", "PK", "Taare Zameen Par"], "easy"],
  ["Which 2007 Aamir Khan-directed film deals with a dyslexic child?", "Taare Zameen Par", ["3 Idiots", "Dangal", "PK"], "medium"],
  ["Who is regarded as the legendary playback 'Nightingale of India'?", "Lata Mangeshkar", ["Asha Bhosle", "Shreya Ghoshal", "Geeta Dutt"], "easy"],
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Question.deleteMany({ category: CATEGORY });
  const docs = Q.map(([q, a, wrong, level]) => {
    const opts = [a, ...wrong];
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.easy;
    return { category: CATEGORY, question: q, options: opts, correctIndex: opts.indexOf(a), correctAnswer: a,
      mediaUrl: "", mediaType: "text", level, xpReward: cfg.xp, timeLimit: cfg.time };
  });
  await Question.insertMany(docs);
  console.log(`Seeded ${docs.length} Indian Cinema questions.`);
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
