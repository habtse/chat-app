import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting database seed...');

    // Create AI user
    const aiUser = await prisma.user.upsert({
        where: { email: 'ai@shipper.chat' },
        update: {},
        create: {
            email: 'ai@shipper.chat',
            name: 'AI Assistant',
            authType: 'JWT',
            profilePicUrl: 'https://ui-avatars.com/api/?name=AI+Assistant&background=6366f1&color=fff',
            isOnline: true,
        },
    });
    console.log('✓ AI user created');

    // Create test users
    const password = await bcrypt.hash('password123', 10);

    const user1 = await prisma.user.upsert({
        where: { email: 'john@example.com' },
        update: {},
        create: {
            email: 'john@example.com',
            name: 'John Doe',
            passwordHash: password,
            authType: 'JWT',
            profilePicUrl: 'https://ui-avatars.com/api/?name=John+Doe&background=random',
        },
    });

    const user2 = await prisma.user.upsert({
        where: { email: 'jane@example.com' },
        update: {},
        create: {
            email: 'jane@example.com',
            name: 'Jane Smith',
            passwordHash: password,
            authType: 'JWT',
            profilePicUrl: 'https://ui-avatars.com/api/?name=Jane+Smith&background=random',
        },
    });

    const user3 = await prisma.user.upsert({
        where: { email: 'bob@example.com' },
        update: {},
        create: {
            email: 'bob@example.com',
            name: 'Bob Johnson',
            passwordHash: password,
            authType: 'JWT',
            profilePicUrl: 'https://ui-avatars.com/api/?name=Bob+Johnson&background=random',
        },
    });

    console.log('✓ Test users created (password: password123)');

    // Create categories
    const workCategory = await prisma.category.upsert({
        where: { name: 'Work' },
        update: {},
        create: {
            name: 'Work',
            userCategories: {
                create: [
                    { userId: user1.id },
                    { userId: user2.id },
                ],
            },
        },
    });

    const friendsCategory = await prisma.category.upsert({
        where: { name: 'Friends' },
        update: {},
        create: {
            name: 'Friends',
            userCategories: {
                create: [
                    { userId: user1.id },
                    { userId: user3.id },
                ],
            },
        },
    });

    console.log('✓ Categories created');

    // Create a sample one-on-one chat session
    const session1 = await prisma.chatSession.create({
        data: {
            isGroup: false,
            members: {
                create: [
                    { userId: user1.id },
                    { userId: user2.id },
                ],
            },
            messages: {
                create: [
                    {
                        content: 'Hey Jane, how are you?',
                        senderId: user1.id,
                    },
                    {
                        content: 'Hi John! I\'m doing great, thanks for asking!',
                        senderId: user2.id,
                    },
                ],
            },
        },
    });

    console.log('✓ Sample one-on-one chat created');

    // Create a sample group chat
    const groupSession = await prisma.chatSession.create({
        data: {
            isGroup: true,
            name: 'Project Team',
            categoryId: workCategory.id,
            members: {
                create: [
                    { userId: user1.id, isAdmin: true },
                    { userId: user2.id },
                    { userId: user3.id },
                ],
            },
            messages: {
                create: [
                    {
                        content: 'Welcome to the project team chat!',
                        senderId: user1.id,
                    },
                    {
                        content: 'Thanks! Excited to be here.',
                        senderId: user2.id,
                    },
                    {
                        content: 'Let\'s get started!',
                        senderId: user3.id,
                    },
                ],
            },
        },
    });

    console.log('✓ Sample group chat created');

    console.log('\n✅ Database seeded successfully!');
    console.log('\nTest Users:');
    console.log('  - john@example.com (password: password123)');
    console.log('  - jane@example.com (password: password123)');
    console.log('  - bob@example.com (password: password123)');
    console.log('\nAI User:');
    console.log('  - ai@shipper.chat (always online)');
}

main()
    .catch((e) => {
        console.error('Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
