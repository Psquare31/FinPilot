import Goal from "../../models/Goal.js";
import BaseRepository from "../../shared/repositories/base.repository.js";

class GoalRepository extends BaseRepository {
    constructor() { super(Goal); }
}

export default new GoalRepository();
