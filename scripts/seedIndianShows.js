/**
 * Hand-curated Indian TV & Web Series trivia (Netflix/Prime/SonyLIV hits +
 * classic Indian television). Author-leveled. Category: "Indian TV & Web Series".
 * Run: MONGO_URI="<atlas>" node scripts/seedIndianShows.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Question = require("../models/Question");
const { seedCategory } = require("./_seedHelper");

const Q = [
  // Sacred Games
  { q: "In the web series Sacred Games, the gangster Ganesh Gaitonde is played by whom?", correct: "Nawazuddin Siddiqui", wrong: ["Pankaj Tripathi", "Manoj Bajpayee", "Jaideep Ahlawat"], level: "medium" },
  { q: "Which actor plays police officer Sartaj Singh in Sacred Games?", correct: "Saif Ali Khan", wrong: ["Vicky Kaushal", "Rajkummar Rao", "Abhishek Bachchan"], level: "medium" },
  { q: "Sacred Games was India's first original series on which streaming platform?", correct: "Netflix", wrong: ["Amazon Prime Video", "Disney+ Hotstar", "SonyLIV"], level: "medium" },

  // Mirzapur
  { q: "In Mirzapur, the menacing 'Kaleen Bhaiya' (Akhandanand Tripathi) is played by whom?", correct: "Pankaj Tripathi", wrong: ["Nawazuddin Siddiqui", "Ali Fazal", "Divyenndu"], level: "medium" },
  { q: "The web series Mirzapur is set in which Indian state?", correct: "Uttar Pradesh", wrong: ["Bihar", "Madhya Pradesh", "Jharkhand"], level: "medium" },
  { q: "On which platform does Mirzapur stream?", correct: "Amazon Prime Video", wrong: ["Netflix", "SonyLIV", "ZEE5"], level: "easy" },

  // The Family Man
  { q: "Who plays intelligence officer Srikant Tiwari in 'The Family Man'?", correct: "Manoj Bajpayee", wrong: ["Manav Vij", "Sharib Hashmi", "Kay Kay Menon"], level: "medium" },
  { q: "'The Family Man' streams on which platform?", correct: "Amazon Prime Video", wrong: ["Netflix", "Disney+ Hotstar", "SonyLIV"], level: "medium" },

  // Scam 1992
  { q: "The series 'Scam 1992' is based on the rise and fall of which stockbroker?", correct: "Harshad Mehta", wrong: ["Ketan Parekh", "Nirav Modi", "Vijay Mallya"], level: "medium" },
  { q: "Who played Harshad Mehta in 'Scam 1992'?", correct: "Pratik Gandhi", wrong: ["Rajkummar Rao", "Abhishek Bachchan", "Vikrant Massey"], level: "medium" },
  { q: "'Scam 1992' was directed by which acclaimed filmmaker?", correct: "Hansal Mehta", wrong: ["Anurag Kashyap", "Neeraj Pandey", "Raj & DK"], level: "hard" },

  // Panchayat
  { q: "The comedy series 'Panchayat' is set in a fictional village named what?", correct: "Phulera", wrong: ["Mirzapur", "Bilara", "Gulmohar"], level: "hard" },
  { q: "'Panchayat' follows an engineering graduate who takes a job as a panchayat what?", correct: "Secretary", wrong: ["Pradhan", "Teacher", "Police officer"], level: "medium" },
  { q: "On which platform does 'Panchayat' stream?", correct: "Amazon Prime Video", wrong: ["Netflix", "ZEE5", "SonyLIV"], level: "medium" },

  // Delhi Crime / Kota Factory / Aspirants
  { q: "'Delhi Crime' won the International Emmy for Best Drama Series; its first season was based on which 2012 case?", correct: "The 2012 Delhi gang-rape case", wrong: ["The Aarushi Talwar case", "The Nirav Modi scam", "The 26/11 attacks"], level: "hard" },
  { q: "The web series 'Kota Factory' is set in a city famous for coaching institutes; which city?", correct: "Kota", wrong: ["Sikar", "Indore", "Allahabad"], level: "medium" },
  { q: "'Kota Factory' was notable for being shot largely in what visual style?", correct: "Black and white", wrong: ["Sepia tone", "Found footage", "Animation"], level: "hard" },
  { q: "The TVF series 'Aspirants' follows friends preparing for which examination?", correct: "UPSC Civil Services", wrong: ["IIT-JEE", "NEET", "CAT"], level: "medium" },
  { q: "Which studio (TVF) pioneered Indian web series like 'Permanent Roommates' and 'Pitchers'?", correct: "The Viral Fever", wrong: ["Dice Media", "AIB", "Pocket Aces"], level: "hard" },

  // Classic Indian TV
  { q: "Which legendary actor hosts the Hindi quiz show 'Kaun Banega Crorepati'?", correct: "Amitabh Bachchan", wrong: ["Shah Rukh Khan", "Aamir Khan", "Anil Kapoor"], level: "easy" },
  { q: "Who is the long-time host of the Hindi version of 'Bigg Boss'?", correct: "Salman Khan", wrong: ["Shah Rukh Khan", "Akshay Kumar", "Karan Johar"], level: "easy" },
  { q: "The iconic 1987 TV serial 'Ramayan' was created and directed by whom?", correct: "Ramanand Sagar", wrong: ["B. R. Chopra", "Ekta Kapoor", "Shyam Benegal"], level: "hard" },
  { q: "The classic epic serials 'Ramayan' and 'Mahabharat' originally aired on which channel?", correct: "Doordarshan", wrong: ["Star Plus", "Zee TV", "Sony TV"], level: "medium" },
  { q: "Producer Ekta Kapoor's many soap operas come from which production house?", correct: "Balaji Telefilms", wrong: ["Dharma Productions", "YRF Television", "Endemol India"], level: "medium" },
  { q: "In the long-running crime show 'CID', the lead 'ACP Pradyuman' is played by whom?", correct: "Shivaji Satam", wrong: ["Aditya Srivastava", "Dayanand Shetty", "Anup Soni"], level: "hard" },
  { q: "The Indian business-pitch reality show where founders seek investment is called what?", correct: "Shark Tank India", wrong: ["Dragon's Den India", "The Pitch", "Founder Factory"], level: "medium" },
  // More easy
  { q: "Indian Idol is a reality TV competition centred on which talent?", correct: "Singing", wrong: ["Dancing", "Cooking", "Comedy"], level: "easy" },
  { q: "'Kaun Banega Crorepati' is the Indian version of which global quiz format?", correct: "Who Wants to Be a Millionaire", wrong: ["Jeopardy!", "The Chase", "Mastermind"], level: "easy" },
  { q: "The 1990s superhero series featuring an Indian costumed hero was called what?", correct: "Shaktimaan", wrong: ["Krrish", "Captain Vyom", "Junoon"], level: "easy" },
  { q: "'Crime Patrol' is a long-running show that dramatizes what?", correct: "Real-life crime cases", wrong: ["Celebrity gossip", "Cooking contests", "Travel diaries"], level: "easy" },
  { q: "'Dance India Dance' is a reality competition based on which talent?", correct: "Dancing", wrong: ["Singing", "Acting", "Painting"], level: "easy" },
  // More medium / hard
  { q: "'Bigg Boss' is the Indian adaptation of which international reality format?", correct: "Big Brother", wrong: ["Survivor", "Love Island", "The Circle"], level: "medium" },
  { q: "Which beloved Indian sitcom features the eccentric 'Maya' and 'Monisha' Sarabhai?", correct: "Sarabhai vs Sarabhai", wrong: ["Khichdi", "Hum Paanch", "Office Office"], level: "medium" },
  { q: "The comedy show built around the chaotic Parekh family is called what?", correct: "Khichdi", wrong: ["Sarabhai vs Sarabhai", "Tarak Mehta", "Yes Boss"], level: "medium" },
  { q: "The crime show 'CID' aired for over two decades on which Indian channel?", correct: "Sony TV", wrong: ["Star Plus", "Zee TV", "Colors"], level: "medium" },
  { q: "Which 1980s mythological serial by B. R. Chopra dramatized the great Indian epic of the Kurukshetra war?", correct: "Mahabharat", wrong: ["Ramayan", "Chanakya", "Bharat Ek Khoj"], level: "hard" },
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await seedCategory(mongoose, Question, "Indian TV & Web Series", Q);
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
