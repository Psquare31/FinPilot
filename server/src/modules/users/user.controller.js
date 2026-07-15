import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const me = asyncHandler(async (req, res) =>
    res.status(200).json(new ApiResponse(200, req.user, "User fetched successfully."))
);

export default { me };
