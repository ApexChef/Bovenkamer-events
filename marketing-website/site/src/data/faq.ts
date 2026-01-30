/**
 * Party Pilot - FAQ Data
 * Frequently Asked Questions organized by category
 */

export type FAQCategory = 'algemeen' | 'prijzen' | 'functies' | 'technisch';

export interface FAQItem {
  question: string;
  answer: string;
  category: FAQCategory;
}

export const faqItems: FAQItem[] = [
  // ALGEMEEN
  {
    question: 'Wat is Party Pilot precies?',
    answer: 'Party Pilot is een complete feestorganisatie-app die je helpt van uitnodiging tot afwas. Je kunt digitale uitnodigingen versturen, dieetwensen verzamelen, automatische inkooplijsten genereren, betalingen regelen via Tikkie, en je gasten vermaken met een live quiz en voorspellingen. Alles op één plek.',
    category: 'algemeen',
  },
  {
    question: 'Voor welk type feesten is Party Pilot geschikt?',
    answer: 'Party Pilot is perfect voor elk type feest: verjaardagen, BBQ\'s, bruiloften, bedrijfsborrels, housewarming parties, tuinfeesten, en meer. Of je nu 10 of 100 gasten hebt, Party Pilot schaalt mee.',
    category: 'algemeen',
  },
  {
    question: 'Moet ik een app downloaden?',
    answer: 'Nee! Party Pilot werkt volledig in je browser op je telefoon, tablet of computer. Gasten hoeven ook niets te installeren - ze krijgen een link en kunnen direct deelnemen.',
    category: 'algemeen',
  },
  {
    question: 'Hebben mijn gasten een account nodig?',
    answer: 'Nee, gasten hebben geen account nodig. Ze krijgen een persoonlijke link waarmee ze direct kunnen aanmelden, hun voorkeuren kunnen delen, en kunnen deelnemen aan quiz en voorspellingen.',
    category: 'algemeen',
  },

  // PRIJZEN
  {
    question: 'Wat kost Party Pilot?',
    answer: 'Party Pilot is gratis voor feesten tot 15 gasten. Voor grotere feesten betaal je €2,50 per gast. Bij 30 gasten is dat bijvoorbeeld €75. Er zijn geen abonnementskosten - je betaalt alleen per feest.',
    category: 'prijzen',
  },
  {
    question: 'Wanneer moet ik betalen?',
    answer: 'Je betaalt pas wanneer je je feest activeert en gasten begint uit te nodigen. Je kunt eerst alles voorbereiden in het gratis plan en pas upgraden wanneer je klaar bent.',
    category: 'prijzen',
  },
  {
    question: 'Kan ik het eerst uitproberen?',
    answer: 'Absoluut! Start met het gratis plan voor tot 15 gasten. Zo kun je alle basisfuncties uitproberen zonder te betalen. Bevalt het? Dan kun je altijd upgraden.',
    category: 'prijzen',
  },
  {
    question: 'Krijg ik mijn geld terug als het feest niet doorgaat?',
    answer: 'Ja, als je feest niet doorgaat kun je binnen 14 dagen voor de feestdatum contact opnemen voor een volledige terugbetaling. We begrijpen dat plannen kunnen wijzigen.',
    category: 'prijzen',
  },

  // FUNCTIES
  {
    question: 'Hoe werkt de automatische inkooplijst?',
    answer: 'Je stelt een menu samen in de app. Op basis van het aantal gasten en hun dieetwensen berekent Party Pilot exact hoeveel je van elk ingrediënt nodig hebt. De lijst wordt automatisch ingedeeld per supermarkt-afdeling voor makkelijk winkelen.',
    category: 'functies',
  },
  {
    question: 'Kan ik de live quiz aanpassen aan mijn feest?',
    answer: 'Ja! Je kunt eigen vragen toevoegen naast de standaard vragen. Maak het persoonlijk met vragen over de jarige, jullie vriendschap, of inside jokes.',
    category: 'functies',
  },
  {
    question: 'Hoe werkt de Tikkie-integratie?',
    answer: 'Koppel je Tikkie-account aan Party Pilot. De app genereert automatisch een betaalverzoek dat je met één klik kunt delen met je gasten. Je ziet direct wie betaald heeft en kunt herinneringen sturen naar wie nog moet betalen.',
    category: 'functies',
  },
  {
    question: 'Wat doet de AI taakverdeling precies?',
    answer: 'Op basis van de vaardigheden en voorkeuren die gasten invullen bij aanmelding, wijst de AI taken toe zoals "salade maken", "muziek regelen" of "bbq aansteken". Met een humoristische twist voor extra lol. Je kunt taken altijd handmatig aanpassen.',
    category: 'functies',
  },

  // TECHNISCH
  {
    question: 'Is mijn data veilig?',
    answer: 'Ja, zeer. We gebruiken encryptie voor alle gevoelige data, hosten in de EU (GDPR-compliant), en delen nooit je gegevens met derden. Na je feest worden persoonlijke gegevens na 30 dagen automatisch verwijderd.',
    category: 'technisch',
  },
  {
    question: 'Werkt Party Pilot ook offline?',
    answer: 'De meeste functies vereisen internet. Maar gasten kunnen hun profiel en voorkeuren offline invullen - deze worden gesynchroniseerd zodra ze weer online zijn.',
    category: 'technisch',
  },
  {
    question: 'Kan ik Party Pilot gebruiken op mijn tablet of computer?',
    answer: 'Ja! Party Pilot werkt op elk apparaat met een moderne browser: telefoon, tablet, laptop of desktop. Het interface past zich automatisch aan je schermgrootte aan.',
    category: 'technisch',
  },
  {
    question: 'Wat als ik technische problemen heb tijdens mijn feest?',
    answer: 'We hebben 24/7 support voor betalende klanten via chat en email. Voor gratis gebruikers is er email support tijdens kantooruren. Check ook onze uitgebreide Help Center met veelvoorkomende oplossingen.',
    category: 'technisch',
  },
];

// Group by category
export const faqByCategory = {
  algemeen: faqItems.filter(item => item.category === 'algemeen'),
  prijzen: faqItems.filter(item => item.category === 'prijzen'),
  functies: faqItems.filter(item => item.category === 'functies'),
  technisch: faqItems.filter(item => item.category === 'technisch'),
};

// Category labels
export const categoryLabels: Record<FAQCategory, string> = {
  algemeen: 'Algemeen',
  prijzen: 'Prijzen & Betaling',
  functies: 'Functies',
  technisch: 'Technisch',
};
