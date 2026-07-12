export const getPagination = ({
    page = 1,
    limit = 10,
    maxLimit = 100,
}) => {
    page = Number(page);
    limit = Number(limit);

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
    if (limit > maxLimit) limit = maxLimit;

    return {
        page,
        limit,
        skip: (page - 1) * limit,
    };
};