"use client";

import { useStoredRawState } from "@/lib/clientStore";
import { useTargetLevel } from "@/lib/usePrepPlan";
import { useHydrated } from "@/lib/clientStore";
import { aiFetch } from "@/lib/apiClient";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useDisplaySettings, DisplaySettings, MIN_SCALE, MAX_SCALE } from "@/components/DisplaySettings";
import { supabase } from "@/lib/supabase";
import { usePracticeLanguage } from "@/lib/usePracticeLanguage";
import { useTrack } from "@/lib/useTrack";
import { trackScore } from "@/lib/tracks";
import { appendTestHistory, loadTestHistory } from "@/lib/useTestHistory";
import { getExamFormat, nativeScoreLabel } from "@/lib/examFormats";
import { Difficulty, DIFFICULTY_LABELS, DIFFICULTIES } from "@/lib/difficulty";

// Keyed by passage id so it applies whether the passage came from the inline fallback
// or from Supabase (Supabase rows have no difficulty column вЂ” id is the only shared key).
// Approximate, by topic/vocabulary complexity, not an official rubric.
const READING_DIFFICULTY: Record<string, Difficulty> = {
  universe: "hard", ai: "medium", tea: "easy",
  sleep: "medium", energy: "hard", olympics: "easy",
  habits: "medium", transport: "medium", bilingual: "easy",
};

function parseExplanation(explanationText: string) {
  const result = {
    correctReason: "",
    proof: "",
    userReason: "",
    tip: ""
  };
  
  if (!explanationText) return result;
  
  const parts = explanationText.split(/(вњ…|рџ“Њ|вќЊ|рџ’Ў)/);
  
  let currentKey: keyof typeof result | null = null;
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p === "вњ…") {
      currentKey = "correctReason";
    } else if (p === "рџ“Њ") {
      currentKey = "proof";
    } else if (p === "вќЊ") {
      currentKey = "userReason";
    } else if (p === "рџ’Ў") {
      currentKey = "tip";
    } else if (currentKey && p.trim()) {
      const cleaned = p.replace(/^[\s:-]+/, "").trim();
      result[currentKey] = cleaned;
    }
  }
  
  if (!result.correctReason && !result.proof && !result.userReason && !result.tip) {
    result.correctReason = explanationText;
  }
  
  return result;
}

interface TestRecord {
  id: string;
  type: string;
  date: string;
  band: number;
  correct?: number;
  total?: number;
  passageId?: string;
  language?: string;
}

const VOCABULARY_LISTS: Record<string, { word: string; definition: string; translation: string }[]> = {
  universe: [
    { word: "Redshift", definition: "A shift toward longer wavelengths in light from an object moving away from the observer.", translation: "Qizil siljish" },
    { word: "Primeval", definition: "Belonging to the earliest, most ancient stage of something.", translation: "Ibtidoiy/eng qadimgi" },
    { word: "Nucleosynthesis", definition: "The formation of atomic nuclei from simpler particles.", translation: "Yadro sintezi" },
    { word: "Cosmological constant", definition: "A term added to equations of gravity to allow a static universe.", translation: "Kosmologik doimiy" },
    { word: "Recession (of galaxies)", definition: "The motion of galaxies moving away from an observer.", translation: "Uzoqlashish (harakati)" }
  ],
  ai: [
    { word: "Brittle (system)", definition: "Failing easily when faced with unfamiliar situations.", translation: "Mo'rt/beqaror tizim" },
    { word: "Benchmark", definition: "A standard or point of reference against which things may be compared.", translation: "Mezon/o'lchov" },
    { word: "Symbolic (AI)", definition: "Based on explicit hand-coded rules rather than learned patterns.", translation: "Ramziy (qoidaviy) sun'iy intellekt" },
    { word: "Alignment problem", definition: "Ensuring that AI systems reliably pursue goals beneficial to humans.", translation: "Moslashuv muammosi" },
    { word: "Transformer (architecture)", definition: "A neural network design especially effective at processing language.", translation: "Transformer arxitekturasi" }
  ],
  tea: [
    { word: "Infusion", definition: "A drink made by soaking something in hot water.", translation: "Damlama" },
    { word: "Patronage", definition: "Support given by a powerful or wealthy person.", translation: "Homiylik" },
    { word: "Trade deficit", definition: "A situation in which a country's imports exceed its exports.", translation: "Savdo defitsiti" },
    { word: "Monopoly", definition: "Complete control over the supply of something.", translation: "Monopoliya" },
    { word: "Oxidised", definition: "Chemically changed through exposure to oxygen.", translation: "Oksidlangan" }
  ]
};

