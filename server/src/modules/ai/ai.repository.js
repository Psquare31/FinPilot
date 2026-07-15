import AiInteraction from "../../models/AiInteraction.js";
import BaseRepository from "../../shared/repositories/base.repository.js";

class AiRepository extends BaseRepository {
    constructor() { super(AiInteraction); }
}

export default new AiRepository();
