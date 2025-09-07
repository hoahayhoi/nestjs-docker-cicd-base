import bcrypt from 'bcrypt';

const saltRounds = 10;

export async function hashPasswordHelper(plainPassword: string): Promise<string | undefined> {
  try {
    return await bcrypt.hash(plainPassword, saltRounds);
  } catch (error) {
    console.error('Error hashing password:', error);

    return undefined;
  }
}

export async function comparePasswordHelper(plainPassword: string, hashPassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plainPassword, hashPassword);
  } catch (error) {
    console.error('Error comparing passwords:', error);

    return false;
  }
}

export const generateRandomNumber = (length: number): string => {
  const characters = '0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return result;
};

export function generateSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD') // loại dấu tiếng Việt
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-') // thay khoảng trắng & ký tự đặc biệt
    .replace(/^-+|-+$/g, ''); // loại dấu "-" đầu/cuối
}
