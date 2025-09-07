// import { PrismaClient } from '@prisma/client';
// const prisma = new PrismaClient();

// export async function seedForDevice() {
//   console.log('🔄 Resetting database...');

//   try {
//     // XÓA DỮ LIỆU TRƯỚC KHI SEED
//     await prisma.device.deleteMany();
//     console.log('✅ Database reset successfully!');

//     // Lấy danh sách người dùng
//     const users = await prisma.user.findMany();

//     if (users.length < 5) {
//       console.warn('⚠️ Không đủ người dùng để tạo seed cho thiết bị.');
//       return;
//     }

//     console.log('🌱 Seeding Devices...');
//     const devices = users.slice(0, 5).map((user, index) => ({
//       userID: user.id,
//       device_token: `device_token_${index + 1}`, // Đảm bảo giá trị duy nhất
//       device_type: index % 2 === 0 ? 'Android' : 'iOS',
//       os_version: index % 2 === 0 ? `${10 + index}` : `${12 + index}`,
//       app_version: '1.0.0',
//     }));

//     await prisma.device.createMany({
//       data: devices,
//       skipDuplicates: true, // Tránh lỗi khi chạy lại seed
//     });

//     console.log('✅ Devices seeded successfully!');
//   } catch (error) {
//     console.error('❌ Error seeding devices:', error);
//   } finally {
//     await prisma.$disconnect();
//   }
// }
