import { NextResponse } from 'next/server';
import { checkQuota } from '@/lib/entitlements';
import { getTrack, trackScore } from '@/lib/tracks';
import { callAI } from '@/lib/aiClient';

const READING_QUESTIONS_UNIVERSE: Record<string, string> = {
  q1: 'Term added to preserve a static universe',
  q2: 'Scientist who first proposed an expanding universe from a primeval point',
  q3: 'Theory suggesting matter is continuously created',
  q4: 'Accidental discovery that resolved a scientific dispute',
  q5: 'Evidence for dark matter from galaxy rotation speed',
  q6: "Famous name coined by one of the theory's opponents",
  q7: 'All galaxies move away from Earth at the same speed',
  q8: 'Nucleosynthesis occurred within the first few minutes',
  q9: 'Steady State theory proposes a definite beginning',
  q10: 'Penzias and Wilson were searching for the CMB',
  q11: '2011 Nobel Prize recognised accelerating expansion',
  q12: 'COBE/WMAP funded primarily by the European Space Agency'
};

const PASSAGE_DATA: Record<string, {
  keys: Record<string, string>;
  questions: Record<string, string>;
  title: string;
  text: string;
}> = {
  universe: {
    title: "The Origins of the Universe",
    keys: { q1: 'A', q2: 'B', q3: 'C', q4: 'D', q5: 'E', q6: 'C', q7: 'FALSE', q8: 'TRUE', q9: 'FALSE', q10: 'FALSE', q11: 'TRUE', q12: 'NOT GIVEN' },
    questions: READING_QUESTIONS_UNIVERSE,
    text: `Paragraph A: Humanity's attempts to explain the origin of the cosmos date back to ancient mythologies, yet it was not until the twentieth century that the question became a matter of rigorous scientific inquiry. For decades, most physicists, including Albert Einstein, assumed the universe was static and eternal, a view so entrenched that Einstein introduced a term called the cosmological constant into his equations of general relativity purely to counteract the gravitational pull that would otherwise cause a static universe to collapse. This assumption was overturned in 1929, when the American astronomer Edwin Hubble, studying the light from distant galaxies, discovered that virtually all of them displayed a redshift in their spectra proportional to their distance from Earth. This meant that galaxies were receding from us, and the farther away they were, the faster they were moving, providing the first observational evidence that the universe itself was expanding.
Paragraph B: If space itself was expanding, then logically it must have been far smaller, denser, and hotter in the distant past. This insight, first proposed mathematically by the Belgian priest and physicist Georges Lemaître in 1931, who described a 'primeval atom' from which all matter emerged, formed the theoretical basis of what became known as the Big Bang model. According to this framework, roughly 13.8 billion years ago, the observable universe originated from an extraordinarily hot and dense state and has been expanding and cooling ever since. Within the first few minutes, this cooling permitted protons and neutrons to fuse into the nuclei of light elements such as hydrogen and helium, a process known as Big Bang nucleosynthesis. Hundreds of millions of years later, gravity drew these primordial gas clouds together into the first stars, which eventually assembled into the galaxies that populate the universe today.
Paragraph C: The Big Bang model did not go unchallenged. In 1948, the astronomers Hermann Bondi, Thomas Gold, and Fred Hoyle proposed a rival explanation known as the Steady State theory. Rooted in what they termed the 'perfect cosmological principle,' this model held that the universe has no beginning and no end; as galaxies drift apart from one another, new matter is spontaneously and continuously created in the gaps to form fresh stars and galaxies, so that the overall density and appearance of the universe remain constant through infinite time. Ironically, it was Hoyle himself, dismissive of his rivals' theory during a 1949 radio broadcast, who coined the term 'Big Bang,' intending it as a derisive label. For more than a decade, the scientific community remained genuinely divided between these two competing pictures of cosmic history, with observational evidence too sparse to definitively favour either.
Paragraph D: The dispute was finally resolved in 1964, when two radio astronomers at Bell Labs, Arno Penzias and Robert Wilson, detected a faint, uniform microwave hiss coming from every direction of the sky. Initially suspecting a fault in their antenna, they eventually ruled out interference from local sources before realising that the signal was, in fact, cosmic in origin. This radiation, now called the Cosmic Microwave Background (CMB), was quickly identified by physicists at Princeton as the cooled, redshifted afterglow of the hot early universe predicted by the Big Bang model; the Steady State theory had no mechanism to produce it at all. The discovery earned Penzias and Wilson the 1978 Nobel Prize in Physics, and subsequent satellite missions, including COBE and WMAP, mapped the CMB's minute temperature fluctuations with such precision that they effectively settled the debate in the Big Bang model's favour.
Paragraph E: Confirmation of the Big Bang, however, opened as many questions as it answered. In the 1970s, astronomer Vera Rubin's observations of galaxy rotation speeds suggested that visible matter alone could not account for the gravitational forces holding galaxies together, implying the existence of an invisible substance now called dark matter. Then, in 1998, two independent teams studying distant exploding stars called Type Ia supernovae found that the expansion of the universe was not slowing under gravity, as expected, but accelerating, a discovery attributed to a mysterious force termed dark energy and later honoured with the 2011 Nobel Prize. Together, dark matter and dark energy are now thought to constitute over ninety percent of the universe's total content, yet neither has been directly detected, and the singularity at the very instant of the Big Bang itself remains beyond the reach of current physical theory.`
  },
  ai: {
    title: "The Evolution of Artificial Intelligence",
    keys: { q1: 'A', q2: 'C', q3: 'D', q4: 'B', q5: 'E', q6: 'D', q7: 'FALSE', q8: 'TRUE', q9: 'FALSE', q10: 'FALSE', q11: 'TRUE', q12: 'FALSE' },
    questions: {
      q1: 'Event regarded as the official beginning of AI',
      q2: 'Technological factor that accelerated machine learning',
      q3: 'A game assumed too complex for a machine to master soon',
      q4: 'Limitation that caused expert systems to fail',
      q5: 'Researcher who left a company to warn about risks',
      q6: 'New architecture fundamental to processing language',
      q7: 'McCarthy invented the Turing Test',
      q8: 'Lighthill Report reduced AI funding',
      q9: 'Expert systems could learn from new data',
      q10: 'ImageNet created before the first AI winter',
      q11: "AlexNet's success increased investment in deep learning",
      q12: 'Hinton believes AGI poses no risk'
    },
    text: `Paragraph A: The formal study of artificial intelligence began in 1950, when the British mathematician Alan Turing published a paper proposing what became known as the Turing Test, a method for determining whether a machine could exhibit behaviour indistinguishable from that of a human. Six years later, a small group of researchers, including John McCarthy, who coined the term 'artificial intelligence' for the occasion, gathered at Dartmouth College for a summer workshop that is now regarded as the field's official birth. Early programs such as the Logic Theorist, created by Allen Newell and Herbert Simon, could prove mathematical theorems and led many researchers to predict, with striking overconfidence, that machines matching human intelligence were merely a decade or two away.
Paragraph B: That optimism proved premature. Government funding bodies, disappointed by the gap between promise and results, sharply curtailed AI research following critical assessments such as the UK's 1973 Lighthill Report, ushering in what researchers now call the first 'AI winter.' A partial revival occurred in the early 1980s with the commercial success of expert systems, programs like MYCIN and DENDRAL that encoded the specialised knowledge of human experts into extensive sets of hand-crafted 'if-then' rules to diagnose diseases or identify chemical compounds. Yet these systems proved brittle: they could not learn from new information, struggled with any scenario their programmers had not explicitly anticipated, and were prohibitively expensive to update, and by the late 1980s a second AI winter had set in as this approach, too, failed to scale.
Paragraph C: Renewed progress emerged in the 1990s and 2000s through a fundamental change in approach. Rather than hand-coding explicit rules, researchers increasingly built statistical models, including support vector machines and early neural networks, that could learn patterns directly from examples in data. This shift from symbolic to data-driven methods was accelerated by two converging trends: the exponential growth of digitally available data and the increasing availability of powerful graphics processing units, or GPUs, originally designed for rendering video games, which turned out to be remarkably well suited to the parallel calculations that machine learning requires. The 2009 release of ImageNet, a vast, meticulously labelled database of millions of photographs, gave researchers a common benchmark against which to measure and compete on real progress.
Paragraph D: The decisive turning point came in 2012, when a deep neural network named AlexNet dramatically outperformed all competitors in the annual ImageNet image-recognition competition, convincing the wider research community of deep learning's power and triggering a surge of investment. Four years later, DeepMind's AlphaGo defeated Lee Sedol, one of the world's strongest players of the ancient board game Go, a feat many experts had assumed was at least a decade away given the game's immense complexity. In 2017, Google researchers introduced the transformer, a new neural network architecture described in a paper titled 'Attention Is All You Need,' which proved exceptionally effective at processing language and would soon underpin every major breakthrough in the years that followed.
Paragraph E: That architecture now powers the large language models and generative AI systems, such as ChatGPT, that have brought artificial intelligence into daily use for hundreds of millions of people since 2022. Their fluency has been matched by growing unease: critics point to the risk of amplifying biases present in training data, the ease with which such systems generate convincing misinformation, and the unresolved 'alignment problem' of ensuring increasingly capable systems reliably pursue goals that are beneficial to humanity. In 2023, Geoffrey Hinton, a researcher often credited as a father of deep learning, resigned from his position at Google partly to speak freely about these risks, a move that intensified public debate over whether artificial general intelligence, should it ever be achieved, might ultimately escape meaningful human control.`
  },
  tea: {
    title: "The History and Impact of Tea",
    keys: { q1: 'A', q2: 'B', q3: 'C', q4: 'D', q5: 'E', q6: 'A', q7: 'NOT GIVEN', q8: 'FALSE', q9: 'TRUE', q10: 'FALSE', q11: 'TRUE', q12: 'FALSE' },
    questions: {
      q1: 'Legendary account of how tea was discovered',
      q2: 'Royal marriage that popularised tea in England',
      q3: 'Conflict resulting in territory handed to Britain',
      q4: 'Secret mission to obtain tea plants',
      q5: 'Tea varieties from the same plant species',
      q6: 'Spread of tea traditions to another Asian country',
      q7: 'Shen Nong historically confirmed to have discovered tea',
      q8: 'Tea first brought to Europe by British traders',
      q9: 'China demanded silver payment for tea',
      q10: 'Fortune announced his intentions to Chinese authorities',
      q11: "Indian tea production ended China's dominance",
      q12: 'All tea types made from different plant species'
    },
    text: `Paragraph A: According to a well-known Chinese legend, tea was discovered in 2737 BC when the mythical Emperor Shen Nong was boiling drinking water beneath a tree and a few leaves accidentally blew into his pot, producing a fragrant, refreshing infusion he decided to try. Whatever its true origins, tea drinking in China can be reliably traced back at least two thousand years, initially valued less as a pleasurable drink than as a medicinal tonic believed to sharpen the mind and aid digestion. Buddhist monks were largely responsible for spreading the practice beyond China's borders, carrying tea seeds and preparation techniques to Japan around the ninth century, where it gradually evolved into the highly formalised and meditative tea ceremony still practised today.
Paragraph B: Tea did not reach Europe until the early seventeenth century, when Dutch traders working for the Dutch East India Company first shipped it from Asia in 1610, followed shortly afterwards by Portuguese merchants. For decades it remained an expensive curiosity enjoyed only by the wealthy, until the beverage received an unlikely boost from royalty: in 1662, the Portuguese princess Catherine of Braganza married King Charles II of England, bringing her fondness for tea with her to the English court. Her patronage made tea fashionable among the aristocracy, and within a few decades it had begun to rival coffee as the preferred drink in English society, served in the elegant coffee houses and private drawing rooms that were becoming central to social life in London.
Paragraph C: As British demand for tea grew explosively through the eighteenth century, a serious economic problem emerged: China, the sole source of tea at the time, would accept payment only in silver, creating an enormous and unsustainable trade deficit for Britain. To correct this imbalance, British merchants began illegally exporting opium grown in colonial India into China, and although the Chinese government banned the drug and attempted to halt the trade, Britain responded with military force. The resulting conflict, known as the First Opium War, ended in 1842 with a decisive British victory and the Treaty of Nanking, which forced China to cede the island of Hong Kong to Britain and open several ports to foreign trade.
Paragraph D: Determined to end its dependence on Chinese tea altogether, the British East India Company sponsored a daring mission by the Scottish botanist Robert Fortune, who disguised himself in Chinese dress and travelled deep into regions of China forbidden to foreigners between 1848 and 1851. Fortune successfully smuggled thousands of tea plants and seeds, along with several skilled Chinese tea workers, out of the country and transported them to British-controlled India, where they were used to establish plantations in the Darjeeling and Assam regions. Within a generation, Indian tea production had grown quickly enough to end China's centuries-long dominance of the tea trade, transforming tea from a luxury import into an everyday commodity across the British Empire.
Paragraph E: Today, tea is the second most widely consumed beverage in the world after water, and virtually all of its major varieties, including black, green, oolong, and white tea, are produced from the leaves of a single plant species, Camellia sinensis, with their distinctive flavours arising primarily from differences in how the leaves are processed and oxidised after picking. Modern scientific research has identified numerous potential health benefits associated with regular tea consumption, particularly linked to antioxidant compounds called catechins, though many claims remain the subject of ongoing study. Beyond its chemistry, tea continues to carry deep cultural significance worldwide, from the precise, ritualised choreography of the Japanese tea ceremony to the relaxed sociability of British afternoon tea and the sweet, mint-infused tea traditionally served across Morocco.`
  },
  sleep: {
    title: "The Science of Sleep",
    keys: { q1: 'A', q2: 'B', q3: 'C', q4: 'D', q5: 'E', q6: 'D', q7: 'TRUE', q8: 'FALSE', q9: 'FALSE', q10: 'TRUE', q11: 'FALSE', q12: 'TRUE' },
    questions: {
      q1: 'A discovery that redefined how sleep was understood', q2: 'Sleep stage during which the body physically repairs itself',
      q3: 'Real-world disasters linked to worker fatigue', q4: 'A chemical that remains active for hours, disrupting rest',
      q5: 'The health field sleep is now considered part of', q6: 'A hormone suppressed by screen light',
      q7: 'EEG used to detect brain activity during sleep', q8: 'REM occurs equally throughout the night',
      q9: 'Sleep deprivation has no effect on appetite hormones', q10: 'Some industries limit shift length due to fatigue risk',
      q11: 'Caffeine only affects sleep right before bedtime', q12: 'Sleep now considered as important as diet and exercise'
    },
    text: `Paragraph A: Sleep is a fundamental biological process on which physical and mental health depend, yet for much of scientific history it was dismissed as a simple period of bodily shutdown. This view began to change in 1953, when researchers Eugene Aserinsky and Nathaniel Kleitman, using a new device called the electroencephalogram to record electrical activity in the brain, discovered a distinct stage during which sleepers' eyes darted rapidly beneath closed lids. This stage, which they named rapid eye movement, or REM, sleep, revealed unmistakably that the sleeping brain remains remarkably active, cycling through clearly defined stages rather than resting in a single uniform state. The discovery launched an entirely new field of sleep science and overturned the long-held assumption that sleep was simply the passive absence of wakefulness.
Paragraph B: A typical night's sleep unfolds in cycles lasting roughly ninety minutes, alternating between non-REM and REM stages. Non-REM sleep itself progresses through lighter stages into slow-wave sleep, the deepest and most physically restorative phase, during which the body repairs damaged tissue, strengthens the immune system, and releases growth hormone. REM sleep, by contrast, is associated with heightened brain activity resembling wakefulness and is when the most vivid dreaming occurs; researchers now believe this stage plays a crucial role in consolidating memories formed during the day and in processing emotional experiences. As the night progresses, the proportion of REM sleep within each ninety-minute cycle gradually increases, which is why dreams tend to feel most vivid and memorable in the hours just before waking.
Paragraph C: The consequences of chronically inadequate sleep extend far beyond simple tiredness. Disrupted sleep interferes with the hormones leptin and ghrelin, which regulate appetite, helping to explain the well-documented link between poor sleep and obesity. Long-term sleep deprivation has also been associated with elevated risks of cardiovascular disease, weakened immune function, and measurable impairments in attention, memory, and decision-making. Several major industrial and transportation disasters, including the Chernobyl nuclear accident and the grounding of the oil tanker Exxon Valdez, have been partly attributed to errors made by severely fatigued workers. Such cases have pushed sleep science beyond the laboratory and into discussions of workplace safety, with some industries now imposing strict limits on the length of shifts that employees in safety-critical roles may work.
Paragraph D: Modern lifestyles present numerous obstacles to healthy sleep. Screens on smartphones, computers, and televisions emit blue light that suppresses the release of melatonin, the hormone that signals to the body that it is time to sleep, making it measurably harder to fall asleep after prolonged evening screen use. Caffeine compounds the problem: because it remains active in the body for several hours, even a cup of coffee consumed in the mid-afternoon can meaningfully disrupt sleep that night. Shift work and irregular schedules disrupt the body's internal circadian clock even further, while the common practice of sleeping in on weekends to compensate for weekday sleep loss, sometimes called social jet lag, can leave the body's rhythm perpetually out of sync, much like recovering from crossing time zones.
Paragraph E: In response to this growing body of evidence, sleep researchers increasingly promote a set of practices known as sleep hygiene, aimed at protecting the quality and consistency of rest. Commonly recommended habits include going to bed and waking at the same time every day, even on weekends, keeping the bedroom cool, dark, and quiet, and avoiding screens, caffeine, and heavy meals in the hours before bedtime. Public health authorities in many countries now describe sleep as a third pillar of health, standing alongside diet and exercise, and some employers have begun experimenting with later start times or dedicated rest areas in recognition of the substantial costs that sleep deprivation imposes on productivity, safety, and long-term wellbeing.`
  },
  energy: {
    title: "The Transition to Renewable Energy",
    keys: { q1: 'A', q2: 'B', q3: 'C', q4: 'E', q5: 'D', q6: 'E', q7: 'TRUE', q8: 'FALSE', q9: 'FALSE', q10: 'FALSE', q11: 'TRUE', q12: 'FALSE' },
    questions: {
      q1: 'Agreement formalising global commitment to emissions reduction', q2: 'Economic phenomenon explaining falling renewable costs',
      q3: 'Technology used to store surplus renewable electricity', q4: 'Term for support given to workers affected by fossil-fuel decline',
      q5: "Countries' varying ambition despite shared pledges", q6: 'Materials required for renewables that raise environmental concerns',
      q7: 'Solar costs fell more than 80% since 2010', q8: 'Renewable electricity is cheaper everywhere in the world',
      q9: 'Wind turbines produce constant predictable electricity', q10: 'All Paris Agreement signatories are equally committed',
      q11: 'Pumped-hydro storage pumps water uphill for later use', q12: 'Mining battery materials has no environmental impact'
    },
    text: `Paragraph A: For more than two centuries, industrial economies have been built on fossil fuels, first coal and later oil and natural gas, whose combustion released the energy that powered factories, transportation, and electricity grids. Growing scientific consensus that this combustion is the primary driver of climate change, formalised in international agreements such as the 1997 Kyoto Protocol and the more comprehensive 2015 Paris Agreement, has placed increasing pressure on governments and industries to curb emissions. What began as a marginal, subsidy-dependent alternative energy sector has, over the past two decades, accelerated into what many economists now describe as an irreversible global energy transition, reshaping electricity markets, investment patterns, and geopolitics far more rapidly than most forecasters had predicted even a decade ago.
Paragraph B: Solar and wind power have been the standout performers of this transition. The cost of solar photovoltaic panels has fallen by more than eighty percent since 2010, a decline driven by manufacturing scale, technological refinement, and a self-reinforcing economic phenomenon known as a learning curve, whereby costs fall predictably as cumulative production increases. In many regions of the world, newly built solar and wind installations now generate electricity more cheaply than newly built coal or gas plants, a milestone that seemed almost unimaginable at the turn of the century. Investment has followed accordingly: renewable sources now account for the large majority of new electricity-generating capacity added globally each year, even in countries that remain heavily dependent on fossil fuels for their existing supply.
Paragraph C: Despite this remarkable cost decline, renewable energy confronts a persistent technical obstacle known as intermittency: solar panels generate no power at night and produce less on cloudy days, while wind turbines are dependent on weather conditions that fluctuate unpredictably. Addressing this challenge has become a major focus of energy engineering. Grid-scale battery storage, dominated by lithium-ion technology, allows surplus electricity generated during sunny or windy periods to be released later when demand is high, while older methods such as pumped-hydro storage, which uses excess electricity to pump water uphill for later release through turbines, continue to play a significant role. Increasingly sophisticated software systems, often described as smart grids, further help balance fluctuating supply and demand across entire regions in real time.
Paragraph D: Government policy has proven decisive in accelerating the transition, sometimes more so than technology itself. Subsidies for renewable installation, carbon taxes that make polluting energy sources more expensive, and binding emissions-reduction targets have collectively redirected enormous flows of capital toward clean energy. Under the Paris Agreement, most of the world's nations have pledged to pursue net-zero emissions by the middle of this century, though the ambition, funding, and enforcement of these pledges vary considerably from country to country. Some nations, particularly in Northern Europe, have moved decisively toward renewable-dominated grids, while others continue to expand fossil fuel infrastructure even as they publicly commit to long-term decarbonisation, a contradiction that has drawn considerable criticism from environmental groups and international observers alike.
Paragraph E: The transition has not been without controversy. Critics point out that manufacturing solar panels, wind turbines, and especially batteries requires substantial quantities of mined materials such as lithium, cobalt, and rare-earth elements, raising concerns about new forms of environmental damage and resource dependency that merely replace, rather than eliminate, extractive industry. Communities and workers in coal-mining regions have also suffered significant economic disruption as demand for fossil fuels declines, prompting calls for what is often termed a 'just transition' that includes retraining programmes and economic support for affected regions. Supporters of renewable energy counter that the long-term environmental and economic costs of continued fossil fuel dependence, including the escalating damage caused by climate change itself, far outweigh these transitional challenges.`
  },
  olympics: {
    title: "The History of the Olympic Games",
    keys: { q1: 'A', q2: 'B', q3: 'C', q4: 'D', q5: 'E', q6: 'A', q7: 'TRUE', q8: 'FALSE', q9: 'FALSE', q10: 'TRUE', q11: 'FALSE', q12: 'TRUE' },
    questions: {
      q1: 'A religious truce allowing safe travel during the ancient Games', q2: 'Founder of the modern Olympic movement',
      q3: 'Year women first competed in the modern Olympics', q4: 'A tragic event that changed Olympic security permanently',
      q5: 'Term for unused Olympic venues after the Games end', q6: 'Emperor who banned the ancient Games',
      q7: 'Ancient Games held in honour of Zeus', q8: 'First modern Olympics included male and female athletes',
      q9: 'Winter Olympics began the same year as the first modern Games', q10: 'US and USSR both led Cold War boycotts',
      q11: 'Hosting the Olympics always results in net financial profit', q12: 'IOC faced pressure due to doping scandals'
    },
    text: `Paragraph A: The Olympic Games rank among the oldest and most celebrated sporting traditions in human history. The ancient Games began in the Greek city of Olympia in 776 BC as a religious festival held in honour of the god Zeus, and for centuries a sacred truce called the ekecheiria was declared during the competition, allowing athletes and spectators to travel safely even between warring city-states. The Games continued to be held every four years for nearly twelve centuries, making them one of the longest-running organised events in recorded history, until the Roman emperor Theodosius I banned them in AD 393 as part of a broader campaign to suppress pagan religious practices across the empire.
Paragraph B: More than 1,500 years later, the modern Olympic Games were revived largely through the efforts of a French educator named Pierre de Coubertin, who believed that international athletic competition could foster friendship and mutual understanding between nations recovering from decades of conflict. In 1894, he helped establish the International Olympic Committee, and two years later the first modern Games were held in Athens, Greece, drawing 241 athletes from just 14 countries, all of them men, competing in events such as athletics, cycling, fencing, and swimming. Although modest by today's standards, this first modern Games laid the foundation for what would eventually become the largest and most watched sporting event on Earth.
Paragraph C: Over the following decades, the Olympic movement expanded dramatically in both scale and inclusivity. Women were permitted to compete for the first time at the 1900 Games in Paris, though only in a handful of sports, and their participation grew steadily throughout the twentieth century until achieving near parity with men in recent decades. The introduction of a separate Winter Olympics in 1924, held in the French town of Chamonix, created a second major event dedicated to snow and ice sports. The rise of international television broadcasting from the 1960s onward transformed the Games from a primarily local spectacle into a truly global event, watched by billions of people across every continent.
Paragraph D: The Olympics have rarely remained untouched by the political tensions of their era. Three editions of the Games, scheduled for 1916, 1940, and 1944, were cancelled entirely because of the two World Wars, while the tense decades of the Cold War produced several dramatic boycotts. Most notably, the United States led more than sixty nations in boycotting the 1980 Moscow Games in protest at the Soviet invasion of Afghanistan, and the Soviet Union retaliated by leading a boycott of the 1984 Los Angeles Games four years later. The 1972 Munich Games were further marred by a hostage crisis in which eleven Israeli athletes and coaches were killed, an event that permanently changed security arrangements at future Olympics.
Paragraph E: In the modern era, hosting the Olympic Games has become both a coveted symbol of national prestige and a source of considerable controversy. Supporters argue that hosting can accelerate investment in transport infrastructure, boost international tourism, and leave a lasting legacy of world-class sporting facilities. Critics, however, point to the enormous cost of staging the Games, which frequently runs into tens of billions of dollars, and to the many stadiums and venues around the world that have fallen into disuse and disrepair once the event concludes, sometimes referred to as 'white elephants.' Additional controversies surrounding doping scandals and questions of athletic integrity have also placed growing pressure on the International Olympic Committee to reform how the Games are organised and monitored.`
  },
  habits: {
    title: "The Psychology of Habits",
    keys: { q1: 'A', q2: 'B', q3: 'C', q4: 'D', q5: 'E', q6: 'E', q7: 'FALSE', q8: 'FALSE', q9: 'TRUE', q10: 'TRUE', q11: 'FALSE', q12: 'FALSE' },
    questions: {
      q1: 'Brain region believed central to habit formation', q2: 'Three-part model explaining how habits function',
      q3: "Strategy for changing a habit without fighting the brain's wiring", q4: 'Principle of making desired behaviours easier and undesired ones harder',
      q5: 'Origin of a popular but inaccurate belief about habit formation time', q6: 'University where rigorous modern habit research was conducted',
      q7: 'Habitual behaviours make up less than 10% of daily actions', q8: 'Neural pathways disappear completely once a habit stops',
      q9: 'Psychologists recommend replacing routine while keeping cue and reward', q10: 'Making a behaviour harder decreases likelihood of doing it',
      q11: 'The 21-day rule came from rigorous scientific research', q12: 'UCL study found habit formation always takes exactly 66 days'
    },
    text: `Paragraph A: A habit can be defined as a behaviour that has become so deeply ingrained through repetition that it is performed with little or no conscious thought. Neuroscientists believe habits form largely within a region of the brain called the basal ganglia, which allows the more effortful, decision-making regions of the brain to conserve energy for novel or complex tasks. A widely cited estimate from researchers at Duke University suggests that habitual behaviours, rather than deliberate decisions, account for something in the region of forty to fifty per cent of the actions people perform on an average day, from the route taken to work to the order in which one gets dressed each morning.
Paragraph B: Popularised by the journalist Charles Duhigg in his influential book The Power of Habit, the concept of a three-part 'habit loop' has become central to how psychologists describe habit formation. The loop begins with a cue, a trigger that prompts the brain to initiate a behaviour; this is followed by the routine, the behaviour itself, whether physical, mental, or emotional; and finally the reward, a form of positive reinforcement that signals to the brain that this particular loop is worth remembering for the future. Crucially, the brain begins to anticipate the reward as soon as it detects the cue, which is precisely what generates the cravings that make established habits, particularly unwanted ones, so difficult to resist.
Paragraph C: One of the reasons bad habits prove so persistent is that the neural pathway underlying a habit loop does not disappear once the behaviour stops; it simply becomes dormant and can be reactivated by the original cue at any time, even years later. For this reason, psychologists generally advise against attempting to eliminate an unwanted habit outright. Instead, the recommended strategy, sometimes called the golden rule of habit change, is to keep the same cue and reward while consciously substituting a new, healthier routine in between, since this approach works with the brain's existing wiring rather than against it. Reformed smokers, for instance, are often encouraged to replace the act of smoking with chewing gum or taking a short walk whenever the familiar cue, such as stress or a work break, arises.
Paragraph D: The physical and digital environments people inhabit exert a surprisingly powerful influence over which habits take hold. Research consistently shows that people are considerably more likely to adopt a new behaviour when it is made obvious and easy, and considerably less likely to engage in a behaviour that requires extra effort or is simply out of sight. This principle, often summarised as reducing friction for desired habits and increasing it for undesired ones, underlies simple but effective strategies such as placing a bowl of fruit on the kitchen counter to encourage healthier snacking, or leaving a phone charging in another room overnight to reduce the temptation to check it before sleep. Popular guides to habit formation now build entire frameworks around deliberately redesigning one's surroundings in this way.
Paragraph E: A persistent myth holds that any new habit can be formed in exactly twenty-one days, a figure that traces back to a 1960s book by the plastic surgeon Maxwell Maltz, who observed that patients typically took about three weeks to adjust psychologically to a change in their appearance and mistakenly generalised this observation to all habit formation. More rigorous modern research tells a different story: a widely cited study conducted at University College London found that the average time required to form a new habit was closer to sixty-six days, with considerable individual variation ranging from as little as eighteen days to as long as two hundred and fifty-four days, depending on the complexity of the behaviour and the consistency of the individual practising it.`
  },
  transport: {
    title: "The Future of Urban Transport",
    keys: { q1: 'B', q2: 'C', q3: 'D', q4: 'E', q5: 'A', q6: 'D', q7: 'TRUE', q8: 'FALSE', q9: 'TRUE', q10: 'TRUE', q11: 'FALSE', q12: 'FALSE' },
    questions: {
      q1: 'Concept encouraging development to cluster around transport hubs', q2: 'Limitation of electric vehicles regarding congestion',
      q3: 'Urbanist associated with a concept promoting short local journeys', q4: 'Major cause of accidents autonomous vehicles could reduce',
      q5: 'Regions where vehicle ownership outpaces road infrastructure', q6: 'Unexpected reaction the fifteen-minute city concept attracted',
      q7: 'Congestion costs the global economy hundreds of billions annually', q8: 'Electric vehicles automatically reduce congestion',
      q9: 'EV environmental benefit depends on how electricity is generated', q10: 'Paris has adopted fifteen-minute city planning policies',
      q11: 'Legal liability for AV accidents is already fully resolved', q12: 'Surveys show universally high trust in autonomous vehicles'
    },
    text: `Paragraph A: As urban populations continue to swell worldwide, moving people efficiently through cities has become one of the defining challenges of contemporary urban planning. Decades of development oriented primarily around private car ownership have left many cities with road networks unable to cope with current demand, and traffic congestion is now estimated to cost the global economy several hundred billion dollars annually in lost productivity, wasted fuel, and delayed goods delivery. The problem is especially acute in rapidly growing cities across Asia, Africa, and Latin America, where vehicle ownership is rising far faster than road infrastructure can expand, prompting planners worldwide to reconsider assumptions about urban mobility that have dominated for the better part of a century.
Paragraph B: Public transport systems, including metro networks, light rail, and bus rapid transit, remain the most space-efficient way to move large numbers of people through dense urban areas. Cities that have invested heavily and consistently in reliable, affordable public transport consistently demonstrate lower congestion levels and significantly better air quality than comparable cities reliant primarily on private vehicles. A related planning concept, transit-oriented development, encourages building higher-density housing and commercial activity directly around transport hubs, reducing the distances residents must travel and making public transport a more convenient default choice rather than a last resort for those without access to a car.
Paragraph C: Electric vehicles are frequently promoted as a solution to urban air pollution, and their adoption has accelerated rapidly over the past decade as battery costs have fallen and driving ranges have improved. However, critics are quick to point out an important limitation: electric vehicles do nothing to reduce traffic congestion itself, since they still occupy the same road space and require the same parking as conventional cars. Furthermore, the environmental benefit of switching to electric vehicles depends heavily on how the electricity used to charge them is generated; in regions where electricity still comes primarily from coal-fired power plants, the net reduction in overall emissions can be considerably smaller than advertised, and the mining of lithium and other battery materials carries its own significant environmental costs.
Paragraph D: A more radical rethinking of urban mobility is embodied in the concept of the 'fifteen-minute city', popularised by the urbanist Carlos Moreno and adopted as official policy in cities such as Paris under mayor Anne Hidalgo. The idea holds that most essential daily needs, including work, schools, healthcare, and shopping, should be reachable within a fifteen-minute walk or cycle ride from every resident's home, dramatically reducing dependence on cars for everyday journeys. While supporters argue the concept could substantially cut both congestion and emissions, critics note significant practical obstacles to implementing it in lower-density suburbs and car-dependent regions, and the proposal has also, somewhat unexpectedly, become the target of conspiracy theories alleging hidden surveillance or restrictions on personal freedom of movement.
Paragraph E: Autonomous, or self-driving, vehicles represent perhaps the most transformative possibility on the horizon for urban transport. Proponents argue that removing human error, which is responsible for the vast majority of road accidents, could make driving dramatically safer, while also allowing road space and parking to be used far more efficiently through coordinated, computer-controlled traffic flow. Significant obstacles remain, however, including unresolved questions about legal liability in the event of a crash involving a self-driving vehicle, the considerable regulatory frameworks that still need to be developed in most countries, and the substantial disruption such technology could cause to the millions of people worldwide currently employed as professional drivers. Public trust in fully autonomous vehicles also remains limited, according to numerous surveys conducted in recent years.`
  },
  bilingual: {
    title: "The Benefits of Bilingualism",
    keys: { q1: 'A', q2: 'C', q3: 'B', q4: 'D', q5: 'E', q6: 'C', q7: 'TRUE', q8: 'FALSE', q9: 'FALSE', q10: 'TRUE', q11: 'FALSE', q12: 'TRUE' },
    questions: {
      q1: 'Flawed early research linking bilingualism to poorer development', q2: 'Researcher linking bilingualism to delayed Alzheimer\'s symptoms',
      q3: 'Term for mental flexibility developed by managing two languages', q4: 'Career advantages linked to speaking more than one language',
      q5: 'Risk facing children who stop using a home language', q6: 'Concept explaining why bilingual brains resist disease effects longer',
      q7: 'Early 20th-century bilingualism studies were later found flawed', q8: 'Bilingualism completely prevents Alzheimer\'s disease',
      q9: 'Bilinguals generally perform worse on mental flexibility tasks', q10: 'Employers in many industries value multilingual candidates',
      q11: 'Children automatically retain a heritage language with no extra effort', q12: "Bialystok's research used patients at a Toronto memory clinic"
    },
    text: `Paragraph A: For much of the twentieth century, conventional wisdom held that raising a child to speak two languages would confuse them and delay their overall cognitive and linguistic development. This belief was reinforced by early studies conducted in the 1920s and 1930s, many of which compared bilingual immigrant children unfavourably to monolingual peers without properly accounting for differences in socioeconomic background, schooling quality, or fluency in the language of the test itself. As research methods improved substantially in later decades, this negative view was thoroughly overturned, and a large and growing body of modern research now demonstrates that speaking two or more languages, far from being a disadvantage, confers a range of measurable cognitive benefits that persist throughout a person's lifetime.
Paragraph B: Central to these benefits is what psychologists call executive function, the set of mental skills that allow a person to focus attention, ignore irrelevant information, and switch flexibly between different tasks. Because bilingual speakers must constantly monitor which language is appropriate for a given situation and suppress the language they are not currently using, their brains effectively receive continuous practice in exactly these skills. The Canadian psychologist Ellen Bialystok, one of the most prominent researchers in this field, has published numerous studies showing that bilingual children and adults consistently outperform monolingual counterparts on tasks requiring this kind of mental flexibility, an effect often compared informally to the way that regular physical exercise strengthens the body.
Paragraph C: Perhaps the most striking finding from this research concerns brain ageing. Bialystok's long-term studies of patients at a memory clinic in Toronto found that lifelong bilingual individuals who developed Alzheimer's disease showed noticeable symptoms, on average, between four and five years later than monolingual patients with an otherwise similar medical profile. Researchers attribute this delay to what is termed cognitive reserve, the idea that decades of managing two language systems builds additional neural connections and mental resilience, allowing the bilingual brain to continue functioning relatively normally even after the underlying disease process has begun to cause measurable damage. Importantly, bilingualism does not prevent the disease itself, but appears to delay its outward symptoms.
Paragraph D: Beyond these cognitive advantages, bilingualism carries clear practical, social, and economic benefits. Speaking multiple languages allows individuals to communicate with a far wider range of people, travel more confidently, and engage more deeply with different cultures and communities. In an increasingly globalised economy, employers across many industries actively seek out candidates who speak more than one language, and multilingual employees frequently report greater access to international assignments, higher starting salaries, and broader career opportunities than monolingual colleagues in otherwise comparable positions. These advantages have grown alongside the expansion of international trade and remote collaboration across borders, making language skills an increasingly valuable, and increasingly marketable, professional asset in the modern workplace.
Paragraph E: Despite these substantial benefits, maintaining fluency in two languages requires ongoing effort, and this is especially true for children growing up in a country where only one of their languages is spoken outside the home. Without consistent exposure and encouragement to keep using it, a child's weaker language, often the language spoken by immigrant parents, can fade noticeably within just a few years of starting school in the dominant local language. For this reason, researchers strongly encourage families to maintain deliberate use of the heritage language at home, and increasingly recommend that schools offer structured support, such as bilingual education programmes, to help children preserve and strengthen a skill that, once lost in childhood, can be considerably more difficult to fully recover in later life.`
  }
};

