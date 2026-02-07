export interface ITermsContent {
  title: string;
  version: string;
  lastUpdated: string;
  sections: { heading: string; body: string }[];
}

/**
 * Singleton class to manage Terms and Conditions content.
 * Follows OOP principles to encapsulate configuration and logic.
 */
export class TermsManager {
  private static instance: TermsManager;
  private readonly terms: ITermsContent;

  private constructor() {
    // In a real scenario, this could fetch from a CMS or database.
    // For now, it is easily changeable here.
    this.terms = {
      title: "Terms of Service",
      version: "1.0.2",
      lastUpdated: "October 2025",
      sections: [
        {
          heading: "1. Acceptance of Terms",
          body: "By accessing and using this platform, you accept and agree to be bound by the terms and provision of this agreement.",
        },
        {
          heading: "2. User Registration",
          body: "You agree to keep your password confidential and will be responsible for all use of your account and password.",
        },
        {
          heading: "3. Privacy Policy",
          body: "Your use of the website is also governed by our Privacy Policy. Please review our Privacy Policy for information on how we collect and use your data.",
        },
      ],
    };
  }

  public static getInstance(): TermsManager {
    if (!TermsManager.instance) {
      TermsManager.instance = new TermsManager();
    }
    return TermsManager.instance;
  }

  public getCurrentTerms(): ITermsContent {
    return this.terms;
  }
}