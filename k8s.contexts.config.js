'use strict';

const { join } = require('path');

const templates = join(__dirname, 'k8s', 'templates');

module.exports = {
    develop: {
        globals: {},
        deploy: {
            /**
             * Env vars schema validation
             */
            env: {
                type: 'object',
                required: [
                    'K8S_NAMESPACE',
                    'K8S_REGISTRY_TOKEN',
                ],
                properties: {
                    K8S_NAMESPACE: {
                        type: 'string',
                        minLenght: 1,
                    },
                    K8S_REGISTRY_TOKEN: {
                        type: 'string',
                        minLenght: 1,
                    },
                },
            },
            /**
             * Metadata to apply to all the resources
             */
            metadata: {
                name: 'app',
                labels: {
                    app: 'app',
                },
            },
            namespace: 'app-develop',
            container: {
                name: 'app',
                image: 'registry/app',
            },
            files: [`${templates}/*.{yml,yaml}`],
        },
        update: {
            env: {
                required: ['CI_COMMIT_TAG'],
                CI_COMMIT_TAG: {
                    type: 'string',
                    minLenght: 1,
                },
            },
        },
    },
};
