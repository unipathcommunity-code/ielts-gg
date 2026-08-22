// Seeds the 3 reading passages (+ questions + vocab) into Supabase.
// Run: node scripts/seed-reading.mjs   (with SB_URL and SB_SECRET in env)
const URL = process.env.SB_URL;
const KEY = process.env.SB_SECRET;
if (!URL || !KEY) { console.error("Set SB_URL and SB_SECRET env vars"); process.exit(1); }

const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "User-Agent": "kmw-bb-seed/1.0" };

async function del(table) {
  const r = await fetch(`${URL}/rest/v1/${table}?id=neq.__none__`, { method: "DELETE", headers: { ...H, Prefer: "return=minimal" } });
  if (!r.ok && r.status !== 404) console.warn("delete", table, r.status, await r.text());
}
async function insert(table, rows) {
  if (!rows.length) return;
  const r = await fetch(`${URL}/rest/v1/${table}`, { method: "POST", headers: { ...H, Prefer: "return=minimal" }, body: JSON.stringify(rows) });
  if (!r.ok) { console.error("INSERT FAIL", table, r.status, await r.text()); process.exit(1); }
  console.log(`  ✓ ${table}: ${rows.length}`);
}

const passages = [
  {
    id: "universe", title: "The Origins of the Universe", order_index: 0,
    paragraphs: [
      { label: "A", text: `The question of how the universe began has puzzled philosophers and scientists for millennia. In the early 20th century, the prevailing scientific view was that the universe was static and eternal. However, this view was fundamentally challenged by Edwin Hubble's observation in 1929 that galaxies were moving away from each other, suggesting that the universe was expanding.` },
      { label: "B", text: `This observation led to the formulation of the Big Bang theory. According to this model, the universe began as a hot, dense singularity approximately 13.8 billion years ago. Since then, it has been expanding and cooling, allowing for the formation of subatomic particles, and eventually simple atoms. Giant clouds of these primordial elements later coalesced through gravity to form stars and galaxies.` },
      { label: "C", text: `Not all scientists immediately accepted the Big Bang theory. Fred Hoyle, Thomas Gold, and Hermann Bondi proposed an alternative known as the Steady State theory in 1948. This model suggested that the universe is continually expanding but maintaining a constant average density, with matter being continuously created to form new stars and galaxies at the same rate that old ones become unobservable as a consequence of their increasing distance and velocity of recession.` },
      { label: "D", text: `The debate between these two theories was largely settled by the discovery of the Cosmic Microwave Background (CMB) radiation in 1964 by Arno Penzias and Robert Wilson. The CMB is the residual heat from the Big Bang, spread uniformly across the universe, and its existence provided overwhelming evidence in favor of the Big Bang model, rendering the Steady State theory obsolete.` },
      { label: "E", text: `Today, cosmologists continue to refine our understanding of the universe's origins and its ultimate fate. Concepts such as dark matter and dark energy have been introduced to explain anomalies in the observed rotation of galaxies and the accelerating rate of cosmic expansion. Despite these advancements, the very instant of the Big Bang remains shrouded in mystery, lying beyond the current limits of our physical theories.` },
    ],
    questions: [
      { qid: "q1", kind: "matching", number: "1.", prompt: "The discovery that definitively disproved a competing theory.", short_label: "Definitively disproved a competing theory", answer_key: "D" },
      { qid: "q2", kind: "matching", number: "2.", prompt: "Modern phenomena that scientists are currently trying to understand.", short_label: "Modern phenomena currently trying to understand", answer_key: "E" },
      { qid: "q3", kind: "matching", number: "3.", prompt: "The initial observation that changed the scientific consensus about the universe.", short_label: "Initial observation changing the consensus", answer_key: "A" },
      { qid: "q4", kind: "matching", number: "4.", prompt: "A theory suggesting that the universe has always looked roughly the same.", short_label: "Theory suggesting universe looks the same", answer_key: "C" },
      { qid: "q5", kind: "tf", number: "5.", prompt: "Before 1929, most scientists believed the universe was expanding.", short_label: "Before 1929, most scientists believed universe expanding", answer_key: "FALSE" },
      { qid: "q6", kind: "tf", number: "6.", prompt: "The Steady State theory was proposed by the same scientists who discovered the CMB.", short_label: "Steady State theory proposed by CMB discoverers", answer_key: "FALSE" },
      { qid: "q7", kind: "tf", number: "7.", prompt: "Dark matter makes up the majority of the universe's mass.", short_label: "Dark matter makes up majority of mass", answer_key: "NOT GIVEN" },
    ],
    vocab: [
      { word: "Millennia", definition: "A period of a thousand years.", translation: "Ming yilliklar" },
      { word: "Prevailing", definition: "Existing at a particular time; current.", translation: "Keng tarqalgan/ustun" },
      { word: "Singularity", definition: "A point at which a function takes an infinite value (physics singularity).", translation: "Singulyarlik" },
      { word: "Coalesced", definition: "Combined elements in a mass or whole.", translation: "Birlashgan/qo'shilgan" },
      { word: "Obsolete", definition: "No longer produced or used; out of date.", translation: "Eskirgan/iste'moldan chiqqan" },
    ],
  },
  {
    id: "ai", title: "The Evolution of Artificial Intelligence", order_index: 1,
    paragraphs: [
      { label: "A", text: `The quest to build machines capable of human-like intelligence has its roots in early computing history. In 1950, Alan Turing famously proposed the Turing Test as a benchmark for artificial intelligence. During this early era, optimism was high, and scientists believed that creating an intelligent machine was only a few decades away.` },
      { label: "B", text: `By the 1970s and 1980s, the field entered the first "AI winter" as early rule-based systems failed to scale to complex real-world problems. These expert systems, which relied on hardcoded "if-then" rules created by human experts, were brittle and could not handle uncertainty or learn from new data, leading to a loss of funding.` },
      { label: "C", text: `A major paradigm shift occurred in the late 1990s and 2000s with the rise of machine learning. Instead of programming explicit rules, researchers began developing algorithms that allowed computers to learn patterns directly from massive datasets. The availability of high-performance GPUs and big data accelerated this transition.` },
      { label: "D", text: `In the 2010s, deep learning—a subset of machine learning based on artificial neural networks with multiple layers—revolutionized fields like image recognition and natural language processing. Systems like AlphaGo demonstrated superhuman performance in complex tasks, capturing global attention and reviving massive commercial interest.` },
      { label: "E", text: `Today, generative AI models and Large Language Models (LLMs) have achieved remarkable fluency and capability. However, critical challenges remain, including machine alignment, ethical concerns regarding bias, and the theoretical risk of artificial general intelligence (AGI) escaping human control, which keeps researchers divided.` },
    ],
    questions: [
      { qid: "q1", kind: "matching", number: "1.", prompt: "The shift from rule-based programming to data-driven learning.", short_label: "The shift from rule-based programming to data-driven learning", answer_key: "C" },
      { qid: "q2", kind: "matching", number: "2.", prompt: "Future risks associated with superintelligent systems.", short_label: "Future risks associated with superintelligent systems", answer_key: "E" },
      { qid: "q3", kind: "matching", number: "3.", prompt: "The initial standard proposed to define machine intelligence.", short_label: "The initial standard proposed to define machine intelligence", answer_key: "A" },
      { qid: "q4", kind: "matching", number: "4.", prompt: "A period characterized by a decline in interest and investment.", short_label: "A period characterized by a decline in interest and investment", answer_key: "B" },
      { qid: "q5", kind: "tf", number: "5.", prompt: "Before 1950, most scientists believed expert systems were successful.", short_label: "Before 1950, most scientists believed expert systems were successful", answer_key: "FALSE" },
      { qid: "q6", kind: "tf", number: "6.", prompt: "Turing believed machine intelligence could be achieved in the 20th century.", short_label: "Turing believed machine intelligence could be achieved in the 20th century", answer_key: "TRUE" },
      { qid: "q7", kind: "tf", number: "7.", prompt: "AlphaGo was developed using a hybrid of expert systems and deep learning.", short_label: "AlphaGo was developed using a hybrid of expert systems and deep learning", answer_key: "NOT GIVEN" },
    ],
    vocab: [
      { word: "Benchmark", definition: "A standard or point of reference against which things may be compared.", translation: "Mezon/o'lchov" },
      { word: "Expert systems", definition: "Software designed to solve complex problems in a specific domain.", translation: "Ekspert tizimlari" },
      { word: "Paradigm shift", definition: "A fundamental change in approach or underlying assumptions.", translation: "Fikrlash o'zgarishi/burilish" },
      { word: "Neural networks", definition: "Computer systems modeled on the human brain's structure.", translation: "Neyron tarmoqlari" },
      { word: "Machine alignment", definition: "Ensuring that artificial intelligence systems align with human goals.", translation: "Mashina muvofiqligi/moslashuvi" },
    ],
  },
  {
    id: "tea", title: "The History and Impact of Tea", order_index: 2,
    paragraphs: [
      { label: "A", text: `The discovery of tea is steeped in Chinese mythology, dating back to 2737 BC when Emperor Shen Nong allegedly tasted water into which tea leaves had accidentally drifted. For centuries, tea was consumed primarily for its medicinal properties and as a tonic to promote mental alertness among Buddhist monks.` },
      { label: "B", text: `It was not until the 17th century that tea made its way to Europe via Dutch and Portuguese merchants. In England, the marriage of King Charles II to Catherine of Braganza, a Portuguese princess who loved tea, established it as a fashionable beverage among the British nobility and aristocracy.` },
      { label: "C", text: `By the 18th and 19th centuries, the demand for tea in Britain had exploded, creating a massive trade imbalance with China. Because China only accepted silver in exchange for tea, the British began illicitly exporting opium to China to balance the trade, culminating in the Opium Wars.` },
      { label: "D", text: `In the modern era, tea has become the second most consumed beverage in the world, surpassed only by water. Scientific research continues to highlight its numerous health benefits, including high concentrations of antioxidants, cardiovascular support, and its role in boosting cognitive function.` },
      { label: "E", text: `Tea culture manifests uniquely across the globe. From the highly ritualized Japanese tea ceremony (Chado) to the social, casual nature of British afternoon tea, the beverage serves as a cornerstone of social interaction and cultural expression in diverse societies.` },
    ],
    questions: [
      { qid: "q1", kind: "matching", number: "1.", prompt: "The introduction of tea to British high society.", short_label: "The introduction of tea to British high society", answer_key: "B" },
      { qid: "q2", kind: "matching", number: "2.", prompt: "Traditional tea rituals in different world regions.", short_label: "Traditional tea rituals in different world regions", answer_key: "E" },
      { qid: "q3", kind: "matching", number: "3.", prompt: "The mythical origins of tea consumption.", short_label: "The mythical origins of tea consumption", answer_key: "A" },
      { qid: "q4", kind: "matching", number: "4.", prompt: "A geopolitical conflict driven by the tea trade.", short_label: "A geopolitical conflict driven by the tea trade", answer_key: "C" },
      { qid: "q5", kind: "tf", number: "5.", prompt: "King Charles II married a princess who popularized tea in England.", short_label: "King Charles II married a princess who popularized tea in England", answer_key: "TRUE" },
      { qid: "q6", kind: "tf", number: "6.", prompt: "Tea was originally developed as a recreational beverage in Europe.", short_label: "Tea was originally developed as a recreational beverage in Europe", answer_key: "FALSE" },
      { qid: "q7", kind: "tf", number: "7.", prompt: "Opium wars led to the establishment of tea plantations in India.", short_label: "Opium wars led to the establishment of tea plantations in India", answer_key: "NOT GIVEN" },
    ],
    vocab: [
      { word: "Steeped in", definition: "Surrounded or filled with a quality or influence.", translation: "Shimib olingan/boy" },
      { word: "Medicinal properties", definition: "Properties used to cure or prevent diseases.", translation: "Shifobaxsh xususiyatlar" },
      { word: "Trade imbalance", definition: "A situation in which a country's imports exceed its exports.", translation: "Savdo nomutanosibligi" },
      { word: "Cardiovascular", definition: "Relating to the heart and blood vessels.", translation: "Yurak-qon tomir" },
      { word: "Cornerstone", definition: "An important quality or feature on which a thing is based.", translation: "Poydevor/asosiy tosh" },
    ],
  },
  {
    id: "sleep", title: "The Science of Sleep", order_index: 3,
    paragraphs: [
      { label: "A", text: `Sleep is a fundamental biological process essential to physical and mental health. Despite spending roughly a third of our lives asleep, scientists only began to understand its mechanisms in the 20th century, when the discovery of brain waves revealed that sleep is far from a passive state.` },
      { label: "B", text: `Sleep occurs in cycles of around 90 minutes, alternating between non-REM and REM (rapid eye movement) stages. During deep non-REM sleep, the body repairs tissues and strengthens the immune system, while REM sleep, when most dreaming occurs, is believed to consolidate memories and process emotions.` },
      { label: "C", text: `Chronic sleep deprivation has been linked to a wide range of health problems, including obesity, cardiovascular disease, and impaired cognitive function. Studies show that people who regularly sleep fewer than six hours a night perform worse on tasks requiring attention and decision-making.` },
      { label: "D", text: `Modern lifestyles pose significant threats to healthy sleep. The widespread use of electronic devices emitting blue light can suppress melatonin, the hormone that regulates the sleep-wake cycle, making it harder to fall asleep. Irregular schedules and caffeine consumption further disrupt natural rhythms.` },
      { label: "E", text: `Researchers now advocate for "sleep hygiene" — a set of habits that promote consistent, restorative rest. These include maintaining a regular bedtime, limiting screen exposure before bed, and keeping the bedroom cool and dark.` },
    ],
    questions: [
      { qid: "q1", kind: "matching", number: "1.", prompt: "Practical recommendations for improving rest.", short_label: "Practical recommendations for improving rest", answer_key: "E" },
      { qid: "q2", kind: "matching", number: "2.", prompt: "The bodily functions performed during different sleep stages.", short_label: "Bodily functions during different sleep stages", answer_key: "B" },
      { qid: "q3", kind: "matching", number: "3.", prompt: "How contemporary habits interfere with sleep.", short_label: "How contemporary habits interfere with sleep", answer_key: "D" },
      { qid: "q4", kind: "matching", number: "4.", prompt: "The historical point when sleep research advanced.", short_label: "When sleep research advanced", answer_key: "A" },
      { qid: "q5", kind: "tf", number: "5.", prompt: "Most dreaming takes place during non-REM sleep.", short_label: "Most dreaming during non-REM sleep", answer_key: "FALSE" },
      { qid: "q6", kind: "tf", number: "6.", prompt: "Sleeping under six hours a night improves decision-making.", short_label: "Under six hours improves decision-making", answer_key: "FALSE" },
      { qid: "q7", kind: "tf", number: "7.", prompt: "Caffeine is the main cause of obesity.", short_label: "Caffeine is the main cause of obesity", answer_key: "NOT GIVEN" },
    ],
    vocab: [
      { word: "Consolidate", definition: "To make memories or knowledge stronger and more permanent.", translation: "Mustahkamlamoq" },
      { word: "Deprivation", definition: "The lack or denial of something considered essential.", translation: "Mahrumlik" },
      { word: "Suppress", definition: "To prevent or restrain a process or feeling.", translation: "Bostirmoq" },
      { word: "Restorative", definition: "Having the ability to restore health or strength.", translation: "Tiklovchi" },
      { word: "Cognitive function", definition: "Mental processes such as thinking and memory.", translation: "Kognitiv (aqliy) faoliyat" },
    ],
  },
  {
    id: "energy", title: "The Transition to Renewable Energy", order_index: 4,
    paragraphs: [
      { label: "A", text: `For over a century, the global economy has been powered largely by fossil fuels such as coal, oil, and natural gas. However, growing awareness of climate change and the finite nature of these resources has accelerated a worldwide shift towards renewable energy.` },
      { label: "B", text: `Solar and wind power have experienced the most dramatic growth. The cost of solar panels has fallen by more than 80 per cent since 2010, making them competitive with, and in many regions cheaper than, conventional power sources.` },
      { label: "C", text: `Despite this progress, renewable energy faces a key challenge: intermittency. The sun does not always shine and the wind does not always blow, which means supply can fluctuate. Large-scale battery storage and smart grids are being developed to balance these variations.` },
      { label: "D", text: `Government policy has played a decisive role in the energy transition. Subsidies, carbon taxes, and ambitious emissions targets have encouraged investment, while some countries have pledged to become carbon neutral within decades.` },
      { label: "E", text: `The transition is not without controversy. Critics argue that manufacturing solar panels and wind turbines consumes significant resources, and that the shift may threaten jobs in traditional energy sectors. Supporters counter that the long-term environmental and economic benefits outweigh these costs.` },
    ],
    questions: [
      { qid: "q1", kind: "matching", number: "1.", prompt: "A technical obstacle to renewable energy.", short_label: "A technical obstacle to renewable energy", answer_key: "C" },
      { qid: "q2", kind: "matching", number: "2.", prompt: "The role of governments in encouraging change.", short_label: "The role of governments", answer_key: "D" },
      { qid: "q3", kind: "matching", number: "3.", prompt: "The reason the shift away from fossil fuels began.", short_label: "Why the shift began", answer_key: "A" },
      { qid: "q4", kind: "matching", number: "4.", prompt: "Arguments both for and against the transition.", short_label: "Arguments for and against", answer_key: "E" },
      { qid: "q5", kind: "tf", number: "5.", prompt: "Solar panels are now more expensive than fossil fuels everywhere.", short_label: "Solar more expensive everywhere", answer_key: "FALSE" },
      { qid: "q6", kind: "tf", number: "6.", prompt: "Some nations aim to reach carbon neutrality.", short_label: "Some nations aim for carbon neutrality", answer_key: "TRUE" },
      { qid: "q7", kind: "tf", number: "7.", prompt: "Wind power creates more jobs than coal.", short_label: "Wind creates more jobs than coal", answer_key: "NOT GIVEN" },
    ],
    vocab: [
      { word: "Intermittency", definition: "The quality of stopping and starting; not continuous.", translation: "Uzlukli ishlash" },
      { word: "Finite", definition: "Limited in size or extent; having an end.", translation: "Cheklangan" },
      { word: "Subsidies", definition: "Money granted by a government to support an industry.", translation: "Subsidiyalar" },
      { word: "Carbon neutral", definition: "Adding no net carbon dioxide to the atmosphere.", translation: "Uglerod neytral" },
      { word: "Decisive", definition: "Settling an issue; producing a definite result.", translation: "Hal qiluvchi" },
    ],
  },
  {
    id: "olympics", title: "The History of the Olympic Games", order_index: 5,
    paragraphs: [
      { label: "A", text: `The Olympic Games are among the world's oldest and most celebrated sporting events. The ancient Games began in Olympia, Greece, in 776 BC, held in honour of the god Zeus, and continued for nearly twelve centuries before being banned by the Roman emperor Theodosius in AD 393.` },
      { label: "B", text: `The modern Olympics were revived in 1896 by the French educator Pierre de Coubertin, who believed that international sporting competition could promote peace and understanding between nations. The first modern Games, held in Athens, featured 241 athletes from 14 countries.` },
      { label: "C", text: `Over the following decades, the Games grew enormously in scale and significance. The introduction of the Winter Olympics in 1924 and the gradual inclusion of women athletes transformed the event into a truly global spectacle.` },
      { label: "D", text: `The Olympics have not been immune to political tension. Several Games were cancelled during the two World Wars, and the Cold War era saw a number of boycotts, most notably the United States' withdrawal from the 1980 Moscow Games.` },
      { label: "E", text: `Today, hosting the Olympics is both a source of national pride and a subject of debate. While the Games can boost tourism and infrastructure, critics point to the enormous costs and the temporary nature of many of the facilities built.` },
    ],
    questions: [
      { qid: "q1", kind: "matching", number: "1.", prompt: "The revival of the Games in modern times.", short_label: "The revival of the Games", answer_key: "B" },
      { qid: "q2", kind: "matching", number: "2.", prompt: "Political conflicts that affected the Games.", short_label: "Political conflicts affecting the Games", answer_key: "D" },
      { qid: "q3", kind: "matching", number: "3.", prompt: "The ancient religious origins of the Games.", short_label: "Ancient religious origins", answer_key: "A" },
      { qid: "q4", kind: "matching", number: "4.", prompt: "The financial concerns of hosting today.", short_label: "Financial concerns of hosting today", answer_key: "E" },
      { qid: "q5", kind: "tf", number: "5.", prompt: "The ancient Games lasted for around 1,200 years.", short_label: "Ancient Games lasted ~1,200 years", answer_key: "TRUE" },
      { qid: "q6", kind: "tf", number: "6.", prompt: "Women took part in the first modern Olympic Games in 1896.", short_label: "Women in the first modern Games", answer_key: "FALSE" },
      { qid: "q7", kind: "tf", number: "7.", prompt: "Over sixty nations joined the 1980 boycott.", short_label: "Over sixty nations in 1980 boycott", answer_key: "NOT GIVEN" },
    ],
    vocab: [
      { word: "Revived", definition: "Brought back into use, existence, or activity.", translation: "Qayta tiklangan" },
      { word: "Spectacle", definition: "A visually striking public performance or display.", translation: "Tomosha/sahna" },
      { word: "Boycott", definition: "To refuse to take part in something as a protest.", translation: "Boykot qilmoq" },
      { word: "Infrastructure", definition: "The basic physical systems of a country (roads, power, etc.).", translation: "Infratuzilma" },
      { word: "Immune to", definition: "Not affected or influenced by something.", translation: "Ta'siriga berilmaydigan" },
    ],
  },
  {
    id: "habits", title: "The Psychology of Habits", order_index: 6,
    paragraphs: [
      { label: "A", text: `Habits are automatic behaviours that the brain develops to conserve mental energy. Psychologists estimate that nearly half of our daily actions are driven by habit rather than conscious decision-making.` },
      { label: "B", text: `Research has identified a three-step "habit loop" consisting of a cue, a routine, and a reward. A cue triggers the behaviour, the routine is the action itself, and the reward reinforces the loop, making the habit stronger over time.` },
      { label: "C", text: `Bad habits can be difficult to break because the underlying neural pathways remain in the brain even after the behaviour stops. Rather than eliminating a habit entirely, experts suggest replacing the routine while keeping the same cue and reward.` },
      { label: "D", text: `The environment plays a powerful role in shaping habits. Studies show that people are far more likely to adopt a new behaviour when it is made easy and visible, such as placing healthy food at eye level or keeping a book by the bed.` },
      { label: "E", text: `Forming a lasting habit takes time and consistency. Although a popular myth claims it takes twenty-one days, research suggests the average is closer to two months, with the exact period varying considerably between individuals.` },
    ],
    questions: [
      { qid: "q1", kind: "matching", number: "1.", prompt: "The role of surroundings in forming behaviour.", short_label: "Role of surroundings in forming behaviour", answer_key: "D" },
      { qid: "q2", kind: "matching", number: "2.", prompt: "A method for changing unwanted behaviour.", short_label: "A method for changing unwanted behaviour", answer_key: "C" },
      { qid: "q3", kind: "matching", number: "3.", prompt: "The mental components that make up a habit.", short_label: "The components that make up a habit", answer_key: "B" },
      { qid: "q4", kind: "matching", number: "4.", prompt: "How long it actually takes to form a habit.", short_label: "How long it takes to form a habit", answer_key: "E" },
      { qid: "q5", kind: "tf", number: "5.", prompt: "About half of our daily actions are habitual.", short_label: "Half of daily actions are habitual", answer_key: "TRUE" },
      { qid: "q6", kind: "tf", number: "6.", prompt: "Removing a habit erases its neural pathway from the brain.", short_label: "Removing a habit erases its pathway", answer_key: "FALSE" },
      { qid: "q7", kind: "tf", number: "7.", prompt: "It always takes exactly 21 days to form a habit.", short_label: "Always exactly 21 days", answer_key: "FALSE" },
    ],
    vocab: [
      { word: "Cue", definition: "A signal that triggers a particular behaviour.", translation: "Ishora/turtki" },
      { word: "Routine", definition: "A regular, repeated sequence of actions.", translation: "Odat/tartib" },
      { word: "Reinforce", definition: "To make something stronger.", translation: "Mustahkamlamoq" },
      { word: "Neural pathway", definition: "A connection between neurons in the brain.", translation: "Nerv yo'li" },
      { word: "Consistency", definition: "The quality of being regular and steady.", translation: "Izchillik" },
    ],
  },
  {
    id: "transport", title: "The Future of Urban Transport", order_index: 7,
    paragraphs: [
      { label: "A", text: `As cities grow ever larger, the challenge of moving people efficiently has become one of the most pressing issues of modern urban planning. Traffic congestion costs the global economy billions of dollars each year in lost time and fuel.` },
      { label: "B", text: `Public transport systems such as metros and buses remain the backbone of urban mobility. Cities that invest heavily in reliable, affordable public transport tend to have lower levels of congestion and air pollution.` },
      { label: "C", text: `Electric vehicles are increasingly seen as a solution to urban pollution. However, critics point out that they do not reduce traffic itself, and that the electricity used to charge them must come from clean sources to be truly beneficial.` },
      { label: "D", text: `A more radical idea is the concept of the "fifteen-minute city", in which all essential services are within a short walk or cycle of every home. Supporters argue this reduces the need for cars altogether.` },
      { label: "E", text: `Autonomous, or self-driving, vehicles may transform transport in the coming decades. Yet questions remain about their safety, the regulations needed to control them, and their impact on employment in the driving industry.` },
    ],
    questions: [
      { qid: "q1", kind: "matching", number: "1.", prompt: "A design that removes the need to travel far.", short_label: "A design removing the need to travel far", answer_key: "D" },
      { qid: "q2", kind: "matching", number: "2.", prompt: "The economic damage caused by traffic.", short_label: "Economic damage caused by traffic", answer_key: "A" },
      { qid: "q3", kind: "matching", number: "3.", prompt: "A limitation of electric cars.", short_label: "A limitation of electric cars", answer_key: "C" },
      { qid: "q4", kind: "matching", number: "4.", prompt: "Uncertainties surrounding driverless technology.", short_label: "Uncertainties about driverless tech", answer_key: "E" },
      { qid: "q5", kind: "tf", number: "5.", prompt: "Investing in public transport tends to lower pollution.", short_label: "Public transport lowers pollution", answer_key: "TRUE" },
      { qid: "q6", kind: "tf", number: "6.", prompt: "Electric vehicles reduce the number of cars on the road.", short_label: "EVs reduce number of cars", answer_key: "FALSE" },
      { qid: "q7", kind: "tf", number: "7.", prompt: "Self-driving cars are already fully regulated worldwide.", short_label: "Self-driving cars fully regulated", answer_key: "NOT GIVEN" },
    ],
    vocab: [
      { word: "Congestion", definition: "Overcrowding that causes blockage or delay.", translation: "Tirbandlik" },
      { word: "Mobility", definition: "The ability to move or be moved freely.", translation: "Harakatchanlik" },
      { word: "Autonomous", definition: "Acting independently; self-governing.", translation: "Avtonom/mustaqil" },
      { word: "Regulation", definition: "A rule or directive made by an authority.", translation: "Qoida/tartibga solish" },
      { word: "Pressing", definition: "Urgent; needing immediate attention.", translation: "Dolzarb" },
    ],
  },
  {
    id: "bilingual", title: "The Benefits of Bilingualism", order_index: 8,
    paragraphs: [
      { label: "A", text: `Speaking more than one language was once thought to confuse children and slow their development. Modern research, however, has overturned this view, revealing that bilingualism offers significant cognitive advantages.` },
      { label: "B", text: `Bilingual individuals constantly switch between languages, which strengthens the brain's "executive function" — the ability to focus, plan, and ignore distractions. This mental exercise is often compared to a workout for the brain.` },
      { label: "C", text: `One of the most striking findings is that bilingualism may delay the onset of dementia. Studies suggest that lifelong bilinguals develop symptoms of Alzheimer's disease, on average, several years later than monolinguals.` },
      { label: "D", text: `Bilingualism also brings clear social and economic benefits. People who speak two or more languages can communicate with a wider range of people and often have access to better job opportunities in a globalised world.` },
      { label: "E", text: `Despite these advantages, maintaining two languages requires effort. Without regular use, a second language can fade, and children in particular may lose fluency if a language is not actively supported at home and school.` },
    ],
    questions: [
      { qid: "q1", kind: "matching", number: "1.", prompt: "The effort required to keep a language.", short_label: "Effort required to keep a language", answer_key: "E" },
      { qid: "q2", kind: "matching", number: "2.", prompt: "A possible protective effect against brain disease.", short_label: "Protective effect against brain disease", answer_key: "C" },
      { qid: "q3", kind: "matching", number: "3.", prompt: "The practical, real-world advantages of speaking languages.", short_label: "Practical advantages of languages", answer_key: "D" },
      { qid: "q4", kind: "matching", number: "4.", prompt: "How using two languages trains the mind.", short_label: "How two languages train the mind", answer_key: "B" },
      { qid: "q5", kind: "tf", number: "5.", prompt: "Bilingualism was always believed to benefit children.", short_label: "Bilingualism always believed beneficial", answer_key: "FALSE" },
      { qid: "q6", kind: "tf", number: "6.", prompt: "Bilinguals may show dementia symptoms later than monolinguals.", short_label: "Bilinguals show dementia later", answer_key: "TRUE" },
      { qid: "q7", kind: "tf", number: "7.", prompt: "Children never lose a second language once they have learned it.", short_label: "Children never lose a second language", answer_key: "FALSE" },
    ],
    vocab: [
      { word: "Cognitive", definition: "Relating to thinking, learning and understanding.", translation: "Kognitiv/aqliy" },
      { word: "Executive function", definition: "Mental skills for planning, focus and self-control.", translation: "Ijroiya funksiya" },
      { word: "Onset", definition: "The beginning or start of something.", translation: "Boshlanish" },
      { word: "Monolingual", definition: "Speaking or using only one language.", translation: "Bir tilli" },
      { word: "Fluency", definition: "The ability to speak or write smoothly and easily.", translation: "Ravonlik" },
    ],
  },
];

async function main() {
  console.log("Seeding reading content → Supabase");
  await del("reading_passages"); // cascades to questions + vocab
  await insert("reading_passages", passages.map(p => ({ id: p.id, title: p.title, paragraphs: p.paragraphs, order_index: p.order_index })));
  await insert("reading_questions", passages.flatMap(p => p.questions.map((q, i) => ({ passage_id: p.id, qid: q.qid, kind: q.kind, number: q.number, prompt: q.prompt, short_label: q.short_label, answer_key: q.answer_key, order_index: i }))));
  await insert("reading_vocab", passages.flatMap(p => p.vocab.map((v, i) => ({ passage_id: p.id, word: v.word, definition: v.definition, translation: v.translation, order_index: i }))));
  console.log("Done.");
}
main().catch(e => { console.error(e); process.exit(1); });
