import { BadGatewayException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PaginatorTypes } from '@nodeteam/nestjs-prisma-pagination';
import { Prisma } from '@prisma/client';
import unidecode from 'unidecode';

import { CreateServiceDto, ServiceResponse } from './dto/create-service.dto';
import { GetServiceCategoriesDto, ServicesDto } from './dto/services.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

import { generateSlug } from '@/common/helpers/util';
import { createPaginator, PaginationDto } from '@/common/pagination/paginationDto';
import { DatabaseService } from '@/database/database.service';
// import * as removeAccents from 'remove-accents';

@Injectable()
export class ServicesService {
  constructor(private prisma: DatabaseService) {}

  /**
   * Tạo một dịch vụ mới trong hệ thống.
   *
   * @param dto - Dữ liệu đầu vào để tạo dịch vụ, bao gồm thông tin như tên, danh mục, mô tả, giá cơ bản, trạng thái, thời gian bảo hành, và các hình ảnh liên quan.
   * @returns Một Promise chứa thông tin chi tiết của dịch vụ vừa được tạo, bao gồm ID, tên, slug, danh mục, đánh giá trung bình, số lượng đánh giá, mô tả, giá cơ bản, trạng thái, thời gian bảo hành, đơn vị bảo hành, URL biểu tượng, và danh sách hình ảnh.
   *
   * @throws BadGatewayException - Nếu danh mục được chỉ định trong `dto.categoryId` không tồn tại.
   *
   * Chức năng này thực hiện các bước sau:
   * 1. Kiểm tra xem danh mục có tồn tại hay không.
   * 2. Tạo dịch vụ mới cùng với các hình ảnh liên quan (nếu có) trong một giao dịch cơ sở dữ liệu.
   * 3. Tạo một slug duy nhất cho dịch vụ dựa trên tên và ID của nó.
   * 4. Cập nhật slug cho dịch vụ vừa tạo.
   */
  async create(dto: CreateServiceDto): Promise<ServiceResponse> {
    return this.prisma.$transaction(async (prisma) => {
      // 1. Kiểm tra category tồn tại
      const category = await prisma.serviceCategory.findUnique({
        where: { id: dto.categoryId },
      });

      if (!category) {
        throw new BadGatewayException('Category does not exist!');
      }

      // 3. Tạo service và images trong cùng transaction
      const createdService = await prisma.services.create({
        data: {
          name: dto.name,
          slug: '', // Sử dụng slug ngay từ đầu
          categoryId: dto.categoryId,
          description: dto.description ?? '',
          base_price: dto.base_price,
          is_active: dto.is_active,
          warranty_period: dto.warranty_period,
          warranty_unit: dto.warranty_unit,
          icon_url: dto.icon_url,
          // Tạo luôn images nếu có
          ServiceImages:
            dto.images && dto.images.length > 0
              ? {
                  createMany: {
                    data: dto.images.map((image) => ({
                      image_url: image.image_url,
                    })),
                  },
                }
              : undefined,
        },
        include: {
          ServiceImages: true,
        },
      });

      // Create standard unique slug
      const slug = `${generateSlug(dto.name)}-${createdService.id}`;

      // Update slug
      const updatedService = await prisma.services.update({
        where: { id: createdService.id },
        data: { slug },
        select: { slug: true },
      });

      return {
        id: createdService.id,
        name: createdService.name,
        slug: updatedService.slug,
        categoryId: dto.categoryId,
        average_rating: createdService.average_rating,
        review_count: createdService.review_count,
        description: createdService.description,
        base_price: createdService.base_price,
        is_active: createdService.is_active,
        created_at: createdService.created_at,
        updated_at: createdService.updated_at,
        warranty_period: createdService.warranty_period,
        warranty_unit: createdService.warranty_unit,
        icon_url: createdService.icon_url,
        images: createdService.ServiceImages,
      };
    });
  }

