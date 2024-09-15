import useWikigame from "./hooks/data/work/wikigame/useWikigame";

async function main() {
  const wikigame = useWikigame('foobarbaz' + process.argv[2])

  const game = await wikigame.getGame()

  try {
    await wikigame.verifyGame([
      'https://en.wikipedia.org/wiki/Billie_Eilish',
      'https://en.wikipedia.org/wiki/California',
      'https://en.wikipedia.org/wiki/U.S._state',
      'https://en.wikipedia.org/wiki/New_York_(state)',
      'https://en.wikipedia.org/wiki/Columbia_University',
      'https://en.wikipedia.org/wiki/Pulitzer_Prize',
      'https://en.wikipedia.org/wiki/Category:Pulitzer_Prize_winners',
      'https://en.wikipedia.org/wiki/Category:Pulitzer_Prize_for_General_Non-Fiction_winners',
      'https://en.wikipedia.org/wiki/Guns,_Germs,_and_Steel',
    ])
  } catch (e) {
    console.log('Failed: ', `${e}`)
    return
  }
  console.log('Verified')
}

main()