const PASSAGES: Record<string, {
  id: string;
  title: string;
  paragraphs: { label: string; text: string }[];
  matchingQuestions: { id: string; number: string; text: string }[];
  tfQuestions: { id: string; number: string; text: string }[];
  keys: Record<string, string>;
  qQuestions: Record<string, string>;
}> = {
  universe: {
    id: "universe",
    title: "The Origins of the Universe",
    paragraphs: [
      { label: "A", text: "Humanity's attempts to explain the origin of the cosmos date back to ancient mythologies, yet it was not until the twentieth century that the question became a matter of rigorous scientific inquiry. For decades, most physicists, including Albert Einstein, assumed the universe was static and eternal, a view so entrenched that Einstein introduced a term called the cosmological constant into his equations of general relativity purely to counteract the gravitational pull that would otherwise cause a static universe to collapse. This assumption was overturned in 1929, when the American astronomer Edwin Hubble, studying the light from distant galaxies, discovered that virtually all of them displayed a redshift in their spectra proportional to their distance from Earth. This meant that galaxies were receding from us, and the farther away they were, the faster they were moving, providing the first observational evidence that the universe itself was expanding." },
      { label: "B", text: "If space itself was expanding, then logically it must have been far smaller, denser, and hotter in the distant past. This insight, first proposed mathematically by the Belgian priest and physicist Georges LemaГ®tre in 1931, who described a 'primeval atom' from which all matter emerged, formed the theoretical basis of what became known as the Big Bang model. According to this framework, roughly 13.8 billion years ago, the observable universe originated from an extraordinarily hot and dense state and has been expanding and cooling ever since. Within the first few minutes, this cooling permitted protons and neutrons to fuse into the nuclei of light elements such as hydrogen and helium, a process known as Big Bang nucleosynthesis. Hundreds of millions of years later, gravity drew these primordial gas clouds together into the first stars, which eventually assembled into the galaxies that populate the universe today." },
      { label: "C", text: "The Big Bang model did not go unchallenged. In 1948, the astronomers Hermann Bondi, Thomas Gold, and Fred Hoyle proposed a rival explanation known as the Steady State theory. Rooted in what they termed the 'perfect cosmological principle,' this model held that the universe has no beginning and no end; as galaxies drift apart from one another, new matter is spontaneously and continuously created in the gaps to form fresh stars and galaxies, so that the overall density and appearance of the universe remain constant through infinite time. Ironically, it was Hoyle himself, dismissive of his rivals' theory during a 1949 radio broadcast, who coined the term 'Big Bang,' intending it as a derisive label. For more than a decade, the scientific community remained genuinely divided between these two competing pictures of cosmic history, with observational evidence too sparse to definitively favour either." },
      { label: "D", text: "The dispute was finally resolved in 1964, when two radio astronomers at Bell Labs, Arno Penzias and Robert Wilson, detected a faint, uniform microwave hiss coming from every direction of the sky. Initially suspecting a fault in their antenna, they eventually ruled out interference from local sources before realising that the signal was, in fact, cosmic in origin. This radiation, now called the Cosmic Microwave Background (CMB), was quickly identified by physicists at Princeton as the cooled, redshifted afterglow of the hot early universe predicted by the Big Bang model; the Steady State theory had no mechanism to produce it at all. The discovery earned Penzias and Wilson the 1978 Nobel Prize in Physics, and subsequent satellite missions, including COBE and WMAP, mapped the CMB's minute temperature fluctuations with such precision that they effectively settled the debate in the Big Bang model's favour." },
      { label: "E", text: "Confirmation of the Big Bang, however, opened as many questions as it answered. In the 1970s, astronomer Vera Rubin's observations of galaxy rotation speeds suggested that visible matter alone could not account for the gravitational forces holding galaxies together, implying the existence of an invisible substance now called dark matter. Then, in 1998, two independent teams studying distant exploding stars called Type Ia supernovae found that the expansion of the universe was not slowing under gravity, as expected, but accelerating, a discovery attributed to a mysterious force termed dark energy and later honoured with the 2011 Nobel Prize. Together, dark matter and dark energy are now thought to constitute over ninety percent of the universe's total content, yet neither has been directly detected, and the singularity at the very instant of the Big Bang itself remains beyond the reach of current physical theory." }
    ],
    matchingQuestions: [
      { id: "p1q1", number: "1.", text: "A term added to a famous physicist's equations to preserve a static universe." },
      { id: "p1q2", number: "2.", text: "The scientist who first mathematically proposed an expanding universe originating from a single primeval point." },
      { id: "p1q3", number: "3.", text: "An alternative theory suggesting matter is continuously created as the universe expands." },
      { id: "p1q4", number: "4.", text: "An accidental astronomical discovery that resolved a long-standing scientific dispute." },
      { id: "p1q5", number: "5.", text: "Evidence for an invisible substance inferred from the speed of galaxy rotation." },
      { id: "p1q6", number: "6.", text: "A now-famous name for a theory that was coined by one of its opponents." }
    ],
    tfQuestions: [
      { id: "p1q7", number: "7.", text: "Hubble's observations showed that all galaxies are moving away from Earth at the same speed." },
      { id: "p1q8", number: "8.", text: "Big Bang nucleosynthesis occurred within the first few minutes of the universe's existence." },
      { id: "p1q9", number: "9.", text: "The Steady State theory proposes that the universe had a definite beginning." },
      { id: "p1q10", number: "10.", text: "Penzias and Wilson were originally searching for the Cosmic Microwave Background." },
      { id: "p1q11", number: "11.", text: "The 2011 Nobel Prize recognised the discovery that cosmic expansion is accelerating." },
      { id: "p1q12", number: "12.", text: "The COBE and WMAP satellite missions were funded primarily by the European Space Agency." },
      { id: "p1q13", number: "13.", text: "Georges LemaГ®tre was a scientist who worked at Bell Labs." },
      { id: "p1q14", number: "14.", text: "Dark matter has been directly detected by modern scientific instruments." }
    ],
    keys: { p1q1: 'A', p1q2: 'B', p1q3: 'C', p1q4: 'D', p1q5: 'E', p1q6: 'C', p1q7: 'FALSE', p1q8: 'TRUE', p1q9: 'FALSE', p1q10: 'FALSE', p1q11: 'TRUE', p1q12: 'NOT GIVEN', p1q13: 'FALSE', p1q14: 'FALSE' },
    qQuestions: {
      p1q1: 'Term added to preserve a static universe',
      p1q2: 'Scientist who first proposed an expanding universe from a primeval point',
      p1q3: 'Theory suggesting matter is continuously created',
      p1q4: 'Accidental discovery that resolved a scientific dispute',
      p1q5: 'Evidence for dark matter from galaxy rotation speed',
      p1q6: "Famous name coined by one of the theory's opponents",
      p1q7: 'All galaxies move away from Earth at the same speed',
      p1q8: 'Nucleosynthesis occurred within the first few minutes',
      p1q9: 'Steady State theory proposes a definite beginning',
      p1q10: 'Penzias and Wilson were searching for the CMB',
      p1q11: '2011 Nobel Prize recognised accelerating expansion',
      p1q12: 'COBE/WMAP funded primarily by the European Space Agency',
      p1q13: 'LemaГ®tre worked at Bell Labs',
      p1q14: 'Dark matter has been directly detected'
    }
  },
  ai: {
    id: "ai",
    title: "The Evolution of Artificial Intelligence",
    paragraphs: [
      { label: "A", text: "The formal study of artificial intelligence began in 1950, when the British mathematician Alan Turing published a paper proposing what became known as the Turing Test, a method for determining whether a machine could exhibit behaviour indistinguishable from that of a human. Six years later, a small group of researchers, including John McCarthy, who coined the term 'artificial intelligence' for the occasion, gathered at Dartmouth College for a summer workshop that is now regarded as the field's official birth. Early programs such as the Logic Theorist, created by Allen Newell and Herbert Simon, could prove mathematical theorems and led many researchers to predict, with striking overconfidence, that machines matching human intelligence were merely a decade or two away." },
      { label: "B", text: "That optimism proved premature. Government funding bodies, disappointed by the gap between promise and results, sharply curtailed AI research following critical assessments such as the UK's 1973 Lighthill Report, ushering in what researchers now call the first 'AI winter.' A partial revival occurred in the early 1980s with the commercial success of expert systems, programs like MYCIN and DENDRAL that encoded the specialised knowledge of human experts into extensive sets of hand-crafted 'if-then' rules to diagnose diseases or identify chemical compounds. Yet these systems proved brittle: they could not learn from new information, struggled with any scenario their programmers had not explicitly anticipated, and were prohibitively expensive to update, and by the late 1980s a second AI winter had set in as this approach, too, failed to scale." },
      { label: "C", text: "Renewed progress emerged in the 1990s and 2000s through a fundamental change in approach. Rather than hand-coding explicit rules, researchers increasingly built statistical models, including support vector machines and early neural networks, that could learn patterns directly from examples in data. This shift from symbolic to data-driven methods was accelerated by two converging trends: the exponential growth of digitally available data and the increasing availability of powerful graphics processing units, or GPUs, originally designed for rendering video games, which turned out to be remarkably well suited to the parallel calculations that machine learning requires. The 2009 release of ImageNet, a vast, meticulously labelled database of millions of photographs, gave researchers a common benchmark against which to measure and compete on real progress." },
      { label: "D", text: "The decisive turning point came in 2012, when a deep neural network named AlexNet dramatically outperformed all competitors in the annual ImageNet image-recognition competition, convincing the wider research community of deep learning's power and triggering a surge of investment. Four years later, DeepMind's AlphaGo defeated Lee Sedol, one of the world's strongest players of the ancient board game Go, a feat many experts had assumed was at least a decade away given the game's immense complexity. In 2017, Google researchers introduced the transformer, a new neural network architecture described in a paper titled 'Attention Is All You Need,' which proved exceptionally effective at processing language and would soon underpin every major breakthrough in the years that followed." },
      { label: "E", text: "That architecture now powers the large language models and generative AI systems, such as ChatGPT, that have brought artificial intelligence into daily use for hundreds of millions of people since 2022. Their fluency has been matched by growing unease: critics point to the risk of amplifying biases present in training data, the ease with which such systems generate convincing misinformation, and the unresolved 'alignment problem' of ensuring increasingly capable systems reliably pursue goals that are beneficial to humanity. In 2023, Geoffrey Hinton, a researcher often credited as a father of deep learning, resigned from his position at Google partly to speak freely about these risks, a move that intensified public debate over whether artificial general intelligence, should it ever be achieved, might ultimately escape meaningful human control." }
    ],
    matchingQuestions: [
      { id: "p2q1", number: "15.", text: "The event widely regarded as the official beginning of AI as a research field." },
      { id: "p2q2", number: "16.", text: "A technological factor, originally intended for an unrelated purpose, that helped accelerate machine learning." },
      { id: "p2q3", number: "17.", text: "A game long assumed to be too complex for a machine to master anytime soon." },
      { id: "p2q4", number: "18.", text: "A limitation that caused expert systems to fail as circumstances changed." },
      { id: "p2q5", number: "19.", text: "A prominent researcher who left a major company to warn about future risks." },
      { id: "p2q6", number: "20.", text: "A new architecture that became fundamental to processing language." }
    ],
    tfQuestions: [
      { id: "p2q7", number: "21.", text: "John McCarthy invented the Turing Test." },
      { id: "p2q8", number: "22.", text: "The Lighthill Report contributed to a reduction in AI research funding." },
      { id: "p2q9", number: "23.", text: "Expert systems were able to learn automatically from new data." },
      { id: "p2q10", number: "24.", text: "ImageNet was created before the first AI winter." },
      { id: "p2q11", number: "25.", text: "AlexNet's success led to increased investment in deep learning." },
      { id: "p2q12", number: "26.", text: "Geoffrey Hinton believes artificial general intelligence poses no risk to humanity." },
      { id: "p2q13", number: "27.", text: "The transformer architecture was introduced in a paper published in 2017." },
      { id: "p2q14", number: "28.", text: "ChatGPT has been in daily use by hundreds of millions of people since 2022." }
    ],
    keys: { p2q1: 'A', p2q2: 'C', p2q3: 'D', p2q4: 'B', p2q5: 'E', p2q6: 'D', p2q7: 'FALSE', p2q8: 'TRUE', p2q9: 'FALSE', p2q10: 'FALSE', p2q11: 'TRUE', p2q12: 'FALSE', p2q13: 'TRUE', p2q14: 'TRUE' },
    qQuestions: {
      p2q1: 'Event regarded as the official beginning of AI',
      p2q2: 'Technological factor that accelerated machine learning',
      p2q3: 'A game assumed too complex for a machine to master soon',
      p2q4: 'Limitation that caused expert systems to fail',
      p2q5: 'Researcher who left a company to warn about risks',
      p2q6: 'New architecture fundamental to processing language',
      p2q7: 'McCarthy invented the Turing Test',
      p2q8: 'Lighthill Report reduced AI funding',
      p2q9: 'Expert systems could learn from new data',
      p2q10: 'ImageNet created before the first AI winter',
      p2q11: "AlexNet's success increased investment in deep learning",
      p2q12: 'Hinton believes AGI poses no risk',
      p2q13: 'Transformer architecture introduced in 2017',
      p2q14: 'ChatGPT in daily use since 2022'
    }
  },
  tea: {
    id: "tea",
    title: "The History and Impact of Tea",
    paragraphs: [
      { label: "A", text: "According to a well-known Chinese legend, tea was discovered in 2737 BC when the mythical Emperor Shen Nong was boiling drinking water beneath a tree and a few leaves accidentally blew into his pot, producing a fragrant, refreshing infusion he decided to try. Whatever its true origins, tea drinking in China can be reliably traced back at least two thousand years, initially valued less as a pleasurable drink than as a medicinal tonic believed to sharpen the mind and aid digestion. Buddhist monks were largely responsible for spreading the practice beyond China's borders, carrying tea seeds and preparation techniques to Japan around the ninth century, where it gradually evolved into the highly formalised and meditative tea ceremony still practised today." },
      { label: "B", text: "Tea did not reach Europe until the early seventeenth century, when Dutch traders working for the Dutch East India Company first shipped it from Asia in 1610, followed shortly afterwards by Portuguese merchants. For decades it remained an expensive curiosity enjoyed only by the wealthy, until the beverage received an unlikely boost from royalty: in 1662, the Portuguese princess Catherine of Braganza married King Charles II of England, bringing her fondness for tea with her to the English court. Her patronage made tea fashionable among the aristocracy, and within a few decades it had begun to rival coffee as the preferred drink in English society, served in the elegant coffee houses and private drawing rooms that were becoming central to social life in London." },
      { label: "C", text: "As British demand for tea grew explosively through the eighteenth century, a serious economic problem emerged: China, the sole source of tea at the time, would accept payment only in silver, creating an enormous and unsustainable trade deficit for Britain. To correct this imbalance, British merchants began illegally exporting opium grown in colonial India into China, and although the Chinese government banned the drug and attempted to halt the trade, Britain responded with military force. The resulting conflict, known as the First Opium War, ended in 1842 with a decisive British victory and the Treaty of Nanking, which forced China to cede the island of Hong Kong to Britain and open several ports to foreign trade." },
      { label: "D", text: "Determined to end its dependence on Chinese tea altogether, the British East India Company sponsored a daring mission by the Scottish botanist Robert Fortune, who disguised himself in Chinese dress and travelled deep into regions of China forbidden to foreigners between 1848 and 1851. Fortune successfully smuggled thousands of tea plants and seeds, along with several skilled Chinese tea workers, out of the country and transported them to British-controlled India, where they were used to establish plantations in the Darjeeling and Assam regions. Within a generation, Indian tea production had grown quickly enough to end China's centuries-long dominance of the tea trade, transforming tea from a luxury import into an everyday commodity across the British Empire." },
      { label: "E", text: "Today, tea is the second most widely consumed beverage in the world after water, and virtually all of its major varieties, including black, green, oolong, and white tea, are produced from the leaves of a single plant species, Camellia sinensis, with their distinctive flavours arising primarily from differences in how the leaves are processed and oxidised after picking. Modern scientific research has identified numerous potential health benefits associated with regular tea consumption, particularly linked to antioxidant compounds called catechins, though many claims remain the subject of ongoing study. Beyond its chemistry, tea continues to carry deep cultural significance worldwide, from the precise, ritualised choreography of the Japanese tea ceremony to the relaxed sociability of British afternoon tea and the sweet, mint-infused tea traditionally served across Morocco." }
    ],
    matchingQuestions: [
      { id: "p3q1", number: "29.", text: "A legendary account of how tea was first discovered." },
      { id: "p3q2", number: "30.", text: "A royal marriage that helped popularise tea among the English upper classes." },
      { id: "p3q3", number: "31.", text: "A conflict that resulted in territory being handed over to Britain." },
      { id: "p3q4", number: "32.", text: "A secret mission to obtain tea plants from a country that restricted foreigners." },
      { id: "p3q5", number: "33.", text: "Different tea varieties that all originate from the same plant species." },
      { id: "p3q6", number: "34.", text: "The spread of tea-drinking traditions to another Asian country." }
    ],
    tfQuestions: [
      { id: "p3q7", number: "35.", text: "Emperor Shen Nong is historically confirmed to have discovered tea." },
      { id: "p3q8", number: "36.", text: "Tea was first brought to Europe by British traders." },
      { id: "p3q9", number: "37.", text: "China demanded payment in silver for its tea exports." },
      { id: "p3q10", number: "38.", text: "Robert Fortune openly announced his intentions to Chinese authorities before collecting tea plants." },
      { id: "p3q11", number: "39.", text: "Indian tea production grew quickly enough to end China's long-standing dominance of the tea trade." },
      { id: "p3q12", number: "40.", text: "All types of tea are made from different plant species." },
      { id: "p3q13", number: "41.", text: "Tea is the most widely consumed beverage in the world today." },
      { id: "p3q14", number: "42.", text: "The health benefits of tea have been conclusively proven by modern science." }
    ],
    keys: { p3q1: 'A', p3q2: 'B', p3q3: 'C', p3q4: 'D', p3q5: 'E', p3q6: 'A', p3q7: 'NOT GIVEN', p3q8: 'FALSE', p3q9: 'TRUE', p3q10: 'FALSE', p3q11: 'TRUE', p3q12: 'FALSE', p3q13: 'FALSE', p3q14: 'NOT GIVEN' },
    qQuestions: {
      p3q1: 'Legendary account of how tea was discovered',
      p3q2: 'Royal marriage that popularised tea in England',
      p3q3: 'Conflict resulting in territory handed to Britain',
      p3q4: 'Secret mission to obtain tea plants',
      p3q5: 'Tea varieties from the same plant species',
      p3q6: 'Spread of tea traditions to another Asian country',
      p3q7: 'Shen Nong historically confirmed to have discovered tea',
      p3q8: 'Tea first brought to Europe by British traders',
      p3q9: 'China demanded silver payment for tea',
      p3q10: 'Fortune announced his intentions to Chinese authorities',
      p3q11: "Indian tea production ended China's dominance",
      p3q12: 'All tea types made from different plant species',
      p3q13: 'Tea is the most consumed beverage in the world',
      p3q14: 'Health benefits of tea conclusively proven'
    }
  }
};