  /**
   * Cập nhật thông tin dịch vụ dựa trên ID và dữ liệu được cung cấp.
   *
   * @param id - ID của dịch vụ cần cập nhật.
   * @param dto - Dữ liệu cập nhật dịch vụ, bao gồm thông tin cơ bản và danh sách ảnh.
   * @returns Một Promise chứa thông tin dịch vụ đã được cập nhật, bao gồm cả danh sách ảnh.
   *
   * ### Quy trình:
   * 1. Cập nhật thông tin cơ bản của dịch vụ (tên, danh mục, mô tả, giá cơ bản, trạng thái, thời gian bảo hành, v.v.).
   * 2. Xử lý danh sách ảnh:
   *    - Xóa các ảnh được chỉ định trong `imagesToDelete`.
   *    - Thêm các ảnh mới từ `newImages`.
   * 3. Lấy lại toàn bộ thông tin dịch vụ, bao gồm danh sách ảnh sau khi cập nhật.
   *
   * ### Lưu ý:
   * - Nếu `imagesToDelete` không có giá trị hoặc rỗng, không thực hiện xóa ảnh.
   * - Nếu `newImages` không có giá trị hoặc rỗng, không thực hiện thêm ảnh.
   *
   * @throws {Error} Nếu xảy ra lỗi trong quá trình cập nhật hoặc xử lý ảnh.
   */
  async update(id: number, dto: UpdateServiceDto): Promise<ServiceResponse> {
    return this.prisma.$transaction(async (prisma) => {
      // 1. Cập nhật thông tin cơ bản
      const updatedService = await prisma.services.update({
        where: { id },
        data: {
          name: dto.name,
          categoryId: dto.categoryId,
          description: dto.description ?? '',
          base_price: dto.base_price,
          is_active: dto.is_active,
          warranty_period: dto.warranty_period,
          warranty_unit: dto.warranty_unit,
          icon_url: dto.icon_url,
        },
        include: { ServiceImages: true },
      });

      // 2. Xử lý ảnh (nếu có)
      if (dto.imagesToDelete?.length) {
        await prisma.serviceImages.deleteMany({
          where: { id: { in: dto.imagesToDelete } },
        });
      }

      if (dto.newImages?.length) {
        await prisma.serviceImages.createMany({
          data: dto.newImages.map((img) => ({
            service_id: id,
            image_url: img.image_url,
          })),
        });
      }

      // 3. Lấy lại toàn bộ ảnh sau khi cập nhật
      const serviceWithImages = await prisma.services.findUnique({
        where: { id },
        include: { ServiceImages: true },
      });

      return {
        id: updatedService.id,
        name: updatedService.name,
        slug: updatedService.slug,
        categoryId: updatedService.categoryId,
        average_rating: updatedService.average_rating,
        review_count: updatedService.review_count,
        description: updatedService.description,
        base_price: updatedService.base_price,
        is_active: updatedService.is_active,
        created_at: updatedService.created_at,
        updated_at: updatedService.updated_at,
        warranty_period: updatedService.warranty_period,
        warranty_unit: updatedService.warranty_unit,
        icon_url: updatedService.icon_url,
        images: serviceWithImages?.ServiceImages ?? null,
      };
    });
  }

  // findAll() {
  //   return `This action returns all services`;
  // }

  // findOne(id: number) {
  //   return `This action returns a #${id} service`;
  // }

  // update(id: number, updateServiceDto: UpdateServiceDto) {
  //   return `This action updates a #${id} service`;
  // }

  /**
   * Xóa một dịch vụ dựa trên ID.
   *
   * @param id - ID của dịch vụ cần xóa.
   * @returns Một đối tượng chứa thông tin thành công của thao tác xóa.
   * @throws {NotFoundException} Nếu dịch vụ không tồn tại.
   * @throws {ConflictException} Nếu dịch vụ có liên kết với chi tiết đơn hàng.
   * @throws {ConflictException} Nếu dịch vụ có liên kết với bảo hành dịch vụ.
   *
   * Chức năng:
   * 1. Kiểm tra sự tồn tại của dịch vụ.
   * 2. Kiểm tra các ràng buộc nghiệp vụ:
   *    - Không thể xóa nếu dịch vụ có liên kết với chi tiết đơn hàng.
   *    - Không thể xóa nếu dịch vụ có liên kết với bảo hành dịch vụ.
   * 3. Xóa tất cả hình ảnh liên quan đến dịch vụ.
   * 4. Xóa dịch vụ khỏi cơ sở dữ liệu.
   */
  async remove(id: number): Promise<{ success: boolean }> {
    return this.prisma.$transaction(async (prisma) => {
      // 1. Kiểm tra tồn tại dịch vụ
      const service = await prisma.services.findUnique({
        where: { id },
        include: {
          serviceOrderDetails: true, // Kiểm tra có đơn hàng liên quan không
          ServiceImages: true, // Lấy danh sách ảnh để xóa
          serviceWarranties: true,
        },
      });

      if (!service) {
        throw new NotFoundException('Service not found');
      }

      // 2. Kiểm tra ràng buộc nghiệp vụ (nếu có)
      if (service.serviceOrderDetails.length > 0) {
        throw new ConflictException('Cannot delete service because it has related order details');
      }

      if (service.serviceWarranties.length > 0) {
        throw new ConflictException('Cannot delete service because it has related service warranty');
      }

      // 3. Xóa tất cả hình ảnh liên quan
      if (service.ServiceImages.length > 0) {
        await prisma.serviceImages.deleteMany({
          where: { service_id: id },
        });
      }

      // 4. Xóa dịch vụ
      await prisma.services.delete({
        where: { id },
      });

      return {
        success: true,
      };
    });
  }

