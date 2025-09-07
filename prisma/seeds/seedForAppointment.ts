// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// export async function seedForAppointment() {
//   console.log('🔄 Resetting database...');

//   await prisma.appointment.deleteMany();
//   console.log('✅ Database reset successfully!');
//   console.log('🌱 Seeding Appointments...');

//   // Lấy danh sách chi tiết đơn hàng chưa có lịch hẹn
//   const orderDetailsWithoutAppointments =
//     await prisma.serviceOrderDetail.findMany({
//       where: { appointment: null },
//       include: {
//         order: {
//           include: {
//             customer: true, // Chỉ cần lấy thông tin customer, không cần lồng quá nhiều
//           },
//         },
//       },
//     });

//   // Tạo danh sách lịch hẹn từ các đơn hàng chưa có lịch
//   const appointmentsData = await Promise.all(
//     orderDetailsWithoutAppointments.map(async (detail, index) => {
//       if (!detail.order || !detail.order.customer) {
//         console.warn(
//           `⚠️ Bỏ qua serviceOrderDetail ${detail.id} do không có order hoặc customer.`,
//         );
//         return null;
//       }

//       // Lấy địa chỉ của khách hàng nếu có
//       const customerAddress = await prisma.userAddress.findFirst({
//         where: { user_id: detail.order.customer.id },
//       });

//       if (!customerAddress) {
//         console.warn(
//           `⚠️ Không tìm thấy địa chỉ khách hàng cho đơn hàng ${detail.order.id}, bỏ qua.`,
//         );
//         return null;
//       }

//       return {
//         order_detail_id: detail.id,
//         scheduled_date: new Date(
//           new Date().setDate(new Date().getDate() + (index % 7) + 1),
//         ),
//         scheduled_time: `${9 + (index % 8)}:00`,
//         status: 'pending',
//         customer_note: `Customer note for order ${detail.order.id}`,
//         employee_note: null,
//         customer_address: customerAddress?.id ?? null,
//       };
//     }),
//   );

//   // Lọc bỏ các phần tử null trước khi gọi createMany()
//   const validAppointmentsData = appointmentsData.filter(
//     (a): a is NonNullable<typeof a> => a !== null,
//   );

//   await prisma.appointment.createMany({ data: validAppointmentsData });
//   console.log('✅ Seeding completed successfully!');
// }