// Genuinely native-language exam content (not translated from the English passages above).
// Real TOPIK reading is entirely multiple-choice (no matching-heading/TF-NG), so this uses
// the mcqQuestions shape. Currently one passage per non-English format вЂ” proof of concept for
// "har til o'z haqiqiy formatida" content; more to follow in later passes.
const MULTILEVEL_PASSAGES: typeof PASSAGES = {
  ml_part1: {
    id: "ml_part1",
    title: "Part 1: Matching Signs and Notices",
    paragraphs: [
      { label: "A", text: "CAUTION: Floor is slippery when wet." },
      { label: "B", text: "Please present your boarding pass at the gate." },
      { label: "C", text: "Out of order. Please use the stairs." },
      { label: "D", text: "Do not feed the animals." },
      { label: "E", text: "Staff only. No admittance to unauthorized personnel." }
    ],
    matchingQuestions: [
      { id: "m1q1", number: "1.", text: "You might see this in an airport." },
      { id: "m1q2", number: "2.", text: "You must not enter this room if you don't work here." },
      { id: "m1q3", number: "3.", text: "Be careful where you walk." },
      { id: "m1q4", number: "4.", text: "This machine is currently broken." },
      { id: "m1q5", number: "5.", text: "You should not give food to these creatures." }
    ],
    tfQuestions: [],
    keys: { m1q1: "B", m1q2: "E", m1q3: "A", m1q4: "C", m1q5: "D" },
    qQuestions: { m1q1: "Airport sign", m1q2: "Staff only", m1q3: "Slippery floor", m1q4: "Out of order", m1q5: "Do not feed animals" }
  },
  ml_part2: {
    id: "ml_part2",
    title: "Part 2: Short Texts",
    paragraphs: [
      { label: "Text", text: "Dear Residents,\n\nThe water supply will be interrupted on Tuesday between 9:00 AM and 2:00 PM due to essential maintenance work on the main pipes. We apologize for any inconvenience this may cause. Please ensure you have stored enough water for your morning needs.\n\nManagement" }
    ],
    matchingQuestions: [],
    tfQuestions: [
      { id: "m2q1", number: "6.", text: "The water supply will be cut off for five hours." },
      { id: "m2q2", number: "7.", text: "The interruption is due to a broken pipe." },
      { id: "m2q3", number: "8.", text: "Residents should buy bottled water." },
      { id: "m2q4", number: "9.", text: "The management apologizes for the issue." }
    ],
    keys: { m2q1: "TRUE", m2q2: "FALSE", m2q3: "NOT GIVEN", m2q4: "TRUE" },
    qQuestions: { m2q1: "Duration of water cut", m2q2: "Reason for interruption", m2q3: "Buying bottled water", m2q4: "Apology from management" }
  },
  ml_part3: {
    id: "ml_part3",
    title: "Part 3: Long Reading Passage",
    paragraphs: [
      { label: "A", text: "The history of chocolate dates back thousands of years to the ancient civilizations of Mesoamerica, including the Maya and Aztecs. They consumed chocolate as a bitter, spicy drink, often flavored with chili peppers and vanilla. It was considered a sacred beverage and was even used as currency." },
      { label: "B", text: "When Spanish explorers brought cacao beans back to Europe in the 16th century, the recipe was modified. Sugar and honey were added to counteract the natural bitterness of the cacao, making it a popular luxury item among the European elite." },
      { label: "C", text: "The Industrial Revolution in the 19th century transformed chocolate production. In 1828, Coenraad Johannes van Houten invented the cocoa press, which separated cocoa butter from the roasted beans. This innovation led to the creation of solid chocolate bars, making chocolate affordable and accessible to the general public." }
    ],
    matchingQuestions: [
      { id: "m3q1", number: "10.", text: "The period when chocolate became a solid food rather than just a drink." },
      { id: "m3q2", number: "11.", text: "How chocolate was initially consumed in its earliest known history." },
      { id: "m3q3", number: "12.", text: "The changes made to chocolate to suit European tastes." }
    ],
    tfQuestions: [
      { id: "m3q4", number: "13.", text: "The Aztecs used chocolate as money." },
      { id: "m3q5", number: "14.", text: "The cocoa press was invented by a Spanish explorer." }
    ],
    keys: { m3q1: "C", m3q2: "A", m3q3: "B", m3q4: "TRUE", m3q5: "FALSE" },
    qQuestions: { m3q1: "Solid chocolate invention", m3q2: "Earliest consumption", m3q3: "European recipe changes", m3q4: "Chocolate as currency", m3q5: "Cocoa press inventor" }
  }
};


