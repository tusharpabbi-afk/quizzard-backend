// Display metadata for quiz categories: tile image + sort order.
// imageUrl points at a bundled Flutter asset (downloaded by scripts/fetchCategoryImages.js);
// the app falls back to an icon if the path is empty.
const categoryMeta = {
  Capitals: { imageUrl: "assets/categories/capitals.jpg", order: 1 },
  Flags: { imageUrl: "assets/categories/flags.jpg", order: 2 },
  "Largest Cities": { imageUrl: "assets/categories/largest_cities.jpg", order: 3 },
  "Find the Country": { imageUrl: "assets/categories/find_country.jpg", order: 4 },
  Currencies: { imageUrl: "assets/categories/currencies.jpg", order: 5 },
  Continents: { imageUrl: "assets/categories/continents.jpg", order: 6 },
  Bollywood: { imageUrl: "assets/categories/bollywood.jpg", order: 7 },
  Hollywood: { imageUrl: "assets/categories/hollywood.jpg", order: 8 },
  Sports: { imageUrl: "assets/categories/sports.jpg", order: 9 },
  Movies: { imageUrl: "assets/categories/movies.jpg", order: 10 },
  History: { imageUrl: "assets/categories/history.jpg", order: 11 },
  Finance: { imageUrl: "assets/categories/finance.jpg", order: 12 },
  Anthems: { imageUrl: "assets/categories/anthems.jpg", order: 13 },
  "Nature Clips": { imageUrl: "assets/categories/nature.jpg", order: 14 },
  // Open Trivia DB categories
  "General Knowledge": { imageUrl: "assets/categories/general.jpg", order: 15 },
  Film: { imageUrl: "assets/categories/film.jpg", order: 16 },
  Music: { imageUrl: "assets/categories/music.jpg", order: 17 },
  "TV Shows": { imageUrl: "assets/categories/tv.jpg", order: 18 },
  "Video Games": { imageUrl: "assets/categories/videogames.jpg", order: 19 },
  Science: { imageUrl: "assets/categories/science.jpg", order: 20 },
  Computers: { imageUrl: "assets/categories/computers.jpg", order: 21 },
  "Sports Trivia": { imageUrl: "assets/categories/sports_trivia.jpg", order: 22 },
  "Geography Trivia": { imageUrl: "assets/categories/geography.jpg", order: 23 },
  "World History": { imageUrl: "assets/categories/world_history.jpg", order: 24 },
  Mythology: { imageUrl: "assets/categories/mythology.jpg", order: 25 },
  Animals: { imageUrl: "assets/categories/animals.jpg", order: 26 },
  // Curated show + Bollywood trivia
  Friends: { imageUrl: "assets/categories/tv.jpg", order: 27 },
  "The Big Bang Theory": { imageUrl: "assets/categories/tbbt.jpg", order: 28 },
  "The Office": { imageUrl: "assets/categories/tv.jpg", order: 29 },
  "Modern Family": { imageUrl: "assets/categories/tv.jpg", order: 30 },
  "Bollywood Trivia": { imageUrl: "assets/categories/bollywood.jpg", order: 31 },
  "Indian Cinema": { imageUrl: "assets/categories/bollywood.jpg", order: 16.5 },
  "Bollywood Music": { imageUrl: "assets/categories/music.jpg", order: 32 },
  "Bollywood Name Puzzles": { imageUrl: "assets/categories/bollywood.jpg", order: 33 },
  "Taarak Mehta Ka Ooltah Chashmah": { imageUrl: "assets/categories/tv.jpg", order: 12.5 },
  "Harry Potter": { imageUrl: "assets/categories/harrypotter.jpg", order: 12.4 },
  "Arts & Literature": { imageUrl: "assets/categories/arts.jpg", order: 34 },
  "Society & Culture": { imageUrl: "assets/categories/society.jpg", order: 35 },
  "Food & Drink": { imageUrl: "assets/categories/food.jpg", order: 36 },
};

module.exports = { categoryMeta };
