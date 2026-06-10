/**
 * Hand-curated Cricket trivia + landmark Cricket Stats. Accuracy-first: general
 * rules/history/famous moments, and only stable all-time records for stats
 * (avoiding volatile current numbers). Author-leveled.
 * Run: MONGO_URI="<atlas>" node scripts/seedCricket.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Question = require("../models/Question");
const { seedCategory } = require("./_seedHelper");

const CRICKET = [
  // Rules & basics
  { q: "How many players are there in a cricket team on the field?", correct: "11", wrong: ["10", "12", "9"], level: "easy" },
  { q: "How many balls are bowled in a standard over?", correct: "6", wrong: ["5", "4", "8"], level: "easy" },
  { q: "A shot that crosses the boundary along the ground scores how many runs?", correct: "4", wrong: ["6", "2", "3"], level: "easy" },
  { q: "Hitting the ball over the boundary on the full scores how many runs?", correct: "6", wrong: ["4", "5", "8"], level: "easy" },
  { q: "A batsman dismissed for zero runs is said to be out for a what?", correct: "Duck", wrong: ["Blob", "Goose", "Zero ball"], level: "easy" },
  { q: "Taking three wickets in three consecutive balls is called a what?", correct: "Hat-trick", wrong: ["Triple", "Treble", "Trio"], level: "easy" },
  { q: "How many overs per side are bowled in a One Day International (ODI)?", correct: "50", wrong: ["40", "60", "45"], level: "easy" },
  { q: "How many overs per side are bowled in a T20 match?", correct: "20", wrong: ["25", "15", "10"], level: "easy" },
  { q: "A standard Test match is scheduled over how many days?", correct: "5", wrong: ["3", "4", "6"], level: "easy" },
  { q: "'LBW' in cricket stands for what?", correct: "Leg Before Wicket", wrong: ["Leg Bye Wide", "Left Bat Wicket", "Long Ball Wide"], level: "easy" },
  { q: "An over in which no runs are scored is called a what?", correct: "Maiden over", wrong: ["Silent over", "Dot over", "Blank over"], level: "medium" },
  { q: "'DRS' in modern cricket stands for what?", correct: "Decision Review System", wrong: ["Dynamic Replay System", "Direct Review Setup", "Delivery Review Service"], level: "easy" },
  { q: "Which fielding position stands beside the wicketkeeper to catch edges?", correct: "Slip", wrong: ["Gully", "Point", "Cover"], level: "medium" },
  { q: "A 'googly' is a deceptive delivery bowled by which type of bowler?", correct: "Leg-spinner", wrong: ["Fast bowler", "Off-spinner", "Medium pacer"], level: "medium" },
  { q: "The 'doosra' is a surprise delivery associated with which type of bowler?", correct: "Off-spinner", wrong: ["Leg-spinner", "Fast bowler", "Swing bowler"], level: "medium" },
  { q: "Which body is the global governing organisation for cricket?", correct: "ICC", wrong: ["FIFA", "BCCI", "MCC"], level: "easy" },

  // History & famous moments
  { q: "Which country won the first-ever Cricket World Cup in 1975?", correct: "West Indies", wrong: ["Australia", "England", "India"], level: "medium" },
  { q: "Which country won the 1983 Cricket World Cup?", correct: "India", wrong: ["West Indies", "England", "Pakistan"], level: "easy" },
  { q: "Who captained India to victory in the 1983 World Cup?", correct: "Kapil Dev", wrong: ["Sunil Gavaskar", "Mohinder Amarnath", "Mansur Ali Khan Pataudi"], level: "medium" },
  { q: "Under which captain did India win the 2011 ODI World Cup?", correct: "MS Dhoni", wrong: ["Virat Kohli", "Sachin Tendulkar", "Gautam Gambhir"], level: "easy" },
  { q: "Which player hit the winning six in the 2011 World Cup final?", correct: "MS Dhoni", wrong: ["Gautam Gambhir", "Yuvraj Singh", "Suresh Raina"], level: "medium" },
  { q: "The inaugural ICC T20 World Cup in 2007 was won by which team?", correct: "India", wrong: ["Pakistan", "Australia", "Sri Lanka"], level: "medium" },
  { q: "The 'Ashes' Test series is contested between England and which country?", correct: "Australia", wrong: ["South Africa", "India", "New Zealand"], level: "medium" },
  { q: "The Border-Gavaskar Trophy is played between India and which country?", correct: "Australia", wrong: ["England", "Pakistan", "Sri Lanka"], level: "medium" },
  { q: "Which ground in London is known as the 'Home of Cricket'?", correct: "Lord's", wrong: ["The Oval", "Old Trafford", "Edgbaston"], level: "medium" },
  { q: "The Indian Premier League (IPL) was launched in which year?", correct: "2008", wrong: ["2006", "2010", "2012"], level: "medium" },
  { q: "Sachin Tendulkar is popularly nicknamed the what?", correct: "Master Blaster", wrong: ["Captain Cool", "The Wall", "Hitman"], level: "easy" },
  { q: "Which Indian captain is famously nicknamed 'Captain Cool'?", correct: "MS Dhoni", wrong: ["Sourav Ganguly", "Rahul Dravid", "Virat Kohli"], level: "easy" },
  { q: "Rahul Dravid earned which nickname for his solid Test batting?", correct: "The Wall", wrong: ["The Hitman", "Mr. 360", "The Rock"], level: "medium" },
  { q: "Yuvraj Singh hit six sixes in an over at the 2007 T20 World Cup off which bowler?", correct: "Stuart Broad", wrong: ["James Anderson", "Brett Lee", "Dale Steyn"], level: "hard" },
  { q: "Which country has won the most men's ODI World Cups?", correct: "Australia", wrong: ["India", "West Indies", "England"], level: "medium" },
  { q: "Which IPL franchise does Virat Kohli play for?", correct: "Royal Challengers Bengaluru", wrong: ["Mumbai Indians", "Chennai Super Kings", "Delhi Capitals"], level: "medium" },
  { q: "Which IPL team is captained for years by MS Dhoni?", correct: "Chennai Super Kings", wrong: ["Mumbai Indians", "Rajasthan Royals", "Kolkata Knight Riders"], level: "medium" },
  { q: "Reverse swing is most associated with which condition of the ball?", correct: "An old ball", wrong: ["A new ball", "A wet ball", "A red ball only"], level: "medium" },
  // More basics (easy)
  { q: "A score of 100 runs by a single batsman is called a what?", correct: "Century", wrong: ["Ton-up", "Maximum", "Milestone"], level: "easy" },
  { q: "What are the small wooden pieces resting on top of the stumps called?", correct: "Bails", wrong: ["Pegs", "Caps", "Clips"], level: "easy" },
  { q: "Who officiates and signals decisions on the field in cricket?", correct: "Umpire", wrong: ["Referee", "Marshal", "Steward"], level: "easy" },
  { q: "The Indian national cricket team is popularly called the 'Men in' what?", correct: "Blue", wrong: ["Green", "White", "Maroon"], level: "easy" },
  { q: "Cover drive, pull and hook are all types of what?", correct: "Batting shots", wrong: ["Bowling deliveries", "Fielding positions", "Umpire signals"], level: "easy" },
  { q: "A score of 50 runs by a batsman is called a what?", correct: "Half-century", wrong: ["Mini ton", "Double duck", "Quarter"], level: "easy" },
  // More medium
  { q: "Which nickname belongs to the New Zealand cricket team?", correct: "Black Caps", wrong: ["Proteas", "Tigers", "Lions"], level: "medium" },
  { q: "The South African cricket team is nicknamed the what?", correct: "Proteas", wrong: ["Black Caps", "Kangaroos", "Windies"], level: "medium" },
  { q: "A delivery aimed right at the batsman's feet or base of the stumps is called a what?", correct: "Yorker", wrong: ["Bouncer", "Full toss", "Long hop"], level: "medium" },
  { q: "A short ball that rises sharply towards the batsman's head is called a what?", correct: "Bouncer", wrong: ["Yorker", "Beamer", "Half-volley"], level: "medium" },
  { q: "The method used to revise targets in rain-affected limited-overs games is named after Duckworth and whom?", correct: "Lewis", wrong: ["Stern", "Hawk", "Snicko"], level: "medium" },
  { q: "Verbally taunting an opposing player to break their concentration is known as what?", correct: "Sledging", wrong: ["Chirping", "Baiting", "Needling"], level: "medium" },
  { q: "India's premier first-class domestic tournament is called the what?", correct: "Ranji Trophy", wrong: ["Duleep Trophy", "Irani Cup", "Vijay Hazare Trophy"], level: "medium" },
  { q: "Sir Vivian Richards, one of the greatest batsmen, played for which country?", correct: "West Indies", wrong: ["England", "Australia", "South Africa"], level: "medium" },
  { q: "Which captain led India to the 2024 T20 World Cup title?", correct: "Rohit Sharma", wrong: ["Virat Kohli", "Hardik Pandya", "KL Rahul"], level: "medium" },
  { q: "Which legendary batsman is the only player to be named in the ICC's all-time XI as captain and is from Australia, known as 'The Don'?", correct: "Don Bradman", wrong: ["Steve Waugh", "Ricky Ponting", "Greg Chappell"], level: "medium" },
  // More hard
  { q: "The infamous 1932-33 'Bodyline' Test series was contested between Australia and which team?", correct: "England", wrong: ["South Africa", "West Indies", "New Zealand"], level: "hard" },
  { q: "Who was the first batsman to hit six sixes in a single first-class over (1968)?", correct: "Garfield Sobers", wrong: ["Ravi Shastri", "Viv Richards", "Clive Lloyd"], level: "hard" },
  { q: "Which Indian bowler took the first Test hat-trick by an Indian (2001, vs Australia)?", correct: "Harbhajan Singh", wrong: ["Anil Kumble", "Zaheer Khan", "Javagal Srinath"], level: "hard" },
  { q: "MS Dhoni is the only captain to win all three major ICC white-ball trophies: the ODI World Cup, the T20 World Cup, and which third?", correct: "Champions Trophy", wrong: ["Asia Cup", "Test Championship", "Tri-Series Cup"], level: "hard" },
  { q: "The famous 'Gabba' cricket stadium is located in which Australian city?", correct: "Brisbane", wrong: ["Sydney", "Melbourne", "Perth"], level: "hard" },
  { q: "Kapil Dev's iconic unbeaten 175 in the 1983 World Cup came against which team?", correct: "Zimbabwe", wrong: ["West Indies", "Australia", "England"], level: "hard" },
  { q: "Sachin Tendulkar made his international debut in 1989 against which country?", correct: "Pakistan", wrong: ["Australia", "England", "Sri Lanka"], level: "hard" },
  { q: "Who scored the first century in IPL history (158 not out in 2008)?", correct: "Brendon McCullum", wrong: ["Virender Sehwag", "Chris Gayle", "Adam Gilchrist"], level: "hard" },
  { q: "The supporters' group known as the 'Barmy Army' follow which national cricket team?", correct: "England", wrong: ["Australia", "India", "South Africa"], level: "hard" },

  // ---- Batch 2 ----
  { q: "Which Indian opener is nicknamed the 'Hitman'?", correct: "Rohit Sharma", wrong: ["Shikhar Dhawan", "KL Rahul", "Virender Sehwag"], level: "easy" },
  { q: "How many innings does each team get in a standard Test match?", correct: "2", wrong: ["1", "3", "4"], level: "easy" },
  { q: "Taking five wickets in a single innings is informally called a what?", correct: "Five-for (fifer)", wrong: ["Nelson", "Hat-trick", "Maiden"], level: "medium" },
  { q: "The 'third umpire' makes decisions using what?", correct: "Television replays", wrong: ["A coin toss", "Player votes", "The scorecard"], level: "easy" },
  { q: "Brian Lara and Chris Gayle both played international cricket for which team?", correct: "West Indies", wrong: ["England", "South Africa", "Australia"], level: "easy" },
  { q: "The pitch between the two sets of stumps measures how many yards?", correct: "22", wrong: ["20", "24", "18"], level: "medium" },
  { q: "Which legendary Indian opener is nicknamed the 'Little Master'?", correct: "Sunil Gavaskar", wrong: ["Gundappa Viswanath", "Mohinder Amarnath", "Dilip Vengsarkar"], level: "medium" },
  { q: "Eden Gardens, one of cricket's iconic stadiums, is located in which Indian city?", correct: "Kolkata", wrong: ["Mumbai", "Chennai", "Delhi"], level: "medium" },
  { q: "Shane Warne, one of the greatest bowlers ever, was a master of which craft?", correct: "Leg-spin", wrong: ["Fast bowling", "Off-spin", "Swing bowling"], level: "medium" },
  { q: "Which country won the 2019 ODI World Cup in a dramatic final decided on boundary count?", correct: "England", wrong: ["New Zealand", "Australia", "India"], level: "medium" },
  { q: "The 2019 World Cup final was contested between England and which team?", correct: "New Zealand", wrong: ["Australia", "India", "South Africa"], level: "hard" },
  { q: "Which country won the 2023 ODI World Cup, held in India?", correct: "Australia", wrong: ["India", "New Zealand", "South Africa"], level: "medium" },
  { q: "Pakistan's fast bowler Shoaib Akhtar was nicknamed the what?", correct: "Rawalpindi Express", wrong: ["Sultan of Swing", "Karachi King", "Lahore Lightning"], level: "hard" },
  { q: "'Mankading' refers to running out which player?", correct: "The non-striker", wrong: ["The striker", "The wicketkeeper", "A fielder"], level: "hard" },
  { q: "Adam Gilchrist, a record-setting wicketkeeper-batsman, played for which country?", correct: "Australia", wrong: ["England", "South Africa", "New Zealand"], level: "hard" },
  { q: "The Wankhede Stadium, venue of the 2011 World Cup final, is in which city?", correct: "Mumbai", wrong: ["Delhi", "Chennai", "Pune"], level: "medium" },
  { q: "In limited-overs cricket, the 'powerplay' restricts the number of fielders allowed where?", correct: "Outside the inner circle", wrong: ["Behind the wicket", "On the leg side", "In the slips"], level: "medium" },
  { q: "AB de Villiers, nicknamed 'Mr. 360', represented which country?", correct: "South Africa", wrong: ["Australia", "England", "West Indies"], level: "medium" },
  { q: "The famous Melbourne Cricket Ground (MCG) is located in which country?", correct: "Australia", wrong: ["England", "New Zealand", "South Africa"], level: "easy" },
  { q: "Sachin Tendulkar played his farewell Test match in 2013 at which stadium?", correct: "Wankhede Stadium", wrong: ["Eden Gardens", "Feroz Shah Kotla", "M. Chinnaswamy"], level: "hard" },
];

const STATS = [
  { q: "Who holds the record for the highest individual score in Test cricket (400 not out)?", correct: "Brian Lara", wrong: ["Don Bradman", "Sachin Tendulkar", "Matthew Hayden"], level: "hard" },
  { q: "Who scored the highest individual ODI innings of 264?", correct: "Rohit Sharma", wrong: ["Virender Sehwag", "Sachin Tendulkar", "Martin Guptill"], level: "medium" },
  { q: "Who has scored the most runs in Test cricket history?", correct: "Sachin Tendulkar", wrong: ["Ricky Ponting", "Jacques Kallis", "Rahul Dravid"], level: "medium" },
  { q: "Who is the only batsman to score 100 international centuries?", correct: "Sachin Tendulkar", wrong: ["Ricky Ponting", "Virat Kohli", "Kumar Sangakkara"], level: "easy" },
  { q: "Sir Don Bradman's legendary Test batting average is closest to which figure?", correct: "99.94", wrong: ["89.78", "75.50", "100.00"], level: "medium" },
  { q: "Who holds the record for the most wickets in Test cricket (800)?", correct: "Muttiah Muralitharan", wrong: ["Shane Warne", "Anil Kumble", "James Anderson"], level: "medium" },
  { q: "Who scored the first-ever double century in men's ODI cricket (200* in 2010)?", correct: "Sachin Tendulkar", wrong: ["Virender Sehwag", "Rohit Sharma", "Chris Gayle"], level: "medium" },
  { q: "Which Indian bowler took all 10 wickets in a single Test innings (10/74 in 1999)?", correct: "Anil Kumble", wrong: ["Harbhajan Singh", "Kapil Dev", "Bishan Singh Bedi"], level: "hard" },
  { q: "Who has the most runs in ODI cricket history?", correct: "Sachin Tendulkar", wrong: ["Kumar Sangakkara", "Virat Kohli", "Ricky Ponting"], level: "medium" },
  { q: "Brian Lara's record 400* Test score was made for which country?", correct: "West Indies", wrong: ["Australia", "England", "South Africa"], level: "hard" },
  { q: "Who holds the record for the most wickets in ODI cricket history?", correct: "Muttiah Muralitharan", wrong: ["Wasim Akram", "Shane Warne", "Waqar Younis"], level: "hard" },
  { q: "Which batsman is nicknamed 'Mr. 360' for scoring all around the ground?", correct: "AB de Villiers", wrong: ["David Warner", "Glenn Maxwell", "Virat Kohli"], level: "medium" },
  { q: "Wasim Akram, a record-holder for ODI wickets among pacers, played for which country?", correct: "Pakistan", wrong: ["India", "Sri Lanka", "Bangladesh"], level: "medium" },
  { q: "Jacques Kallis, one of the greatest all-rounders with 10,000+ Test runs and 250+ wickets, played for which country?", correct: "South Africa", wrong: ["Australia", "England", "New Zealand"], level: "hard" },
  { q: "Who captained the West Indies side that won the first two World Cups (1975 and 1979)?", correct: "Clive Lloyd", wrong: ["Viv Richards", "Garfield Sobers", "Gordon Greenidge"], level: "hard" },
  // More stats — landmark, stable
  { q: "How many international centuries did Sachin Tendulkar score in total?", correct: "100", wrong: ["95", "90", "85"], level: "easy" },
  { q: "Who was the first batsman to reach 10,000 runs in ODI cricket?", correct: "Sachin Tendulkar", wrong: ["Sourav Ganguly", "Ricky Ponting", "Brian Lara"], level: "medium" },
  { q: "Who holds the highest individual Test score by an Indian batsman (319)?", correct: "Virender Sehwag", wrong: ["Karun Nair", "VVS Laxman", "Virat Kohli"], level: "hard" },
  { q: "How many Test centuries did Sachin Tendulkar score (a record)?", correct: "51", wrong: ["45", "40", "55"], level: "hard" },
  { q: "Who holds the record for the fastest century in Test cricket (off 54 balls)?", correct: "Brendon McCullum", wrong: ["Viv Richards", "Adam Gilchrist", "Misbah-ul-Haq"], level: "hard" },
  { q: "Needing only 4 runs in his final Test innings to average 100, Don Bradman was famously dismissed for what score?", correct: "0 (a duck)", wrong: ["4", "10", "2"], level: "hard" },
  { q: "Who has taken the most wickets in ODI cricket for India?", correct: "Anil Kumble", wrong: ["Javagal Srinath", "Zaheer Khan", "Kapil Dev"], level: "hard" },
  { q: "Who scored the first six-sixes-in-an-over in a World Cup match (2007 ODI)?", correct: "Herschelle Gibbs", wrong: ["Yuvraj Singh", "Chris Gayle", "Ricky Ponting"], level: "hard" },
  { q: "Kapil Dev finished his Test career as, at the time, the highest wicket-taker; he played for which country?", correct: "India", wrong: ["Pakistan", "England", "West Indies"], level: "easy" },
  { q: "Which batsman, nicknamed 'The Wall', scored over 13,000 Test runs for India?", correct: "Rahul Dravid", wrong: ["VVS Laxman", "Sourav Ganguly", "Gautam Gambhir"], level: "medium" },
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await seedCategory(mongoose, Question, "Cricket", CRICKET);
  await seedCategory(mongoose, Question, "Cricket Stats", STATS);
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
