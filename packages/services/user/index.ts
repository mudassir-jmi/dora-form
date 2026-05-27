import {
    createUserWithEmailAndPasswordInput,
    CreateUserWithEmailAndPasswordInputType,
    generateUserTokenPayload,
    generateUserTokenPayloadType,
    requestPasswordResetInput,
    RequestPasswordResetInputType,
    resetPasswordInput,
    ResetPasswordInputType,
    signInUserWithEmailAndPasswordInput,
    SignInUserWithEmailAndPasswordInputType,
    verifyEmailInput,
    VerifyEmailInputType
} from './model.js'
import { db, eq } from '@repo/database'
import { usersTable } from '@repo/database/models/user'
import { env } from '../env.js'
import { sendPasswordResetEmail, sendVerificationEmail } from './email.js'
import {
    createOpaqueToken,
    createSalt,
    generatePasswordHash,
    hashOpaqueToken,
    signUserJwt,
    verifyUserJwt
} from './tokens.js'
class UserService {
    private async getUserByEmail(email: string) {
        const result = await db.select().from(usersTable).where(eq(usersTable.email, email));
        if (!result || result.length === 0) return null;
        return result[0];
    }

    private getFrontendUrl() {
        return env.FRONTEND_URL ?? "https://DoraForm.pallabdev.in";
    }

    private async generateUserToken(payload: generateUserTokenPayloadType) {
        const { id } = await generateUserTokenPayload.parseAsync(payload)
        const token = signUserJwt({ id })
        return { token }
    }

    private generateHash(password: string, salt: string) {
        return generatePasswordHash(password, salt);
    }

    public async createUserWithEmailAndPassword(payload: CreateUserWithEmailAndPasswordInputType) {
        // Bussiness Logic

        const { fullName, email, password } = await createUserWithEmailAndPasswordInput.parseAsync(payload);

        // check user already exists or not
        const existingUserWithEmail = await this.getUserByEmail(email);

        if (existingUserWithEmail) throw new Error(`An account with this email already exists.`);

        const salt = createSalt()

        const hash = this.generateHash(password, salt);
        const emailVerification = createOpaqueToken();

        const createdUser = await db.insert(usersTable).values({
            fullName,
            email,
            emailVerified: false,
            emailVerificationToken: emailVerification.tokenHash,
            password: hash,
            salt
        }).returning({
            id: usersTable.id
        })
        if (!createdUser || createdUser.length === 0 || !createdUser[0]?.id) throw new Error(`Unable to create your account right now.`)
        const userId = createdUser[0].id;

        let verificationEmailSent = true;
        try {
            await sendVerificationEmail(
                email,
                fullName,
                `${this.getFrontendUrl()}/verify-email?token=${encodeURIComponent(emailVerification.rawToken)}`,
            );
        } catch (error) {
            verificationEmailSent = false;
            console.error("Unable to send verification email", error);
        }

        const { token } = await this.generateUserToken({ id: userId })


        return {
            id: userId,
            token,
            verificationEmailSent,
        }

    }

    public async verifyEmail(payload: VerifyEmailInputType) {
        const { token } = await verifyEmailInput.parseAsync(payload);
        const tokenHash = hashOpaqueToken(token);

        const [user] = await db
            .select({
                id: usersTable.id,
                emailVerified: usersTable.emailVerified,
            })
            .from(usersTable)
            .where(eq(usersTable.emailVerificationToken, tokenHash))
            .limit(1);

        if (!user) throw new Error(`This verification link is invalid or has already been used.`);

        await db
            .update(usersTable)
            .set({
                emailVerified: true,
                emailVerificationToken: null,
            })
            .where(eq(usersTable.id, user.id));

        const { token: authToken } = await this.generateUserToken({ id: user.id });
        return {
            id: user.id,
            token: authToken,
        };
    }

    public async requestPasswordReset(payload: RequestPasswordResetInputType) {
        const { email } = await requestPasswordResetInput.parseAsync(payload);
        const user = await this.getUserByEmail(email);

        if (!user) return { success: true };

        const passwordReset = createOpaqueToken();
        await db
            .update(usersTable)
            .set({ passwordResetToken: passwordReset.tokenHash })
            .where(eq(usersTable.id, user.id));

        await sendPasswordResetEmail(
            user.email,
            user.fullName,
            `${this.getFrontendUrl()}/reset-password?token=${encodeURIComponent(passwordReset.rawToken)}`,
        );

        return { success: true };
    }

    public async resetPassword(payload: ResetPasswordInputType) {
        const { token, password } = await resetPasswordInput.parseAsync(payload);
        const tokenHash = hashOpaqueToken(token);

        const [user] = await db
            .select({
                id: usersTable.id,
            })
            .from(usersTable)
            .where(eq(usersTable.passwordResetToken, tokenHash))
            .limit(1);

        if (!user) throw new Error(`This password reset link is invalid or has already been used.`);

        const salt = createSalt();
        const hash = this.generateHash(password, salt);

        await db
            .update(usersTable)
            .set({
                password: hash,
                salt,
                passwordResetToken: null,
            })
            .where(eq(usersTable.id, user.id));

        return { success: true };
    }

    public async signInUserWithEmailAndPassword(payload: SignInUserWithEmailAndPasswordInputType) {
        const { email, password } = await signInUserWithEmailAndPasswordInput.parseAsync(payload)
        const user = await this.getUserByEmail(email);

        if (!user) throw new Error(`Invalid email or password.`)
        if (!user.password || !user.salt) throw new Error(`Please use the original sign-in method for this account.`)


        const hash = this.generateHash(password, user.salt);
        if (user.password !== hash) throw new Error(`Invalid email or password.`)


        const { token } = await this.generateUserToken({ id: user.id })
        return {
            id: user.id,
            token
        }

    }

    private async verifyUserToken(token: string) {
        try {

            const verificationResult = verifyUserJwt(token) as generateUserTokenPayloadType
            return verificationResult;
        } catch (error) {
            throw new Error(`Your session is invalid or expired. Please sign in again.`)
        }
    }

    private async getUserInfoById(id: string) {
        const [user] = await db.select({
            id: usersTable.id,
            email: usersTable.email,
            fullName: usersTable.fullName,
            profileImageUrl: usersTable.profileImageUrl,
            emailVerified: usersTable.emailVerified

        }).from(usersTable).where(eq(usersTable.id, id)).limit(1)
        if (!user) throw new Error(`User account was not found.`)
        return user
    }
    public async verfiyAndDecodeUserByToken(token: string) {
        const { id } = await this.verifyUserToken(token)
        const userInfo = await this.getUserInfoById(id)
        return {
            id: userInfo.id,
            email: userInfo.email,
            fullName: userInfo.fullName,
            profileImageUrl: userInfo.profileImageUrl,
            emailVerified: userInfo.emailVerified ?? false
        }
    }

}

export default UserService
export { sendPaymentReceiptEmail } from "./email.js";
