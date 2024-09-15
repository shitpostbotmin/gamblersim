import path from "path"
import Rand from "rand-seed"
import fs from 'fs/promises'
import { z } from "zod"
import * as cheerio from 'cheerio';

export default function useWikigame(seed: string) {
  const getGame = async () => {
    const rand = new Rand(seed)
    const articles = z.array(z.string()).parse(
      JSON.parse(
        await fs.readFile(path.join(__dirname, './articles.json'), { encoding: 'utf8' })
      )
    )

    const randomArticle = () => articles[Math.floor(rand.next() * articles.length)]
    const articleA = randomArticle()
    let articleB = randomArticle()

    while (articleA === articleB) {
      articleB = randomArticle()
    }

    return [
      articleA,
      articleB,
    ] as const
  }

  const verifyGame = async (proposed: string[]) => {
    const [start, finish] = await getGame()

    if (proposed[0] !== start) {
      throw new Error('Must start at ' + start)
    }

    if (proposed[proposed.length - 1] !== finish) {
      throw new Error('Must finish at ' + finish)
    }

    for (let i = 0; i < proposed.length - 1; i++) {
      const current = proposed[i]
      const next = proposed[i + 1]
      const $ = await cheerio.fromURL(current)
      const currentUrl = new URL(current)
      let found = false
      for (let e of $('#mw-content-text a[href^="/wiki/"]')) {
        const thisUrl = currentUrl.origin + e.attribs['href']
        if (next === thisUrl) {
          found = true
          break
        }
      }

      if (!found) {
        throw new Error(`Could not find link ${next} on page ${current}`)
      }
    }
  }

  return {
    getGame,
    verifyGame,
  }
}