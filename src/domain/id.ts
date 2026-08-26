// 依存を増やさないための簡易ユニークID生成(衝突確率は実用上問題ないレベル)
export function generateId(): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${Date.now().toString(36)}-${random}`;
}