const NATIVE_PASSAGES: Partial<Record<string, {
  id: string;
  title: string;
  paragraphs: { label: string; text: string }[];
  mcqQuestions: { id: string; number: string; text: string; options: string[] }[];
  keys: Record<string, string>;
  qQuestions: Record<string, string>;
}>> = {
  korean: {
    id: "topik_env",
    title: "н™кІЅ ліґнём™Ђ мћ‘мќЂ м‹¤мІњ (Environmental Protection and Small Practices)",
    paragraphs: [
      { label: "1", text: "н•њкµ­мќ л§ЋмќЂ лЏ„м‹њм—ђм„њлЉ” мµњк·ј лЄ‡ л…„ лЏ™м•€ мќјнљЊмљ©н’€ м‚¬мљ©мќ„ м¤„мќґкё° мњ„н•њ л‹¤м–‘н•њ м •м±…мќ„ м‹њн–‰н•кі  мћ€л‹¤. м€лҐј л“¤м–ґ, м№ґнЋм—ђм„њлЉ” к°њмќё м»µмќ„ к°Ђм ём¤лЉ” м†ђл‹м—ђкІЊ н• мќёмќ„ н•ґ мЈјкі , л§€нЉём—ђм„њлЉ” л№„л‹ђлґ‰м§Ђ лЊЂм‹  мў…мќґлґ‰н€¬л‚ мћҐл°”кµ¬л‹€ м‚¬мљ©мќ„ к¶ЊмћҐн•њл‹¤. мќґлџ¬н•њ ліЂн™”лЉ” мІмќЊм—ђлЉ” л‹¤м†Њ л¶€нЋён•кІЊ лЉђк»ґм§€ м€ мћ€м§Ђл§Њ, м‹њк°„мќґ м§Ђл‚л©ґм„њ л§ЋмќЂ м‹њлЇјл“¤мќґ мћђм—°мЉ¤лџЅкІЊ м Ѓмќ‘н•кі  мћ€л‹¤." },
      { label: "2", text: "нЉ№нћ€ м ЉмќЂ м„ёлЊЂлҐј м¤‘м‹¬мњјлЎњ н™кІЅ ліґнём—ђ лЊЂн•њ кґЂм‹¬мќґ л†’м•„м§Ђкі  мћ€л‹¤. мќґл“¤мќЂ н…Ђлё”лџ¬л‚ л‹¤нљЊмљ© л№ЁлЊЂлҐј м‚¬мљ©н•кі , н•„мљ” м—†лЉ” л¬јк±ґмќЂ м¤‘кі  к±°лћлҐј н†µн•ґ мћ¬н™њмљ©н•њл‹¤. лђн•њ м†Њм…њ лЇёл””м–ґлҐј н†µн•ґ н™кІЅ ліґнёмќ м¤‘мљ”м„±мќ„ м•Њл¦¬лЉ” мє нЋмќём—ђ м Ѓк·№м ЃмњјлЎњ м°ём—¬н•кё°лЏ„ н•њл‹¤." },
      { label: "3", text: "м „л¬ёк°Ђл“¤мќЂ мќґлџ¬н•њ мћ‘мќЂ м‹¤мІњл“¤мќґ лЄЁмќґл©ґ нЃ° ліЂн™”лҐј л§Њл“¤м–ґ л‚ј м€ мћ€л‹¤кі  л§ђн•њл‹¤. м •л¶Ђмќ м •м±…л§ЊмњјлЎњлЉ” н™кІЅ л¬ём њлҐј м™„м „нћ€ н•ґкІ°н•кё° м–ґл µкё° л•Њл¬ём—ђ, к°њмќёмќ л…ёл Ґкіј м‚¬нљЊ м „мІґмќ мќём‹ќ ліЂн™”к°Ђ н•Ёк» мќґлЈЁм–ґм ём•ј н•њл‹¤лЉ” кІѓмќґл‹¤. м•ћмњјлЎњлЏ„ мќґлџ¬н•њ м›Ђм§Ѓмћ„мќґ кі„м†Ќ н™•м‚°лђм–ґ лЌ” л§ЋмќЂ м‚¬лћЊл“¤мќґ н™кІЅ ліґнём—ђ лЏ™м°ён•кё°лҐј кё°лЊЂн•ґ ліёл‹¤." }
    ],
    mcqQuestions: [
      { id: "q1", number: "1.", text: "мќґ кёЂмќ м¤‘м‹¬ л‚ґмљ©мњјлЎњ к°ЂмћҐ м•Њл§ћмќЂ кІѓмќЂ?", options: ["м •л¶Ђмќ н™кІЅ м •м±…мќЂ м‹¤нЊЁн–€л‹¤", "мћ‘мќЂ м‹¤мІњл“¤мќґ лЄЁм—¬ н™кІЅ ліґнём—ђ кё°м—¬н•  м€ мћ€л‹¤", "м ЉмќЂ м„ёлЊЂлЉ” н™кІЅм—ђ кґЂм‹¬мќґ м—†л‹¤", "мќјнљЊмљ©н’€ м‚¬мљ©мќЂ кі„м†Ќ лЉм–ґл‚кі  мћ€л‹¤"] },
      { id: "q2", number: "2.", text: "м№ґнЋм—ђм„њ к°њмќё м»µмќ„ к°Ђм ёмЁ м†ђл‹м—ђкІЊ л¬ґм—‡мќ„ н•ґ мЈјлЉ”к°Ђ?", options: ["л¬ґлЈЊ мќЊлЈЊлҐј м¤Ђл‹¤", "н• мќёмќ„ н•ґ м¤Ђл‹¤", "н…Ђлё”лџ¬лҐј м„ л¬јн•њл‹¤", "нЏ¬мќёнЉёлҐј м Ѓл¦Ѕн•ґ м¤Ђл‹¤"] },
      { id: "q3", number: "3.", text: "м ЉмќЂ м„ёлЊЂк°Ђ н•кі  мћ€лЉ” н–‰лЏ™мњјлЎњ м–ёкё‰лђм§Ђ м•ЉмќЂ кІѓмќЂ?", options: ["л‹¤нљЊмљ© л№ЁлЊЂ м‚¬мљ©", "м¤‘кі  к±°лћлҐј н†µн•њ мћ¬н™њмљ©", "н™кІЅ мє нЋмќё м°ём—¬", "м •л¶Ђ м •м±…м—ђ л°лЊЂн•лЉ” м‹њмњ„"] },
      { id: "q4", number: "4.", text: "м „л¬ёк°Ђл“¤мќ мќкІ¬мњјлЎњ м•Њл§ћмќЂ кІѓмќЂ?", options: ["м •л¶Ђ м •м±…л§ЊмњјлЎњ л¬ём њлҐј н•ґкІ°н•  м€ мћ€л‹¤", "к°њмќёмќ л…ёл Ґкіј м‚¬нљЊм Ѓ мќём‹ќ ліЂн™”к°Ђ н•Ёк» н•„мљ”н•л‹¤", "н™кІЅ л¬ём њлЉ” н•ґкІ°мќґ л¶€к°ЂлЉҐн•л‹¤", "м ЉмќЂ м„ёлЊЂл§Њ л…ёл Ґн•л©ґ м¶©л¶„н•л‹¤"] },
      { id: "q5", number: "5.", text: "мќґ кёЂм—ђм„њ 'мќјнљЊмљ©н’€'мќ„ м¤„мќґкё° мњ„н•њ лЊЂм•€мњјлЎњ м–ёкё‰лђњ кІѓмќЂ?", options: ["н…Ђлё”лџ¬, л‹¤нљЊмљ© л№ЁлЊЂ, мћҐл°”кµ¬л‹€", "л№„л‹ђлґ‰м§Ђ", "м†Њм…њ лЇёл””м–ґ", "н• мќё мї нЏ°"] }
    ],
    keys: { q1: 'B', q2: 'B', q3: 'D', q4: 'B', q5: 'A' },
    qQuestions: {
      q1: 'м¤‘м‹¬ л‚ґмљ© нЊЊм•…', q2: 'м„ёл¶Ђ л‚ґмљ© - м№ґнЋ н• мќё', q3: 'м–ёкё‰лђм§Ђ м•ЉмќЂ кІѓ м°ѕкё°',
      q4: 'м „л¬ёк°Ђ мќкІ¬ нЊЊм•…', q5: 'мќјнљЊмљ©н’€ лЊЂм•€ нЊЊм•…'
    }
  }
};

// IELTS Academic Reading Band Score table (out of 40)
function getIeltsBand(correct: number): string {
  if (correct >= 39) return "9.0";
  if (correct >= 37) return "8.5";
  if (correct >= 35) return "8.0";
  if (correct >= 33) return "7.5";
  if (correct >= 30) return "7.0";
  if (correct >= 27) return "6.5";
  if (correct >= 23) return "6.0";
  if (correct >= 19) return "5.5";
  if (correct >= 15) return "5.0";
  if (correct >= 13) return "4.5";
  if (correct >= 10) return "4.0";
  if (correct >= 8) return "3.5";
  if (correct >= 6) return "3.0";
  return "2.5";
}

// Merge all passage keys and qQuestions for result lookup
function getAllKeys() {
  const keys: Record<string, string> = {};
  Object.values(PASSAGES).forEach(p => Object.assign(keys, p.keys));
  return keys;
}
function getAllQQuestions() {
  const q: Record<string, string> = {};
  Object.values(PASSAGES).forEach(p => Object.assign(q, p.qQuestions));
  return q;
}

