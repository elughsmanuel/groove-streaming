import bcrypt from 'bcryptjs';
import UserRepository from '../repositories/userRepository';
import BadRequest from '../../errors/BadRequest';
import UnprocessableEntity from '../../errors/UnprocessableEntity';
import { 
    PASSWORD_CHANGED,
    INCORRECT_PASSWORD,
    MATCHING_PASSWORD,
    SAME_PASSWORD,
} from '../../auth/utils/constants';
import { 
    USER_NOT_FOUND,
    USER_DELETED,
    SWITCHED_TO_ARTIST,
    SWITCHED_TO_LISTENER,
} from '../utils/constants';

class UserService {
    private userRepository: UserRepository;

    constructor(userRepository: UserRepository) {
        this.userRepository = userRepository;
    }

    async getAllUsers(
        page: any,
        perPage: any,
        role?: string,
    ) {
        const count = await this.userRepository.getTotalUserCount(role);

        // Calculate pagination values
        const skip = (page - 1) * perPage;
        const currentPage = Math.ceil(page);
        const totalPages = Math.ceil(count / perPage);

        const users = await this.userRepository.getAllUsers(role, skip, perPage);

        const userData = users.map(user => ({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            username: user.username,
            role: user.role,
            access: user.access,
            premium: user.premium,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }));

        return {
            status: true,
            data: userData,
            currentPage: currentPage,
            totalPages: totalPages,
        }
    }

    async getUserById(userId: string) {
        const user = await this.userRepository.getUserById(userId);

        if(!user) {
            throw new BadRequest(USER_NOT_FOUND);
        }

        const userData = {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            username: user.username,
            role: user.role,
            access: user.access,
            premium: user.premium,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }

        return {
            status: true,
            data: userData,
        }
    }

    async getMyProfile(userId: string) {
        const user = await this.userRepository.getUserById(userId);

        if(!user) {
            throw new BadRequest(USER_NOT_FOUND);
        }

        const userData = {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            username: user.username,
            role: user.role,
            access: user.access,
            premium: user.premium,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }

        return {
            status: true,
            data: userData,
        }
    }

    async updateMyProfile(userId: string, data: any) {
        const userExist = await this.userRepository.getUserById(userId);

        if(!userExist) {
            throw new BadRequest(USER_NOT_FOUND);
        }

        const user = await this.userRepository.updateMyProfile(userId, data);

        const userData = {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            username: user.username,
            role: user.role,
            access: user.access,
            premium: user.premium,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }

        return {
            status: true,
            data: userData,
        }
    }

    async switchToArtist(userId: string, data: any) {
        const userExist = await this.userRepository.getUserById(userId);

        if(!userExist) {
            throw new BadRequest(USER_NOT_FOUND);
        }

        await this.userRepository.switchToArtist(userId, data);

        return {
            status: true,
            message: SWITCHED_TO_ARTIST,
        }
    }

    async switchToListener(userId: string, data: any) {
        const userExist = await this.userRepository.getUserById(userId);

        if(!userExist) {
            throw new BadRequest(USER_NOT_FOUND);
        }

        await this.userRepository.switchToListener(userId, data);

        return {
            status: true,
            message: SWITCHED_TO_LISTENER,
        }
    }

    async updateMyPassword(userId: string, password: string, newPassword: string, confirmPassword: string) {
        const user = await this.userRepository.getUserById(userId);

        if(!user) {
            throw new BadRequest(USER_NOT_FOUND);
        }

        const storedPassword = await this.userRepository.findPasswordByUserId(userId);

        if (storedPassword === null) {
            throw new BadRequest(INCORRECT_PASSWORD);
        }

        const isPasswordValid = await bcrypt.compare(password, storedPassword);
    
        if (!isPasswordValid) {
            throw new BadRequest(INCORRECT_PASSWORD);
        }

        if (newPassword !== confirmPassword) {
            throw new UnprocessableEntity(MATCHING_PASSWORD);
        }

        if(password === newPassword) {
            throw new UnprocessableEntity(SAME_PASSWORD);
        }

        // Generate a hash for the new password and update the user's password
        const salt = await bcrypt.genSalt(Number(process.env.BCRYPT_SALT));
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await this.userRepository.updateUserPassword(userId, hashedPassword);

        return {
            status: true,
            message: PASSWORD_CHANGED,
        }
    }

    async deleteMe(userId: string) {
        const user = await this.userRepository.getUserById(userId);

        if(!user) {
            throw new BadRequest(USER_NOT_FOUND);
        }

        await this.userRepository.findByIdAndDelete(userId);

        return {
            status: true,
            message: USER_DELETED,
        }
    }

    async updateUser(userId: string, data: any) {
        const userExist = await this.userRepository.getUserById(userId);

        if(!userExist) {
            throw new BadRequest(USER_NOT_FOUND);
        }

        const user = await this.userRepository.updateUser(userId, data);

        const userData = {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            username: user.username,
            role: user.role,
            access: user.access,
            premium: user.premium,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }

        return {
            status: true,
            data: userData,
        }
    }

    async updateUserRole(userId: string, role: string) {
        const user = await this.userRepository.getUserById(userId);

        if(!user) {
            throw new BadRequest(USER_NOT_FOUND);
        }

        let access = user.access;
        if (role === 'admin') {
            access = 'admin';
        } else if (role === 'user') {
            access = 'listener';
        }

        await this.userRepository.updateUserRole(userId, role, access);

        const userData = {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            username: user.username,
            role: role,
            access: access,
            premium: user.premium,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }


        return {
            status: true,
            data: userData,
        }
    }

    async deleteUser(userId: string) {
        const user = await this.userRepository.getUserById(userId);

        if(!user) {
            throw new BadRequest(USER_NOT_FOUND);
        }

        await this.userRepository.findByIdAndDelete(userId);

        return {
            status: true,
            message: USER_DELETED,
        }
    }
}

export default UserService;
