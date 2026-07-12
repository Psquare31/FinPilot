import User from "../../models/User.js";
import BaseRepository from "../../shared/repositories/base.repository.js";

class UserRepository extends BaseRepository {
    constructor() { super(User); }
}

export default new UserRepository();
