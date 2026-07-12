class BaseMapper {
    static toResponse(document) {
        if (!document) return document;
        return typeof document.toObject === "function" ? document.toObject() : document;
    }

    static toResponseList(documents = []) { return documents.map((document) => this.toResponse(document)); }
}

export default BaseMapper;