export default function ReadingTest() {
  const { track } = useTrack();
  const [activePassageTab, setActivePassageTab] = useState(track.id === "multilevel" ? "ml_part1" : "universe");
  const passageId = activePassageTab; // keep for compat
  const [timeLeft, setTimeLeft] = useState(60 * 60); // 60 minutes
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState<any>(null);
  const [highlightResetKey, setHighlightResetKey] = useState(0);
  const [showVocab, setShowVocab] = useState(false);
  const [testHistory, setTestHistory] = useState<Record<string, TestRecord>>({});
  // Tema localStorage'dan to'g'ridan-to'g'ri o'qiladi вЂ” ilgari effekt ichida
  // setState qilinardi va birinchi kadr har doim qorong'i chiqib, keyin sakrardi.
  const [theme, setTheme] = useStoredRawState("ielts_theme", "dark") as ["dark" | "light", (v: string) => void];
  const display = useDisplaySettings();
  const { fontScale, scheme, readerActive } = display;

  // New CBT States
  const [isTimerHidden, setIsTimerHidden] = useState(false);
  const [leftWidth, setLeftWidth] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const [selectionCoords, setSelectionCoords] = useState<{ x: number; y: number; text: string } | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [flags, setFlags] = useState<Record<string, boolean>>({});


  const toggleFlag = (id: string) => {
    setFlags(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const startResizing = (mouseDownEvent: React.MouseEvent) => {
    setIsResizing(true);
    mouseDownEvent.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const percentage = (e.clientX / window.innerWidth) * 100;
      if (percentage >= 25 && percentage <= 75) {
        setLeftWidth(percentage);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);


  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.toString().trim() === "") {
        setSelectionCoords(null);
        return;
      }
      const range = selection.getRangeAt(0);
      const container = document.getElementById("passage-content");
      if (!container || !container.contains(range.commonAncestorContainer)) {
        return;
      }
      const rect = range.getBoundingClientRect();
      setSelectionCoords({
        x: rect.left + window.scrollX + rect.width / 2,
        y: rect.top + window.scrollY - 40,
        text: selection.toString()
      });
    };

    document.addEventListener("mouseup", handleSelection);
    return () => document.removeEventListener("mouseup", handleSelection);
  }, []);

  // Content is loaded from Supabase; the inline constants act as an offline fallback.
  const [passages, setPassages] = useState<typeof PASSAGES>(track.id === "multilevel" ? MULTILEVEL_PASSAGES : PASSAGES);
  const [vocabLists, setVocabLists] = useState<typeof VOCABULARY_LISTS>(VOCABULARY_LISTS);

  const [currentLang] = usePracticeLanguage();
  
  // SSR-xavfsiz hydration bayrog'i. Ilgari useState(false) + useEffect(setTrue) edi:
  // React 19 da bu effekt ichidagi setState hisoblanadi va birinchi kadr noto'g'ri chiziladi.
  const isClient = useHydrated();
  const targetLevel = useTargetLevel();
  // Faqat AI tarjimasi state'da saqlanadi. Ingliz tilidagi asl matn va qo'lda
  // yozilgan milliy matnlar вЂ” hosila qiymatlar: ularni effektda setState qilish
  // ortiqcha kadr chizib, matn "sakrab" chiqishiga sabab bo'lardi.
  const [translatedPassage, setTranslatedPassage] = useState<any>(null);
  const [translating, setTranslating] = useState(false);

  const basePassage = passages[passageId] || passages.universe;
  const nativePassageForLang =
    currentLang === "english" ? basePassage : (NATIVE_PASSAGES[currentLang] ?? null);
  const displayedPassage = nativePassageForLang ?? translatedPassage;

  useEffect(() => {
    if (!basePassage || nativePassageForLang) return;

    let cancelled = false;
    const loadTranslated = async () => {
      setTranslating(true);
      try {
        const res = await aiFetch("/api/tutor/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            passage: basePassage,
            language: currentLang,
            trackId: track.id,
            targetLevel: targetLevel
          })
        });
        const data = await res.json();
        if (!cancelled && data.translated) {
          setTranslatedPassage(data.translated);
        }
      } catch (e) {
        console.error("Failed to translate passage:", e);
        if (!cancelled) setTranslatedPassage(basePassage);
      } finally {
        if (!cancelled) setTranslating(false);
      }
    };
    
    loadTranslated();
    return () => { cancelled = true; };
  }, [basePassage, currentLang, targetLevel]);

  const currentPassage = displayedPassage || basePassage;
  // Background applied to the reading panel when a custom scheme is on
  const panelStyle = readerActive ? { backgroundColor: scheme.bg } : undefined;
  // Text colour + zoom applied to the actual content
  const contentStyle = { zoom: fontScale, ...(readerActive ? { color: scheme.text } : {}) };
  // Applied to the question cards so questions/answers follow the colour scheme too
  const cardStyle = readerActive ? { backgroundColor: scheme.bg, color: scheme.text, borderColor: "transparent" } : undefined;
  const qTextStyle = readerActive ? { color: scheme.text } : undefined;

  const loadHistory = () => {
    try {
      const history: TestRecord[] = loadTestHistory();
      const map: Record<string, TestRecord> = {};
      history.forEach((record) => {
        if (record.type === "reading" && record.passageId) {
          if (!map[record.passageId] || new Date(record.date) > new Date(map[record.passageId].date)) {
            map[record.passageId] = record;
          }
        }
      });
      setTestHistory(map);
    } catch (e) {
      console.warn("Failed to load test history:", e);
    }
  };

  useEffect(() => {
    // Tarixni serverdan/keshdan qayta o'qish вЂ” tashqi manba bilan sinxronlash,
    // effektning aynan mo'ljallangan vazifasi.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHistory();
  }, [isSubmitted, passageId]);

  // Load reading content from Supabase (falls back to inline constants on any error)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [{ data: ps }, { data: qs }, { data: vs }] = await Promise.all([
          supabase.from("reading_passages").select("*").order("order_index"),
          supabase.from("reading_questions").select("*").order("order_index"),
          supabase.from("reading_vocab").select("*").order("order_index"),
        ]);
        if (cancelled || !ps || ps.length === 0) return;

        const nextPassages: typeof PASSAGES = {};
        const nextVocab: typeof VOCABULARY_LISTS = {};
        for (const p of ps) {
          const pQs = (qs || []).filter((q: any) => q.passage_id === p.id);
          nextPassages[p.id] = {
            id: p.id,
            title: p.title,
            paragraphs: p.paragraphs,
            matchingQuestions: pQs.filter((q: any) => q.kind === "matching").map((q: any) => ({ id: q.qid, number: q.number, text: q.prompt })),
            tfQuestions: pQs.filter((q: any) => q.kind === "tf").map((q: any) => ({ id: q.qid, number: q.number, text: q.prompt })),
            keys: Object.fromEntries(pQs.map((q: any) => [q.qid, q.answer_key])),
            qQuestions: Object.fromEntries(pQs.map((q: any) => [q.qid, q.short_label || q.prompt])),
          };
          nextVocab[p.id] = (vs || []).filter((v: any) => v.passage_id === p.id).map((v: any) => ({ word: v.word, definition: v.definition, translation: v.translation }));
        }
        setPassages(nextPassages);
        setVocabLists(nextVocab);
      } catch (e) {
        console.warn("Supabase reading content unavailable, using built-in passages.", e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Matn almashganda test holatini tozalash.
  // React'ning tavsiya etgan usuli вЂ” buni effektda emas, render vaqtida qilish:
  // effekt bo'lsa, avval eski javoblar bilan bitta ortiqcha kadr chiziladi.
  const [prevPassageId, setPrevPassageId] = useState(passageId);
  if (passageId !== prevPassageId) {
    setPrevPassageId(passageId);
    setAnswers({});
    setIsSubmitted(false);
    setScore(null);
    setHighlightResetKey((prev) => prev + 1);
  }

  useEffect(() => {
    if (timeLeft > 0 && !isSubmitted) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [timeLeft, isSubmitted]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleInputChange = (id: string, value: string) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const submitTest = async () => {
    setIsSubmitted(true);
    setScore(null);
    try {
      if (currentLang === "english") {
        // Client-side scoring for English вЂ” all 42 questions, use IELTS band table
        const allKeys = getAllKeys();
        const allQQ = getAllQQuestions();
        let correct = 0;
        const total = Object.keys(allKeys).length;
        const explanations: Record<string, string> = {};
        Object.entries(allKeys).forEach(([qId, key]) => {
          const userAns = (answers[qId] || "").trim().toUpperCase();
          if (userAns === key) correct++;
          explanations[qId] = `вњ… Correct answer: ${key}. рџ“Њ Refer to the relevant passage paragraph. рџ’Ў Review the passage carefully for this question type.`;
        });
        const band = getIeltsBand(correct);
        const result = { correct, total, band, explanations, allKeys, allQQ };
        setScore(result);
        try {
          appendTestHistory({
            id: `reading_${Date.now()}`,
            type: "reading",
            date: new Date().toISOString(),
            band: parseFloat(band) || 4.0,
            correct,
            total,
            passageId: 'mock_full',
            language: currentLang
          });
        } catch (e) {
          console.warn("Error saving history:", e);
        }
      } else {
        // For non-English, use the native passage
        const nativePassage = NATIVE_PASSAGES[currentLang];
        if (!nativePassage) { setIsSubmitted(false); return; }
        let correct = 0;
        const total = Object.keys(nativePassage.keys).length;
        Object.entries(nativePassage.keys).forEach(([qId, key]) => {
          if ((answers[qId] || "").trim().toUpperCase() === key) correct++;
        });
        const band = getIeltsBand(correct);
        setScore({ correct, total, band, explanations: {} });
        try {
          appendTestHistory({
            id: `reading_${Date.now()}`,
            type: "reading",
            date: new Date().toISOString(),
            band: parseFloat(band) || 4.0,
            correct,
            total,
            passageId: nativePassage.id,
            language: currentLang
          });
        } catch (e) {}
      }
    } catch (error: any) {
      alert("Xatolik: " + error.message);
      setIsSubmitted(false);
    }
  };

  // Highlighting functions
  const highlightSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.toString().trim() === "") return;
    const range = selection.getRangeAt(0);

    const container = document.getElementById("passage-content");
    if (!container || !container.contains(range.commonAncestorContainer)) {
      alert("Iltimos, faqat matn ichidagi so'zlarni belgilang.");
      return;
    }

    const span = document.createElement("span");
    const id = `hl_${Date.now()}`;
    span.id = id;
    span.className = "bg-amber-300 dark:bg-amber-800 text-black dark:text-zinc-100 px-0.5 rounded shadow-sm cursor-pointer transition-colors";
    span.title = "Belgilangan matn (O'chirish uchun ustiga bosing)";
    try {
      range.surroundContents(span);
    } catch (e) {
      console.warn("Could not highlight selection across nodes:", e);
      alert("Belgilashda xatolik: Iltimos, faqat bitta paragraf doirasida belgilang.");
    }
    selection.removeAllRanges();
  };

  const applyNoteSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.toString().trim() === "") return;
    const range = selection.getRangeAt(0);

    const container = document.getElementById("passage-content");
    if (!container || !container.contains(range.commonAncestorContainer)) {
      alert("Iltimos, faqat matn ichidagi so'zlarni belgilang.");
      return;
    }

    const noteText = prompt("Ushbu matn uchun eslatma (note) kiriting:");
    if (!noteText) return;

    const span = document.createElement("span");
    const id = `note_${Date.now()}`;
    span.id = id;
    span.className = "bg-sky-200 dark:bg-sky-900/60 border-b-2 border-sky-455 text-zinc-900 dark:text-zinc-100 px-0.5 rounded cursor-pointer relative";
    span.title = `Eslatma: ${noteText}`;
    try {
      range.surroundContents(span);
      setNotes(prev => ({ ...prev, [id]: noteText }));
    } catch (e) {
      console.warn("Could not add note across nodes:", e);
      alert("Xatolik: Iltimos, faqat bitta paragraf doirasida belgilang.");
    }
    selection.removeAllRanges();
  };

  const handlePassageClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "SPAN" && target.id) {
      if (target.id.startsWith("hl_")) {
        if (confirm("Ushbu belgilashni o'chirib tashlaysizmi?")) {
          const parent = target.parentNode;
          if (parent) {
            while (target.firstChild) {
              parent.insertBefore(target.firstChild, target);
            }
            parent.removeChild(target);
          }
        }
      } else if (target.id.startsWith("note_")) {
        const currentNote = notes[target.id] || "";
        const newNote = prompt("Eslatmani tahrirlang (o'chirish uchun bo'sh qoldiring):", currentNote);
        if (newNote === null) return;
        if (newNote.trim() === "") {
          const parent = target.parentNode;
          if (parent) {
            while (target.firstChild) {
              parent.insertBefore(target.firstChild, target);
            }
            parent.removeChild(target);
          }
          setNotes(prev => {
            const next = { ...prev };
            delete next[target.id];
            return next;
          });
        } else {
          target.title = `Eslatma: ${newNote}`;
          setNotes(prev => ({ ...prev, [target.id]: newNote }));
        }
      }
    }
  };

  const clearHighlights = () => {
    setHighlightResetKey(prev => prev + 1);
    setNotes({});
  };

  const handleCopy = (word: string) => {
    navigator.clipboard.writeText(word);
    alert(`"${word}" nusxalandi!`);
  };

  const saveToMyVocab = (item: { word: string; definition: string; translation: string }) => {
    try {
      const cur = JSON.parse(localStorage.getItem("ielts_vocab_custom") || "[]");
      if (cur.some((w: any) => (w.word || "").toLowerCase() === item.word.toLowerCase())) {
        alert(`"${item.word}" allaqachon lug'atingizda bor.`);
        return;
      }
      cur.unshift({ word: item.word, ipa: "", def: item.definition, uz: item.translation, cefr: "Mine", example: "" });
      localStorage.setItem("ielts_vocab_custom", JSON.stringify(cur));
      alert(`"${item.word}" shaxsiy lug'atingizga qo'shildi! (Lug'at sahifasida takrorlang)`);
    } catch {}
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-500 relative overflow-hidden transition-colors duration-300 ${
      theme === 'dark' ? 'bg-[#09090b] text-[#f4f4f5]' : 'bg-[#f8f9fa] text-[#18181b]'
    }`}>
      {/* Background Radial Glow */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>

      <header className={`sticky top-0 z-30 border-b backdrop-blur-md transition-colors duration-300 ${
        theme === 'dark' ? 'bg-zinc-950/80 border-zinc-900' : 'bg-white/80 border-zinc-200'
      }`}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Link href={`/t/${track.id}`} className="text-zinc-500 hover:text-[#f4f4f5] transition-colors font-semibold text-sm">
              в†ђ Exit Test
            </Link>
            <div className="h-6 w-px bg-zinc-900"></div>
            
            {NATIVE_PASSAGES[currentLang] ? (
              <span className={`text-xs font-bold rounded-xl px-3 py-2 border ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-amber-400' : 'bg-white border-zinc-200 text-amber-600'}`}>
                {track.shortTitle} andoza matni
              </span>
            ) : (
              <div className="flex items-center gap-1">
                {Object.values(passages).map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => setActivePassageTab(p.id)}
                    className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all ${
                      activePassageTab === p.id
                        ? 'bg-amber-500 border-amber-500 text-black'
                        : theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white' : 'bg-white border-zinc-200 text-zinc-700 hover:text-black'
                    }`}
                  >
                    Passage {i + 1}
                  </button>
                ))}
                <span className={`text-[10px] font-mono ml-2 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  42 questions В· 60 min
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <DisplaySettings theme={theme} settings={display} />

            <button
              onClick={toggleTheme}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                theme === 'dark'
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
                  : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:text-black'
              }`}
            >
              {theme === 'dark' ? "вЂпёЏ Light" : "рџЊ™ Dark"}
            </button>
            <button 
              onClick={() => setShowVocab(true)}
              className={`text-xs font-semibold px-3 py-2 rounded-xl transition-all border ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white' : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              рџ“– Lug'atlar (Vocab)
            </button>
            <div 
              onClick={() => {
                if (timeLeft > 600) {
                  setIsTimerHidden(!isTimerHidden);
                }
              }}
              className={`text-xl font-mono font-bold cursor-pointer transition-all select-none px-3 py-1.5 rounded-xl border ${
                timeLeft <= 300
                  ? "bg-red-500/10 border-red-500 text-red-500 animate-pulse"
                  : timeLeft <= 600
                    ? "bg-amber-500/10 border-amber-500 text-amber-500 animate-pulse"
                    : theme === "dark" 
                      ? "bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white"
                      : "bg-zinc-100 border-zinc-200 text-zinc-700 hover:text-black"
              }`}
              title={timeLeft > 600 ? "Vaqtni yashirish/ko'rsatish" : "Vaqt tugamoqda!"}
            >
              {isTimerHidden && timeLeft > 600 ? "вЏ° Vaqt" : formatTime(timeLeft)}
            </div>
             {/* Zoom Controls */}
             <div className="flex items-center gap-2 ml-4">
               <button
                 onClick={() => display.changeFontScale(-0.1)}
                 disabled={display.fontScale <= MIN_SCALE}
                 className={`px-2 py-1 rounded ${theme === 'dark' ? 'bg-zinc-900 text-zinc-300' : 'bg-zinc-100 text-zinc-700'} disabled:opacity-40`}
               >Aв€’</button>
               <span className="w-12 text-center font-mono text-sm">{Math.round(display.fontScale * 100)}%</span>
               <button
                 onClick={() => display.changeFontScale(0.1)}
                 disabled={display.fontScale >= MAX_SCALE}
                 className={`px-2 py-1 rounded ${theme === 'dark' ? 'bg-zinc-900 text-zinc-300' : 'bg-zinc-100 text-zinc-700'} disabled:opacity-40`}
               >A+</button>
               <button
                 onClick={display.resetFontScale}
                 className={`px-2 py-1 rounded ${theme === 'dark' ? 'bg-zinc-900 text-zinc-300' : 'bg-zinc-100 text-zinc-700'}`}
               >Reset</button>
             </div>
            {!isSubmitted && (
              <button 
                onClick={submitTest}
                className="bg-[#f4f4f5] text-[#09090b] px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity"
              >
                Submit
              </button>
            )}
          </div>
        </div>
      </header>

      <main className={`flex-1 w-full mx-auto flex flex-col lg:flex-row transition-colors duration-300 relative ${
        isResizing ? "cursor-col-resize select-none" : ""
      }`}>
        
        {/* Left Column: Passage */}
        <div 
          className={`flex flex-col h-[calc(100vh-64px)] overflow-y-auto p-6 md:p-8 transition-colors duration-300 w-full ${
            readerActive ? '' : theme === 'dark' ? 'bg-[#09090b]' : 'bg-white'
          }`}
          style={{ 
            ...panelStyle, 
            width: isClient && typeof window !== 'undefined' && window.innerWidth >= 1024 ? `${leftWidth}%` : '100%' 
          }}
        >
          <div className={`flex items-center justify-between border-b pb-4 mb-6 ${
            theme === 'dark' ? 'border-zinc-900' : 'border-zinc-200'
          }`}>
            <h2 className="text-lg font-bold font-sans text-zinc-400">Reading Passage</h2>
            <div className="flex gap-2">
              <button 
                onClick={highlightSelection}
                className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold px-3 py-1.5 rounded-lg border border-amber-500/20 transition-colors"
                title="Highlight selected text"
              >
                рџЋЁ Highlight
              </button>
              <button 
                onClick={applyNoteSelection}
                className="bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-xs font-bold px-3 py-1.5 rounded-lg border border-sky-500/20 transition-colors"
                title="Add note to selected text"
              >
                рџ“ќ Add Note
              </button>
              <button 
                onClick={clearHighlights}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                  theme === 'dark' ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border-zinc-800' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-650 border-zinc-250'
                }`}
                title="Clear all highlights"
              >
                рџ—‘пёЏ Clear
              </button>
            </div>
          </div>
          
          <div 
            id="passage-content" 
            key={highlightResetKey} 
            onClick={handlePassageClick}
            style={contentStyle} 
            className={`prose max-w-none font-serif leading-loose text-lg ${
              readerActive ? '' : theme === 'dark' ? 'prose-invert text-zinc-300' : 'text-zinc-800'
            }`}
          >
            {translating ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-zinc-400 text-sm font-semibold animate-pulse">AI Ustoz imtihon matnini tanlangan tilga moslashtirmoqda...</p>
              </div>
            ) : (
              <>
                <h3 className={`text-2xl font-bold mb-6 font-serif ${readerActive ? '' : theme === 'dark' ? 'text-white' : 'text-zinc-900'}`} style={readerActive ? { color: scheme.text } : undefined}>{currentPassage.title}</h3>
                {currentPassage.paragraphs.map((p: any, i: number) => (
                  <p key={i} className="mb-6">
                    <strong>{p.label}.</strong> {p.text}
                  </p>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Divider drag handle */}
        <div 
          onMouseDown={startResizing}
          className={`hidden lg:block w-1.5 hover:w-2 hover:bg-amber-500 cursor-col-resize transition-all z-20 shrink-0 h-full border-x ${
            theme === 'dark' ? 'bg-zinc-900 border-zinc-950' : 'bg-zinc-200 border-zinc-100'
          }`}
          title="Drag to resize panels"
        />

        {/* Right Column: Questions / Scorecard */}
        <div 
          className={`flex flex-col h-[calc(100vh-64px)] overflow-y-auto transition-colors duration-300 w-full ${
            readerActive ? '' : theme === 'dark' ? 'bg-zinc-950/20' : 'bg-[#f4f4f5]/40'
          }`}
          style={{ 
            ...panelStyle, 
            width: isClient && typeof window !== 'undefined' && window.innerWidth >= 1024 ? `${100 - leftWidth}%` : '100%' 
          }}
        >
          
          {translating ? (
            <div className="p-6 md:p-8 flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest">Savollar yuklanmoqda...</p>
            </div>
          ) : !isSubmitted ? (
            <div style={{ zoom: fontScale }} className="p-6 md:p-8 flex flex-col gap-6 animate-in fade-in duration-300">
              {NATIVE_PASSAGES[currentLang] ? (
                /* Native language MCQ passage */
                (() => {
                  const nativePsg = NATIVE_PASSAGES[currentLang]!;
                  return (
                    <div style={cardStyle} className={`border p-6 rounded-xl shadow-md ${
                      readerActive ? 'border-black/10' : theme === 'dark' ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-zinc-200 text-zinc-900 shadow-sm'
                    }`}>
                      <h3 className="font-bold text-base mb-2">Questions 1-{nativePsg.mcqQuestions.length}</h3>
                      <p className="text-xs text-zinc-500 mb-6 italic">Choose the correct answer.</p>
                      <div className="space-y-6">
                        {nativePsg.mcqQuestions.map((q: any) => (
                          <div key={q.id} id={`q_wrapper_${q.id}`} className="flex flex-col gap-2 group">
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={() => toggleFlag(q.id)} className={`text-xs p-1 rounded hover:bg-zinc-800 transition-colors ${flags[q.id] ? "text-blue-500" : "text-zinc-500 opacity-30 group-hover:opacity-100"}`} title="Review later">рџљ©</button>
                              <span className="font-semibold text-sm w-6 text-zinc-500">{q.number}</span>
                              <span style={qTextStyle} className={`text-sm font-semibold ${readerActive ? '' : theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>{q.text}</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-8">
                              {q.options.map((opt: string, optIdx: number) => {
                                const letter = ["A", "B", "C", "D"][optIdx];
                                const isSelected = answers[q.id] === letter;
                                return (
                                  <button key={letter} type="button" onClick={() => handleInputChange(q.id, letter)}
                                    className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                                      isSelected ? 'border-amber-500 bg-amber-500/10 text-amber-500 font-bold' 
                                        : theme === 'dark' ? 'border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:border-zinc-700' 
                                        : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300'
                                    }`}>
                                    <span className="font-extrabold mr-1.5">{letter}.</span> {opt}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()
              ) : (
                /* English: show all 3 passages' questions in sequence */
                Object.values(passages).map((psg: any, psgIdx: number) => (
                  <div key={psg.id} className="flex flex-col gap-4">
                    <div className={`flex items-center gap-3 py-2 border-b ${
                      theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200'
                    }`}>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${
                        theme === 'dark' ? 'bg-zinc-900 text-amber-400' : 'bg-amber-50 text-amber-700'
                      }`}>Passage {psgIdx + 1}</span>
                      <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>{psg.title}</span>
                      <button onClick={() => { setActivePassageTab(psg.id); document.querySelector('#passage-content')?.scrollTo({ top: 0 }); }}
                        className="ml-auto text-[10px] font-bold text-amber-500 hover:text-amber-400 uppercase tracking-wider">
                        в†’ Matnni ko'rish
                      </button>
                    </div>

                    {/* Matching questions for this passage */}
                      {psg.matchingQuestions?.length > 0 && (
                      <div style={cardStyle} className={`border p-5 rounded-xl ${
                      readerActive ? 'border-black/10' : theme === 'dark' ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-zinc-200 shadow-sm'
                    }`}>
                      <h3 className="font-bold text-sm mb-1">Questions {psg.matchingQuestions[0]?.number?.replace('.','')}-{psg.matchingQuestions[psg.matchingQuestions.length-1]?.number?.replace('.','')} вЂ” Matching Information</h3>
                      <p className="text-xs text-zinc-500 mb-4 italic">Which paragraph (A-E) contains the following information? Write the correct letter.</p>
                      <div className="space-y-3">
                        {psg.matchingQuestions.map((q: any) => (
                          <div key={q.id} id={`q_wrapper_${q.id}`} className="flex items-center gap-3 group">
                            <button type="button" onClick={() => toggleFlag(q.id)} className={`text-xs p-1 rounded hover:bg-zinc-800 transition-colors ${flags[q.id] ? "text-blue-500" : "text-zinc-500 opacity-30 group-hover:opacity-100"}`} title="Review later">рџљ©</button>
                            <span className="font-semibold text-xs w-8 text-zinc-500 shrink-0">{q.number}</span>
                            <input type="text" maxLength={1} value={answers[q.id] || ""} onChange={(e) => handleInputChange(q.id, e.target.value.toUpperCase())}
                              className={`w-10 h-9 border rounded-lg text-center font-bold uppercase focus:ring-1 focus:ring-amber-500 outline-none text-sm shrink-0 ${
                                theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                              }`}
                            />
                            <span style={qTextStyle} className={`text-sm leading-relaxed ${readerActive ? '' : theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>{q.text}</span>
                          </div>
                        ))}
                      </div>
                      </div>
                      )}

                      {/* TF/NG questions for this passage */}
                      {psg.tfQuestions?.length > 0 && (
                      <div style={cardStyle} className={`border p-5 rounded-xl ${
                      readerActive ? 'border-black/10' : theme === 'dark' ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-zinc-200 shadow-sm'
                    }`}>
                      <h3 className="font-bold text-sm mb-1">Questions {psg.tfQuestions[0]?.number?.replace('.','')}-{psg.tfQuestions[psg.tfQuestions.length-1]?.number?.replace('.','')} вЂ” True / False / Not Given</h3>
                      <p className="text-xs text-zinc-500 mb-4 italic">Do the following statements agree with the information in the Reading Passage?</p>
                      <div className="space-y-3">
                        {psg.tfQuestions.map((q: any) => (
                          <div key={q.id} id={`q_wrapper_${q.id}`} className="flex items-start gap-3 group">
                            <button type="button" onClick={() => toggleFlag(q.id)} className={`text-xs p-1 mt-1 rounded hover:bg-zinc-800 transition-colors ${flags[q.id] ? "text-blue-500" : "text-zinc-500 opacity-30 group-hover:opacity-100"}`} title="Review later">рџљ©</button>
                            <span className="font-semibold text-xs w-8 mt-2 text-zinc-500 shrink-0">{q.number}</span>
                            <div className="flex gap-1 shrink-0">
                              {["TRUE","FALSE","NOT GIVEN"].map(opt => (
                                <button key={opt} type="button" onClick={() => handleInputChange(q.id, opt)}
                                  className={`px-2 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-all ${
                                    answers[q.id] === opt
                                      ? opt === 'TRUE' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                                        : opt === 'FALSE' ? 'bg-red-500/20 border-red-500 text-red-400'
                                        : 'bg-zinc-600/20 border-zinc-400 text-zinc-300'
                                      : theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white'
                                        : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:text-black'
                                  }`}>
                                  {opt === 'NOT GIVEN' ? 'NG' : opt}
                                </button>
                              ))}
                            </div>
                            <span style={qTextStyle} className={`text-sm leading-relaxed mt-1 ${readerActive ? '' : theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>{q.text}</span>
                          </div>
                        ))}
                      </div>
                      </div>
                      )}
                    </div>
                  ))
                )}
            </div>
          ) : (
            <div className="p-6 md:p-8 flex flex-col items-center justify-start h-full">
              {!score ? (
                <div className="flex flex-col items-center text-center mt-20">
                  <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                  <h3 className="font-bold text-lg mb-2">Natijalar hisoblanmoqda...</h3>
                  <p className="text-sm text-zinc-500">Barcha 42 ta javob tekshirilmoqda.</p>
                </div>
              ) : (
                <div className={`border p-6 md:p-8 rounded-2xl shadow-xl w-full max-w-2xl animate-in slide-in-from-bottom-8 transition-colors duration-300 ${
                  theme === 'dark' ? 'bg-zinc-950 border-zinc-900 text-white' : 'bg-white border-zinc-200 text-zinc-900 shadow-lg'
                }`}>
                  <h3 className="text-center uppercase tracking-widest text-xs font-bold text-zinc-500 mb-2">
                    IELTS Academic Reading
                  </h3>
                  <p className="text-center text-[10px] text-zinc-600 mb-6">3 Passages В· 42 Questions В· Official Band Scale</p>

                  <div className={`flex justify-between items-center mb-8 pb-8 border-b ${theme === 'dark' ? 'border-zinc-900' : 'border-zinc-200'}`}>
                    <div className="text-center">
                      <div className="text-xs text-zinc-500 font-medium mb-1">To'g'ri javoblar</div>
                      <div className="text-4xl font-bold">{score.correct}<span className="text-xl text-zinc-500">/{score.total}</span></div>
                    </div>
                    <div className="h-12 w-px bg-zinc-900"></div>
                    <div className="text-center">
                      <div className="text-xs text-zinc-500 font-medium mb-1">IELTS Band Score</div>
                      <div className="text-5xl font-black text-amber-500 font-mono">{score.band}</div>
                      <div className="text-[10px] text-zinc-500 font-mono mt-1">out of 9.0</div>
                    </div>
                  </div>

                  {score.explanations && Object.keys(score.explanations).length > 0 && (
                    <div className="space-y-4 mb-8 text-left">
                      <h4 className="font-bold text-xs uppercase tracking-widest text-zinc-500 mb-4">Barcha savollar tahlili</h4>
                      {Object.entries(score.explanations).map(([qId, explanation]: any) => {
                        const userAns = (answers[qId] || '(Javob berilmagan)').trim().toUpperCase();
                        const allKeys = getAllKeys();
                        const allQQ = getAllQQuestions();
                        const correctAns = allKeys[qId];
                        const isCorrect = userAns === correctAns;
                        return (
                          <div key={qId} className={`border p-4 rounded-xl space-y-2 transition-all ${
                            isCorrect ? 'border-emerald-500/20 hover:border-emerald-500/40' : 'border-red-500/20 hover:border-red-500/40'
                          } ${theme === 'dark' ? 'bg-[#09090b]' : 'bg-zinc-50'}`}>
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-xs text-amber-500 uppercase font-mono">Q{qId.replace(/p\dq/,'')}</span>
                              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                                isCorrect ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                              }`}>
                                {isCorrect ? 'Correct' : 'Incorrect'}
                              </span>
                            </div>
                            <div className="text-[11px] text-zinc-500 mb-1">{allQQ[qId]}</div>
                            <div className="grid grid-cols-2 gap-4 text-xs py-2 border-y border-zinc-900/50 font-mono">
                              <div>
                                <span className="text-zinc-500 block">Sizning javobingiz:</span>
                                <span className={`font-bold ${isCorrect ? 'text-emerald-500' : 'text-red-500'}`}>{userAns}</span>
                              </div>
                              <div>
                                <span className="text-zinc-500 block">To'g'ri javob:</span>
                                <span className="font-bold text-emerald-500">{correctAns}</span>
                              </div>
                            </div>
                            {(() => {
                              const parsed = parseExplanation(explanation);
                              return (
                                <div className="space-y-3 mt-3 text-xs md:text-sm">
                                  {parsed.correctReason && (
                                    <div className={`p-3.5 rounded-xl border flex gap-3 items-start transition-all ${
                                      theme === 'dark' ? 'bg-emerald-950/15 border-emerald-900/40 text-emerald-300' : 'bg-emerald-50/50 border-emerald-200 text-emerald-800'
                                    }`}>
                                      <span className="text-base shrink-0 mt-0.5 select-none">вњ…</span>
                                      <div className="space-y-1">
                                        <strong className="text-[9px] uppercase font-bold tracking-wider opacity-60 block">Tahlil va Sababi (Analysis)</strong>
                                        <p className="leading-relaxed text-zinc-300 dark:text-zinc-250 font-medium">{parsed.correctReason}</p>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {parsed.proof && (
                                    <div className={`p-3.5 rounded-xl border flex gap-3 items-start transition-all ${
                                      theme === 'dark' ? 'bg-cyan-950/15 border-cyan-900/40 text-cyan-300' : 'bg-cyan-50/50 border-cyan-200 text-cyan-800'
                                    }`}>
                                      <span className="text-base shrink-0 mt-0.5 select-none">рџ“Њ</span>
                                      <div className="space-y-1 w-full">
                                        <strong className="text-[9px] uppercase font-bold tracking-wider opacity-60 block">Matndan Isbot (Evidence Quote)</strong>
                                        <p className="leading-relaxed font-serif italic text-zinc-100 dark:text-zinc-200 bg-zinc-950/30 dark:bg-black/20 p-2 rounded-lg border border-zinc-900/10 mt-1">
                                          "{parsed.proof}"
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {parsed.userReason && !isCorrect && (
                                    <div className={`p-3.5 rounded-xl border flex gap-3 items-start transition-all ${
                                      theme === 'dark' ? 'bg-amber-950/15 border-amber-900/40 text-amber-300' : 'bg-amber-50/50 border-amber-200 text-amber-800'
                                    }`}>
                                      <span className="text-base shrink-0 mt-0.5 select-none">вќЊ</span>
                                      <div className="space-y-1">
                                        <strong className="text-[9px] uppercase font-bold tracking-wider opacity-60 block">Xatolik Izohi (Distractor Check)</strong>
                                        <p className="leading-relaxed text-zinc-300 dark:text-zinc-250">{parsed.userReason}</p>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {parsed.tip && (
                                    <div className={`p-3.5 rounded-xl border flex gap-3 items-start transition-all ${
                                      theme === 'dark' ? 'bg-purple-950/15 border-purple-900/40 text-purple-300' : 'bg-purple-50/50 border-purple-200 text-purple-800'
                                    }`}>
                                      <span className="text-base shrink-0 mt-0.5 select-none">рџ’Ў</span>
                                      <div className="space-y-1">
                                        <strong className="text-[9px] uppercase font-bold tracking-wider opacity-60 block">Tutor Strategiyasi (Tips)</strong>
                                        <p className="leading-relaxed text-zinc-300 dark:text-zinc-250 font-medium">{parsed.tip}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <button 
                    onClick={() => setIsSubmitted(false)}
                    className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors"
                  >
                    Restart test / Qayta urinib ko'rish
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Bottom CBT Navigation Bar */}
      <footer className={`sticky bottom-0 z-20 border-t p-3 flex flex-wrap items-center justify-between gap-2 transition-colors duration-300 ${
        theme === 'dark' ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-zinc-200'
      }`}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 font-mono">Q:</span>
          <div className="flex flex-wrap gap-1">
            {Object.values(passages).flatMap((psg: any) => [...psg.matchingQuestions, ...psg.tfQuestions]).map((q: any, idx: number) => {
              const id = q.id;
              const answered = !!answers[id];
              const flagged = !!flags[id];
              return (
                <button
                  key={id}
                  onClick={() => {
                    const element = document.getElementById(`q_wrapper_${id}`);
                    if (element) element.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  className={`w-7 h-7 rounded font-mono text-[10px] font-bold transition-all relative flex items-center justify-center border ${
                    flagged 
                      ? "border-blue-500 text-blue-500 bg-blue-500/10 animate-pulse" 
                      : answered 
                        ? theme === 'dark' ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-200 border-zinc-300 text-zinc-900"
                        : theme === 'dark' ? "bg-zinc-950 border-zinc-900 text-zinc-600" : "bg-zinc-50 border-zinc-200 text-zinc-400"
                  }`}
                  title={flagged ? "Review" : answered ? "Answered" : "Unanswered"}
                >
                  {idx + 1}
                  {flagged && <span className="absolute -top-1 -right-1 text-[7px]">рџљ©</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-zinc-555 font-semibold font-mono">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-500/20 border border-blue-500"></span> Review</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-zinc-800 border border-zinc-700"></span> Answered</span>
        </div>
      </footer>

      {/* Floating Selection Tooltip for Highlights & Notes */}
      {selectionCoords && (
        <div 
          style={{ top: `${selectionCoords.y}px`, left: `${selectionCoords.x}px` }} 
          className="fixed -translate-x-1/2 z-50 flex items-center gap-1 p-1 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl animate-in zoom-in-95 duration-100"
        >
          <button
            onClick={() => {
              highlightSelection();
              setSelectionCoords(null);
            }}
            className="px-2.5 py-1 text-[10px] font-extrabold uppercase bg-amber-500 text-black hover:bg-amber-400 rounded-lg transition-colors"
          >
            рџЋЁ Highlight
          </button>
          <button
            onClick={() => {
              applyNoteSelection();
              setSelectionCoords(null);
            }}
            className="px-2.5 py-1 text-[10px] font-extrabold uppercase bg-sky-500 text-white hover:bg-sky-400 rounded-lg transition-colors"
          >
            рџ“ќ Add Note
          </button>
          <button
            onClick={() => {
              setSelectionCoords(null);
            }}
            className="px-2 py-1 text-[10px] font-bold text-zinc-400 hover:text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Vocabulary Modal */}
      {showVocab && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-900 max-w-2xl w-full rounded-2xl p-6 md:p-8 max-h-[85vh] overflow-y-auto shadow-2xl relative">
            <button 
              onClick={() => setShowVocab(false)}
              className="absolute top-6 right-6 text-zinc-500 hover:text-white font-mono text-xs uppercase tracking-widest font-bold"
            >
              [ Close ]
            </button>
            <h3 className="text-xl font-black mb-2 text-zinc-100 flex items-center gap-2">
              <span>рџ“–</span> Vocabulary List / Lug'at boyligi
            </h3>
            <p className="text-xs text-zinc-500 mb-6 font-mono">Passage: "{currentPassage.title}" mavzusiga oid asosiy akademik so'zlar.</p>

            <div className="space-y-4">
              {vocabLists[passageId]?.map((item, i) => (
                <div key={i} className="bg-zinc-900/40 border border-zinc-900 p-4 rounded-xl flex justify-between items-start gap-4">
                  <div className="space-y-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-amber-500">{item.word}</span>
                      <span className="text-xs text-zinc-500 font-medium">({item.translation})</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">{item.definition}</p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => saveToMyVocab(item)}
                      className="text-[10px] font-bold text-amber-500 hover:text-amber-400 uppercase tracking-wider font-mono bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20"
                      title="Shaxsiy lug'atga qo'shish"
                    >
                      + Saqlash
                    </button>
                    <button
                      onClick={() => handleCopy(item.word)}
                      className="text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-wider font-mono bg-zinc-950 px-2 py-1 rounded border border-zinc-900/60"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}








