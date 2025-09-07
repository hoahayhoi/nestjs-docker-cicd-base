import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginatorTypes } from '@nodeteam/nestjs-prisma-pagination';
import { Prisma, SparePart, SparePartCategory } from '@prisma/client';
import unidecode from 'unidecode';

import { CreateSparePartDto } from './dto/create-spare-part.dto';
import { UpdateSparePartDto } from './dto/update-spare-part.dto';

import { createPaginator, PaginationDto } from '@/common/pagination/paginationDto';
import { DatabaseService } from '@/database/database.service';

@Injectable()
export class SparePartsService {
  constructor(private prisma: DatabaseService) {}

  async getAllCategories(dto: PaginationDto): Promise<PaginatorTypes.PaginatedResult<Partial<SparePartCategory>>> {
    try {
      const { page = 1, perPage = 10, where, orderKey, orderValue } = dto;
      const DEFAULT_ORDER_KEY = 'name';
      const VALID_ORDER_KEYS = ['name', 'createdAt']; // Thêm các trường hợp lệ khác nếu cần

      // Xử lý điều kiện tìm kiếm
      let prismaWhere: Prisma.SparePartCategoryWhereInput | undefined;

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
        // const normalizedKeyword = (typeof unidecodedKeyword === 'string' ? unidecodedKeyword : '').replace(/\s+/g, '-');

        prismaWhere = {
          OR: [
            { name: { contains: trimmedWhere, mode: 'insensitive' } },
            { name: { contains: unidecodedKeyword, mode: 'insensitive' } },
            // { slug: { contains: normalizedKeyword, mode: 'insensitive' } },
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
        // slug: true,
        // Thêm các trường khác nếu cần
      };

      const paginate = createPaginator(page, perPage);

      return await paginate(
        this.prisma.sparePartCategory,
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
      console.error('Error fetching Spare Part categories:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to get Spare Part categories: ${error.message}`);
      }
      throw new Error('Failed to get Spare Part categories');
    }
  }

  async findById(id: number): Promise<Partial<SparePart> | null> {
    const result = await this.prisma.sparePart.findUnique({
      where: { id },
    });

    if (!result) {
      return null;
    }

    return result;
  }

  async getByCategoryId(id: number): Promise<Partial<SparePart>[]> {
    const result = await this.prisma.sparePart.findMany({
      where: { categoryId: id },
    });

    if (result.length === 0) {
      throw new NotFoundException('No spare parts found for this category!');
    }

    return result;
  }

  create(createSparePartDto: CreateSparePartDto) {
    return 'This action adds a new sparePart';
  }

  findAll() {
    return `This action returns all spareParts`;
  }

  findOne(id: number) {
    return `This action returns a #${id} sparePart`;
  }

  update(id: number, updateSparePartDto: UpdateSparePartDto) {
    return `This action updates a #${id} sparePart`;
  }

  remove(id: number) {
    return `This action removes a #${id} sparePart`;
  }
}
