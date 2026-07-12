const toAccountDto = (account) => {
    if (!account) return account;
    const source = typeof account.toObject === "function" ? account.toObject() : account;

    return {
        id: source._id?.toString?.() ?? source.id,
        name: source.name,
        balance: source.balance,
        currency: source.currency,
        type: source.type,
        institution: source.institution,
        isArchived: source.isArchived,
        workspace: source.workspace,
        createdAt: source.createdAt,
        updatedAt: source.updatedAt,
    };
};

export const toAccountListDto = (accounts = []) => accounts.map(toAccountDto);
export default toAccountDto;