const LISTENING_TESTS_DATA: Record<string, {
  id: string;
  title: string;
  keys: Record<string, string>;
  questions: Record<string, string>;
  transcript: string;
}> = {
  campus: {
    id: "campus",
    title: "Campus Accommodation & Facilities",
    keys: {
      q1: 'SMITH',
      q2: '07123456789',
      q3: 'SINGLE',
      q4: 'FIVE',
      q5: 'THREE WEEKS',
      q6: 'A',
      q7: 'B',
      q8: 'B',
      q9: 'B',
      q10: 'B'
    },
    questions: {
      q1: 'Accommodation Form: Name (Last name)',
      q2: 'Accommodation Form: Contact number',
      q3: 'Accommodation Form: Type of room',
      q4: 'Library: Maximum books per loan',
      q5: 'Library: Loan period',
      q6: 'Section 2: Library location',
      q7: 'Section 2: Requirement to use the gym',
      q8: 'Section 2: Swimming pool availability',
      q9: 'Section 2: Cafeteria hot meals hours',
      q10: 'Section 2: Laundrette location'
    },
    transcript: `[Section 1] Welcome to the student accommodation services. I am here to help you register. May I have your name, please? Yes, it's John Smith. That is S-M-I-T-H. Great. And your contact number? It's 07123456789. OK. What type of room are you looking for? A single room, please. OK, we have a single room available. Before you go, let me mention a few more details about the library. Students may borrow up to five books at a time, for a loan period of three weeks.
[Section 2] Now let me tell you about our campus facilities. The library is located in the north building, which is open from 8:00 AM to 10:00 PM daily. We also have a state-of-the-art sports center next to the library. It includes an indoor swimming pool, which is heated throughout the year, and a fully equipped gym. To use the gym, students must attend an induction session first. Lastly, the student cafeteria is in the central block, serving hot meals from 11:30 AM to 2:30 PM. For laundry, there is a free laundrette in the basement of each residence hall.`
  },
  travel: {
    id: "travel",
    title: "Travel Agency Booking & City Museum Tour",
    keys: {
      q1: 'JENKINS',
      q2: '07987654321',
      q3: '12 JULY',
      q4: 'FIFTEEN',
      q5: '48 HOURS',
      q6: 'B',
      q7: 'A',
      q8: 'C',
      q9: 'B',
      q10: 'B'
    },
    questions: {
      q1: 'Travel Agency Form: Name (Last name)',
      q2: 'Travel Agency Form: Contact number',
      q3: 'Travel Agency Form: Date of the tour',
      q4: 'Tour policy: Maximum group size',
      q5: 'Tour policy: Cancellation notice required',
      q6: 'Section 2: Main exhibition room location',
      q7: 'Section 2: Requirement to see the royal collection',
      q8: 'Section 2: Photography rules',
      q9: 'Section 2: Gift shop hours',
      q10: 'Section 2: Private guide extra fee'
    },
    transcript: `[Section 1] Good morning, City Travel Agency. How can I help you? Yes, I'd like to book a city tour. Sure. What is your name? It's Sarah Jenkins. That is J-E-N-K-I-N-S. OK, Sarah. And your contact number? It's 07987654321. Great. Which date would you like to tour? The twelfth of July, please. One more thing before you go — let me explain our tour policies. Tours are limited to a maximum of fifteen people per group. If you need to cancel, please notify us at least 48 hours in advance for a full refund.
[Section 2] Welcome to the City Historical Museum. Before we start, let me explain the layout. The main exhibition room is on the second floor, open from 9 AM to 5 PM. To see the special royal collection, visitors must purchase an extra ticket. Photography is strictly prohibited inside the collection hall. Finally, our gift shop is next to the exit, selling souvenirs and booklets from 10 AM to 4 PM. A private guide can be arranged for an additional fee of thirty pounds.`
  },
  career: {
    id: "career",
    title: "Job Interview & Office Orientation",
    keys: {
      q1: 'HARRISON',
      q2: 'DAVID.H@TECH.COM',
      q3: 'SOFTWARE ENGINEER',
      q4: 'FIFTEEN',
      q5: 'ONE WEEK',
      q6: 'A',
      q7: 'C',
      q8: 'A',
      q9: 'B',
      q10: 'B'
    },
    questions: {
      q1: 'HR Form: Name (Last name)',
      q2: 'HR Form: Contact email',
      q3: 'HR Form: Position applied for',
      q4: 'Interview process: Minutes to arrive early',
      q5: 'Interview process: Notified of second round within',
      q6: 'Section 2: Conference room location',
      q7: 'Section 2: Requirement to access office after 7 PM',
      q8: 'Section 2: Staff free parking location',
      q9: 'Section 2: Kitchen open hours',
      q10: 'Section 2: Interview structure'
    },
    transcript: `[Section 1] Hello, HR department of Tech Solutions. I am calling about my interview tomorrow. Ah, yes. Can I confirm your name, please? Yes, it's David Harrison. That is H-A-R-R-I-S-O-N. Thank you, David. Your contact email is david.h@tech.com? Yes. And what position are you interviewing for? The software engineer position. Before we finish, let me tell you about the interview process itself. Please arrive fifteen minutes early and bring two forms of identification. If successful, candidates will be notified of the second round within one week.
[Section 2] Welcome to your first day at Tech Solutions. Let me show you around the office. The conference room is on the third floor, which is used for all department meetings. To access the office after 7 PM, employees must use their security badge. Free parking is available for all staff members in the basement garage. Lastly, the company kitchen is on the first floor, offering free coffee and snacks from 8:30 AM to 6 PM. The interview itself will consist of two rounds: a technical test followed by a panel interview.`
  },
  clinic: {
    id: "clinic",
    title: "Health Centre Appointment & Facilities",
    keys: { q1: 'TAYLOR', q2: '07700900123', q3: 'DENTAL', q4: '24 HOURS', q5: '1 PM', q6: 'A', q7: 'B', q8: 'A', q9: 'B', q10: 'C' },
    questions: {
      q1: 'Form: Name (Last name)', q2: 'Form: Contact number', q3: 'Form: Appointment type',
      q4: 'Prescription ready within', q5: 'Saturday closing time',
      q6: 'Section 2: Pharmacy location', q7: 'Section 2: Requirement to see a specialist',
      q8: 'Section 2: When blood tests are done', q9: 'Section 2: How long parking is free',
      q10: 'Section 2: Appointment reminder method'
    },
    transcript: `[Section 1] Good morning, City Health Centre. How can I help you? I'd like to book an appointment. Can I take your name? It's Emma Taylor. That is T-A-Y-L-O-R. And a contact number? It's 07700900123. What is the appointment for? A dental check-up, please. Before you go, if you need a repeat prescription, you can request one online, and it will be ready for collection within 24 hours. The health centre is also open on Saturdays, from nine in the morning until one in the afternoon, but closed on Sundays.
[Section 2] Welcome to the health centre. The pharmacy is on the ground floor, open until 8 PM. To see a specialist, you need a referral from your doctor. Blood tests are done only in the morning, before 11 AM. The car park is free for the first two hours. You will also receive an SMS reminder 24 hours before your appointment.`
  },
  restaurant: {
    id: "restaurant",
    title: "Restaurant Booking & Information",
    keys: { q1: 'CLARK', q2: '07911123456', q3: 'SATURDAY', q4: 'SMART CASUAL', q5: '4 HOURS', q6: 'B', q7: 'A', q8: 'A', q9: 'B', q10: 'B' },
    questions: {
      q1: 'Form: Name (Last name)', q2: 'Form: Contact number', q3: 'Form: Day of booking',
      q4: 'Dress code', q5: 'Cancellation notice required',
      q6: 'Section 2: Main dining area location', q7: 'Section 2: Tonight\'s special',
      q8: 'Section 2: Requirement for the private room', q9: 'Section 2: When live music starts',
      q10: "Section 2: Children's menu age limit"
    },
    transcript: `[Section 1] Good evening, The Riverside Restaurant. I'd like to book a table for Saturday. What name shall I put it under? It's David Clark. That is C-L-A-R-K. And a phone number? Yes, it's 07911123456. One more thing — we kindly ask guests to dress smart casual for the evening service, and if you need to cancel, please let us know at least 4 hours in advance.
[Section 2] Welcome to The Riverside. The main dining area is on the first floor, with river views. Our special tonight is grilled salmon, served until 9 PM. To use the private room, a deposit of fifty pounds is required. Live music starts at 8 PM every Saturday. We also offer a children's menu for young guests under twelve.`
  },
  college: {
    id: "college",
    title: "Evening Course Enrolment",
    keys: { q1: 'WHITE', q2: '07800123456', q3: 'PHOTOGRAPHY', q4: 'TEN WEEKS', q5: 'TUESDAY', q6: 'A', q7: 'A', q8: 'A', q9: 'B', q10: 'B' },
    questions: {
      q1: 'Form: Name (Last name)', q2: 'Form: Contact number', q3: 'Form: Course',
      q4: 'Course duration', q5: 'Class day',
      q6: 'Section 2: Where classes are held', q7: 'Section 2: Requirement for student discount',
      q8: 'Section 2: What is provided free', q9: 'Section 2: Library closing time on weekdays',
      q10: 'Section 2: Payment options'
    },
    transcript: `[Section 1] Hello, Riverside Community College. I'm interested in enrolling in an evening course. May I have your name? It's Laura White. That is W-H-I-T-E. And a contact number? It's 07800123456. Which course? The photography course, please. The course runs for ten weeks, with classes every Tuesday evening from six to eight, and upon completion you will receive a certificate of attendance.
[Section 2] Welcome to the college. Classes are held in the main building, room 12. To get a student discount, you must show a valid ID. The course materials are provided free of charge. The library is open until 9 PM on weekdays. Payment can be made in full, or split into three monthly instalments.`
  }
};

