// Message generation service
export interface GeneratedMessage {
  content: string;
  category: string;
}

export class MessageGeneratorService {
  private static quotesAPI = 'https://api.quotable.io/quotes';
  private static zenAPI = 'https://zenquotes.io/api/quotes';
  
  // Predefined inspirational categories and messages for fallback
  private static fallbackMessages: GeneratedMessage[] = [
    {
      content: "Your potential is endless, and today is the perfect day to unleash it.",
      category: "Potential"
    },
    {
      content: "Believe in yourself and all that you are. Know that there is something inside you that is greater than any obstacle.",
      category: "Self-Belief"
    },
    {
      content: "Every great dream begins with a dreamer. Always remember, you have within you the strength, the patience, and the passion to reach for the stars.",
      category: "Dreams"
    },
    {
      content: "The only way to do great work is to love what you do. If you haven't found it yet, keep looking. Don't settle.",
      category: "Passion"
    },
    {
      content: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
      category: "Perseverance"
    },
    {
      content: "The future belongs to those who believe in the beauty of their dreams.",
      category: "Future"
    },
    {
      content: "You are never too old to set another goal or to dream a new dream.",
      category: "Goals"
    },
    {
      content: "The only impossible journey is the one you never begin.",
      category: "Journey"
    },
    {
      content: "In the middle of difficulty lies opportunity.",
      category: "Opportunity"
    },
    {
      content: "Be yourself; everyone else is already taken.",
      category: "Authenticity"
    },
    {
      content: "Life is 10% what happens to you and 90% how you react to it.",
      category: "Mindset"
    },
    {
      content: "The best time to plant a tree was 20 years ago. The second best time is now.",
      category: "Action"
    },
    {
      content: "Your limitation—it's only your imagination.",
      category: "Limits"
    },
    {
      content: "Great things never come from comfort zones.",
      category: "Growth"
    },
    {
      content: "Dream it. Wish it. Do it.",
      category: "Achievement"
    },
    {
      content: "Success doesn't just find you. You have to go out and get it.",
      category: "Success"
    },
    {
      content: "The harder you work for something, the greater you'll feel when you achieve it.",
      category: "Work"
    },
    {
      content: "Dream bigger. Do bigger.",
      category: "Ambition"
    },
    {
      content: "Don't stop when you're tired. Stop when you're done.",
      category: "Determination"
    },
    {
      content: "Wake up with determination. Go to bed with satisfaction.",
      category: "Purpose"
    },
    {
      content: "Do something today that your future self will thank you for.",
      category: "Future Self"
    },
    {
      content: "Little things make big days.",
      category: "Gratitude"
    },
    {
      content: "It's going to be hard, but hard does not mean impossible.",
      category: "Challenge"
    },
    {
      content: "Don't wait for opportunity. Create it.",
      category: "Initiative"
    },
    {
      content: "Sometimes we're tested not to show our weaknesses, but to discover our strengths.",
      category: "Strength"
    },
    {
      content: "The key to success is to focus on goals, not obstacles.",
      category: "Focus"
    },
    {
      content: "Dream it. Believe it. Build it.",
      category: "Creation"
    },
    {
      content: "Your only limit is your mind.",
      category: "Mental Power"
    },
    {
      content: "Push yourself, because no one else is going to do it for you.",
      category: "Self-Motivation"
    },
    {
      content: "Great things happen to those who don't stop believing, trying, learning, and being grateful.",
      category: "Persistence"
    }
  ];

  /**
   * Generate motivational messages using multiple sources
   */
  static async generateMessages(count: number = 3): Promise<GeneratedMessage[]> {
    try {
      // Try multiple sources in parallel
      const sources = [
        this.fetchFromQuotableAPI(count),
        this.fetchFromZenAPI(count),
        this.getRandomFallbackMessages(count)
      ];

      // Wait for the first successful response
      const results = await Promise.allSettled(sources);
      
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.length > 0) {
          return result.value.slice(0, count);
        }
      }

