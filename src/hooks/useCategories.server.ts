import { categoryService, type Category } from '@/services/category.service';
import { ApiErrorHandler, type ApiError } from '@/lib/error-handler';

export interface CategoriesResult {
  categories: Category[];
  error: ApiError | null;
}

export async function getCategories(): Promise<CategoriesResult> {
  try {
    const result = await categoryService.getActiveCategories();

    if (result.error) {
      return {
        categories: [],
        error: ApiErrorHandler.classifyError(result.error),
      };
    }

    return {
      categories: result.data ?? [],
      error: null,
    };
  } catch (error) {
    return {
      categories: [],
      error: ApiErrorHandler.classifyError(error),
    };
  }
}
