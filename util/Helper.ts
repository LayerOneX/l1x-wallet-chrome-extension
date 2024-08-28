function deepEqual(obj1: any, obj2: any) {
  if (obj1 === obj2) {
    return true;
  }

  if (
    obj1 == null ||
    obj2 == null ||
    typeof obj1 !== "object" ||
    typeof obj2 !== "object"
  ) {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (let key of keys1) {
    if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
      return false;
    }
  }

  return true;
}

export function getDifferentFields<T>(arr1: T[], arr2: T[]) {
  return arr1.filter((obj1) => !arr2.some((obj2) => deepEqual(obj1, obj2)));
}

export async function serviceGetL1xBadges(_l1xWalletAddress: string) {
  return (
    await fetch(
      "https://v2-api.l1xapp.com/api/v2/ops-panel/l1x_badges?auth_code=uxkheetiirkmvcu&l1x_wallet_address=" +
        _l1xWalletAddress
    )
  ).json();
}

export function toFixedIfNeeded(num: any, threshold = 5) {
  const numStr = num.toString();
  const decimalIndex = numStr.indexOf('.');

  if (decimalIndex === -1) {
    return num;
  }

  const decimalPlaces = numStr.length - decimalIndex - 1;

  if (decimalPlaces > threshold) {
    return num.toFixed(threshold);
  }

  return num;
}

export function generateRandomString(length: number) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}