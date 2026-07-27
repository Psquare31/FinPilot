import User from "../models/User.js";

import ApiError from "../utils/ApiError.js";

import {
    getPrimaryEmail,
    getAuthProvider,
    getProfileImage,
} from "../utils/auth/auth.utils.js";

// Clerk does not guarantee a first name — an email/password sign-up has none
// unless the instance asks for it. `firstName` is required (min 2 chars) on the
// User model, so fall back to the email's local part and finally to a literal,
// otherwise a valid sign-in fails with a validation error and locks the user out.
const deriveFirstName = (clerkUser, email) => {
    const candidate =
        clerkUser.firstName?.trim() ||
        email.split("@")[0].replace(/[._-]+/g, " ").trim();

    return candidate && candidate.length >= 2 ? candidate.slice(0, 50) : "User";
};

class AuthService {
    // ======================================================
    // Synchronize Clerk user with MongoDB.
    // Creates a new user on first login or updates the
    // existing profile on subsequent logins.
    // ======================================================
    async syncUser(clerkUser) {
        const email = getPrimaryEmail(clerkUser);

        if (!email) {
            throw new ApiError(
                400,
                "Unable to determine user's primary email.",
                [],
                "EMAIL_NOT_FOUND"
            );
        }

        let user = await User.findOne({
            clerkId: clerkUser.id,
        });

        if (!user) {
            user = await User.findOne({
                email,
            });
        }

        if (!user) {
            user = await User.create({
                clerkId: clerkUser.id,

                authProvider: getAuthProvider(clerkUser),

                firstName: deriveFirstName(clerkUser, email),

                lastName: clerkUser.lastName || "",

                email,

                avatar: { url: getProfileImage(clerkUser) || "" },

                emailVerified:
                    clerkUser.emailAddresses.find(
                        (item) =>
                            item.id === clerkUser.primaryEmailAddressId
                    )?.verification?.status === "verified",

                lastLoginAt: new Date(),
            });

            return user;
        }

        user.clerkId = clerkUser.id;

        user.firstName =
            clerkUser.firstName || user.firstName || deriveFirstName(clerkUser, email);

        user.lastName = clerkUser.lastName || user.lastName || "";

        user.email = email;

        user.avatar = { url: getProfileImage(clerkUser) || user.avatar?.url || "" };

        user.emailVerified =
            clerkUser.emailAddresses.find(
                (item) => item.id === clerkUser.primaryEmailAddressId
            )?.verification?.status === "verified";

        user.authProvider = getAuthProvider(clerkUser);

        user.lastLoginAt = new Date();

        await user.save();

        return user;
    }

    // ======================================================
    // Return authenticated user
    // ======================================================
    async getCurrentUser(userId) {
        const user = await User.findById(userId);

        if (!user) {
            throw new ApiError(
                404,
                "User not found.",
                [],
                "USER_NOT_FOUND"
            );
        }

        return user;
    }

    // ======================================================
    // Update profile
    // ======================================================
    async updateProfile(userId, payload) {
        const user = await User.findByIdAndUpdate(
            userId,
            payload,
            {
                new: true,
                runValidators: true,
            }
        );

        if (!user) {
            throw new ApiError(
                404,
                "User not found.",
                [],
                "USER_NOT_FOUND"
            );
        }

        return user;
    }

    // ======================================================
    // Complete onboarding
    // ======================================================
    async completeOnboarding(userId, payload = {}) {
        const user = await User.findByIdAndUpdate(
            userId,
            {
                ...payload,
                isOnboardingComplete: true,
            },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!user) {
            throw new ApiError(
                404,
                "User not found.",
                [],
                "USER_NOT_FOUND"
            );
        }

        return user;
    }

    // ======================================================
    // Update last login
    // ======================================================
    async updateLastLogin(userId) {
        await User.findByIdAndUpdate(userId, {
            lastLoginAt: new Date(),
        });
    }

    // ======================================================
    // Delete account
    // (Soft delete is recommended in production)
    // ======================================================
    async deleteAccount(userId) {
        const user = await User.findById(userId);

        if (!user) {
            throw new ApiError(
                404,
                "User not found.",
                [],
                "USER_NOT_FOUND"
            );
        }

        // ACCOUNT_STATUS is ["active", "inactive", "suspended"] — "DELETED"
        // isn't a member, so this save() always failed validation.
        user.status = "inactive";

        await user.save();

        return user;
    }

    // ======================================================
    // Find by Clerk ID
    // ======================================================
    async findByClerkId(clerkId) {
        return User.findOne({
            clerkId,
        });
    }

    // ======================================================
    // Find by Email
    // ======================================================
    async findByEmail(email) {
        return User.findOne({
            email,
        });
    }
}

export default new AuthService();