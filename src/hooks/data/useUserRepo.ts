import { User, World } from '@prisma/client'
import usePrisma from './usePrisma';
import useWorldRepo from './useWorldRepo';

export default function useUserRepo() {
  const prisma  = usePrisma()

  const createUserIfNotExists = async (discordGuildId: string, discordUserId: string, isBank: boolean = false) => {
    const world = await useWorldRepo().createWorldIfNotExists(discordGuildId)

    const existing = await prisma.user.findFirst({ where: { discordUserId, worldId: world.id } })

    if (!existing) {
      return await prisma.user.create({ data: { discordUserId, worldId: world.id, isBank } })
    }

    return existing;
  }

  const createBank = async (discordGuildId: string) => {
    return await createUserIfNotExists(discordGuildId, discordGuildId, true)
  }

  const getBalance = async (user: User) => {
    const [
      income,
      expenses,
    ] = (await Promise.all([
      prisma.transaction.aggregate({
        _sum: {
          money: true,
        },
        where: {
          receiverId: {
            equals: user.id,
          }
        }
      }),
      prisma.transaction.aggregate({
        _sum: {
          money: true,
        },
        where: {
          senderId: {
            equals: user.id,
          }
        }
      }),
    ])).map((query) => query._sum.money)

    return (income ?? 0) - (expenses ?? 0)
  }

  const getBankUser = async (world: World) => {
    const prisma = usePrisma()
    return await prisma.user.findFirstOrThrow({ where: { isBank: true, worldId: world.id } })
  }

  return {
    createUserIfNotExists,
    createBank,
    getBalance,
    getBankUser,
  };
}
