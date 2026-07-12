export const formatCurrency = (amount, currency = "USD", locale = "en-US") =>
    new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
