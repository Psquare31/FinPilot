import Report from "../../models/Report.js";
import BaseRepository from "../../shared/repositories/base.repository.js";

class ReportRepository extends BaseRepository {
    constructor() { super(Report); }
}

export default new ReportRepository();