// AI matn generatsiyasi. Haqiqiy provayder: OpenAI gpt-4o-mini (src/lib/aiClient.ts).
// `_model` parametri eski chaqiruvlar bilan moslik uchun saqlangan, ishlatilmaydi.
async function askAI(systemPrompt: string, userPrompt: string, _model: string = '', maxTokens: number = 8000): Promise<string> {
  return callAI(systemPrompt, userPrompt, maxTokens);
}

// Helper to strip markdown code blocks and parse JSON
function parseJSONResponse(text: string): any {
  let cleanText = text.trim();
  
  if (cleanText.startsWith('```')) {
    const firstNewLine = cleanText.indexOf('\n');
    if (firstNewLine !== -1) {
      cleanText = cleanText.slice(firstNewLine + 1);
    }
    if (cleanText.endsWith('```')) {
      cleanText = cleanText.slice(0, -3);
    }
    cleanText = cleanText.trim();
  }
  
  const startIdx = cleanText.indexOf('{');
  const endIdx = cleanText.lastIndexOf('}');
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleanText = cleanText.slice(startIdx, endIdx + 1);
  }
  
  return JSON.parse(cleanText);
}

// Realistic IELTS band from raw score, calibrated to the official Academic raw→band proportions.
function bandFromScore(correct: number, total: number): string {
  const pct = total > 0 ? correct / total : 0;
  if (pct >= 1) return "9.0";
  if (pct >= 0.85) return "8.0";
  if (pct >= 0.70) return "7.0";
  if (pct >= 0.57) return "6.0";
  if (pct >= 0.43) return "5.0";
  if (pct >= 0.28) return "4.0";
  if (pct >= 0.14) return "3.5";
  return "2.5";
}

