export function chatRoomPair(a: string, b: string): { userAId: string; userBId: string } {
  return a < b
    ? { userAId: a, userBId: b }
    : { userAId: b, userBId: a };
}
