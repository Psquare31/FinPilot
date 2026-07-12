import Debt from "../../models/Debt.js";
import BaseRepository from "../../shared/repositories/base.repository.js";

class DebtRepository extends BaseRepository {
    constructor() { super(Debt); }
}

export default new DebtRepository();
