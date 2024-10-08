import usePrisma from './hooks/data/usePrisma'
import { Client, GatewayIntentBits } from 'discord.js'
import useUserRepo from './hooks/data/useUserRepo'
import useTransactionRepo from './hooks/data/useTransactionRepo'
import useEnv from './hooks/config/useEnv'
import useWikigame from './hooks/data/work/wikigame/useWikigame'
import _ from 'lodash'

async function main() {
  const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages] });

  client.on('ready', () => {
    console.log(`Logged in as ${client.user?.tag ?? 'unknown'}! (${client.user?.id ?? 'unknown id'})`);
  })

  client.on('messageCreate', async (message) => {
    const userRepo = useUserRepo()
    const transactionRepo = useTransactionRepo()

    if (!message.content.startsWith('$')) {
      return
    }

    const command = message.content.substring(1).trim()

    const userId = message.author.id
    const guildId = message.guild?.id

    if (!guildId) {
      return
    }

    const seed = userId + guildId + new Date().toDateString()

    const user = await userRepo.createUserIfNotExists(guildId, userId)

    if (command.toLowerCase() === 'balance') {
      const balance = await userRepo.getBalance(user)
      await message.reply(`You have $${balance}`)
    }

    if (command.toLowerCase().startsWith('work wikigame')) {
      const wikigame = useWikigame(seed)
      if (command === 'work wikigame') {
        const [start, finish] = await wikigame.getGame()
        await message.reply(`Form a link between ${start} and ${finish}.`)
      } else {
        const links = command.trim().split(' ').slice(2).filter(Boolean)
        try {
          await wikigame.verifyGame(links)
        } catch (e) {
          await message.reply(`Failed: ${e}`)
          return
        }
        const payout = 100
        await transactionRepo.receiveFromBank("wikigame payout", user, null, payout)
        const balance = await userRepo.getBalance(user)
        await message.reply(`Success! You've been paid $${payout}. New balance: $${balance}`)
      }
    }

    if (command.toLowerCase() === 'gamble') {
      const balance = await userRepo.getBalance(user)

      if (balance < 250) {
        await message.reply("You need at least $250 to gamble")
      }

      if (Math.random() > 0.999) {
        await transactionRepo.receiveFromBank("Gamble - big win", user, null, 250000)
        const balance = await userRepo.getBalance(user)
        await message.reply(`You win the big one! take $250,000. You now have $${balance}`)
      } else if (Math.random() > 0.5) {
        await transactionRepo.receiveFromBank("Gamble - win", user, null, 250)
        const balance = await userRepo.getBalance(user)
        await message.reply(`You win! take $250. You now have $${balance}`)
      } else {
        await transactionRepo.sendToBank("Gamble - loss", user, null, 250)
        const balance = await userRepo.getBalance(user)
        await message.reply(`You lose. I'm taking $250 from you. You now have $${balance}`)
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

      await transactionRepo.sendToBank("Bought a word", user, null, 10)

      await transactionRepo.receiveFromBank("Bought a word", user, item, 0)

      balance = await userRepo.getBalance(user)

      await message.reply(`You just bought a copy of the word "${word}"`)
    }

    if (command.toLowerCase() === 'buy10words') {
      const prisma = usePrisma()

      let balance = await userRepo.getBalance(user)

      if (balance < 100) {
        await message.reply("You need at least $100 to buy 10 words")
      }

      const words: string[] = [];
      for (let i = 0; i < 10; i++) {
        const word = new Array(4).fill(0).map(() => _.sample('abcdefghijklmnopqrstuvwxyz'.split(''))).join('')

        words.push(word)

        const item = await prisma.item.create({
          data: {
            name: `"${word}"`,
            description: `Your very own "${word}"`,
            collection: "4-Letter Words",
            worldId: user.worldId,
          },
        })

        await transactionRepo.receiveFromBank("Created an item", user, item, 0)

        balance = await userRepo.getBalance(user)
      }

      await transactionRepo.sendToBank("Bought 10 items", user, null, 10)

      await message.reply(`You just bought the words:\n${words.map(w => `- ${w}`).join('\n')}`)
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