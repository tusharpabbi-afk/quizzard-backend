// Hand-curated text-trivia entities for the Movies, History and Finance categories.
// Kept to well-known, high-confidence facts. Distractors are drawn from the same
// category's other values (e.g. other release years / other directors / other founders).

const movies = [
  ["Inception", "Christopher Nolan", "2010"],
  ["Titanic", "James Cameron", "1997"],
  ["The Godfather", "Francis Ford Coppola", "1972"],
  ["Pulp Fiction", "Quentin Tarantino", "1994"],
  ["The Dark Knight", "Christopher Nolan", "2008"],
  ["Forrest Gump", "Robert Zemeckis", "1994"],
  ["Avatar", "James Cameron", "2009"],
  ["Jurassic Park", "Steven Spielberg", "1993"],
  ["The Matrix", "The Wachowskis", "1999"],
  ["Gladiator", "Ridley Scott", "2000"],
  ["Interstellar", "Christopher Nolan", "2014"],
  ["Schindler's List", "Steven Spielberg", "1993"],
  ["Parasite", "Bong Joon-ho", "2019"],
  ["Joker", "Todd Phillips", "2019"],
  ["The Shawshank Redemption", "Frank Darabont", "1994"],
  ["Fight Club", "David Fincher", "1999"],
  ["Avengers: Endgame", "The Russo Brothers", "2019"],
  ["La La Land", "Damien Chazelle", "2016"],
  ["Slumdog Millionaire", "Danny Boyle", "2008"],
  ["Saving Private Ryan", "Steven Spielberg", "1998"],
].map(([name, director, year]) => ({
  category: "Movies",
  name,
  attributes: { director, year },
  mediaType: "text",
  mediaUrl: "",
}));

// History entity names are verb phrases, so "In which year did {{name}}?" reads naturally.
const history = [
  ["World War II end", "1945"],
  ["World War I begin", "1914"],
  ["India gain independence", "1947"],
  ["the Berlin Wall fall", "1989"],
  ["humans first land on the Moon", "1969"],
  ["the French Revolution begin", "1789"],
  ["the United States declare independence", "1776"],
  ["the Soviet Union dissolve", "1991"],
  ["the Titanic sink", "1912"],
  ["Mahatma Gandhi die", "1948"],
  ["Columbus reach the Americas", "1492"],
  ["the Wright brothers make their first flight", "1903"],
  ["Alexander Graham Bell patent the telephone", "1876"],
  ["the first football World Cup take place", "1930"],
  ["the Indian Constitution come into effect", "1950"],
  ["the World Wide Web become publicly available", "1991"],
].map(([name, year]) => ({
  category: "History",
  name,
  attributes: { year },
  mediaType: "text",
  mediaUrl: "",
}));

const finance = [
  ["Microsoft", "Bill Gates"],
  ["Apple", "Steve Jobs"],
  ["Amazon", "Jeff Bezos"],
  ["Facebook", "Mark Zuckerberg"],
  ["SpaceX", "Elon Musk"],
  ["Reliance Industries", "Dhirubhai Ambani"],
  ["Infosys", "Narayana Murthy"],
  ["Alibaba", "Jack Ma"],
  ["Walmart", "Sam Walton"],
  ["Virgin Group", "Richard Branson"],
  ["Oracle", "Larry Ellison"],
  ["Nike", "Phil Knight"],
  ["Tata Group", "Jamsetji Tata"],
  ["IKEA", "Ingvar Kamprad"],
  ["Dell", "Michael Dell"],
  ["Ford Motor Company", "Henry Ford"],
].map(([name, founder]) => ({
  category: "Finance",
  name,
  attributes: { founder },
  mediaType: "text",
  mediaUrl: "",
}));

const triviaEntities = [...movies, ...history, ...finance];

module.exports = { triviaEntities };
