declare global {
    type SignInFormData = {
        email: string;
        password: string;
    };

    type SignUpFormData = {
        fullName: string;
        email: string;
        password: string;
        country: string;
        investmentGoals: string;
        riskTolerance: string;
        preferredIndustry: string;
    };

    type CountrySelectProps = {
        name: string;
        label: string;
        control: Control;
        error?: FieldError;
        required?: boolean;
    };

    type FormInputProps = {
        name: string;
        label: string;
        placeholder: string;
        type?: string;
        register: UseFormRegister;
        error?: FieldError;
        validation?: RegisterOptions;
        disabled?: boolean;
        value?: string;
    };

    type Option = {
        value: string;
        label: string;
    };

    type SelectFieldProps = {
        name: string;
        label: string;
        placeholder: string;
        options: readonly Option[];
        control: Control;
        error?: FieldError;
        required?: boolean;
    };

    type FooterLinkProps = {
        text: string;
        linkText: string;
        href: string;
    };

    type SearchCommandProps = {
        renderAs?: 'button' | 'text';
        label?: string;
        initialStocks: StockWithWatchlistStatus[];
    };

    type WatchlistTableItem = {
        company: string;
        symbol: string;
        currentPrice?: number;
        priceFormatted?: string;
        changeFormatted?: string;
        changePercent?: number;
        marketCap?: string;
        peRatio?: string;
    };

    type WatchlistTableProps = {
        items: WatchlistTableItem[];
        onRemoveAction?: () => void;
    };

    type WelcomeEmailData = {
        email: string;
        name: string;
        intro: string;
    };

    type User = {
        id: string;
        name: string;
        email: string;
    };

    type Stock = {
        symbol: string;
        name: string;
        exchange: string;
        type: string;
    };

    type StockWithWatchlistStatus = Stock & {
        isInWatchlist: boolean;
    };

    type FinnhubSearchResult = {
        symbol: string;
        description: string;
        displaySymbol?: string;
        type: string;
    };

    type FinnhubSearchResponse = {
        count: number;
        result: FinnhubSearchResult[];
    };

    type MarketNewsArticle = {
        id?: string;
        category?: string;
        datetime?: number;
        headline?: string;
        image?: string;
        related?: string;
        source?: string;
        summary?: string;
        url?: string;
    };

    type RawNewsArticle = {
        id?: string | number;
        category?: string;
        datetime?: number;
        headline?: string;
        image?: string;
        related?: string;
        source?: string;
        summary?: string;
        url?: string;
    };

    type QuoteData = {
        c?: number; // Current price
        d?: number; // Change
        dp?: number; // Change percentage
        h?: number; // High price of the day
        l?: number; // Low price of the day
        o?: number; // Open price of the day
        pc?: number; // Previous close price
        t?: number; // Unix timestamp
    };

    type ProfileData = {
        country?: string;
        currency?: string;
        estimateRevenue?: number;
        exchange?: string;
        finnhubIndustry?: string;
        ipo?: string;
        logo?: string;
        marketCapitalization?: number;
        name?: string;
        phone?: string;
        shareOutstanding?: number;
        ticker?: string;
        weburl?: string;
    };

    type FinancialsData = {
        metric?: {
            peNormalizedAnnual?: number;
            [key: string]: any;
        };
    };

    type StockDetailsPageProps = {
        params: Promise<{
            symbol: string;
        }>;
    };
}

export {};