import usePrisma from './hooks/data/usePrisma'
import { Client, GatewayIntentBits } from 'discord.js'
import useUserRepo from './hooks/data/useUserRepo'
import useTransactionRepo from './hooks/data/useTransactionRepo'
import _ from 'lodash'
import useEnv from './hooks/config/useEnv'

async function main() {
  const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages] });

  client.on('ready', () => {
    console.log(`Logged in as ${client.user?.tag ?? 'unknown'}! (${client.user?.id ?? 'unknown id'})`);
  })

  client.on('messageCreate', async (message) => {
    console.log('message seen')
    const userRepo = useUserRepo()
    const transactionRepo = useTransactionRepo()

    if (!message.content.startsWith('$')) {
      return
    }
    console.log('correct prefix')

    const command = message.content.substring(1).trim()

    const userId = message.author.id
    const guildId = message.guild?.id

    if (!guildId) {
      return
    }
    console.log('guild spotted')

    const user = await userRepo.createUserIfNotExists(guildId, userId)

    if (command.toLowerCase() === 'balance') {
      const balance = await userRepo.getBalance(user)
      await message.reply(`You have $${balance.toFixed(2)}`)
    }

    if (['canihavemoney', 'work'].includes(command.toLowerCase())) {
      await transactionRepo.receiveFromBank("Work/Demand of money", user, null, 5000)
      const balance = await userRepo.getBalance(user)
      await message.reply(`I have given you $5000 for no reason. You now have $${balance.toFixed(2)}`)
    }

    if (command.toLowerCase() === 'gamble') {
      const balance = await userRepo.getBalance(user)

      if (balance < 250) {
        await message.reply("You need at least $250 to gamble")
      }

      if (Math.random() > 0.5) {
        await transactionRepo.receiveFromBank("Work", user, null, 250)
        const balance = await userRepo.getBalance(user)
        await message.reply(`You win! take $250. You now have $${balance.toFixed(2)}`)
      } else {
        await transactionRepo.sendToBank("Work", user, null, 250)
        const balance = await userRepo.getBalance(user)
        await message.reply(`You lose. I'm taking $250 from you. You now have $${balance.toFixed(2)}`)
      }
    }

    if (command.toLowerCase() === 'buyaword') {
      const prisma = usePrisma()

      let balance = await userRepo.getBalance(user)

      if (balance < 10) {
        await message.reply("You need at least $10 to buy a word")
      }

      const word = new Array(4).fill(0).map(() => _.sample('abcdefghijklmnopqrstuvwxyz'.split(''))).join('')

      const item = await prisma.item.create({
        data: {
          name: `"${word}"`,
          description: `Your very own "${word}"`,
          collection: "4-Letter Words",
          worldId: user.worldId,
        },
      })

      await transactionRepo.sendToBank("Work", user, null, 10)

      await transactionRepo.receiveFromBank("Work", user, item, 0)

      balance = await userRepo.getBalance(user)

      await message.reply(`You just bought a copy of the word "${word}"`)
    }
  })

  const env = useEnv()
  client.login(env.DISCORD_TOKEN)
}

main()
  .then(async () => {
    await usePrisma().$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await usePrisma().$disconnect()
    process.exit(1)
  })