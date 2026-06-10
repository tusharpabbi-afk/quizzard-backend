/**
 * Hand-curated Bollywood TEXT trivia (dialogues, songs, cult movies, actors).
 * Accuracy-first, well-known facts, author-leveled. Replaces "Bollywood Trivia".
 * Run: MONGO_URI="<atlas>" node scripts/seedBollywoodBig.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Question = require("../models/Question");
const { seedCategory } = require("./_seedHelper");

const Q = [
  // ---- Iconic dialogues: name the film ----
  { q: 'Which film features the dialogue "Mogambo khush hua"?', correct: "Mr. India", wrong: ["Shaan", "Karma", "Tridev"], level: "easy" },
  { q: 'The dialogue "Kitne aadmi the?" is from which film?', correct: "Sholay", wrong: ["Deewaar", "Don", "Zanjeer"], level: "easy" },
  { q: 'Which film has the famous line "Picture abhi baaki hai mere dost"?', correct: "Om Shanti Om", wrong: ["Don", "Devdas", "Veer-Zaara"], level: "easy" },
  { q: 'The line "How\'s the josh?" became iconic from which 2019 film?', correct: "Uri: The Surgical Strike", wrong: ["Raazi", "Kesari", "War"], level: "easy" },
  { q: 'Which film features the dialogue "Mere paas maa hai"?', correct: "Deewaar", wrong: ["Sholay", "Trishul", "Kaala Patthar"], level: "medium" },
  { q: '"Don ko pakadna mushkil hi nahi, namumkin hai" is a dialogue from which film?', correct: "Don", wrong: ["Deewaar", "Agneepath", "Baazigar"], level: "medium" },
  { q: 'The courtroom line "Tareekh pe tareekh" is from which 1993 film?', correct: "Damini", wrong: ["Damini 2", "Ghayal", "Andha Kanoon"], level: "medium" },
  { q: '"Bade bade deshon mein aisi chhoti chhoti baatein hoti rehti hain" is from which film?', correct: "Dilwale Dulhania Le Jayenge", wrong: ["Kuch Kuch Hota Hai", "Dil To Pagal Hai", "Pardes"], level: "medium" },
  { q: '"Rishtey mein toh hum tumhare baap lagte hain, naam hai Shahenshah" is from which film?', correct: "Shahenshah", wrong: ["Hum", "Agneepath", "Khuda Gawah"], level: "hard" },
  { q: 'The dialogue "Pushpa, I hate tears" is from which Rajesh Khanna film?', correct: "Amar Prem", wrong: ["Anand", "Aradhana", "Kati Patang"], level: "hard" },
  { q: '"Babumoshai, zindagi badi honi chahiye, lambi nahi" is a famous line from which film?', correct: "Anand", wrong: ["Bawarchi", "Mili", "Abhimaan"], level: "hard" },
  { q: '"All izz well" is the feel-good mantra from which film?', correct: "3 Idiots", wrong: ["PK", "Munna Bhai MBBS", "Taare Zameen Par"], level: "easy" },

  // ---- Cult / classic films ----
  { q: "Who directed the 1975 classic Sholay?", correct: "Ramesh Sippy", wrong: ["Yash Chopra", "Manmohan Desai", "Prakash Mehra"], level: "medium" },
  { q: "Who played the villain Gabbar Singh in Sholay?", correct: "Amjad Khan", wrong: ["Amrish Puri", "Pran", "Danny Denzongpa"], level: "medium" },
  { q: "In which year was Sholay released?", correct: "1975", wrong: ["1971", "1978", "1980"], level: "medium" },
  { q: "Who played Anarkali in the 1960 epic Mughal-e-Azam?", correct: "Madhubala", wrong: ["Nargis", "Meena Kumari", "Waheeda Rehman"], level: "hard" },
  { q: "Mother India (1957) was directed by whom?", correct: "Mehboob Khan", wrong: ["Bimal Roy", "Raj Kapoor", "Guru Dutt"], level: "hard" },
  { q: "Which 1995 film holds the record for the longest theatrical run in India (Maratha Mandir, Mumbai)?", correct: "Dilwale Dulhania Le Jayenge", wrong: ["Hum Aapke Hain Koun..!", "Maine Pyar Kiya", "Kuch Kuch Hota Hai"], level: "medium" },
  { q: "Lagaan (2001) was directed by whom?", correct: "Ashutosh Gowariker", wrong: ["Aamir Khan", "Sanjay Leela Bhansali", "Rakeysh Omprakash Mehra"], level: "medium" },
  { q: "Lagaan earned a nomination at which international awards?", correct: "Academy Awards (Oscars)", wrong: ["BAFTA only", "Golden Globe (won)", "Grammy"], level: "medium" },
  { q: "Dil Chahta Hai (2001) marked the directorial debut of whom?", correct: "Farhan Akhtar", wrong: ["Zoya Akhtar", "Karan Johar", "Ashutosh Gowariker"], level: "medium" },
  { q: "Gangs of Wasseypur was directed by whom?", correct: "Anurag Kashyap", wrong: ["Vishal Bhardwaj", "Tigmanshu Dhulia", "Sriram Raghavan"], level: "medium" },
  { q: "Andaz Apna Apna (1994) paired Aamir Khan with which other actor?", correct: "Salman Khan", wrong: ["Shah Rukh Khan", "Govinda", "Akshay Kumar"], level: "medium" },
  { q: "Which film featured Aamir Khan as the alien-like 'PK'?", correct: "PK", wrong: ["3 Idiots", "Dhoom 3", "Talaash"], level: "easy" },
  { q: "In Bajrangi Bhaijaan, Salman Khan helps a mute girl return to which country?", correct: "Pakistan", wrong: ["Bangladesh", "Nepal", "Afghanistan"], level: "easy" },
  { q: "Anand (1971) starred Rajesh Khanna alongside which actor as Dr. Bhaskar?", correct: "Amitabh Bachchan", wrong: ["Dharmendra", "Vinod Khanna", "Shashi Kapoor"], level: "hard" },

  // ---- Actors / actresses ----
  { q: "Which actor is popularly called the 'Badshah of Bollywood' / 'King Khan'?", correct: "Shah Rukh Khan", wrong: ["Salman Khan", "Aamir Khan", "Akshay Kumar"], level: "easy" },
  { q: "Which actor is widely known by the nickname 'Bhaijaan'?", correct: "Salman Khan", wrong: ["Shah Rukh Khan", "Aamir Khan", "Sanjay Dutt"], level: "easy" },
  { q: "Aamir Khan played the wrestler-father Mahavir Singh Phogat in which film?", correct: "Dangal", wrong: ["Sultan", "Mary Kom", "Brothers"], level: "easy" },
  { q: "Who played the lead 'Rancho' in 3 Idiots?", correct: "Aamir Khan", wrong: ["Shah Rukh Khan", "R. Madhavan", "Sharman Joshi"], level: "easy" },
  { q: "Hrithik Roshan made his lead acting debut in which 2000 film?", correct: "Kaho Naa... Pyaar Hai", wrong: ["Fiza", "Mission Kashmir", "Koi... Mil Gaya"], level: "medium" },
  { q: "Deepika Padukone made her Bollywood debut opposite Shah Rukh Khan in which film?", correct: "Om Shanti Om", wrong: ["Chennai Express", "Bachna Ae Haseeno", "Love Aaj Kal"], level: "medium" },
  { q: "Which actress played 'Geet' in Jab We Met?", correct: "Kareena Kapoor", wrong: ["Katrina Kaif", "Priyanka Chopra", "Deepika Padukone"], level: "easy" },
  { q: "Kangana Ranaut won a National Award for Best Actress for which 2014 film?", correct: "Queen", wrong: ["Tanu Weds Manu", "Fashion", "Manikarnika"], level: "medium" },
  { q: "Alia Bhatt played the lead in which 2022 Sanjay Leela Bhansali film?", correct: "Gangubai Kathiawadi", wrong: ["Padmaavat", "Heeramandi", "Gully Boy"], level: "easy" },
  { q: "Which actress is famously called the 'Dhak Dhak girl'?", correct: "Madhuri Dixit", wrong: ["Sridevi", "Juhi Chawla", "Karisma Kapoor"], level: "medium" },
  { q: "Sunny Deol played Tara Singh in which blockbuster 2001 film?", correct: "Gadar: Ek Prem Katha", wrong: ["Border", "Ghatak", "The Hero"], level: "medium" },
  { q: "Sanjay Dutt plays the lovable gangster 'Munna' in which film series?", correct: "Munna Bhai", wrong: ["Vaastav", "Khalnayak", "Agneepath"], level: "easy" },
  { q: "Amitabh Bachchan's 'Angry Young Man' image was launched by which 1973 film?", correct: "Zanjeer", wrong: ["Deewaar", "Sholay", "Don"], level: "hard" },
  { q: "Ranbir Kapoor played a struggling musician in which 2011 Imtiaz Ali film?", correct: "Rockstar", wrong: ["Tamasha", "Barfi!", "Ae Dil Hai Mushkil"], level: "medium" },
  { q: "Which acting family is often called the 'first family of Bollywood'?", correct: "The Kapoor family", wrong: ["The Khan family", "The Bachchan family", "The Deol family"], level: "medium" },
  { q: "Ranveer Singh played the rapper 'Murad' in which 2019 film?", correct: "Gully Boy", wrong: ["Band Baaja Baaraat", "Befikre", "Lootera"], level: "medium" },
  { q: "Which actor is nicknamed the 'Greek God' of Bollywood?", correct: "Hrithik Roshan", wrong: ["John Abraham", "Arjun Rampal", "Shahid Kapoor"], level: "medium" },
  { q: "Vidya Balan won a National Award for playing a pregnant woman searching for her husband in which film?", correct: "Kahaani", wrong: ["The Dirty Picture", "Ishqiya", "No One Killed Jessica"], level: "hard" },

  // ---- Songs: name the film ----
  { q: 'The song "Chaiyya Chaiyya" (filmed on a moving train) is from which film?', correct: "Dil Se", wrong: ["Dil To Pagal Hai", "Taal", "Refugee"], level: "medium" },
  { q: 'The song "Tujhe Dekha To Yeh Jaana Sanam" is from which film?', correct: "Dilwale Dulhania Le Jayenge", wrong: ["Darr", "Dil To Pagal Hai", "Chandni"], level: "medium" },
  { q: 'The song "Ye Dosti Hum Nahi Todenge" is from which film?', correct: "Sholay", wrong: ["Dosti", "Yaarana", "Namak Haraam"], level: "medium" },
  { q: 'The hit song "Tum Hi Ho" is from which 2013 film?', correct: "Aashiqui 2", wrong: ["Aashiqui", "Ek Villain", "Hamari Adhuri Kahani"], level: "easy" },
  { q: 'The song "Gerua" featuring Shah Rukh Khan and Kajol is from which film?', correct: "Dilwale", wrong: ["My Name Is Khan", "Dil Se", "Chennai Express"], level: "medium" },
  { q: 'The anthem "Apna Time Aayega" is from which 2019 film?', correct: "Gully Boy", wrong: ["Sonu Ke Titu Ki Sweety", "Article 15", "Super 30"], level: "medium" },
  { q: 'The dance number "Ghungroo" featuring Hrithik Roshan is from which 2019 film?', correct: "War", wrong: ["Bang Bang!", "Kaabil", "Super 30"], level: "medium" },
  { q: 'The party song "Kala Chashma" is from which film?', correct: "Baar Baar Dekho", wrong: ["Befikre", "Dishoom", "Half Girlfriend"], level: "medium" },
  { q: "Which singer, called the 'Nightingale of India', recorded thousands of Bollywood songs?", correct: "Lata Mangeshkar", wrong: ["Asha Bhosle", "Geeta Dutt", "Shamshad Begum"], level: "easy" },
  { q: '"Tum Hi Ho" from Aashiqui 2 was sung by which playback singer?', correct: "Arijit Singh", wrong: ["Atif Aslam", "Mohit Chauhan", "Ankit Tiwari"], level: "easy" },
  { q: "A. R. Rahman won two Oscars for the score and song of which 2008 film?", correct: "Slumdog Millionaire", wrong: ["Lagaan", "Rang De Basanti", "Taal"], level: "hard" },
  { q: 'The song "Senorita" is from which 2011 Zoya Akhtar road-trip film?', correct: "Zindagi Na Milegi Dobara", wrong: ["Dil Dhadakne Do", "Gully Boy", "Luck by Chance"], level: "hard" },

  // ---- More easy ----
  { q: "Which Khan is nicknamed 'Mr. Perfectionist'?", correct: "Aamir Khan", wrong: ["Shah Rukh Khan", "Salman Khan", "Saif Ali Khan"], level: "easy" },
  { q: "In Chak De! India, Shah Rukh Khan coaches the women's national team in which sport?", correct: "Hockey", wrong: ["Cricket", "Football", "Kabaddi"], level: "easy" },
  { q: "The cop 'Chulbul Pandey' is the hero of which film franchise?", correct: "Dabangg", wrong: ["Singham", "Simmba", "Rowdy Rathore"], level: "easy" },
  { q: "Which actor plays the superhero in the film 'Krrish'?", correct: "Hrithik Roshan", wrong: ["Shah Rukh Khan", "Tiger Shroff", "Ranveer Singh"], level: "easy" },
  { q: "The biopic 'Sanju' (2018), starring Ranbir Kapoor, is based on which actor's life?", correct: "Sanjay Dutt", wrong: ["Sunil Dutt", "Rishi Kapoor", "Govinda"], level: "easy" },
  { q: "The cop franchise 'Singham' stars which actor in the title role?", correct: "Ajay Devgn", wrong: ["Akshay Kumar", "Salman Khan", "Suniel Shetty"], level: "easy" },
  { q: "Which actress won Miss World 2000 before becoming a Bollywood and global star?", correct: "Priyanka Chopra", wrong: ["Aishwarya Rai", "Lara Dutta", "Sushmita Sen"], level: "medium" },
  { q: "Aishwarya Rai won which international beauty pageant in 1994?", correct: "Miss World", wrong: ["Miss Universe", "Miss Earth", "Miss International"], level: "medium" },

  // ---- More medium ----
  { q: "Kuch Kuch Hota Hai (1998) marked the directorial debut of whom?", correct: "Karan Johar", wrong: ["Aditya Chopra", "Sanjay Leela Bhansali", "Farah Khan"], level: "medium" },
  { q: "Taare Zameen Par (2007), about a dyslexic child, was directed by whom?", correct: "Aamir Khan", wrong: ["Rajkumar Hirani", "Ashutosh Gowariker", "Imtiaz Ali"], level: "medium" },
  { q: "Bajirao Mastani and Padmaavat were both directed by whom?", correct: "Sanjay Leela Bhansali", wrong: ["Ashutosh Gowariker", "Karan Johar", "Rohit Shetty"], level: "medium" },
  { q: "In Andhadhun (2018), Ayushmann Khurrana plays a pianist who pretends to be what?", correct: "Blind", wrong: ["Deaf", "Mute", "Amnesiac"], level: "medium" },
  { q: "The horror-comedy 'Stree' (2018) stars which actor in the lead?", correct: "Rajkummar Rao", wrong: ["Ayushmann Khurrana", "Vicky Kaushal", "Kartik Aaryan"], level: "medium" },
  { q: "The comedy franchise 'Golmaal' is directed by whom?", correct: "Rohit Shetty", wrong: ["Anees Bazmee", "Priyadarshan", "David Dhawan"], level: "medium" },
  { q: "The 2006 sequel to Munna Bhai M.B.B.S. was titled what?", correct: "Lage Raho Munna Bhai", wrong: ["Munna Bhai Returns", "Circuit", "Munna Bhai 2"], level: "medium" },
  { q: "In Barfi! (2012), Ranbir Kapoor plays a character who is deaf and what?", correct: "Mute", wrong: ["Blind", "Paralysed", "Autistic"], level: "medium" },

  // ---- More hard (classic era) ----
  { q: "Guru Dutt directed and starred in which acclaimed 1957 film about a struggling poet?", correct: "Pyaasa", wrong: ["Kaagaz Ke Phool", "Pyaar", "Sahib Bibi Aur Ghulam"], level: "hard" },
  { q: "Which actor is revered as the 'Tragedy King' of Hindi cinema?", correct: "Dilip Kumar", wrong: ["Raj Kapoor", "Dev Anand", "Guru Dutt"], level: "hard" },
  { q: "Awaara (1951), a global hit, was directed by and starred whom?", correct: "Raj Kapoor", wrong: ["Dilip Kumar", "Dev Anand", "Bimal Roy"], level: "hard" },
  { q: "Who made her acting debut as the lead in Raj Kapoor's 'Bobby' (1973)?", correct: "Dimple Kapadia", wrong: ["Hema Malini", "Zeenat Aman", "Rekha"], level: "hard" },
  { q: "In Mughal-e-Azam, Emperor Akbar was played by which actor?", correct: "Prithviraj Kapoor", wrong: ["Dilip Kumar", "Raj Kapoor", "Ashok Kumar"], level: "hard" },
  { q: "Filmmaker Satyajit Ray received an Honorary Academy Award in which year, shortly before his death?", correct: "1992", wrong: ["1985", "1990", "1995"], level: "hard" },
  { q: "Vidya Balan portrayed which actress in the biographical film 'The Dirty Picture'?", correct: "Silk Smitha (inspired by)", wrong: ["Helen", "Parveen Babi", "Madhubala"], level: "hard" },

  // ---- Batch 2: more films, actors, songs ----
  { q: "Which superstar headlined the 2023 blockbusters 'Pathaan' and 'Jawan'?", correct: "Shah Rukh Khan", wrong: ["Salman Khan", "Hrithik Roshan", "Ranveer Singh"], level: "easy" },
  { q: "Who plays the lead in the 2023 action film 'Animal'?", correct: "Ranbir Kapoor", wrong: ["Ranveer Singh", "Vicky Kaushal", "Shahid Kapoor"], level: "medium" },
  { q: "The film 'Kabir Singh' (2019) stars which actor in the title role?", correct: "Shahid Kapoor", wrong: ["Ranbir Kapoor", "Arjun Kapoor", "Aditya Roy Kapur"], level: "easy" },
  { q: "Who played the lead pair with Shah Rukh Khan in Dilwale Dulhania Le Jayenge?", correct: "Kajol", wrong: ["Rani Mukerji", "Madhuri Dixit", "Juhi Chawla"], level: "easy" },
  { q: "Which actor played Veeru in Sholay?", correct: "Dharmendra", wrong: ["Amitabh Bachchan", "Vinod Khanna", "Shatrughan Sinha"], level: "medium" },
  { q: "Sanjeev Kumar played the armless 'Thakur Baldev Singh' in which film?", correct: "Sholay", wrong: ["Deewaar", "Trishul", "Khoon Pasina"], level: "hard" },
  { q: "Salman Khan's breakthrough lead role came in which 1989 romance?", correct: "Maine Pyar Kiya", wrong: ["Hum Aapke Hain Koun..!", "Saajan", "Patthar Ke Phool"], level: "medium" },
  { q: "Aamir Khan's first lead role was in which 1988 romantic hit?", correct: "Qayamat Se Qayamat Tak", wrong: ["Dil", "Raja Hindustani", "Jo Jeeta Wohi Sikandar"], level: "hard" },
  { q: "DDLJ (1995) was the directorial debut of whom?", correct: "Aditya Chopra", wrong: ["Karan Johar", "Yash Chopra", "Sooraj Barjatya"], level: "medium" },
  { q: "Which 2012 film launched the careers of Alia Bhatt, Varun Dhawan and Sidharth Malhotra?", correct: "Student of the Year", wrong: ["2 States", "Humpty Sharma Ki Dulhania", "Kapoor & Sons"], level: "medium" },
  { q: "In Padmaavat, Ranveer Singh played which menacing ruler?", correct: "Alauddin Khilji", wrong: ["Maharawal Ratan Singh", "Bajirao", "Khilji's general"], level: "medium" },
  { q: "Who directed Zindagi Na Milegi Dobara (2011)?", correct: "Zoya Akhtar", wrong: ["Farhan Akhtar", "Reema Kagti", "Imtiaz Ali"], level: "medium" },
  { q: "The villain Mogambo in Mr. India was played by which actor?", correct: "Amrish Puri", wrong: ["Amjad Khan", "Pran", "Kulbhushan Kharbanda"], level: "medium" },
  { q: "Shah Rukh Khan played the title role in which 2002 Sanjay Leela Bhansali tragedy?", correct: "Devdas", wrong: ["Black", "Saawariya", "Guzaarish"], level: "medium" },
  { q: "Which film won the 2023 National Film Award buzz with Vikrant Massey playing an IPS aspirant?", correct: "12th Fail", wrong: ["Sirf Ek Bandaa Kaafi Hai", "Article 15", "Super 30"], level: "hard" },
  { q: "Ranbir Kapoor and Alia Bhatt starred together in which 2022 fantasy film?", correct: "Brahmastra", wrong: ["Shamshera", "Kalank", "Sadak 2"], level: "medium" },
  { q: "Dharmendra's two actor sons are Sunny Deol and which other?", correct: "Bobby Deol", wrong: ["Abhay Deol", "Jeetendra", "Akshaye Khanna"], level: "medium" },
  { q: 'The item song "Sheila Ki Jawani" is from which film?', correct: "Tees Maar Khan", wrong: ["Dabangg", "Wanted", "Ready"], level: "medium" },
  { q: 'The song "Munni Badnaam Hui" is from which 2010 film?', correct: "Dabangg", wrong: ["Wanted", "Bodyguard", "Dabangg 2"], level: "medium" },
  { q: 'The classic song "Mehbooba Mehbooba" appears in which film?', correct: "Sholay", wrong: ["Don", "Hum Kisise Kum Naheen", "Caravan"], level: "hard" },
  { q: "Gully Boy was India's official entry to the Oscars for which year's ceremony?", correct: "2020", wrong: ["2019", "2021", "2018"], level: "hard" },
  { q: "Kabhi Khushi Kabhie Gham (2001) was directed by whom?", correct: "Karan Johar", wrong: ["Aditya Chopra", "Sooraj Barjatya", "Sanjay Leela Bhansali"], level: "medium" },
  { q: "Hum Aapke Hain Koun..! (1994) paired Salman Khan with which actress?", correct: "Madhuri Dixit", wrong: ["Sridevi", "Juhi Chawla", "Karisma Kapoor"], level: "medium" },
  { q: "The comic villain 'Crime Master Gogo' in Andaz Apna Apna was played by whom?", correct: "Shakti Kapoor", wrong: ["Paresh Rawal", "Gulshan Grover", "Kader Khan"], level: "hard" },
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await seedCategory(mongoose, Question, "Bollywood Trivia", Q);
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
