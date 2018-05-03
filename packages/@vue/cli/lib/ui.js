const { log, error, openBrowser } = require('@vue/cli-shared-utils')
const portfinder = require('portfinder')
const execa = require('execa')

async function ui (options = {}, context = process.cwd()) {
  let port = options.port
  if (!port) {
    port = await portfinder.getPortPromise()
  }

  const configOk = process.env.VUE_UI_CONFIGURED === 'OK'
  if (!configOk) {
    process.env.VUE_UI_CONFIGURED = 'OK'
    // Config
    process.env.VUE_APP_GRAPHQL_PORT = port
    process.env.VUE_APP_GRAPHQL_ENDPOINT = ''
    process.env.VUE_APP_GRAPHQL_PLAYGROUND_PATH = '/graphql-playground'
  }

  if (!options.dev && !configOk) {
    // Re-run in production mode
    const command = require.resolve('@vue/cli/bin/vue')
    execa('cross-env', [
      'NODE_ENV=production',
      'node',
      command,
      'ui'
    ], {
      cwd: context,
      stdio: ['inherit', 'inherit', 'inherit']
    })
  } else {
    log(`🚀  Starting GUI...`)
    let server = require('vue-cli-plugin-apollo/graphql-server')
    server = server.default || server

    const opts = {
      mock: false,
      apolloEngine: false,
      timeout: 999999999,
      quiet: true,
      paths: {
        typeDefs: require.resolve('@vue/cli-ui/src/graphql-api/type-defs.js'),
        resolvers: require.resolve('@vue/cli-ui/src/graphql-api/resolvers.js'),
        context: require.resolve('@vue/cli-ui/src/graphql-api/context.js'),
        pubsub: require.resolve('@vue/cli-ui/src/graphql-api/pubsub.js'),
        server: require.resolve('@vue/cli-ui/src/graphql-api/server.js')
      }
    }

    server(opts, () => {
      const url = `http://localhost:${process.env.VUE_APP_GRAPHQL_PORT}`
      console.log(`🌠  Ready on ${url}`)
      openBrowser(url)
    })
  }
}

module.exports = (...args) => {
  return ui(...args).catch(err => {
    error(err)
    if (!process.env.VUE_CLI_TEST) {
      process.exit(1)
    }
  })
}