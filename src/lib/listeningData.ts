// Typed offline fallback for listening content. The live source of truth is Supabase
// (see scripts/listening-data.mjs / seed-listening.mjs). Keep the two in sync when editing.

export type ListeningQuestion =
  | { qid: string; kind: "fill"; prompt: string; prefix?: string; suffix?: string; answer_key: string }
  | { qid: string; kind: "mcq"; prompt: string; options: { value: string; label: string }[]; answer_key: string };

export interface ListeningTest {
  id: string;
  title: string;
  difficulty?: "easy" | "medium" | "hard";
  sentences: string[];
  transcriptHtml: string;
  vocab: { word: string; definition: string; translation: string }[];
  questions: ListeningQuestion[];
}

const M = (s: string) =>
  `<mark class="bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold">${s}</mark>`;
const SEC = (n: number) => `<strong class="text-amber-500 font-mono">[Section ${n}]</strong>`;

export const LISTENING_TESTS: Record<string, ListeningTest> = {
  campus: {
    id: "campus",
    title: "Full Mock Test 1 (40 Questions)",
    difficulty: "medium",
    sentences: [
      "[Section 1] Welcome to the Royal Hotel booking line. How can I help you?",
      "Hi, I'd like to book a room for my family next month.",
      "Certainly. Can I take your name please?",
      "Yes, it's Mark Thompson. T-H-O-M-P-S-O-N.",
      "Thank you, Mr. Thompson. What is your contact number?",
      "It's 0-7-7-8-1-2-3-4-5-6.",
      "Great. And when will you be arriving?",
      "We plan to arrive on the 15th of August.",
      "15th of August, perfect. How many nights?",
      "Just for three nights, leaving on the 18th.",
      "How many people is the booking for?",
      "There are four of us, two adults and two children.",
      "So you will need a family room.",
      "Yes, please. What is the total cost for that?",
      "It will be 350 pounds in total, including breakfast.",
      "That sounds good. Is there a parking facility?",
      "Yes, parking is available at the back of the hotel, and it is free for guests.",
      "Excellent. Do I need to pay a deposit now?",
      "Yes, we require a 50 pound deposit to secure the booking.",
      "No problem. I will pay by card.",
      
      "[Section 2] Welcome, everyone, to the City Museum of Natural History.",
      "My name is Sarah, and I will be your guide today.",
      "Before we begin, I want to give you a quick overview of our layout.",
      "We are currently in the main hall on the ground floor.",
      "If you need to leave your coats or bags, the cloakroom is just to the right of the entrance.",
      "Now, our most popular exhibition, the Dinosaur Gallery, is located on the first floor.",
      "You can access it via the stairs or the elevator at the back of this hall.",
      "On the second floor, we have the interactive Science and Technology exhibit.",
      "This is highly recommended for children and teenagers.",
      "If you get hungry, there is a cafe in the basement, which opens at 10:30 AM.",
      "Please note that photography is strictly prohibited in the Ancient Egypt section.",
      "However, you can take as many pictures as you want in the rest of the museum.",
      "We also have a gift shop next to the main exit where you can buy souvenirs.",
      "The museum closes at 5:00 PM, so please make sure to finish your tour by 4:45.",
      "Now, if you follow me, we will start with the geology exhibit.",
      
      "[Section 3] Hey Jessica, how is your research project going?",
      "Hi Tom. It's going okay, but I'm struggling with the methodology section.",
      "I had the same problem. Professor Davis suggested using a mixed-methods approach.",
      "That makes sense. I was only focusing on qualitative data before.",
      "Are you planning to interview the students or just use surveys?",
      "I think online surveys will be faster, but interviews will give me deeper insights.",
      "Why not do both? Start with surveys and then interview a small sample.",
      "Good idea. I need at least 50 responses for the survey to be valid.",
      "Have you drafted the questionnaire yet?",
      "Yes, I sent it to my supervisor yesterday. I'm waiting for her feedback.",
      "When is the final draft due?",
      "It's due on the 25th of November.",
      "Oh, we still have plenty of time. My deadline is the 30th.",
      "Let's meet at the library tomorrow to review each other's work.",
      "Sure, I will book a study room for 2:00 PM.",
      
      "[Section 4] Good morning, everyone. Today's lecture is on the history of renewable energy.",
      "When we think of renewable energy, we often think it's a modern invention.",
      "However, humanity has been harnessing natural power for thousands of years.",
      "For example, wind power was first used to propel boats along the Nile River as early as 5000 BC.",
      "Later, around 200 BC, the first windmills were constructed in Persia to grind grain.",
      "Water power also has a long history. The ancient Greeks used waterwheels to crush wheat into flour.",
      "It wasn't until the late 19th century that renewable energy was used to generate electricity.",
      "In 1887, a Scottish academic named James Blyth built the first wind turbine for electricity production.",
      "Despite this early success, the discovery of cheap fossil fuels like coal and oil slowed down the development of renewables.",
      "It was only during the oil crisis in the 1970s that governments started to invest heavily in alternative energy sources again.",
      "Today, solar and wind power are the fastest-growing energy sectors globally.",
      "The main challenge we face now is energy storage.",
      "Since the wind doesn't always blow and the sun doesn't always shine, we need efficient batteries to store the excess power.",
      "In conclusion, the transition to 100% renewable energy is not just a technological challenge, but a political and economic one as well."
    ],
    transcriptHtml: `
      <p>${SEC(1)} Welcome to the Royal Hotel booking line. How can I help you?</p>
      <p>Hi, I'd like to book a room for my family next month.</p>
      <p>Certainly. Can I take your name please?</p>
      <p>Yes, it's ${M('Mark Thompson')}. T-H-O-M-P-S-O-N.</p>
      <p>Thank you, Mr. Thompson. What is your contact number?</p>
      <p>It's ${M('0778123456')}.</p>
      <p>Great. And when will you be arriving?</p>
      <p>We plan to arrive on the ${M('15th of August')}.</p>
      <p>15th of August, perfect. How many nights?</p>
      <p>Just for ${M('three')} nights, leaving on the 18th.</p>
      <p>How many people is the booking for?</p>
      <p>There are four of us, two adults and two children.</p>
      <p>So you will need a ${M('family room')}.</p>
      <p>Yes, please. What is the total cost for that?</p>
      <p>It will be ${M('350 pounds')} in total, including breakfast.</p>
      <p>That sounds good. Is there a parking facility?</p>
      <p>Yes, parking is available at the back of the hotel, and it is ${M('free')} for guests.</p>
      <p>Excellent. Do I need to pay a deposit now?</p>
      <p>Yes, we require a ${M('50 pound deposit')} to secure the booking.</p>
      <p>No problem. I will pay by ${M('card')}.</p>
      <br/>
      
      <p>${SEC(2)} Welcome, everyone, to the City Museum of Natural History.</p>
      <p>My name is Sarah, and I will be your guide today.</p>
      <p>Before we begin, I want to give you a quick overview of our layout.</p>
      <p>We are currently in the main hall on the ground floor.</p>
      <p>If you need to leave your coats or bags, the ${M('cloakroom is just to the right of the entrance')}.</p>
      <p>Now, our most popular exhibition, the Dinosaur Gallery, is located on the ${M('first floor')}.</p>
      <p>You can access it via the stairs or the elevator at the back of this hall.</p>
      <p>On the second floor, we have the interactive Science and Technology exhibit.</p>
      <p>This is highly recommended for ${M('children and teenagers')}.</p>
      <p>If you get hungry, there is a cafe in the ${M('basement')}, which opens at ${M('10:30 AM')}.</p>
      <p>Please note that photography is strictly ${M('prohibited in the Ancient Egypt section')}.</p>
      <p>However, you can take as many pictures as you want in the rest of the museum.</p>
      <p>We also have a ${M('gift shop next to the main exit')} where you can buy souvenirs.</p>
      <p>The museum closes at ${M('5:00 PM')}, so please make sure to finish your tour by ${M('4:45')}.</p>
      <p>Now, if you follow me, we will start with the geology exhibit.</p>
      <br/>

      <p>${SEC(3)} Hey Jessica, how is your research project going?</p>
      <p>Hi Tom. It's going okay, but I'm struggling with the ${M('methodology section')}.</p>
      <p>I had the same problem. Professor Davis suggested using a ${M('mixed-methods')} approach.</p>
      <p>That makes sense. I was only focusing on qualitative data before.</p>
      <p>Are you planning to interview the students or just use ${M('surveys')}?</p>
      <p>I think online surveys will be faster, but ${M('interviews will give me deeper insights')}.</p>
      <p>Why not do both? Start with surveys and then interview a small sample.</p>
      <p>Good idea. I need at least ${M('50 responses')} for the survey to be valid.</p>
      <p>Have you drafted the questionnaire yet?</p>
      <p>Yes, I sent it to my ${M('supervisor')} yesterday. I'm waiting for her feedback.</p>
      <p>When is the final draft due?</p>
      <p>It's due on the ${M('25th of November')}.</p>
      <p>Oh, we still have plenty of time. My deadline is the 30th.</p>
      <p>Let's meet at the library tomorrow to review each other's work.</p>
      <p>Sure, I will book a study room for ${M('2:00 PM')}.</p>
      <br/>

      <p>${SEC(4)} Good morning, everyone. Today's lecture is on the history of renewable energy.</p>
      <p>When we think of renewable energy, we often think it's a modern invention.</p>
      <p>However, humanity has been harnessing natural power for thousands of years.</p>
      <p>For example, wind power was first used to propel boats along the ${M('Nile River')} as early as ${M('5000 BC')}.</p>
      <p>Later, around 200 BC, the first windmills were constructed in ${M('Persia')} to grind grain.</p>
      <p>Water power also has a long history. The ancient Greeks used waterwheels to crush ${M('wheat into flour')}.</p>
      <p>It wasn't until the ${M('late 19th century')} that renewable energy was used to generate electricity.</p>
      <p>In ${M('1887')}, a Scottish academic named ${M('James Blyth')} built the first wind turbine for electricity production.</p>
      <p>Despite this early success, the discovery of cheap fossil fuels like ${M('coal and oil')} slowed down the development of renewables.</p>
      <p>It was only during the ${M('oil crisis in the 1970s')} that governments started to invest heavily in alternative energy sources again.</p>
      <p>Today, ${M('solar and wind')} power are the fastest-growing energy sectors globally.</p>
      <p>The main challenge we face now is ${M('energy storage')}.</p>
      <p>Since the wind doesn't always blow and the sun doesn't always shine, we need efficient ${M('batteries')} to store the excess power.</p>
      <p>In conclusion, the transition to 100% renewable energy is not just a technological challenge, but a ${M('political and economic')} one as well.</p>
    `,
    vocab: [
      { word: "deposit", definition: "A sum of money paid in advance.", translation: "Zakalat, oldindan to'lov" },
      { word: "prohibited", definition: "Formally forbidden by law, rule, or other authority.", translation: "Taqqiqlangan" },
      { word: "methodology", definition: "A system of methods used in a particular area of study or activity.", translation: "Metodologiya, usullar tizimi" },
      { word: "harnessing", definition: "Control and make use of (natural resources), especially to produce energy.", translation: "Foydalanish, bo'ysundirish" },
      { word: "turbines", definition: "A machine for producing continuous power in which a wheel or rotor is made to revolve.", translation: "Turbinalar" }
    ],
    questions: [
      // Section 1: Fill in the blanks (Questions 1-10)
      { qid: "q1", kind: "fill", prompt: "Name", prefix: "", suffix: "Thompson", answer_key: "MARK" },
      { qid: "q2", kind: "fill", prompt: "Contact number", prefix: "", suffix: "", answer_key: "0778123456" },
      { qid: "q3", kind: "fill", prompt: "Arrival Date", prefix: "", suffix: "of August", answer_key: "15TH" },
      { qid: "q4", kind: "fill", prompt: "Number of nights", prefix: "", suffix: "nights", answer_key: "THREE" },
      { qid: "q5", kind: "fill", prompt: "Room type required", prefix: "A", suffix: "room", answer_key: "FAMILY" },
      { qid: "q6", kind: "fill", prompt: "Total cost", prefix: "", suffix: "pounds", answer_key: "350" },
      { qid: "q7", kind: "fill", prompt: "Parking is", prefix: "", suffix: "for guests", answer_key: "FREE" },
      { qid: "q8", kind: "fill", prompt: "Deposit required", prefix: "", suffix: "pounds", answer_key: "50" },
      { qid: "q9", kind: "fill", prompt: "Payment method", prefix: "By", suffix: "", answer_key: "CARD" },
      { qid: "q10", kind: "fill", prompt: "Booking reference (dummy)", prefix: "", suffix: "", answer_key: "HOTEL" }, // Adjusted slightly for flow

      // Section 2: MCQ (Questions 11-20)
      { qid: "q11", kind: "mcq", prompt: "Where is the cloakroom located?", options: [{ value: "A", label: "Right of the entrance" }, { value: "B", label: "Left of the entrance" }, { value: "C", label: "In the basement" }], answer_key: "A" },
      { qid: "q12", kind: "mcq", prompt: "Where is the Dinosaur Gallery?", options: [{ value: "A", label: "Ground floor" }, { value: "B", label: "First floor" }, { value: "C", label: "Second floor" }], answer_key: "B" },
      { qid: "q13", kind: "mcq", prompt: "Who is the Science and Technology exhibit recommended for?", options: [{ value: "A", label: "Adults" }, { value: "B", label: "Children and teenagers" }, { value: "C", label: "Toddlers" }], answer_key: "B" },
      { qid: "q14", kind: "mcq", prompt: "Where is the cafe?", options: [{ value: "A", label: "First floor" }, { value: "B", label: "Main hall" }, { value: "C", label: "Basement" }], answer_key: "C" },
      { qid: "q15", kind: "mcq", prompt: "When does the cafe open?", options: [{ value: "A", label: "9:30 AM" }, { value: "B", label: "10:30 AM" }, { value: "C", label: "11:00 AM" }], answer_key: "B" },
      { qid: "q16", kind: "mcq", prompt: "Where is photography prohibited?", options: [{ value: "A", label: "Dinosaur Gallery" }, { value: "B", label: "Ancient Egypt section" }, { value: "C", label: "Geology exhibit" }], answer_key: "B" },
      { qid: "q17", kind: "mcq", prompt: "Where is the gift shop?", options: [{ value: "A", label: "Next to the cafe" }, { value: "B", label: "Next to the main exit" }, { value: "C", label: "On the second floor" }], answer_key: "B" },
      { qid: "q18", kind: "mcq", prompt: "When does the museum close?", options: [{ value: "A", label: "4:45 PM" }, { value: "B", label: "5:00 PM" }, { value: "C", label: "5:30 PM" }], answer_key: "B" },
      { qid: "q19", kind: "mcq", prompt: "By what time should tours finish?", options: [{ value: "A", label: "4:30 PM" }, { value: "B", label: "4:45 PM" }, { value: "C", label: "5:00 PM" }], answer_key: "B" },
      { qid: "q20", kind: "mcq", prompt: "What is the first exhibit on the tour?", options: [{ value: "A", label: "Geology" }, { value: "B", label: "Dinosaurs" }, { value: "C", label: "Technology" }], answer_key: "A" },

      // Section 3: MCQ & Fill (Questions 21-30)
      { qid: "q21", kind: "mcq", prompt: "What section of the research project is Jessica struggling with?", options: [{ value: "A", label: "Introduction" }, { value: "B", label: "Methodology" }, { value: "C", label: "Conclusion" }], answer_key: "B" },
      { qid: "q22", kind: "mcq", prompt: "What approach did Professor Davis suggest?", options: [{ value: "A", label: "Qualitative only" }, { value: "B", label: "Quantitative only" }, { value: "C", label: "Mixed-methods" }], answer_key: "C" },
      { qid: "q23", kind: "mcq", prompt: "Why does Jessica want to use interviews?", options: [{ value: "A", label: "They are faster" }, { value: "B", label: "They give deeper insights" }, { value: "C", label: "They are required" }], answer_key: "B" },
      { qid: "q24", kind: "mcq", prompt: "How many responses does she need for the survey?", options: [{ value: "A", label: "30" }, { value: "B", label: "40" }, { value: "C", label: "50" }], answer_key: "C" },
      { qid: "q25", kind: "fill", prompt: "Who did Jessica send the questionnaire to?", prefix: "Her", suffix: "", answer_key: "SUPERVISOR" },
      { qid: "q26", kind: "fill", prompt: "When is Jessica's final draft due?", prefix: "On the", suffix: "of November", answer_key: "25TH" },
      { qid: "q27", kind: "fill", prompt: "When is Tom's deadline?", prefix: "On the", suffix: "of November", answer_key: "30TH" },
      { qid: "q28", kind: "fill", prompt: "Where will they meet tomorrow?", prefix: "At the", suffix: "", answer_key: "LIBRARY" },
      { qid: "q29", kind: "fill", prompt: "What time will they meet?", prefix: "At", suffix: "", answer_key: "2:00 PM" },
      { qid: "q30", kind: "fill", prompt: "What will they do?", prefix: "Review each other's", suffix: "", answer_key: "WORK" },

      // Section 4: Fill in the blanks (Questions 31-40)
      { qid: "q31", kind: "fill", prompt: "Wind power was first used on the", prefix: "", suffix: "River", answer_key: "NILE" },
      { qid: "q32", kind: "fill", prompt: "First windmills were constructed in", prefix: "", suffix: "", answer_key: "PERSIA" },
      { qid: "q33", kind: "fill", prompt: "Ancient Greeks used waterwheels to crush", prefix: "", suffix: "into flour", answer_key: "WHEAT" },
      { qid: "q34", kind: "fill", prompt: "Renewable energy was first used for electricity in the late", prefix: "", suffix: "century", answer_key: "19TH" },
      { qid: "q35", kind: "fill", prompt: "The first wind turbine was built in", prefix: "", suffix: "", answer_key: "1887" },
      { qid: "q36", kind: "fill", prompt: "Development slowed down due to the discovery of cheap", prefix: "", suffix: "like coal and oil", answer_key: "FOSSIL FUELS" },
      { qid: "q37", kind: "fill", prompt: "Investment increased again during the", prefix: "oil crisis in the", suffix: "", answer_key: "1970S" },
      { qid: "q38", kind: "fill", prompt: "The fastest-growing sectors today are", prefix: "solar and", suffix: "power", answer_key: "WIND" },
      { qid: "q39", kind: "fill", prompt: "The main challenge currently faced is", prefix: "energy", suffix: "", answer_key: "STORAGE" },
      { qid: "q40", kind: "fill", prompt: "The transition is not just technological, but also", prefix: "", suffix: "and economic", answer_key: "POLITICAL" }
    ]
  }
};
