import { User } from "@prisma/client";
import { Item } from "./useItemRepo";
import usePrisma from "./usePrisma";
import useUserRepo from "./useUserRepo";

export default function useTransactionRepo() {
  const createTransaction = (
    description: string,
    sender: User,
    receiver: User,
    item: Item|null,
    money: number,
  ) => {
    if (money % 1 !== 0 || money < 0) {
      throw new Error('Money must be positive round number')
    }

    const prisma = usePrisma();

    return prisma.transaction.create({
      data: {
        description,
        senderId: sender.id,
        receiverId: receiver.id,
        itemId: item?.id ?? null,
        money,
      }
    })
  }

  const sendToBank = async (
    description: string,
    sender: User,
    item: Item|null,
    money: number,
  ) => {
    const userRepo = useUserRepo()
    const prisma = usePrisma()
    const world = await prisma.world.findFirstOrThrow({ where: { id: sender.worldId }})
    const bank = await userRepo.getBankUser(world)
    return await createTransaction(
      description,
      sender,
      bank,
      item,
      money,
    )
  }

  const receiveFromBank = async (
    description: string,
    receiver: User,
    item: Item|null,
    money: number,
  ) => {
    const userRepo = useUserRepo()
    const prisma = usePrisma()

    const world = await prisma.world.findFirstOrThrow({ where: { id: receiver.worldId }})
    const bank = await userRepo.getBankUser(world)

    return await createTransaction(
      description,
      bank,
      receiver,
      item,
      money,
    )
  }

  return {
    createTransaction,
    sendToBank,
    receiveFromBank,
  };
}