export async function POST(request: Request) {
  try {
    // Kvota tekshiruvi: kim so'rayapti va bugungi limitidan oshmadimi.
    // Limit tugagan bo'lsa 402 qaytadi va AI umuman chaqirilmaydi.
    const gate = await checkQuota(request, 'evaluate');
    if (gate.denied) return gate.denied.response;

    const { type, content, prompt, answers, passageId, azurePronunciationMetrics, language, targetLevel, customKeys, trackId } = await request.json();

    // Baholash mezoni endi TILdan emas, YO'NALISHdan olinadi. Ilgari ingliz tilidagi
    // har qanday imtihon (Multilevel ham) IELTS band deskriptorlari bilan baholanardi.
    const track = getTrack(trackId);

    // 0. WRITING TASK 1 EVALUATION
    if (type === 'writing_task1') {
      if (!content) return NextResponse.json({ error: 'Content is required' }, { status: 400 });

      const systemPrompt = `You are a professional educational assessor for the ${language || 'english'} language exam (${track.title}).
Active exam course: ${language || 'english'}
Student's Target Proficiency Level: ${targetLevel || 'Not specified (assume standard B2 / IELTS 6.5)'}

${track.gradingRubricNote}

Evaluate this candidate response with strictness and detail. In the comments and improvements, clearly assess whether the student's submission is on track to achieve their Target Level, identifying any gaps and exactly how to bridge them.

Task prompt: ${prompt}
Candidate's response: ${content}

Score criteria (0.0 to 9.0 internal scale used for consistent tracking — map the target exam's real competencies onto it):
- Task Achievement (TA)
- Coherence & Cohesion (CC)
- Lexical Resource (LR)
- Grammatical Range & Accuracy (GRA)

Return a pure JSON object with this exact structure (no markdown, no extra text):
{
  "score": "Overall Band Score rounded to nearest 0.5 (e.g. 6.5)",
  "taskResponse": "TA band score (e.g. 7.0)",
  "coherence": "CC band score (e.g. 6.0)",
  "lexical": "LR band score (e.g. 6.5)",
  "grammar": "GRA band score (e.g. 6.5)",
  "comments": "2-3 sentences of detailed examiner commentary covering all four criteria in relation to their target score (${targetLevel || 'IELTS 6.5'}). Written in Uzbek.",
  "improvements": [
    "Aniq va amaliy maslahat 1 — Task Achievement yaxshilash uchun o'zbekcha",
    "Aniq va amaliy maslahat 2 — Lug'at boyligini oshirish bo'yicha o'zbekcha",
    "Aniq va amaliy maslahat 3 — Grammatik aniqlikni oshirish bo'yicha o'zbekcha"
  ],
  "detailedCorrections": [
    {
      "original": "The original sentence or phrase with a mistake from the student's response",
      "corrected": "The corrected, polished, academic version",
      "explanation": "Xatolik sababi va qanday qilib yaxshiroq yozish mumkinligi haqida o'zbekcha izoh"
    }
  ],
  "band9Sample": "A full Band 9 model answer for this specific prompt. Written entirely in the target language (${language || 'english'})."
}`;

      const userPrompt = `Task 1 Prompt: "${prompt}"\nCandidate's Response: "${content}"`;

      const responseText = await askAI(systemPrompt, userPrompt);
      const feedback = parseJSONResponse(responseText);
      feedback.examName = track.title;
      feedback.scoreLabel = track.scoreLabel;
      feedback.formatScore = trackScore(track, parseFloat(feedback.score) || 0);
      return NextResponse.json(feedback);
    }

    // 1. WRITING EVALUATION
    if (type === 'writing') {
      if (!content) return NextResponse.json({ error: 'Content is required' }, { status: 400 });

      const systemPrompt = `You are a professional educational assessor for the ${language || 'english'} language exam (${track.title}).
Active exam course: ${language || 'english'}
Student's Target Proficiency Level: ${targetLevel || 'Not specified (assume standard B2 / IELTS 6.5)'}

${track.gradingRubricNote}

Evaluate this candidate essay response with strictness and detail. In your comments, detailed corrections, and actionable improvements, analyze if this essay meets the standards of their Target Level, exactly where they fell short, and how to improve.

Topic/Prompt: ${prompt}
Candidate's response: ${content}

Score criteria (0.0 to 9.0 internal scale used for consistent tracking — map the target exam's real competencies onto it):
- Task Response (TR)
- Coherence & Cohesion (CC)
- Lexical Resource (LR)
- Grammatical Range & Accuracy (GRA)

Return a pure JSON object with this exact structure (no markdown, no extra text):
{
  "score": "Overall Band Score rounded to nearest 0.5 (e.g. 6.5)",
  "taskResponse": "TR band score (e.g. 7.0)",
  "coherence": "CC band score (e.g. 6.0)",
  "lexical": "LR band score (e.g. 6.5)",
  "grammar": "GRA band score (e.g. 6.5)",
  "comments": "O'ta chuqur tahliliy fikr-mulohazalar o'zbek tilida, ayniqsa talabaning maqsadli darajasi (${targetLevel || 'IELTS 6.5'}) bilan taqqoslagan holda kamchiliklar va yutuqlar bayoni.",
  "improvements": [
    "Inshoning tuzilishi yoki mazmunini yaxshilash uchun 1-aniq va amaliy maslahat o'zbekcha",
    "Lug'at boyligini (vocab) oshirish bo'yicha 2-aniq maslahat o'zbekcha",
    "Grammatik xatolarni kamaytirish bo'yicha 3-aniq maslahat o'zbekcha"
  ],
  "detailedCorrections": [
    {
      "original": "The original sentence or phrase with a mistake from the student's response",
      "corrected": "The corrected, polished, academic version",
      "explanation": "Qanday xato qilingani va qoidasi haqida tushunarli o'zbekcha izoh"
    }
  ],
  "band9Sample": "A full Band 9 model sample essay for this specific prompt. Written entirely in the target language (${language || 'english'})."
}

Ensure all criteria scores are realistic and strict. Round to the nearest 0.5. Do not add any conversational intro or outro text, only the pure JSON.`;

      const userPrompt = `Topic/Prompt: "${prompt}"
Student's Essay: "${content}"`;

      const responseText = await askAI(systemPrompt, userPrompt);
      const feedback = parseJSONResponse(responseText);
      feedback.examName = track.title;
      feedback.scoreLabel = track.scoreLabel;
      feedback.formatScore = trackScore(track, parseFloat(feedback.score) || 0);
      return NextResponse.json(feedback);
    }

    // 2. SPEAKING EVALUATION
    if (type === 'speaking') {
      if (!content) return NextResponse.json({ error: 'Content is required' }, { status: 400 });

      const metricsContext = azurePronunciationMetrics
        ? `\nAdditionally, the speech was assessed by Azure Speech Pronunciation Assessment, yielding the following objective metrics (scores are on a 1-100 scale):
- Pronunciation overall score: ${azurePronunciationMetrics.pronunciation}/100
- Accuracy (phoneme pronunciation precision): ${azurePronunciationMetrics.accuracy}/100
- Fluency (speed, pauses, rhythm): ${azurePronunciationMetrics.fluency}/100
- Completeness (how many words were pronounced): ${azurePronunciationMetrics.completeness}/100
- Prosody (intonation, stress, natural melody): ${azurePronunciationMetrics.prosody}/100

Please align your band scores for Pronunciation and Fluency & Coherence with these objective measurements (e.g. a score of 80-90 typically corresponds to Band 7.5-8.5, 65-79 to Band 6.0-7.0, 50-64 to Band 5.0-5.5, and below 50 to lower bands).`
        : '';

      const speakingExaminerTitle = track.id === 'ielts'
        ? 'a Chief Cambridge IELTS Speaking Examiner'
        : `a Chief ${track.title} Speaking Examiner`;
      const systemPrompt = `You are ${speakingExaminerTitle}. You grade with absolute accuracy and strictness, following the official speaking band descriptors. ${track.gradingRubricNote}
Student's Target Proficiency Level: ${targetLevel || 'Not specified (assume standard B2 / IELTS 6.5)'}

Analyze the transcribed speech of the student. Because it is a transcript of spoken language, take filler words, pauses, and repetition into account when grading Fluency & Coherence.${metricsContext}

Important: If Azure Pronunciation Metrics are not available, please note that the transcript is generated by a browser-based speech-to-text engine and may contain transcription errors, phonetic typos, or missing word endings. Do not penalize the candidate's Grammar or Vocabulary for obvious transcription errors (e.g. confusing homophones or minor missing word endings). Focus on their core vocabulary, grammatical complexity, and logic.

The evaluation must be written in Uzbek (except for original/corrected sentences and criteria names) and returned as a pure JSON object.

The output JSON MUST follow this exact structure:
{
  "overall": "Overall Band Score (e.g. 6.0) - strictly rounded to nearest 0.5 according to IELTS guidelines",
  "criteria": {
    "fluency": "Band Score for Fluency and Coherence (e.g. 6.0)",
    "lexical": "Band Score for Lexical Resource (e.g. 6.5)",
    "grammar": "Band Score for Grammatical Range and Accuracy (e.g. 5.5)",
    "pronunciation": "Band Score for Pronunciation (e.g. 6.0) - estimate based on spoken flow, hesitation, and clarity"
  },
  "transcript": "The provided student speech transcript",
  "analysis": "Talabaning gapirish ko'nikmasi bo'yicha o'ta professional tahlil o'zbek tilida. Uning ravonligi, so'z boyligi, grammatik qamrovi va talaffuz xususiyatlarini ayniqsa uning maqsadli darajasi (${targetLevel || 'IELTS 6.5'}) talablariga solishtirib batafsil tahlil qiling.",
  "actionable_steps": [
    "Ravonlik va fikrni bog'lashni yaxshilash bo'yicha maslahat o'zbek tilida",
    "Lug'at boyligini yanada boyitish (idiomalar, sinonimlar) bo'yicha maslahat o'zbek tilida",
    "Grammatik barqarorlik va murakkab gaplarni ishlatish bo'yicha maslahat o'zbek tilida"
  ],
  "detailedCorrections": [
    {
      "original": "The student's spoken phrase containing a mistake or awkward phrasing",
      "corrected": "A natural, fluent, and correct IELTS way of saying it",
      "explanation": "Xatolik sababi va qanday qilib yaxshiroq aytish mumkinligi haqida o'zbekcha izoh"
    }
  ],
  "band9Sample": "Talaba gapirmoqchi bo'lgan fikrlarni o'z ichiga olgan, Band 9.0 darajasidagi ravon, tabiiy va mukammal inglizcha javob namunasi."
}

Ensure the grading is highly realistic and matches real Cambridge standards. Do not over-grade.

CALIBRATION (be precise & consistent): anchor each criterion to the official band level — Band 5 = limited range, noticeable hesitation; Band 6 = willing to speak at length though with some repetition/self-correction; Band 7 = speaks fluently with some flexible, less-common vocabulary; Band 8 = fluent, wide range, rare errors. Compare candidate directly with their target score of ${targetLevel || 'IELTS 6.5'}. An identical transcript MUST always receive the identical score. The overall band must reflect the average of the four criteria, rounded to the nearest 0.5. Do not add any conversational intro or outro text, only the pure JSON.`;

      const userPrompt = `Cue Card/Prompt: "${prompt}"
Student's Transcribed Speech: "${content}"`;

      const responseText = await askAI(systemPrompt, userPrompt);
      const feedback = parseJSONResponse(responseText);
      feedback.examName = track.title;
      feedback.scoreLabel = track.scoreLabel;
      feedback.formatScore = trackScore(track, parseFloat(feedback.overall) || 0);
      return NextResponse.json(feedback);
    }

    // 3. READING EVALUATION (GRADES MULTIPLE PASSAGES DYNAMICALLY)
    if (type === 'reading') {
      if (!answers) return NextResponse.json({ error: 'Answers are required' }, { status: 400 });

      const selectedPassageId = passageId || 'universe';
      const passageInfo = PASSAGE_DATA[selectedPassageId] || PASSAGE_DATA['universe'];
      const activeKeys = customKeys || passageInfo.keys;

      let correctCount = 0;
      const totalCount = Object.keys(activeKeys).length;
      const allQuestionsList: any[] = [];

      for (const key of Object.keys(activeKeys)) {
        const userAns = (answers[key] || '').trim().toUpperCase();
        const correctAns = activeKeys[key];
        if (userAns === correctAns) {
          correctCount++;
        }
        allQuestionsList.push({
          id: key,
          question: (passageInfo.questions && passageInfo.questions[key]) || key,
          userAnswer: userAns || '(Javob berilmagan)',
          correctAnswer: correctAns
        });
      }

      // Realistic band score (calibrated to official IELTS raw→band proportions)
      const band = bandFromScore(correctCount, totalCount);

      let explanations: Record<string, string> = {};

      try {
        const systemPrompt = `You are an expert personal Reading tutor analysing a student's test on the passage "${passageInfo.title}".
Active practice language: ${language || 'english'}
Student's Target Proficiency Level: ${targetLevel || 'Not specified (assume standard B2 / IELTS 6.5)'}

Passage:
${passageInfo.text}

For EACH of the ${totalCount} questions, write a thorough, tutor-style analysis in UZBEK that teaches the student. Each explanation MUST include, in this order:
1. ✅ To'g'ri javob va NEGA — state the correct answer and the reasoning.
2. 📌 ISBOT — quote the EXACT proving sentence/phrase from the passage (in the active language: ${language || 'english'}, in quotation marks) and explain in Uzbek why it answers the question. For "matching paragraph" questions, name the paragraph; for TRUE/FALSE/NOT GIVEN, explain precisely why it is that label (especially the difference between FALSE = the passage contradicts it, and NOT GIVEN = the passage simply does not mention it).
3. ❌ SIZNING JAVOBINGIZ — if the student's answer differs from the correct one, explain specifically WHY their choice is wrong (e.g. why the paragraph they picked does NOT contain that information, or why the statement is not TRUE/FALSE as they thought). If they were correct, briefly praise and reinforce why.
4. 💡 MASLAHAT — one short strategy tip for this question type, showing how to secure the score required for their target of ${targetLevel || 'IELTS 6.5'}.

Be specific, evidence-based, and educational — like a real tutor sitting next to the student. Use the labels/emojis above.

Return the result as a pure JSON object mapping the Question ID to the Uzbek explanation string, with one key per question id (${Object.keys(activeKeys).join(', ')}), like this:
{
  "q1": "Tushuntirish...",
  "q2": "Tushuntirish..."
}
Do not add any markdown formatting or explanations outside the JSON.`;

        const userPrompt = `Here are the questions and student's answers:
${allQuestionsList.map(iq => `- Question ID: ${iq.id}\n  Question: ${iq.question}\n  Student's Answer: "${iq.userAnswer}"\n  Correct Answer: "${iq.correctAnswer}"`).join('\n')}`;

        const responseText = await askAI(systemPrompt, userPrompt, '', 4000);
        explanations = parseJSONResponse(responseText);
      } catch (err: any) {
        console.warn("Failed to generate reading explanations:", err);
      }

      // English keeps the plain IELTS band as its native score; other languages also get
      // their real exam's scale (TOPIK/HSK/JLPT/TRKI level) computed from the same band.
            return NextResponse.json({
        correct: correctCount,
        total: totalCount,
        band,
        examName: track.title,
        scoreLabel: track.scoreLabel,
        formatScore: trackScore(track, parseFloat(band)),
        explanations
      });
    }

    // 4. LISTENING EVALUATION (GRADES SECTION 1 & 2 DYNAMICALLY)
    if (type === 'listening') {
      if (!answers) return NextResponse.json({ error: 'Answers are required' }, { status: 400 });

      const selectedTestId = passageId || 'campus';
      const testInfo = LISTENING_TESTS_DATA[selectedTestId] || LISTENING_TESTS_DATA['campus'];
      const activeKeys = customKeys || testInfo.keys;

      let correctCount = 0;
      const totalCount = Object.keys(activeKeys).length;
      const allQuestionsList: any[] = [];

      for (const key of Object.keys(activeKeys)) {
        const userAns = (answers[key] || '').trim().toUpperCase();
        const correctAns = activeKeys[key];
        if (userAns === correctAns) {
          correctCount++;
        }
        allQuestionsList.push({
          id: key,
          question: (testInfo.questions && testInfo.questions[key]) || key,
          userAnswer: userAns || '(Javob berilmagan)',
          correctAnswer: correctAns
        });
      }

      // Realistic band score (calibrated to official IELTS raw→band proportions)
      const band = bandFromScore(correctCount, totalCount);

      let explanations: Record<string, string> = {};

      try {
        const systemPrompt = `You are an expert personal IELTS Listening tutor analysing a student's test.
Active practice language: ${language || 'english'}
Student's Target Proficiency Level: ${targetLevel || 'Not specified (assume standard B2 / IELTS 6.5)'}

Audio Transcript:
"${testInfo.transcript}"

For EACH of the ${totalCount} questions, write a thorough, tutor-style analysis in UZBEK that teaches the student. Each explanation MUST include, in this order:
1. ✅ To'g'ri javob va NEGA — state the correct answer and the reasoning.
2. 📌 ISBOT — quote the EXACT phrase from the audio transcript (in the active language: ${language || 'english'}, in quotation marks) where the answer is heard, and explain in Uzbek why it is correct. Point out any "distractor" — a word the speaker mentions that might mislead the listener.
3. ❌ SIZNING JAVOBINGIZ — if the student's answer differs, explain specifically WHY their choice is wrong (e.g. they caught a distractor word, or a spelling/number-format error). If correct, briefly praise and reinforce.
4. 💡 MASLAHAT — one short listening strategy tip for this question type (e.g. listening for synonyms, spelling, plural -s) to hit their target score of ${targetLevel || 'IELTS 6.5'}.

Be specific, evidence-based, and educational — like a real tutor. Use the labels/emojis above.

Return the result as a pure JSON object mapping the Question ID to the Uzbek explanation string, with one key per question id (${Object.keys(activeKeys).join(', ')}), like this:
{
  "q1": "Tushuntirish...",
  "q2": "Tushuntirish..."
}
Do not add any markdown formatting or explanations outside the JSON.`;

        const userPrompt = `Here are the questions and student's answers:
${allQuestionsList.map(iq => `- Question ID: ${iq.id}\n  Question: ${iq.question}\n  Student's Answer: "${iq.userAnswer}"\n  Correct Answer: "${iq.correctAnswer}"`).join('\n')}`;

        const responseText = await askAI(systemPrompt, userPrompt, '', 4000);
        explanations = parseJSONResponse(responseText);
      } catch (err: any) {
        console.warn("Failed to generate listening explanations:", err);
      }

            return NextResponse.json({
        correct: correctCount,
        total: totalCount,
        band,
        examName: track.title,
        scoreLabel: track.scoreLabel,
        formatScore: trackScore(track, parseFloat(band)),
        explanations
      });
    }

    return NextResponse.json({ error: 'Invalid evaluation type' }, { status: 400 });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred during evaluation' }, { status: 500 });
  }
}
