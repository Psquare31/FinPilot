export const getPrimaryEmail = (clerkUser) => {
    const email = clerkUser.emailAddresses.find(
        (item) => item.id === clerkUser.primaryEmailAddressId
    );

    return email?.emailAddress ?? null;
};

export const getAuthProvider = (clerkUser) => {
    const providers = clerkUser.externalAccounts ?? [];

    if (!providers.length) {
        return "EMAIL";
    }

    const provider = providers[0].provider;

    switch (provider) {
        case "oauth_google":
            return "GOOGLE";

        case "oauth_microsoft":
            return "MICROSOFT";

        case "oauth_apple":
            return "APPLE";

        default:
            return "EMAIL";
    }
};

export const getProfileImage = (clerkUser) => {
    return clerkUser.imageUrl ?? "";
};