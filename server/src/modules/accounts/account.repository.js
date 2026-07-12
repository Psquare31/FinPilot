import Account from "../../models/Account.js";
import BaseRepository from "../../shared/repositories/base.repository.js";

class AccountRepository extends BaseRepository {
    constructor() { super(Account); }

    findActiveByWorkspace(workspaceId, options = {}) {
        return this.paginate({ workspace: workspaceId, isArchived: false }, { sort: { createdAt: -1 }, ...options });
    }

    findDuplicateName(workspaceId, name, excludedId) {
        const filter = { workspace: workspaceId, name: { $regex: `^${name}$`, $options: "i" } };
        if (excludedId) filter._id = { $ne: excludedId };
        return this.exists(filter);
    }
}

export default new AccountRepository();
