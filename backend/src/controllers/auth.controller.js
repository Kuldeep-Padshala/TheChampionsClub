"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = void 0;
const auth_service_1 = require("../services/auth.service");
const token_service_1 = require("../services/token.service");
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Validate credentials using the service
        const user = await (0, auth_service_1.loginUser)({ email, password });
        // Generate JWT token
        const token = (0, token_service_1.generateAccessToken)(user.id, user.email, user.roles);
        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user
        });
    }
    catch (error) {
        console.error('[Login Error]', error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Server Error'
        });
    }
};
exports.login = login;
