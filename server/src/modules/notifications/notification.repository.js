import Notification from "../../models/Notification.js";
import BaseRepository from "../../shared/repositories/base.repository.js";

class NotificationRepository extends BaseRepository {
    constructor() { super(Notification); }
}

export default new NotificationRepository();
