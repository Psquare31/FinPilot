import Budget from "../../models/Budget.js";
import BaseRepository from "../../shared/repositories/base.repository.js";

class BudgetRepository extends BaseRepository {
    constructor() { super(Budget); }
}

export default new BudgetRepository();
