export async function until<T>(callback: () => Promise<T>): Promise<[null, T] | [unknown, null]> {
  try {
    const result = await callback()
    return [null, result]
  } catch (error) {
    return [error, null]
  }
}

export default {
  until,
}
