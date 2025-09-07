export class NotificationHelper {
  static createOrderSuccessMessage(
    orderId: number,
    userName: string,
    staffName: string,
    serviceDetails: string,
    appointmentTime: string,
  ) {
    return `
        📅 **Xác nhận lịch hẹn!**  
        Xin chào **${userName}**,  
        Bạn đã đặt thành công một lịch hẹn với nhân viên **${staffName}**.  
        
        🔹 **Mã đặt lịch:** #${orderId}  
        🔹 **Dịch vụ:** ${serviceDetails}  
        🔹 **Thời gian:** ${appointmentTime}  
  
        Cảm ơn bạn đã tin tưởng sử dụng dịch vụ! 🚀
      `;
  }

  static createAdminNewOrderMessage(orderId: number, userName: string) {
    return `
          📢 **Đơn hàng mới!**  
          Người dùng **${userName}** vừa đặt một đơn hàng mới **#${orderId}**.  
          Vui lòng kiểm tra và xử lý đơn hàng ngay!
        `;
  }
}
