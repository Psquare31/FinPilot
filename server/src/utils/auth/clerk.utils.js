import { clerkClient } from "../../config/clerk/clerk.js";

export const getClerkUser = async (clerkId) => {
    return await clerkClient.users.getUser(clerkId);
};

export const deleteClerkUser = async (clerkId) => {
    return await clerkClient.users.deleteUser(clerkId);
};

export const updateClerkUser = async (clerkId, data) => {
    return await clerkClient.users.updateUser(clerkId, data);
};