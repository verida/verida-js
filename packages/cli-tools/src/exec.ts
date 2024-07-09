import { runCli } from 'command-line-interface'
import { SendInboxMessage } from './commands/send-inbox-message'
import { GetDIDDocument } from './commands/get-did-document'
import { GetAccountInfo } from './commands/get-account-info'
import { CreateAccount } from './commands/create-account'
import { GetProfile } from './commands/get-profile'

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
          GetDIDDocument,
          SendInboxMessage,
          GetAccountInfo,
          CreateAccount,
          GetProfile
        },
        handlers: {
          // @ts-ignore
          commandUnknown ({ unknownCommandName, recommendedCommandName, ancestors }) {
            console.log('!!')
            console.log(unknownCommandName, recommendedCommandName, ancestors)
          },
        }
      }

      await runCli({ rootCommand: RootCommand, argv: process.argv });
    } catch (ex: unknown) {
      // eslint-disable-next-line no-console
      console.error({ ex });
    }
  })()