/**
 * Builds templates/seedEntities.js from the REST Countries dataset plus
 * curated major-city lists. Run with: node scripts/buildSeedEntities.js
 *
 * The REST Countries response is cached in scripts/.restcountries-cache.json.
 * Delete that file (or pass --refresh) to re-download.
 *
 * Major-city lists are ordered LARGEST FIRST, so largest_city = major_cities[0].
 * They power the "competitive" Largest Cities questions, where distractors are
 * OTHER cities in the SAME country (genuinely confusable) rather than foreign cities.
 */
const fs = require("fs");
const path = require("path");
const https = require("https");

const CACHE = path.join(__dirname, ".restcountries-cache.json");
const OUT = path.join(__dirname, "..", "templates", "seedEntities.js");
const API =
  "https://restcountries.com/v3.1/all?fields=name,capital,currencies,region,subregion,population,flags,unMember";

// Curated, population-ordered (largest first) major cities for well-known countries.
// Keys MUST match REST Countries `name.common`.
const MAJOR_CITIES = {
  India: ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata"],
  China: ["Shanghai", "Beijing", "Chongqing", "Guangzhou", "Shenzhen", "Chengdu"],
  "United States": ["New York City", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia"],
  Brazil: ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Fortaleza", "Belo Horizonte"],
  Japan: ["Tokyo", "Yokohama", "Osaka", "Nagoya", "Sapporo", "Fukuoka"],
  Russia: ["Moscow", "Saint Petersburg", "Novosibirsk", "Yekaterinburg", "Kazan"],
  Indonesia: ["Jakarta", "Surabaya", "Bandung", "Medan", "Semarang"],
  Pakistan: ["Karachi", "Lahore", "Faisalabad", "Rawalpindi", "Islamabad"],
  Nigeria: ["Lagos", "Kano", "Ibadan", "Abuja", "Port Harcourt"],
  Bangladesh: ["Dhaka", "Chittagong", "Khulna", "Rajshahi"],
  Mexico: ["Mexico City", "Guadalajara", "Monterrey", "Puebla", "Tijuana"],
  Germany: ["Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt"],
  France: ["Paris", "Marseille", "Lyon", "Toulouse", "Nice"],
  "United Kingdom": ["London", "Birmingham", "Manchester", "Glasgow", "Liverpool"],
  Italy: ["Rome", "Milan", "Naples", "Turin", "Palermo"],
  Spain: ["Madrid", "Barcelona", "Valencia", "Seville", "Zaragoza"],
  Turkey: ["Istanbul", "Ankara", "Izmir", "Bursa", "Adana"],
  Egypt: ["Cairo", "Alexandria", "Giza", "Shubra El Kheima"],
  Iran: ["Tehran", "Mashhad", "Isfahan", "Karaj", "Shiraz"],
  Canada: ["Toronto", "Montreal", "Vancouver", "Calgary", "Ottawa"],
  Australia: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"],
  "South Korea": ["Seoul", "Busan", "Incheon", "Daegu", "Daejeon"],
  "South Africa": ["Johannesburg", "Cape Town", "Durban", "Pretoria"],
  Argentina: ["Buenos Aires", "Córdoba", "Rosario", "Mendoza"],
  Colombia: ["Bogotá", "Medellín", "Cali", "Barranquilla"],
  "Saudi Arabia": ["Riyadh", "Jeddah", "Mecca", "Medina", "Dammam"],
  Thailand: ["Bangkok", "Nonthaburi", "Nakhon Ratchasima", "Chiang Mai"],
  Vietnam: ["Ho Chi Minh City", "Hanoi", "Haiphong", "Da Nang"],
  Philippines: ["Quezon City", "Manila", "Davao", "Cebu City"],
  Poland: ["Warsaw", "Kraków", "Łódź", "Wrocław", "Poznań"],
  Ukraine: ["Kyiv", "Kharkiv", "Odesa", "Dnipro", "Lviv"],
  Netherlands: ["Amsterdam", "Rotterdam", "The Hague", "Utrecht"],
  Morocco: ["Casablanca", "Rabat", "Fez", "Marrakesh", "Tangier"],
};

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

async function loadCountries() {
  if (fs.existsSync(CACHE) && !process.argv.includes("--refresh")) {
    return JSON.parse(fs.readFileSync(CACHE, "utf-8"));
  }
  const data = await fetchJson(API);
  fs.writeFileSync(CACHE, JSON.stringify(data));
  return data;
}

function firstCurrencyName(currencies) {
  if (!currencies) return "";
  const keys = Object.keys(currencies);
  if (!keys.length) return "";
  return currencies[keys[0]].name || "";
}

async function build() {
  const raw = await loadCountries();
  const members = raw
    .filter((c) => c.unMember)
    .sort((a, b) => a.name.common.localeCompare(b.name.common));

  const entities = members.map((c) => {
    const name = c.name.common;
    const attributes = {
      capital: Array.isArray(c.capital) && c.capital.length ? c.capital[0] : "",
      currency: firstCurrencyName(c.currencies),
      continent: c.region || "",
      subregion: c.subregion || "",
      population: typeof c.population === "number" ? c.population : 0,
    };
    const cities = MAJOR_CITIES[name];
    if (Array.isArray(cities) && cities.length >= 4) {
      attributes.major_cities = cities;
      attributes.largest_city = cities[0];
    }
    return {
      category: "Countries",
      name,
      attributes,
      mediaType: "image",
      mediaUrl: c.flags && c.flags.png ? c.flags.png : "",
    };
  });

  const withCities = entities.filter((e) => e.attributes.major_cities).length;
  const header = `// AUTO-GENERATED by scripts/buildSeedEntities.js — do not edit by hand.
// Source: REST Countries (UN members) + curated major-city lists.
// ${entities.length} countries, ${withCities} with major-city pools.\n\n`;
  const body = `const countryEntities = ${JSON.stringify(entities, null, 2)};\n\nmodule.exports = { countryEntities };\n`;
  fs.writeFileSync(OUT, header + body);
  console.log(`Wrote ${entities.length} countries (${withCities} with city pools) to ${OUT}`);
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
