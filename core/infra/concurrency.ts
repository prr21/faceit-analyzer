export async function batchWithLimit<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number = 10,
  onProgress?: (done: number, total: number) => void,
): Promise<T[]> {
  const results: T[] = new Array(tasks.length)
  let nextIndex = 0
  let doneCount = 0

  async function worker() {
    while (nextIndex < tasks.length) {
      const index = nextIndex++
      results[index] = await tasks[index]()
      doneCount++
      onProgress?.(doneCount, tasks.length)
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker()),
  )
  return results
}
