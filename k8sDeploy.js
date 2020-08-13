'use strict';

const { readFile } = require('fs');
const { promisify } = require('util');
const k8s = require('@kubernetes/client-node');
const envSchema = require('env-schema');
const Handlebars = require('handlebars');
const glob = require('glob');

const readf = promisify(readFile);
const find = promisify(glob);

let config;

try {
    config = require('./k8s.contexts.config');
} catch (error) {
    console.error(
        'Please specify a "k8s.contexts.config.js" file in the project root.'
    );
}

// const kc = new k8s.KubeConfig();

// kc.loadFromDefault();

// const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

async function applyResource(k8sApi, resource, patch = false) {
    try {
        let method;
        const namespace = resource.namespace || 'default';
        switch (resource.kind) {
            case 'Namespace':
                method = patch ? 'patchNamespace' : 'createNamespace';
                break;
            // case 'Secret':
            //     method = patch ?
        }
    } catch (error) {
        console.error(error);
    }
}

async function apply(resourcesRawList) {
    let resources = [];
    // console.log(k8s.loadAllYaml(resources))
    for (const resourceRaw of resourcesRawList) {
        resources = resources.concat(k8s.loadAllYaml(resourceRaw));
    }

    const namespaces = [];
    const secrets = [];
    for (const [index, resource] of resources.entries()) {
        switch (resource.kind) {
            case 'Namespace':
                namespaces.push(resource);
                resources.splice(index, 1);
                break;
            case 'Secret':
                secrets.push(resource);
                resources.splice(index, 1);
                break;
        }
    }
    console.log(namespaces);
    console.log(secrets);
    console.log(resources);
    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();
    const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
    k8sApi.create;
    const nsBatch = namespaces.map(namespace =>
        applyResource(k8sApi, namespace)
    );
    await Promise.all(nsBatch);
}

async function getTemplatesContents(espressions = []) {
    const globs = espressions.map(expression => find(expression));
    const paths = await Promise.all(globs);
    const contents = [];
    for (const list of paths) {
        for (const file of list) {
            contents.push(readf(file, 'utf8'));
        }
    }
    return Promise.all(contents);
}

async function getResources(context = {}) {
    const { files = [], env, ...data } = context.deploy;
    const schema = env || {};
    const ENV = envSchema({
        schema,
    });

    const templates = [];
    const resources = [];
    const templateData = {
        env: ENV,
        ...data,
    };
    const templatesContents = await getTemplatesContents(files);

    for (const template of templatesContents) {
        templates.push(Handlebars.compile(template));
    }
    for (const template of templates) {
        resources.push(template(templateData));
    }
    return resources;
}

async function run() {
    const resources = await getResources(config.develop);
    const result = await apply(resources);
    return result;
}

run()
    .then(result => {
        console.log(result);
    })
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
