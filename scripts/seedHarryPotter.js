/**
 * Harry Potter trivia — 100 curated questions. Run: node scripts/seedHarryPotter.js
 * Item format: [question, correctAnswer, [wrong1, wrong2, wrong3], level]
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Question = require("../models/Question");

const LEVEL_CONFIG = { easy: { xp: 20, time: 12 }, medium: { xp: 40, time: 10 }, hard: { xp: 80, time: 8 } };
const CATEGORY = "Harry Potter";

const Q = [
  ["What is the name of Harry Potter's pet owl?", "Hedwig", ["Errol", "Pigwidgeon", "Hermes"], "easy"],
  ["Which Hogwarts house does Harry belong to?", "Gryffindor", ["Slytherin", "Ravenclaw", "Hufflepuff"], "easy"],
  ["Who are Harry's two best friends?", "Ron and Hermione", ["Neville and Luna", "Fred and George", "Draco and Crabbe"], "easy"],
  ["What is Hermione's surname?", "Granger", ["Lovegood", "Patil", "Brown"], "easy"],
  ["What shape is the scar on Harry's forehead?", "A lightning bolt", ["A star", "A crescent", "A cross"], "easy"],
  ["Who is the Headmaster of Hogwarts for most of the series?", "Albus Dumbledore", ["Severus Snape", "Minerva McGonagall", "Cornelius Fudge"], "easy"],
  ["What is the name of the half-giant Hogwarts gamekeeper?", "Rubeus Hagrid", ["Argus Filch", "Horace Slughorn", "Aberforth"], "easy"],
  ["What is the dark wizard antagonist's most feared name?", "Lord Voldemort", ["Gellert Grindelwald", "Salazar Slytherin", "Tom Brown"], "easy"],
  ["What is Voldemort's original birth name?", "Tom Marvolo Riddle", ["Tom Marvolo Gaunt", "Thomas Riddle Jr.", "Marvolo Tom Riddle"], "medium"],
  ["What is the name of Harry's school?", "Hogwarts", ["Beauxbatons", "Durmstrang", "Ilvermorny"], "easy"],
  ["What is the name of the wizarding bank?", "Gringotts", ["Galleon Hall", "Knutsbank", "Wizengamot"], "easy"],
  ["Which creatures run Gringotts bank?", "Goblins", ["House-elves", "Centaurs", "Trolls"], "easy"],
  ["From which platform does the Hogwarts Express depart?", "Platform Nine and Three-Quarters", ["Platform Nine and a Half", "Platform Ten", "Platform Nine"], "easy"],
  ["What is the wizarding shopping street in London called?", "Diagon Alley", ["Knockturn Alley", "Hogsmeade", "Godric's Hollow"], "easy"],
  ["What is the name of the wand shop in Diagon Alley?", "Ollivanders", ["Flourish and Blotts", "Madam Malkin's", "Gringotts"], "medium"],
  ["What is the core of Harry's wand?", "A phoenix feather", ["A dragon heartstring", "A unicorn hair", "A veela hair"], "medium"],
  ["What is the name of Dumbledore's phoenix?", "Fawkes", ["Hedwig", "Norbert", "Buckbeak"], "medium"],
  ["What is the name of Voldemort's snake?", "Nagini", ["Aragog", "Basilisk", "Salazar"], "easy"],
  ["What are Voldemort's followers collectively called?", "Death Eaters", ["The Order", "The Dark Guard", "Snatchers"], "easy"],
  ["What sport is played on broomsticks at Hogwarts?", "Quidditch", ["Gobstones", "Quodpot", "Broom polo"], "easy"],
  ["What position does Harry play on the Quidditch team?", "Seeker", ["Chaser", "Beater", "Keeper"], "easy"],
  ["Which ball must the Seeker catch to win Quidditch?", "The Golden Snitch", ["The Quaffle", "A Bludger", "The Remembrall"], "easy"],
  ["How many players are on a Quidditch team?", "Seven", ["Six", "Eleven", "Five"], "medium"],
  ["What is the name of the Dursleys' son?", "Dudley", ["Marge", "Piers", "Vernon Jr."], "easy"],
  ["Where does Harry sleep at the Dursleys' house?", "The cupboard under the stairs", ["The attic", "A tent in the garden", "Dudley's second bedroom"], "easy"],
  ["What is the name of Harry's godfather?", "Sirius Black", ["Remus Lupin", "James Potter", "Regulus Black"], "easy"],
  ["What animal does Sirius Black transform into?", "A large black dog", ["A stag", "A wolf", "A rat"], "medium"],
  ["Which professor is secretly a werewolf?", "Remus Lupin", ["Severus Snape", "Gilderoy Lockhart", "Quirinus Quirrell"], "medium"],
  ["What animal does James Potter's Animagus form take?", "A stag", ["A dog", "A rat", "An otter"], "medium"],
  ["What is Ron's pet rat secretly?", "Peter Pettigrew", ["Sirius Black", "Barty Crouch", "Mundungus Fletcher"], "medium"],
  ["What is the disarming spell?", "Expelliarmus", ["Stupefy", "Protego", "Petrificus Totalus"], "easy"],
  ["What is the Killing Curse?", "Avada Kedavra", ["Crucio", "Imperio", "Sectumsempra"], "easy"],
  ["Which spell makes objects levitate?", "Wingardium Leviosa", ["Locomotor", "Mobiliarbus", "Aguamenti"], "easy"],
  ["What spell produces light from a wand tip?", "Lumos", ["Nox", "Incendio", "Lacarnum"], "easy"],
  ["What is the unlocking charm?", "Alohomora", ["Aparecium", "Reducto", "Colloportus"], "medium"],
  ["What spell conjures a Patronus?", "Expecto Patronum", ["Expecto Patronus", "Patronus Maxima", "Riddikulus"], "medium"],
  ["What form does Harry's Patronus take?", "A stag", ["A doe", "An otter", "A phoenix"], "medium"],
  ["What form does Hermione's Patronus take?", "An otter", ["A stag", "A hare", "A cat"], "hard"],
  ["What dark creatures guard the wizard prison Azkaban?", "Dementors", ["Inferi", "Boggarts", "Acromantulas"], "easy"],
  ["What is the name of the wizard prison?", "Azkaban", ["Nurmengard", "Hogsmeade", "Knockturn"], "easy"],
  ["What is the Summoning Charm?", "Accio", ["Reducto", "Depulso", "Wingardium"], "medium"],
  ["What is the Stunning Spell?", "Stupefy", ["Petrificus Totalus", "Impedimenta", "Confundo"], "medium"],
  ["What are the three Unforgivable Curses?", "Avada Kedavra, Crucio, Imperio", ["Sectumsempra, Crucio, Imperio", "Avada Kedavra, Confringo, Imperio", "Crucio, Imperio, Obliviate"], "hard"],
  ["What does the Polyjuice Potion allow you to do?", "Take the appearance of another person", ["Become invisible", "Read minds", "Fly without a broom"], "medium"],
  ["What does the potion Felix Felicis grant the drinker?", "Good luck", ["Invisibility", "Eternal youth", "Super strength"], "medium"],
  ["What is Amortentia?", "The most powerful love potion", ["A truth serum", "A sleeping draught", "A healing potion"], "medium"],
  ["What is Veritaserum used for?", "Forcing someone to tell the truth", ["Curing poison", "Granting luck", "Causing sleep"], "medium"],
  ["What deadly creature lurks in the Chamber of Secrets?", "A Basilisk", ["A Hungarian Horntail", "An Acromantula", "A Hippogriff"], "easy"],
  ["With what does Harry kill the Basilisk?", "Godric Gryffindor's sword", ["A wand", "Hagrid's crossbow", "Fawkes' talon"], "medium"],
  ["Whose diary opens the Chamber of Secrets in Harry's second year?", "Tom Riddle's", ["Ginny Weasley's", "Lucius Malfoy's", "Salazar Slytherin's"], "medium"],
  ["How many Horcruxes did Voldemort intend to create from his soul?", "Seven (split into seven pieces)", ["Five", "Three", "Twelve"], "hard"],
  ["Which of these is NOT one of Voldemort's Horcruxes?", "The Sorting Hat", ["Tom Riddle's diary", "Marvolo Gaunt's ring", "Helga Hufflepuff's cup"], "hard"],
  ["What tournament is held in 'Harry Potter and the Goblet of Fire'?", "The Triwizard Tournament", ["The Quidditch World Cup", "The Wizarding Games", "The House Cup"], "easy"],
  ["Which three schools compete in the Triwizard Tournament?", "Hogwarts, Beauxbatons and Durmstrang", ["Hogwarts, Ilvermorny and Durmstrang", "Hogwarts, Beauxbatons and Salem", "Hogwarts, Mahoutokoro and Durmstrang"], "medium"],
  ["Who is the Durmstrang champion and famous Quidditch Seeker?", "Viktor Krum", ["Cedric Diggory", "Roger Davies", "Oliver Wood"], "medium"],
  ["Which Hufflepuff student is a Hogwarts Triwizard champion who dies?", "Cedric Diggory", ["Justin Finch-Fletchley", "Ernie Macmillan", "Zacharias Smith"], "medium"],
  ["Who is the toad-like Ministry official who becomes a hated professor?", "Dolores Umbridge", ["Rita Skeeter", "Bellatrix Lestrange", "Pomona Sprout"], "medium"],
  ["What is the name of the secret defense group Harry trains?", "Dumbledore's Army", ["The Order of the Phoenix", "The Auror Squad", "The Marauders"], "medium"],
  ["What organization, founded by Dumbledore, opposes Voldemort?", "The Order of the Phoenix", ["The Ministry of Magic", "Dumbledore's Army", "The Wizengamot"], "medium"],
  ["What are the three Deathly Hallows?", "Elder Wand, Resurrection Stone, Invisibility Cloak", ["Elder Wand, Philosopher's Stone, Cloak", "Time-Turner, Stone, Cloak", "Elder Wand, Stone, Marauder's Map"], "medium"],
  ["What is the most powerful wand in existence called?", "The Elder Wand", ["The Death Stick's rival", "The Phoenix Wand", "The Hallow Wand"], "medium"],
  ["Which Deathly Hallow has Harry possessed since his first year?", "The Invisibility Cloak", ["The Elder Wand", "The Resurrection Stone", "The Marauder's Map"], "medium"],
  ["Who kills Albus Dumbledore?", "Severus Snape", ["Draco Malfoy", "Bellatrix Lestrange", "Voldemort"], "medium"],
  ["For whom did Snape harbor a lifelong love?", "Lily Potter (Evans)", ["Narcissa Malfoy", "Minerva McGonagall", "Petunia Evans"], "medium"],
  ["What form does Snape's Patronus take, matching Lily's?", "A doe", ["A stag", "A wolf", "A phoenix"], "hard"],
  ["What kind of creature is Dobby?", "A house-elf", ["A goblin", "A centaur", "A boggart"], "easy"],
  ["Who frees Dobby by tricking Lucius Malfoy with a sock?", "Harry", ["Ron", "Dumbledore", "Hermione"], "medium"],
  ["Who kills Dobby?", "Bellatrix Lestrange", ["Voldemort", "Greyback", "Lucius Malfoy"], "hard"],
  ["Who kills Bellatrix Lestrange in the Battle of Hogwarts?", "Molly Weasley", ["Hermione", "Ginny", "McGonagall"], "medium"],
  ["Which Weasley twin dies in the Battle of Hogwarts?", "Fred", ["George", "Percy", "Charlie"], "medium"],
  ["What joke shop do Fred and George Weasley open?", "Weasleys' Wizard Wheezes", ["Zonko's Joke Shop", "Honeydukes", "Gambol and Japes"], "medium"],
  ["Who created the Philosopher's (Sorcerer's) Stone?", "Nicolas Flamel", ["Albus Dumbledore", "Salazar Slytherin", "Newt Scamander"], "medium"],
  ["What does the Elixir of Life made from the Stone grant?", "Immortality", ["Invisibility", "Great wealth only", "Flight"], "medium"],
  ["What is the name of the three-headed dog guarding the Stone?", "Fluffy", ["Fang", "Norbert", "Cerberus"], "medium"],
  ["Which professor had Voldemort's face on the back of his head?", "Quirrell", ["Snape", "Lockhart", "Lupin"], "medium"],
  ["What does the Mirror of Erised show the viewer?", "Their deepest desire", ["The future", "The past", "Their greatest fear"], "medium"],
  ["What is the name of the room that appears only when needed?", "The Room of Requirement", ["The Chamber of Secrets", "The Hall of Wishes", "The Vanishing Room"], "medium"],
  ["What is the name of Hermione's cat?", "Crookshanks", ["Mrs. Norris", "Crookback", "Tibbles"], "medium"],
  ["What is the name of Filch's cat?", "Mrs. Norris", ["Crookshanks", "Tibbles", "Snowy"], "medium"],
  ["Who is the poltergeist that torments Hogwarts students?", "Peeves", ["The Bloody Baron", "Nearly Headless Nick", "Moaning Myrtle"], "medium"],
  ["Which ghost haunts a girls' bathroom at Hogwarts?", "Moaning Myrtle", ["The Grey Lady", "The Fat Friar", "Nearly Headless Nick"], "medium"],
  ["What is the Gryffindor house ghost commonly called?", "Nearly Headless Nick", ["The Bloody Baron", "The Fat Friar", "Peeves"], "medium"],
  ["What giant spider lives in the Forbidden Forest, raised by Hagrid?", "Aragog", ["Nagini", "Mosag", "Shelob"], "hard"],
  ["What is the name of the Whomping Willow's purpose / what does it hide?", "A passage to the Shrieking Shack", ["A Horcrux", "Dumbledore's office", "The Chamber"], "hard"],
  ["What does the Marauder's Map show?", "Everyone's location within Hogwarts", ["The future", "Hidden treasure", "Spell instructions"], "medium"],
  ["What phrase activates the Marauder's Map?", "I solemnly swear that I am up to no good", ["Open Sesame", "Reveal your secrets", "Lumos Maxima"], "hard"],
  ["What phrase wipes the Marauder's Map clean?", "Mischief managed", ["Nox", "Map's end", "All done"], "hard"],
  ["What is the name of the Weasley family home?", "The Burrow", ["Shell Cottage", "Grimmauld Place", "Spinner's End"], "medium"],
  ["What is the address of the Order of the Phoenix headquarters?", "Number 12, Grimmauld Place", ["The Burrow", "Hogsmeade", "Godric's Hollow"], "hard"],
  ["Which Weasley brother works with dragons in Romania?", "Charlie", ["Bill", "Percy", "Fred"], "hard"],
  ["Whom does Bill Weasley marry?", "Fleur Delacour", ["Tonks", "Angelina Johnson", "Penelope Clearwater"], "hard"],
  ["What metamorphmagus Auror marries Remus Lupin?", "Nymphadora Tonks", ["Hestia Jones", "Emmeline Vance", "Andromeda"], "hard"],
  ["Who becomes Harry's wife at the end of the series?", "Ginny Weasley", ["Hermione", "Cho Chang", "Luna Lovegood"], "easy"],
  ["Whom does Ron Weasley marry?", "Hermione Granger", ["Lavender Brown", "Padma Patil", "Fleur"], "easy"],
  ["What is the name of Harry and Ginny's middle child?", "Albus Severus Potter", ["James Sirius Potter", "Remus Potter", "Albus Rubeus Potter"], "hard"],
  ["What does Neville Longbottom famously destroy in the final battle?", "Nagini (with the sword of Gryffindor)", ["The Elder Wand", "The diary", "The locket"], "medium"],
  ["What plant does Neville excel at studying?", "Herbology", ["Potions", "Divination", "Charms"], "medium"],
  ["Which professor teaches Potions before becoming Headmaster of Slytherin's... i.e. is the Potions Master early on?", "Severus Snape", ["Horace Slughorn", "Pomona Sprout", "Filius Flitwick"], "easy"],
  ["Who teaches Transfiguration and heads Gryffindor House?", "Minerva McGonagall", ["Pomona Sprout", "Filius Flitwick", "Sybill Trelawney"], "easy"],
  ["Who teaches Divination at Hogwarts?", "Sybill Trelawney", ["Minerva McGonagall", "Charity Burbage", "Septima Vector"], "hard"],
  ["What is the name of the village students visit near Hogwarts?", "Hogsmeade", ["Godric's Hollow", "Ottery St Catchpole", "Little Whinging"], "medium"],
  ["What sweet shop is famous in Hogsmeade?", "Honeydukes", ["Florean Fortescue's", "Sugarplum's", "Weasleys' Wheezes"], "medium"],
  ["What pub in Hogsmeade is run by Madam Rosmerta?", "The Three Broomsticks", ["The Hog's Head", "The Leaky Cauldron", "The Boar's Head"], "hard"],
  ["What is the name of the dragon Harry faces in the Triwizard Tournament?", "A Hungarian Horntail", ["A Norwegian Ridgeback", "A Welsh Green", "A Chinese Fireball"], "hard"],
  ["What hippogriff does Hagrid introduce in Harry's third year?", "Buckbeak", ["Fang", "Norbert", "Witherwings Jr."], "medium"],
  ["What is the title of the first book in the series (UK)?", "Harry Potter and the Philosopher's Stone", ["Harry Potter and the Sorcerer's Stone", "Harry Potter and the Chamber of Secrets", "Harry Potter and the Magic Stone"], "easy"],
  ["How many books are there in the main Harry Potter series?", "Seven", ["Eight", "Six", "Five"], "easy"],
  ["Who wrote the Harry Potter book series?", "J. K. Rowling", ["J. R. R. Tolkien", "C. S. Lewis", "Rick Riordan"], "easy"],
  ["What is the name of Harry's mother?", "Lily", ["Petunia", "Molly", "Narcissa"], "easy"],
  ["What is the name of Harry's father?", "James", ["Sirius", "Remus", "Vernon"], "easy"],
  ["Which house values bravery and chivalry above all?", "Gryffindor", ["Slytherin", "Ravenclaw", "Hufflepuff"], "easy"],
  ["Which house values cunning and ambition?", "Slytherin", ["Gryffindor", "Hufflepuff", "Ravenclaw"], "easy"],
  ["Which house values intelligence and wit?", "Ravenclaw", ["Hufflepuff", "Gryffindor", "Slytherin"], "easy"],
  ["What magical object lets one travel back in time (used by Hermione)?", "A Time-Turner", ["A Portkey", "The Resurrection Stone", "A Pensieve"], "medium"],
  ["What device is used to view stored memories?", "A Pensieve", ["A Time-Turner", "An Omnioculars", "A Remembrall"], "medium"],
  ["What object Neville receives reminds him he's forgotten something?", "A Remembrall", ["A Sneakoscope", "A Pensieve", "A Time-Turner"], "hard"],
  ["What is the name of the goblin who helps Harry break into Gringotts?", "Griphook", ["Bogrod", "Ragnok", "Gornuk"], "hard"],
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
    return {
      category: CATEGORY,
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
  console.log(`Seeded ${docs.length} Harry Potter questions.`);
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
