import z from 'zod';

const EnvSchema = z.object({
  DISCORD_TOKEN: z.string(),
})

type Env = z.infer<typeof EnvSchema>

export default function useEnv(): Env {
  return EnvSchema.parse(process.env)
}