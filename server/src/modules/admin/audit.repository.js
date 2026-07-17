import AuditLog from "../../models/AuditLog.js";
import BaseRepository from "../../shared/repositories/base.repository.js";

// admin.repository.js re-exports this file, and modules/admin/index.js
// re-exports that — but the file itself was never created, so importing the
// admin module threw "Cannot find module ./audit.repository.js" and took the
// whole route table down with it.
class AuditRepository extends BaseRepository {
    constructor() { super(AuditLog); }
}

export default new AuditRepository();
