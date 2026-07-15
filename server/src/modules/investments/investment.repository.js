import Investment from "../../models/Investment.js";
import BaseRepository from "../../shared/repositories/base.repository.js";

class InvestmentRepository extends BaseRepository {
    constructor() { super(Investment); }
}

export default new InvestmentRepository();
