import authService from "./auth.service.js";

import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const me = asyncHandler(async (req, res) => {
    const user = await authService.getCurrentUser(req.user._id);

    return res.status(200).json(
        new ApiResponse(
            200,
            { user },
            "Current user fetched successfully."
        )
    );
});

const updateProfile = asyncHandler(async (req, res) => {
    const user = await authService.updateProfile(
        req.user._id,
        req.validatedData?.body ?? req.body
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            { user },
            "Profile updated successfully."
        )
    );
});

const completeOnboarding = asyncHandler(async (req, res) => {
    const user = await authService.completeOnboarding(
        req.user._id,
        req.validatedData?.body ?? req.body
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            { user },
            "Onboarding completed successfully."
        )
    );
});

const deleteAccount = asyncHandler(async (req, res) => {
    await authService.deleteAccount(req.user._id);

    return res.status(200).json(
        new ApiResponse(
            200,
            null,
            "Account deleted successfully."
        )
    );
});

export default {
    me,
    updateProfile,
    completeOnboarding,
    deleteAccount,
};