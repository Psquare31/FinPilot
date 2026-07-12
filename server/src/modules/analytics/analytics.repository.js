import Transaction from "../../models/Transaction.js";
import BaseRepository from "../../shared/repositories/base.repository.js";

class AnalyticsRepository extends BaseRepository {
    constructor() { super(Transaction); }
}

export default new AnalyticsRepository();
