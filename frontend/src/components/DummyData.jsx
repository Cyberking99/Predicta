import Flag from "../assets/images/pngs/flag-us.png";

export const predictions = [

    // Sports Category
    {
      id: 1,
      flag: Flag,
      question: "Will United States Win The FIFA World Cup 2026?",
      yesPercentage: 70,
      noPercentage: 30,
      votes: "105",
      timeLeft: "20 hrs 56 mins left",
      category: "sports"
    },
    {
      id: 2,
      flag: Flag,
      question: "Will Lakers win the NBA Championship 2024?",
      yesPercentage: 65,
      noPercentage: 35,
      votes: "892",
      timeLeft: "15 hrs 30 mins left",
      category: "sports"
    },
    {
      id: 3,
      flag: Flag,
      question: "Will Max Verstappen win F1 Championship 2024?",
      yesPercentage: 80,
      noPercentage: 20,
      votes: "674",
      timeLeft: "2 days 12 hrs left",
      category: "sports"
    },

    // Technology Category
    {
      id: 4,
      flag: Flag,
      question: "Will SpaceX successfully land on Mars by 2025?",
      yesPercentage: 85,
      noPercentage: 15,
      votes: "234",
      timeLeft: "2 days 4 hrs left",
      category: "technology"
    },
    {
      id: 5,
      flag: Flag,
      question: "Will Apple release a foldable iPhone in 2024?",
      yesPercentage: 45,
      noPercentage: 55,
      votes: "892",
      timeLeft: "5 hrs 30 mins left",
      category: "technology"
    },
    {
      id: 6,
      flag: Flag,
      question: "Will ChatGPT-5 be released in 2024?",
      yesPercentage: 60,
      noPercentage: 40,
      votes: "1.5k",
      timeLeft: "1 day 8 hrs left",
      category: "technology"
    },

    // Finance Category
    {
      id: 7,
      flag: Flag,
      question: "Will Bitcoin reach $100,000 by end of 2024?",
      yesPercentage: 60,
      noPercentage: 40,
      votes: "1.2k",
      timeLeft: "1 day 12 hrs left",
      category: "finance"
    },
    {
      id: 8,
      flag: Flag,
      question: "Will the Fed cut interest rates in Q2 2024?",
      yesPercentage: 55,
      noPercentage: 45,
      votes: "2.1k",
      timeLeft: "3 days 6 hrs left",
      category: "finance"
    },
    {
      id: 9,
      flag: Flag,
      question: "Will S&P 500 reach 5500 by end of 2024?",
      yesPercentage: 70,
      noPercentage: 30,
      votes: "956",
      timeLeft: "2 days 18 hrs left",
      category: "finance"
    },

    // Politics Category
    {
      id: 10,
      flag: Flag,
      question: "Will there be a new Speaker of the House in 2024?",
      yesPercentage: 40,
      noPercentage: 60,
      votes: "1.8k",
      timeLeft: "1 day 4 hrs left",
      category: "politics"
    },
    {
      id: 11,
      flag: Flag,
      question: "Will voter turnout exceed 65% in 2024 election?",
      yesPercentage: 55,
      noPercentage: 45,
      votes: "2.3k",
      timeLeft: "4 days 12 hrs left",
      category: "politics"
    },
    {
      id: 12,
      flag: Flag,
      question: "Will there be a third-party candidate debate?",
      yesPercentage: 35,
      noPercentage: 65,
      votes: "892",
      timeLeft: "3 days 9 hrs left",
      category: "politics"
    },

    // Entertainment Category
    {
      id: 13,
      flag: Flag,
      question: "Will Netflix introduce a gaming streaming service in 2024?",
      yesPercentage: 55,
      noPercentage: 45,
      votes: "543",
      timeLeft: "3 days 8 hrs left",
      category: "entertainment"
    },
    {
      id: 14,
      flag: Flag,
      question: "Will Beyoncé win Album of the Year at the Grammys?",
      yesPercentage: 75,
      noPercentage: 25,
      votes: "1.7k",
      timeLeft: "2 days 15 hrs left",
      category: "entertainment"
    },
    {
      id: 15,
      flag: Flag,
      question: "Will GTA 6 be released in 2024?",
      yesPercentage: 45,
      noPercentage: 55,
      votes: "3.2k",
      timeLeft: "5 days 6 hrs left",
      category: "entertainment"
    },

    // Business Category
    {
      id: 16,
      flag: Flag,
      question: "Will Tesla launch a sub $30,000 electric car in 2024?",
      yesPercentage: 40,
      noPercentage: 60,
      votes: "756",
      timeLeft: "1 day 15 hrs left",
      category: "business"
    },
    {
      id: 17,
      flag: Flag,
      question: "Will Amazon acquire a major retail chain in 2024?",
      yesPercentage: 30,
      noPercentage: 70,
      votes: "1.1k",
      timeLeft: "2 days 8 hrs left",
      category: "business"
    },
    {
      id: 18,
      flag: Flag,
      question: "Will Microsoft complete the Activision acquisition?",
      yesPercentage: 85,
      noPercentage: 15,
      votes: "2.4k",
      timeLeft: "1 day 20 hrs left",
      category: "business"
    }

  ]

// Categories for filtering
export const categories = [
  "Sports",
  "Technology",
  "Cryptocurrency",
  "Entertainment",
  "Automotive"
];

// Time filters
export const timeFilters = [
  "Ending Soon (< 6 hours)",
  "Today",
  "This Week",
  "This Month"
];


export const bets = [
  {
    title: "Real Madrid To Win Barcelona",
    bet: "Yes",
    stake: 1.0,
    timeRemaining: "05 hrs 56 mins",
    icon: (
      <div className="bg-white/10 w-full h-full rounded-lg flex items-center justify-center">
        🎮
      </div>
    ),
  },
  {
    title: "Uzbekistan To Win Uruguay",
    bet: "Yes",
    stake: 12.5,
    outcome: "Won",
    icon: (
      <div className="bg-white/10 w-full h-full rounded-lg flex items-center justify-center">
        🇺🇿
      </div>
    ),
  },
  {
    title: "Trump To Win Kamala In Elections",
    bet: "Yes",
    stake: 1.0,
    outcome: "Lost",
    icon: (
      <div className="bg-white/10 w-full h-full rounded-lg flex items-center justify-center">
        🇺🇸
      </div>
    ),
  },
];