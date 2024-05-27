import { runCli } from 'command-line-interface'
//import { SendInboxMessage } from './commands/send-inbox-message'
import { GetDIDDocument } from './commands/get-did-document'

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
(async (): Promise<void> => {
    try {

      const RootCommand = {
        name: 'cli',
        description: 'Verida Command Line Interface',
        optionDefinitions: [],
        // @ts-ignore
        handle ({ getUsage, ancestors }) {
            console.log(getUsage(
                { commandPath: [ ...ancestors ] }
            ));
        },
        subcommands: {
          //SendInboxMessage,
          GetDIDDocument
        }
      }

      await runCli({ rootCommand: RootCommand, argv: process.argv });
    } catch (ex: unknown) {
      // eslint-disable-next-line no-console
      console.error({ ex });
    }
  })()