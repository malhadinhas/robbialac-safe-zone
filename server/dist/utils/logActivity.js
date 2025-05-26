"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logActivity = logActivity;
const UserActivity_1 = require("../models/UserActivity");
const medalController_1 = require("../controllers/medalController");
async function logActivity({ userId, category, action, details }) {
    const activity = new UserActivity_1.UserActivity({
        userId,
        category,
        action,
        details,
        timestamp: new Date()
    });
    await activity.save();
    await (0, medalController_1.checkActionBasedMedals)(userId);
}
