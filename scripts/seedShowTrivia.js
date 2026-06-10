/**
 * NOTE: Friends, The Big Bang Theory and Bollywood Trivia are now owned by
 * scripts/seedPriorityShows.js (50+ questions each). If you re-run THIS script,
 * re-run seedPriorityShows.js afterwards to restore the deep sets.
 *
 * Curated multiple-choice trivia for popular TV shows + Bollywood, inserted
 * directly into MongoDB as Question docs. Run: node scripts/seedShowTrivia.js
 * Format per item: [question, correctAnswer, [wrong1, wrong2, wrong3], level]
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Question = require("../models/Question");

const LEVEL_CONFIG = { easy: { xp: 20, time: 12 }, medium: { xp: 40, time: 10 }, hard: { xp: 80, time: 8 } };

const SETS = {
  Friends: [
    ["What is the name of Ross's pet monkey?", "Marcel", ["Coco", "Bananas", "Mr. Winkle"], "easy"],
    ["What is Joey's signature pick-up line?", "How you doin'?", ["Hey there!", "What's up?", "Nice to meet you"], "easy"],
    ["What is the name of the coffee house they hang out at?", "Central Perk", ["Café Nervosa", "The Grind", "Java Joe's"], "easy"],
    ["What is Phoebe's famous song about a feline?", "Smelly Cat", ["Crazy Cat", "Stinky Kitty", "Sticky Cat"], "easy"],
    ["What is Ross's profession?", "Paleontologist", ["Lawyer", "Architect", "Chemist"], "medium"],
    ["What does Ross insist they were on during his split with Rachel?", "A break", ["A pause", "A trip", "A timeout"], "easy"],
    ["What is the name of Ross and Rachel's daughter?", "Emma", ["Ella", "Emily", "Erica"], "medium"],
    ["Who is Phoebe's twin sister?", "Ursula", ["Ursa", "Una", "Ulrika"], "medium"],
    ["What food does Joey famously refuse to share?", "His food", ["His coffee", "His pizza only", "His fries only"], "easy"],
    ["Who works behind the counter at Central Perk and loves Rachel?", "Gunther", ["Gary", "Gunner", "Glen"], "medium"],
    ["In which city is Friends set?", "New York City", ["Boston", "Chicago", "Los Angeles"], "easy"],
    ["What is Monica's job?", "Chef", ["Teacher", "Nurse", "Photographer"], "medium"],
    ["Which word do they shout while moving a couch up the stairs?", "Pivot", ["Turn", "Lift", "Twist"], "easy"],
    ["Who does Ross marry in Las Vegas?", "Rachel", ["Emily", "Monica", "Phoebe"], "medium"],
  ],
  "The Big Bang Theory": [
    ["What is Sheldon's catchphrase?", "Bazinga!", ["Gotcha!", "Boom!", "Surprise!"], "easy"],
    ["What does Sheldon call his designated couch seat?", "His spot", ["His throne", "His zone", "His corner"], "easy"],
    ["What field do Leonard and Sheldon work in?", "Physics", ["Chemistry", "Biology", "Engineering"], "easy"],
    ["What is Howard Wolowitz's profession?", "Aerospace engineer", ["Physicist", "Doctor", "Astronomer"], "medium"],
    ["Why can't Raj initially talk to women?", "Selective mutism (without alcohol)", ["He's too shy to try", "He has a stutter", "He doesn't speak English"], "medium"],
    ["Where do the main characters work?", "Caltech", ["MIT", "Stanford", "Harvard"], "easy"],
    ["What is the name of the soothing song Sheldon likes when sick?", "Soft Kitty", ["Sleepy Cat", "Warm Kitty", "Lullaby Cat"], "easy"],
    ["What is Penny's job when the show begins?", "Waitress at The Cheesecake Factory", ["Actress only", "Bartender", "Receptionist"], "medium"],
    ["What is Amy Farrah Fowler's field?", "Neurobiology", ["Physics", "Astronomy", "Geology"], "medium"],
    ["What is Sheldon's twin sister's name?", "Missy", ["Mandy", "Megan", "Molly"], "hard"],
    ["Who owns the comic book store?", "Stuart", ["Steve", "Stan", "Simon"], "medium"],
    ["Which character travels to the International Space Station?", "Howard", ["Leonard", "Raj", "Sheldon"], "medium"],
    ["What city is the show set in?", "Pasadena", ["San Diego", "San Francisco", "Sacramento"], "hard"],
  ],
  "The Office": [
    ["What is the name of the paper company?", "Dunder Mifflin", ["Staples", "Office Max", "Paper Plus"], "easy"],
    ["What city is the branch located in?", "Scranton", ["Stamford", "Buffalo", "Cleveland"], "easy"],
    ["Who is the regional manager for most of the series?", "Michael Scott", ["Dwight Schrute", "Jim Halpert", "Andy Bernard"], "easy"],
    ["What is Dwight's self-given title?", "Assistant to the Regional Manager", ["Co-Manager", "Vice Manager", "Branch Director"], "medium"],
    ["What does Dwight farm?", "Beets", ["Corn", "Potatoes", "Carrots"], "easy"],
    ["What catchphrase does Michael overuse?", "That's what she said", ["Boom, roasted", "Win-win-win", "No problemo"], "easy"],
    ["In what does Jim freeze Dwight's stapler?", "Jell-O", ["Ice", "Cement", "Wax"], "medium"],
    ["What is Pam's original job at the office?", "Receptionist", ["Accountant", "Salesperson", "HR rep"], "easy"],
    ["What is the name of Andy's college a cappella group?", "Here Comes Treble", ["Pitch Please", "The Tones", "Sharp Notes"], "hard"],
    ["What is the title of Michael's secret action movie?", "Threat Level Midnight", ["Agent Michael", "Midnight Justice", "The Scarn Files"], "medium"],
    ["What is the name of Dwight's farm bed & breakfast?", "Schrute Farms", ["Beet Manor", "Mifflin Lodge", "Schrute Acres"], "medium"],
    ["Which long-time employee has a mysterious shady past?", "Creed", ["Stanley", "Kevin", "Oscar"], "medium"],
    ["What alter ego does Michael use to scare the office?", "Prison Mike", ["Date Mike", "Agent Mike", "Boss Mike"], "medium"],
  ],
  "Modern Family": [
    ["What is Phil Dunphy's profession?", "Real estate agent", ["Lawyer", "Accountant", "Doctor"], "easy"],
    ["What does Phil call his set of life rules?", "Phil's-osophy", ["Phil's Rules", "Dad Wisdom", "Phil Facts"], "medium"],
    ["What is the name of Mitchell and Cameron's adopted daughter?", "Lily", ["Lucy", "Lola", "Lila"], "easy"],
    ["Which country is Gloria from?", "Colombia", ["Mexico", "Venezuela", "Brazil"], "easy"],
    ["Who is Manny's mother?", "Gloria", ["Claire", "Haley", "Alex"], "easy"],
    ["What is the name of Jay's dog?", "Stella", ["Bella", "Daisy", "Luna"], "medium"],
    ["What is the name of Cameron's clown alter ego?", "Fizbo", ["Bobo", "Chuckles", "Pippo"], "medium"],
    ["What business does Jay Pritchett own?", "A closet company", ["A car dealership", "A restaurant", "A law firm"], "medium"],
    ["Which Dunphy child is known for being the smart one?", "Alex", ["Haley", "Luke", "Manny"], "easy"],
    ["What is Mitchell's profession?", "Lawyer", ["Teacher", "Architect", "Doctor"], "medium"],
    ["What are the names of Phil and Claire's three children?", "Haley, Alex, Luke", ["Haley, Lily, Joe", "Alex, Manny, Luke", "Haley, Alex, Manny"], "hard"],
    ["What is the name of Jay and Gloria's son?", "Joe", ["Manny", "Fulgencio", "Javier"], "medium"],
  ],
  "Bollywood Trivia": [
    ["\"Mogambo khush hua\" is an iconic dialogue from which film?", "Mr. India", ["Sholay", "Don", "Karma"], "medium"],
    ["\"Kitne aadmi the?\" is said by Gabbar Singh in which film?", "Sholay", ["Deewaar", "Don", "Zanjeer"], "easy"],
    ["Which film features the song \"Jai Ho\" that won an Oscar?", "Slumdog Millionaire", ["Lagaan", "Dil Se", "Taal"], "easy"],
    ["Who directed the film Lagaan?", "Ashutosh Gowariker", ["Karan Johar", "Sanjay Leela Bhansali", "Rajkumar Hirani"], "medium"],
    ["\"Bade bade deshon mein aisi choti choti baatein\" is from which film?", "Dilwale Dulhania Le Jayenge", ["Kuch Kuch Hota Hai", "Dil To Pagal Hai", "Mohabbatein"], "medium"],
    ["Which actor is nicknamed 'He-Man' of Bollywood?", "Dharmendra", ["Amitabh Bachchan", "Vinod Khanna", "Jeetendra"], "hard"],
    ["\"Tareekh pe tareekh\" is a famous courtroom dialogue from which film?", "Damini", ["Damni", "Andha Kanoon", "Meri Jung"], "hard"],
    ["Shah Rukh Khan's production house is called?", "Red Chillies Entertainment", ["Dharma Productions", "Yash Raj Films", "Excel Entertainment"], "medium"],
    ["Which 1975 film is one of the highest-regarded 'masala' films, starring Amitabh & Dharmendra?", "Sholay", ["Deewaar", "Don", "Trishul"], "easy"],
    ["Who composed the music for Slumdog Millionaire and Roja?", "A. R. Rahman", ["Pritam", "Shankar-Ehsaan-Loy", "Vishal-Shekhar"], "medium"],
    ["Sanjay Leela Bhansali directed which period epic with Deepika and Ranveer?", "Padmaavat", ["Jodhaa Akbar", "Bajirao Mastani", "both Padmaavat and Bajirao Mastani"], "hard"],
    ["Which actor played the title role in the '3 Idiots'?", "Aamir Khan", ["Shah Rukh Khan", "Salman Khan", "Hrithik Roshan"], "easy"],
    ["The dialogue \"Don ko pakadna mushkil hi nahi, namumkin hai\" is from?", "Don", ["Deewaar", "Agneepath", "Kaalia"], "medium"],
    ["Which actress made her debut in 'Aashiqui 2'?", "Shraddha Kapoor", ["Alia Bhatt", "Parineeti Chopra", "Kriti Sanon"], "hard"],
  ],
  "Bollywood Music": [
    ["The song 'Chaiyya Chaiyya' is from which film?", "Dil Se", ["Taal", "Dil To Pagal Hai", "Refugee"], "medium"],
    ["The song 'Tum Hi Ho' is from which film?", "Aashiqui 2", ["Ek Villain", "Hamari Adhuri Kahani", "Awarapan"], "easy"],
    ["'Gerua' is a hit song from which film?", "Dilwale", ["Chennai Express", "Happy New Year", "Raees"], "medium"],
    ["'Malhari' is a celebratory song from which film?", "Bajirao Mastani", ["Padmaavat", "Ram-Leela", "Tanhaji"], "medium"],
    ["'Senorita' is from which film?", "Zindagi Na Milegi Dobara", ["Dil Dhadakne Do", "Bachna Ae Haseeno", "Tamasha"], "medium"],
    ["'Kun Faya Kun' is from which film?", "Rockstar", ["Tamasha", "Highway", "Rockford"], "medium"],
    ["'Galliyan' (Teri galliyan) is from which film?", "Ek Villain", ["Aashiqui 2", "Hero", "Half Girlfriend"], "medium"],
    ["The Oscar-winning 'Jai Ho' featured in which film?", "Slumdog Millionaire", ["Lagaan", "Dil Se", "Swades"], "easy"],
    ["'Tujhe Dekha To Ye Jaana Sanam' is from which film?", "Dilwale Dulhania Le Jayenge", ["Kuch Kuch Hota Hai", "Dil To Pagal Hai", "Darr"], "easy"],
    ["'Pehla Nasha' is the iconic song from which film?", "Jo Jeeta Wohi Sikandar", ["Qayamat Se Qayamat Tak", "Maine Pyar Kiya", "Dil"], "hard"],
    ["Who is the singer of 'Tum Hi Ho'?", "Arijit Singh", ["Atif Aslam", "Mohit Chauhan", "Armaan Malik"], "easy"],
    ["Who sang the energetic 'Chaiyya Chaiyya'?", "Sukhwinder Singh", ["Sonu Nigam", "Udit Narayan", "Kailash Kher"], "medium"],
    ["Who sang 'Channa Mereya' from Ae Dil Hai Mushkil?", "Arijit Singh", ["Pritam", "Amit Mishra", "Ash King"], "medium"],
    ["Which singer is called the 'Nightingale of India'?", "Lata Mangeshkar", ["Asha Bhosle", "Shreya Ghoshal", "Alka Yagnik"], "easy"],
    ["Who composed the music for 'Lagaan'?", "A. R. Rahman", ["Pritam", "Vishal-Shekhar", "Shankar-Ehsaan-Loy"], "medium"],
    ["Who composed the music for 'Ae Dil Hai Mushkil'?", "Pritam", ["A. R. Rahman", "Amaal Mallik", "Vishal-Shekhar"], "hard"],
    ["Legendary male playback singer known for songs in the 60s-80s, also an actor?", "Kishore Kumar", ["Mohammed Rafi", "Mukesh", "Manna Dey"], "medium"],
    ["Complete the lyric: 'Tujhe dekha to ye jaana sanam, ___'", "pyaar hota hai deewana sanam", ["dil mera kho gaya", "tu hi meri manzil", "ab to mera dil"], "hard"],
    ["Complete the lyric: 'Kuch kuch hota hai, ___'", "tum nahi samjhoge", ["main nahi jaanta", "dil yeh kehta hai", "tum hi ho"], "medium"],
    ["'Kal Ho Naa Ho' title track is from which film?", "Kal Ho Naa Ho", ["Kabhi Khushi Kabhie Gham", "Main Hoon Na", "Veer-Zaara"], "easy"],
    ["'Mere Sapno Ki Rani' is a classic from which film?", "Aradhana", ["Kati Patang", "Amar Prem", "Sholay"], "hard"],
    ["'Why This Kolaveri Di' became a viral hit; who sang it?", "Dhanush", ["Anirudh Ravichander", "Yo Yo Honey Singh", "Benny Dayal"], "hard"],
    ["'Apna Time Aayega' is a rap anthem from which film?", "Gully Boy", ["Sanju", "Udta Punjab", "Sonu Ke Titu Ki Sweety"], "easy"],
    ["Who sang the soulful 'Agar Tum Saath Ho' from Tamasha?", "Arijit Singh", ["Atif Aslam", "Papon", "Jubin Nautiyal"], "medium"],
  ],
  "Bollywood Name Puzzles": [
    ["Complete the actor's name: Shah Rukh ___", "Khan", ["Kapoor", "Roshan", "Devgn"], "easy"],
    ["Complete the actor's name: Amitabh ___", "Bachchan", ["Bhatt", "Kapoor", "Khanna"], "easy"],
    ["Complete the actress's name: Deepika ___", "Padukone", ["Pednekar", "Chopra", "Sharma"], "easy"],
    ["Complete the director's name: Sanjay Leela ___", "Bhansali", ["Johar", "Roshan", "Bhardwaj"], "medium"],
    ["Complete the director's name: Karan ___", "Johar", ["Malhotra", "Anand", "Khanna"], "easy"],
    ["Complete the film title: Kabhi Khushi Kabhie ___", "Gham", ["Pyaar", "Dard", "Khushi"], "easy"],
    ["Complete the film title: Dilwale Dulhania Le ___", "Jayenge", ["Aayenge", "Gaye", "Chalenge"], "easy"],
    ["Complete the film title: Zindagi Na Milegi ___", "Dobara", ["Kabhi", "Yun Hi", "Phir Se"], "medium"],
    ["Complete the film title: Yeh Jawaani Hai ___", "Deewani", ["Mastani", "Suhani", "Diwani"], "medium"],
    ["Complete the film title: Bajrangi ___", "Bhaijaan", ["Bhai", "Bhaiya", "Bossi"], "easy"],
    ["Complete the film title: Bhaag Milkha ___", "Bhaag", ["Daud", "Chal", "Jeet"], "medium"],
    ["Complete the film title: Om Shanti ___", "Om", ["Hari", "Shanti", "Bhagwan"], "easy"],
    ["Complete the film title: Jab We ___", "Met", ["Meet", "Married", "Smiled"], "easy"],
    ["Complete the film title: Rang De ___", "Basanti", ["Holi", "Rangeela", "Sapne"], "medium"],
    ["Complete the film title: Ek Tha ___", "Tiger", ["Sher", "Raja", "Don"], "medium"],
    ["Complete the actor's name: Hrithik ___", "Roshan", ["Kapoor", "Khan", "Kumar"], "easy"],
    ["Complete the actress's name: Aishwarya Rai ___", "Bachchan", ["Kapoor", "Khan", "Padukone"], "medium"],
    ["Complete the film title: Chennai ___", "Express", ["Central", "Mail", "Junction"], "easy"],
    ["Complete the dialogue: 'Mogambo khush ___'", "hua", ["raha", "tha", "nahi"], "medium"],
    ["Complete the dialogue: 'Kitne aadmi ___?'", "the", ["aaye", "hain", "gaye"], "medium"],
  ],
};

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const names = Object.keys(SETS);
  await Question.deleteMany({ category: { $in: names } });
  let total = 0;
  for (const [category, items] of Object.entries(SETS)) {
    const docs = items.map(([q, a, wrong, level]) => {
      const opts = [a, ...wrong];
      // shuffle
      for (let i = opts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [opts[i], opts[j]] = [opts[j], opts[i]];
      }
      const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.easy;
      return {
        category,
        question: q,
        options: opts,
        correctIndex: opts.indexOf(a),
        correctAnswer: a,
        mediaUrl: "",
        mediaType: "text",
        level,
        xpReward: cfg.xp,
        timeLimit: cfg.time,
      };
    });
    await Question.insertMany(docs);
    total += docs.length;
    console.log(`  ${category}: ${docs.length}`);
  }
  console.log(`\nSeeded ${total} curated questions across ${names.length} categories.`);
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
