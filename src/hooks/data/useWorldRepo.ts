import { PrismaClient } from '@prisma/client'
import usePrisma from './usePrisma';
import useUserRepo from './useUserRepo';

const prisma = new PrismaClient()

export default function useWorldRepo() {
  const prisma  = usePrisma()

  return {
    async createWorldIfNotExists(discordGuildId: string) {
      const userRepo = useUserRepo()
      const existing = await prisma.world.findFirst({ where: { discordGuildId } })

      if (!existing) {
        const world = await prisma.world.create({ data: { discordGuildId }})

        await userRepo.createBank(discordGuildId)

        return world
      }

      return existing
    },
  };
}
