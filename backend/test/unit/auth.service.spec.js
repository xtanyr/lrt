"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
describe('bcrypt password hashing', () => {
    it('should hash a password', async () => {
        const password = 'password123';
        const hash = await bcrypt_1.default.hash(password, 10);
        expect(hash).toBeDefined();
        expect(hash).not.toBe(password);
    });
    it('should verify a correct password', async () => {
        const password = 'password123';
        const hash = await bcrypt_1.default.hash(password, 10);
        const isValid = await bcrypt_1.default.compare(password, hash);
        expect(isValid).toBe(true);
    });
    it('should reject an incorrect password', async () => {
        const password = 'password123';
        const hash = await bcrypt_1.default.hash(password, 10);
        const isValid = await bcrypt_1.default.compare('wrong_password', hash);
        expect(isValid).toBe(false);
    });
});
describe('password reset token generation', () => {
    it('should generate a token', () => {
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        expect(token).toBeDefined();
        expect(token.length).toBeGreaterThan(10);
    });
});
//# sourceMappingURL=auth.service.spec.js.map