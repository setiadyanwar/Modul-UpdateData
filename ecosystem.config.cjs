module.exports = {
    apps: [
        {
            name: 'update-data',
            exec_mode: 'fork',
            script: './.output/server/index.mjs',
            env: {
                "HOST": "0.0.0.0",
                "PORT": 3001,
                "NODE_ENV": "production",

                // Remote app configuration
                "NUXT_PUBLIC_APP_NAME": "Update Data",
                "NUXT_PUBLIC_APP_VERSION": "1.0.0",

                // Host app origin (ESS Portal)
                // Local portal for testing
                "HOST_ORIGIN": "http://localhost:3000",
                // Production portal
                "HOST_ORIGIN_PROD": "https://people-dev.telkomsigma.co.id",

                // Production URLs
                // PRODUCTION_URL: URL where this remote app is deployed (standalone)
                // REMOTE_PATH: Path where remote app is exposed in host app
                "PRODUCTION_URL": "https://people-dev.telkomsigma.co.id",
                "REMOTE_PATH": "/update-data",

                // Local testing (keep localhost:3001 available for dev)
                "REMOTE_PORT": "3001",
            },
        }
    ]
}