  /**
   * Lấy danh sách tất cả các dịch vụ với phân trang và tìm kiếm.
   *
   * @param dto - Đối tượng chứa thông tin phân trang và tìm kiếm.
   *   - `page`: Số trang hiện tại.
   *   - `perPage`: Số lượng mục trên mỗi trang.
   *   - `where`: Từ khóa tìm kiếm (tùy chọn).
   *   - `orderKey`: Trường cần sắp xếp (tùy chọn).
   *   - `orderValue`: Thứ tự sắp xếp, có thể là 'asc' hoặc 'desc' (tùy chọn).
   *
   * @returns Một Promise trả về kết quả phân trang bao gồm danh sách dịch vụ
   * (loại bỏ trường `description`) và thông tin phân trang.
   *
   * - Kết quả tìm kiếm hỗ trợ:
   *   - Tìm kiếm theo tên có dấu.
   *   - Tìm kiếm theo tên không dấu.
   *   - Tìm kiếm theo slug không dấu.
   *
   * - Các trường được trả về trong kết quả:
   *   - `id`: ID của dịch vụ.
   *   - `name`: Tên của dịch vụ.
   *   - `slug`: Slug của dịch vụ.
   *   - `average_rating`: Đánh giá trung bình của dịch vụ.
   *   - `review_count`: Số lượng đánh giá của dịch vụ.
   *   - `base_price`: Giá cơ bản của dịch vụ.
   */
  async getAllServices(dto: PaginationDto): Promise<PaginatorTypes.PaginatedResult<Omit<ServicesDto, 'description'>>> {
    const { page, perPage, where, orderKey, orderValue } = dto;

    // Kiểm tra nếu có từ khóa tìm kiếm
    let prismaWhere: Prisma.ServicesWhereInput | undefined;

    if (where) {
      const normalizedKeyword = unidecode(where.trim()).replace(/\s+/g, '-'); // Chuẩn hóa không dấu & chuyển khoảng trắng thành '-'

      prismaWhere = {
        OR: [
          {
            name: {
              contains: where, // Tìm kiếm theo tên có dấu
              mode: 'insensitive',
            },
          },
          {
            name: {
              contains: unidecode(where), // Tìm kiếm theo tên không dấu
              mode: 'insensitive',
            },
          },
          {
            slug: {
              contains: normalizedKeyword, // Tìm kiếm theo slug không dấu
              mode: 'insensitive',
            },
          },
        ],
      };
    }

    // Chọn các trường cần lấy (bỏ `description`)
    const selectFields: Prisma.ServicesSelect = {
      id: true,
      name: true,
      slug: true,
      average_rating: true,
      review_count: true,
      base_price: true,
    };

    const paginate = createPaginator(1, 10);

    return paginate(
      this.prisma.services,
      {
        where: prismaWhere,
        orderBy: orderKey ? { [orderKey]: orderValue } : { name: 'asc' },
        select: selectFields,
      },
      {
        page,
        perPage,
      },
    );
  }

