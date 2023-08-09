export default function (delay: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delay));
}
