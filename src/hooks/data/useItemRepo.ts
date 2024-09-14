import { Prisma } from "@prisma/client";

export type Item = Prisma.Payload<Prisma.ItemDelegate>['scalars']

export default function useItemRepo() {
  return {
  };
}