  /**
   * Lấy danh sách tất cả các danh mục dịch vụ với phân trang, tìm kiếm và sắp xếp.
   *
   * @param dto - Đối tượng chứa thông tin phân trang, tìm kiếm và sắp xếp.
   *   - `page` (number): Số trang hiện tại (mặc định là 1).
   *   - `perPage` (number): Số lượng mục trên mỗi trang (mặc định là 10).
   *   - `where` (string | undefined): Từ khóa tìm kiếm (nếu có).
   *   - `orderKey` (string | undefined): Trường dùng để sắp xếp (mặc định là 'name').
   *   - `orderValue` (string | undefined): Thứ tự sắp xếp ('asc' hoặc 'desc', mặc định là 'asc').
   *
   * @returns Một Promise trả về kết quả phân trang chứa danh sách các danh mục dịch vụ.
   *   - `PaginatorTypes.PaginatedResult<GetServiceCategoriesDto>`: Kết quả phân trang bao gồm:
   *     - `data`: Danh sách các danh mục dịch vụ.
   *     - `meta`: Thông tin phân trang (số trang, tổng số mục, v.v.).
   *
   * @throws Error nếu có lỗi xảy ra trong quá trình lấy dữ liệu.
   */
  async getAllServiceCategories(dto: PaginationDto): Promise<PaginatorTypes.PaginatedResult<GetServiceCategoriesDto>> {
    try {
      const { page = 1, perPage = 10, where, orderKey, orderValue } = dto;
      const DEFAULT_ORDER_KEY = 'name';
      const VALID_ORDER_KEYS = ['name', 'createdAt']; // Thêm các trường hợp lệ khác nếu cần

      // Xử lý điều kiện tìm kiếm
      let prismaWhere: Prisma.ServiceCategoryWhereInput | undefined;

      if (where?.trim()) {
        const trimmedWhere = where.trim();
        let unidecodedKeyword: string = '';

        try {
          const result = unidecode(trimmedWhere);

          if (typeof result === 'string') {
            unidecodedKeyword = result;
          }
        } catch (error) {
          console.error('Error decoding string:', error);
        }
        const normalizedKeyword = (typeof unidecodedKeyword === 'string' ? unidecodedKeyword : '').replace(/\s+/g, '-');

        prismaWhere = {
          OR: [
            { name: { contains: trimmedWhere, mode: 'insensitive' } },
            { name: { contains: unidecodedKeyword, mode: 'insensitive' } },
            { slug: { contains: normalizedKeyword, mode: 'insensitive' } },
          ],
        };
      }

      // Xử lý sắp xếp
      const safeOrderKey = VALID_ORDER_KEYS.includes(orderKey ?? '') ? orderKey! : DEFAULT_ORDER_KEY;
      const orderBy = { [safeOrderKey]: orderValue ?? 'asc' };

      // Select fields
      const selectFields: Prisma.ServiceCategorySelect = {
        id: true,
        name: true,
        slug: true,
        // Thêm các trường khác nếu cần
      };

      const paginate = createPaginator(page, perPage);

      return await paginate(
        this.prisma.serviceCategory,
        {
          where: prismaWhere,
          orderBy,
          select: selectFields,
        },
        {
          page,
          perPage,
        },
      );
    } catch (error) {
      // Xử lý lỗi phù hợp với ứng dụng của bạn
      console.error('Error fetching service categories:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to get service categories: ${error.message}`);
      }
      throw new Error('Failed to get service categories');
    }
  }

  async findById(id: number): Promise<ServiceResponse | null> {
    const service = await this.prisma.services.findUnique({
      where: { id },
      include: { ServiceImages: true }, // Lấy luôn danh sách hình ảnh
    });

    if (!service) return null;

    return {
      id: service.id,
      name: service.name,
      description: service.description,
      average_rating: service.average_rating,
      review_count: service.review_count,
      base_price: service.base_price,
      images: service.ServiceImages.map((img) => ({
        id: img.id,
        service_id: img.service_id,
        image_url: img.image_url,
      })),
      icon_url: service.icon_url,
      slug: service.slug,
      categoryId: service.categoryId,
      is_active: service.is_active,
      created_at: service.created_at,
      updated_at: service.updated_at,
      warranty_period: service.warranty_period,
      warranty_unit: service.warranty_unit,
    };
  }

  async findBySlug(slug: string): Promise<ServiceResponse | null> {
    const service = await this.prisma.services.findUnique({
      where: { slug },
      include: { ServiceImages: true }, // Lấy luôn danh sách hình ảnh
    });

    if (!service) return null;

    return {
      id: service.id,
      name: service.name,
      description: service.description,
      average_rating: service.average_rating,
      review_count: service.review_count,
      base_price: service.base_price,
      images: service.ServiceImages.map((img) => ({
        id: img.id,
        service_id: img.service_id,
        image_url: img.image_url,
      })),
      icon_url: service.icon_url,
      slug: service.slug,
      categoryId: service.categoryId,
      is_active: service.is_active,
      created_at: service.created_at,
      updated_at: service.updated_at,
      warranty_period: service.warranty_period,
      warranty_unit: service.warranty_unit,
    };
  }
}