      // If all sources fail, return fallback messages
      return this.getRandomFallbackMessages(count);
    } catch (error) {
      console.error('Error generating messages:', error);
      return this.getRandomFallbackMessages(count);
    }
  }

  /**
   * Fetch quotes from Quotable API
   */
  private static async fetchFromQuotableAPI(count: number): Promise<GeneratedMessage[]> {
    const response = await fetch(`${this.quotesAPI}?limit=${count}&tags=motivational|inspirational|success|wisdom`);
    
    if (!response.ok) {
      throw new Error(`Quotable API error: ${response.status}`);
    }

    const data = await response.json();
    
    return data.results.map((quote: any) => ({
      content: quote.content,
      category: this.categorizeQuote(quote.content, quote.tags)
    }));
  }

  /**
   * Fetch quotes from ZenQuotes API (with CORS proxy if needed)
   */
  private static async fetchFromZenAPI(count: number): Promise<GeneratedMessage[]> {
    // ZenQuotes might have CORS issues, so we'll use a fallback approach
    try {
      const response = await fetch('https://zenquotes.io/api/quotes', {
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`ZenQuotes API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.slice(0, count).map((quote: any) => ({
        content: quote.q,
        category: this.categorizeQuote(quote.q)
      }));
    } catch (error) {
      // If ZenQuotes fails due to CORS, skip it
      throw error;
    }
  }

  /**
   * Get random messages from our fallback collection
   */
  private static getRandomFallbackMessages(count: number): GeneratedMessage[] {
    const shuffled = [...this.fallbackMessages].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  /**
   * Categorize quotes based on content keywords
   */
  private static categorizeQuote(content: string, tags?: string[]): string {
    const contentLower = content.toLowerCase();
    
    // Use tags if available
    if (tags && tags.length > 0) {
      const relevantTags = tags.filter(tag => 
        ['motivational', 'inspirational', 'success', 'wisdom', 'life', 'happiness', 'dreams'].includes(tag)
      );
      if (relevantTags.length > 0) {
        return relevantTags[0].charAt(0).toUpperCase() + relevantTags[0].slice(1);
      }
    }

    // Categorize based on keywords
    if (contentLower.includes('dream') || contentLower.includes('vision')) return 'Dreams';
    if (contentLower.includes('success') || contentLower.includes('achieve')) return 'Success';
    if (contentLower.includes('believe') || contentLower.includes('faith')) return 'Self-Belief';
    if (contentLower.includes('potential') || contentLower.includes('capable')) return 'Potential';
    if (contentLower.includes('persevere') || contentLower.includes('persist')) return 'Perseverance';
    if (contentLower.includes('courage') || contentLower.includes('brave')) return 'Courage';
    if (contentLower.includes('wisdom') || contentLower.includes('learn')) return 'Wisdom';
    if (contentLower.includes('happiness') || contentLower.includes('joy')) return 'Happiness';
    if (contentLower.includes('love') || contentLower.includes('heart')) return 'Love';
    if (contentLower.includes('future') || contentLower.includes('tomorrow')) return 'Future';
    
    return 'Inspiration';
  }

  /**
   * Generate a custom AI-style message based on a theme
   */
  static generateCustomMessage(theme: string): GeneratedMessage {
    const templates = {
      'morning': [
        "Today is a fresh canvas waiting for your masterpiece.",
        "Rise and shine! The universe has amazing plans for you today.",
        "Every sunrise brings new possibilities and endless potential.",
        "Greet this morning with courage and watch miracles unfold.",
        "Today's fresh start is your invitation to create something beautiful.",
        "The dawn whispers of new beginnings and infinite possibilities.",
        "Embrace this morning's energy and let it fuel your dreams.",
        "Each new day is a gift wrapped in golden sunlight and opportunity."
      ],
      'strength': [
        "You are stronger than you think and more capable than you imagine.",
        "Within you lies an unshakeable strength that can overcome any challenge.",
        "Your resilience is your superpower. Use it wisely.",
        "Strength isn't about never falling; it's about rising every time you do.",
        "You have survived 100% of your difficult days. Your track record is perfect.",
        "Inner strength grows strongest in the soil of adversity.",
        "Your courage doesn't roar; sometimes it's the quiet voice saying 'I'll try again tomorrow.'",
        "The strongest people are forged in fires of challenge and emerge as diamonds."
      ],
      'growth': [
        "Every step forward, no matter how small, is progress worth celebrating.",
        "Growth happens outside your comfort zone. Embrace the unknown.",
        "You are evolving into the person you're meant to become.",
        "Personal growth is a journey, not a destination. Enjoy the ride.",
        "Like a tree reaching for sunlight, you too are growing toward your potential.",
        "Each challenge you face is an invitation to grow stronger and wiser.",
        "Growth requires patience with yourself and faith in the process.",
        "You're not behind in life; you're exactly where you need to be to grow."
      ],
      'purpose': [
        "Your unique gifts are needed in this world. Share them boldly.",
        "You have a purpose that only you can fulfill. Trust the journey.",
        "The world is waiting for what only you can offer.",
        "Your purpose isn't just what you do; it's who you become while doing it.",
        "Every soul has a special assignment. Yours is unfolding perfectly.",
        "Purpose is found not in grand gestures, but in daily acts of love and service.",
        "Your life has meaning because you give it meaning through your choices.",
        "The universe conspired to create exactly one you. That's how important you are."
      ]
    };

    const themeMessages = templates[theme as keyof typeof templates] || templates.morning;
    const randomMessage = themeMessages[Math.floor(Math.random() * themeMessages.length)];
    
    return {
      content: randomMessage,
      category: theme.charAt(0).toUpperCase() + theme.slice(1)
    };
  }
}
